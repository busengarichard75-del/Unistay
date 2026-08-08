import Link from "next/link";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
      <div className="container-medium">
        <h1 className="text-2xl font-bold text-[var(--nexora-text-primary)] mb-6">
          How UniStay Works
        </h1>

        <div className="prose prose-blue max-w-none">
          <p className="text-sm text-[var(--nexora-text-secondary)] mb-6">
            UniStay is a student accommodation platform that connects students with verified landlords.
            Here's how it works for each role.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-xl font-semibold text-[var(--nexora-text-primary)] mb-4">
            🎓 For Students
          </h2>

          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--nexora-text-secondary)]">
            <li><strong>Browse properties</strong> – Search for accommodation near your university.</li>
            <li><strong>View details</strong> – See photos, price, amenities, and available bed spaces.</li>
            <li><strong>Request a bed</strong> – Send a booking request to the landlord.</li>
            <li><strong>Wait for approval</strong> – The landlord reviews your request.</li>
            <li><strong>Pay agent fee</strong> – Once approved, pay the K80 agent fee.</li>
            <li><strong>Receive confirmation</strong> – Get a booking confirmation with all details.</li>
            <li><strong>View landlord contact</strong> – After confirmation, you'll see the landlord's name and phone number.</li>
            <li><strong>Check in</strong> – Contact the landlord and move in.</li>
          </ol>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-xl font-semibold text-[var(--nexora-text-primary)] mb-4">
            🏠 For Landlords
          </h2>

          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--nexora-text-secondary)]">
            <li><strong>Add a listing</strong> – Provide property details, photos, bed spaces, and location.</li>
            <li><strong>Manage requests</strong> – View student booking requests.</li>
            <li><strong>Approve or reject</strong> – Accept or decline each request.</li>
            <li><strong>Track bookings</strong> – See all your confirmed bookings.</li>
            <li><strong>Contact students</strong> – After confirmation, students can see your phone number.</li>
          </ol>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-xl font-semibold text-[var(--nexora-text-primary)] mb-4">
            🔐 Security & Trust
          </h2>

          <ul className="list-disc list-inside space-y-2 text-sm text-[var(--nexora-text-secondary)]">
            <li>All bookings are verified with a unique QR code and confirmation ID.</li>
            <li>Landlord contact details are only revealed after booking confirmation.</li>
            <li>Students are verified by their university ID.</li>
            <li>Always confirm the booking status before handing over the property.</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-xl font-semibold text-[var(--nexora-text-primary)] mb-4">
            📞 Need Help?
          </h2>

          <p className="text-sm text-[var(--nexora-text-secondary)]">
            If you have any questions or need assistance, contact us:
          </p>

          <ul className="list-none space-y-1 text-sm text-[var(--nexora-text-secondary)] mt-2">
            <li>📞 <strong>General Inquiries:</strong> +260 0771319817</li>
            <li>📞 <strong>Student Support:</strong> +260 971652675</li>
            <li>📞 <strong>Landlord Support:</strong> +260 979759372</li>
          </ul>

          <p className="text-sm text-[var(--nexora-text-secondary)] mt-4">
            Or email us at <strong>support@unistay.com</strong>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}