export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName, lastName, email, phone, notes,
    size, type, style, door, box, finish, hardware, flooring,
    estimateLow, estimateHigh
  } = req.body;

  const WIX_API_KEY = process.env.WIX_API_KEY;
  const WIX_SITE_ID = process.env.WIX_SITE_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const errors = [];

  // 1. SEND EMAIL VIA RESEND
  try {
    const rows = [
      ['Kitchen Size', size], ['Project Type', type], ['Design Style', style],
      ['Door Style', door], ['Box Material', box], ['Finish', finish],
      ['Hardware', hardware], ['Flooring', flooring],
    ].map(([label, value], i) =>
      `<tr style="background:${i%2===0?'#fff':'#F8F6F3'}"><td style="padding:10px 14px;color:#888;width:140px">${label}</td><td style="padding:10px 14px;font-weight:500;text-transform:capitalize">${value||'—'}</td></tr>`
    ).join('');

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Estimator <onboarding@resend.dev>',
        to: ['sprucedhandyman@gmail.com', 'idcarpentry.3d@gmail.com'],
        subject: `New Kitchen Estimate Lead: ${firstName} ${lastName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1C1C">
          <div style="background:#1A1814;padding:28px 32px;border-radius:12px 12px 0 0">
            <p style="color:#B8935A;font-size:11px;letter-spacing:4px;margin:0 0 8px">3D CARPENTRY LLC</p>
            <h1 style="color:#fff;margin:0;font-size:24px">New Estimate Lead</h1>
          </div>
          <div style="background:#F8F6F3;padding:32px;border-radius:0 0 12px 12px">
            <h2 style="font-size:18px;margin:0 0 4px">${firstName} ${lastName}</h2>
            <p style="margin:0 0 4px;color:#555">📧 <a href="mailto:${email}">${email}</a></p>
            <p style="margin:0 0 24px;color:#555">📞 ${phone||'Not provided'}</p>
            <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;border:1px solid #E8E4DE">
              <p style="font-size:11px;letter-spacing:3px;color:#B8935A;margin:0 0 12px">ESTIMATE RANGE</p>
              <p style="font-size:28px;font-weight:700;margin:0">${estimateLow} – ${estimateHigh}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
            ${notes ? `<div style="margin-top:20px;padding:16px 20px;background:#fff;border-radius:10px;border:1px solid #E8E4DE"><p style="font-size:11px;letter-spacing:3px;color:#888;margin:0 0 8px">NOTES</p><p style="margin:0;color:#333">${notes}</p></div>` : ''}
            <p style="margin-top:24px;font-size:12px;color:#999;text-align:center">Submitted via estimate.3dcarpentry.com</p>
          </div>
        </div>`
      })
    });

    if (!emailRes.ok) { console.error('Resend error:', await emailRes.text()); errors.push('Email'); }
  } catch (e) { console.error('Resend exception:', e); errors.push('Email'); }

  // 2. CREATE WIX CRM CONTACT
  try {
    const wixRes = await fetch('https://www.wixapis.com/contacts/v4/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': WIX_API_KEY, 'wix-site-id': WIX_SITE_ID },
      body: JSON.stringify({
        info: {
          name: { first: firstName, last: lastName },
          emails: { items: [{ tag: 'MAIN', email }] },
          phones: phone ? { items: [{ tag: 'MOBILE', phone }] } : undefined,
          labelKeys: { items: ['custom.estimator-lead'] },
        }
      })
    });

    if (!wixRes.ok) { console.error('Wix CRM error:', await wixRes.text()); errors.push('CRM'); }
  } catch (e) { console.error('Wix CRM exception:', e); errors.push('CRM'); }

  if (errors.length === 2) return res.status(500).json({ error: 'Submission failed. Please try again.' });
  return res.status(200).json({ success: true, warnings: errors });
}
