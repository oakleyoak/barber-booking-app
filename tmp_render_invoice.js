const fs = require('fs');

// Minimal BusinessConfig values (match code)
const BusinessConfig = {
  siteUrl: 'https://edgeandco.netlify.app',
  iban: 'TR41 0010 3000 0000 0056 6690 26',
  accountHolder: 'Dylan Ahmet Salih',
  bankName: 'Türkiye İş Bankası A.Ş.',
  bic: 'ISBKTRIS',
  bankAddress: 'Türkiye İş Bankası A.Ş., İş Kuleleri, Levent, 34330 Beşiktaş, Istanbul, Turkey',
  accentColor: '#3498db'
};

function generateInvoiceHTML(invoice, paymentMethods, accentColor, logoSrc) {
  const ibanMethod = paymentMethods.find(pm => pm.type === 'iban');
  const onlineMethods = paymentMethods.filter(pm => pm.type === 'online');
  const color = accentColor || BusinessConfig.accentColor || '#3498db';
  return `
  <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px;">
  <img src="${logoSrc}" alt="Edge & Co" style="height:64px; display:block; margin:0 auto 8px;" />
  <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 28px;">✂️ Edge & Co Barbershop</h1>
      <h2 style="color: ${color}; margin: 0; font-size: 24px;">INVOICE</h2>
      <p style="color: #666; margin: 5px 0;">Professional Barber Services</p>
    </div>

    <!-- Invoice Details -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;">
        <h3 style="color: #2c3e50; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Invoice Details</h3>
        <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
        <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
      </div>
      <div style="width: 48%;">
        <h3 style="color: #2c3e50; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Bill To</h3>
        <p style="margin: 5px 0;"><strong>${invoice.customer_name}</strong></p>
        <p style="margin: 5px 0;">${invoice.customer_email}</p>
        <p style="margin: 5px 0;">Appointment: ${new Date(invoice.date).toLocaleDateString()} at ${invoice.time}</p>
      </div>
    </div>

    <!-- Service Details -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Service Details</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
        <thead>
          <tr style="background-color: #2c3e50; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Service</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Barber</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">${invoice.service}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${invoice.barber_name}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₺${invoice.price.toLocaleString('tr-TR')}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Card Processing Fee</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">₺${invoice.card_processing_fee.toLocaleString('tr-TR')}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Total</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₺${(invoice.price + invoice.card_processing_fee).toLocaleString('tr-TR')}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Payment Methods -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">💳 Payment Options</h3>

      ${ibanMethod ? `
      <div style="background-color: #f0f8ff; padding: 18px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${color}; display: flex; gap: 16px; align-items: flex-start;">
        <div style="flex: 1;">
          <h4 style="color: #2c3e50; margin-top: 0;">${ibanMethod.icon} ${ibanMethod.name}</h4>
          <div style="background-color: white; padding: 12px; border-radius: 6px; border: 1px solid #e6eef8;">
            <p style="margin: 0 0 6px 0; font-family: monospace; font-size: 16px;"><strong>IBAN:</strong> ${ibanMethod.details}</p>
            <p style="margin: 0; font-size: 14px; color: #333;"><strong>Account Holder:</strong> ${BusinessConfig.accountHolder}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #333;"><strong>Reference:</strong> ${invoice.invoice_number}</p>
          </div>
          <p style="color: #e74c3c; font-size: 12px; margin: 10px 0 0 0;">
            ⚠️ Please include the invoice number as the payment reference when making the transfer.
          </p>
        </div>
        <div style="width: 320px; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #eee;">
          <h5 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 15px;">🏦 Bank Details</h5>
          <p style="margin: 4px 0;"><strong>Bank Name:</strong> ${BusinessConfig.bankName}</p>
          <p style="margin: 4px 0;"><strong>BIC / SWIFT:</strong> ${BusinessConfig.bic}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Address:</strong> ${BusinessConfig.bankAddress}</p>
        </div>
      </div>
      ` : ''}

      ${onlineMethods.length > 0 ? `
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="color: #2c3e50; margin-top: 0;">🌐 Online Payment Options</h4>
        ${onlineMethods.map(method => `
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ddd;">
            <p style="margin: 0; font-weight: bold;">${method.icon} ${method.name}</p>
            <p style="margin: 5px 0 10px 0; color: #666; font-size: 14px;">
              ${method.id === 'stripe' ? 'Secure payment with credit/debit card via Stripe' : method.details}
            </p>
            <a href="${method.details}" target="_blank" style="display: inline-block; text-decoration: none;">
              <button style="background-color: ${method.id === 'stripe' ? '#6772e5' : '#27ae60'}; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                ${method.id === 'stripe' ? '💳 Pay with Card' : `Pay with ${method.name}`}
              </button>
            </a>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <!-- Bank Details merged into IBAN payment block above -->
    <!-- Terms -->
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
      <h4 style="color: #856404; margin-top: 0;">📋 Payment Terms</h4>
      <ul style="color: #856404; margin: 0; padding-left: 20px;">
        <li>Payment is due within 7 days of invoice date</li>
        <li>Late payments may incur additional charges</li>
        <li>Please contact us if you have any questions about this invoice</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; color: #666;">
      <p><strong>Edge & Co Barbershop</strong></p>
      <p>Professional barber services in your area</p>
      <p>📧 Email: edgeandcobarber@gmail.com | 📞 Contact us for appointments</p>
      
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">
        This is an automated invoice from Edge & Co Barbershop booking system.<br>
        If you have any questions, please contact us at edgeandcobarber@gmail.com
      </p>
    </div>
  </div>
`;
}

// Build sample invoice
const invoice = {
  booking_id: '1',
  customer_name: 'Jane Doe',
  customer_email: 'jane@example.com',
  service: 'Haircut',
  price: 700,
  card_processing_fee: 50,
  date: '2025-09-05',
  time: '13:00',
  invoice_number: 'EC-20250905-3662',
  due_date: '2025-09-12',
  barber_name: 'Dylan'
};

const paymentMethods = [
  { id: 'iban_tr', name: 'Bank Transfer (IBAN)', type: 'iban', details: BusinessConfig.iban, icon: '🏦' },
  { id: 'stripe', name: 'Credit/Debit Card (Stripe)', type: 'online', details: 'https://pay.example.com', icon: '💳' }
];

// Try to embed the local BWicon.png as data URI for file:// preview. Search common locations.
let logoSrc = `${BusinessConfig.siteUrl}/assets/BWicon.png`;
const possiblePaths = [
  'mobile-pwa/src/assets/BWicon.png',
  'mobile-pwa/assets/BWicon.png',
  'mobile-pwa/public/assets/BWicon.png',
  'mobile-pwa/src/assets/BWicon.PNG',
  'mobile-pwa/src/assets/bwicon.png',
  'mobile-pwa/src/assets/BWicon.svg'
];
for (const p of possiblePaths) {
  try {
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      const ext = p.split('.').pop().toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'png' ? 'image/png' : 'image/jpeg');
      const data = buf.toString('base64');
      logoSrc = `data:${mime};base64,${data}`;
      console.log('✅ Inlined logo from', p);
      break;
    }
  } catch (e) {
    // ignore and continue
  }
}

const html = generateInvoiceHTML(invoice, paymentMethods, BusinessConfig.accentColor, logoSrc);
fs.writeFileSync('tmp_invoice_preview.html', html, 'utf8');
console.log('Wrote tmp_invoice_preview.html in repo root. Size:', html.length);
console.log('\n--- START PREVIEW (first 1000 chars) ---\n');
console.log(html.slice(0,1000));
console.log('\n--- END PREVIEW ---\n');
