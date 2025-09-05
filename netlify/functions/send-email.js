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
  let html = emailContent.html || '';

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

    // Attempt to attach the local BWicon and rewrite HTML to reference it via CID.
    let attachments = [];
    try {
      const path = 'mobile-pwa/src/assets/BWicon.png';
      if (require('fs').existsSync(path)) {
        const data = require('fs').readFileSync(path);
        attachments.push({
          filename: 'BWicon.png',
          content: data,
          cid: 'bwicon@edgeandco'
        });
        // Replace occurrences of common absolute asset URLs or site-based paths with cid reference
        html = html.replace(/https:\/\/edgeandco\.netlify\.app\/assets\/BWicon\.png/g, 'cid:bwicon@edgeandco');
        html = html.replace(/\/assets\/BWicon\.png/g, 'cid:bwicon@edgeandco');
      }
    } catch (e) {
      console.warn('Could not attach local logo for email (will fallback to inline or remote):', e.message || e);
    }

    // If no attachment was created, try to inline as base64 data URI (best-effort)
    if (attachments.length === 0) {
      try {
        const p2 = 'mobile-pwa/src/assets/BWicon.png';
        if (require('fs').existsSync(p2)) {
          const buf = require('fs').readFileSync(p2);
          const data = buf.toString('base64');
          const dataUri = `data:image/png;base64,${data}`;
          html = html.replace(/https:\/\/edgeandco\.netlify\.app\/assets\/BWicon\.png/g, dataUri);
          html = html.replace(/\/assets\/BWicon\.png/g, dataUri);
        }
      } catch (e) {
        console.warn('Could not inline logo as base64:', e.message || e);
      }
    }

    const mailOptions = {
      from: '"Edge & Co Barber" <edgeandcobarber@gmail.com>',
      to: to,
      subject: subject,
      html: html,
      attachments,
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

      // If caller requested a preview, skip sending and return the HTML
      const wantsPreview = Boolean(emailContent.preview);
      if (wantsPreview) {
        const previewHtml = html || '';
        console.log('🔎 Email preview requested — logging first 800 characters:\n', previewHtml.slice(0, 800));
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(Object.assign({
            success: true,
            preview: true,
            email_preview_html: previewHtml,
            message: 'Preview returned (no email sent)'
          }, warning ? { warning } : {}))
        };
      }

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
