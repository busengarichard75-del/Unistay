import Link from "next/link";
import { Phone, Mail, MapPin, Home, HelpCircle, Shield, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-12 text-gray-700">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              About UniStayZM
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Helping students find verified accommodation close to their campus.
              Built for trust, safety, and convenience.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Heart size={16} className="text-red-400" fill="currentColor" />
              <span>Made in Zambia</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Contact
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>📞 +260 0771319817 (General)</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>📞 +260 971652675 (Student Support)</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>📞 +260 979759372 (Landlord Support)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>unistayzm2@gmail.com</span>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-400">A Nexora Tech product</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[var(--nexora-primary)]"
                >
                  <Home size={16} />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[var(--nexora-primary)]"
                >
                  <HelpCircle size={16} />
                  Help & How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[var(--nexora-primary)]"
                >
                  <Shield size={16} />
                  Trust & Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Trust & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal#privacy"
                  className="text-gray-600 transition-colors hover:text-[var(--nexora-primary)]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal#terms"
                  className="text-gray-600 transition-colors hover:text-[var(--nexora-primary)]"
                >
                  Terms of Service
                </Link>
              </li>
              <li className="text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  Lusaka, Zambia
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} UniStayZM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}