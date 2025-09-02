const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'edgeandcobarber@gmail.com',
    pass: 'hapw tpmv kqku niqr' // App password
  }
});

// Get email details from command line arguments
const to = process.argv[2];
const subject = process.argv[3];
const html = process.argv[4];

console.log('🚀 Node.js Email Sender Started');
console.log(`To: ${to}`);
console.log(`Subject: ${subject}`);

const mailOptions = {
  from: 'edgeandcobarber@gmail.com',
  to: to,
  subject: subject,
  html: html
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Email failed:', error);
    process.exit(1);
  } else {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  }
});
