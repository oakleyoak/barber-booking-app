// Supabase Edge Function: send-email
// Expects POST body: { bookingId: string } or { to, subject, html } for ad-hoc sends
// Requires secrets set in Supabase: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

export default async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await req.json().catch(() => ({}));
    const bookingId = body?.bookingId || body?.id;

    const SUPABASE_URL = Deno.env.get('PROJECT_URL');
    const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
      return new Response('Missing environment configuration', { status: 500 });
    }

    let to: string | undefined;
    let subject: string | undefined;
    let html: string | undefined;

    if (bookingId) {
      // fetch booking + customer + staff using REST endpoint
      const supabaseRes = await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=id,price,date,time,customer:customer_id(name,email),staff:staff_id(name)`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            Accept: 'application/json'
          }
        }
      );

      if (!supabaseRes.ok) {
        const t = await supabaseRes.text();
        return new Response(`Supabase fetch failed: ${supabaseRes.status} ${t}`, { status: 502 });
      }
      const rows = await supabaseRes.json();
      if (!Array.isArray(rows) || rows.length === 0) return new Response('Booking not found', { status: 404 });

      const booking = rows[0];
      const customer = booking.customer ?? {};
      const staff = booking.staff ?? {};

      if (!customer.email) return new Response('Customer missing email', { status: 400 });

      to = customer.email;
      subject = `Appointment booked: ${booking.date} ${booking.time}`;
      html = `
        <p>Hi ${customer.name || 'there'},</p>
        <p>Your appointment with ${staff.name || 'our staff'} is booked for ${booking.date} ${booking.time}.</p>
        <p>Booking ID: ${booking.id} — Price: ${booking.price}</p>
      `;
    } else if (body?.to && body?.html) {
      to = body.to;
      subject = body.subject || 'Message from booking app';
      html = body.html;
    } else {
      return new Response('Missing bookingId or to/html', { status: 400 });
    }

    // Send via Resend REST API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'you@yourdomain.com', // replace with a verified from address in Resend
        to,
        subject,
        html
      })
    });

    if (!resendRes.ok) {
      const t = await resendRes.text();
      return new Response(`Resend error: ${resendRes.status} ${t}`, { status: 502 });
    }
    const result = await resendRes.json();
    return new Response(JSON.stringify({ ok: true, result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(String(err?.message || err), { status: 500 });
  }
}
