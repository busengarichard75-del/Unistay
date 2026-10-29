// src/data/guides.ts

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  content: string; // HTML content
}

export const GUIDES: Guide[] = [
  {
    slug: "unza-student-accommodation-guide",
    title: "The Ultimate Guide to Finding Student Accommodation near UNZA",
    excerpt: "Looking for a room near the University of Zambia? Here is a complete breakdown of the best areas, average prices, and how to avoid scams in Lusaka.",
    date: "October 29, 2026",
    readTime: "5 min read",
    content: `
      <h2>Finding a place near UNZA</h2>
      <p>Finding a place to stay is one of the most stressful parts of starting university. Whether you are a first-year student looking for a hostel or a continuing student looking for a private apartment, the search around the University of Zambia (UNZA) can be overwhelming.</p>
      <p>This guide covers the best areas to live, average rental costs, and how Peza makes finding a safe, verified room much easier.</p>

      <h2>Best Areas to Live Near UNZA</h2>
      <p>The areas around UNZA are very diverse, ranging from bustling student towns to quiet residential neighborhoods. Here are the top three areas:</p>
      <ul>
        <li><strong>Munali & Mtendere:</strong> The closest and most popular areas. You will find a mix of self-contained rooms, hostels, and flats. It is very lively but can be noisy at times.</li>
        <li><strong>Chelston:</strong> A bit further away (you might need a bus), but much quieter and slightly cheaper. Great for students who prefer a peaceful environment for studying.</li>
        <li><strong>Ibex Hill & State Lodge:</strong> The more expensive, upscale areas. If you have a higher budget and want maximum security and privacy, these areas are ideal.</li>
      </ul>

      <h2>How Much Does It Cost?</h2>
      <p>Prices vary significantly depending on the area and the type of accommodation. Here is a rough estimate for the 2026 academic year:</p>
      <ul>
        <li><strong>Shared Hostel (1 bed):</strong> K800 – K1,200 per month.</li>
        <li><strong>Single Self-Contained Room:</strong> K1,500 – K2,500 per month.</li>
        <li><strong>Two-Bedroom Flat:</strong> K3,500 – K5,000 per month (usually shared between 2-3 students).</li>
      </ul>

      <h2>How to Avoid Accommodation Scams</h2>
      <p>Unfortunately, scammers often target desperate students. To protect yourself:</p>
      <ul>
        <li><strong>Never pay before viewing:</strong> If a landlord asks for a deposit before you (or a trusted friend) have seen the property, walk away.</li>
        <li><strong>Verify the landlord:</strong> On Peza, look for the <strong>✅ Verified Landlord</strong> badge. We only give this badge to landlords whose property details and phone numbers have been manually checked by our admin team.</li>
        <li><strong>Read the booking process:</strong> Peza allows you to request a bed space. The landlord must approve you first. Do not send money on the side.</li>
      </ul>

      <h2>Ready to find your room?</h2>
      <p>Instead of walking around Lusaka all day, check out the verified listings currently available near UNZA right here on Peza. You can filter by price, view photos, and contact the landlord directly on WhatsApp.</p>
    `
  }
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}