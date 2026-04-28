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
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'quotes@3dcabinetry.com';
  const ESTIMATE_INTERNAL_COPY = process.env.ESTIMATE_INTERNAL_COPY || 'quotes@3dcabinetry.com';
  const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || ESTIMATE_INTERNAL_COPY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const errors = [];
  const normalizedEmail = email?.trim().toLowerCase();
  const internalRecipient = ESTIMATE_INTERNAL_COPY?.trim().toLowerCase();

  // 1. SEND EMAIL VIA RESEND
  try {
    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    const rows = [
      ['Kitchen Size', size], ['Project Type', type], ['Design Style', style],
      ['Door Style', door], ['Box Material', box], ['Finish', finish],
      ['Hardware', hardware], ['Flooring', flooring],
    ].map(([label, value], i) =>
      `<tr style="background:${i%2===0?'#fff':'#F8F6F3'}"><td style="padding:10px 14px;color:#888;width:140px">${label}</td><td style="padding:10px 14px;font-weight:500;text-transform:capitalize">${value||'—'}</td></tr>`
    ).join('');

    const rowsTable = `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
    const notesBlock = notes ? `<div style="margin-top:20px;padding:16px 20px;background:#fff;border-radius:10px;border:1px solid #E8E4DE"><p style="font-size:11px;letter-spacing:3px;color:#888;margin:0 0 8px">NOTES</p><p style="margin:0;color:#333">${notes}</p></div>` : '';

    const businessHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1C1C">
      <div style="background:#1A1814;padding:28px 32px;border-radius:12px 12px 0 0">
        <p style="color:#B8935A;font-size:11px;letter-spacing:4px;margin:0 0 8px">3D CABINETRY</p>
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
        ${rowsTable}
        ${notesBlock}
        <p style="margin-top:24px;font-size:12px;color:#999;text-align:center">Submitted via estimate.3dcabinetry.com</p>
      </div>
    </div>`;

    const customerHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1C1C">
      <div style="background:#1A1814;padding:28px 32px;border-radius:12px 12px 0 0">
        <p style="color:#B8935A;font-size:11px;letter-spacing:4px;margin:0 0 8px">3D CABINETRY</p>
        <h1 style="color:#fff;margin:0;font-size:24px">We Received Your Estimate Request</h1>
      </div>
      <div style="background:#F8F6F3;padding:32px;border-radius:0 0 12px 12px">
        <h2 style="font-size:18px;margin:0 0 12px">Hi ${firstName || 'there'},</h2>
        <p style="margin:0 0 18px;color:#555;line-height:1.6">Thank you for using the 3D Cabinetry estimator. We received your selections and will review your project details shortly.</p>
        <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;border:1px solid #E8E4DE">
          <p style="font-size:11px;letter-spacing:3px;color:#B8935A;margin:0 0 12px">YOUR ROUGH ESTIMATE RANGE</p>
          <p style="font-size:28px;font-weight:700;margin:0">${estimateLow} – ${estimateHigh}</p>
        </div>
        ${rowsTable}
        <p style="margin:20px 0 0;color:#555;line-height:1.6">This is a planning-range estimate only. Final design, scope, and pricing may change after consultation and site review.</p>
        <p style="margin:16px 0 0;color:#555;line-height:1.6">If you have questions, reply to this email or contact us at <a href="mailto:${RESEND_REPLY_TO}">${RESEND_REPLY_TO}</a>.</p>
        <p style="margin-top:24px;font-size:12px;color:#999;text-align:center">3D Cabinetry · Boise, Idaho · estimate.3dcabinetry.com</p>
      </div>
    </div>`;

    async function sendEmail({ to, subject, html, logLabel }) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: `3D Cabinetry <${RESEND_FROM_EMAIL}>`,
          to: [to],
          reply_to: RESEND_REPLY_TO,
          subject,
          html
        })
      });

      if (!resendRes.ok) {
        const resendError = await resendRes.text();
        console.error('Resend error:', {
          context: logLabel,
          status: resendRes.status,
          to,
          from: RESEND_FROM_EMAIL,
          replyTo: RESEND_REPLY_TO,
          body: resendError
        });
        throw new Error(`${logLabel} email failed`);
      }
    }

    if (internalRecipient) {
      await sendEmail({
        to: internalRecipient,
        subject: `New Kitchen Estimate Lead: ${firstName} ${lastName}`,
        html: businessHtml,
        logLabel: 'internal'
      });
    }

    if (normalizedEmail) {
      await sendEmail({
        to: normalizedEmail,
        subject: 'We Received Your 3D Cabinetry Estimate Request',
        html: customerHtml,
        logLabel: 'customer'
      });
    }
  } catch (e) {
    console.error('Email exception:', {
      message: e.message,
      customerEmail: normalizedEmail,
      internalCopy: internalRecipient
    });
    errors.push('Email');
  }

  // 2. CREATE WIX CRM CONTACT
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    }

    const parseEstimate = (value) => {
      if (!value) return null;
      const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : null;
    };

    const leadPayload = {
      first_name: firstName?.trim(),
      last_name: lastName?.trim() || null,
      email: normalizedEmail,
      phone: phone?.trim() || null,
      source: 'estimator',
      status: 'new',
      project_type: type || null,
      kitchen_size: size || null,
      design_style: style || null,
      door_style: door || null,
      box_material: box || null,
      finish: finish || null,
      hardware: hardware || null,
      flooring: flooring || null,
      estimate_low: parseEstimate(estimateLow),
      estimate_high: parseEstimate(estimateHigh),
      client_notes: notes?.trim() || null,
    };

    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(leadPayload)
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('Supabase lead insert error:', {
        status: supabaseRes.status,
        email: normalizedEmail,
        body: errText
      });
      errors.push('Lead');
    }
  } catch (e) {
    console.error('Lead insert exception:', e.message);
    errors.push('Lead');
  }

  if (errors.length === 2) return res.status(500).json({ error: 'Submission failed. Please try again.' });
  return res.status(200).json({ success: true, warnings: errors });
}
