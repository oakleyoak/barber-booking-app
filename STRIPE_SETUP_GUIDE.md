# 🎯 Stripe Setup Guide for Edge & Co Barbershop

## Step 1: Complete Current Screen
Based on your screenshot, follow these steps:

1. **Select "Shareable payment links"** ✅
   - This is perfect for sending payment links in invoices
   - Click "Save" to proceed

## Step 2: Get Your API Keys
1. Go to **Developers → API Keys** in Stripe dashboard
2. Copy your **Publishable key** (starts with `pk_test_...`)
3. Copy your **Secret key** (starts with `sk_test_...`) - Keep this secure!

## Step 3: Create Payment Links for Your Services
1. Go to **Products → Payment Links** in Stripe
2. Create payment links for each service:

### Haircut - ₺700
- Product name: "Haircut - Edge & Co Barbershop"
- Price: ₺700 (Stripe will handle TRY currency)
- Copy the payment link URL

### Beard Trim - ₺400  
- Product name: "Beard Trim - Edge & Co Barbershop"  
- Price: ₺400
- Copy the payment link URL

### Beard Cut - ₺600
- Product name: "Beard Cut - Edge & Co Barbershop"
- Price: ₺600  
- Copy the payment link URL

### Head Shave - ₺500
- Product name: "Head Shave - Edge & Co Barbershop"
- Price: ₺500
- Copy the payment link URL

## Step 4: Update Your Code
Once you have the payment links, update this file:
`mobile-pwa/src/services/stripeService.ts`

Replace these lines:
```typescript
// Replace these with your actual Stripe payment links
haircut: 'https://buy.stripe.com/your-haircut-link',
beardTrim: 'https://buy.stripe.com/your-beard-trim-link', 
beardCut: 'https://buy.stripe.com/your-beard-cut-link',
headShave: 'https://buy.stripe.com/your-head-shave-link',
```

With your actual Stripe payment links.

## Step 5: Test the Integration
1. Create a test booking in your app
2. Click the purple "Receipt" button 
3. Check the invoice email for working Stripe payment buttons

## 🔐 Security Notes
- Never expose your **Secret key** in frontend code
- Keep test mode enabled until ready for live payments
- Use webhooks for payment confirmations (optional)

## 🎨 What Your Customers Will See
When they receive an invoice, they'll see:
- 🏦 IBAN bank transfer option
- 💳 "Pay with Card" button (Stripe)
- 💰 PayPal option (when configured)

Each button will be clickable and redirect to secure payment pages.

## 📞 Need Help?
If you encounter any issues:
1. Check Stripe logs in dashboard
2. Test with Stripe's test card: `4242 4242 4242 4242`
3. Verify payment links are public (not requiring login)

Let me know once you have your payment links, and I'll help you update the code!
