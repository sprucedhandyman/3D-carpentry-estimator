# GA4 release preparation — October 23, 2026

Public measurement ID **G-VDFCLT1SDT**, supplied by Jason from his Google tag installation screen, is configured in the tracked `.env.production` for Vite production-mode builds. This is public browser configuration, not a secret. Production has not been published by this task. Preview/local host exclusions and explicit consent remain in force; no live collection has been verified.

## Coordinated Google setup

Jason created GA4 himself and supplied measurement ID G-VDFCLT1SDT. This implementation task did not create an account/property, accept terms, add OAuth grants or modify Google Analytics settings. The parent/owning task handles verification of the account, property, stream, America/Boise timezone, USD currency and minimal data settings. Do not create a duplicate property.

Before production publication, verify the existing stream has **enhanced measurement turned off**, including history page views, form interactions, outbound links, downloads and search. Do not enable Google Signals, advertising personalization, user-provided data collection, ad integrations or unrelated data sharing. Review retention and leave optional sharing disabled. No additional terms acceptance is required merely to use the supplied public ID; any new explicit agreement or security grant must still be handled separately.

Both repositories version only `VITE_GA4_MEASUREMENT_ID=G-VDFCLT1SDT` in `.env.production`. Vite loads it during `npm run build`, including PR preview builds. The runtime hostname allowlist independently prevents collection on localhost and Vercel preview domains even though the public ID exists in their bundles. Other `.env*` files remain ignored; never put secrets in this tracked file. Existing build-environment values can override the file, so verify the actual generated bundle.

The configuration will become eligible to collect only after a separately approved production publication, on an allowlisted public route, and after explicit browser consent. Do not publish while property/settings verification is incomplete. No production environment variables or deployments were changed by this configuration commit.

## Event contract

- `page_view`: one per document/public route, after opt-in. No extra page views for anchors. `send_page_view: false` prevents the config call from sending a duplicate; repeated initialization is idempotent, including React StrictMode.
- `generate_lead`: after Formspree returns an HTTP success; `interaction_type` is only `website_contact` or `commercial_bid`. Preview forms never contact Formspree and never report a lead.
- `estimator_complete`: after `/api/submit` returns HTTP success AND `{success:true}`. This means the existing endpoint accepted the inquiry; the endpoint may still return warnings for individual email/CRM/Sheet operations. It does not guarantee all downstream delivery.
- `telephone_click`: activating a telephone link only; it is not an actual or answered call. Do not mark this as a lead conversion.

No form values, estimates, customer IDs, names, emails, phones, addresses, free text, link labels, query parameters or fragments are passed to Analytics. The customer project portal and non-public routes are excluded. Referrer is deliberately blank, sacrificing attribution detail to avoid leaking customer URLs. Optional analytics is off until consent; declining sends no consent ping because the Google script has not loaded. Consent choice is stored per origin, so the estimator asks separately. Analytics cookies expire after 90 days; browser cookie clearing is described in the privacy page. Declining after acceptance disables collection and reloads the page to remove the loaded tag.

The same integration lives in the separate estimator branch `codex/ga4-tracking-20261023`.

## Required release verification (pending)

1. Review production publication separately; do not merge these drafts yet.
2. Confirm property/account identity, timezone/currency, sharing, enhanced-measurement settings and measurement ID.
3. On the approved deployment, verify no Analytics script/request before consent and no request after decline.
4. After acceptance, use browser network inspection + GA4 DebugView/Realtime to verify exactly one sanitized page view and URL/referrer handling. Test URL query strings using synthetic non-sensitive placeholders only.
5. Verify one successful inquiry and one estimator completion with an approved safe test mechanism. No real leads/test emails were submitted by this task. Verify failed/rejected submissions produce no success event.
6. Confirm key events for `generate_lead` and `estimator_complete` in the property; do not count telephone clicks as calls or leads.

Local verification: `node --test tests/analytics.test.mjs` uses mocked browser and provider transports. It never sends network requests. These tests verify consent defaults, duplicate suppression, URL stripping, excluded hosts/routes, fixed event parameters, preview isolation and provider failure handling. Passing these tests is not proof of a working GA4 property.

Google references: https://developers.google.com/analytics/devguides/collection/ga4/reference/config ; https://developers.google.com/tag-platform/gtagjs ; https://support.google.com/analytics/answer/9216061
