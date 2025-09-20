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
        const errorText = await response.text();
        console.error('Failed to create Stripe payment link:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      return null;
    }
  },

  // Update booking with invoice and payment information
  updateBookingInvoiceData: async (bookingId: string, invoiceData: InvoiceData, stripePaymentId?: string, invoiceUrl?: string, isResend: boolean = false): Promise<void> => {
    try {
      // Get existing booking data to check what needs updating
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('invoice_number, stripe_payment_id, invoice_url, payment_status')
        .eq('id', bookingId)
        .single();

      // Build update object - only update fields that need updating
      const updateData: any = {
        invoice_sent_at: new Date().toISOString(), // Always update when sending
      };

      // Only update invoice_number if it doesn't exist
      if (!existingBooking?.invoice_number) {
        updateData.invoice_number = invoiceData.invoice_number;
      }

      // Only update payment info if not already paid and we have new payment details
      if (existingBooking?.payment_status !== 'paid') {
        if (stripePaymentId) updateData.stripe_payment_id = stripePaymentId;
        if (invoiceUrl) updateData.invoice_url = invoiceUrl;
        updateData.payment_status = 'pending';
        updateData.payment_amount = invoiceData.price + invoiceData.card_processing_fee;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) {
        console.error('Failed to update booking with invoice data:', error);
        throw error;
      }

      console.log('✅ Updated booking with invoice data:', bookingId, isResend ? '(resend)' : '(new)');
    } catch (error) {
      console.error('Error updating booking invoice data:', error);
      throw error;
    }
  },

  // Available payment methods
  getPaymentMethods: (invoice: InvoiceData, stripeUrl?: string): PaymentMethod[] => {
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
  generateInvoiceHTML: (invoice: InvoiceData, paymentMethods: PaymentMethod[], accentColor?: string): string => {
    const ibanMethod = paymentMethods.find(pm => pm.type === 'iban');
    const onlineMethods = paymentMethods.filter(pm => pm.type === 'online');
  const onlineUrl = onlineMethods.length ? onlineMethods[0].details : '';
    const color = accentColor || BusinessConfig.accentColor || '#3498db';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 720px; margin: 0 auto; padding: 20px; background:#f4f6f8;">
        <div style="background:#ffffff; padding:22px; border-radius:10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div>
                <div style="font-weight:700; color:#2c3e50; font-size:18px;">Edge & Co Barbershop</div>
                <div style="font-size:13px; color:#666;">Shop address: Şair Nedim Sok, Sakarya, Dış Kapı No: Zemin Kat, Gazimağusa Bel. / Gazimağusa KKTC</div>
              </div>
            </div>
              <div style="text-align:right;">
              <div style="font-size:12px; color:#666;">Invoice #</div>
              <div style="font-weight:700; font-size:16px; color:${color};">${invoice.invoice_number}</div>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:18px;">
            <div style="flex:1; min-width:240px;">
              <div style="font-size:13px; color:#888; margin-bottom:6px;">Bill To</div>
              <div style="font-weight:700; font-size:15px; color:#222;">${invoice.customer_name}</div>
              <div style="color:#555; font-size:13px;">${invoice.customer_email}</div>
              <div style="margin-top:8px; font-size:13px; color:#444;">Appointment: ${new Date(invoice.date).toLocaleDateString()} at ${invoice.time}</div>
            </div>

            <div style="width:300px; min-width:220px; background:#fafafa; padding:12px; border-radius:8px;">
              <div style="font-size:13px; color:#888;">Invoice Details</div>
              <div style="margin-top:8px; font-size:13px; color:#333;"><strong>Reference:</strong> ${invoice.invoice_number}</div>
              <div style="margin-top:6px; font-size:13px; color:#333;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
          </div>

          <div style="margin-bottom:18px;">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:${color}; color:#fff; text-align:left;">
                  <th style="padding:12px;">Service</th>
                  <th style="padding:12px;">Barber</th>
                  <th style="padding:12px; text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background:#fff;">
                  <td style="padding:12px; border-bottom:1px solid #eee;">${invoice.service}</td>
                  <td style="padding:12px; border-bottom:1px solid #eee;">${invoice.barber_name}</td>
                  <td style="padding:12px; border-bottom:1px solid #eee; text-align:right; font-weight:700;">₺${invoice.price.toLocaleString('tr-TR')}</td>
                </tr>
                <tr>
                  <td style="padding:12px;">Card Processing Fee</td>
                  <td style="padding:12px;">-</td>
                  <td style="padding:12px; text-align:right;">₺${invoice.card_processing_fee.toLocaleString('tr-TR')}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px; text-align:right; font-weight:800;">Total</td>
                  <td style="padding:12px; text-align:right; font-weight:800;">₺${(invoice.price + invoice.card_processing_fee).toLocaleString('tr-TR')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${onlineUrl ? `
            <div style="text-align:right; margin-bottom:18px;">
              <a href="${onlineUrl}" style="background:${color}; color:#fff; text-decoration:none; padding:10px 14px; border-radius:8px; font-weight:700;">Pay Invoice</a>
            </div>
          ` : ''}

          <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start; margin-bottom:16px;">
            <div style="width:320px; min-width:220px; background:#fff; padding:12px; border-radius:8px; border:1px solid #eee;">
              <div style="font-weight:700; margin-bottom:6px;">Payment Details</div>
              <div style="font-size:13px; margin:4px 0;"><strong>IBAN:</strong> ${BusinessConfig.iban}</div>
              <div style="font-size:13px; margin:4px 0;"><strong>Account Holder:</strong> ${BusinessConfig.accountHolder}</div>
              <div style="font-size:13px; margin:4px 0;"><strong>Bank:</strong> ${BusinessConfig.bankName}</div>
              <div style="font-size:13px; margin:4px 0;"><strong>BIC:</strong> ${BusinessConfig.bic}</div>
              <div style="font-size:12px; color:#777; margin-top:8px;">${BusinessConfig.bankAddress}</div>
              <div style="font-size:12px; color:#555; margin-top:8px;"><strong>Reference:</strong> ${invoice.invoice_number}</div>
            </div>
          </div>

          <div style="background:#fff7ea; padding:12px; border-radius:8px; border-left:4px solid #ffc107; margin-bottom:12px;">
            <div style="font-weight:700; color:#856404;">📋 Payment Terms</div>
            <ul style="color:#856404; margin:8px 0 0 18px;">
              <li>Payment is due within 7 days of invoice date</li>
              <li>Late payments may incur additional charges</li>
              <li>Please contact us if you have any questions about this invoice</li>
            </ul>
          </div>

          <div style="border-top:1px solid #eee; padding-top:14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
              <div style="font-size:13px; color:#444;">
                <div style="font-weight:700;">Edge & Co Barbershop</div>
                <div style="margin-top:6px;">📧 <a href=\"mailto:edgeandcobarber@gmail.com\">edgeandcobarber@gmail.com</a> | 📞 +90 533 854 67 96</div>
                <div style="margin-top:8px;">
                  <a href=\"https://www.google.com/maps/place/Edge+%26+Co.+Barbershop/@35.1352688,33.9168446,17z/data=!3m1!4b1!4m6!3m5!1s0x14dfc9db6a1cb8b3:0x514ecec66a829d27!8m2!3d35.1352689!4d33.9217155!16s%2Fg%2F11g2_6cpyb?authuser=0&entry=ttu\" style=\"color:#3498db; text-decoration:underline;\" target=\"_blank\">Click here to review us on Google</a>
                </div>
              </div>
            <div style="font-size:12px; color:#999; text-align:right;">Automated invoice • Edge & Co</div>
          </div>
        </div>
      </div>
    `;
  },

  // Send invoice via email
  sendInvoice: async (booking: any, preview: boolean = false): Promise<{ ok: boolean; error?: string }> => {
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

      // For resending invoices, reuse existing invoice number if it exists
      const existingInvoiceNumber = booking.invoice_number;
      
      const invoice: InvoiceData = {
        booking_id: booking.id,
        customer_name: booking.customer_name,
        customer_email: resolvedCustomerEmail || '',
        service: booking.service,
        price: booking.price,
        card_processing_fee: 50,
        date: booking.date,
        time: booking.time,
        invoice_number: existingInvoiceNumber || InvoiceService.generateInvoiceNumber(), // Reuse existing number
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      // Get payment methods after determining stripe URL
      let finalStripeUrl = '';
      
      // For resending invoices, always reuse existing payment link if available and not paid
      const existingStripeId = booking.stripe_payment_id;
      const existingInvoiceUrl = booking.invoice_url || booking.stripe_payment_url || null;
      let stripePaymentId: string | undefined = undefined;
      let invoiceUrl: string | undefined = undefined;

      // If invoice exists and payment is still pending, reuse the existing payment link
      if (existingStripeId && existingInvoiceUrl && booking.payment_status !== 'paid') {
        console.log('🔄 Reusing existing payment link for unpaid invoice:', existingInvoiceNumber);
        stripePaymentId = existingStripeId;
        invoiceUrl = existingInvoiceUrl;
        finalStripeUrl = existingInvoiceUrl;
      } else if (booking.payment_status !== 'paid') {
        // Only create new payment link if not already paid
        console.log('🆕 Creating new payment link for invoice:', invoice.invoice_number);
        const created = await InvoiceService.createStripePaymentLink(invoice);
        if (created) {
          stripePaymentId = created.id;
          invoiceUrl = created.url;
          finalStripeUrl = created.url;
        }
      } else {
        // Payment already received, no need for payment link
        console.log('✅ Invoice already paid, not creating payment link');
      }

      const paymentMethods = InvoiceService.getPaymentMethods(invoice, finalStripeUrl);
      const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice, paymentMethods, BusinessConfig.accentColor);

      // Determine if this is a resend (invoice number already exists)
      const isResend = !!existingInvoiceNumber;

      // Update booking with invoice data (store both id and url)
      await InvoiceService.updateBookingInvoiceData(booking.id, invoice, stripePaymentId || undefined, invoiceUrl || undefined, isResend);

      // Send via NotificationsService
    const result = await NotificationsService.sendNotification({
        type: 'invoice',
        booking_id: booking.id,
        invoice_data: invoice,
        email_content: {
          to: invoice.customer_email,
          subject: `💰 Invoice ${invoice.invoice_number} - Edge & Co Barbershop`,
      html: invoiceHTML,
      preview: preview
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return { ok: false, error: (error as Error).message };
    }
  },

  // Copy invoice to clipboard for WhatsApp sharing
  copyInvoiceToClipboard: async (booking: any): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Resolve customer email from customers table when available
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
          console.warn('Error resolving customer email for clipboard invoice:', e);
        }
      }

      // For resending invoices, reuse existing invoice number if it exists
      const existingInvoiceNumber = booking.invoice_number;

      const invoice: InvoiceData = {
        booking_id: booking.id,
        customer_name: booking.customer_name,
        customer_email: resolvedCustomerEmail || '',
        service: booking.service,
        price: booking.price,
        card_processing_fee: 50,
        date: booking.date,
        time: booking.time,
        invoice_number: existingInvoiceNumber || InvoiceService.generateInvoiceNumber(),
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      // Get payment link (reuse existing if available)
      let finalStripeUrl = '';
      let stripePaymentId: string | undefined = undefined;
      let invoiceUrl: string | undefined = undefined;

      const existingStripeId = booking.stripe_payment_id;
      const existingInvoiceUrl = booking.invoice_url || booking.stripe_payment_url || null;

      if (existingStripeId && existingInvoiceUrl && booking.payment_status !== 'paid') {
        console.log('🔄 Reusing existing payment link for clipboard invoice:', existingInvoiceNumber);
        stripePaymentId = existingStripeId;
        invoiceUrl = existingInvoiceUrl;
        finalStripeUrl = existingInvoiceUrl;
      } else if (booking.payment_status !== 'paid') {
        console.log('🆕 Creating new payment link for clipboard invoice:', invoice.invoice_number);
        const created = await InvoiceService.createStripePaymentLink(invoice);
        if (created) {
          stripePaymentId = created.id;
          invoiceUrl = created.url;
          finalStripeUrl = created.url;
          console.log('✅ Payment link created successfully:', created.url);
        } else {
          console.error('❌ Failed to create payment link for clipboard invoice - invoice will be copied without payment link');
          // Show user notification about payment link failure
          if (typeof window !== 'undefined' && (window as any).showNotification) {
            (window as any).showNotification('Payment link creation failed. Invoice copied without payment link.', 'warning');
          }
        }
      }

      // Format invoice as WhatsApp-friendly text
      const whatsappText = InvoiceService.formatInvoiceForWhatsApp(invoice, finalStripeUrl);

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(whatsappText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = whatsappText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Update booking with invoice data (same as email sending)
      await InvoiceService.updateBookingInvoiceData(booking.id, invoice, stripePaymentId, invoiceUrl, !!existingInvoiceNumber);

      return { ok: true };
    } catch (error) {
      console.error('Error copying invoice to clipboard:', error);
      return { ok: false, error: (error as Error).message };
    }
  },

  // Format invoice data as WhatsApp-friendly text
  formatInvoiceForWhatsApp: (invoice: InvoiceData, paymentUrl: string): string => {
    const formattedPrice = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(invoice.price);

    const formattedFee = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(invoice.card_processing_fee);

    const totalAmount = invoice.price + invoice.card_processing_fee;
    const formattedTotal = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(totalAmount);

    let whatsappText = `💰 *INVOICE - Edge & Co Barbershop*\n\n`;
    whatsappText += `📄 Invoice #: *${invoice.invoice_number}*\n`;
    whatsappText += `📅 Date: ${new Date(invoice.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n`;
    whatsappText += `⏰ Time: ${invoice.time}\n`;
    whatsappText += `📅 Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n\n`;

    whatsappText += `👤 Customer: *${invoice.customer_name}*\n`;
    whatsappText += `✂️ Service: ${invoice.service}\n`;
    whatsappText += `💵 Service Price: ${formattedPrice}\n`;
    whatsappText += `💳 Processing Fee: ${formattedFee}\n`;
    whatsappText += `💰 *Total: ${formattedTotal}*\n\n`;

    // Payment Methods Section
    whatsappText += `💳 *PAYMENT METHODS*\n\n`;

    // Card Payment (if available)
    if (paymentUrl) {
      whatsappText += `💳 *Credit/Debit Card:*\n`;
      whatsappText += `${paymentUrl}\n\n`;
    }

    // Bank Transfer (IBAN)
    whatsappText += `🏦 *Bank Transfer (IBAN):*\n`;
    whatsappText += `IBAN: ${BusinessConfig.iban}\n`;
    whatsappText += `Account Holder: ${BusinessConfig.accountHolder}\n`;
    whatsappText += `Bank: ${BusinessConfig.bankName}\n`;
    whatsappText += `BIC: ${BusinessConfig.bic}\n`;
    whatsappText += `Reference: ${invoice.invoice_number}\n\n`;

    whatsappText += `🙏 Thank you for choosing Edge & Co!\n`;
    whatsappText += `📍 Your trusted barbershop\n`;
    whatsappText += `� edgeandcobarber@gmail.com\n`;
    whatsappText += `📞 +90 533 854 67 96\n\n`;
    whatsappText += `#EdgeAndCo #Barbershop #Invoice`;

    return whatsappText;
  }
};
