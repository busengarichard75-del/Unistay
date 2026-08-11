import Link from "next/link";
import { ArrowLeft, Shield, FileText, Mail, Phone } from "lucide-react";

export const metadata = {
  title: "Trust & Legal – UniStayZM",
  description: "Privacy Policy, Terms of Service, and contact information for UniStayZM.",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
      <div className="container-medium">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={28} className="text-[var(--nexora-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">Trust & Legal</h1>
          </div>

          {/* ─── PRIVACY POLICY ─── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <FileText size={20} className="text-[var(--nexora-primary)]" />
              <h2 className="text-xl font-semibold text-[var(--nexora-navy)]">Privacy Policy</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>UniStayZM</strong> (operated by Nexora Tech, Zambia) respects your privacy. This policy explains how we collect, use, and protect your personal data.
              </p>

              <div>
                <h3 className="font-semibold text-gray-800">1. What We Collect</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>Your name, email address, and phone number</li>
                  <li>Student ID and university (for students)</li>
                  <li>Property details and contact information (for landlords)</li>
                  <li>Booking history and communication</li>
                  <li>Payment records (agent fees and boosts)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">2. How We Use Your Data</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>To match students with accommodation</li>
                  <li>To process bookings and payments</li>
                  <li>To send booking confirmations and important updates</li>
                  <li>To improve our platform and services</li>
                  <li>To ensure safety and prevent fraud</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">3. Who We Share Data With</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>
                    <strong>Landlords:</strong> We share your name and phone number only after your booking is confirmed.
                  </li>
                  <li>
                    <strong>Admins:</strong> Our team has access to verify bookings and resolve issues.
                  </li>
                  <li>
                    <strong>We never sell your data.</strong>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">4. Your Rights</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>You can view, edit, or delete your data from your Profile &amp; Settings.</li>
                  <li>You can opt out of non‑essential communications.</li>
                  <li>You can request a copy of your data by emailing us.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">5. Data Security</h3>
                <p className="text-gray-600">
                  We use Firebase with strict security rules, admin verification, and encrypted communication to protect your data. Payments are handled securely via manual verification.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">6. Cookies</h3>
                <p className="text-gray-600">
                  We use essential cookies to keep you logged in and improve your experience. We do not use tracking or advertising cookies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">7. Contact</h3>
                <p className="text-gray-600">
                  For any privacy‑related questions, email us at <strong>unistayzm2@gmail.com</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* ─── TERMS OF SERVICE ─── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <FileText size={20} className="text-[var(--nexora-primary)]" />
              <h2 className="text-xl font-semibold text-[var(--nexora-navy)]">Terms of Service</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                By using UniStayZM, you agree to the following terms. Please read them carefully.
              </p>

              <div>
                <h3 className="font-semibold text-gray-800">1. Acceptance of Terms</h3>
                <p className="text-gray-600">
                  By creating an account or using our platform, you accept these terms. If you do not agree, please discontinue use.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">2. User Roles</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li><strong>Student:</strong> Can browse, search, and request bookings.</li>
                  <li><strong>Landlord:</strong> Can list properties, manage bookings, and approve/ reject requests.</li>
                  <li><strong>Admin:</strong> Manages platform integrity, verifies listings and payments.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">3. Listings &amp; Accuracy</h3>
                <p className="text-gray-600">
                  Landlords must provide accurate and truthful information about their properties. UniStay verifies listings but does not guarantee their accuracy in real‑time. Students are encouraged to ask questions before booking.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">4. Booking Process &amp; Fees</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>Students request a bed; landlords approve or reject.</li>
                  <li>Approved bookings require a <strong>K100 agent fee</strong> (paid via Mobile Money).</li>
                  <li>Landlords can pay <strong>K100 per boost</strong> to promote a listing for 30 days.</li>
                  <li>Fees are non‑refundable once a booking is confirmed.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">5. Cancellation</h3>
                <p className="text-gray-600">
                  Students can cancel a confirmed booking from their dashboard before the admin confirms payment. After confirmation, cancellations are handled on a case‑by‑case basis. Contact support for assistance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">6. User Conduct</h3>
                <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                  <li>Do not post fake or misleading listings.</li>
                  <li>Do not spam, harass, or scam other users.</li>
                  <li>Be respectful in all communications.</li>
                  <li>Violations may lead to account suspension or permanent ban.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">7. Account Suspension</h3>
                <p className="text-gray-600">
                  We reserve the right to suspend or delete accounts that violate our terms, engage in fraudulent activity, or negatively impact the community.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">8. Liability</h3>
                <p className="text-gray-600">
                  UniStay is a platform that connects students and landlords. We are not responsible for disputes, agreements, or quality of accommodation. Students should verify listings and landlords before committing.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">9. Governing Law</h3>
                <p className="text-gray-600">
                  These terms are governed by the laws of the Republic of Zambia.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">10. Contact</h3>
                <p className="text-gray-600">
                  For any questions about these terms, email <strong>unistayzm2@gmail.com</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* ─── CONTACT ─── */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <Mail size={20} className="text-[var(--nexora-primary)]" />
              <h2 className="text-xl font-semibold text-[var(--nexora-navy)]">Contact</h2>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <strong>Email:</strong> unistayzm2@gmail.com
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <strong>Phone:</strong> +260 0771319817 (General)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                For privacy, terms, or general enquiries, reach out anytime.
              </p>
            </div>
          </section>

          {/* Back to Home */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}