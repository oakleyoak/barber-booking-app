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
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'; // Default to Resend's testing domain

    if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
      return new Response('Missing environment configuration', { status: 500 });
    }

    let to: string | undefined;
    let subject: string | undefined;
    let html: string | undefined;

    if (bookingId) {
      // fetch booking + customer + staff using REST endpoint
      // Note: our schema uses user_id for staff, customer_id for customer
      const supabaseRes = await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=id,price,date,time,service,customer_name,customer:customer_id(name,email),staff:user_id(name,email)`,
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

      // If customer doesn't have email, send to staff email as fallback
      to = customer.email || staff.email;
      if (!to) return new Response('No email found for customer or staff', { status: 400 });

      subject = `New Appointment: ${booking.service || 'Service'} - ${booking.date} ${booking.time}`;
      html = `
        <h2>New Appointment Booked</h2>
        <p><strong>Customer:</strong> ${booking.customer_name || customer.name || 'Unknown'}</p>
        <p><strong>Staff:</strong> ${staff.name || 'Staff Member'}</p>
        <p><strong>Service:</strong> ${booking.service || 'Service'}</p>
        <p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
        <p><strong>Price:</strong> ₺${booking.price || 0}</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <hr>
        <p><em>This is an automated notification from Edge & Co Barbershop.</em></p>
      `;
    } else if (body?.to && body?.html) {
      subject = `New Appointment: ${booking.service || 'Service'} - ${booking.date} ${booking.time}`;
      html = `
        <h2>New Appointment Booked</h2>
        <p><strong>Customer:</strong> ${booking.customer_name || customer.name || 'Unknown'}</p>
        <p><strong>Staff:</strong> ${staff.name || 'Staff Member'}</p>
        <p><strong>Service:</strong> ${booking.service || 'Service'}</p>
        <p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
        <p><strong>Price:</strong> ₺${booking.price || 0}</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <hr>
        <p><em>This is an automated notification from Edge & Co Barbershop.</em></p>
      `;
    } else if (body?.to && body?.html) {
      to = body.to;
      subject = body.subject || 'Message from Edge & Co Barbershop';
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
        from: FROM_EMAIL,
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
