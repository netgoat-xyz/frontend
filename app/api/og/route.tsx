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

    // Get parameters
    const title = searchParams.get('title') || 'NetGoat Security';
    const description = searchParams.get('description') || 'Next-Generation Web Application Firewall';
    const displayDescription = truncateWithEllipsis(description, 90);
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Logo / Brand mark placeholder */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(45deg, #ef4444, #7f1d1d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0,
              }}
            >
              NetGoat
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '72px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1.1',
                margin: 0,
                maxWidth: '900px',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: '36px',
                color: '#a3a3a3',
                margin: 0,
                maxWidth: '800px',
                lineHeight: '1.4',
              }}
            >
              {displayDescription}
            </p>
          </div>
          
          <div 
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '80px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div 
              style={{
                color: '#ef4444',
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
              }}
            >
              netgoat.xyz
            </div>
          </div>
        </div>
      ),
      {
        width: 700,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Failed to generate OG image', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
