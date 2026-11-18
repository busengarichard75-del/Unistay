// src/app/refund-policy/page.tsx
import Link from "next/link";
import { ArrowLeft, RefreshCcw, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Peza ZM",
  description: "Official refund and cancellation policy for Peza ZM, operated by Busenga Technologies.",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
      <div className="container-medium max-w-3xl">
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
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <RefreshCcw size={28} className="text-[var(--nexora-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">Refund & Cancellation Policy</h1>
          </div>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <p>
              This policy applies to all transactions made on Peza ZM, a platform operated by <strong>Busenga Technologies</strong>, a registered business name in Zambia. 
            </p>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-blue-800 font-medium flex items-start gap-2">
                <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                Our goal is to ensure a safe and fair environment for both students and service providers.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Accommodation Agent Fees (K100)</h2>
              <p className="mb-2">When a student requests a bed space and the landlord approves it, the student pays a K100 Agent Fee to confirm the booking.</p>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-600">
                <li><strong>Full Refund:</strong> If the landlord cancels the booking, or if the property is found to be fraudulent, misrepresented, or unavailable upon arrival, the student is entitled to a 100% refund of the K100 fee.</li>
                <li><strong>No Refund:</strong> If the student changes their mind after paying the fee, or fails to move in, the fee is non-refundable, as the service (securing the bed space) has already been rendered.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Accommodation Rent Payments (Future Gateway)</h2>
              <p className="mb-2">When automated rent payments are introduced, the following rules will apply:</p>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-600">
                <li><strong>Landlord Cancellation:</strong> If the landlord cancels the lease or fails to provide the room, the student receives a 100% refund of the rent and any platform fees.</li>
                <li><strong>Student Cancellation:</strong> If the student cancels more than 7 days before the move-in date, they receive a 100% refund of the rent (excluding the K100 agent fee). Cancellations within 7 days are subject to the landlord's specific approval.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Marketplace & Services</h2>
              <p className="text-gray-600">
                Peza ZM is a discovery platform. We do not process payments, hold funds, or handle delivery for items bought or services rendered through the Marketplace and Services sections. All financial transactions and refund agreements are handled <strong>directly between the buyer and the seller/provider</strong>. Busenga Technologies is not liable for disputes arising from these direct transactions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Boosts & Subscriptions</h2>
              <p className="text-gray-600">
                Payments made for listing boosts, provider subscriptions, or premium visibility are strictly <strong>non-refundable</strong> once activated, as the visibility service is delivered immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. How to Request a Refund</h2>
              <p className="mb-2">To request a refund for accommodation fees, you must contact us within 48 hours of the issue occurring.</p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
                <li>Email: <strong>pezaaccommodation@gmail.com</strong></li>
                <li>Phone/WhatsApp: <strong>+260 0771319817</strong></li>
              </ul>
              <p className="mt-3">Approved refunds will be processed back to the original payment method (Mobile Money or Bank Transfer) within 5-7 business days.</p>
            </section>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
            Last updated: November 2026. Busenga Technologies, Lusaka, Zambia.
          </div>
        </div>
      </div>
    </main>
  );
}