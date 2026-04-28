# 3D Cabinetry Estimator

## Required Vercel Environment Variables

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=quotes@3dcabinetry.com`
- `RESEND_REPLY_TO=quotes@3dcabinetry.com`
- `ESTIMATE_INTERNAL_COPY=quotes@3dcabinetry.com`
- `WIX_API_KEY`
- `WIX_SITE_ID`
- `STABILITY_API_KEY`

## Email Delivery Notes

Estimate submissions are sent to:

- the customer email entered in the form
- `ESTIMATE_INTERNAL_COPY` for the business copy

If the send fails, the Vercel function logs:

- the Resend HTTP status
- attempted recipients
- sender/reply-to values
- the provider error body
