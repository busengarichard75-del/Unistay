
import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin, getFirestoreDb } from "@/lib/firebase-admin";

const ONTECH_BASE_URL = "https://payments.ontech.co.zm/api/v1";

const PLAN_PRICES = {
  provider_plan_pro: 59.99,
  provider_plan_full_time: 199.99,
  service_plan_standard: 129.99,
  service_plan_pro: 299.99,
} as const;

type SubscriptionPaymentType = keyof typeof PLAN_PRICES;

function normalizeZambianPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  let phone = value.replace(/[\s\-()+]/g, "");

  if (/^09\d{8}$/.test(phone)) {
    phone = `260${phone.substring(1)}`;
  }

  if (!/^2609\d{8}$/.test(phone)) {
    return null;
  }

  return phone;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const decodedToken = await getAuthAdmin().verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await request.json();
    const type = body.type as SubscriptionPaymentType;
    const phoneNumber = normalizeZambianPhone(body.phoneNumber);

    if (!Object.prototype.hasOwnProperty.call(PLAN_PRICES, type)) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid Zambian mobile money number.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ONTECH_API_KEY;

    if (!apiKey) {
      console.error("ONTECH_API_KEY is not configured.");

      return NextResponse.json(
        { success: false, message: "Payment service is not configured." },
        { status: 500 }
      );
    }

    const db = getFirestoreDb();
    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    const user = userSnapshot.data();

    if (user?.role !== "service_provider") {
      return NextResponse.json(
        {
          success: false,
          message: "Only service providers can purchase these plans.",
        },
        { status: 403 }
      );
    }

    const amount = PLAN_PRICES[type];
    const paymentRef = db.collection("payments").doc();
    const paymentId = paymentRef.id;
    const now = Date.now();

    await paymentRef.set({
      userId: uid,
      type,
      amount,
      currency: "ZMW",
      gatewayName: "ontech",
      gatewayReference: paymentId,
      gatewayTransactionId: null,
      gatewayStatus: "pending",
      status: "pending",
      customerPhone: phoneNumber,
      idempotencyKey: `peza-${paymentId}`,
      createdAt: now,
      verifiedAt: null,
      fulfillmentStatus: "pending",
    });

    let gatewayResponse: Response;

    try {
      gatewayResponse = await fetch(`${ONTECH_BASE_URL}/pay/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-Idempotency-Key": `peza-${paymentId}`,
        },
        body: JSON.stringify({
          amount,
          phone: phoneNumber,
          reference: paymentId,
          description: `Peza subscription - ${type}`,
          customer_name: user?.fullName || "Peza Customer",
        }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      console.error("Ontech request outcome is unknown:", error);

      // Keep the payment pending. The request may have reached Ontech
      // even though Peza did not receive its response.
      return NextResponse.json({
        success: true,
        paymentId,
        status: "pending",
        message:
          "Your payment request is being checked. Please wait before trying again.",
      });
    }

    let gatewayData: Record<string, unknown>;

    try {
      gatewayData = await gatewayResponse.json();
    } catch {
      gatewayData = {};
    }

    const transactionId =
      typeof gatewayData.transaction_id === "string"
        ? gatewayData.transaction_id
        : null;

    const gatewayStatus =
      typeof gatewayData.status === "string"
        ? gatewayData.status.toLowerCase()
        : "pending";

    if (!gatewayResponse.ok) {
      await paymentRef.update({
        status: "failed",
        gatewayStatus,
        failureReason:
          typeof gatewayData.message === "string"
            ? gatewayData.message
            : "Ontech could not initialize the payment.",
        updatedAt: Date.now(),
      });

      return NextResponse.json(
        {
          success: false,
          paymentId,
          status: "failed",
          message:
            typeof gatewayData.message === "string"
              ? gatewayData.message
              : "Could not start the payment. Please try again.",
        },
        { status: 502 }
      );
    }

    // Do not mark a payment successful here. The verified webhook
    // is responsible for confirming payment and activating the plan.
    await db.runTransaction(async (transaction) => {
      const currentPayment = await transaction.get(paymentRef);

      if (!currentPayment.exists) return;

      if (currentPayment.data()?.status === "successful") return;

      transaction.update(paymentRef, {
        gatewayTransactionId: transactionId,
        gatewayStatus,
        updatedAt: Date.now(),
      });
    });

    if (gatewayStatus === "failed") {
      await paymentRef.update({
        status: "failed",
        failureReason:
          typeof gatewayData.message === "string"
            ? gatewayData.message
            : "The payment was declined.",
        updatedAt: Date.now(),
      });

      return NextResponse.json({
        success: true,
        paymentId,
        status: "failed",
        message:
          typeof gatewayData.message === "string"
            ? gatewayData.message
            : "The payment was declined.",
      });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      status: "pending",
      message:
        typeof gatewayData.message === "string"
          ? gatewayData.message
          : "Payment request sent. Check your phone for the mobile money prompt.",
    });
  } catch (error) {
    console.error("Subscription payment initialization error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to initialize payment. Please try again.",
      },
      { status: 500 }
    );
  }
}
