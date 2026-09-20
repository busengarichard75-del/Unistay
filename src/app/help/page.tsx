import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  ShoppingBag,
  Wrench,
  Home,
  ShieldCheck,
  Sparkles,
  Zap,
  Heart,
  Search,
  MessageCircle,
  AlertTriangle,
  Users,
  Building2,
  Store,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How Peza Works — Help Center",
  description:
    "Learn how Peza works for students, landlords, service providers, and product sellers. Booking process, boosts, flash deals, library contributions, and more.",
  keywords: [
    "how Peza works",
    "student accommodation Zambia",
    "booking help",
    "how to list a service",
    "Peza help",
    "student marketplace guide",
  ],
  alternates: { canonical: "/help" },
  openGraph: {
    type: "article",
    siteName: "Peza",
    title: "How Peza Works — Help Center",
    description:
      "Everything you need to know about using Peza — accommodation, services, marketplace, and the student library.",
    url: "/help",
  },
  robots: { index: true, follow: true },
};

function SectionCard({
  id,
  icon,
  title,
  subtitle,
  children,
  accent = "blue",
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "blue" | "indigo" | "orange" | "emerald" | "amber" | "red";
}) {
  const accentClasses: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    indigo: "from-indigo-500 to-purple-600",
    orange: "from-orange-500 to-pink-600",
    emerald: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-600",
    red: "from-red-500 to-pink-600",
  };

  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses[accent]} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--nexora-navy)] sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-primary)]/10 text-[11px] font-bold text-[var(--nexora-primary)]">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-gray-700">{children}</p>
    </div>
  );
}

function Callout({
  tone = "info",
  children,
}: {
  tone?: "info" | "tip" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    tip: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  const icons = {
    info: <Sparkles size={14} />,
    tip: <Sparkles size={14} />,
    warning: <AlertTriangle size={14} />,
  };
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${styles[tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <div>{children}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:border-[var(--nexora-primary)]/40 hover:bg-blue-50/40"
    >
      <span className="text-[var(--nexora-primary)]">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight size={12} className="text-gray-300" />
    </a>
  );
}

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
      <div className="container-medium">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)] sm:text-3xl">
            📚 How Peza Works
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
            Peza is your all-in-one campus platform — accommodation, services,
            marketplace, and a free student library. Everything explained in one
            place.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="#students"
            icon={<Home size={16} />}
            label="For Students"
          />
          <QuickLink
            href="#landlords"
            icon={<Building2 size={16} />}
            label="For Landlords"
          />
          <QuickLink
            href="#providers"
            icon={<Wrench size={16} />}
            label="For Service Providers"
          />
          <QuickLink
            href="#sellers"
            icon={<ShoppingBag size={16} />}
            label="For Product Sellers"
          />
          <QuickLink
            href="#library"
            icon={<BookOpen size={16} />}
            label="Student Library"
          />
          <QuickLink
            href="#boosts"
            icon={<Zap size={16} />}
            label="Boosts & Deals"
          />
          <QuickLink
            href="#trust"
            icon={<ShieldCheck size={16} />}
            label="Trust & Safety"
          />
          <QuickLink
            href="#contact"
            icon={<MessageCircle size={16} />}
            label="Contact Us"
          />
        </div>

        <div className="space-y-6">
          <SectionCard
            id="students"
            icon={<Home size={20} />}
            title="🎓 For Students"
            subtitle="Find a room, book it, and move in — all with confidence."
            accent="blue"
          >
            <p className="text-sm font-semibold text-gray-800">
              Booking a room
            </p>
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Browse accommodation.</strong> From the homepage, search
                by campus, price, gender preference, or distance. Tap any card to
                see photos, amenities, rooms, and bed spaces.
              </Step>
              <Step n={2}>
                <strong>Request a bed.</strong> Pick an available bed and send a
                booking request. The landlord is notified instantly.
              </Step>
              <Step n={3}>
                <strong>Wait for approval.</strong> The landlord reviews your
                request — usually within a few hours. You&apos;ll get a push
                notification and email when they respond.
              </Step>
              <Step n={4}>
                <strong>Pay the K100 agent fee.</strong> Once approved, pay via
                Mobile Money. This confirms your booking and locks in your bed.
              </Step>
              <Step n={5}>
                <strong>Get your Booking Pass.</strong> A confirmation with a QR
                code and unique ID appears in your dashboard. You&apos;ll also
                receive an email copy.
              </Step>
              <Step n={6}>
                <strong>See the landlord&apos;s contact.</strong> After
                confirmation, the landlord&apos;s name and phone number unlock in
                your dashboard.
              </Step>
              <Step n={7}>
                <strong>Check in.</strong> Call the landlord, arrange a visit, and
                move in.
              </Step>
            </div>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              Other things you can do
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>❤️ Save listings.</strong> Tap the heart on any room,
                service, or product to save it. Your saved list is stored on your
                device.
              </li>
              <li>
                <strong>🛠️ Book services.</strong> Barbers, printing, tutoring,
                food delivery — all contact directly via WhatsApp.
              </li>
              <li>
                <strong>🛒 Shop the marketplace.</strong> Buy phones, books,
                electronics, and more from students near your campus.
              </li>
              <li>
                <strong>📚 Use the student library.</strong> Free past papers,
                notes, summaries, and study guides — shared by students, for
                students.
              </li>
              <li>
                <strong>🗺️ Explore the Peza Map.</strong> See every room, service,
                and product pinned around your campus.
              </li>
            </ul>

            <Callout tone="tip">
              <strong>Pro tip:</strong> Save rooms to your wishlist while
              browsing. You can compare them later in one place.
            </Callout>
          </SectionCard>

          <SectionCard
            id="landlords"
            icon={<Building2 size={20} />}
            title="🏠 For Landlords"
            subtitle="List your property, receive requests, and manage bookings."
            accent="emerald"
          >
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Sign up as a landlord.</strong> Enter your name, phone,
                and university area. Your account is verified by admin before
                listings go live.
              </Step>
              <Step n={2}>
                <strong>Add a listing.</strong> Provide title, photos (up to 5),
                price, amenities, distance from campus, gender preference, and
                bed spaces. Pin your exact location on the map.
              </Step>
              <Step n={3}>
                <strong>Manage bed spaces.</strong> Mark beds as available or
                occupied as students move in and out.
              </Step>
              <Step n={4}>
                <strong>Review booking requests.</strong> See every request with
                the student&apos;s name, phone, and requested bed. Approve or
                reject in one tap.
              </Step>
              <Step n={5}>
                <strong>Get paid.</strong> Once a student pays the K100 agent
                fee, the booking is confirmed. Your contact info is shared with
                them — and theirs with you.
              </Step>
              <Step n={6}>
                <strong>Track performance.</strong> From your dashboard, see
                views, booking requests, and confirmed bookings per listing.
              </Step>
            </div>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              Ways to grow faster
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>⚡ Boost your listing</strong> — appear at the top of the
                homepage and browse pages. K100 for 30 days.
              </li>
              <li>
                <strong>✅ Get verified</strong> — verified landlords get a badge
                and up to 3× more views.
              </li>
              <li>
                <strong>📸 Add more photos</strong> — listings with 3+ photos
                convert significantly better.
              </li>
            </ul>

            <Callout tone="info">
              <strong>Listing capacity:</strong> Unlimited. Add as many
              properties as you own.
            </Callout>
          </SectionCard>

          <SectionCard
            id="providers"
            icon={<Wrench size={20} />}
            title="🛠️ For Service Providers"
            subtitle="Barbers, printers, tutors, photographers, food vendors — get discovered."
            accent="blue"
          >
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Sign up as a service provider.</strong> Provide your
                business name, WhatsApp number, and university area.
              </Step>
              <Step n={2}>
                <strong>Wait for verification.</strong> Our team reviews your
                account. Once approved, you can publish listings.
              </Step>
              <Step n={3}>
                <strong>Create your first service.</strong> Pick a category
                (Food, Barber, Printing, Tech, Tutoring, Delivery, Gym, Laundry,
                Photography, Restaurants, Groceries, Transport, or Other), add
                photos, pricing, availability hours, and payment methods.
              </Step>
              <Step n={4}>
                <strong>Choose your pricing style.</strong> &quot;Starting
                from K__&quot; or &quot;Contact for price&quot; — you decide.
              </Step>
              <Step n={5}>
                <strong>Add an online option.</strong> If you can serve remotely,
                mark your listing as &quot;Online&quot; — no map pin needed and
                you get a 🌐 badge.
              </Step>
              <Step n={6}>
                <strong>Get contacted directly.</strong> Students tap WhatsApp to
                reach you. Your number is never shown publicly — it&apos;s a
                deep link only.
              </Step>
            </div>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              Boost your visibility
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>⚡ Boost</strong> — Daily K4.99 · Weekly K24.99 · Monthly
                K49.99. Jump to the top of your category.
              </li>
              <li>
                <strong>🔥 Flash Deals</strong> — set a 5–90% discount for 1 day,
                1 week, or 1 month. Free feature. Shows a red badge and
                strikethrough price.
              </li>
              <li>
                <strong>📸 Add a profile picture</strong> — providers with
                photos get 3× more clicks.
              </li>
            </ul>

            <Callout tone="tip">
              <strong>Pro tip:</strong> Services with real photos + clear pricing
              get the most WhatsApp taps. Skip the stock images.
            </Callout>
          </SectionCard>

          <SectionCard
            id="sellers"
            icon={<ShoppingBag size={20} />}
            title="🛒 For Product Sellers"
            subtitle="Sell phones, books, electronics, fashion, and more to students near you."
            accent="orange"
          >
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Sign up as a provider.</strong> Same process as service
                providers — your account is reviewed and verified by admin.
              </Step>
              <Step n={2}>
                <strong>Choose &quot;Product&quot; when creating a listing.</strong>{" "}
                Fill in name, price, category, condition, photos, and location.
              </Step>
              <Step n={3}>
                <strong>Set your stock count.</strong> Let buyers know how many
                you have — &quot;10 available&quot;, &quot;Only 2 left!&quot;, or
                leave it empty for one-off items.
              </Step>
              <Step n={4}>
                <strong>Pick a condition.</strong> New, Like New, Used, or For
                Parts — buyers filter by this.
              </Step>
              <Step n={5}>
                <strong>List it.</strong> Your product appears immediately in the
                marketplace with your name and avatar pinned to the photo.
              </Step>
              <Step n={6}>
                <strong>Sell via WhatsApp.</strong> Students tap the button and
                message you directly. You control the deal.
              </Step>
            </div>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              Stock management
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>Quantity is optional.</strong> Leave it blank for
                one-off items — no badge shown.
              </li>
              <li>
                <strong>Low stock urgency.</strong> When you have ≤3 left, the
                card shows &quot;Only N left&quot; in amber — buyers act faster.
              </li>
              <li>
                <strong>0 means out of stock.</strong> Card shows &quot;Out of
                stock&quot; in red without marking the listing sold.
              </li>
              <li>
                <strong>Update anytime.</strong> Edit the listing to change the
                number after each sale.
              </li>
            </ul>

            <Callout tone="warning">
              <strong>Heads up:</strong> Peza is a discovery platform. All
              payments, deliveries, and handovers happen directly between you and
              the buyer — usually via WhatsApp.
            </Callout>
          </SectionCard>

          <SectionCard
            id="library"
            icon={<BookOpen size={20} />}
            title="📚 Student Library"
            subtitle="Free study materials — past papers, notes, summaries, and study guides."
            accent="indigo"
          >
            <p className="text-sm font-semibold text-gray-800">
              Browsing & reading
            </p>
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Browse by category or university.</strong> Filter by Past
                Papers, Notes, Summaries, or Study Guides — and by campus.
              </Step>
              <Step n={2}>
                <strong>Preview before opening.</strong> Click any material to
                read a preview directly inside Peza — no download needed.
              </Step>
              <Step n={3}>
                <strong>Open in Drive to save.</strong> One tap opens the
                original file in Google Drive. Save offline if you want.
              </Step>
            </div>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              Contributing materials
            </p>
            <div className="space-y-2.5">
              <Step n={1}>
                <strong>Upload your file to Google Drive.</strong> Set sharing
                to <strong>&quot;Anyone with the link → Viewer&quot;</strong>.
                Copy the link.
              </Step>
              <Step n={2}>
                <strong>Submit on Peza.</strong> Click &quot;Share material&quot;
                in the library, paste the Drive link, add a title, description,
                category, and course code.
              </Step>
              <Step n={3}>
                <strong>Wait for review.</strong> Our team verifies quality
                within a few hours. You&apos;ll see the status in
                &quot;My Uploads&quot;.
              </Step>
              <Step n={4}>
                <strong>Goes live.</strong> Once approved, your material appears
                for every student on Peza. You get credit as the contributor.
              </Step>
            </div>

            <Callout tone="tip">
              <strong>Peza doesn&apos;t host files</strong> — we link directly
              to your Google Drive. You keep full control and can update or
              remove your file anytime.
            </Callout>

            <Callout tone="warning">
              <strong>Please don&apos;t upload:</strong> copyrighted textbooks,
              other students&apos; work without permission, or anything
              containing personal information. Reported materials are removed.
            </Callout>
          </SectionCard>

          <SectionCard
            id="boosts"
            icon={<Zap size={20} />}
            title="⚡ Boosts & Flash Deals"
            subtitle="How to get noticed faster and drive more clicks."
            accent="amber"
          >
            <p className="text-sm font-semibold text-gray-800">
              ⚡ Boosts (paid visibility)
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>What it does:</strong> Pins your listing to the top of
                browse pages and the homepage. Gets a gold ⚡ badge.
              </li>
              <li>
                <strong>Pricing:</strong> Daily K4.99 · Weekly K24.99 · Monthly
                K49.99.
              </li>
              <li>
                <strong>How to pay:</strong> Choose your tier, pay via Mobile
                Money to the shown number, then tap &quot;I&apos;ve paid.&quot;
                Admin activates within minutes.
              </li>
              <li>
                <strong>Real impact:</strong> Boosted listings typically receive
                3–10× more views in the first week.
              </li>
            </ul>

            <p className="pt-3 text-sm font-semibold text-gray-800">
              🔥 Flash Deals (free)
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>What it does:</strong> Sets a 5–90% discount on your
                listing with a red 🔥 badge, crossed-out original price, and live
                countdown.
              </li>
              <li>
                <strong>Duration:</strong> Daily, Weekly, or Monthly.
              </li>
              <li>
                <strong>Auto-expires:</strong> The discount ends automatically —
                no need to remove it manually.
              </li>
              <li>
                <strong>Best for:</strong> Clearing stock, launching a new
                service, or standing out in a crowded category.
              </li>
            </ul>

            <Callout tone="info">
              <strong>Combine them:</strong> Boost + Flash Deal = your listing
              sits at the top with a big red discount badge. Highest converting
              combo on the platform.
            </Callout>
          </SectionCard>

          <SectionCard
            id="trust"
            icon={<ShieldCheck size={20} />}
            title="🔐 Trust & Safety"
            subtitle="How we keep Peza safe for everyone."
            accent="emerald"
          >
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>
                <strong>Verified providers.</strong> Every service provider and
                product seller is reviewed by our team before they can list.
              </li>
              <li>
                <strong>Verified landlords.</strong> Get a blue ✅ badge once
                your property is confirmed. Verified listings get 3× more views.
              </li>
              <li>
                <strong>Booking QR codes.</strong> Every accommodation booking
                gets a unique QR code and confirmation ID. Verify with us if
                you&apos;re ever unsure.
              </li>
              <li>
                <strong>Direct WhatsApp contact.</strong> Phone numbers are never
                shown publicly — all contact happens via deep links.
              </li>
              <li>
                <strong>Report button.</strong> Every service, product, and
                library entry has a report option. Our admin team reviews every
                report within hours.
              </li>
              <li>
                <strong>Admin moderation.</strong> All library uploads are
                reviewed before going live. Suspicious listings can be hidden
                instantly.
              </li>
            </ul>

            <Callout tone="warning">
              <strong>Watch out for:</strong> Anyone asking for money outside
              Peza&apos;s system, offering &quot;too good to be true&quot; deals,
              or pushing you to leave WhatsApp. Report it — we act fast.
            </Callout>
          </SectionCard>

          <SectionCard
            id="contact"
            icon={<MessageCircle size={20} />}
            title="📞 Contact & Support"
            subtitle="We're a small team — we reply fast."
            accent="blue"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Call or WhatsApp
                </p>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>
                      <strong>General:</strong> +260 0771319817
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>
                      <strong>Student Support:</strong> +260 971652675
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>
                      <strong>Landlord Support:</strong> +260 979759372
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400" />
                  <span>pezaaccommodation@gmail.com</span>
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  We usually reply within a few hours during the day.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Follow Peza
              </span>
              <a
                href="https://www.facebook.com/profile.php?id=61577687234055"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                Facebook
              </a>
              <a
                href="https://tiktok.com/@nexoratech_0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                TikTok
              </a>
            </div>
          </SectionCard>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}