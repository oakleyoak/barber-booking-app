import { NotificationsService } from './notifications';
import { BusinessConfig } from '../config/businessConfig';
import { StripePaymentLinks } from './stripeService';
import { supabase } from '../lib/supabase';
import { Language } from '../i18n/LanguageContext';

export interface InvoiceData {
  booking_id: string;
  customer_name: string;
  customer_email: string;
  service: string;
  price: number;
  card_processing_fee: number;
  date: string;
  time: string;
  invoice_number: string;
  due_date: string;
  barber_name: string;
  stripe_payment_url?: string;
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
  createStripePaymentLink: async (invoice: InvoiceData): Promise<{ id: string; url: string } | null> => {
    try {
      const response = await fetch('/.netlify/functions/create-stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round((invoice.price + invoice.card_processing_fee) * 100), // Convert to cents
          currency: 'try',
          description: `Invoice ${invoice.invoice_number} - ${invoice.service}`,
          customer_email: invoice.customer_email,
          metadata: {
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name,
            service: invoice.service,
            booking_date: invoice.date,
            booking_time: invoice.time,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { id: data.id, url: data.url };
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      return null;
    }
  },

  // Send invoice
  sendInvoice: async (booking: any, language: Language = 'en', preview: boolean = false): Promise<{ ok: boolean; error?: string }> => {
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
        invoice_number: booking.invoice_number || InvoiceService.generateInvoiceNumber(),
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      // Save invoice number to booking if it doesn't exist
      if (!booking.invoice_number) {
        try {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ invoice_number: invoice.invoice_number })
            .eq('id', booking.id);
          if (updateError) {
            console.warn('Error updating booking with invoice number:', updateError);
          }
        } catch (e) {
          console.warn('Error updating booking with invoice number:', e);
        }
      }

      // Get payment methods - reuse existing payment link if available
      let finalStripeUrl = '';

      // Check if booking already has a payment link
      if (booking.invoice_url && booking.invoice_url.trim() !== '') {
        finalStripeUrl = booking.invoice_url;
        console.log('Reusing existing payment link:', finalStripeUrl);
      } else if (booking.payment_status !== 'paid') {
        // Create new payment link only if none exists
        const created = await InvoiceService.createStripePaymentLink(invoice);
        if (created) {
          finalStripeUrl = created.url;
          console.log('Created new payment link:', finalStripeUrl);

          // Save the payment link to the booking (only update existing field)
          try {
            await supabase
              .from('bookings')
              .update({ invoice_url: finalStripeUrl })
              .eq('id', booking.id);
            console.log('Saved payment link to database');
          } catch (e) {
            console.warn('Error saving payment link to booking:', e);
          }
        }
      }

      const paymentMethods = InvoiceService.getPaymentMethods(invoice, finalStripeUrl);
      const invoiceHTML = InvoiceService.generateInvoiceHTML(invoice, paymentMethods, BusinessConfig.accentColor);

      // Send via NotificationsService
      const result = await NotificationsService.sendNotification({
        type: 'invoice',
        booking_id: booking.id,
        invoice_data: invoice,
        email_content: {
          to: invoice.customer_email,
          subject: await InvoiceService.getTranslatedEmailSubject(invoice, language),
          html: invoiceHTML,
          preview: preview,
          language: language
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return { ok: false, error: (error as Error).message };
    }
  },

  // Copy invoice to clipboard for WhatsApp sharing
  copyInvoiceToClipboard: async (booking: any, language: Language = 'en'): Promise<{ ok: boolean; error?: string }> => {
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

      const invoice: InvoiceData = {
        booking_id: booking.id,
        customer_name: booking.customer_name,
        customer_email: resolvedCustomerEmail || '',
        service: booking.service,
        price: booking.price,
        card_processing_fee: 50,
        date: booking.date,
        time: booking.time,
        invoice_number: booking.invoice_number || InvoiceService.generateInvoiceNumber(),
        due_date: InvoiceService.calculateDueDate(),
        barber_name: booking.barber_name || booking.users?.name || 'Edge & Co Team'
      };

      // Save invoice number to booking if it doesn't exist
      if (!booking.invoice_number) {
        try {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ invoice_number: invoice.invoice_number })
            .eq('id', booking.id);
          if (updateError) {
            console.warn('Error updating booking with invoice number:', updateError);
          }
        } catch (e) {
          console.warn('Error updating booking with invoice number:', e);
        }
      }

      // Get payment methods - reuse existing payment link if available
      let finalStripeUrl = '';

      // Check if booking already has a payment link
      if (booking.invoice_url && booking.invoice_url.trim() !== '') {
        finalStripeUrl = booking.invoice_url;
        console.log('Reusing existing payment link:', finalStripeUrl);
      } else if (booking.payment_status !== 'paid') {
        // Create new payment link only if none exists
        const created = await InvoiceService.createStripePaymentLink(invoice);
        if (created) {
          finalStripeUrl = created.url;
          console.log('Created new payment link:', finalStripeUrl);

          // Save the payment link to the booking (only update existing field)
          try {
            await supabase
              .from('bookings')
              .update({ invoice_url: finalStripeUrl })
              .eq('id', booking.id);
            console.log('Saved payment link to database');
          } catch (e) {
            console.warn('Error saving payment link to booking:', e);
          }
        }
      }

      const whatsappText = await InvoiceService.formatInvoiceForWhatsApp(invoice, finalStripeUrl, language);

      await navigator.clipboard.writeText(whatsappText);
      return { ok: true };
    } catch (error) {
      console.error('Error copying invoice to clipboard:', error);
      return { ok: false, error: (error as Error).message };
    }
  },

  // Format invoice data as WhatsApp-friendly text
  formatInvoiceForWhatsApp: async (invoice: InvoiceData, paymentUrl: string, language: Language = 'en'): Promise<string> => {
    const translations = await InvoiceService.getTranslations(language);

    const formattedPrice = new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY'
    }).format(invoice.price);

    const formattedFee = new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY'
    }).format(invoice.card_processing_fee);

    const totalAmount = invoice.price + invoice.card_processing_fee;
    const formattedTotal = new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY'
    }).format(totalAmount);

    let whatsappText = `💰 *${translations.invoice.title} - Edge & Co Barbershop*\n\n`;
    whatsappText += `📄 ${translations.invoice.invoiceNumber}: *${invoice.invoice_number}*\n`;
    whatsappText += `📅 ${translations.booking.date}: ${new Date(invoice.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n`;
    whatsappText += `⏰ ${translations.booking.time}: ${invoice.time}\n`;
    whatsappText += `📅 ${translations.invoice.dueDate}: ${new Date(invoice.due_date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n\n`;

    whatsappText += `👤 ${translations.customer.name}: *${invoice.customer_name}*\n`;
    whatsappText += `✂️ ${translations.booking.service}: ${invoice.service}\n`;
    whatsappText += `💵 ${translations.invoice.unitPrice}: ${formattedPrice}\n`;
    whatsappText += `💳 ${translations.invoice.tax}: ${formattedFee}\n`;
    whatsappText += `💰 *${translations.invoice.total}: ${formattedTotal}*\n\n`;

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

    whatsappText += `🙏 ${translations.invoice.thankYou}\n`;
    whatsappText += `📍 ${BusinessConfig.businessName}\n`;
    whatsappText += `📧 ${BusinessConfig.businessEmail}\n`;
    whatsappText += `📞 ${BusinessConfig.businessPhone}\n`;
    whatsappText += `🗺️ <a href="https://www.google.com/maps/place/Edge+%26+Co.+Barbershop/@35.1352688,33.9168446,17z/data=!3m1!4b1!4m6!3m5!1s0x14dfc9db6a1cb8b3:0x514ecec66a829d27!8m2!3d35.1352689!4d33.9217155!16s%2Fg%2F11g2_6cpyb?authuser=0&entry=ttu">Click here to review us on Google Maps</a>\n\n`;
    whatsappText += `#EdgeAndCo #Barbershop #${translations.invoice.title}`;

    return whatsappText;
  },

  // Get translated email subject
  getTranslatedEmailSubject: async (invoice: InvoiceData, language: Language): Promise<string> => {
    const translations = await InvoiceService.getTranslations(language);
    return `💰 ${translations.invoice.title} ${invoice.invoice_number} - Edge & Co Barbershop`;
  },

  // Get translations for the given language
  getTranslations: async (language: Language) => {
    const translationModules = {
      en: () => import('../i18n/translations/en').then(m => m.default),
      tr: () => import('../i18n/translations/tr').then(m => m.default),
      ar: () => import('../i18n/translations/ar').then(m => m.default),
      fa: () => import('../i18n/translations/fa').then(m => m.default),
      el: () => import('../i18n/translations/el').then(m => m.default),
      ru: () => import('../i18n/translations/ru').then(m => m.default),
    };

    try {
      return await translationModules[language]();
    } catch (error) {
      console.warn(`Translation for language '${language}' not found, falling back to English`);
      return await translationModules.en();
    }
  },

  // Get payment methods
  getPaymentMethods: (invoice: InvoiceData, stripeUrl: string): PaymentMethod[] => {
    const methods: PaymentMethod[] = [];

    if (stripeUrl) {
      methods.push({
        id: 'card',
        name: 'Credit/Debit Card',
        type: 'online',
        details: stripeUrl,
        icon: ''
      });
    }

    methods.push({
      id: 'iban',
      name: 'Bank Transfer (IBAN)',
      type: 'iban',
      details: `IBAN: ${BusinessConfig.iban}\nAccount Holder: ${BusinessConfig.accountHolder}\nBank: ${BusinessConfig.bankName}`,
      icon: '🏦'
    });

    return methods;
  },

  // Generate invoice HTML
  generateInvoiceHTML: (invoice: InvoiceData, paymentMethods: PaymentMethod[], accentColor: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid ${accentColor}; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info { margin-bottom: 30px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .customer-info, .invoice-info { flex: 1; }
          .services { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .services th, .services td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .services th { background: ${accentColor}; color: white; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
          .payment-methods { margin-bottom: 30px; }
          .payment-method { background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
          .footer { text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>Edge & Co Barbershop</h1>
            <p>Professional Hair & Beard Services</p>
          </div>

          <div class="company-info">
            <p><strong>Address:</strong> ${BusinessConfig.businessAddress}</p>
            <p><strong>Email:</strong> ${BusinessConfig.businessEmail}</p>
            <p><strong>Phone:</strong> ${BusinessConfig.businessPhone}</p>
          </div>

          <div class="invoice-details">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${invoice.customer_name}</strong></p>
              <p>${invoice.customer_email}</p>
            </div>
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
              <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          </div>

          <table class="services">
            <thead>
              <tr>
                <th>Description</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.service} - ${invoice.barber_name}</td>
                <td>₺${invoice.price.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Card Processing Fee</td>
                <td>₺${invoice.card_processing_fee.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            <p>Total: ₺${(invoice.price + invoice.card_processing_fee).toFixed(2)}</p>
          </div>

          <div class="payment-methods">
            <h3>Payment Methods:</h3>
            ${paymentMethods.map(method => `
              <div class="payment-method">
                <h4>${method.icon} ${method.name}</h4>
                <p>${method.details.replace('\n', '<br>')}</p>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Thank you for choosing Edge & Co Barbershop!</p>
            <p>Professional grooming services with a modern touch.</p>
            <p style="margin-top: 15px;">
              <a href="https://www.google.com/maps/place/Edge+%26+Co.+Barbershop/@35.1352688,33.9168446,17z/data=!3m1!4b1!4m6!3m5!1s0x14dfc9db6a1cb8b3:0x514ecec66a829d27!8m2!3d35.1352689!4d33.9217155!16s%2Fg%2F11g2_6cpyb?authuser=0&entry=ttu" style="color: ${accentColor}; text-decoration: underline;" target="_blank">Click here to review us on Google Maps</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Update booking with invoice data
  updateBookingInvoiceData: async (bookingId: string, invoice: InvoiceData, stripeId?: string, invoiceUrl?: string, isResend: boolean = false): Promise<void> => {
    try {
      const updateData: any = {
        invoice_number: invoice.invoice_number,
        invoice_url: invoiceUrl,
        stripe_payment_id: stripeId,
        updated_at: new Date().toISOString()
      };

      // Only update invoice data if it's not a resend (to preserve original data)
      // Note: invoice_data field doesn't exist in database schema
      // if (!isResend) {
      //   updateData.invoice_data = invoice;
      // }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking with invoice data:', error);
      }
    } catch (error) {
      console.error('Error updating booking invoice data:', error);
    }
  }
};
