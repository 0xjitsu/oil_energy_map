import { ImageResponse } from 'next/og';
import { decodeScenario, SCENARIO_PARAM } from '@/lib/scenario-url';
import { calculatePumpPrice } from '@/lib/scenario-engine';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/**
 * Dynamic Open Graph image for a shared scenario. This is a Route Handler
 * rather than the `opengraph-image` special file because only a Route Handler
 * receives the request URL — the scenario lives entirely in the `?s=` query
 * string, which `opengraph-image.tsx` cannot see.
 */
export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get(SCENARIO_PARAM);
  const params = decodeScenario(raw);
  const result = calculatePumpPrice(params);

  const riskTheme = {
    green: { label: 'STABLE', color: '#22c55e' },
    yellow: { label: 'ELEVATED', color: '#f59e0b' },
    red: { label: 'CRISIS', color: '#ef4444' },
  }[result.riskLevel];

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

        {/* Risk glow */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '440px',
            height: '440px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${riskTheme.color}22 0%, transparent 70%)`,
          }}
        />

        {/* Eyebrow + risk badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            PH Oil Intelligence · Modeled Scenario
          </div>
          <div
            style={{
              display: 'flex',
              padding: '8px 20px',
              borderRadius: '20px',
              background: `${riskTheme.color}26`,
              color: riskTheme.color,
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '3px',
            }}
          >
            {riskTheme.label}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '60px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.1,
            marginTop: '36px',
            display: 'flex',
          }}
        >
          ₱{result.gasoline.toFixed(2)}/L gasoline if this shock hits.
        </div>

        {/* Scenario inputs */}
        <div
          style={{
            fontSize: '22px',
            color: 'rgba(255,255,255,0.55)',
            marginTop: '20px',
            display: 'flex',
          }}
        >
          Brent ${params.brentPrice}/bbl · Hormuz blocked {params.hormuzWeeks} wk · ₱
          {params.forexRate.toFixed(2)}/USD
          {params.refineryOffline ? ' · Bataan refinery offline' : ''}
        </div>

        {/* Price cards */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
          {[
            { label: 'EST. GASOLINE', value: `₱${result.gasoline.toFixed(2)}/L`, color: '#ef4444' },
            { label: 'EST. DIESEL', value: `₱${result.diesel.toFixed(2)}/L`, color: '#f97316' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '24px',
                borderRadius: '12px',
                background: 'rgba(10, 15, 26, 0.7)',
                border: `1px solid ${kpi.color}33`,
                borderTop: `2px solid ${kpi.color}`,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {kpi.label}
              </div>
              <div style={{ fontSize: '40px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
                {kpi.value}
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
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
          }}
        >
          <span>energy-intelligence-map.vercel.app</span>
          <span>Model your own scenario →</span>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
