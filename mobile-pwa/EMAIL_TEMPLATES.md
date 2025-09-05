Branded Email Templates and Preview
=================================

Files changed:
- `src/services/notifications.ts` — branded HTML templates for reminders, confirmations, and barber assignments.
- `src/services/invoiceService.ts` — branded invoice HTML (logo, bank details, contact info, improved layout).

Previewing emails locally
- Use the existing preview script `tmp_render_invoice.js` at repo root to generate `tmp_invoice_preview.html`.
- Or send with preview flag from the app: set `email_content.preview = true` when calling the send endpoint — the Netlify function will return `email_preview_html` instead of sending.

Notes:
- Images reference the hosted assets at `https://edgeandco.netlify.app/assets/...` — ensure these are publicly accessible in production.
- If you want different shop address/phone, update `BusinessConfig` in `src/config/businessConfig.ts`.
