import { useState, useRef } from "react";

const STEPS = ["Start", "Photo", "Project", "Design", "Materials", "Estimate"];

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

const MIN_BUDGET = 15000;

const fmt = (n) => `$${n.toLocaleString()}`;

export default function App() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    size: "", type: "", style: "", door: "", box: "", finish: "", hardware: "", flooring: "",
    firstName: "", lastName: "", email: "", phone: "", notes: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const estimate = () => {
    let total = 0;
    if (form.size) total += PRICING.size[form.size] || 0;
    if (form.type) total += PRICING.type[form.type] || 0;
    if (form.style) total += PRICING.style[form.style] || 0;
    if (form.door) total += PRICING.door[form.door] || 0;
    if (form.box) total += PRICING.box[form.box] || 0;
    if (form.finish) total += PRICING.finish[form.finish] || 0;
    if (form.hardware) total += PRICING.hardware[form.hardware] || 0;
    if (form.flooring) total += PRICING.flooring[form.flooring] || 0;
    return total;
  };

  const qualified = estimate() >= MIN_BUDGET;
  const range = () => { const e = estimate(); return `${fmt(Math.round(e * 0.9))} – ${fmt(Math.round(e * 1.15))}`; };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setPhoto(URL.createObjectURL(file));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const canNext = () => {
    if (step === 1) return photo !== null;
    if (step === 2) return form.size && form.type;
    if (step === 3) return form.style && form.door;
    if (step === 4) return form.box && form.finish && form.hardware && form.flooring;
    return true;
  };


  const handleSubmit = async () => {
    if (!form.firstName || !form.email) return;
    setSubmitting(true);
    setSubmitError(null);
    const est = estimate();
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimateLow: `$${Math.round(est * 0.9).toLocaleString()}`,
          estimateHigh: `$${Math.round(est * 1.15).toLocaleString()}`,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setSubmitError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const SelectCard = ({ field, value, label, sub, icon }) => (
    <button onClick={() => set(field, value)} style={{
      padding: "14px 18px",
      border: form[field] === value ? "2px solid #B8935A" : "1px solid #E0DBD5",
      borderRadius: 10,
      background: form[field] === value ? "#FDF7EF" : "#fff",
      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
      color: form[field] === value ? "#B8935A" : "#444",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", gap: 3,
      width: "100%"
    }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <span style={{ fontSize: 13, fontWeight: form[field] === value ? 600 : 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: form[field] === value ? "#C4A070" : "#999" }}>{sub}</span>}
    </button>
  );

  const s = {
    wrap: { minHeight: "100vh", background: "#F8F6F3", fontFamily: "'DM Sans', sans-serif", color: "#1C1C1C" },
    hero: {
      background: "linear-gradient(160deg, #1A1814 0%, #2D2822 60%, #1C1C1C 100%)",
      padding: "90px 24px 70px", textAlign: "center", position: "relative", overflow: "hidden"
    },
    glow: {
      position: "absolute", top: -80, right: -80, width: 400, height: 400,
      borderRadius: "50%", background: "radial-gradient(circle, rgba(184,147,90,0.12) 0%, transparent 70%)",
      pointerEvents: "none"
    },
    glow2: {
      position: "absolute", bottom: -60, left: -60, width: 300, height: 300,
      borderRadius: "50%", background: "radial-gradient(circle, rgba(184,147,90,0.07) 0%, transparent 70%)",
      pointerEvents: "none"
    },
    logoLine: { color: "#B8935A", fontSize: 11, letterSpacing: 6, textTransform: "uppercase", marginBottom: 20, fontWeight: 500 },
    h1: {
      fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(38px, 6vw, 68px)",
      fontWeight: 600, color: "#fff", lineHeight: 1.08, margin: "0 0 22px"
    },
    sub: { color: "#9A9088", fontSize: 17, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 },
    startBtn: {
      background: "#B8935A", color: "#fff", border: "none", padding: "17px 44px",
      borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer",
      letterSpacing: 0.3, fontFamily: "'DM Sans', sans-serif",
      boxShadow: "0 8px 30px rgba(184,147,90,0.35)", transition: "all 0.2s"
    },
    features: { marginTop: 50, display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" },
    featTitle: { color: "#fff", fontSize: 13, fontWeight: 600 },
    featSub: { color: "#5A5450", fontSize: 12, marginTop: 3 },
    container: { padding: "32px 16px 80px", maxWidth: 760, margin: "0 auto" },
    progress: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 },
    dot: (active, done) => ({
      height: 6, borderRadius: 3,
      width: done ? 20 : active ? 32 : 6,
      background: done ? "#B8935A" : active ? "#1C1C1C" : "#D8D2CC",
      transition: "all 0.35s ease"
    }),
    card: {
      background: "#fff", borderRadius: 20, padding: "40px 36px",
      boxShadow: "0 2px 30px rgba(0,0,0,0.06)", border: "1px solid #F0EDE8"
    },
    stepTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, marginBottom: 6, color: "#1A1814" },
    stepSub: { color: "#9A9088", fontSize: 14, marginBottom: 30, lineHeight: 1.6 },
    label: { fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 10, display: "block", letterSpacing: 0.8, textTransform: "uppercase" },
    section: { marginBottom: 30 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
    grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 },
    liveEstimate: {
      background: "linear-gradient(135deg, #F8F4EE, #FDF7EF)", borderRadius: 12,
      padding: "16px 24px", display: "flex", justifyContent: "space-between",
      alignItems: "center", marginTop: 4, border: "1px solid #EDE5D8"
    },
    btnRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 },
    nextBtn: (enabled) => ({
      background: enabled ? "#1A1814" : "#CCC", color: "#fff", border: "none",
      padding: "15px 34px", borderRadius: 50, fontSize: 14, fontWeight: 600,
      cursor: enabled ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.2s", letterSpacing: 0.2
    }),
    backBtn: {
      background: "transparent", color: "#9A9088", border: "1px solid #E0DBD5",
      padding: "15px 24px", borderRadius: 50, fontSize: 14, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif"
    },
    uploadZone: (dragging, hasPhoto) => ({
      border: `2px dashed ${dragging ? "#B8935A" : hasPhoto ? "#B8935A" : "#DDD8D0"}`,
      borderRadius: 16, padding: 48, textAlign: "center",
      background: dragging ? "#FDF7EF" : hasPhoto ? "#FDF7EF" : "#FAFAF8",
      cursor: hasPhoto ? "default" : "pointer", transition: "all 0.2s",
      minHeight: 220, display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 10
    }),
    estimateBox: {
      background: "linear-gradient(145deg, #1A1814 0%, #2D2822 100%)",
      borderRadius: 18, padding: "36px 32px", textAlign: "center", marginBottom: 28
    },
    estLabel: { color: "#B8935A", fontSize: 11, letterSpacing: 5, textTransform: "uppercase", marginBottom: 10 },
    estNum: { fontFamily: "'Cormorant Garamond', serif", fontSize: 52, color: "#fff", fontWeight: 600, lineHeight: 1 },
    estNote: { color: "#6A6260", fontSize: 12, marginTop: 12, lineHeight: 1.5 },
    pill: (color) => ({
      display: "inline-block", padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: color === "green" ? "#E8F5E9" : "#FFF3E0",
      color: color === "green" ? "#2E7D32" : "#BF5A00", marginBottom: 18
    }),
    inputField: {
      width: "100%", padding: "13px 16px", border: "1px solid #E0DBD5",
      borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
      background: "#FAFAF8", outline: "none", color: "#1A1814"
    },
    textarea: {
      width: "100%", padding: "13px 16px", border: "1px solid #E0DBD5",
      borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
      background: "#FAFAF8", outline: "none", color: "#1A1814",
      minHeight: 90, resize: "vertical"
    },
    submitBtn: {
      width: "100%", background: "#B8935A", color: "#fff", border: "none",
      padding: "18px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 10,
      boxShadow: "0 6px 24px rgba(184,147,90,0.3)", letterSpacing: 0.3
    },
    footer: { textAlign: "center", padding: "24px", color: "#C0B8B0", fontSize: 11, letterSpacing: 2 }
  };

  // Thank you screen
  if (submitted) return (
    <div style={s.wrap}>
      <div style={{ ...s.hero, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={s.glow} />
        <div style={s.glow2} />
        <div style={{ fontSize: 48, marginBottom: 28, color: "#B8935A" }}>✦</div>
        <div style={s.logoLine}>3D Carpentry LLC · Boise, Idaho</div>
        <h1 style={{ ...s.h1, fontSize: "clamp(32px, 5vw, 52px)" }}>We've Got Your Details</h1>
        <p style={s.sub}>Our team will review your project and reach out within 1 business day to schedule your free consultation.</p>
        <div style={{ marginTop: 16, padding: "12px 28px", border: "1px solid #3A3530", borderRadius: 50, color: "#6A6260", fontSize: 12, letterSpacing: 2 }}>
          CUSTOM CABINETRY · KITCHEN REMODELING · BOISE, ID
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>

      {/* ── HERO ── */}
      {step === 0 && (
        <div style={s.hero}>
          <div style={s.glow} />
          <div style={s.glow2} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={s.logoLine}>3D Carpentry LLC · Boise, Idaho</div>
            <h1 style={s.h1}>Design Your Dream<br />Kitchen. Instantly.</h1>
            <p style={s.sub}>Upload a photo, make your selections, and get a rough estimate in minutes — no phone call, no pressure.</p>
            <button style={s.startBtn} onClick={() => setStep(1)}>
              Start Your Free Estimate →
            </button>
            <div style={s.features}>
              {[
                ["📐", "Custom Cabinetry", "Built to your exact specs"],
                ["⚡", "Instant Estimate", "Know your budget upfront"],
                ["🏆", "Boise's Best", "Premium woodcraft since day one"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                  <div style={s.featTitle}>{title}</div>
                  <div style={s.featSub}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEPS 1–4 ── */}
      {step >= 1 && step <= 4 && (
        <div style={s.container}>
          <div style={s.progress}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={s.dot(step === i, step > i)} />
            ))}
          </div>

          <div style={s.card}>

            {/* Step 1: Photo Upload */}
            {step === 1 && (
              <>
                <div style={s.stepTitle}>Upload Your Kitchen Photo</div>
                <div style={s.stepSub}>A photo of your current space helps us understand your starting point and tailor your estimate.</div>
                <div
                  style={s.uploadZone(dragging, !!photo)}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !photo && fileRef.current.click()}
                >
                  {photo ? (
                    <>
                      <img src={photo} alt="Your kitchen" style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 10, objectFit: "cover" }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                        style={{ ...s.backBtn, fontSize: 12, padding: "8px 18px", marginTop: 8 }}>
                        Remove & re-upload
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 44 }}>📷</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Drag & drop your kitchen photo</div>
                      <div style={{ color: "#9A9088", fontSize: 13 }}>or click to browse · JPG, PNG, HEIC accepted</div>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                </div>
                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={() => setStep(0)}>← Back</button>
                  <button style={s.nextBtn(canNext())} disabled={!canNext()} onClick={() => setStep(2)}>Continue →</button>
                </div>
              </>
            )}

            {/* Step 2: Project Scope */}
            {step === 2 && (
              <>
                <div style={s.stepTitle}>Project Scope</div>
                <div style={s.stepSub}>Tell us about the scale and type of your remodel.</div>

                <div style={s.section}>
                  <span style={s.label}>Kitchen Size</span>
                  <div style={s.grid2}>
                    {[
                      ["small", "Small", "Under 100 sq ft", "🏠"],
                      ["medium", "Medium", "100–200 sq ft", "🏡"],
                      ["large", "Large", "200–300 sq ft", "🏘️"],
                      ["open", "Open Concept", "300+ sq ft", "🏛️"],
                    ].map(([v, l, d, icon]) => (
                      <SelectCard key={v} field="size" value={v} label={l} sub={d} icon={icon} />
                    ))}
                  </div>
                </div>

                <div style={s.section}>
                  <span style={s.label}>Project Type</span>
                  <div style={s.grid2}>
                    {[
                      ["full", "Full Kitchen Remodel", "Complete transformation"],
                      ["refresh", "Cabinet Refresh", "New doors & finishes only"],
                      ["modernize", "New Functionality", "Storage & layout upgrades"],
                      ["layout", "Layout Change", "Structural redesign"],
                    ].map(([v, l, d]) => (
                      <SelectCard key={v} field="type" value={v} label={l} sub={d} />
                    ))}
                  </div>
                </div>

                {form.size && form.type && (
                  <div style={s.liveEstimate}>
                    <span style={{ fontSize: 13, color: "#9A9088" }}>Starting estimate</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 }}>{fmt(estimate())}</span>
                  </div>
                )}

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={() => setStep(1)}>← Back</button>
                  <button style={s.nextBtn(canNext())} disabled={!canNext()} onClick={() => setStep(3)}>Continue →</button>
                </div>
              </>
            )}

            {/* Step 3: Design */}
            {step === 3 && (
              <>
                <div style={s.stepTitle}>Design Preferences</div>
                <div style={s.stepSub}>Pick the aesthetic direction that fits your vision.</div>

                <div style={s.section}>
                  <span style={s.label}>Design Style</span>
                  <div style={s.grid3}>
                    {[
                      ["modern", "Modern", "🖤"],
                      ["contemporary", "Contemporary", "⬜"],
                      ["transitional", "Transitional", "🔲"],
                      ["traditional", "Traditional", "🪵"],
                      ["farmhouse", "Farmhouse", "🌾"],
                    ].map(([v, l, icon]) => (
                      <SelectCard key={v} field="style" value={v} label={l} icon={icon} />
                    ))}
                  </div>
                </div>

                <div style={s.section}>
                  <span style={s.label}>Cabinet Door Style</span>
                  <div style={s.grid3}>
                    {[
                      ["shaker", "Shaker", "🚪"],
                      ["flat", "Flat Panel / Slab", "◻"],
                      ["raised", "Raised Panel", "🔳"],
                      ["glass", "Glass Front", "🪟"],
                      ["open", "Open Shelving", "📚"],
                    ].map(([v, l, icon]) => (
                      <SelectCard key={v} field="door" value={v} label={l} icon={icon} />
                    ))}
                  </div>
                </div>

                {form.style && form.door && (
                  <div style={s.liveEstimate}>
                    <span style={{ fontSize: 13, color: "#9A9088" }}>Running estimate</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 }}>{fmt(estimate())}</span>
                  </div>
                )}

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={() => setStep(2)}>← Back</button>
                  <button style={s.nextBtn(canNext())} disabled={!canNext()} onClick={() => setStep(4)}>Continue →</button>
                </div>
              </>
            )}

            {/* Step 4: Materials */}
            {step === 4 && (
              <>
                <div style={s.stepTitle}>Materials & Finishes</div>
                <div style={s.stepSub}>These selections significantly shape both the look and cost of your kitchen.</div>

                <div style={s.section}>
                  <span style={s.label}>Cabinet Box Material</span>
                  <div style={s.grid2}>
                    {[
                      ["plywood", "Plywood", "Best durability & moisture resistance"],
                      ["solid", "Solid Wood", "Premium, heirloom quality"],
                      ["mdf", "MDF", "Smooth finish, budget-friendly"],
                      ["particleboard", "Particleboard", "Most affordable option"],
                    ].map(([v, l, d]) => (
                      <SelectCard key={v} field="box" value={v} label={l} sub={d} />
                    ))}
                  </div>
                </div>

                <div style={s.section}>
                  <span style={s.label}>Finish Type</span>
                  <div style={s.grid3}>
                    {[
                      ["painted", "Painted"],
                      ["stained", "Stained"],
                      ["natural", "Natural Wood"],
                      ["thermofoil", "Thermofoil"],
                      ["twotone", "Two-Tone"],
                    ].map(([v, l]) => (
                      <SelectCard key={v} field="finish" value={v} label={l} />
                    ))}
                  </div>
                </div>

                <div style={s.section}>
                  <span style={s.label}>Hardware Style</span>
                  <div style={s.grid3}>
                    {[
                      ["minimal", "Minimal / Integrated"],
                      ["bar", "Bar Pulls"],
                      ["cup", "Cup Pulls"],
                      ["knobs", "Knobs"],
                      ["mixed", "Mixed"],
                    ].map(([v, l]) => (
                      <SelectCard key={v} field="hardware" value={v} label={l} />
                    ))}
                  </div>
                </div>

                <div style={s.section}>
                  <span style={s.label}>Flooring</span>
                  <div style={s.grid3}>
                    {[
                      ["existing", "Keep Existing"],
                      ["lvp", "LVP"],
                      ["tile", "Tile"],
                      ["hardwood", "Hardwood"],
                      ["laminate", "Laminate"],
                    ].map(([v, l]) => (
                      <SelectCard key={v} field="flooring" value={v} label={l} />
                    ))}
                  </div>
                </div>

                <div style={s.btnRow}>
                  <button style={s.backBtn} onClick={() => setStep(3)}>← Back</button>
                  <button style={s.nextBtn(canNext())} disabled={!canNext()} onClick={() => setStep(5)}>
                    See My Estimate →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 5: ESTIMATE + LEAD CAPTURE ── */}
      {step === 5 && (
        <div style={s.container}>
          <div style={s.progress}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={s.dot(false, true)} />
            ))}
          </div>

          <div style={s.card}>
            <div style={s.estimateBox}>
              <div style={s.estLabel}>Your Rough Estimate</div>
              <div style={s.estNum}>{range()}</div>
              <div style={s.estNote}>
                Based on your selections · Final pricing requires a free in-home consultation<br />
                Estimate reflects materials, labor, and installation
              </div>
            </div>

            {qualified ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <span style={s.pill("green")}>✓ Great fit for 3D Carpentry</span>
                  <p style={{ color: "#555", fontSize: 14, lineHeight: 1.75, maxWidth: 460, margin: "0 auto" }}>
                    Your project aligns perfectly with our work. Enter your details below and we'll reach out within 1 business day to schedule your free consultation.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={s.grid2}>
                    <div>
                      <label style={s.label}>First Name *</label>
                      <input style={s.inputField} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jason" />
                    </div>
                    <div>
                      <label style={s.label}>Last Name *</label>
                      <input style={s.inputField} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label style={s.label}>Email Address *</label>
                    <input style={s.inputField} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jason@email.com" />
                  </div>
                  <div>
                    <label style={s.label}>Phone Number</label>
                    <input style={s.inputField} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(208) 555-0100" />
                  </div>
                  <div>
                    <label style={s.label}>Anything else we should know?</label>
                    <textarea style={s.textarea} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Islands, appliances, special requests, timeline..." />
                  </div>

                  {submitError && (
                    <p style={{ color: "#C0392B", fontSize: 13, textAlign: "center", padding: "8px", background: "#FEF0EE", borderRadius: 8 }}>
                      {submitError}
                    </p>
                  )}
                  <button
                    style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
                    disabled={!form.firstName || !form.email || submitting}
                    onClick={handleSubmit}>
                    {submitting ? "Submitting..." : "Submit My Project Details →"}
                  </button>
                  <p style={{ fontSize: 11, color: "#B0A898", textAlign: "center", marginTop: 4 }}>
                    We never share your information. No spam, ever.
                  </p>
                </div>
              </>
            ) : (
              <div style={{ background: "#FFF8F0", border: "1px solid #F0DEC0", borderRadius: 16, padding: "36px 32px", textAlign: "center" }}>
                <span style={s.pill("orange")}>Below Our Minimum Project Size</span>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, marginBottom: 14, color: "#1A1814" }}>
                  We May Not Be the Best Fit
                </h3>
                <p style={{ color: "#666", fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>
                  Our custom cabinetry projects typically start at $15,000. For smaller budgets, we'd recommend exploring semi-custom options from IKEA, Home Depot, or a local handyman — they'll serve you well.
                </p>
                <button style={s.backBtn} onClick={() => setStep(2)}>← Adjust My Selections</button>
              </div>
            )}
          </div>
        </div>
      )}

      {step > 0 && (
        <div style={s.footer}>
          3D CARPENTRY LLC · BOISE, IDAHO · CUSTOM CABINETRY & WOODWORK
        </div>
      )}
    </div>
  );
}
