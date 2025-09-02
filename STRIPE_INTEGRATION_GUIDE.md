# Stripe Integration Setup Guide

## ✅ What I've Done For You

1. **Created Stripe Payment Function**: `netlify/functions/create-stripe-payment.js`
   - Uses your live secret key securely
   - Creates payment links for invoices
   - Supports Turkish Lira (TRY)

2. **Updated Invoice Service**: Added Stripe payment button to invoices
   - Generates secure payment links
   - Professional payment buttons
   - Async payment processing

3. **Added Stripe Dependency**: Added to package.json

## 🔧 What You Need To Do In Stripe Dashboard

### 1. Get Your Publishable Key
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Update `mobile-pwa/src/config/businessConfig.ts` line 23:
   ```typescript
   publishableKey: 'pk_live_YOUR_ACTUAL_KEY_HERE',
   ```

### 2. Configure Payment Methods
1. In Stripe Dashboard, go to **Settings** → **Payment methods**
2. Enable the payment methods you want:
   - ✅ Cards (Visa, Mastercard, etc.)
   - ✅ Digital wallets (Apple Pay, Google Pay)
   - ✅ Local payment methods for Turkey

### 3. Set Up Webhooks (Optional but Recommended)
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://edgeandco.netlify.app/.netlify/functions/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🚀 Deploy To Netlify

### Option 1: Using Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Option 2: Git Deployment
1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set environment variable in Netlify:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `<<REDACTED - SET IN NETLIFY ENV>>`

## 🧪 Test The Integration

1. **Create a test booking**
2. **Send an invoice** - should include Stripe payment button
3. **Click "Pay with Card"** - should redirect to Stripe checkout
4. **Complete payment** - customer gets receipt

## 💡 Key Features

- **Secure**: Secret key never exposed to frontend
- **Professional**: Branded payment experience
- **Multi-currency**: Supports Turkish Lira
- **Mobile-friendly**: Works on all devices
- **Receipt emails**: Automatic confirmations

## 🔒 Security Notes

- ✅ Secret key stored securely in Netlify functions
- ✅ HTTPS-only payment processing
- ✅ No sensitive data in frontend code
- ✅ Stripe handles all card data securely

## 📞 Need Help?

If payments aren't working:
1. Check Netlify function logs
2. Verify your Stripe keys are correct
3. Ensure webhooks are configured
4. Test in Stripe's test mode first

Your invoice system is now ready for professional payment processing! 🎉
