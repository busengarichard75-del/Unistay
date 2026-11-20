
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, getAuthAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONTECH_STATUS_URL =
  "https://payments.ontech.co.zm/api/v1/pay/status/";

const AGENT_FEE_AMOUNT = 100;

export async function GET(req: NextRequest) {
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
      decoded = await getAuthAdmin().verifyIdToken(
        authHeader.slice(7)
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // 2. Validate the payment ID.
    const paymentId = req.nextUrl.searchParams.get("paymentId");

    if (
      !paymentId ||
      !paymentId.trim() ||
      paymentId.includes("/")
    ) {
      return NextResponse.json(
        { error: "A valid payment ID is required" },
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
    const paymentRef = db.collection("payments").doc(paymentId);

    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const payment = paymentSnap.data()!;

    // 4. Verify ownership and payment details.
    if (payment.userId !== decoded.uid) {
      return NextResponse.json(
        { error: "You cannot check another student's payment" },
        { status: 403 }
      );
    }

    if (
      payment.gatewayName !== "ontech" ||
      payment.type !== "agent_fee" ||
      Number(payment.amount) !== AGENT_FEE_AMOUNT ||
      String(payment.currency).toUpperCase() !== "ZMW" ||
      payment.gatewayReference !== paymentId
    ) {
      return NextResponse.json(
        { error: "Invalid agent fee payment record" },
        { status: 400 }
      );
    }

    // 5. Return immediately if the webhook already completed fulfilment.
    if (
      payment.status === "successful" &&
      payment.fulfillmentStatus === "completed"
    ) {
      return NextResponse.json({
        success: true,
        status: "successful",
        message: "Your booking payment is confirmed.",
      });
    }

    if (
      payment.status === "successful" &&
      payment.fulfillmentStatus === "requires_review"
    ) {
      return NextResponse.json({
        success: false,
        status: "requires_review",
        message:
          "Payment was received, but your booking needs manual review.",
      });
    }

    if (payment.status === "failed") {
      return NextResponse.json({
        success: false,
        status: "failed",
        message: "The payment failed. You may try again.",
      });
    }

    const transactionId = payment.gatewayTransactionId;

    if (
      typeof transactionId !== "string" ||
      !transactionId.trim()
    ) {
      return NextResponse.json({
        success: false,
        status: "pending",
        message:
          "Your payment request is still being processed. Please check again shortly.",
      });
    }

    // 6. Ask Ontech directly for the transaction status.
    let gatewayResponse: Response;

    try {
      gatewayResponse = await fetch(
        `${ONTECH_STATUS_URL}${encodeURIComponent(transactionId)}`,
        {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "Accept": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch (error) {
      console.error("Ontech status request failed:", error);

      return NextResponse.json(
        {
          success: false,
          status: "pending",
          message:
            "We could not reach the payment gateway. Please check again.",
        },
        { status: 503 }
      );
    }

    if (!gatewayResponse.ok) {
      console.error("Ontech status request returned an error", {
        httpStatus: gatewayResponse.status,
        paymentId,
      });

      return NextResponse.json(
        {
          success: false,
          status: "pending",
          message:
            "The gateway could not verify the payment yet. Please check again.",
        },
        { status: 502 }
      );
    }

    let gatewayData: Record<string, unknown>;

    try {
      gatewayData = await gatewayResponse.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: "pending",
          message: "The gateway returned an unreadable status.",
        },
        { status: 502 }
      );
    }

    const gatewayStatus =
      typeof gatewayData.status === "string"
        ? gatewayData.status.toLowerCase()
        : "";

    if (
      !["success", "failed", "pending", "processing"].includes(
        gatewayStatus
      )
    ) {
      console.error("Unknown Ontech transaction status", {
        paymentId,
        gatewayStatus,
      });

      return NextResponse.json(
        {
          success: false,
          status: "pending",
          message: "The gateway returned an unknown payment status.",
        },
        { status: 502 }
      );
    }

    // 7. Save failed or pending gateway status.
    if (gatewayStatus !== "success") {
      await db.runTransaction(async (transaction) => {
        const latestSnap = await transaction.get(paymentRef);

        if (!latestSnap.exists) {
          throw new Error("PAYMENT_NOT_FOUND");
        }

        const latest = latestSnap.data()!;

        if (
          latest.status === "successful" ||
          latest.status === "failed"
        ) {
          return;
        }

        transaction.update(paymentRef, {
          gatewayStatus,
          gatewayStatusCheckedAt: Date.now(),
          ...(gatewayStatus === "failed"
            ? { status: "failed" }
            : {}),
        });
      });

      const latestSnap = await paymentRef.get();
      const latest = latestSnap.data();

      if (
        latest?.status === "successful" &&
        latest?.fulfillmentStatus === "completed"
      ) {
        return NextResponse.json({
          success: true,
          status: "successful",
          message: "Your booking payment is confirmed.",
        });
      }

      return NextResponse.json({
        success: false,
        status:
          latest?.status === "failed" ? "failed" : gatewayStatus,
        message:
          gatewayStatus === "failed"
            ? "The payment failed. You may try again."
            : "Your payment is not yet confirmed. Please check again.",
      });
    }

    // 8. Verify successful payment and confirm the booking.
    const result = await db.runTransaction(async (transaction) => {
      const latestPaymentSnap = await transaction.get(paymentRef);

      if (!latestPaymentSnap.exists) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const latestPayment = latestPaymentSnap.data()!;

      if (
        latestPayment.userId !== decoded.uid ||
        latestPayment.gatewayName !== "ontech" ||
        latestPayment.type !== "agent_fee" ||
        Number(latestPayment.amount) !== AGENT_FEE_AMOUNT ||
        latestPayment.gatewayTransactionId !== transactionId
      ) {
        throw new Error("PAYMENT_DETAILS_MISMATCH");
      }

      if (
        latestPayment.status === "successful" &&
        latestPayment.fulfillmentStatus === "completed"
      ) {
        return "successful" as const;
      }

      if (
        latestPayment.status === "successful" &&
        latestPayment.fulfillmentStatus === "requires_review"
      ) {
        return "requires_review" as const;
      }

      const now = Date.now();
      const bookingId = latestPayment.linkedBookingId;

      if (typeof bookingId !== "string" || !bookingId) {
        transaction.update(paymentRef, {
          status: "successful",
          gatewayStatus: "success",
          verifiedAt: now,
          fulfillmentStatus: "requires_review",
          statusCheckedAt: now,
        });

        return "requires_review" as const;
      }

      const bookingRef = db.collection("bookings").doc(bookingId);
      const bookingSnap = await transaction.get(bookingRef);
      const booking = bookingSnap.exists
        ? bookingSnap.data()
        : undefined;

      const isCurrentAttempt =
        booking?.agentFeePaymentId === paymentId;

      const isApproved = booking?.status === "approved";

      const isNotExpired =
        typeof booking?.approvalExpiresAt !== "number" ||
        now <= booking.approvalExpiresAt;

      const belongsToStudent =
        booking?.studentId === latestPayment.userId;

      if (
        !booking ||
        !isCurrentAttempt ||
        !isApproved ||
        !isNotExpired ||
        !belongsToStudent
      ) {
        transaction.update(paymentRef, {
          status: "successful",
          gatewayStatus: "success",
          verifiedAt: now,
          fulfillmentStatus: "requires_review",
          statusCheckedAt: now,
        });

        return "requires_review" as const;
      }

      transaction.update(bookingRef, {
        status: "confirmed",
        paymentVerified: true,
        confirmedAt: now,
      });

      transaction.update(paymentRef, {
        status: "successful",
        gatewayStatus: "success",
        verifiedAt: now,
        fulfillmentStatus: "completed",
        statusCheckedAt: now,
      });

      return "successful" as const;
    });

    if (result === "successful") {
      return NextResponse.json({
        success: true,
        status: "successful",
        message: "Your booking payment is confirmed.",
      });
    }

    return NextResponse.json({
      success: false,
      status: "requires_review",
      message:
        "Payment was received, but your booking needs manual review.",
    });
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (code === "PAYMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (code === "PAYMENT_DETAILS_MISMATCH") {
      return NextResponse.json(
        { error: "Payment validation failed" },
        { status: 400 }
      );
    }

    console.error("Agent fee status check error:", error);

    return NextResponse.json(
      { error: "Unable to check payment status" },
      { status: 500 }
    );
  }
}
