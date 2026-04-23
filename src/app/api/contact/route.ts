// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = 'bernamisa17@gmail.com';

export async function POST(req: Request) {
  try {
    const { name, organization, storeCount, message } = await req.json() as {
      name: string;
      organization: string;
      storeCount: string;
      message: string;
    };

    if (!name || !organization || !storeCount) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    // ── 1. Save to Supabase ──────────────────────────────────────────────────
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name,
        organization,
        store_count: storeCount,
        message: message || '',
      }),
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      console.error('[contact] Supabase insert failed:', err);
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
    }

    // ── 2. Email notification via Resend (optional — skipped if key absent) ──
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RES/RAP Services <onboarding@resend.dev>',
          to: [NOTIFY_EMAIL],
          subject: `New RES/RAP Brief Request — ${organization} (${storeCount} stores)`,
          html: `
            <h2>New brief request</h2>
            <table style="border-collapse:collapse;font-family:monospace;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${name}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Organization</td><td>${organization}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Store count</td><td>${storeCount}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">Message</td><td>${message || '—'}</td></tr>
            </table>
          `,
        }),
      }).catch((e) => console.warn('[contact] Resend notification failed:', e));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[contact] Unexpected error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
