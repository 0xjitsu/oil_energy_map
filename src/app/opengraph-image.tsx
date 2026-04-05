import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PH Oil Intelligence Dashboard — Real-time Philippine energy supply chain monitoring';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #060a10 0%, #0a1628 50%, #0f1d32 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Philippine flag accent bars */}
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }}>
          <div style={{ flex: 1, height: '4px', background: '#0038a8' }} />
          <div style={{ flex: 1, height: '4px', background: '#ce1126' }} />
          <div style={{ flex: 1, height: '4px', background: '#fcd116' }} />
        </div>

        {/* Glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '200px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Philippines Supply Chain
          </div>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.1,
            }}
          >
            Energy Intelligence Map
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
          {[
            { label: 'BRENT CRUDE', value: '$107.8', delta: '+5.4%', color: '#3b82f6' },
            { label: 'PHP / USD', value: '₱60.69', delta: '+0.5%', color: '#8b5cf6' },
            { label: 'GASOLINE', value: '₱65.85/L', delta: '+2.0%', color: '#ef4444' },
            { label: 'DIESEL', value: '₱62.87/L', delta: '+2.2%', color: '#f97316' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(10, 15, 26, 0.7)',
                border: `1px solid ${kpi.color}33`,
                borderTop: `2px solid ${kpi.color}`,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ef4444',
                }}
              >
                ▲ {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            <span>10,469 Stations</span>
            <span>Live RSS Feeds</span>
            <span>Monte Carlo Simulation</span>
            <span>Scenario Planning</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            LIVE
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
