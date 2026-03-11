import { useState, useRef } from "react";

const INGREDIENTS = [
  { id: 1, name: "Red Beet Root", form: "Powder", purpose: "Flavor", healthBenefit: "Detox and Cleansing", scientificSource: "Clinical study", avgCost: 1.0, riskIngredient: "Bad interaction", riskRegulatory: "Japan", riskSupplyChain: "Seasonal Ingredient", riskIntolerance: "Low" },
  { id: 2, name: "Fructo-Oligosaccharides", form: "Extract", purpose: "Stability", healthBenefit: "Gut Health", scientificSource: "Clinical study", avgCost: 1.5, riskIngredient: "Strong flavor", riskRegulatory: "Korea", riskSupplyChain: "Long lead time", riskIntolerance: "Low" },
  { id: 3, name: "Pomegranate", form: "Liquid", purpose: "Adaptagen", healthBenefit: "Circulation", scientificSource: "We've used before", avgCost: 2.0, riskIngredient: "Too sweet for some", riskRegulatory: "Thailand", riskSupplyChain: "Hard to source", riskIntolerance: "Low" },
  { id: 4, name: "Guar Gum", form: "Powder", purpose: "Flavor", healthBenefit: "Men's health", scientificSource: "Needs more validation", avgCost: 1.0, riskIngredient: "Too bitter for others", riskRegulatory: "LATAM", riskSupplyChain: "Very expensive", riskIntolerance: "Mild" },
  { id: 5, name: "Natural Flavors", form: "Extract", purpose: "Stability", healthBenefit: "Women's health", scientificSource: "Clinical study", avgCost: 1.5, riskIngredient: "Expires quickly", riskRegulatory: "Ukraine", riskSupplyChain: "Seasonal Ingredient", riskIntolerance: "Low" },
  { id: 6, name: "Citric Acid", form: "Liquid", purpose: "Adaptagen", healthBenefit: "Detox and Cleansing", scientificSource: "We've used before", avgCost: 2.0, riskIngredient: "Animal by product", riskRegulatory: "Russia", riskSupplyChain: "Long lead time", riskIntolerance: "Low" },
  { id: 7, name: "Silicia (bamboo)", form: "Powder", purpose: "Flavor", healthBenefit: "Gut Health", scientificSource: "Needs more validation", avgCost: 1.0, riskIngredient: "Bad interaction", riskRegulatory: "—", riskSupplyChain: "Hard to source", riskIntolerance: "Low" },
  { id: 8, name: "Steviol Glycosides", form: "Extract", purpose: "Stability", healthBenefit: "Circulation", scientificSource: "Clinical study", avgCost: 1.5, riskIngredient: "Strong flavor", riskRegulatory: "Japan", riskSupplyChain: "Very expensive", riskIntolerance: "Mild" },
  { id: 9, name: "Dicalcium Phosphate", form: "Liquid", purpose: "Adaptagen", healthBenefit: "Men's health", scientificSource: "We've used before", avgCost: 2.0, riskIngredient: "Too sweet for some", riskRegulatory: "Korea", riskSupplyChain: "Seasonal Ingredient", riskIntolerance: "Low" },
];

const BENEFIT_COLORS = {
  "Detox and Cleansing": { bg: "rgba(52,211,153,0.12)", text: "#34d399", border: "rgba(52,211,153,0.25)" },
  "Gut Health":          { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  "Circulation":         { bg: "rgba(239,68,68,0.12)",   text: "#ef4444", border: "rgba(239,68,68,0.25)" },
  "Men's health":        { bg: "rgba(99,179,237,0.12)",  text: "#63b3ed", border: "rgba(99,179,237,0.25)" },
  "Women's health":      { bg: "rgba(217,70,239,0.12)",  text: "#d946ef", border: "rgba(217,70,239,0.25)" },
};

const SOURCE_BADGE = {
  "Clinical study":        { color: "#34d399", label: "✓ Clinical Study" },
  "We've used before":     { color: "#63b3ed", label: "★ Used Before" },
  "Needs more validation": { color: "#f59e0b", label: "⚠ Needs Validation" },
};

const SUPPLY_RISK_LEVEL = {
  "Seasonal Ingredient": "Medium",
  "Long lead time":      "Medium",
  "Hard to source":      "High",
  "Very expensive":      "High",
};

const getRiskLevel = (val) => SUPPLY_RISK_LEVEL[val] || "Low";
const PURPOSES = ["All", ...Array.from(new Set(INGREDIENTS.map(i => i.purpose)))];
const BENEFITS = ["All", ...Array.from(new Set(INGREDIENTS.map(i => i.healthBenefit)))];

const BenefitTag = ({ benefit }) => {
  const s = BENEFIT_COLORS[benefit] || { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{benefit}</span>;
};

const SourceBadge = ({ source }) => {
  const s = SOURCE_BADGE[source] || { color: "#94a3b8", label: source };
  return <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>;
};

export default function App() {
  const [tab, setTab] = useState("explore");
  const [query, setQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shortlist, setShortlist] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterPurpose, setFilterPurpose] = useState("All");
  const [filterBenefit, setFilterBenefit] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [formulationName, setFormulationName] = useState("My Formulation");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("formulateiq_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const saveKey = (k) => { setApiKey(k); localStorage.setItem("formulateiq_key", k); setShowKeyInput(false); };

  const displayed = (aiResults || INGREDIENTS).filter(i =>
    (filterPurpose === "All" || i.purpose === filterPurpose) &&
    (filterBenefit === "All" || i.healthBenefit === filterBenefit)
  );

  const sorted = [...displayed].sort((a, b) => {
    if (sortBy === "cost-asc") return a.avgCost - b.avgCost;
    if (sortBy === "cost-desc") return b.avgCost - a.avgCost;
    return 0;
  });

  const isShortlisted = (id) => shortlist.some(i => i.id === id);
  const toggleShortlist = (ing) => { setShortlist(prev => isShortlisted(ing.id) ? prev.filter(i => i.id !== ing.id) : [...prev, ing]); setAiSummary(""); };

  const callClaude = async (system, userMsg) => {
    const key = apiKey || process.env.REACT_APP_ANTHROPIC_KEY;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system, messages: [{ role: "user", content: userMsg }] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.map(c => c.text || "").join("") || "";
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAiResults(null);
    const list = INGREDIENTS.map(i => `ID:${i.id} | ${i.name} | Form:${i.form} | Purpose:${i.purpose} | Benefit:${i.healthBenefit} | Source:${i.scientificSource}`).join("\n");
    try {
      const text = await callClaude(
        "You are a nutraceutical formulation expert. Given a product concept, return ONLY a JSON array of ingredient IDs (integers) that are relevant. Return raw JSON only, no markdown, no explanation.",
        `Product concept: "${query}"\n\nIngredients:\n${list}\n\nReturn a JSON array of matching IDs.`
      );
      const ids = JSON.parse(text.replace(/```json|```/g, "").trim());
      const matched = INGREDIENTS.filter(i => ids.includes(i.id));
      setAiResults(matched.length ? matched : INGREDIENTS);
    } catch (e) {
      alert("AI search failed: " + e.message + "\n\nCheck your API key in Settings.");
      setAiResults(INGREDIENTS);
    }
    setLoading(false);
  };

  const generateSummary = async () => {
    if (!shortlist.length) return;
    setSummaryLoading(true);
    setAiSummary("");
    const ingList = shortlist.map(i => `${i.name} (${i.form}, ${i.healthBenefit}, Purpose: ${i.purpose}, Cost: $${i.avgCost}/unit, Ingredient risk: ${i.riskIngredient}, Supply: ${i.riskSupplyChain}, Regulatory: ${i.riskRegulatory}, Intolerance: ${i.riskIntolerance})`).join("\n");
    try {
      const summary = await callClaude(
        "You are a nutraceutical product development expert. Write a concise 3-4 sentence formulation summary covering: the product's combined health benefits, key risks to flag for the development team, and any notable cost or sourcing considerations. Be specific and practical. No bullet points — flowing prose only.",
        `Formulation name: "${formulationName}"\n\nSelected ingredients:\n${ingList}\n\nWrite a formulation briefing summary.`
      );
      setAiSummary(summary);
    } catch (e) {
      setAiSummary("Unable to generate summary. Please check your API key in Settings.");
    }
    setSummaryLoading(false);
  };

  const totalCost = shortlist.reduce((s, i) => s + i.avgCost, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", color: "#dde4ee" }}>
      <div style={{ background: "linear-gradient(to right, #0b1628, #0e2040)", borderBottom: "1px solid rgba(148,163,184,0.1)", padding: "0 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚗</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px", color: "#f0f6ff" }}>FormulateIQ</div>
              <div style={{ fontSize: 10, color: "#6ee7b7", letterSpacing: "0.1em", fontWeight: 600 }}>INGREDIENT INTELLIGENCE PLATFORM</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[["explore", "🔬 Explore"], ["formulation", `🧪 Builder ${shortlist.length ? `(${shortlist.length})` : ""}`]].map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, borderRadius: 8, background: tab === v ? "rgba(110,231,183,0.15)" : "transparent", color: tab === v ? "#6ee7b7" : "#64748b", borderBottom: tab === v ? "2px solid #6ee7b7" : "2px solid transparent" }}>{label}</button>
            ))}
            <button onClick={() => setShowKeyInput(v => !v)} title="API Key Settings" style={{ marginLeft: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", padding: "7px 12px", cursor: "pointer", fontSize: 14 }}>⚙️</button>
          </div>
        </div>
      </div>

      {showKeyInput && (
        <div style={{ background: "#0d1929", borderBottom: "1px solid rgba(110,231,183,0.15)", padding: "14px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>Anthropic API Key:</span>
            <input defaultValue={apiKey} type="password" placeholder="sk-ant-..." onBlur={e => saveKey(e.target.value)} style={{ flex: 1, maxWidth: 420, background: "rgba(8,12,20,0.9)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 8, padding: "8px 12px", color: "#dde4ee", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <span style={{ fontSize: 11, color: "#475569" }}>Stored locally in your browser. Never sent anywhere except Anthropic's API.</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px" }}>
        {tab === "explore" && (
          <>
            <div style={{ background: "linear-gradient(135deg, rgba(110,231,183,0.07), rgba(59,130,246,0.05))", border: "1px solid rgba(110,231,183,0.18)", borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", letterSpacing: "0.08em", marginBottom: 10 }}>✦ AI PRODUCT CONCEPT SEARCH</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Describe the product you want to make..." style={{ flex: 1, background: "rgba(8,12,20,0.8)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 9, padding: "12px 16px", color: "#dde4ee", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                <button onClick={handleSearch} disabled={loading || !query.trim()} style={{ padding: "12px 24px", background: loading ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 9, color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Matching…" : "Match →"}</button>
              </div>
              {aiResults && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#6ee7b7" }}>
                  ✓ <strong>{aiResults.length} ingredient{aiResults.length !== 1 ? "s" : ""}</strong> matched your concept
                  <button onClick={() => { setAiResults(null); setQuery(""); }} style={{ marginLeft: 10, background: "none", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7", borderRadius: 5, padding: "2px 9px", cursor: "pointer", fontSize: 11 }}>Clear</button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Purpose:</span>
              {PURPOSES.map(p => (
                <button key={p} onClick={() => setFilterPurpose(p)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${filterPurpose === p ? "#6ee7b7" : "rgba(100,116,139,0.3)"}`, background: filterPurpose === p ? "rgba(110,231,183,0.12)" : "transparent", color: filterPurpose === p ? "#6ee7b7" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{p}</button>
              ))}
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>Benefit:</span>
              {BENEFITS.map(b => (
                <button key={b} onClick={() => setFilterBenefit(b)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${filterBenefit === b ? "#a78bfa" : "rgba(100,116,139,0.3)"}`, background: filterBenefit === b ? "rgba(167,139,250,0.12)" : "transparent", color: filterBenefit === b ? "#a78bfa" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{b}</button>
              ))}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: "auto", background: "rgba(8,12,20,0.9)", border: "1px solid rgba(100,116,139,0.25)", color: "#dde4ee", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                <option value="default">Sort: Default</option>
                <option value="cost-asc">Cost ↑</option>
                <option value="cost-desc">Cost ↓</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
              {sorted.map(ing => (
                <div key={ing.id} onClick={() => setSelected(ing)} style={{ background: isShortlisted(ing.id) ? "linear-gradient(135deg, rgba(110,231,183,0.09), rgba(59,130,246,0.05))" : "rgba(255,255,255,0.025)", border: `1px solid ${isShortlisted(ing.id) ? "rgba(110,231,183,0.35)" : "rgba(255,255,255,0.06)"}`, borderRadius: 13, padding: "18px 20px", cursor: "pointer", transition: "all 0.18s", position: "relative" }}>
                  {isShortlisted(ing.id) && <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, background: "#6ee7b7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#080c14", fontWeight: 800 }}>✓</div>}
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f6ff", marginBottom: 5 }}>{ing.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{ing.form} · Purpose: <span style={{ color: "#94a3b8" }}>{ing.purpose}</span></div>
                  <div style={{ marginBottom: 8 }}><BenefitTag benefit={ing.healthBenefit} /></div>
                  <div style={{ marginBottom: 12 }}><SourceBadge source={ing.scientificSource} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14, fontSize: 11 }}>
                    {[["🧪 Ingredient Risk", ing.riskIngredient], ["📋 Regulatory", ing.riskRegulatory], ["🚚 Supply Chain", ing.riskSupplyChain], ["⚠️ Intolerance", ing.riskIntolerance]].map(([label, val]) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "6px 8px" }}>
                        <div style={{ color: "#64748b", marginBottom: 2 }}>{label}</div>
                        <div style={{ color: "#cbd5e1", fontWeight: 600, fontSize: 10 }}>{val || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#f0f6ff" }}>${ing.avgCost.toFixed(2)}<span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>/unit</span></span>
                    <button onClick={e => { e.stopPropagation(); toggleShortlist(ing); }} style={{ padding: "6px 13px", borderRadius: 7, border: `1px solid ${isShortlisted(ing.id) ? "rgba(239,68,68,0.4)" : "rgba(110,231,183,0.3)"}`, background: isShortlisted(ing.id) ? "rgba(239,68,68,0.1)" : "rgba(110,231,183,0.1)", color: isShortlisted(ing.id) ? "#f87171" : "#6ee7b7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{isShortlisted(ing.id) ? "Remove" : "+ Add"}</button>
                  </div>
                </div>
              ))}
              {sorted.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#64748b" }}>No ingredients match the current filters.</div>}
            </div>
          </>
        )}

        {tab === "formulation" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <input value={formulationName} onChange={e => setFormulationName(e.target.value)} style={{ background: "none", border: "none", outline: "none", fontSize: 22, fontWeight: 800, color: "#f0f6ff", fontFamily: "inherit", width: 340 }} />
                <div style={{ fontSize: 13, color: "#64748b" }}>Formulation Builder · {shortlist.length} ingredient{shortlist.length !== 1 ? "s" : ""}</div>
              </div>
              {shortlist.length > 0 && <button onClick={generateSummary} disabled={summaryLoading} style={{ padding: "10px 20px", background: summaryLoading ? "rgba(110,231,183,0.2)" : "linear-gradient(135deg, #6ee7b7, #3b82f6)", border: "none", borderRadius: 9, color: summaryLoading ? "#6ee7b7" : "#080c14", fontWeight: 700, fontSize: 13, cursor: summaryLoading ? "not-allowed" : "pointer" }}>{summaryLoading ? "Generating…" : "✦ AI Briefing"}</button>}
            </div>

            {shortlist.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", border: "1px dashed rgba(110,231,183,0.15)", borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>⚗</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>No ingredients added yet</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Go to Explore and add ingredients to your formulation</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                  {[{ icon: "🧬", label: "Ingredients", value: shortlist.length, color: "#6ee7b7" }, { icon: "💲", label: "Total Est. Cost", value: `$${totalCost.toFixed(2)}/unit`, color: "#a78bfa" }, { icon: "📊", label: "Avg Cost", value: `$${(totalCost / shortlist.length).toFixed(2)}/unit`, color: "#60a5fa" }].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {aiSummary && (
                  <div style={{ background: "linear-gradient(135deg, rgba(110,231,183,0.07), rgba(59,130,246,0.05))", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", letterSpacing: "0.08em", marginBottom: 10 }}>✦ AI FORMULATION BRIEFING</div>
                    <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.75 }}>{aiSummary}</div>
                  </div>
                )}

                <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr 0.8fr 80px", background: "rgba(255,255,255,0.04)", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>
                    {["INGREDIENT", "FORM", "PURPOSE", "BENEFIT", "INGREDIENT RISK", "REGULATORY", "SUPPLY CHAIN", "COST", ""].map((h, i) => <div key={i}>{h}</div>)}
                  </div>
                  {shortlist.map((ing, idx) => (
                    <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr 0.8fr 80px", padding: "14px 16px", fontSize: 12, alignItems: "center", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{ing.name}</div>
                      <div style={{ color: "#94a3b8" }}>{ing.form}</div>
                      <div style={{ color: "#94a3b8" }}>{ing.purpose}</div>
                      <div><BenefitTag benefit={ing.healthBenefit} /></div>
                      <div style={{ color: "#fca5a5", fontSize: 11 }}>{ing.riskIngredient}</div>
                      <div style={{ color: "#94a3b8", fontSize: 11 }}>{ing.riskRegulatory}</div>
                      <div style={{ color: getRiskLevel(ing.riskSupplyChain) === "High" ? "#fca5a5" : "#fcd34d", fontSize: 11 }}>{ing.riskSupplyChain}</div>
                      <div style={{ fontWeight: 700 }}>${ing.avgCost.toFixed(2)}</div>
                      <button onClick={() => toggleShortlist(ing)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, cursor: "pointer" }}>Remove</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: "#0d1929", border: "1px solid rgba(110,231,183,0.18)", borderRadius: 18, padding: "30px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#f0f6ff", marginBottom: 3 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{selected.form} · {selected.purpose}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}><BenefitTag benefit={selected.healthBenefit} /></div>
            <div style={{ marginBottom: 16 }}><SourceBadge source={selected.scientificSource} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[["🧪 Ingredient Risk", selected.riskIngredient], ["📋 Regulatory Market", selected.riskRegulatory], ["🚚 Supply Chain", selected.riskSupplyChain], ["⚠️ Intolerance/Allergy", selected.riskIntolerance], ["💲 Avg Cost", `$${selected.avgCost.toFixed(2)}/unit`], ["📁 Form", selected.form]].map(([label, val]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { toggleShortlist(selected); setSelected(null); }} style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: isShortlisted(selected.id) ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #6ee7b7, #3b82f6)", color: isShortlisted(selected.id) ? "#f87171" : "#080c14" }}>
              {isShortlisted(selected.id) ? "Remove from Formulation" : "Add to Formulation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
