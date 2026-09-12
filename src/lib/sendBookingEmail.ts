// src/lib/sendBookingEmail.ts
import { Resend } from "resend";
import { Booking } from "@/types/booking";
import {
  bookingRequestedTemplate,
  bookingApprovedTemplate,
  bookingConfirmedTemplate,
  bookingRejectedTemplate,
  bookingExpiredTemplate,
  studentCheckedInTemplate,
} from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Peza Accommodation <onboarding@resend.dev>";
const REPLY_TO = "pezaaccommodation@gmail.com";

export type BookingEmailType =
  | "booking_requested"
  | "booking_approved"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_expired"
  | "student_checked_in";

interface SendParams {
  to: string;
  type: BookingEmailType;
  booking: Booking;
  studentName?: string;
  studentEmail?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
}

interface SendResult {
  success: boolean;
  error?: string;
}

function getPassUrl(booking: Booking): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";
  return `${baseUrl}/booking/confirmation/${booking.id}`;
}

function renderTemplate(type: BookingEmailType, params: SendParams) {
  const args = {
    booking: params.booking,
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    landlordName: params.landlordName,
    landlordPhone: params.landlordPhone,
    landlordEmail: params.landlordEmail,
    passUrl: getPassUrl(params.booking),
  };

  switch (type) {
    case "booking_requested":
      return bookingRequestedTemplate(args);
    case "booking_approved":
      return bookingApprovedTemplate(args);
    case "booking_confirmed":
      return bookingConfirmedTemplate(args);
    case "booking_rejected":
      return bookingRejectedTemplate(args);
    case "booking_expired":
      return bookingExpiredTemplate(args);
    case "student_checked_in":
      return studentCheckedInTemplate(args);
  }
}

export async function sendBookingEmail(params: SendParams): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  if (!params.to) {
    return { success: false, error: "No recipient email" };
  }

  let subject: string;
  let html: string;
  try {
    const rendered = renderTemplate(params.type, params);
    subject = rendered.subject;
    html = rendered.html;
  } catch (err) {
    console.error("Template render failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Template render failed",
    };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      replyTo: REPLY_TO,
      subject,
      html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("sendBookingEmail failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}