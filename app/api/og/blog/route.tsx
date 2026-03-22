import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function truncateWithEllipsis(text: string, maxLength: number): string {
  const normalized = text.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength).trimEnd().replace(/,+$/g, '');
  return `${truncated}...`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Engineering Post';
    const description = searchParams.get('description') || '';
    const displayDescription = truncateWithEllipsis(description, 170);
    const date = searchParams.get('date') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#030303',
            // Dot pattern background
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '30px 30px',
            padding: '60px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle Violet Glow */}
          <div 
            style={{
              position: 'absolute',
              bottom: '-10%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '100%',
            }} 
          />

          {/* Content Wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Category/Tag style accent */}
            <div style={{ 
              width: '40px', 
              height: '4px', 
              background: '#8b5cf6', 
              borderRadius: '2px',
              marginBottom: '10px'
            }} />

            <h1 style={{
              fontSize: '56px',
              fontWeight: '300',
              color: 'white',
              lineHeight: '1.1',
              margin: 0,
              letterSpacing: '-0.04em',
            }}>
              {title}
            </h1>

            {displayDescription && (
              <p style={{
                fontSize: '22px',
                color: 'rgba(255, 255, 255, 0.4)',
                lineHeight: '1.5',
                fontWeight: '300',
                margin: '10px 0 0 0',
                maxWidth: '90%',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {displayDescription}
              </p>
            )}
          </div>

          {/* Minimal Footer */}
          <div style={{ 
            marginTop: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <span style={{ 
              fontSize: '16px', 
              color: 'rgba(255,255,255,0.3)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em' 
            }}>
              {date}
            </span>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response('Failed to generate image', { status: 500 });
  }
}