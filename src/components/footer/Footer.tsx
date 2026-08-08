import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-white px-4 py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-3">
        {/* About Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">About</h3>
          <p className="text-sm text-gray-500">
            UniStayZM helps university students discover verified accommodation close
            to where they study.
          </p>
        </div>

        {/* Contact Section – Updated with 3 numbers */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Contact</h3>
          <div className="space-y-1 text-sm text-gray-500">
            <p>📞 +260 0771319817 (General)</p>
            <p>📞 +260 971652675 (Landlord Support)</p>
            <p>📞 +260 979759372 (Student Support)</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">A Nexora Tech product</p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Quick Links</h3>
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
              Home
            </Link>
            {/* Add more links here if needed */}
          </div>
        </div>
      </div>
      <div>
  <h3 className="mb-2 text-sm font-semibold text-gray-900">Quick Links</h3>
  <div className="flex flex-col gap-1">
    <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
      Home
    </Link>
    {/* ✅ NEW: Help link */}
    <Link href="/help" className="text-sm text-gray-500 hover:text-blue-600">
      Help & How It Works
    </Link>
  </div>
</div>

      <p className="mt-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} UniStayZM. All rights reserved.
      </p>
    </footer>
  );
}