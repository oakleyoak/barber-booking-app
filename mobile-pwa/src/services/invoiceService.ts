import { NotificationsService } from './notifications';
import { BusinessConfig } from '../config/businessConfig';

export interface InvoiceData {
  booking_id: string;
  customer_name: string;
  customer_email: string;
  service: string;
  price: number;
  date: string;
  time: string;
  invoice_number: string;
  due_date: string;
  barber_name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'iban' | 'online';
  details: string;
  icon: string;
}

export const InvoiceService = {
  // Generate unique invoice number
  generateInvoiceNumber: (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = Date.now().toString().slice(-4);
    return `EC-${year}${month}${day}-${time}`;
  },

  // Calculate due date (7 days from issue)
  calculateDueDate: (): string => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate.toISOString().split('T')[0];
  },

  // Available payment methods
  getPaymentMethods: (): PaymentMethod[] => [
    {
      id: 'iban_tr',
      name: 'Bank Transfer (IBAN)',
      type: 'iban',
      details: BusinessConfig.iban,
      icon: '🏦'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      type: 'online',
      details: 'Secure online payment via PayPal',
      icon: '💳'
    },
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      type: 'online',
      details: 'Pay securely with your card',
      icon: '💳'
    }
  ],

  // Generate invoice HTML template
  generateInvoiceHTML: (invoice: InvoiceData, paymentMethods: PaymentMethod[]): string => {
    const ibanMethod = paymentMethods.find(pm => pm.type === 'iban');
    const onlineMethods = paymentMethods.filter(pm => pm.type === 'online');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 28px;">✂️ Edge & Co Barbershop</h1>
          <h2 style="color: #3498db; margin: 0; font-size: 24px;">INVOICE</h2>
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
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 8px;">
            <h3 style="color: #27ae60; margin: 0; font-size: 24px;">Total: ₺${invoice.price.toLocaleString('tr-TR')}</h3>
          </div>
        </div>

        <!-- Payment Methods -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">💳 Payment Options</h3>
          
          ${ibanMethod ? `
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h4 style="color: #2c3e50; margin-top: 0;">${ibanMethod.icon} ${ibanMethod.name}</h4>
            <p style="margin: 10px 0; font-family: monospace; font-size: 16px; background-color: white; padding: 10px; border-radius: 4px;">
              <strong>IBAN:</strong> ${ibanMethod.details}
            </p>
            <p style="margin: 5px 0; color: #555; font-size: 14px;">
              <strong>Account Holder:</strong> ${BusinessConfig.accountHolder}<br>
              <strong>Bank:</strong> ${BusinessConfig.bankName}<br>
              <strong>Reference:</strong> ${invoice.invoice_number}
            </p>
            <p style="color: #e74c3c; font-size: 12px; margin: 10px 0 0 0;">
              ⚠️ Please include the invoice number as reference when making the transfer.
            </p>
          </div>
          ` : ''}

          ${onlineMethods.length > 0 ? `
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #2c3e50; margin-top: 0;">🌐 Online Payment Options</h4>
            ${onlineMethods.map(method => `
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ddd;">
                <p style="margin: 0; font-weight: bold;">${method.icon} ${method.name}</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${method.details}</p>
                <button style="background-color: #27ae60; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                  Pay with ${method.name}
                </button>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

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
  },

  // Send invoice via email
  sendInvoice: async (booking: any): Promise<{ ok: boolean; error?: string }> => {
    try {
      const invoice: InvoiceData = {
        booking_id: booking.id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email || '',
        service: booking.service,
        price: booking.price,
        date: booking.date,
        time: booking.time,
        invoice_number: InvoiceService.generateInvoiceNumber(),
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      const paymentMethods = InvoiceService.getPaymentMethods();
      const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice, paymentMethods);

      // Send via NotificationsService
      const result = await NotificationsService.sendNotification({
        type: 'invoice',
        booking_id: booking.id,
        invoice_data: invoice,
        email_content: {
          to: invoice.customer_email,
          subject: `💰 Invoice ${invoice.invoice_number} - Edge & Co Barbershop`,
          html: invoiceHTML
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return { ok: false, error: (error as Error).message };
    }
  }
};
