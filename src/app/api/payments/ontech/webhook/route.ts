
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPECTED_AMOUNTS: Record<string, number> = {
  agent_fee: 100,
  provider_plan_pro: 59.99,
  provider_plan_full_time: 199.99,
  service_plan_standard: 129.99,
  service_plan_pro: 299.99,
};

type WebhookBody = {
  event?: string;
  app_reference?: string;
  transaction_id?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  [key: string]: unknown;
};

function verifySignature(
  body: WebhookBody,
  signature: string,
  secret: string
): boolean {
  // Follows the Node.js serialization example in Ontech's documentation.
  const payload = JSON.stringify(body, Object.keys(body).sort());

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    receivedBuffer.length > 0 &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ONTECH_WEBHOOK_SECRET;

    if (!secret) {
      console.error("ONTECH_WEBHOOK_SECRET is not configured");

      return NextResponse.json(
        { error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-webhook-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as WebhookBody;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    if (!verifySignature(body, signature, secret)) {
      console.error("Invalid Ontech webhook signature");

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Only successful collection events can fulfil payments.
    if (
      body.event !== "payment.success" &&
      body.event !== "payment.completed"
    ) {
      return NextResponse.json({ received: true });
    }

    const appReference = body.app_reference;
    const transactionId = body.transaction_id;
    const amount = Number(body.amount);

    const currency =
      typeof body.currency === "string"
        ? body.currency.toUpperCase()
        : "";

    if (
      typeof appReference !== "string" ||
      !appReference.trim() ||
      appReference.includes("/") ||
      typeof transactionId !== "string" ||
      !transactionId.trim() ||
      !Number.isFinite(amount) ||
      currency !== "ZMW"
    ) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 }
      );
    }

    const db = getFirestoreDb();
    const paymentRef = db.collection("payments").doc(appReference);

    await db.runTransaction(async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef);

      if (!paymentSnap.exists) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const payment = paymentSnap.data()!;

      if (
        payment.gatewayName !== "ontech" ||
        Number(payment.amount) !== amount ||
        String(payment.currency).toUpperCase() !== currency
      ) {
        throw new Error("PAYMENT_DETAILS_MISMATCH");
      }

      if (
        payment.gatewayTransactionId &&
        payment.gatewayTransactionId !== transactionId
      ) {
        throw new Error("TRANSACTION_ID_MISMATCH");
      }

      const expectedAmount = EXPECTED_AMOUNTS[payment.type];

      if (
        expectedAmount === undefined ||
        Number(payment.amount) !== expectedAmount
      ) {
        throw new Error("EXPECTED_AMOUNT_MISMATCH");
      }

      // Prevent duplicate fulfilment.
      if (payment.status === "successful") {
        return;
      }

      const now = Date.now();

      const paymentUpdates: Record<string, unknown> = {
        status: "successful",
        gatewayTransactionId: transactionId,
        gatewayStatus: "success",
        verifiedAt: now,
        webhookPayload: JSON.stringify(body),
      };

      if (payment.type === "agent_fee") {
        if (
          typeof payment.linkedBookingId !== "string" ||
          !payment.linkedBookingId
        ) {
          paymentUpdates.fulfillmentStatus = "requires_review";
        } else {
          const bookingRef = db
            .collection("bookings")
            .doc(payment.linkedBookingId);

          const bookingSnap = await transaction.get(bookingRef);

          const booking = bookingSnap.exists
            ? bookingSnap.data()
            : undefined;

          const isCurrentAttempt =
            booking?.agentFeePaymentId === appReference;

          const isApproved = booking?.status === "approved";

          const isNotExpired =
            typeof booking?.approvalExpiresAt !== "number" ||
            now <= booking.approvalExpiresAt;

          const belongsToStudent =
            booking?.studentId === payment.userId;

          if (
            booking &&
            isCurrentAttempt &&
            isApproved &&
            isNotExpired &&
            belongsToStudent
          ) {
            transaction.update(bookingRef, {
              status: "confirmed",
              paymentVerified: true,
              confirmedAt: now,
            });

            paymentUpdates.fulfillmentStatus = "completed";
          } else {
            paymentUpdates.fulfillmentStatus = "requires_review";
          }
        }
      } else {
        if (typeof payment.userId !== "string" || !payment.userId) {
          throw new Error("INVALID_PAYMENT_OWNER");
        }

        const userRef = db.collection("users").doc(payment.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new Error("USER_NOT_FOUND");
        }

        const user = userSnap.data();

        if (user?.role !== "service_provider") {
          throw new Error("INVALID_PROVIDER_ROLE");
        }

        switch (payment.type) {
          case "service_plan_standard":
            transaction.update(userRef, {
              servicePlan: "standard",
              servicePlanExpiry: now + 30 * DAY_MS,
            });
            break;

          case "service_plan_pro":
            transaction.update(userRef, {
              servicePlan: "pro",
              servicePlanExpiry: now + 365 * DAY_MS,
            });
            break;

          case "provider_plan_pro":
            transaction.update(userRef, {
              plan: "pro",
              planExpiry: now + 30 * DAY_MS,
            });
            break;

          case "provider_plan_full_time":
            transaction.update(userRef, {
              plan: "full_time",
              planExpiry: now + 30 * DAY_MS,
            });
            break;

          default:
            throw new Error("UNSUPPORTED_PAYMENT_TYPE");
        }

        paymentUpdates.fulfillmentStatus = "completed";
      }

      transaction.update(paymentRef, paymentUpdates);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (code === "PAYMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (
      code === "PAYMENT_DETAILS_MISMATCH" ||
      code === "TRANSACTION_ID_MISMATCH" ||
      code === "EXPECTED_AMOUNT_MISMATCH" ||
      code === "INVALID_PAYMENT_OWNER" ||
      code === "USER_NOT_FOUND" ||
      code === "INVALID_PROVIDER_ROLE" ||
      code === "UNSUPPORTED_PAYMENT_TYPE"
    ) {
      console.error("Ontech webhook validation failed:", code);

      return NextResponse.json(
        { error: "Payment validation failed" },
        { status: 400 }
      );
    }

    console.error("Ontech webhook error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
