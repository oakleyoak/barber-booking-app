import { supabase, supabaseUrl, supabaseKey } from '../lib/supabase';

// Email templates
const generateBookingNotificationForBarber = (booking: any) => {
  return {
    subject: `✂️ New Booking Assignment - Edge & Co Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">✂️ Edge & Co Barbershop</h1>
          <h2 style="color: #3498db; margin: 0;">New Booking Assignment</h2>
        </div>
        
        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3498db;">
          <h3 style="color: #2c3e50; margin-top: 0;">📅 You have a new appointment</h3>
          <p>Hi ${booking.barber_name || 'Team Member'},</p>
          <p>Your manager has booked a new appointment for you.</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details</h3>
          <p><strong>Customer:</strong> ${booking.customer_name}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Price:</strong> ₺${booking.price}</p>
          <p><strong>Status:</strong> ${booking.status}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #27ae60;"><strong>✅ Please prepare for this appointment</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Check your schedule and ensure you're ready for the customer.</p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; color: #666;">
          <p><strong>Edge & Co Barbershop</strong></p>
          <p>Professional barber services</p>
          <p>Login to your app to see all your appointments</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            You received this email because you are a team member at Edge & Co Barbershop.<br>
            Contact management if you have any questions: <a href="mailto:edgeandcobarber@gmail.com" style="color: #666;">edgeandcobarber@gmail.com</a>
          </p>
        </div>
      </div>
    `
  };
};

const generateBookingConfirmationEmail = (booking: any) => {
  return {
    subject: `✂️ Booking Confirmation - Edge & Co Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">✂️ Edge & Co Barbershop</h1>
          <h2 style="color: #27ae60; margin: 0;">Booking Confirmed!</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details</h3>
          <p><strong>Customer:</strong> ${booking.customer_name}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Price:</strong> ₺${booking.price}</p>
          <p><strong>Status:</strong> ${booking.status}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #27ae60;"><strong>✅ Your appointment is confirmed!</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">We look forward to seeing you at Edge & Co Barbershop.</p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; color: #666;">
          <p><strong>Edge & Co Barbershop</strong></p>
          <p>Professional barber services in your area</p>
          <p>Email: edgeandcobarber@gmail.com</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            You received this email because you booked an appointment with Edge & Co Barbershop.<br>
            If you no longer wish to receive these emails, please <a href="mailto:edgeandcobarber@gmail.com?subject=Unsubscribe" style="color: #666;">unsubscribe here</a>.
          </p>
        </div>
      </div>
    `
  };
};

const generateAppointmentReminder = (booking: any) => {
  return {
    subject: `⏰ Appointment Reminder - Edge & Co Barbershop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">✂️ Edge & Co Barbershop</h1>
          <h2 style="color: #f39c12; margin: 0;">Appointment Reminder</h2>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f39c12;">
          <h3 style="color: #2c3e50; margin-top: 0;">⏰ Upcoming Appointment</h3>
          <p><strong>Customer:</strong> ${booking.customer_name}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Price:</strong> ₺${booking.price}</p>
        </div>
        
        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e5f99;"><strong>📍 Don't forget your appointment!</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">We're looking forward to seeing you soon.</p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; color: #666;">
          <p><strong>Edge & Co Barbershop</strong></p>
          <p>Professional barber services in your area</p>
          <p>Email: edgeandcobarber@gmail.com</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            You received this email because you have an upcoming appointment with Edge & Co Barbershop.<br>
            If you no longer wish to receive these emails, please <a href="mailto:edgeandcobarber@gmail.com?subject=Unsubscribe" style="color: #666;">unsubscribe here</a>.
          </p>
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
        emailContent = {
          subject: template.subject,
          html: template.html,
          to: booking.customer_email || 'edgeandcobarber@gmail.com'
        };
      } else if (payload.type === 'invoice' && payload.email_content) {
        // Use direct invoice template provided by InvoiceService
        console.log('💰 Using invoice template');
        emailContent = {
          subject: payload.email_content.subject,
          html: payload.email_content.html,
          to: payload.email_content.to
        };
      } else if (payload.type === 'appointment_reminder') {
        console.log('⏰ Using appointment reminder template');
        const template = generateAppointmentReminder(payload.booking_data);
        emailContent = {
          subject: template.subject,
          html: template.html,
          to: payload.to || payload.booking_data?.customer_email || 'edgeandcobarber@gmail.com'
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
      const response = await fetch('https://edgeandco.netlify.app/.netlify/functions/send-email', {
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
