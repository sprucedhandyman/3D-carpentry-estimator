import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { analytics } from '../lib/analytics.mjs';

const AnalyticsChoicesContext = createContext(null);

export function AnalyticsChoices() {
  const settings = useContext(AnalyticsChoicesContext);
  if (!settings?.available) return null;
  return <button type="button" className="privacy-choice" aria-haspopup="dialog" aria-controls="analytics-consent-panel" aria-expanded={settings.open} onClick={settings.show}>Analytics choices</button>;
}

export default function AnalyticsConsent({ children }) {
  const [open, setOpen] = useState(!analytics?.consent());
  const dialog = useRef(null);
  const returnFocus = useRef(null);
  const available = Boolean(analytics?.usable);
  useEffect(() => {
    analytics?.start();
    const phone = event => { if (event.target.closest?.('a[href^="tel:"]')) analytics?.event('telephone_click', 'telephone_link'); };
    document.addEventListener('click', phone);
    return () => document.removeEventListener('click', phone);
  }, []);
  useEffect(() => {
    if (!available || !dialog.current) return;
    if (open && !dialog.current.open) {
      dialog.current.showModal();
      dialog.current.querySelector('[data-consent-decline]')?.focus({ preventScroll: true });
    } else if (!open && dialog.current.open) {
      dialog.current.close();
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [available, open]);
  const close = () => setOpen(false);
  const choose = value => { analytics.choose(value); close(); };
  const show = event => { returnFocus.current = event.currentTarget; setOpen(true); };
  return <AnalyticsChoicesContext.Provider value={{ available, open, show }}>
    {children}
    {available && <dialog ref={dialog} id="analytics-consent-panel" className="analytics-consent" aria-label="Optional website analytics" onCancel={event => { event.preventDefault(); close(); }}>
      <button type="button" className="consent-close" aria-label="Close analytics choices" onClick={close}>Close</button>
      <p>May we use Google Analytics to understand page visits and completed inquiries? It uses cookies. We do not send your form details to Analytics. Optional analytics stays off unless you accept. <a href="https://www.3dcabinetry.com/privacy">Privacy details</a></p>
      <div><button type="button" data-consent-decline onClick={() => choose('denied')}>Decline</button><button type="button" onClick={() => choose('granted')}>Accept analytics</button></div>
    </dialog>}
  </AnalyticsChoicesContext.Provider>;
}
