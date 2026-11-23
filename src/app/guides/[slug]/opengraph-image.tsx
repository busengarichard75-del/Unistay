import { ImageResponse } from 'next/og';
import { getGuideBySlug } from '@/data/guides';

export const runtime = 'edge';
export const alt = 'Peza Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const guide = getGuideBySlug(params.slug);
  const title = guide?.title || 'Peza ZM Guide';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1A365D, #4A90D9)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20 }}>Peza ZM</div>
        <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 30, marginTop: 40, opacity: 0.8 }}>Read the full guide at pezazm.com</div>
      </div>
    ),
    { ...size }
  );
}