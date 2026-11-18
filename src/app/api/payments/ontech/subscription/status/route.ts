
import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin, getFirestoreDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONTECH_BASE_URL = "https://payments.ontech.co.zm/api/v1";

const PLAN_PRICES = {
  provider_plan_pro: 59.99,
  provider_plan_full_time: 199.99,
  service_plan_standard: 129.99,
  service_plan_pro: 299.99,
} as const;

type SubscriptionPaymentType = keyof typeof PLAN_PRICES;

function isSubscriptionPaymentType(
  value: unknown
): value is SubscriptionPaymentType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PLAN_PRICES, value)
  );
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const decodedToken = await getAuthAdmin().verifyIdToken(
      authorization.substring(7)
    );

    const uid = decodedToken.uid;
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId || paymentId.includes("/")) {
      return NextResponse.json(
        { success: false, message: "A valid payment ID is required." },
        { status: 400 }
      );
    }

    const db = getFirestoreDb();
    const paymentRef = db.collection("payments").doc(paymentId);
    const paymentSnapshot = await paymentRef.get();

    if (!paymentSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Payment not found." },
        { status: 404 }
      );
    }

    const payment = paymentSnapshot.data();

    // Verify ownership and payment gateway.
    if (
      payment?.userId !== uid ||
      payment?.gatewayName !== "ontech" ||
      !isSubscriptionPaymentType(payment?.type)
    ) {
      return NextResponse.json(
        { success: false, message: "Payment not found." },
        { status: 404 }
      );
    }

    // Verify the amount against the server-controlled plan price.
    if (
      Number(payment.amount) !== PLAN_PRICES[payment.type] ||
      String(payment.currency).toUpperCase() !== "ZMW" ||
      payment.gatewayReference !== paymentId
    ) {
      console.error("Subscription payment record validation failed:", paymentId);

      return NextResponse.json(
        { success: false, message: "Payment validation failed." },
        { status: 400 }
      );
    }

    // Only a fulfilled webhook-confirmed payment is reported as successful.
    if (
      payment.status === "successful" &&
      payment.fulfillmentStatus === "completed"
    ) {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "successful",
        message: "Payment confirmed. Your plan is active.",
      });
    }

    if (payment.status === "failed") {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "failed",
        message: payment.failureReason || "Payment failed.",
      });
    }

    const transactionId = payment.gatewayTransactionId;

    if (!transactionId) {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "pending",
        message: "Waiting for the payment provider's transaction reference.",
      });
    }

    const apiKey = process.env.ONTECH_API_KEY;

    if (!apiKey) {
      console.error("ONTECH_API_KEY is not configured.");

      return NextResponse.json(
        { success: false, message: "Payment service is not configured." },
        { status: 500 }
      );
    }

    const gatewayResponse = await fetch(
      `${ONTECH_BASE_URL}/pay/status/${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }
    );

    if (!gatewayResponse.ok) {
      console.error(
        "Ontech status request failed:",
        gatewayResponse.status
      );

      return NextResponse.json({
        success: true,
        paymentId,
        status: "pending",
        message: "We are still checking your payment. Please wait.",
      });
    }

    const gatewayData = await gatewayResponse.json();

    const gatewayStatus =
      typeof gatewayData.status === "string"
        ? gatewayData.status.toLowerCase()
        : "pending";

    if (
      gatewayStatus !== "success" &&
      gatewayStatus !== "failed" &&
      gatewayStatus !== "pending" &&
      gatewayStatus !== "processing"
    ) {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "pending",
        message: "Payment is still being checked. Please wait.",
      });
    }

    // Re-read the payment before updating it. The webhook may have
    // completed while the Ontech status request was running.
    await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(paymentRef);

      if (!currentSnapshot.exists) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const current = currentSnapshot.data();

      if (
        current?.userId !== uid ||
        current?.gatewayName !== "ontech" ||
        current?.gatewayTransactionId !== transactionId ||
        !isSubscriptionPaymentType(current?.type) ||
        Number(current.amount) !== PLAN_PRICES[current.type] ||
        String(current.currency).toUpperCase() !== "ZMW"
      ) {
        throw new Error("PAYMENT_VALIDATION_FAILED");
      }

      // Never overwrite a successful webhook fulfilment.
      if (
        current.status === "successful" &&
        current.fulfillmentStatus === "completed"
      ) {
        return;
      }

      // The status endpoint does not activate plans.
      // Only the verified webhook performs fulfilment.
      if (gatewayStatus === "failed") {
        if (
          current.status === "pending" ||
          current.status === "processing"
        ) {
          transaction.update(paymentRef, {
            status: "failed",
            gatewayStatus: "failed",
            failureReason:
              typeof gatewayData.message === "string"
                ? gatewayData.message
                : "The payment was declined.",
            updatedAt: Date.now(),
          });
        }

        return;
      }

      transaction.update(paymentRef, {
        gatewayStatus,
        updatedAt: Date.now(),
      });
    });

    // Read the final state after the transaction.
    const finalSnapshot = await paymentRef.get();
    const finalPayment = finalSnapshot.data();

    if (
      finalPayment?.status === "successful" &&
      finalPayment?.fulfillmentStatus === "completed"
    ) {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "successful",
        message: "Payment confirmed. Your plan is active.",
      });
    }

    if (finalPayment?.status === "failed") {
      return NextResponse.json({
        success: true,
        paymentId,
        status: "failed",
        message: finalPayment.failureReason || "Payment failed.",
      });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      status: "pending",
      message:
        gatewayStatus === "success"
          ? "Ontech reports payment success. Peza is waiting for final confirmation."
          : "Payment is still being processed. Please wait.",
    });
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (code === "PAYMENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Payment not found." },
        { status: 404 }
      );
    }

    if (code === "PAYMENT_VALIDATION_FAILED") {
      return NextResponse.json(
        { success: false, message: "Payment validation failed." },
        { status: 400 }
      );
    }

    console.error("Subscription payment status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to check payment status. Please try again.",
      },
      { status: 500 }
    );
  }
}
