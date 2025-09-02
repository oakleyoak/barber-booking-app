// Supabase Edge Function — send-notification
// Deno runtime. This function uses SMTP_* environment variables to send email via SMTP
// Required env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Optional env vars used for Supabase lookups: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

declare const Deno: any;

// @ts-ignore: remote import for Deno runtime
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

async function sendSmtpMessage(client: SmtpClient, from: string, to: string | string[], subject: string, html?: string, text?: string) {
  const toList = Array.isArray(to) ? to : [to];
  for (const recipient of toList) {
    await client.send({
      from,
      to: recipient,
      subject,
      content: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
      html
    });
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));

    const SMTP_HOST = Deno.env.get('SMTP_HOST');
    const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587');
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'noreply@example.com';

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return new Response(JSON.stringify({ error: 'Missing SMTP configuration in environment' }), { status: 500 });
    }

    const client = new SmtpClient();
    await client.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
      // enable TLS where available
      tls: SMTP_PORT === 465 ? true : false,
    });

    // Direct send if payload has to/subject/html
    if (body.to && body.subject && (body.html || body.text)) {
      const to = Array.isArray(body.to) ? body.to.map((t: any) => (typeof t === 'string' ? t : t.email)) : (typeof body.to === 'string' ? body.to : body.to.email);
      await sendSmtpMessage(client, SMTP_FROM, to, body.subject, body.html, body.text);
      await client.close();
      return new Response(JSON.stringify({ status: 'ok', sent: Array.isArray(to) ? to.length : 1 }), { status: 200 });
    }

    // Booking based flows
    if (body.type && body.booking_id) {
      const SUPABASE_URL = Deno.env.get('CUSTOM_SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('CUSTOM_SERVICE_ROLE_KEY');
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        await client.close();
        return new Response(JSON.stringify({ error: 'Missing SUPABASE env vars' }), { status: 500 });
      }

      const bookingId = body.booking_id;
      const bookingRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*,customer_id,customer_name,service,price,date,time,user_id,status`, {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
      });
      if (!bookingRes.ok) {
        const t = await bookingRes.text();
        await client.close();
        return new Response(JSON.stringify({ error: 'Failed to fetch booking', detail: t }), { status: 500 });
      }
      const bookings = await bookingRes.json();
      const booking = bookings && bookings[0];
      if (!booking) {
        await client.close();
        return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
      }

      // Lookup customer email
      let customerEmail = '';
      if (booking.customer_id) {
        const cRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${booking.customer_id}&select=email,name`, {
          headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
        });
        if (cRes.ok) {
          const cjson = await cRes.json();
          if (cjson && cjson[0] && cjson[0].email) customerEmail = cjson[0].email;
        }
      }

      // Lookup staff email
      let staffEmail = '';
      if (booking.user_id) {
        const uRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${booking.user_id}&select=email,name`, {
          headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
        });
        if (uRes.ok) {
          const ujson = await uRes.json();
          if (ujson && ujson[0] && ujson[0].email) staffEmail = ujson[0].email;
        }
      }

      const messages: Array<{ to: string; subject: string; html?: string; text?: string }> = [];
      if (body.type === 'booking_created') {
        if (staffEmail) {
          messages.push({ to: staffEmail, subject: `New booking: ${booking.customer_name} - ${booking.service}`, html: `<p>You have a new booking scheduled for ${booking.customer_name} on ${booking.date} ${booking.time}.</p>` });
        }
        if (customerEmail) {
          messages.push({ to: customerEmail, subject: `Your appointment is scheduled`, html: `<p>Your appointment for ${booking.service} is booked on ${booking.date} ${booking.time}.</p>` });
        }
      } else if (body.type === 'reminder') {
        if (customerEmail) {
          messages.push({ to: customerEmail, subject: `Reminder: appointment on ${booking.date} ${booking.time}`, html: `<p>This is a reminder for your appointment on ${booking.date} ${booking.time}.</p>` });
        }
      }

      for (const msg of messages) {
        await sendSmtpMessage(client, SMTP_FROM, msg.to, msg.subject, msg.html, msg.text);
      }

      await client.close();
      return new Response(JSON.stringify({ status: 'ok', sent: messages.length }), { status: 200 });
    }

    await client.close();
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  } catch (err) {
    console.error('send-notification error', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Unknown error' }), { status: 500 });
  }
}
