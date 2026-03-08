import { useState, useRef } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const IMAGE_PROXY = "/api/imagine";

const STYLE_CARDS = [
  { id: "modern", label: "Modern Minimal", emoji: "⬜", desc: "Clean lines, neutral tones, zero clutter" },
  { id: "farmhouse", label: "Farmhouse Warm", emoji: "🌾", desc: "Shiplap, warm woods, cozy textures" },
  { id: "scandinavian", label: "Scandinavian", emoji: "🕯️", desc: "Light woods, hygge vibes, functional beauty" },
  { id: "industrial", label: "Industrial", emoji: "⚙️", desc: "Exposed brick, metal, raw urban energy" },
  { id: "bohemian", label: "Bohemian", emoji: "🌿", desc: "Layered textiles, plants, eclectic warmth" },
  { id: "transitional", label: "Transitional", emoji: "🏡", desc: "Classic meets contemporary, timeless balance" },
  { id: "mountain", label: "Mountain Cabin", emoji: "🪵", desc: "Rustic wood, stone, cozy lodge feel" },
  { id: "coastal", label: "Coastal", emoji: "🌊", desc: "Breezy whites, natural textures, easy living" },
  { id: "artdeco", label: "Art Deco", emoji: "✦", desc: "Bold geometry, gold accents, glamour" },
  { id: "japandi", label: "Japandi", emoji: "🎋", desc: "Japanese-Scandi fusion, serene simplicity" },
];

const SPECIFIC_ELEMENTS = [
  { id: "countertops", label: "Countertops", emoji: "🔲" },
  { id: "cabinets", label: "Cabinets", emoji: "🗄️" },
  { id: "flooring", label: "Flooring", emoji: "▦" },
  { id: "wallcolor", label: "Wall Color", emoji: "🎨" },
  { id: "lighting", label: "Lighting", emoji: "💡" },
  { id: "hardware", label: "Hardware & Fixtures", emoji: "🔩" },
  { id: "backsplash", label: "Backsplash", emoji: "🧱" },
  { id: "furniture", label: "Furniture", emoji: "🛋️" },
  { id: "textiles", label: "Textiles & Rugs", emoji: "🧶" },
  { id: "decor", label: "Decor & Accessories", emoji: "🪴" },
];

const pollForImage = async (predictionId, setGenImage) => {
  let attempts = 0;
  const maxAttempts = 40;
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(IMAGE_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: predictionId })
      });
      const data = await res.json();
      console.log("Poll attempt", attempts + 1, "status:", data.status, "full:", JSON.stringify(data));
      if (data.status === "succeeded" && data.imageUrl) {
        setGenImage(data.imageUrl);
        return;
      } else if (data.status === "failed") {
        setGenImage("ERROR:" + (data.error || "unknown"));
        return;
      } else if (data.error) {
        setGenImage("ERROR:" + data.error);
        return;
      }
    } catch (e) {
      console.warn("Poll error:", e.message);
      setGenImage("ERROR:" + e.message);
      return;
    }
    attempts++;
  }
  setGenImage("ERROR:Timed out after 2 minutes");
};

const safeParseJSON = (text) => {
  let clean = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
  return JSON.parse(clean);
};

const getMediaType = (dataUrl) => {
  if (dataUrl && dataUrl.includes("image/png")) return "image/png";
  if (dataUrl && dataUrl.includes("image/webp")) return "image/webp";
  return "image/jpeg";
};

function StepIndicator({ steps, current }) {
  const currentIdx = steps.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36 }}>
      {steps.map((label, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: isDone ? "#C8A96E" : isActive ? "#2C2C2C" : "transparent", border: `2px solid ${isDone || isActive ? "#C8A96E" : "#D4D4D4"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                {isDone ? <span style={{ color: "#fff", fontSize: 13 }}>✓</span> : <span style={{ color: isActive ? "#C8A96E" : "#bbb", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 9, color: isActive ? "#2C2C2C" : "#bbb", fontWeight: isActive ? 700 : 400, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 36, height: 1, background: isDone ? "#C8A96E" : "#E0E0E0", margin: "0 6px", marginBottom: 20, transition: "all 0.3s" }} />}
          </div>
        );
      })}
    </div>
  );
}

const S = {
  card: { background: "#FAFAF8", borderRadius: 20, padding: "38px 44px", maxWidth: 720, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" },
  cardWide: { background: "#FAFAF8", borderRadius: 20, padding: "38px 44px", maxWidth: 820, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" },
  btnDark: (on) => ({ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: on ? "#2C2C2C" : "#E0E0E0", color: on ? "#fff" : "#aaa", fontSize: 15, fontFamily: "sans-serif", fontWeight: 600, cursor: on ? "pointer" : "default", letterSpacing: "0.03em" }),
  btnGold: (on) => ({ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: on ? "#C8A96E" : "#E0E0E0", color: on ? "#fff" : "#aaa", fontSize: 15, fontFamily: "sans-serif", fontWeight: 600, cursor: on ? "pointer" : "default", letterSpacing: "0.03em" }),
  btnBack: { width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, border: "1.5px solid #E0E0E0", background: "transparent", color: "#888", fontSize: 13, fontFamily: "sans-serif", cursor: "pointer" },
  label: { fontSize: 11, fontFamily: "sans-serif", color: "#aaa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" },
  goldLabel: { fontSize: 11, fontFamily: "sans-serif", color: "#C8A96E", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 },
};

const Spinner = ({ msg, sub }) => (
  <div style={{ ...S.card, textAlign: "center", padding: "80px 44px" }}>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    <div style={{ fontSize: 52, marginBottom: 20, display: "inline-block", animation: "spin 3s linear infinite" }}>✦</div>
    <h2 style={{ fontSize: 21, fontWeight: 700, color: "#2C2C2C", marginBottom: 10, marginTop: 0 }}>{msg}</h2>
    <p style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: 14, margin: 0 }}>{sub}</p>
  </div>
);

// ── FULL REDESIGN ──────────────────────────────────────────────────────────────
function FullRedesignFlow({ photo, photoBase64, roomType, onReset }) {
  const [step, setStep] = useState("Describe");
  const [styleDesc, setStyleDesc] = useState("");
  const [suggestedStyles, setSuggestedStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [result, setResult] = useState(null);
  const [genImage, setGenImage] = useState(null);
  const [error, setError] = useState(null);

  const analyzeStyle = async () => {
    if (!styleDesc.trim()) return;
    setIsAnalyzing(true); setError(null);
    try {
      const res = await fetch(ANTHROPIC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: `User redesigning their ${roomType || "room"}, described style as: "${styleDesc}". From: Modern Minimal, Farmhouse Warm, Scandinavian, Industrial, Bohemian, Transitional, Mountain Cabin, Coastal, Art Deco, Japandi — pick 2-3 best matches. Return ONLY valid JSON no markdown: {"matches":["Style1","Style2"],"reasoning":"one sentence"}` }] }) });
      const data = await res.json();
      let parsed;
      try { parsed = safeParseJSON(data.content[0].text); } catch { setSuggestedStyles(STYLE_CARDS.slice(0, 3)); setStep("Style"); setIsAnalyzing(false); return; }
      const matched = STYLE_CARDS.filter(s => (parsed.matches || []).some(m => s.label.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(s.id) || m.toLowerCase().includes(s.label.split(" ")[0].toLowerCase())));
      setSuggestedStyles(matched.length > 0 ? matched : STYLE_CARDS.slice(0, 3));
      setStep("Style");
    } catch { setError("Couldn't reach AI. Please try again."); }
    setIsAnalyzing(false);
  };

  const generate = async () => {
    if (!selectedStyle) return;
    setIsGenerating(true); setGenMsg("✦ Crafting your design concept..."); setError(null);
    try {
      const prompt = `You are NookAI, an expert interior designer. Create a detailed ${selectedStyle.label} redesign for a ${roomType || "room"}. User style: "${styleDesc}". Return ONLY JSON no markdown: {"headline":"6-8 word catchy title","overview":"2-3 sentence vision","changes":[{"area":"Walls & Paint","current":"baseline","recommendation":"specific"},{"area":"Flooring","current":"baseline","recommendation":"specific"},{"area":"Lighting","current":"baseline","recommendation":"specific"},{"area":"Furniture","current":"baseline","recommendation":"specific"},{"area":"Textiles & Decor","current":"baseline","recommendation":"specific"}],"costRange":{"low":2500,"high":8000},"topThreePieces":[{"item":"name","why":"reason","approxPrice":"$XXX"},{"item":"name","why":"reason","approxPrice":"$XXX"},{"item":"name","why":"reason","approxPrice":"$XXX"}],"proTip":"one insider tip","dallePrompt":"Photorealistic interior design photo of a beautiful ${roomType || "room"} fully redesigned in ${selectedStyle.label} style, [add 2 sentences of specific materials colors mood]. Professional photography warm natural light 4K."}`;
      const messages = photoBase64
        ? [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: getMediaType(photo), data: photoBase64 } }, { type: "text", text: "Analyze this room photo and " + prompt }] }]
        : [{ role: "user", content: prompt }];
      const res = await fetch(ANTHROPIC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages }) });
      const data = await res.json();
      const parsed = safeParseJSON(data.content[0].text);
      setResult(parsed);
      setGenMsg("🎨 Rendering your vision...");
      // Kick off img2img async, then poll
      if (photoBase64) {
        try {
          const startRes = await fetch(IMAGE_PROXY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: photoBase64,
              prompt: "Redesign this " + (roomType || "room") + " in " + (selectedStyle?.label || "modern") + " style. " + (parsed.overview || "") + " Photorealistic, professional interior photography, natural light, no people.",
              roomType, element: selectedStyle?.label
            })
          });
          const startData = await startRes.json();
          if (startData.predictionId) {
            pollForImage(startData.predictionId, setGenImage);
          }
        } catch (imgErr) { console.warn("Image proxy failed:", imgErr.message); }
      }
      setStep("Result");
    } catch (err) { setError("Generation failed. Please try again."); }
    setIsGenerating(false);
  };

  if (isGenerating) return <Spinner msg="Designing your space..." sub={genMsg} />;

  return (
    <div>
      <StepIndicator steps={["Describe", "Style", "Result"]} current={step} />

      {step === "Describe" && (
        <div style={S.card}>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: "#2C2C2C", marginBottom: 8, marginTop: 0 }}>Describe your dream vibe</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif", marginBottom: 18, marginTop: 0 }}>Don't worry about design words — describe it how you'd explain it to a friend.</p>
          <div style={{ background: "#F0EDE8", borderRadius: 12, padding: "11px 15px", marginBottom: 18, fontFamily: "sans-serif", fontSize: 13, color: "#888" }}>💬 <em>Try: "Warm and cozy, lots of wood, mountain cabin feel" or "Super clean and bright, almost Japanese"</em></div>
          <textarea value={styleDesc} onChange={e => setStyleDesc(e.target.value)} placeholder="Describe the look and feel you're going for..." rows={5} style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1.5px solid #E0E0E0", fontFamily: "Georgia, serif", fontSize: 15, color: "#2C2C2C", resize: "none", background: "#fff", boxSizing: "border-box", lineHeight: 1.6, outline: "none" }} />
          {error && <p style={{ color: "#E05555", fontFamily: "sans-serif", fontSize: 13, marginTop: 6 }}>{error}</p>}
          <button onClick={analyzeStyle} disabled={!styleDesc.trim() || isAnalyzing} style={{ ...S.btnGold(!!styleDesc.trim()), marginTop: 14 }}>{isAnalyzing ? "✨ Reading your vibe..." : "Find my style →"}</button>
          <button onClick={onReset} style={S.btnBack}>← Back</button>
        </div>
      )}

      {step === "Style" && (
        <div style={S.cardWide}>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: "#2C2C2C", marginBottom: 8, marginTop: 0 }}>We found your styles</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif", marginBottom: 22, marginTop: 0 }}>Pick the one that feels most right — then we'll build your concept.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 11, marginBottom: 20 }}>
            {(suggestedStyles.length > 0 ? suggestedStyles : STYLE_CARDS).map(style => {
              const isSel = selectedStyle?.id === style.id;
              return <div key={style.id} onClick={() => setSelectedStyle(style)} style={{ padding: "15px", borderRadius: 13, cursor: "pointer", border: `2px solid ${isSel ? "#C8A96E" : "#E8E8E8"}`, background: isSel ? "#FDF8F0" : "#fff", transition: "all 0.2s", boxShadow: isSel ? "0 4px 14px rgba(200,169,110,0.2)" : "none" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{style.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", marginBottom: 4 }}>{style.label}</div>
                <div style={{ fontSize: 12, color: "#999", fontFamily: "sans-serif", lineHeight: 1.4 }}>{style.desc}</div>
                {isSel && <div style={{ marginTop: 6, fontSize: 11, color: "#C8A96E", fontWeight: 700, fontFamily: "sans-serif" }}>✓ Selected</div>}
              </div>;
            })}
          </div>
          <div style={{ marginBottom: 12, fontSize: 13, fontFamily: "sans-serif", color: "#aaa", textAlign: "center" }}>Don't see your style? <span onClick={() => setSuggestedStyles(STYLE_CARDS)} style={{ color: "#C8A96E", cursor: "pointer", textDecoration: "underline" }}>Show all 10 styles</span></div>
          <button onClick={generate} disabled={!selectedStyle} style={S.btnDark(!!selectedStyle)}>✨ Generate my redesign</button>
          <button onClick={() => setStep("Describe")} style={S.btnBack}>← Back</button>
        </div>
      )}

      {step === "Result" && result && (
        <div style={S.cardWide}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 26 }}>
            <div><div style={S.label}>Before</div>{photo ? <img src={photo} alt="before" style={{ width: "100%", height: 195, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 195, borderRadius: 10, background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 12, fontFamily: "sans-serif" }}>No photo</span></div>}</div>
            <div><div style={S.goldLabel}>✦ Your Vision</div>{genImage && !genImage.startsWith("ERROR:") ? <img src={genImage} alt="after" style={{ width: "100%", height: 195, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 195, borderRadius: 10, background: "linear-gradient(135deg,#F0EDE8,#E8E2D8)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #D4C9B8", padding: 12 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 26 }}>{selectedStyle?.emoji}</div><div style={{ fontSize: 11, fontFamily: "sans-serif", color: genImage?.startsWith("ERROR:") ? "#E05555" : "#aaa", marginTop: 6, lineHeight: 1.4 }}>{genImage?.startsWith("ERROR:") ? genImage.replace("ERROR:", "") : "Generating your vision..."}</div></div></div>}</div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "inline-block", background: "#F0EDE8", borderRadius: 8, padding: "3px 11px", fontSize: 11, fontFamily: "sans-serif", color: "#C8A96E", fontWeight: 700, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>{selectedStyle?.label}</div>
            <h2 style={{ fontSize: 25, fontWeight: 700, color: "#2C2C2C", margin: "0 0 10px" }}>{result.headline}</h2>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, fontFamily: "sans-serif", margin: 0 }}>{result.overview}</p>
          </div>
          <div style={{ background: "#F7F5F2", borderRadius: 13, padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#2C2C2C", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recommended Changes</div>
            {result.changes?.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: 10, padding: "9px 0", borderBottom: i < result.changes.length - 1 ? "1px solid #E8E8E8" : "none", alignItems: "start" }}>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#C8A96E", textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.area}</div>
                <div style={{ fontSize: 13, fontFamily: "sans-serif", color: "#999" }}><span style={{ display: "block", fontSize: 9, textTransform: "uppercase", color: "#ccc", marginBottom: 2 }}>Now</span>{c.current}</div>
                <div style={{ fontSize: 13, fontFamily: "sans-serif", color: "#2C2C2C" }}><span style={{ display: "block", fontSize: 9, textTransform: "uppercase", color: "#C8A96E", marginBottom: 2 }}>→ Recommended</span>{c.recommendation}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div style={{ background: "#2C2C2C", borderRadius: 13, padding: 18, color: "#fff" }}>
              <div style={{ fontSize: 10, fontFamily: "sans-serif", color: "#888", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Estimated Cost</div>
              <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "sans-serif" }}>${result.costRange?.low?.toLocaleString()} – ${result.costRange?.high?.toLocaleString()}</div>
            </div>
            <div style={{ background: "#FDF8F0", borderRadius: 13, padding: 18, border: "1.5px solid #EDE0C8" }}>
              <div style={{ fontSize: 10, fontFamily: "sans-serif", color: "#C8A96E", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>✦ Pro Tip</div>
              <div style={{ fontSize: 13, fontFamily: "sans-serif", color: "#666", lineHeight: 1.5 }}>{result.proTip}</div>
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#2C2C2C", marginBottom: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>3 Pieces That Anchor the Look</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.topThreePieces?.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#F7F5F2", borderRadius: 10, padding: "11px 15px" }}>
                  <div style={{ width: 26, height: 26, background: "#C8A96E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "sans-serif" }}>{i + 1}</span></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "sans-serif" }}>{p.item}</div><div style={{ fontSize: 12, color: "#999", fontFamily: "sans-serif" }}>{p.why}</div></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A96E", fontFamily: "sans-serif" }}>{p.approxPrice}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#2C2C2C,#444)", borderRadius: 13, padding: 22, textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 5 }}>Love this vision?</div>
            <p style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: 13, margin: "0 0 14px" }}>Get quotes from local contractors who specialize in {selectedStyle?.label} spaces.</p>
            <button style={{ padding: "11px 26px", borderRadius: 10, border: "none", background: "#C8A96E", color: "#fff", fontSize: 14, fontFamily: "sans-serif", fontWeight: 700, cursor: "pointer" }}>Connect with Contractors →</button>
          </div>
          <button onClick={onReset} style={S.btnBack}>↺ Start over</button>
        </div>
      )}
    </div>
  );
}

// ── SPECIFIC CHANGE ────────────────────────────────────────────────────────────
function SpecificChangeFlow({ photo, photoBase64, roomType, onReset }) {
  const [step, setStep] = useState("Element");
  const [selectedEl, setSelectedEl] = useState(null);
  const [changeDesc, setChangeDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [genImage, setGenImage] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!selectedEl || !changeDesc.trim()) return;
    setIsGenerating(true); setError(null);

    // Step 1: Claude concept
    let parsed;
    try {
      const basePrompt = "You are NookAI. User wants to change ONLY their " + selectedEl.label + " in a " + (roomType || "room") + ". Request: \"" + changeDesc + "\". Return ONLY valid JSON no markdown: {\"headline\":\"short title\",\"summary\":\"2-3 sentences\",\"options\":[{\"name\":\"Option 1\",\"description\":\"material color\",\"pros\":\"why it works\",\"cost\":\"$XXX-$XXX\"},{\"name\":\"Option 2\",\"description\":\"...\",\"pros\":\"...\",\"cost\":\"...\"},{\"name\":\"Option 3\",\"description\":\"...\",\"pros\":\"...\",\"cost\":\"...\"}],\"installTip\":\"one tip\"}";
      const messages = photoBase64
        ? [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: getMediaType(photo), data: photoBase64 } }, { type: "text", text: "Look at this room. " + basePrompt }] }]
        : [{ role: "user", content: basePrompt }];
      const res = await fetch(ANTHROPIC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages }) });
      if (!res.ok) throw new Error("Claude API error " + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Claude API error");
      parsed = safeParseJSON(data.content[0].text);
      setResult(parsed);
    } catch (err) {
      setError("Design failed: " + err.message + ". Please try again.");
      setIsGenerating(false);
      return;
    }

    // Kick off img2img async, then poll
    if (photoBase64) {
      try {
        const startRes = await fetch(IMAGE_PROXY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: photoBase64,
            prompt: "Same " + (roomType || "room") + " but replace the " + selectedEl.label + " with: " + (parsed.options?.[0]?.description || changeDesc) + ". Keep everything else identical. Photorealistic interior photography, natural light, no people.",
            roomType, element: selectedEl.label
          })
        });
        const startData = await startRes.json();
        if (startData.predictionId) {
          pollForImage(startData.predictionId, setGenImage);
        }
      } catch (imgErr) { console.warn("Image proxy failed:", imgErr.message); }
    }

    setStep("Result");
    setIsGenerating(false);
  };
  if (isGenerating) return <Spinner msg={`Working on your ${selectedEl?.label}...`} sub="Generating options and rendering your vision." />;

  return (
    <div>
      <StepIndicator steps={["Element", "Describe", "Result"]} current={step} />

      {step === "Element" && (
        <div style={S.cardWide}>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: "#2C2C2C", marginBottom: 8, marginTop: 0 }}>What do you want to change?</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif", marginBottom: 22, marginTop: 0 }}>Pick the one element you're focusing on.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: 10, marginBottom: 22 }}>
            {SPECIFIC_ELEMENTS.map(el => {
              const isSel = selectedEl?.id === el.id;
              return <div key={el.id} onClick={() => setSelectedEl(el)} style={{ padding: "16px 12px", borderRadius: 12, cursor: "pointer", border: `2px solid ${isSel ? "#C8A96E" : "#E8E8E8"}`, background: isSel ? "#FDF8F0" : "#fff", textAlign: "center", transition: "all 0.2s", boxShadow: isSel ? "0 4px 12px rgba(200,169,110,0.2)" : "none" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{el.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: isSel ? 700 : 600, color: isSel ? "#C8A96E" : "#2C2C2C", fontFamily: "sans-serif" }}>{el.label}</div>
              </div>;
            })}
          </div>
          <button onClick={() => setStep("Describe")} disabled={!selectedEl} style={S.btnDark(!!selectedEl)}>Continue →</button>
          <button onClick={onReset} style={S.btnBack}>← Back</button>
        </div>
      )}

      {step === "Describe" && (
        <div style={S.card}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0EDE8", borderRadius: 20, padding: "5px 13px", marginBottom: 18 }}>
            <span style={{ fontSize: 17 }}>{selectedEl?.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#C8A96E" }}>{selectedEl?.label}</span>
          </div>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: "#2C2C2C", marginBottom: 8, marginTop: 0 }}>What are you thinking?</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif", marginBottom: 18, marginTop: 0 }}>Describe what you want — as specific or vague as you like.</p>
          <div style={{ background: "#F0EDE8", borderRadius: 12, padding: "11px 15px", marginBottom: 18, fontFamily: "sans-serif", fontSize: 13, color: "#888" }}>💬 <em>Try: "Something lighter, maybe white quartz" or "Dark and dramatic, like black soapstone"</em></div>
          <textarea value={changeDesc} onChange={e => setChangeDesc(e.target.value)} placeholder={`Describe the ${selectedEl?.label?.toLowerCase()} you're imagining...`} rows={4} style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1.5px solid #E0E0E0", fontFamily: "Georgia, serif", fontSize: 15, color: "#2C2C2C", resize: "none", background: "#fff", boxSizing: "border-box", lineHeight: 1.6, outline: "none" }} />
          {error && <p style={{ color: "#E05555", fontFamily: "sans-serif", fontSize: 13, marginTop: 6 }}>{error}</p>}
          <button onClick={generate} disabled={!changeDesc.trim()} style={{ ...S.btnGold(!!changeDesc.trim()), marginTop: 14 }}>✨ Show me my options</button>
          <button onClick={() => setStep("Element")} style={S.btnBack}>← Back</button>
        </div>
      )}

      {step === "Result" && result && (
        <div style={S.cardWide}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0EDE8", borderRadius: 20, padding: "5px 13px", marginBottom: 18 }}>
            <span style={{ fontSize: 16 }}>{selectedEl?.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#C8A96E", textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedEl?.label} Update</span>
          </div>
          <h2 style={{ fontSize: 25, fontWeight: 700, color: "#2C2C2C", margin: "0 0 10px" }}>{result.headline}</h2>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, fontFamily: "sans-serif", margin: "0 0 22px" }}>{result.summary}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
            <div><div style={S.label}>Before</div>{photo ? <img src={photo} alt="before" style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 190, borderRadius: 10, background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#bbb", fontSize: 12, fontFamily: "sans-serif" }}>No photo</span></div>}</div>
            <div><div style={S.goldLabel}>✦ With New {selectedEl?.label}</div>{genImage && !genImage.startsWith("ERROR:") ? <img src={genImage} alt="after" style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 190, borderRadius: 10, background: "linear-gradient(135deg,#F0EDE8,#E8E2D8)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #D4C9B8", padding: 12 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 22 }}>{selectedEl?.emoji}</div><div style={{ fontSize: 11, fontFamily: "sans-serif", color: genImage?.startsWith("ERROR:") ? "#E05555" : "#aaa", marginTop: 6, lineHeight: 1.4 }}>{genImage?.startsWith("ERROR:") ? genImage.replace("ERROR:", "") : "Generating your vision..."}</div></div></div>}</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#2C2C2C", marginBottom: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Options</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {result.options?.map((opt, i) => (
              <div key={i} style={{ background: i === 0 ? "#FDF8F0" : "#F7F5F2", borderRadius: 12, padding: "15px 17px", border: i === 0 ? "1.5px solid #EDE0C8" : "1.5px solid #EBEBEB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {i === 0 && <span style={{ fontSize: 10, background: "#C8A96E", color: "#fff", borderRadius: 5, padding: "2px 7px", fontFamily: "sans-serif", fontWeight: 700 }}>TOP PICK</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "sans-serif" }}>{opt.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A96E", fontFamily: "sans-serif" }}>{opt.cost}</span>
                </div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: "sans-serif", marginBottom: 4 }}>{opt.description}</div>
                <div style={{ fontSize: 12, color: "#999", fontFamily: "sans-serif" }}>✓ {opt.pros}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#F0EDE8", borderRadius: 12, padding: "13px 16px", marginBottom: 22, display: "flex", gap: 10, alignItems: "start" }}>
            <span style={{ fontSize: 17 }}>🔧</span>
            <div><div style={{ fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", color: "#C8A96E", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Install Tip</div><div style={{ fontSize: 13, fontFamily: "sans-serif", color: "#666", lineHeight: 1.5 }}>{result.installTip}</div></div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#2C2C2C,#444)", borderRadius: 13, padding: 22, textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 5 }}>Ready to make it happen?</div>
            <p style={{ color: "#aaa", fontFamily: "sans-serif", fontSize: 13, margin: "0 0 14px" }}>Connect with local contractors who can handle your {selectedEl?.label?.toLowerCase()} update.</p>
            <button style={{ padding: "11px 26px", borderRadius: 10, border: "none", background: "#C8A96E", color: "#fff", fontSize: 14, fontFamily: "sans-serif", fontWeight: 700, cursor: "pointer" }}>Connect with Contractors →</button>
          </div>
          <button onClick={onReset} style={S.btnBack}>↺ Start over</button>
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function NookAI() {
  const [mode, setMode] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [roomType, setRoomType] = useState("");
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const d = ev.target.result; setPhoto(d); setPhotoBase64(d.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const reset = () => { setMode(null); setPhoto(null); setPhotoBase64(null); setRoomType(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F3EF", fontFamily: "'Georgia','Times New Roman',serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 38 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 7 }}>
          <div style={{ width: 36, height: 36, background: "#2C2C2C", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18 }}>🏠</span></div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#2C2C2C", letterSpacing: "-0.5px" }}>NookAI</span>
        </div>
        <p style={{ color: "#888", fontSize: 13, margin: 0, fontFamily: "sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Visualize your dream space</p>
      </div>

      {!mode && (
        <div style={S.card}>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: "#2C2C2C", marginBottom: 8, marginTop: 0 }}>Upload your space</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: "sans-serif", marginBottom: 22, marginTop: 0 }}>A photo helps us tailor your recommendations — or skip ahead without one.</p>
          <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed #D4D4D4", borderRadius: 15, padding: "34px 20px", textAlign: "center", cursor: "pointer", marginBottom: 18, background: photo ? "#fff" : "transparent", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#C8A96E"} onMouseLeave={e => e.currentTarget.style.borderColor = "#D4D4D4"}>
            {photo ? <img src={photo} alt="room" style={{ maxHeight: 190, maxWidth: "100%", borderRadius: 10, objectFit: "cover" }} /> : <><div style={{ fontSize: 36, marginBottom: 9 }}>📷</div><p style={{ color: "#888", fontFamily: "sans-serif", fontSize: 14, margin: 0 }}>Click to upload a photo of your room</p><p style={{ color: "#bbb", fontFamily: "sans-serif", fontSize: 12, margin: "3px 0 0" }}>JPG, PNG — any size</p></>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: "block", fontSize: 11, fontFamily: "sans-serif", color: "#666", marginBottom: 7, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Room Type</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ width: "100%", padding: "12px 15px", borderRadius: 10, border: "1.5px solid #E0E0E0", background: "#fff", fontFamily: "sans-serif", fontSize: 15, color: "#2C2C2C", appearance: "none", cursor: "pointer" }}>
              <option value="">Select a room type...</option>
              {["Kitchen", "Living Room", "Bedroom", "Bathroom", "Dining Room", "Home Office", "Outdoor / Patio"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#2C2C2C", marginBottom: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>What would you like to do?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "full", icon: "🏠", title: "Full Redesign", desc: "Complete style transformation from top to bottom", hover: { border: "#2C2C2C", bg: "#2C2C2C", titleColor: "#fff", descColor: "#aaa" } },
              { key: "specific", icon: "🔧", title: "Specific Change", desc: "Swap one element — countertops, flooring, paint & more", hover: { border: "#C8A96E", bg: "#FDF8F0", titleColor: "#2C2C2C", descColor: "#888" } },
            ].map(opt => (
              <div key={opt.key} onClick={() => setMode(opt.key)} style={{ padding: "20px 16px", borderRadius: 15, border: "2px solid #E8E8E8", background: "#fff", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = opt.hover.border; e.currentTarget.style.background = opt.hover.bg; e.currentTarget.querySelectorAll("p")[0].style.color = opt.hover.titleColor; e.currentTarget.querySelectorAll("p")[1].style.color = opt.hover.descColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E8E8"; e.currentTarget.style.background = "#fff"; e.currentTarget.querySelectorAll("p")[0].style.color = "#2C2C2C"; e.currentTarget.querySelectorAll("p")[1].style.color = "#999"; }}>
                <div style={{ fontSize: 30, marginBottom: 9 }}>{opt.icon}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2C", fontFamily: "sans-serif", margin: "0 0 5px", transition: "color 0.2s" }}>{opt.title}</p>
                <p style={{ fontSize: 12, color: "#999", fontFamily: "sans-serif", lineHeight: 1.4, margin: 0, transition: "color 0.2s" }}>{opt.desc}</p>
              </div>
            ))}
          </div>
          {photo && <button onClick={() => { setPhoto(null); setPhotoBase64(null); }} style={{ ...S.btnBack, marginTop: 12 }}>Remove photo</button>}
        </div>
      )}

      {mode === "full" && <FullRedesignFlow photo={photo} photoBase64={photoBase64} roomType={roomType} onReset={reset} />}
      {mode === "specific" && <SpecificChangeFlow photo={photo} photoBase64={photoBase64} roomType={roomType} onReset={reset} />}

      <p style={{ marginTop: 30, fontSize: 10, color: "#ccc", fontFamily: "sans-serif", letterSpacing: "0.06em" }}>NOOKAI · AI-POWERED INTERIOR DESIGN</p>
    </div>
  );
}
