import { useState, useRef } from "react";

const ANTHROPIC_API = "/api/claude";
const IMAGE_PROXY = "/api/imagine";

// ── MASTERBRAND CATALOG ─────────────────────────────────────────────────────
// Injected into Claude's prompt whenever a cabinet element is selected.
// In production, this would be fed from MasterBrand's actual product API.
const MB_CATALOG = {
  budget: [
    { brand: "Aristokraft", line: "Brellin", finish: "White", style: "Shaker / Partial Overlay", material: "PureStyle Laminate", price: "$150–$220/lf", url: "https://www.aristokraft.com/products/brellin", swatch: "#F5F0EA" },
    { brand: "Aristokraft", line: "Brellin", finish: "Stone Gray", style: "Shaker / Partial Overlay", material: "PureStyle Laminate", price: "$155–$225/lf", url: "https://www.aristokraft.com/products/brellin", swatch: "#C8C0B8" },
    { brand: "Aristokraft", line: "Sinclair", finish: "White", style: "Shaker / Partial Overlay", material: "Painted Birch", price: "$160–$240/lf", url: "https://www.aristokraft.com/products/sinclair", swatch: "#FDFCFA" },
    { brand: "Aristokraft", line: "Ellis", finish: "Admiral Navy", style: "Shaker / Partial Overlay", material: "PureStyle Laminate", price: "$160–$240/lf", url: "https://www.aristokraft.com/products/ellis", swatch: "#1C1A2E" },
    { brand: "Aristokraft", line: "Ellis", finish: "Greyhound", style: "Shaker / Partial Overlay", material: "PureStyle Laminate", price: "$155–$235/lf", url: "https://www.aristokraft.com/products/ellis", swatch: "#8C8880" },
  ],
  midrange: [
    { brand: "Diamond", line: "Brellin", finish: "Matte Black", style: "Shaker / Full Overlay", material: "PureStyle Laminate", price: "$280–$380/lf", url: "https://www.diamondcabinets.com", swatch: "#161310" },
    { brand: "Diamond", line: "Wintucket", finish: "White", style: "Shaker / Full Overlay", material: "Painted Maple", price: "$300–$400/lf", url: "https://www.diamondcabinets.com", swatch: "#FDFCFA" },
    { brand: "Kemper", line: "Benton", finish: "Charcoal", style: "Full Overlay Shaker", material: "Maple Stain", price: "$310–$420/lf", url: "https://www.kempercabinets.com", swatch: "#2C2520" },
    { brand: "Kemper", line: "Benton", finish: "Linen", style: "Full Overlay Shaker", material: "Painted Maple", price: "$295–$400/lf", url: "https://www.kempercabinets.com", swatch: "#E8DDD0" },
    { brand: "Schrock", line: "Prescott", finish: "Coastline", style: "Recessed Panel", material: "Painted Maple", price: "$295–$400/lf", url: "https://www.schrock.com", swatch: "#1C2030" },
    { brand: "Schrock", line: "Prescott", finish: "White", style: "Recessed Panel", material: "Painted Maple", price: "$290–$390/lf", url: "https://www.schrock.com", swatch: "#FDFCFA" },
    { brand: "Homecrest", line: "Classic Shaker", finish: "Churro", style: "Shaker", material: "Painted Maple", price: "$220–$320/lf", url: "https://www.homecrestcabinetry.com", swatch: "#D4A87A" },
    { brand: "Kitchen Craft", line: "Fairbury", finish: "Flagstone", style: "Recessed Panel", material: "Painted Maple", price: "$300–$440/lf", url: "https://www.kitchencraftcabinetry.com", swatch: "#8C8478" },
  ],
  luxury: [
    { brand: "Omega", line: "Dynasty", finish: "Midnight Black", style: "Slab / Frameless", material: "Custom Painted Maple", price: "$500–$750/lf", url: "https://www.omegacabinetry.com", swatch: "#0D0A07" },
    { brand: "Omega", line: "Craftsman", finish: "Greige", style: "Shaker / Inset", material: "Custom Painted Cherry", price: "$550–$800/lf", url: "https://www.omegacabinetry.com", swatch: "#C4B8A8" },
    { brand: "Decora", line: "Fresco", finish: "Frillseeker", style: "Shaker / Inset", material: "Custom Painted Maple", price: "$480–$720/lf", url: "https://www.decoracabinets.com", swatch: "#8C6070" },
    { brand: "StarMark", line: "Arcadia", finish: "Rustic Alder Natural", style: "Full Overlay", material: "Solid Alder", price: "$520–$800/lf", url: "https://www.starmarkcabinetry.com", swatch: "#C4A882" },
    { brand: "Dynasty by Omega", line: "Linden", finish: "White", style: "Shaker / Full Overlay", material: "Maple", price: "$460–$700/lf", url: "https://www.dynastyomega.com", swatch: "#FDFCFA" },
  ]
};

const MB_CATALOG_TEXT = (budget) => {
  const tier = budget === "budget" ? "budget" : budget === "midrange" ? "midrange" : "luxury";
  const products = MB_CATALOG[tier];
  return `MASTERBRAND CABINET CATALOG — ${tier.toUpperCase()} TIER (recommend ONLY from this list for any cabinet-related element):
${products.map((p, i) => `${i+1}. ${p.brand} — ${p.line} in ${p.finish} | Style: ${p.style} | Material: ${p.material} | Price: ${p.price} | URL: ${p.url}`).join("\n")}`;
};

const MB_ELEMENTS = ["cabinets", "island", "vanity", "storage", "builtin", "bar"];
const isMBElement = (els) => els.some(e => MB_ELEMENTS.includes(e.id));

// ── ROOM ELEMENTS ───────────────────────────────────────────────────────────
const ROOM_ELEMENTS = {
  "Kitchen": [
    { id: "cabinets", label: "Cabinets", emoji: "🗄️" },
    { id: "countertops", label: "Countertops", emoji: "🔲" },
    { id: "backsplash", label: "Backsplash", emoji: "🧱" },
    { id: "flooring", label: "Flooring", emoji: "▦" },
    { id: "island", label: "Kitchen Island", emoji: "🍳" },
    { id: "appliances", label: "Appliances", emoji: "🔌" },
    { id: "lighting", label: "Lighting", emoji: "💡" },
    { id: "hardware", label: "Hardware & Fixtures", emoji: "🔩" },
    { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
    { id: "sink", label: "Sink & Faucet", emoji: "🚰" },
  ],
  "Bathroom": [
    { id: "vanity", label: "Vanity & Sink", emoji: "🪞" },
    { id: "shower", label: "Shower & Surround", emoji: "🚿" },
    { id: "tile", label: "Tile & Flooring", emoji: "🔲" },
    { id: "storage", label: "Storage & Shelving", emoji: "🗄️" },
    { id: "bathtub", label: "Bathtub", emoji: "🛁" },
    { id: "lighting", label: "Lighting", emoji: "💡" },
    { id: "hardware", label: "Hardware & Fixtures", emoji: "🔩" },
    { id: "mirror", label: "Mirror", emoji: "🪟" },
    { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
  ],
  "Home Office": [
    { id: "builtin", label: "Built-in Shelving", emoji: "📚" },
    { id: "flooring", label: "Flooring", emoji: "▦" },
    { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
    { id: "furniture", label: "Desk & Chair", emoji: "🖥️" },
    { id: "lighting", label: "Lighting", emoji: "💡" },
    { id: "storage", label: "Storage & Cabinets", emoji: "🗄️" },
    { id: "windows", label: "Windows & Treatments", emoji: "🪟" },
  ],
  "Basement": [
    { id: "bar", label: "Bar / Wet Bar", emoji: "🍷" },
    { id: "builtin", label: "Built-in Storage", emoji: "🗄️" },
    { id: "flooring", label: "Flooring", emoji: "▦" },
    { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
    { id: "ceiling", label: "Ceiling", emoji: "⬆️" },
    { id: "lighting", label: "Lighting", emoji: "💡" },
    { id: "media", label: "Media Wall", emoji: "📺" },
  ],
  "Living Room": [
    { id: "flooring", label: "Flooring", emoji: "▦" },
    { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
    { id: "furniture", label: "Furniture", emoji: "🛋️" },
    { id: "lighting", label: "Lighting", emoji: "💡" },
    { id: "textiles", label: "Textiles & Rugs", emoji: "🧶" },
    { id: "windows", label: "Windows & Treatments", emoji: "🪟" },
    { id: "fireplace", label: "Fireplace", emoji: "🔥" },
  ],
};

const BUDGET_TIERS = [
  { id: "budget", label: "Budget Smart", emoji: "💰", desc: "Maximize impact per dollar", mbBrand: "Aristokraft" },
  { id: "midrange", label: "Nice & Solid", emoji: "✨", desc: "Quality materials, elevated finishes", mbBrand: "Diamond · Kemper · Schrock" },
  { id: "luxury", label: "Price Is No Object", emoji: "💎", desc: "Best of the best, no compromises", mbBrand: "Omega · Decora · StarMark" },
];

// ── HELPERS ─────────────────────────────────────────────────────────────────
const pollForImage = async (predictionId, setGenImage) => {
  let attempts = 0;
  while (attempts < 40) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(IMAGE_PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pollId: predictionId }) });
      const data = await res.json();
      if (data.status === "succeeded" && data.imageUrl) { setGenImage(data.imageUrl); return; }
      if (data.status === "failed" || data.error) { setGenImage("ERROR:" + (data.error || "Generation failed")); return; }
    } catch (e) { setGenImage("ERROR:" + e.message); return; }
    attempts++;
  }
  setGenImage("ERROR:Timed out — try again");
};

const safeParseJSON = (text) => {
  let clean = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{"); const end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
  return JSON.parse(clean);
};

const getMediaType = (dataUrl) => {
  if (dataUrl?.includes("image/png")) return "image/png";
  if (dataUrl?.includes("image/webp")) return "image/webp";
  return "image/jpeg";
};

// ── STYLES ──────────────────────────────────────────────────────────────────
const MB_RED = "#C41230";
const GOLD = "#B8965A";
const INK = "#1A1814";
const CREAM = "#F7F4EE";
const WARM_WHITE = "#FDFCFA";
const MID = "#6B6560";
const BORDER = "#E4DFD6";

const S = {
  card: { background: WARM_WHITE, borderRadius: 20, padding: "36px 42px", maxWidth: 720, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" },
  cardWide: { background: WARM_WHITE, borderRadius: 20, padding: "36px 42px", maxWidth: 860, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" },
  btnDark: (on) => ({ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: on ? INK : "#E0E0E0", color: on ? "#fff" : "#aaa", fontSize: 15, fontFamily: "sans-serif", fontWeight: 600, cursor: on ? "pointer" : "default" }),
  btnMB: (on) => ({ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: on ? MB_RED : "#E0E0E0", color: on ? "#fff" : "#aaa", fontSize: 15, fontFamily: "sans-serif", fontWeight: 600, cursor: on ? "pointer" : "default" }),
  btnBack: { width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, border: "1.5px solid #E0E0E0", background: "transparent", color: MID, fontSize: 13, fontFamily: "sans-serif", cursor: "pointer" },
  label: { fontSize: 11, fontFamily: "sans-serif", color: "#aaa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" },
  mbLabel: { fontSize: 11, fontFamily: "sans-serif", color: MB_RED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 },
};

// ── SPINNER ─────────────────────────────────────────────────────────────────
const Spinner = ({ msg, sub }) => (
  <div style={{ ...S.card, textAlign: "center", padding: "80px 44px" }}>
    <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
    <div style={{ fontSize: 44, marginBottom: 18, display: "inline-block", animation: "spin 3s linear infinite" }}>✦</div>
    <div style={{ fontSize: 13, fontFamily: "sans-serif", color: MB_RED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>MasterBrand × NookAI</div>
    <h2 style={{ fontSize: 21, fontWeight: 700, color: INK, marginBottom: 10, marginTop: 0, fontFamily: "sans-serif" }}>{msg}</h2>
    <p style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: 14, margin: 0 }}>{sub}</p>
  </div>
);

// ── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  const idx = steps.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {steps.map((label, i) => {
        const done = i < idx; const active = i === idx;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? MB_RED : active ? INK : "transparent", border: `2px solid ${done || active ? MB_RED : "#D4D4D4"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done ? <span style={{ color: "#fff", fontSize: 13 }}>✓</span> : <span style={{ color: active ? MB_RED : "#bbb", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 9, color: active ? INK : "#bbb", fontWeight: active ? 700 : 400, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 32, height: 1, background: done ? MB_RED : "#E0E0E0", margin: "0 6px", marginBottom: 20 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── MB PRODUCT CARD ─────────────────────────────────────────────────────────
function MBProductCard({ product, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `2px solid ${selected ? MB_RED : BORDER}`, background: selected ? "#FDF5F6" : WARM_WHITE, display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s", boxShadow: selected ? "0 4px 16px rgba(196,18,48,0.12)" : "none" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: product.swatch, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: "sans-serif" }}>{product.brand} — {product.line}</div>
        <div style={{ fontSize: 11, color: MID, fontFamily: "sans-serif", marginTop: 2 }}>{product.finish} · {product.style}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: "sans-serif" }}>{product.price}</div>
        {selected && <div style={{ fontSize: 10, color: MB_RED, fontWeight: 700, fontFamily: "sans-serif", marginTop: 2 }}>✓ Selected</div>}
      </div>
    </div>
  );
}

// ── MAIN FLOW ────────────────────────────────────────────────────────────────
function MBDemoFlow({ photo, photoBase64, roomType, onReset }) {
  const [step, setStep] = useState("Elements");
  const [selectedEls, setSelectedEls] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [changeDesc, setChangeDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [mbRecs, setMbRecs] = useState([]);
  const [selectedMBProduct, setSelectedMBProduct] = useState(null);
  const [genImage, setGenImage] = useState(null);
  const [error, setError] = useState(null);

  const elements = ROOM_ELEMENTS[roomType] || ROOM_ELEMENTS["Kitchen"];
  const hasMBElements = isMBElement(selectedEls);

  const toggleEl = (el) => setSelectedEls(prev => prev.find(e => e.id === el.id) ? prev.filter(e => e.id !== el.id) : [...prev, el]);

  const generate = async () => {
    if (!selectedEls.length || !selectedBudget) return;
    setIsGenerating(true); setError(null);

    const elNames = selectedEls.map(e => e.label).join(", ");
    const hasMB = isMBElement(selectedEls);
    const budgetGuide = selectedBudget.id === "budget" ? "Budget-conscious options only." : selectedBudget.id === "midrange" ? "Mid-range quality, elevated finishes." : "Luxury options only, best materials available.";
    const mbContext = hasMB ? "\n\n" + MB_CATALOG_TEXT(selectedBudget.id) : "";

    try {
      const basePrompt = `You are NookAI, an expert interior designer powered by MasterBrand Cabinets. User wants to update: ${elNames} in their ${roomType}. Request: "${changeDesc || "Make it look great"}". ${budgetGuide}${mbContext}

Return ONLY valid JSON:
{
  "headline": "short punchy title",
  "summary": "2-3 sentences",
  "mbProducts": ${hasMB ? `[{"brand":"brand name","line":"line name","finish":"finish name","style":"door style","price":"$XXX-$XXX/lf","why":"one sentence why this works","url":"dealer url from catalog"}]` : "[]"},
  "otherRecs": [{"element":"element name","recommendation":"specific material/color/product","cost":"$XXX-$XXX","why":"brief reason"}],
  "installTip": "one practical tip",
  "fluxPrompt": "Photorealistic interior photo of a ${roomType}, updated ${elNames}: ${changeDesc || "beautifully redesigned"}. Professional photography, natural light, no people."
}`;

      const messages = photoBase64
        ? [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: getMediaType(photo), data: photoBase64 } }, { type: "text", text: "Look at this " + roomType + ". " + basePrompt }] }]
        : [{ role: "user", content: basePrompt }];

      const res = await fetch(ANTHROPIC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const parsed = safeParseJSON(data.content[0].text);
      setResult(parsed);

      // Match MB recs back to catalog for swatches
      if (parsed.mbProducts?.length > 0) {
        const tier = selectedBudget.id === "budget" ? "budget" : selectedBudget.id === "midrange" ? "midrange" : "luxury";
        const enriched = parsed.mbProducts.map(rec => {
          const match = MB_CATALOG[tier].find(p =>
            p.brand.toLowerCase().includes(rec.brand?.toLowerCase()) ||
            p.finish.toLowerCase().includes(rec.finish?.toLowerCase())
          );
          return { ...rec, swatch: match?.swatch || "#C4B09A", url: match?.url || rec.url || "https://www.masterbrandcabinets.com" };
        });
        setMbRecs(enriched);
        if (enriched.length > 0) setSelectedMBProduct(enriched[0]);
      }

      // Kick off image render
      if (photoBase64) {
        try {
          const imgPrompt = `Same ${roomType} photo but update the ${elNames}: ${changeDesc || "beautifully redesigned"}. ${parsed.mbProducts?.[0] ? `Cabinet finish: ${parsed.mbProducts[0].finish} by ${parsed.mbProducts[0].brand}.` : ""} CRITICAL: Only change the selected elements. Keep everything else identical. Photorealistic, natural light, no people.`;
          const startRes = await fetch(IMAGE_PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: photoBase64, prompt: imgPrompt, roomType, element: elNames }) });
          const startData = await startRes.json();
          if (startData.predictionId) pollForImage(startData.predictionId, setGenImage);
        } catch (imgErr) { console.warn("Image proxy:", imgErr.message); }
      }

      setStep("Result");
    } catch (err) {
      setError("Something went wrong: " + err.message);
    }
    setIsGenerating(false);
  };

  if (isGenerating) return <Spinner msg="Generating your design..." sub="Pulling MasterBrand recommendations and rendering your vision..." />;

  return (
    <div>
      <StepIndicator steps={["Elements", "Describe", "Result"]} current={step} />

      {/* STEP 1 — ELEMENTS */}
      {step === "Elements" && (
        <div style={S.cardWide}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, background: MB_RED, borderRadius: "50%" }} />
            <span style={{ fontSize: 11, color: MB_RED, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>MasterBrand × NookAI</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, marginBottom: 6, marginTop: 0, fontFamily: "sans-serif" }}>What do you want to change?</h2>
          <p style={{ color: MID, fontSize: 14, fontFamily: "sans-serif", marginBottom: 18, marginTop: 0 }}>
            Showing elements for your <strong style={{ color: INK }}>{roomType}</strong>. Cabinet elements will pull from the MasterBrand catalog.
          </p>

          {selectedEls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {selectedEls.map(el => (
                <div key={el.id} onClick={() => toggleEl(el)} style={{ display: "flex", alignItems: "center", gap: 5, background: MB_ELEMENTS.includes(el.id) ? MB_RED : INK, borderRadius: 20, padding: "4px 12px", cursor: "pointer" }}>
                  <span style={{ fontSize: 12 }}>{el.emoji}</span>
                  <span style={{ fontSize: 12, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>{el.label}</span>
                  {MB_ELEMENTS.includes(el.id) && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif", marginLeft: 2 }}>MB</span>}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 2 }}>✕</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 22 }}>
            {elements.map(el => {
              const isSel = !!selectedEls.find(e => e.id === el.id);
              const isMB = MB_ELEMENTS.includes(el.id);
              return (
                <div key={el.id} onClick={() => toggleEl(el)} style={{ padding: "14px 10px", borderRadius: 12, cursor: "pointer", border: `2px solid ${isSel ? (isMB ? MB_RED : GOLD) : BORDER}`, background: isSel ? (isMB ? "#FDF5F6" : "#FDF8F0") : WARM_WHITE, textAlign: "center", transition: "all 0.2s", position: "relative" }}>
                  {isMB && <div style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, background: MB_RED, borderRadius: "50%" }} />}
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{el.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: isSel ? 700 : 600, color: isSel ? (isMB ? MB_RED : GOLD) : INK, fontFamily: "sans-serif" }}>{el.label}</div>
                  {isMB && <div style={{ fontSize: 9, color: MB_RED, fontFamily: "sans-serif", marginTop: 2, opacity: 0.8 }}>MasterBrand</div>}
                </div>
              );
            })}
          </div>

          {hasMBElements && (
            <div style={{ background: "#FDF5F6", border: `1px solid rgba(196,18,48,0.2)`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: MB_RED, borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: MB_RED, fontFamily: "sans-serif" }}>Cabinet selections will pull from the MasterBrand product catalog</span>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: INK, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Budget</div>
            <div style={{ display: "flex", gap: 10 }}>
              {BUDGET_TIERS.map(tier => {
                const isSel = selectedBudget?.id === tier.id;
                return (
                  <div key={tier.id} onClick={() => setSelectedBudget(tier)} style={{ flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer", border: `2px solid ${isSel ? MB_RED : BORDER}`, background: isSel ? "#FDF5F6" : WARM_WHITE, textAlign: "center", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{tier.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? MB_RED : INK, fontFamily: "sans-serif" }}>{tier.label}</div>
                    {isSel && hasMBElements && <div style={{ fontSize: 9, color: MB_RED, fontFamily: "sans-serif", marginTop: 3 }}>{tier.mbBrand}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => setStep("Describe")} disabled={!selectedEls.length || !selectedBudget} style={S.btnDark(!!(selectedEls.length && selectedBudget))}>
            {selectedEls.length && selectedBudget ? `Continue with ${selectedEls.length} element${selectedEls.length > 1 ? "s" : ""} →` : "Select elements and budget to continue"}
          </button>
          <button onClick={onReset} style={S.btnBack}>← Back</button>
        </div>
      )}

      {/* STEP 2 — DESCRIBE */}
      {step === "Describe" && (
        <div style={S.card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
            {selectedEls.map(el => (
              <div key={el.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: MB_ELEMENTS.includes(el.id) ? MB_RED : "#F0EDE8", borderRadius: 20, padding: "5px 13px" }}>
                <span style={{ fontSize: 14 }}>{el.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: MB_ELEMENTS.includes(el.id) ? "#fff" : GOLD }}>{el.label}</span>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, marginBottom: 8, marginTop: 0, fontFamily: "sans-serif" }}>What are you going for?</h2>
          <p style={{ color: MID, fontSize: 14, fontFamily: "sans-serif", marginBottom: 18, marginTop: 0 }}>Describe it like you'd tell a friend. The more specific, the better.</p>
          <div style={{ background: "#F0EDE8", borderRadius: 12, padding: "11px 15px", marginBottom: 18, fontFamily: "sans-serif", fontSize: 13, color: MID }}>
            💬 <em>Try: "Dark and dramatic, like a high-end restaurant kitchen" or "Bright white, super clean, minimal hardware"</em>
          </div>
          <textarea
            value={changeDesc}
            onChange={e => setChangeDesc(e.target.value)}
            placeholder="Describe the look you're going for..."
            rows={4}
            style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1.5px solid #E0E0E0", fontFamily: "Georgia, serif", fontSize: 15, color: INK, resize: "none", background: "#fff", boxSizing: "border-box", lineHeight: 1.6, outline: "none" }}
          />
          {hasMBElements && (
            <div style={{ marginTop: 14, background: "#FDF5F6", border: `1px solid rgba(196,18,48,0.2)`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: MB_RED, borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: MB_RED, fontFamily: "sans-serif" }}>Cabinet recommendations will come from MasterBrand's <strong>{selectedBudget?.mbBrand}</strong> line</span>
            </div>
          )}
          {error && <p style={{ color: "#E05555", fontFamily: "sans-serif", fontSize: 13, marginTop: 8 }}>{error}</p>}
          <button onClick={generate} style={{ ...S.btnMB(true), marginTop: 14 }}>✦ Generate My Design</button>
          <button onClick={() => setStep("Elements")} style={S.btnBack}>← Back</button>
        </div>
      )}

      {/* STEP 3 — RESULT */}
      {step === "Result" && result && (
        <div style={S.cardWide}>
          {/* Before/After */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>
              <div style={S.label}>Before</div>
              {photo
                ? <img src={photo} alt="before" style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 10 }} />
                : <div style={{ width: "100%", height: 210, borderRadius: 10, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 12, fontFamily: "sans-serif" }}>No photo uploaded</span></div>
              }
            </div>
            <div>
              <div style={S.mbLabel}>✦ With MasterBrand</div>
              {genImage && !genImage.startsWith("ERROR:")
                ? <img src={genImage} alt="after" style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 10 }} />
                : <div style={{ width: "100%", height: 210, borderRadius: 10, background: "linear-gradient(135deg,#FDF5F6,#F5E8EA)", display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed rgba(196,18,48,0.2)`, padding: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🏠</div>
                    <div style={{ fontSize: 11, fontFamily: "sans-serif", color: genImage?.startsWith("ERROR:") ? "#E05555" : MB_RED, lineHeight: 1.5 }}>
                      {genImage?.startsWith("ERROR:") ? genImage.replace("ERROR:", "") : "✦ Rendering your vision..."}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: 26, fontWeight: 700, color: INK, margin: "0 0 10px", fontFamily: "sans-serif" }}>{result.headline}</h2>
          <p style={{ color: MID, fontSize: 14, lineHeight: 1.7, fontFamily: "sans-serif", margin: "0 0 24px" }}>{result.summary}</p>

          {/* MasterBrand Recs */}
          {mbRecs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, background: MB_RED, borderRadius: "50%" }} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: MB_RED, textTransform: "uppercase", letterSpacing: "0.08em" }}>MasterBrand Cabinet Recommendations</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {mbRecs.map((rec, i) => (
                  <MBProductCard key={i} product={rec} selected={selectedMBProduct === rec} onSelect={() => setSelectedMBProduct(rec)} />
                ))}
              </div>
              {selectedMBProduct && (
                <a href={selectedMBProduct.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px", borderRadius: 10, background: MB_RED, color: "#fff", fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                  Find a {selectedMBProduct.brand} Dealer Near You →
                </a>
              )}
            </div>
          )}

          {/* Other Recs */}
          {result.otherRecs?.length > 0 && (
            <div style={{ background: "#F7F5F2", borderRadius: 13, padding: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: INK, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Additional Recommendations</div>
              {result.otherRecs.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, padding: "8px 0", borderBottom: i < result.otherRecs.length - 1 ? "1px solid #E8E8E8" : "none", alignItems: "start" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: GOLD, textTransform: "uppercase" }}>{r.element}</div>
                  <div style={{ fontSize: 13, fontFamily: "sans-serif", color: INK }}>{r.recommendation}<div style={{ fontSize: 11, color: MID, marginTop: 2 }}>{r.why}</div></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, fontFamily: "sans-serif", whiteSpace: "nowrap" }}>{r.cost}</div>
                </div>
              ))}
            </div>
          )}

          {/* Install tip */}
          {result.installTip && (
            <div style={{ background: "#F0EDE8", borderRadius: 12, padding: "12px 16px", marginBottom: 22, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🔧</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: GOLD, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Install Tip</div>
                <div style={{ fontSize: 13, fontFamily: "sans-serif", color: MID, lineHeight: 1.5 }}>{result.installTip}</div>
              </div>
            </div>
          )}

          <button onClick={onReset} style={S.btnBack}>↺ Start over</button>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MasterBrandDemo() {
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [roomType, setRoomType] = useState("Kitchen");
  const [started, setStarted] = useState(false);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      setPhoto(compressed);
      setPhotoBase64(compressed.split(",")[1]);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const reset = () => { setStarted(false); setPhoto(null); setPhotoBase64(null); setRoomType("Kitchen"); };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F3EF", fontFamily: "'Georgia','Times New Roman',serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px" }}>

      {/* CO-BRAND HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36, background: INK, borderRadius: 14, padding: "12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 18, borderRight: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ width: 26, height: 26, background: GOLD, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🏠</div>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#fff", fontFamily: "'Cormorant Garamond',serif" }}>NookAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 18 }}>
          <div style={{ width: 7, height: 7, background: MB_RED, borderRadius: "50%" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif" }}>Powered for</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>MasterBrand Cabinets</span>
        </div>
      </div>

      {!started && (
        <div style={{ ...S.card, textAlign: "center", maxWidth: 620 }}>
          <div style={{ fontSize: 11, fontFamily: "sans-serif", color: MB_RED, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Live Product Demo</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: INK, marginBottom: 14, marginTop: 0, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.2 }}>
            Visualize your space with<br /><em style={{ fontStyle: "italic", color: MB_RED }}>MasterBrand cabinets.</em>
          </h1>
          <p style={{ color: MID, fontSize: 15, fontFamily: "sans-serif", marginBottom: 28, lineHeight: 1.65, fontWeight: 300 }}>
            Upload a photo of any room. Pick your style and budget. NookAI will recommend actual MasterBrand products and render them in your space — in under 90 seconds.
          </p>

          {/* Photo upload */}
          <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${BORDER}`, borderRadius: 14, padding: "28px 20px", cursor: "pointer", marginBottom: 18, background: photo ? "#fff" : "transparent" }} onMouseEnter={e => e.currentTarget.style.borderColor = MB_RED} onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
            {photo
              ? <img src={photo} alt="room" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 9, objectFit: "cover" }} />
              : <><div style={{ fontSize: 32, marginBottom: 8 }}>📷</div><p style={{ color: MID, fontFamily: "sans-serif", fontSize: 14, margin: 0 }}>Click to upload a photo of your room</p><p style={{ color: "#bbb", fontFamily: "sans-serif", fontSize: 12, margin: "3px 0 0" }}>Optional but recommended — JPG or PNG</p></>
            }
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>

          {/* Room selector */}
          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 11, fontFamily: "sans-serif", color: MID, marginBottom: 7, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Room Type</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: 10, border: `1.5px solid ${BORDER}`, background: "#fff", fontFamily: "sans-serif", fontSize: 15, color: INK, appearance: "none", cursor: "pointer" }}>
              {Object.keys(ROOM_ELEMENTS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button onClick={() => setStarted(true)} style={{ ...S.btnMB(true), fontSize: 15, padding: "15px" }}>
            Start the Demo →
          </button>

          {photo && <button onClick={() => { setPhoto(null); setPhotoBase64(null); }} style={{ ...S.btnBack, marginTop: 10 }}>Remove photo</button>}

          <div style={{ marginTop: 20, padding: "12px 16px", background: "#FDF5F6", borderRadius: 10, border: `1px solid rgba(196,18,48,0.15)`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, background: MB_RED, borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: MB_RED, fontFamily: "sans-serif" }}>Cabinet recommendations in this demo pull from the real MasterBrand product catalog</span>
          </div>
        </div>
      )}

      {started && (
        <MBDemoFlow
          photo={photo}
          photoBase64={photoBase64}
          roomType={roomType}
          onReset={reset}
        />
      )}

      <p style={{ marginTop: 28, fontSize: 10, color: "#ccc", fontFamily: "sans-serif", letterSpacing: "0.06em" }}>NOOKAI × MASTERBRAND CABINETS · CONFIDENTIAL DEMO</p>
    </div>
  );
}
