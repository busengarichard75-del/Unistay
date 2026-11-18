
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, getAuthAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_FEE_AMOUNT = 100;
const ONTECH_COLLECT_URL =
  "https://payments.ontech.co.zm/api/v1/pay/collect";

function normalizeZambianPhone(value: string): string | null {
  const cleaned = value.replace(/[\s\-()]/g, "");
  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (/^09\d{8}$/.test(digits)) {
    return `260${digits.slice(1)}`;
  }

  if (/^2609\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the student.
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded;

    try {
      const idToken = authHeader.slice(7);
      decoded = await getAuthAdmin().verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // 2. Validate the request body.
    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.bookingId !== "string" ||
      typeof body.phoneNumber !== "string"
    ) {
      return NextResponse.json(
        { error: "A valid booking ID and phone number are required" },
        { status: 400 }
      );
    }

    const bookingId = body.bookingId.trim();
    const phoneNumber = normalizeZambianPhone(body.phoneNumber);

    if (!bookingId || bookingId.includes("/")) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Enter a valid Zambian mobile-money number" },
        { status: 400 }
      );
    }

    // 3. Check gateway configuration.
    const apiKey = process.env.ONTECH_API_KEY;

    if (!apiKey) {
      console.error("ONTECH_API_KEY is not configured");

      return NextResponse.json(
        { error: "Payment service is temporarily unavailable" },
        { status: 503 }
      );
    }

    const db = getFirestoreDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const newPaymentRef = db.collection("payments").doc();

    // 4. Verify booking ownership and allocate a payment attempt.
    const allocation = await db.runTransaction(async (transaction) => {
      const bookingSnap = await transaction.get(bookingRef);

      if (!bookingSnap.exists) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      const booking = bookingSnap.data()!;

      if (booking.studentId !== decoded.uid) {
        throw new Error("BOOKING_NOT_OWNED");
      }

      if (booking.status !== "approved") {
        throw new Error("BOOKING_NOT_APPROVED");
      }

      if (
        typeof booking.approvalExpiresAt === "number" &&
        Date.now() > booking.approvalExpiresAt
      ) {
        throw new Error("BOOKING_EXPIRED");
      }

      // Reuse an existing pending attempt to avoid duplicate collections.
      const existingPaymentId = booking.agentFeePaymentId;

      if (
        typeof existingPaymentId === "string" &&
        existingPaymentId.length > 0 &&
        !existingPaymentId.includes("/")
      ) {
        const existingPaymentRef = db
          .collection("payments")
          .doc(existingPaymentId);

        const existingPaymentSnap =
          await transaction.get(existingPaymentRef);

        if (existingPaymentSnap.exists) {
          const existingPayment = existingPaymentSnap.data()!;

          const belongsToThisBooking =
            existingPayment.userId === decoded.uid &&
            existingPayment.linkedBookingId === bookingId &&
            existingPayment.type === "agent_fee";

          if (belongsToThisBooking) {
            if (existingPayment.status === "successful") {
              return { alreadyPaid: true as const };
            }

            if (
              existingPayment.status === "pending" ||
              existingPayment.status === "processing"
            ) {
              return {
                alreadyPaid: false as const,
                paymentRef: existingPaymentRef,
                idempotencyKey:
                  existingPayment.idempotencyKey ||
                  `peza-${existingPaymentRef.id}`,
              };
            }
          }
        }
      }

      // Create a new attempt if no active attempt exists.
      const idempotencyKey = `peza-${newPaymentRef.id}`;

      transaction.create(newPaymentRef, {
        userId: decoded.uid,
        type: "agent_fee",
        linkedBookingId: bookingId,
        amount: AGENT_FEE_AMOUNT,
        currency: "ZMW",
        gatewayName: "ontech",
        status: "pending",
        idempotencyKey,
        customerPhone: phoneNumber,
        createdAt: Date.now(),
      });

      transaction.update(bookingRef, {
        agentFeePaymentId: newPaymentRef.id,
      });

      return {
        alreadyPaid: false as const,
        paymentRef: newPaymentRef,
        idempotencyKey,
      };
    });

    if (allocation.alreadyPaid) {
      return NextResponse.json(
        { error: "This booking's agent fee has already been paid" },
        { status: 409 }
      );
    }

    // 5. Initiate collection through Ontech.
    const paymentRef = allocation.paymentRef;

    const ontechResponse = await fetch(ONTECH_COLLECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Idempotency-Key": allocation.idempotencyKey,
      },
      body: JSON.stringify({
        amount: AGENT_FEE_AMOUNT,
        phone: phoneNumber,
        reference: paymentRef.id,
        description: "Peza Agent Fee",
      }),
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });

    const responseText = await ontechResponse.text();

    let ontechData: Record<string, unknown>;

    try {
      ontechData = JSON.parse(responseText);
    } catch {
      console.error("Ontech returned an unreadable response");

      return NextResponse.json(
        {
          error: "We could not read the payment gateway response. Check payment status before retrying.",
          paymentId: paymentRef.id,
        },
        { status: 502 }
      );
    }

    if (!ontechResponse.ok) {
      console.error("Ontech collection request failed", {
        httpStatus: ontechResponse.status,
        paymentId: paymentRef.id,
      });

      // Keep the attempt pending because a gateway error does not
      // necessarily prove that no collection request was created.
      return NextResponse.json(
        {
          error: "The payment gateway could not confirm the request. Please check payment status.",
          paymentId: paymentRef.id,
        },
        { status: 502 }
      );
    }

    const transactionId = ontechData.transaction_id;

    if (
      typeof transactionId !== "string" ||
      transactionId.trim().length === 0
    ) {
      console.error("Ontech response did not contain a transaction ID", {
        paymentId: paymentRef.id,
      });

      return NextResponse.json(
        {
          error: "The gateway response was incomplete. Please check payment status.",
          paymentId: paymentRef.id,
        },
        { status: 502 }
      );
    }

    const gatewayStatus =
      typeof ontechData.status === "string"
        ? ontechData.status.toLowerCase()
        : "pending";

    await paymentRef.update({
      gatewayTransactionId: transactionId,
      gatewayStatus,
      gatewayResponseReceivedAt: Date.now(),
      status: gatewayStatus === "failed" ? "failed" : "pending",
    });

    // The webhook, not this response, confirms the booking.
    return NextResponse.json({
      success: true,
      paymentId: paymentRef.id,
      status: gatewayStatus,
      message:
        gatewayStatus === "failed"
          ? "The payment request failed. You can try again."
          : "Payment request sent. Check your phone and approve the payment.",
    });
  } catch (error) {
    const knownErrors: Record<string, { message: string; status: number }> = {
      BOOKING_NOT_FOUND: {
        message: "Booking not found",
        status: 404,
      },
      BOOKING_NOT_OWNED: {
        message: "You cannot pay for another student's booking",
        status: 403,
      },
      BOOKING_NOT_APPROVED: {
        message: "This booking has not been approved for payment",
        status: 400,
      },
      BOOKING_EXPIRED: {
        message: "This booking has expired",
        status: 400,
      },
    };

    const errorCode =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (knownErrors[errorCode]) {
      return NextResponse.json(
        { error: knownErrors[errorCode].message },
        { status: knownErrors[errorCode].status }
      );
    }

    console.error("Ontech payment initialization error:", error);

    return NextResponse.json(
      { error: "Unable to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
