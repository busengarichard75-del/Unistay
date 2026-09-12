// src/lib/emailTemplates.ts
import { Booking } from "@/types/booking";

// ─── Shared brand values ────────────────────────────────────────
const BRAND = {
  navy: "#1A365D",
  primary: "#4A90D9",
  surface: "#EEF5FF",
  success: "#16A34A",
  successBg: "#DCFCE7",
  warning: "#D97706",
  warningBg: "#FEF3C7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  gray: "#718096",
  text: "#1A365D",
  subtext: "#4A5568",
  supportPhone: "+260 0771319817",
  supportEmail: "pezaaccommodation@gmail.com",
};

interface BaseArgs {
  previewText?: string;
}

function wrapper({
  headerTitle,
  headerSubtitle,
  body,
  previewText = "",
}: BaseArgs & {
  headerTitle: string;
  headerSubtitle: string;
  body: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:24px 12px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(26,54,93,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.primary} 100%);padding:28px 24px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;">${headerTitle}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${headerSubtitle}</p>
          </td>
        </tr>
        ${body}
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #E2EBF7;">
            <p style="margin:0;font-size:12px;color:${BRAND.gray};text-align:center;">Need help?</p>
            <p style="margin:4px 0 0;font-size:12px;color:${BRAND.primary};text-align:center;">📞 ${BRAND.supportPhone} · ${BRAND.supportEmail}</p>
            <p style="margin:12px 0 0;font-size:11px;color:#A0AEC0;text-align:center;">— The Peza Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim();
}

function greeting(name: string | undefined, intro: string): string {
  return `
<tr>
  <td style="padding:24px 24px 8px;">
    <p style="margin:0;font-size:15px;color:${BRAND.text};">Hi <strong>${name || "there"}</strong>,</p>
    <p style="margin:8px 0 0;font-size:14px;color:${BRAND.subtext};line-height:1.5;">${intro}</p>
  </td>
</tr>`;
}

function detailsCard(booking: Booking, accent?: { bg: string; border: string }): string {
  const bg = accent?.bg || "#F5F9FF";
  const border = accent?.border || "#E2EBF7";
  const period =
    booking.paymentPeriod === "termly"
      ? "term"
      : booking.paymentPeriod === "semester"
      ? "semester"
      : "month";
  return `
<tr>
  <td style="padding:16px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:12px;border:1px solid ${border};">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0;font-size:11px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Property</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:${BRAND.text};">${booking.propertyTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 16px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:8px;">
                <p style="margin:0;font-size:11px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Price</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:${BRAND.text};">K${booking.price.toLocaleString()} / ${period}</p>
              </td>
              <td width="50%" style="padding-left:8px;">
                <p style="margin:0;font-size:11px;color:${BRAND.gray};text-transform:uppercase;letter-spacing:0.5px;">Booking ID</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:${BRAND.text};font-family:monospace;">${booking.confirmationId || booking.id.slice(-8).toUpperCase()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function statusCard(text: string, tone: "success" | "warning" | "info" | "danger" | "neutral"): string {
  const map = {
    success: { bg: BRAND.successBg, border: "#BBF7D0", color: "#166534", label: BRAND.success },
    warning: { bg: BRAND.warningBg, border: "#FDE68A", color: "#92400E", label: BRAND.warning },
    info: { bg: "#DBEAFE", border: "#BFDBFE", color: "#1E40AF", label: BRAND.primary },
    danger: { bg: BRAND.dangerBg, border: "#FECACA", color: "#991B1B", label: BRAND.danger },
    neutral: { bg: "#F3F4F6", border: "#E5E7EB", color: "#374151", label: BRAND.gray },
  }[tone];
  return `
<tr>
  <td style="padding:0 24px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${map.bg};border-radius:12px;border:1px solid ${map.border};">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:${map.color};line-height:1.5;">${text}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function ctaButton(label: string, url: string): string {
  return `
<tr>
  <td style="padding:8px 24px 16px;" align="center">
    <a href="${url}" style="display:inline-block;background:${BRAND.primary};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;">${label}</a>
  </td>
</tr>`;
}

function nextSteps(steps: string[]): string {
  return `
<tr>
  <td style="padding:8px 24px 16px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${BRAND.text};">What's next?</p>
    <table cellpadding="0" cellspacing="0">
      ${steps.map((s, i) => `<tr><td style="padding:3px 0;font-size:13px;color:${BRAND.subtext};">${i + 1}. ${s}</td></tr>`).join("")}
    </table>
  </td>
</tr>`;
}

// ─── Templates ──────────────────────────────────────────────────

interface TemplateArgs {
  booking: Booking;
  studentName?: string;
  studentEmail?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  passUrl: string;
}

export function bookingRequestedTemplate({
  booking,
  studentName,
  landlordName,
  passUrl,
}: TemplateArgs): { subject: string; html: string } {
  const body =
    greeting(
      landlordName,
      `<strong>${studentName || "A student"}</strong> has requested to book <strong>"${booking.propertyTitle}"</strong> on Peza.`
    ) +
    detailsCard(booking) +
    statusCard(
      "👉 Action needed: Review this request in your dashboard. If you approve, the student pays a small agent fee to Peza to confirm.",
      "info"
    ) +
    ctaButton("Review Request →", passUrl) +
    nextSteps([
      "Open your dashboard to see full student details",
      "Approve or decline the request",
      "If approved, the student will pay the agent fee to Peza",
      "Peza confirms and connects you both",
    ]);

  return {
    subject: `📬 New booking request: ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "📬 New Booking Request",
      headerSubtitle: "A student wants your property",
      previewText: `${studentName || "A student"} requested ${booking.propertyTitle}`,
      body,
    }),
  };
}

export function bookingApprovedTemplate({
  booking,
  studentName,
  landlordName,
  passUrl,
}: TemplateArgs): { subject: string; html: string } {
  const body =
    greeting(
      studentName,
      `Great news — <strong>${landlordName || "the landlord"}</strong> approved your booking request for <strong>"${booking.propertyTitle}"</strong>.`
    ) +
    detailsCard(booking, { bg: BRAND.warningBg, border: "#FDE68A" }) +
    statusCard(
      `💳 <strong>Action required:</strong> Pay the K100 agent fee to Peza to confirm your booking. Your approval expires in 48 hours.`,
      "warning"
    ) +
    ctaButton("Pay & Confirm →", passUrl) +
    nextSteps([
      "Open your dashboard and tap 'Pay K100 Now'",
      "Send K100 to +260 0771319817 with the reference shown",
      "Peza verifies and confirms your booking",
      "You'll then be connected with your landlord",
    ]);

  return {
    subject: `✅ Approved! Pay K100 to confirm your booking at ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "✅ Booking Approved",
      headerSubtitle: "One step left to confirm",
      previewText: `Approved! Pay K100 agent fee to confirm your booking.`,
      body,
    }),
  };
}

export function bookingConfirmedTemplate({
  booking,
  studentName,
  landlordName,
  landlordPhone,
  passUrl,
}: TemplateArgs): { subject: string; html: string } {
  const landlordBlock =
    landlordName || landlordPhone
      ? `
<tr>
  <td style="padding:0 24px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.successBg};border-radius:12px;border:1px solid #BBF7D0;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0;font-size:11px;color:#15803D;text-transform:uppercase;letter-spacing:0.5px;">Your Landlord</p>
          ${landlordName ? `<p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#166534;">${landlordName}</p>` : ""}
          ${landlordPhone ? `<p style="margin:4px 0 0;font-size:14px;color:#166534;">📞 ${landlordPhone}</p>` : ""}
          <p style="margin:10px 0 0;font-size:12px;color:#15803D;">Reach out to arrange your move-in details.</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
      : "";

  const body =
    greeting(
      studentName,
      `Your booking at <strong>"${booking.propertyTitle}"</strong> is now <strong>confirmed</strong>. 🎉`
    ) +
    detailsCard(booking, { bg: BRAND.successBg, border: "#BBF7D0" }) +
    statusCard("🎉 Payment received. Your bed is reserved and your landlord has been notified.", "success") +
    landlordBlock +
    ctaButton("View Your Booking Pass →", passUrl) +
    nextSteps([
      "Contact your landlord to arrange move-in",
      "Agree on rent payment method (offline, with landlord)",
      "Tick \"I've checked in\" on your dashboard once settled",
    ]);

  return {
    subject: `🎉 Booking confirmed: ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "🎉 Booking Confirmed",
      headerSubtitle: "Your accommodation is reserved",
      previewText: `Your booking at ${booking.propertyTitle} is confirmed!`,
      body,
    }),
  };
}

export function bookingRejectedTemplate({
  booking,
  studentName,
}: TemplateArgs): { subject: string; html: string } {
  const body =
    greeting(
      studentName,
      `Unfortunately, your booking request for <strong>"${booking.propertyTitle}"</strong> was declined by the landlord.`
    ) +
    detailsCard(booking) +
    statusCard(
      "😔 This specific bed isn't available anymore. Don't worry — there are many other verified properties near your campus.",
      "danger"
    ) +
    ctaButton("Browse Other Properties →", `${new URL(booking ? "/" : "/", "https://peza.vercel.app").toString()}`) +
    nextSteps([
      "Browse other verified properties on Peza",
      "Send new booking requests to multiple places",
      "Contact Peza support if you need help finding a place",
    ]);

  return {
    subject: `Booking declined: ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "Booking Declined",
      headerSubtitle: "Let's find you a better fit",
      previewText: `Your request for ${booking.propertyTitle} was declined.`,
      body,
    }),
  };
}

export function bookingExpiredTemplate({
  booking,
  studentName,
}: TemplateArgs): { subject: string; html: string } {
  const body =
    greeting(
      studentName,
      `Your approved booking at <strong>"${booking.propertyTitle}"</strong> has expired because payment wasn't completed within 48 hours.`
    ) +
    detailsCard(booking) +
    statusCard(
      "⏰ The bed is now available to other students. If you're still interested, you can send a new request — but be quick!",
      "neutral"
    ) +
    ctaButton("Browse Properties →", "https://peza.vercel.app") +
    nextSteps([
      "Browse properties again — some may still be available",
      "Send a new booking request",
      "Complete payment within 48 hours to confirm",
    ]);

  return {
    subject: `⏰ Your approval expired: ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "⏰ Approval Expired",
      headerSubtitle: "Your reserved bed was released",
      previewText: `Your approval for ${booking.propertyTitle} expired.`,
      body,
    }),
  };
}

export function studentCheckedInTemplate({
  booking,
  studentName,
  landlordName,
  passUrl,
}: TemplateArgs): { subject: string; html: string } {
  const body =
    greeting(
      landlordName,
      `<strong>${studentName || "Your student"}</strong> has marked themselves as <strong>checked in</strong> at <strong>"${booking.propertyTitle}"</strong>. 🎉`
    ) +
    detailsCard(booking, { bg: BRAND.successBg, border: "#BBF7D0" }) +
    statusCard(
      "✅ This booking is now complete. Thank you for hosting on Peza — we hope it went smoothly!",
      "success"
    ) +
    ctaButton("View Dashboard →", passUrl);

  return {
    subject: `🎊 ${studentName || "Your student"} checked in at ${booking.propertyTitle}`,
    html: wrapper({
      headerTitle: "🎊 Student Checked In",
      headerSubtitle: "Successful match complete",
      previewText: `${studentName} has checked in at ${booking.propertyTitle}.`,
      body,
    }),
  };
}