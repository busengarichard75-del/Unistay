// src/components/seo/ArticleJsonLd.tsx
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  datePublished: string; // ISO string
  dateModified: string;  // ISO string
}

export function ArticleJsonLd({
  title,
  description,
  url,
  imageUrl,
  authorName,
  datePublished,
  dateModified,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": imageUrl ? [imageUrl] : [],
    "datePublished": datePublished,
    "dateModified": dateModified,
    "author": [{
      "@type": "Organization", // Using Organization since it's Peza content
      "name": authorName,
      "url": "https://pezazm.com/about/busenga-technologies"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Peza ZM",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pezazm.com/favicon.ico.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}