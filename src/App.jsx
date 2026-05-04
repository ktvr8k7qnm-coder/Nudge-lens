import { Analytics } from "@vercel/analytics/react";
import { useEffect, useMemo, useState } from "react";

/* =======================
   🧠 BIAS MODELS（不改逻辑）
======================= */

const BIAS_MODELS = [
  {
    id: "extreme_risk",
    weight: 2.0,
    signals: [
      "quit job","all savings","no plan","tomorrow","immediately",
      "without plan","no backup","risk everything",
      "辞职","全部积蓄","没有计划","马上"
    ],
    interpretation: "High-risk irreversible action"
  },
  {
    id: "uncertainty_risk",
    weight: 1.8,
    signals: [
      "without understanding","don't understand","not understand",
      "unknown","unfamiliar","language","no experience",
      "不了解","不会语言","没经验"
    ],
    interpretation: "Acting with incomplete understanding"
  },
  {
    id: "present_bias",
    weight: 1.2,
    signals: ["now","today","tomorrow","马上","现在"],
    interpretation: "Short-term urgency bias"
  },
  {
    id: "external_dependency",
    weight: 1.5,
    signals: [
      "until he replies","until she replies","waiting for reply",
      "until they reply","waiting for response","waiting for him",
      "等他回复","等她回复","等回复","等他消息"
    ],
    interpretation: "Decision is dependent on external response"
  }
];

/* =======================
   🧠 ENGINE（简化）
======================= */

function normalize(text) {
  return text.toLowerCase();
}

function analyseDecision(text) {
  const input = text.toLowerCase();

  const results = BIAS_MODELS.map((m) => {
    let hitCount = 0;

    m.signals.forEach(s => {
      if (input.includes(s)) hitCount++;
    });

    // semantic boosts
    if (m.id === "uncertainty_risk") {
      if (input.includes("without") && (input.includes("know") || input.includes("understand"))) {
        hitCount += 2;
      }
    }

    if (m.id === "extreme_risk") {
      if (input.includes("going") && input.includes("country") && input.includes("tomorrow")) {
        hitCount += 2;
      }
    }

    if (m.id === "external_dependency") {
      if (input.includes("until") && (input.includes("reply") || input.includes("respond"))) {
        hitCount += 2;
      }
    }

    const score = hitCount * 25 * m.weight;

    return { ...m, score };
  }).filter(r => r.score > 0);

  const pressure = Math.min(100, results.reduce((a,b)=>a+b.score,0));
  const reflectiveIndex = 100 - pressure;

  const top = results.sort((a,b)=>b.score-a.score)[0];

  let summary, why, action;

  if (pressure > 70) {

    summary = "This decision may not be as stable as it seems.";

    if (top?.id === "uncertainty_risk") {
      why = "You are acting without fully understanding the situation, which increases uncertainty and potential mistakes.";
      action = "List the key unknowns and reduce them before moving forward.";
    } else if (top?.id === "external_dependency") {
      why = "You are delaying action based on someone else's response, which reduces your control over the outcome.";
      action = "Clarify what you can decide independently before waiting.";
    } else {
      why = "This involves a high-impact decision with urgency signals, which often leads to regret.";
      action = "Pause and simulate worst-case scenarios before acting.";
    }

  } else if (pressure > 40) {

    summary = "There are some hidden risks in this decision.";

    if (top?.id === "external_dependency") {
      why = "Your decision is partially dependent on someone else's response, which may limit your control.";
      action = "Define what you will do if no reply comes.";
    } else {
      why = "Your thinking may be influenced by incomplete reasoning or short-term pressure.";
      action = "Compare at least one alternative before deciding.";
    }

  } else {
    summary = "This decision looks relatively stable.";
    why = "No strong behavioural risks detected in your description.";
    action = "Proceed, but stay adaptive.";
  }

  return {
    pressure,
    reflectiveIndex,
    summary,
    why,
    action,
    recommendation: summary, // 🔥 fix undefined UI issue
    topSignal: top?.id || null
  };
}

/* =======================
   🎨 APP
======================= */

export default function App() {
  const [input, setInput] = useState("");

  /* 🔥 动态 placeholder */
  const placeholders = [
    "Describe your decision here...",
    "What are you thinking about...",
    "Tell me what's on your mind...",
    "What feels uncertain right now...",
    "Write anything — I’ll help you reflect"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setPlaceholderIndex(p => (p + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const placeholder = placeholders[placeholderIndex];

  const current = input ? analyseDecision(input) : null;

  const hasInput = input.trim().length > 0;


  return (
    <div style={styles.page}>
      <div className="nl-container" style={{ width: "100%", maxWidth: "none" }}>
      <style>{`
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff !important;
        overflow-x: hidden;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        background: #ffffff !important;
      }

      /* Ensure no horizontal overflow causing edges */
      body, #root {
        overflow-x: hidden;
      }

      html {
        background: #ffffff !important;
      }

      body {
        background: #ffffff !important;
      }

      #root {
        width: 100vw;
        min-height: 100vh;
        background: #ffffff !important;
      }

      @keyframes inputBreath {
        0% {
          box-shadow: 0 1px 6px rgba(32,33,36,.18);
          border-color: #dadce0;
          background: #fff;
        }
        50% {
          box-shadow: 0 12px 48px rgba(26,115,232,.28);
          border-color: #1a73e8;
          background: #f4f8ff;
        }
        100% {
          box-shadow: 0 1px 6px rgba(32,33,36,.18);
          border-color: #dadce0;
          background: #fff;
        }
      }

      `}</style>

      <h1 style={styles.title} className="nl-title">NudgeLens</h1>

      <textarea
        className="nl-textarea"
        style={{
          ...styles.searchBox,
          animation: hasInput ? "inputBreath 2.2s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
          caretColor: "#1a73e8"
        }}
        value={input}
        placeholder={placeholder}
        onFocus={(e)=>{
          e.target.style.boxShadow="0 12px 40px rgba(26,115,232,.25)";
          e.target.style.borderColor="#1a73e8";
        }}
        onBlur={(e)=>{
          e.target.style.boxShadow="0 1px 6px rgba(32,33,36,.18)";
          e.target.style.borderColor="#dadce0";
        }}
        onChange={(e)=>{
          setInput(e.target.value);
        }}
      />

      <button style={styles.button} className="nl-button">
        Analyse
      </button>

      {input && (
        <div style={styles.feedback} className="nl-feedback">
          <h2>{current.recommendation}</h2>
          <p style={{fontWeight: 500}}>{current.summary}</p>
          <p style={{opacity: 0.7}}>{current.why}</p>
          <p style={{marginTop: 10}}><b>Next step:</b> {current.action}</p>

          <div style={styles.metrics} className="nl-metrics">
            <div>Pressure: {current.pressure}</div>
            <div>Reflective: {current.reflectiveIndex}</div>
          </div>
        </div>
      )}

      <Analytics />
      </div>
    </div>
  );
}

/* =======================
   🎨 STYLE
======================= */

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#ffffff",
    paddingTop: 60,
    boxSizing: "border-box",
    fontFamily: "Arial",
    margin: 0
  },
  title: {
    fontSize: 42,
    marginBottom: 24,
    color: "#1a73e8",
    textAlign: "center"
  },
  searchBox: {
    width: "100%",
    minHeight: 140,
    border: "1px solid #dadce0",
    borderRadius: 32,
    padding: 24,
    fontSize: 17,
    borderColor: "#dadce0",
    transition: "all 0.3s ease",
    display: "block"
  },
  button: {
    marginTop: 24,
    padding: "12px 28px",
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto"
  },
  feedback: {
    marginTop: 40,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center"
  },
  metrics: {
    marginTop: 16,
    opacity: 0.6,
    display: "flex",
    justifyContent: "center",
    gap: 24
  }
};