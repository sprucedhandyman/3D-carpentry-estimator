import { useEffect, useState } from 'react';
import { analytics } from '../lib/analytics.mjs';
export default function AnalyticsConsent() {
  const [open, setOpen] = useState(!analytics?.consent());
  useEffect(() => {
    analytics?.start();
    const phone = event => { if (event.target.closest?.('a[href^="tel:"]')) analytics?.event('telephone_click', 'telephone_link'); };
    document.addEventListener('click', phone);
    return () => document.removeEventListener('click', phone);
  }, []);
  if (!analytics?.usable) return null;
  const choose = value => { analytics.choose(value); setOpen(false); };
  return <>
    <button type="button" className="privacy-choice" onClick={() => setOpen(true)}>Analytics choices</button>
    {open && <section className="analytics-consent" aria-label="Optional website analytics">
      <p>May we use Google Analytics to understand page visits and completed inquiries? It uses cookies. We do not send your form details to Analytics. Optional analytics stays off unless you accept. <a href="https://www.3dcabinetry.com/privacy">Privacy details</a></p>
      <div><button type="button" onClick={() => choose('denied')}>Decline</button><button type="button" onClick={() => choose('granted')}>Accept analytics</button></div>
    </section>}
  </>;
}
