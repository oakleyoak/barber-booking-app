import { supabase, supabaseUrl, supabaseKey } from '../lib/supabase';
import { BusinessConfig } from '../config/businessConfig';

// Helper: resolve customer email from booking payload
const resolveCustomerEmail = async (booking: any): Promise<string> => {
  // Always resolve from customers.email using customer_id when available.
  if (!booking) return '';
  if (booking.customer_id) {
    try {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .select('email')
        .eq('id', booking.customer_id)
        .single();
      if (!custErr && cust && cust.email) return cust.email;
    } catch (e) {
      console.warn('Error resolving customer email:', e);
    }
  }
  return '';
};

// Email templates
const generateBookingNotificationForBarber = (booking: any) => {
  return {
    subject: `✂️ New Booking Assignment - Edge & Co Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border-radius:8px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: 18px;">
          <div>
            <div style="font-weight:700; color:#2c3e50; font-size:18px;">Edge & Co Barbershop</div>
            <div style="font-size:12px; color:#666;">Appointment assigned</div>
          </div>
        </div>

        <div style="background-color: #eef8ff; padding: 16px; border-radius: 8px; margin-bottom: 14px; border-left: 4px solid #3498db;">
          <h3 style="color: #2c3e50; margin-top: 0;">📅 You have a new appointment</h3>
          <p>Hi ${booking.barber_name || 'Team Member'},</p>
          <p>Your manager has booked a new appointment for you. See details below.</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 14px;">
          <h4 style="color: #2c3e50; margin-top: 0;">Appointment Details</h4>
          <p style="margin:6px 0;"><strong>Customer:</strong> ${booking.customer_name || '—'}</p>
          <p style="margin:6px 0;"><strong>Service:</strong> ${booking.service || '—'}</p>
          <p style="margin:6px 0;"><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleDateString() : '—'}</p>
          <p style="margin:6px 0;"><strong>Time:</strong> ${booking.time || '—'}</p>
          <p style="margin:6px 0;"><strong>Price:</strong> ${booking.price ? `₺${booking.price}` : '—'}</p>
        </div>

        <div style="background-color: #e8f5e8; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0; color: #27ae60;"><strong>✅ Please prepare for this appointment</strong></p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color:#444;">Open your schedule to accept or reschedule if needed.</p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 14px; text-align: left; font-size: 13px; color: #666;">
          <div style="font-weight:700;">Edge & Co Barbershop</div>
          <div style="color:#555;">Shop address: 123 Example St, London</div>
          <div style="margin-top:6px;">📧 <a href="mailto:edgeandcobarber@gmail.com">edgeandcobarber@gmail.com</a> | 📞 +44 20 0000 0000</div>
          <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">You received this email because you are a staff member at Edge & Co Barbershop.</p>
        </div>
      </div>
    `
  };
};

const generateBookingConfirmationEmail = (booking: any) => {
  // Check for payment URL from booking data
  const paymentUrl = booking?.stripe_payment_url || booking?.invoice_url || booking?.payment_url || '';

  return {
    subject: `✂️ Booking Confirmation - Edge & Co Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background:#fff; border-radius:8px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: 18px;">
          <div>
            <div style="font-weight:700; color:#2c3e50; font-size:18px;">Edge & Co Barbershop</div>
            <div style="font-size:12px; color:#666;">Booking Confirmation</div>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 14px;">
          <h4 style="color: #2c3e50; margin-top: 0;">Appointment Details</h4>
          <p style="margin:6px 0;"><strong>Customer:</strong> ${booking.customer_name}</p>
          <p style="margin:6px 0;"><strong>Service:</strong> ${booking.service}</p>
          <p style="margin:6px 0;"><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleDateString() : '—'}</p>
          <p style="margin:6px 0;"><strong>Time:</strong> ${booking.time || '—'}</p>
          <p style="margin:6px 0;"><strong>Price:</strong> ${booking.price ? `₺${booking.price}` : '—'}</p>
        </div>

        ${paymentUrl ? `
          <div style="background-color: #fff9e6; padding: 14px; border-radius: 8px; margin-bottom: 14px; border-left: 4px solid #f39c12;">
            <h4 style="color: #2c3e50; margin-top: 0;">💳 Payment Options</h4>
            <p style="margin: 0; color: #856404;">You can pay securely online for this appointment:</p>
            <p style="margin: 8px 0 0 0;"><a href="${paymentUrl}" style="background: #3498db; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 700;">Pay Now</a></p>
          </div>
        ` : ''}

        <div style="background-color: #e8f5e8; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0; color: #27ae60;"><strong>✅ Your appointment is confirmed!</strong></p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color:#444;">We look forward to seeing you at Edge & Co Barbershop.</p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 14px; text-align: left; font-size: 13px; color: #666;">
          <div style="font-weight:700;">Edge & Co Barbershop</div>
          <div style="color:#555;">Shop address: 123 Example St, London</div>
          <div style="margin-top:6px;">📧 <a href="mailto:edgeandcobarber@gmail.com">edgeandcobarber@gmail.com</a> | 📞 +44 20 0000 0000</div>
          <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">You received this email because you booked an appointment with Edge & Co Barbershop.</p>
        </div>
      </div>
    `
  };
};

const generateAppointmentReminder = (booking: any) => {
  const paymentUrl = booking?.stripe_payment_url || booking?.invoice_url || booking?.payment_url || '';

  return {
    subject: `⏰ Appointment Reminder - Edge & Co Barbershop`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 720px; margin: 0 auto; padding: 20px; background:#f4f6f8;">
        <div style="background:#ffffff; padding:22px; border-radius:10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div>
                <div style="font-weight:700; color:#2c3e50; font-size:18px;">Edge & Co Barbershop</div>
                <div style="font-size:13px; color:#666;">Professional Grooming Services</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; color:#666;">Appointment Reminder</div>
              <div style="font-weight:700; font-size:16px; color:#f39c12;">Tomorrow</div>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:18px;">
            <div style="flex:1; min-width:240px;">
              <div style="font-size:13px; color:#888; margin-bottom:6px;">Appointment Details</div>
              <div style="font-weight:700; font-size:15px; color:#222;">${booking.customer_name || 'Valued Customer'}</div>
              <div style="color:#555; font-size:13px;">${booking.customer_email || ''}</div>
              <div style="margin-top:12px;">
                <div style="font-size:13px; margin:4px 0;"><strong>Service:</strong> ${booking.service || '—'}</div>
                <div style="font-size:13px; margin:4px 0;"><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleDateString() : '—'}</div>
                <div style="font-size:13px; margin:4px 0;"><strong>Time:</strong> ${booking.time || '—'}</div>
                <div style="font-size:13px; margin:4px 0;"><strong>Barber:</strong> ${booking.barber_name || booking.users?.name || 'Edge & Co Team'}</div>
                <div style="font-size:13px; margin:4px 0;"><strong>Price:</strong> ${booking.price ? `₺${booking.price}` : '—'}</div>
              </div>
            </div>

            ${paymentUrl ? `
              <div style="width:300px; min-width:220px; background:#fff; padding:12px; border-radius:8px; border:1px solid #eee;">
                <div style="font-weight:700; margin-bottom:6px;">💳 Outstanding Payment</div>
                <div style="font-size:13px; margin:4px 0; color:#444;">Your appointment payment is still pending</div>
                <div style="margin-top:12px;">
                  <a href="${paymentUrl}" style="display:inline-block; background:#e74c3c; color:#fff; text-decoration:none; padding:10px 14px; border-radius:6px; font-weight:700;">Pay Now</a>
                </div>
                <div style="font-size:12px; color:#666; margin-top:8px;">Secure payment via Stripe</div>
              </div>
            ` : `
              <div style="width:300px; min-width:220px; background:#f8f9fa; padding:12px; border-radius:8px;">
                <div style="font-weight:700; margin-bottom:6px;">✅ Payment Status</div>
                <div style="font-size:13px; color:#27ae60; margin:4px 0;">Payment Complete</div>
                <div style="font-size:12px; color:#666; margin-top:8px;">Thank you for your payment</div>
              </div>
            `}
          </div>

          <div style="margin-bottom:18px;">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#3498db; color:#fff; text-align:left;">
                  <th style="padding:12px;">Service</th>
                  <th style="padding:12px;">Barber</th>
                  <th style="padding:12px; text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background:#fff;">
                  <td style="padding:12px; border-bottom:1px solid #eee;">${booking.service || '—'}</td>
                  <td style="padding:12px; border-bottom:1px solid #eee;">${booking.barber_name || booking.users?.name || 'Edge & Co Team'}</td>
                  <td style="padding:12px; border-bottom:1px solid #eee; text-align:right; font-weight:700;">${booking.price ? `₺${booking.price.toLocaleString('tr-TR')}` : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background:#fff7ea; padding:12px; border-radius:8px; border-left:4px solid #ffc107; margin-bottom:12px;">
            <div style="font-weight:700; color:#856404;">� Appointment Guidelines</div>
            <ul style="color:#856404; margin:8px 0 0 18px;">
              <li>Please arrive 5 minutes before your scheduled appointment time</li>
              <li>Bring a valid form of identification if this is your first visit</li>
              <li>Contact us immediately at +44 20 0000 0000 if you need to reschedule</li>
              <li>Late arrivals may result in shortened service time or rescheduling</li>
              <li>We maintain strict hygiene standards and use sanitized equipment</li>
            </ul>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start; margin-bottom:16px;">
            <div style="width:320px; min-width:220px; background:#fff; padding:12px; border-radius:8px; border:1px solid #eee;">
              <div style="font-weight:700; margin-bottom:6px;">Location & Contact</div>
              <div style="font-size:13px; margin:4px 0;"><strong>Address:</strong> 123 Example St, London</div>
              <div style="font-size:13px; margin:4px 0;"><strong>Phone:</strong> +44 20 0000 0000</div>
              <div style="font-size:13px; margin:4px 0;"><strong>Email:</strong> edgeandcobarber@gmail.com</div>
              <div style="font-size:12px; color:#666; margin-top:8px;">Please call ahead if you're running late</div>
            </div>
          </div>

          <div style="border-top:1px solid #eee; padding-top:14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
            <div style="font-size:13px; color:#444;">
              <div style="font-weight:700;">Edge & Co Barbershop</div>
              <div style="margin-top:6px;">📧 <a href="mailto:edgeandcobarber@gmail.com">edgeandcobarber@gmail.com</a> | 📞 +44 20 0000 0000</div>
            </div>
            <div style="font-size:12px; color:#999; text-align:right;">Professional appointment reminder • Edge & Co</div>
          </div>
        </div>
      </div>
    `
  };
};

export const NotificationsService = {
  sendNotification: async (payload: any) => {
    try {
      console.log('🚀 Sending email notification...');
        console.log('📧 Payload:', JSON.stringify(payload, null, 2));
      
        // Normalize any provided email_content for direct sends (to/subject/html)
        const provided = payload.email_content || {};
        let providedTo = payload.to || provided.to || '';
        let providedSubject = payload.subject || provided.subject || '';
        let providedHtml = payload.html || provided.html || '';

        let emailContent = { subject: '', html: '', to: '' };
      
      // Handle different notification types
      if (payload.type === 'booking_created' && payload.booking_data) {
        // Use the barber notification template when a booking is created by manager
        // Ensure we send to the barber's email (barber_email or user_email) not the customer
        console.log('📋 Using barber notification template');
        const booking = payload.booking_data;

        const template = generateBookingNotificationForBarber(booking);

        // Determine recipient email. Prefer barber_email (explicit), then attempt to lookup
        // by booking.user_id in the users table, then fall back to user_email, then default.
        let toEmail = booking.barber_email || booking.user_email || '';

        // If we still don't have an email but we have a user_id, query Supabase users table
        if ((!toEmail || toEmail === '') && booking.user_id) {
          try {
            console.log('🔎 Looking up barber email for user_id:', booking.user_id);
            const { data: userRec, error: userErr } = await supabase
              .from('users')
              .select('email')
              .eq('id', booking.user_id)
              .single();

            if (userErr) {
              console.warn('⚠️ Could not lookup user email:', userErr.message || userErr);
            } else if (userRec && userRec.email) {
              toEmail = userRec.email;
              console.log('✅ Found barber email via users table:', toEmail);
            }
          } catch (lookupErr) {
            console.error('❌ Error while looking up barber email:', lookupErr);
          }
        }

        emailContent = {
          subject: template.subject,
          html: template.html,
          to: toEmail || 'edgeandcobarber@gmail.com'
        };
      } else if (payload.type === 'customer_confirmation' && payload.booking_data) {
        // Use the customer confirmation template when manually sending to customer
        console.log('👤 Using customer confirmation template');
        const booking = payload.booking_data;

        const template = generateBookingConfirmationEmail(booking);
        const resolved = await resolveCustomerEmail(booking);
        emailContent = {
          subject: template.subject,
          html: template.html,
          to: resolved || providedTo || 'edgeandcobarber@gmail.com'
        };
  } else if (payload.type === 'customer_notification' && payload.booking_data) {
        // Explicitly handle customer_notification and prefer provided email_content.to
        console.log('👥 Using customer notification template');
        const booking = payload.booking_data;

        // If caller provided email_content (to/subject/html) use it directly
        if (providedTo || providedSubject || providedHtml) {
          emailContent = {
            subject: providedSubject || `✂️ Booking Confirmation - Edge & Co Barbershop`,
            html: providedHtml || generateBookingConfirmationEmail(booking).html,
            to: providedTo || ''
          };
        } else {
          // Fallback: resolve from customers table
          const template = generateBookingConfirmationEmail(booking);
          const resolved = await resolveCustomerEmail(booking);
          emailContent = {
            subject: template.subject,
            html: template.html,
            to: resolved || 'edgeandcobarber@gmail.com'
          };
        }
      } else if (payload.type === 'invoice' && payload.email_content) {
        // Use direct invoice template provided by InvoiceService
        console.log('💰 Using invoice template');
        emailContent = {
          subject: payload.email_content.subject,
          html: payload.email_content.html,
          to: payload.email_content.to
        };
      } else if (payload.type === 'booking_reminder' || payload.type === 'booking_reminder_manual') {
        // Backwards compatible: treat booking_reminder as appointment_reminder
        console.log('⏰ Using booking_reminder template (compat)');
        const booking = payload.booking_data || {};
        const template = generateAppointmentReminder(booking);
        // prefer provided email_content.to or payload.to, then resolved customer email
        const provided = payload.email_content || {};
        const toResolved = await resolveCustomerEmail(booking);
        emailContent = {
          subject: provided.subject || template.subject,
          html: provided.html || template.html,
          to: provided.to || payload.to || toResolved || 'edgeandcobarber@gmail.com'
        };
      } else if (payload.type === 'appointment_reminder') {
        console.log('⏰ Using appointment reminder template');
        const booking = payload.booking_data;
        const template = generateAppointmentReminder(booking);
        const resolved = await resolveCustomerEmail(booking);
        emailContent = {
          subject: template.subject,
          html: template.html,
          to: payload.to || resolved || 'edgeandcobarber@gmail.com'
        };
      } else if (payload.to && (payload.subject || payload.html)) {
        // Direct email sending
        console.log('📬 Using direct email template');
        emailContent = {
          subject: payload.subject || 'Edge & Co Barbershop Notification',
          html: payload.html || payload.text || 'Notification from Edge & Co Barbershop',
          to: payload.to
        };
      } else {
        // Default notification
        console.log('⚠️ Using default notification template');
        emailContent = {
          subject: 'Edge & Co Barbershop Notification',
          html: '<h2>New notification from Edge & Co Barbershop</h2><p>You have a new notification from your barbershop booking system.</p>',
          to: 'edgeandcobarber@gmail.com'
        };
      }
      
        console.log('📧 Email content:', {
        to: emailContent.to,
        subject: emailContent.subject,
        htmlLength: emailContent.html.length
      });
      
      // Send email using our Netlify Function
  const response = await fetch(`${BusinessConfig.siteUrl}/.netlify/functions/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailContent.to,
          subject: emailContent.subject,
          html: emailContent.html
        })
      });
      
      console.log('📤 Netlify Function response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via Netlify Function:', result);
        return { ok: true, status: 200, body: { message: 'Email sent via Netlify Function', service: 'netlify' } };
      } else {
        const errorText = await response.text();
        console.error('❌ Netlify Function error:', response.status, errorText);
        throw new Error(`Netlify Function responded with status ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { ok: false, error: (error as Error).message };
    }
  }
};
