import { useMemo, useState } from "react";

const PRICING = {
  size: { small: 8000, medium: 18000, large: 30000, open: 45000 },
  type: { refresh: 0, full: 12000, modernize: 8000, layout: 15000 },
  style: { modern: 2000, contemporary: 1500, transitional: 1000, traditional: 800, farmhouse: 600 },
  door: { flat: 0, shaker: 800, raised: 1200, glass: 2000, open: -500 },
  box: { particleboard: 0, mdf: 500, plywood: 1500, solid: 3000 },
  finish: { thermofoil: 0, painted: 800, stained: 1200, natural: 600, twotone: 1500 },
  hardware: { minimal: 400, knobs: 300, bar: 600, cup: 700, mixed: 900 },
  flooring: { existing: 0, laminate: 1500, lvp: 2500, tile: 3500, hardwood: 5000 },
};

const SECTIONS = [
  {
    eyebrow: "Project scope",
    title: "Tell us about your kitchen",
    description: "Start with the size of the space and how much you want to change.",
    fields: [
      {
        key: "size",
        label: "Kitchen size",
        placeholder: "Select the closest size",
        options: [
          ["small", "Small — under 100 sq ft"],
          ["medium", "Medium — 100–200 sq ft"],
          ["large", "Large — 200–300 sq ft"],
          ["open", "Open concept — 300+ sq ft"],
        ],
      },
      {
        key: "type",
        label: "Project type",
        placeholder: "Select the project scope",
        options: [
          ["full", "Full kitchen remodel"],
          ["refresh", "Cabinet refresh"],
          ["modernize", "New functionality"],
          ["layout", "Layout change"],
        ],
      },
    ],
  },
  {
    eyebrow: "Design direction",
    title: "Choose the look you have in mind",
    description: "These choices help us understand the level of detail and fabrication involved.",
    fields: [
      {
        key: "style",
        label: "Design style",
        placeholder: "Select a design style",
        options: [
          ["modern", "Modern"],
          ["contemporary", "Contemporary"],
          ["transitional", "Transitional"],
          ["traditional", "Traditional"],
          ["farmhouse", "Farmhouse"],
        ],
      },
      {
        key: "door",
        label: "Cabinet door style",
        placeholder: "Select a door style",
        options: [
          ["shaker", "Shaker"],
          ["flat", "Flat panel / slab"],
          ["raised", "Raised panel"],
          ["glass", "Glass front"],
          ["open", "Open shelving"],
        ],
      },
    ],
  },
  {
    eyebrow: "Materials & finishes",
    title: "Refine the material choices",
    description: "Choose the closest match. We will confirm exact materials during consultation.",
    fields: [
      {
        key: "box",
        label: "Cabinet box material",
        placeholder: "Select a box material",
        options: [
          ["plywood", "Plywood"],
          ["solid", "Solid wood"],
          ["mdf", "MDF"],
          ["particleboard", "Particleboard"],
        ],
      },
      {
        key: "finish",
        label: "Finish type",
        placeholder: "Select a finish",
        options: [
          ["painted", "Painted"],
          ["stained", "Stained"],
          ["natural", "Natural wood"],
          ["thermofoil", "Thermofoil"],
          ["twotone", "Two-tone"],
        ],
      },
      {
        key: "hardware",
        label: "Hardware style",
        placeholder: "Select a hardware style",
        options: [
          ["minimal", "Minimal / integrated"],
          ["bar", "Bar pulls"],
          ["cup", "Cup pulls"],
          ["knobs", "Knobs"],
          ["mixed", "Mixed"],
        ],
      },
      {
        key: "flooring",
        label: "Flooring",
        placeholder: "Select a flooring plan",
        options: [
          ["existing", "Keep existing"],
          ["lvp", "LVP"],
          ["tile", "Tile"],
          ["hardwood", "Hardwood"],
          ["laminate", "Laminate"],
        ],
      },
    ],
  },
];

const ESTIMATE_FIELDS = SECTIONS.flatMap((section) => section.fields.map((field) => field.key));
const MIN_BUDGET = 10000;
const fmt = (number) => `$${number.toLocaleString()}`;

function estimateRange(total) {
  return `${fmt(Math.round(total * 0.9))} – ${fmt(Math.round(total * 1.15))}`;
}

function CompletionScreen() {
  return (
    <main className="completion-screen">
      <div className="completion-glow" />
      <div className="brand-line">3D Cabinetry · Boise, Idaho</div>
      <h1>We’ve got your details.</h1>
      <p>Our team will review your selections and reach out within one business day to schedule your free consultation.</p>
      <a href="https://3dcabinetry.com">Return to 3D Cabinetry</a>
    </main>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <label className="select-field">
      <span>{field.label}</span>
      <select value={value} onChange={(event) => onChange(field.key, event.target.value)}>
        <option value="">{field.placeholder}</option>
        {field.options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>{label}</option>
        ))}
      </select>
    </label>
  );
}

export default function App() {
  const [form, setForm] = useState({
    size: "",
    type: "",
    style: "",
    door: "",
    box: "",
    finish: "",
    hardware: "",
    flooring: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const estimate = useMemo(() => ESTIMATE_FIELDS.reduce((total, field) => {
    const value = form[field];
    return total + (value ? PRICING[field][value] || 0 : 0);
  }, 0), [form]);

  const completedCount = ESTIMATE_FIELDS.filter((field) => form[field]).length;
  const selectionsComplete = completedCount === ESTIMATE_FIELDS.length;
  const qualified = selectionsComplete && estimate >= MIN_BUDGET;
  const canSubmit = qualified && form.firstName.trim() && form.email.trim() && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimateLow: `$${Math.round(estimate * 0.9).toLocaleString()}`,
          estimateHigh: `$${Math.round(estimate * 1.15).toLocaleString()}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <CompletionScreen />;

  return (
    <div className="estimator-page">
      <header className="estimator-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="brand-line">3D Cabinetry · Boise, Idaho</div>
          <h1>Plan your kitchen.<br />See the range as you go.</h1>
          <p>Make a few practical selections and get a rough project range in about two minutes—no phone call required.</p>
          <a className="hero-button" href="#estimate-builder">Build my estimate</a>
          <div className="hero-trust">
            <span>Free planning range</span>
            <span>No obligation</span>
            <span>Local Boise team</span>
          </div>
        </div>
      </header>

      <main id="estimate-builder" className="estimator-shell">
        <form className="estimator-form" onSubmit={handleSubmit}>
          <div className="form-intro">
            <p className="section-eyebrow">Kitchen estimate builder</p>
            <h2>Build a rough project range.</h2>
            <p>Your estimate updates as you make selections. Choose the closest answer—we’ll confirm the details together later.</p>
          </div>

          {SECTIONS.map((section, index) => (
            <section className="form-section" key={section.eyebrow}>
              <div className="section-number">0{index + 1}</div>
              <div className="section-heading">
                <p className="section-eyebrow">{section.eyebrow}</p>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className="field-grid">
                {section.fields.map((field) => (
                  <SelectField key={field.key} field={field} value={form[field.key]} onChange={set} />
                ))}
              </div>
            </section>
          ))}

          <section className={`form-section contact-section ${qualified ? "is-ready" : ""}`}>
            <div className="section-number">04</div>
            <div className="section-heading">
              <p className="section-eyebrow">Your project details</p>
              <h3>{qualified ? "Where should we send your estimate?" : "Complete the selections above"}</h3>
              <p>{qualified
                ? "Share your contact details and we’ll follow up within one business day."
                : "Once all eight selections are complete, your planning range and contact form will be ready."}</p>
            </div>

            {qualified && (
              <div className="contact-fields">
                <div className="field-grid">
                  <label className="text-field">
                    <span>First name *</span>
                    <input value={form.firstName} onChange={(event) => set("firstName", event.target.value)} placeholder="First name" autoComplete="given-name" required />
                  </label>
                  <label className="text-field">
                    <span>Last name</span>
                    <input value={form.lastName} onChange={(event) => set("lastName", event.target.value)} placeholder="Last name" autoComplete="family-name" />
                  </label>
                  <label className="text-field">
                    <span>Email address *</span>
                    <input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="you@email.com" autoComplete="email" required />
                  </label>
                  <label className="text-field">
                    <span>Phone number</span>
                    <input type="tel" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="(208) 555-0100" autoComplete="tel" />
                  </label>
                </div>
                <label className="text-field notes-field">
                  <span>Anything else we should know?</span>
                  <textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Island, appliances, timeline, special requests…" />
                </label>

                {submitError && <p className="submit-error">{submitError}</p>}
                <button className="submit-button" type="submit" disabled={!canSubmit}>
                  {submitting ? "Submitting…" : "Send my project details"}
                </button>
                <p className="privacy-note">Your information stays private. No spam, ever.</p>
              </div>
            )}

            {selectionsComplete && !qualified && (
              <div className="referral-card">
                <p className="referral-label">Below our typical project minimum</p>
                <h4>We may not be the best fit for this project.</h4>
                <p>Our custom cabinetry projects typically begin around $10,000. For smaller projects, we recommend Noah Kramer at Bird Dog Property Maintenance & Remodel.</p>
                <div className="referral-actions">
                  <a href="tel:+12089172922">Call Noah</a>
                  <a className="secondary" href="mailto:Noah@BirdDogPMR.com">Email Noah</a>
                </div>
              </div>
            )}
          </section>
        </form>

        <aside className="estimate-rail" aria-live="polite">
          <div className="estimate-card">
            <p className="estimate-kicker">Your running estimate</p>
            {completedCount > 0 ? (
              <>
                <div className="estimate-range">{estimateRange(estimate)}</div>
                <p className="estimate-caption">Planning range based on your current selections.</p>
              </>
            ) : (
              <>
                <div className="estimate-placeholder">Start with your kitchen size</div>
                <p className="estimate-caption">Your range will appear here and update as you go.</p>
              </>
            )}

            <div className="completion-row">
              <span>{completedCount} of {ESTIMATE_FIELDS.length} selections</span>
              <span>{Math.round((completedCount / ESTIMATE_FIELDS.length) * 100)}%</span>
            </div>
            <div className="completion-track">
              <span style={{ width: `${(completedCount / ESTIMATE_FIELDS.length) * 100}%` }} />
            </div>

            <div className="estimate-summary">
              {SECTIONS.map((section) => (
                <div key={section.eyebrow}>
                  <span>{section.eyebrow}</span>
                  <strong>{section.fields.filter((field) => form[field.key]).length}/{section.fields.length}</strong>
                </div>
              ))}
            </div>

            <p className="estimate-disclaimer">This is a rough planning range, not a quote. Final pricing requires scope confirmation and an in-home consultation.</p>
          </div>
        </aside>
      </main>

      <footer>3D CABINETRY · BOISE, IDAHO · CUSTOM CABINETRY & WOODWORK</footer>
    </div>
  );
}
