import React, { useState } from "react";

/* =======================
   🧠 VERSION
======================= */
const VERSION = {
  number: "v1.2.0",
  name: "LLM Narrative Upgrade",
  date: "2026-05-04"
};

/* =======================
   🔧 UTILS
======================= */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/* =======================
   🧠 ENGINE
======================= */

// ---------- NORMALIZE ----------
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/买/g, "buy")
    .replace(/吃/g, "eat")
    .replace(/点外卖/g, "order food")
    .replace(/发消息/g, "send message")
    .replace(/不想/g, "dont want")
    .replace(/累/g, "tired");
}

// ---------- INTENT ----------
function detectIntent(t) {
  if (t.includes("eat") || t.includes("food")) return "consumption";
  if (t.includes("buy")) return "purchase";
  if (t.includes("study") || t.includes("work")) return "productivity";
  if (t.includes("message")) return "social";
  return "general";
}

// ---------- DRIVERS ----------
function detectDrivers(t) {
  let d = [];

  if (t.includes("want") || t.includes("想")) d.push("desire");
  if (t.includes("tired")) d.push("fatigue");
  if (t.includes("hungry")) d.push("need");
  if (t.includes("bored")) d.push("boredom");
  if (t.includes("stress")) d.push("stress");

  return d;
}

// ---------- CONSTRAINTS ----------
function detectConstraints(t) {
  let c = [];

  if (t.includes("money") || t.includes("expensive")) c.push("cost");
  if (t.includes("time")) c.push("time");
  if (t.includes("health")) c.push("health");

  return c;
}

// ---------- BIAS ----------
const BIAS = [
  { id: "impulse", trigger: ["now"], w: 1.4 },
  { id: "lazy", trigger: ["lazy"], w: 1.3 },
  { id: "emotion", trigger: ["angry"], w: 1.5 },
  { id: "fomo", trigger: ["miss"], w: 1.4 },
  { id: "avoidance", trigger: ["dont want"], w: 1.4 }
];

function detectBias(t) {
  let hits = [];
  BIAS.forEach((b) => {
    b.trigger.forEach((k) => {
      if (t.includes(k)) hits.push(b);
    });
  });
  return hits;
}

// ---------- TENSION ----------
function buildTension(drivers, constraints) {
  let t = [];

  if (drivers.includes("desire") && constraints.includes("cost"))
    t.push("desire vs cost");

  if (drivers.includes("fatigue") && constraints.includes("time"))
    t.push("fatigue vs responsibility");

  if (drivers.includes("boredom"))
    t.push("comfort vs discipline");

  return t;
}

// ---------- SCENARIO ----------
function simulate(intent) {
  const map = {
    consumption: {
      act: "you gain immediate comfort, but cost accumulates.",
      wait: "the discomfort stays, but long-term impact remains controlled."
    },
    purchase: {
      act: "you gain short-term satisfaction, but commit to cost.",
      wait: "desire may fade, reducing regret."
    },
    productivity: {
      act: "you reduce pressure now, but expend effort.",
      wait: "pressure compounds over time."
    },
    social: {
      act: "you gain clarity, but may trigger new dynamics.",
      wait: "uncertainty remains."
    }
  };

  return map[intent] || {
    act: "you change the current state.",
    wait: "you keep things unchanged."
  };
}

// ---------- SECOND ORDER ----------
function secondOrder(intent) {
  const map = {
    consumption: "repeated short-term choices can reinforce habits.",
    purchase: "repeated purchases may reduce flexibility.",
    productivity: "delay compounds workload over time.",
    social: "delay may shift relationship dynamics."
  };

  return map[intent] || "impact remains limited.";
}

// ---------- HEADLINE ----------
function generateHeadline(pressure, drivers, tension, bias) {
  const HIGH = [
    "This may be worth pausing on",
    "There are signs of short-term pressure",
    "This decision may not be fully stable"
  ];

  const MID = [
    "This deserves a closer look",
    "There may be subtle bias here",
    "The situation isn't entirely neutral"
  ];

  const LOW = [
    "This appears relatively stable",
    "No strong distortion detected",
    "This seems reasonably balanced"
  ];

  let base =
    pressure > 70 ? pick(HIGH) :
    pressure > 40 ? pick(MID) :
    pick(LOW);

  if (tension.length) return base + " — competing priorities detected";
  if (drivers.includes("fatigue")) return base + " — fatigue may be influencing it";
  if (bias.length) return base + " — behavioural signals present";

  return base;
}

// ---------- MAIN ----------
function analyzeDecision(text) {
  const t = normalize(text);

  const intent = detectIntent(t);
  const drivers = detectDrivers(t);
  const constraints = detectConstraints(t);
  const bias = detectBias(t);
  const tension = buildTension(drivers, constraints);
  const scenario = simulate(intent);
  const second = secondOrder(intent);

  let score =
    drivers.length * 0.7 +
    bias.reduce((a, b) => a + b.w, 0) +
    tension.length * 0.8 -
    constraints.length * 0.5;

  const probability = sigmoid(score - 1.3);
  const pressure = Math.min(100, probability * 100);

  return {
    headline: generateHeadline(pressure, drivers, tension, bias),
    quick: pick([
      "Something about this feels slightly rushed.",
      "There are subtle forces shaping this decision.",
      "This may lean toward short-term comfort."
    ]),
    deep: `
This decision is influenced by ${drivers.join(", ") || "internal factors"}.

Constraints such as ${constraints.join(", ") || "none"} exist, though they may not be fully considered.

${tension.length ? `There is tension between ${tension.join(", ")}.` : ""}

Behavioural signals (${bias.map(b => b.id).join(", ") || "none"}) suggest the evaluation may not be entirely neutral.
`,
    scenario: `
If you act: ${scenario.act}
If you wait: ${scenario.wait}
`,
    second: `Over time: ${second}`,
    action: pick([
      "Take a moment before acting.",
      "Re-evaluate without urgency.",
      "Step back and reassess."
    ])
  };
}

/* =======================
   🎨 UI
======================= */

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    setResult(analyzeDecision(input));
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      
      <h2>Nudge Lens</h2>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a decision..."
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <button onClick={handleAnalyze} style={{ marginTop: 10 }}>
        Analyze
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>{result.headline}</h3>
          <p>{result.quick}</p>
          <pre>{result.deep}</pre>
          <pre>{result.scenario}</pre>
          <pre>{result.second}</pre>
          <p><b>{result.action}</b></p>
        </div>
      )}

      {/* VERSION */}
      <div style={{
        marginTop: 50,
        fontSize: 12,
        opacity: 0.4,
        textAlign: "center"
      }}>
        {VERSION.number} · {VERSION.name} · {VERSION.date}
      </div>

    </div>
  );
}
