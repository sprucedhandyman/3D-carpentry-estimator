# GA4 release preparation — October 23, 2026

Tracking is prepared but **inactive**. No measurement ID is configured. No GA4 property was created by this task and no live collection was verified.

## Coordinated Google setup

The earlier analytics task owns Chrome Analytics tab 657822369 in session 01a168c9-a44c-71e2-9f00-1ce1a1f29022. Parent reports business-account reauthentication for jason@3dcabinetry.com is pending user action. Do not bypass tab ownership or independently create a duplicate property.

After authorized sign-in, check all accessible existing accounts/properties first. If none exist, use 3D Cabinetry, America/Boise (Mountain time) and USD. Stop before accepting any explicit terms agreement or granting new security access; return the exact agreement/permission for approval. Do not enable Google Signals, advertising personalization, user-provided data collection, ad integrations or unrelated account data sharing. Choose minimal retention and leave optional sharing disabled.

Create/configure a web stream covering www.3dcabinetry.com and estimate.3dcabinetry.com. **Turn off enhanced measurement**, including history page views, form interactions, outbound links, downloads and search, before enabling this integration. The application manually sends sanitized page views and successful submissions. Configure the same public measurement ID in the two projects only after confirming those property settings. Public measurement IDs are not secrets.

Set `VITE_GA4_MEASUREMENT_ID=G-…` in the appropriate build environment. Keep review/preview environments unconfigured. Host allowlisting additionally blocks collection on localhost and Vercel preview hosts. Changing the public build value requires a new build; do not publish production without Jason's separate approval.

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
