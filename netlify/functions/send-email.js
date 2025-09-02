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
    const { to, subject, html } = JSON.parse(event.body);

    console.log('🚀 Netlify Function: Sending email');
    console.log('To:', to);
    console.log('Subject:', subject);

    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'edgeandcobarber@gmail.com',
        pass: 'hapw tpmv kqku niqr' // Your app password
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
      subject: mailOptions.subject
    });

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
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      })
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
