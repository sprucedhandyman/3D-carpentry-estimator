// Deliberately no form data, link text, query strings, fragments or customer routes.
export const CONSENT_KEY = '3d-analytics-consent';
const hosts = new Set(['www.3dcabinetry.com', '3dcabinetry.com', 'estimate.3dcabinetry.com']);
const publicPaths = new Set([
  "/",
  "/privacy",
  "/commercial-capabilities",
  "/request-a-bid",
  "/blog",
  "/services/custom-cabinetry",
  "/services/kitchen-remodels",
  "/services/bathroom-vanities",
  "/services/built-ins",
  "/services/custom-doors",
  "/services/closets-storage",
  "/services/commercial-cabinetry",
  "/blog/cabinet-door-styles-guide",
  "/blog/cabinet-storage-decisions-before-kitchen-remodel",
  "/blog/cnc-nesting-cabinet-parts-cut-sequencing",
  "/blog/cnc-slotted-millwork-panels",
  "/blog/commercial-break-room-casework-coordination",
  "/blog/commercial-casework-edgebanding",
  "/blog/historic-exterior-trim-restoration-commercial-boise",
  "/blog/how-custom-cabinets-are-built-boise-shop",
  "/blog/kitchen-remodel-cost-breakdown-boise",
  "/blog/plywood-vs-mdf-vs-particleboard-cabinet-boxes",
  "/blog/tying-walls-into-existing-ceiling-grid-commercial-boise",
  "/blog/what-a-full-kitchen-remodel-involves"
]);
export function safePage(location) {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (!hosts.has(location.hostname) || !publicPaths.has(path)) return null;
  if (location.hostname === 'estimate.3dcabinetry.com' && path !== '/') return null;
  return `https://${location.hostname}${path}`;
}
export function createAnalytics({ win, doc, measurementId }) {
  let active = false;
  let lastPage = null;
  const usable = /^G-[A-Z0-9]+$/.test(measurementId || '') && safePage(win.location);
  function consent() { try { return win.localStorage.getItem(CONSENT_KEY); } catch { return 'denied'; } }
  function command(...args) { win.gtag(...args); }
  function pageView() {
    const page = safePage(win.location);
    if (!active || consent() !== 'granted' || !page || page === lastPage) return;
    // Fixed title avoids accidental form/customer text and stale SPA titles.
    command('event', 'page_view', { page_location: page, page_referrer: '', page_title: win.location.hostname === 'estimate.3dcabinetry.com' ? 'Residential Estimator' : `3D Cabinetry ${win.location.pathname}`, send_to: measurementId });
    lastPage = page;
  }
  function start() {
    if (!usable || consent() !== 'granted') return;
    if (!active) {
      active = true;
      win.dataLayer = win.dataLayer || [];
      win.gtag = function () { win.dataLayer.push(arguments); };
      command('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      command('consent', 'update', { analytics_storage: 'granted' });
      command('js', new Date());
      command('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: safePage(win.location), page_referrer: '', cookie_domain: '3dcabinetry.com', cookie_expires: 60 * 60 * 24 * 90 });
      const script = doc.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.referrerPolicy = 'no-referrer';
      doc.head.appendChild(script);
    }
    pageView();
  }
  function choose(value) {
    try { win.localStorage.setItem(CONSENT_KEY, value); } catch { return; }
    if (value === 'granted') start();
    else if (active) {
      win[`ga-disable-${measurementId}`] = true;
      command('consent', 'update', { analytics_storage: 'denied' });
      // Reload removes the loaded tag and all listeners after a change of choice.
      win.location.reload();
    }
  }
  function event(name, type) {
    if (!active || consent() !== 'granted' || !safePage(win.location)) return;
    const allowed = { generate_lead: ['website_contact', 'commercial_bid'], estimator_complete: ['residential_estimator'], telephone_click: ['telephone_link'] };
    if (!allowed[name]?.includes(type)) return;
    command('event', name, { interaction_type: type, page_location: safePage(win.location), page_referrer: '', send_to: measurementId });
  }
  return { start, choose, event, pageView, consent, usable: Boolean(usable) };
}
const browser = typeof window !== 'undefined';
export const analytics = browser ? createAnalytics({ win: window, doc: document, measurementId: import.meta.env?.VITE_GA4_MEASUREMENT_ID }) : null;
