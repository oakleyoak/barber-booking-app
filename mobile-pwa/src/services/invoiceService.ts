import { NotificationsService } from './notifications';
import { BusinessConfig } from '../config/businessConfig';
import { StripePaymentLinks } from './stripeService';
import { supabase } from '../lib/supabase';

export interface InvoiceData {
  booking_id: string;
  customer_name: string;
  customer_email: string;
  // note: customer_email here is a runtime/resolved value (from customers.email)
  service: string;
  price: number;
  card_processing_fee: number;
  date: string;
  time: string;
  invoice_number: string;
  due_date: string;
  barber_name: string;
  stripe_payment_url?: string; // Add Stripe payment URL
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

  // Create Stripe payment link for invoice
  // Returns an object with id and url, or null on failure
  createStripePaymentLink: async (invoice: InvoiceData): Promise<{ id: string; url: string } | null> => {
    try {
      const response = await fetch('/.netlify/functions/create-stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round((invoice.price + invoice.card_processing_fee) * 100), // Convert to kuruş
          currency: 'TRY',
          description: `${invoice.service} - Edge & Co Barbershop`,
          invoiceNumber: invoice.invoice_number,
          customerEmail: invoice.customer_email,
          customerName: invoice.customer_name,
          services: [
            {
              name: invoice.service,
              price: invoice.price
            }
          ],
          cardProcessingFee: invoice.card_processing_fee
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Expecting { id, url }
        return { id: result.id, url: result.url };
      } else {
        console.error('Failed to create Stripe payment link:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      return null;
    }
  },

  // Update booking with invoice and payment information
  updateBookingInvoiceData: async (bookingId: string, invoiceData: InvoiceData, stripePaymentId?: string, invoiceUrl?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          invoice_number: invoiceData.invoice_number,
          invoice_sent_at: new Date().toISOString(),
          stripe_payment_id: stripePaymentId || null,
          invoice_url: invoiceUrl || null,
          payment_status: 'pending',
          payment_amount: invoiceData.price + invoiceData.card_processing_fee
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Failed to update booking with invoice data:', error);
        throw error;
      }

      console.log('✅ Updated booking with invoice data:', bookingId);
    } catch (error) {
      console.error('Error updating booking invoice data:', error);
      throw error;
    }
  },

  // Available payment methods
  getPaymentMethods: async (invoice: InvoiceData): Promise<PaymentMethod[]> => {
  const stripeLink = await InvoiceService.createStripePaymentLink(invoice);
  const stripeUrl = stripeLink?.url || null;
    
  return [
      {
        id: 'iban_tr',
        name: 'Bank Transfer (IBAN)',
        type: 'iban',
        details: BusinessConfig.iban,
        icon: '🏦'
      },
      {
        id: 'stripe',
        name: 'Credit/Debit Card (Stripe)',
        type: 'online',
    details: stripeUrl || 'Pay securely with your card',
        icon: '💳'
      },
  // PayPal removed
    ];
  },

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

        <!-- Bank Details -->
        <div style="margin-bottom: 30px; background-color: #f7f9fc; padding: 18px; border-radius: 8px;">
          <h3 style="color: #2c3e50; margin-bottom: 10px;">🏦 Bank Details</h3>
          <p style="margin: 4px 0;"><strong>Bank Name:</strong> Türkiye İş Bankası A.Ş.</p>
          <p style="margin: 4px 0;"><strong>BIC / SWIFT:</strong> ISBKTRIS</p>
          <p style="margin: 4px 0;"><strong>Address:</strong> Türkiye İş Bankası A.Ş., İş Kuleleri, Levent, 34330 Beşiktaş, Istanbul, Turkey</p>
          <p style="margin: 4px 0;"><strong>Account holder:</strong> Dylan Ahmet Salih</p>
          <p style="margin: 4px 0; font-family: monospace; font-size: 16px;"><strong>IBAN:</strong> TR41 0010 3000 0000 0056 6690 26</p>
          <p style="margin-top: 10px; color: #e74c3c; font-size: 13px;">Please include the invoice number <strong>${invoice.invoice_number}</strong> as the payment reference when making a bank transfer.</p>
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
  // Resolve customer email from customers table when available (do not rely on bookings.customer_email)
      let resolvedCustomerEmail = '';
      if (booking.customer_id) {
        try {
          const { data: cust, error: custErr } = await supabase
            .from('customers')
            .select('email')
            .eq('id', booking.customer_id)
            .single();
          if (!custErr && cust && cust.email) resolvedCustomerEmail = cust.email;
        } catch (e) {
          console.warn('Error resolving customer email for invoice:', e);
        }
      }

      const invoice: InvoiceData = {
        booking_id: booking.id,
        customer_name: booking.customer_name,
  customer_email: resolvedCustomerEmail || '',
        service: booking.service,
        price: booking.price,
        card_processing_fee: 50,
        date: booking.date,
        time: booking.time,
        invoice_number: InvoiceService.generateInvoiceNumber(),
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      const paymentMethods = await InvoiceService.getPaymentMethods(invoice);
      const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice, paymentMethods);

      // Attempt to reuse existing payment link if present on booking and amount matches
      const existingStripeId = booking.stripe_payment_id;
      const existingInvoiceUrl = booking.invoice_url || booking.stripe_payment_url || null;
      let stripePaymentId: string | undefined = undefined;
      let invoiceUrl: string | undefined = undefined;

      const expectedAmount = invoice.price + invoice.card_processing_fee;
      const bookingAmount = booking.payment_amount || null;

      if (existingStripeId && existingInvoiceUrl && bookingAmount === expectedAmount) {
        // reuse
        stripePaymentId = existingStripeId;
        invoiceUrl = existingInvoiceUrl;
      } else {
        // create new payment link
        const created = await InvoiceService.createStripePaymentLink(invoice);
        if (created) {
          stripePaymentId = created.id;
          invoiceUrl = created.url;
        }
      }

      // Update booking with invoice data (store both id and url)
      await InvoiceService.updateBookingInvoiceData(booking.id, invoice, stripePaymentId || undefined, invoiceUrl || undefined);

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
