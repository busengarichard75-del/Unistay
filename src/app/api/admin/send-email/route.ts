// src/app/api/admin/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const FROM_ADDRESS = "Peza Accommodation <onboarding@resend.dev>";
const REPLY_TO = "pezaaccommodation@gmail.com";
const ADMIN_EMAIL = "busengarichard75@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, to, subject, message } = body as {
      adminEmail?: string;
      to?: string;
      subject?: string;
      message?: string;
    };

    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    if (!to || !subject || !message) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY missing" }, { status: 500 });
    }

    // ⚡ Lazy-init: only construct the Resend client when the route actually runs.
    // Module-scope construction crashes the build when the env var is missing.
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#EEF5FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF5FF;padding:24px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(26,54,93,0.08);">
<tr><td style="background:linear-gradient(135deg,#1A365D 0%,#4A90D9 100%);padding:24px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${subject}</h1>
</td></tr>
<tr><td style="padding:28px 24px;">
<p style="margin:0;font-size:15px;color:#1A365D;line-height:1.6;white-space:pre-wrap;">${message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</p>
</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #E2EBF7;">
<p style="margin:0;font-size:12px;color:#718096;text-align:center;">— The Peza Team</p>
<p style="margin:6px 0 0;font-size:12px;color:#4A90D9;text-align:center;">📞 +260 0771319817 · pezaaccommodation@gmail.com</p>
</td></tr>
</table></td></tr></table></body></html>`.trim();

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    });

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}