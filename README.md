# 3D Cabinetry Estimator

## Required Vercel Environment Variables

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=quotes@3dcabinetry.com`
- `RESEND_REPLY_TO=quotes@3dcabinetry.com`
- `ESTIMATE_INTERNAL_COPY=quotes@3dcabinetry.com`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `STABILITY_API_KEY`

## Email Delivery Notes

Estimate submissions are sent to:

- the customer email entered in the form
- `ESTIMATE_INTERNAL_COPY` for the business copy
- a Supabase `leads` row for CRM tracking
- the 3D Cabinetry Estimator Leads Google Sheet for lead follow-up

The Google Sheets webhook is maintained in
`integrations/google-sheets/Code.gs`. Deploy that Apps Script as a web app
executing as the sheet owner, allow anonymous web requests, and store the
deployment URL only in the Vercel environment variable above.

If the send fails, the Vercel function logs:

- the Resend HTTP status
- attempted recipients
- sender/reply-to values
- the provider error body
