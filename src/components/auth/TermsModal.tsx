"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

interface TermsModalProps {
  userId: string;
  onAccept: () => void;
}

export function TermsModal({ userId, onAccept }: TermsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        hasAcceptedTerms: true,
      });
      onAccept();
      toast.success("Thank you for accepting the terms!");
    } catch {
      toast.error("Failed to save your acceptance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-bold text-[var(--nexora-navy)]">Terms & Conditions</h2>
          <button
            onClick={() => {
              if (!window.confirm("You must accept the terms to continue. Are you sure you want to leave?")) return;
              // Allow exit but they won't be able to use the app
            }}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900">Please read and accept the terms to continue using UniStayZM.</p>

          <div>
            <h3 className="font-semibold text-gray-800">1. Acceptance of Terms</h3>
            <p className="text-gray-600">
              By using UniStayZM, you agree to these terms. If you do not agree, please discontinue use.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">2. User Roles</h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
              <li><strong>Student:</strong> Can browse, search, and request bookings.</li>
              <li><strong>Landlord:</strong> Can list properties, manage bookings, and approve/reject requests.</li>
              <li><strong>Admin:</strong> Manages platform integrity, verifies listings and payments.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">3. Listings &amp; Accuracy</h3>
            <p className="text-gray-600">
              Landlords must provide accurate information. UniStay verifies listings but does not guarantee accuracy in real‑time.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">4. Booking Process &amp; Fees</h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
              <li>Students request a bed; landlords approve or reject.</li>
              <li>Approved bookings require a <strong>K100 agent fee</strong>.</li>
              <li>Landlords can pay <strong>K100 per boost</strong> for 30 days.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">5. Cancellation</h3>
            <p className="text-gray-600">
              Students can cancel before confirmation. After confirmation, cancellations are handled case‑by‑case.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">6. User Conduct</h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600">
              <li>Do not post fake or misleading listings.</li>
              <li>Do not spam, harass, or scam other users.</li>
              <li>Be respectful in all communications.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">7. Governing Law</h3>
            <p className="text-gray-600">These terms are governed by the laws of the Republic of Zambia.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">8. Contact</h3>
            <p className="text-gray-600">
              For questions, email <strong>unistayzm2@gmail.com</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)] transition-colors disabled:opacity-50"
          >
            <Check size={18} />
            {isLoading ? "Saving..." : "I Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}