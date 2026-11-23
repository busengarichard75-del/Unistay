// src/app/llms.txt/route.ts
import { GUIDES } from "@/data/guides";

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pezazm.com";
  
  // ⭐ FIXED: changed g.description to g.excerpt
  const guideList = GUIDES
    .map(g => `- [${g.title}](${baseUrl}/guides/${g.slug}): ${g.excerpt || "Read this guide."}`)
    .join('\n');

  const content = `# Peza ZM

> Peza ZM is Zambia's leading student accommodation and marketplace platform. This file helps AI models find our most important articles and resources.

## Core Pages
- [Home](${baseUrl}): Find verified student rooms near campus.
- [Library](${baseUrl}/library): Free past papers and study materials.
- [Marketplace](${baseUrl}/marketplace): Buy and sell items on campus.

## Essential Guides & Articles
${guideList}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}