const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
  const payload = JSON.parse(event.body);
  // Accept both direct {to,subject,html} and richer payloads { email_content: {to,...}, booking_id, booking_data }
  const { booking_id, booking_data } = payload;
  const emailContent = payload.email_content || payload;
  const to = emailContent.to || '';
  const subject = emailContent.subject || '';
  const html = emailContent.html || '';

  console.log('🚀 Netlify Function: Sending email');
  console.log('Full payload:', JSON.stringify(payload));
  console.log('Resolved recipient (to):', to);
  console.log('Subject:', subject);

  // Determine recipient source for diagnostics
  let recipientSource = 'unknown';
  if (payload.email_content && payload.email_content.to) recipientSource = 'payload.email_content.to';
  else if (payload.to) recipientSource = 'payload.to';
  else if (emailContent && emailContent.to) recipientSource = 'email_content (fallback)';
  console.log('Recipient source:', recipientSource);

    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'edgeandcobarber@gmail.com',
        pass: 'hapw tpmv kqku niqr'
      }
    });

    const mailOptions = {
      from: '"Edge & Co Barber" <edgeandcobarber@gmail.com>',
      to: to,
      subject: subject,
      html: html,
      headers: {
        'List-Unsubscribe': '<mailto:edgeandcobarber@gmail.com?subject=Unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Edge & Co Booking System',
        'X-Priority': '3',
        'Importance': 'Normal',
        'Reply-To': 'edgeandcobarber@gmail.com'
      }
    };

    console.log('📧 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      headers: mailOptions.headers
    });

    // Safety warning: if we are about to send to the boss address while the payload references a booking/customer, log explicitly
    const BOSS_EMAIL = 'edgeandcobarber@gmail.com';
    let warning = null;
    try {
      if (String((to || '').toLowerCase()).includes(BOSS_EMAIL) && (booking_id || (booking_data && booking_data.customer_id))) {
        warning = `Recipient is boss (${BOSS_EMAIL}) but payload contains booking/customer id; this may be a misroute.`;
        console.warn('⚠️', warning);
      }
    } catch (e) {
      console.warn('⚠️ Error while checking recipient safety:', e);
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(Object.assign({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      }, warning ? { warning } : {}))
    };

  } catch (error) {
    console.error('❌ Email failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
