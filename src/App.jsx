import { Analytics } from "@vercel/analytics/react";
import { useEffect, useMemo, useState } from "react";

const BIAS_MODELS = [
  {
    id: "extreme_risk",
    name: "Extreme Decision Risk",
    label: "large irreversible action without enough planning",
    weight: 1.9,
    signals: [
      "sold everything", "sold all my belongings", "sold all my possessions",
      "quit my job", "resigned from my job", "left my job",
      "without another job", "without a backup plan", "without planning",
      "without any plan", "without a plan", "no plan", "without telling anyone",
      "moved to another country", "move to another country", "all my savings",
      "all my money", "spent all my savings", "invested everything",
      "trusted a stranger", "ignored all warnings", "refused to listen",
      "huge decision within minutes", "just to prove a point",
      "没有计划", "没有后路", "辞职", "卖掉所有", "全部积蓄",
      "所有存款", "没有告诉任何人", "搬去另一个国家", "相信陌生人"
    ],
    interpretation:
      "The decision appears large, hard to reverse, and weakly planned. This is a high-risk structure even if the motivation feels strong.",
    nudge:
      "Pause immediately. Define the worst-case outcome, create a backup plan, and consult at least one independent person before acting.",
    question:
      "What irreversible harm could happen if this decision goes wrong?"
  },
  {
    id: "loss_aversion",
    name: "Loss Aversion",
    label: "Regret / fear of missing out",
    weight: 1.35,
    signals: [
      "regret", "miss", "miss out", "fear", "limited", "last chance",
      "后悔", "错过", "害怕", "怕", "限时", "最后机会", "没了"
    ],
    interpretation:
      "The decision may be driven by regret avoidance rather than objective value.",
    nudge:
      "Delay the decision for 24 hours. If it still makes sense tomorrow, it is less likely to be driven by fear of missing out.",
    question:
      "Am I choosing this because it creates value, or because I want to avoid regret?"
  },
  {
    id: "anchoring",
    name: "Anchoring Bias",
    label: "Reference price / discount framing",
    weight: 1.25,
    signals: [
      "discount", "sale", "original", "original price", "price", "cheap",
      "折扣", "打折", "原价", "价格", "便宜", "优惠", "划算"
    ],
    interpretation:
      "The decision may be overly influenced by a reference price, discount, or first impression.",
    nudge:
      "Hide the original price and judge only the final price, usefulness, budget impact, and opportunity cost.",
    question:
      "Would I still want this if the discount label and original price were removed?"
  },
  {
    id: "social_proof",
    name: "Social Proof",
    label: "Social validation / popularity pressure",
    weight: 1.12,
    signals: [
      "everyone", "friends", "popular", "reviews", "review", "trend",
      "别人", "大家", "朋友", "流行", "评价", "都说", "很多人", "推荐"
    ],
    interpretation:
      "The decision may be using popularity or social approval as a substitute for personal fit.",
    nudge:
      "Remove the audience. Ask whether you would still choose it if nobody else could see or judge it.",
    question:
      "Is this my own preference, or am I borrowing other people's preferences?"
  },
  {
    id: "present_bias",
    name: "Present Bias",
    label: "Immediate reward / short-term satisfaction",
    weight: 1.2,
    signals: [
      "now", "today", "immediately", "reward", "feel good", "want it",
      "现在", "马上", "今天", "立刻", "奖励自己", "爽", "开心", "想要"
    ],
    interpretation:
      "Immediate satisfaction may be more visible than future cost.",
    nudge:
      "Translate the choice into a future cost: what will this reduce your ability to do next week or next month?",
    question:
      "Will this still feel like a good decision one month from now?"
  },
  {
    id: "sunk_cost",
    name: "Sunk Cost Fallacy",
    label: "Past investment pressure",
    weight: 1.28,
    signals: [
      "already", "spent", "wasted", "continue", "research",
      "已经", "花了", "浪费", "继续", "研究了", "白费", "投入"
    ],
    interpretation:
      "Past effort may be pulling the user into a future decision that no longer makes sense.",
    nudge:
      "Ignore past cost. Ask: starting today, is this still the best option?",
    question:
      "If I had not invested anything yet, would I still choose this?"
  },
  {
    id: "overconfidence",
    name: "Overconfidence",
    label: "Underestimating uncertainty",
    weight: 1.38,
    signals: [
      "sure", "certain", "definitely", "guaranteed", "easy", "no risk",
      "稳赚", "肯定", "一定", "不会错", "很简单", "确定", "没风险"
    ],
    interpretation:
      "The decision may underestimate uncertainty, downside risk, or the chance of being wrong.",
    nudge:
      "Run a pre-mortem: imagine the decision failed badly. What are the three most likely reasons?",
    question:
      "What evidence would prove my current belief wrong?"
  },
  {
    id: "planning_fallacy",
    name: "Planning Fallacy",
    label: "Underestimating time and execution difficulty",
    weight: 1.22,
    signals: [
      "later", "tomorrow", "quick", "enough time", "simple",
      "明天", "以后", "来得及", "很快", "不难", "时间够", "简单"
    ],
    interpretation:
      "The plan may look easier in imagination than it will feel in execution.",
    nudge:
      "Break the plan into the smallest next physical action, then multiply the estimated time by 1.5.",
    question:
      "In similar past tasks, did I usually finish faster or slower than expected?"
  },
  {
    id: "mental_accounting",
    name: "Mental Accounting",
    label: "Money framing / budget labels",
    weight: 1.14,
    signals: [
      "budget", "bonus", "cashback", "points", "extra money", "free",
      "预算", "奖金", "返现", "积分", "这笔钱", "额外的钱", "免费"
    ],
    interpretation:
      "Money may be treated differently because of its label, source, or mental category.",
    nudge:
      "Put the money back into your total budget and compare it with your highest-priority goal.",
    question:
      "Would I make the same decision if this money came from normal income?"
  }
];

function normalizeText(text) {
  return text.toLowerCase();
}

function findMatches(text, signals) {
  const lower = normalizeText(text);
  return signals.filter((signal) => lower.includes(signal.toLowerCase()));
}

function detectDecisionType(text) {
  const lower = normalizeText(text);

  if (["invest", "stock", "crypto", "fund", "股票", "投资", "基金", "市场"].some((x) => lower.includes(x))) {
    return "Investment / financial decision";
  }

  if (["buy", "purchase", "watch", "phone", "car", "买", "购买", "手表", "手机", "车"].some((x) => lower.includes(x))) {
    return "Consumer decision";
  }

  if (["study", "assignment", "exam", "复习", "作业", "考试", "学习"].some((x) => lower.includes(x))) {
    return "Study / productivity decision";
  }

  if (["move", "country", "belongings", "savings", "family", "relationship", "quit", "job", "resign", "搬", "国家", "存款", "家人", "辞职"].some((x) => lower.includes(x))) {
    return "Life / career decision";
  }

  return "General decision";
}

function analyseDecision(text) {
  const results = BIAS_MODELS.map((model) => {
    const evidence = findMatches(text, model.signals);
    const score = Math.min(98, Math.round(evidence.length * 26 * model.weight));

    let level = "Low";
    if (score >= 72) level = "High";
    else if (score >= 38) level = "Medium";

    return {
      ...model,
      evidence,
      score,
      level
    };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const pressure = Math.min(
    100,
    results.reduce((sum, item) => sum + item.score, 0)
  );

  const reflectiveIndex = Math.max(10, 100 - pressure);

  const topBias = results[0];
  const extremeRisk = results.find((item) => item.id === "extreme_risk");
  const highRiskBiasIds = ["extreme_risk", "overconfidence", "loss_aversion", "sunk_cost", "present_bias"];
  const hasHighRiskBias = results.some(
    (item) => highRiskBiasIds.includes(item.id) && item.score >= 38
  );
  const hasMultipleSignals = results.length >= 2;
  const hasStrongSignal = Boolean(topBias && topBias.score >= 64);
  const hasAnyMeaningfulSignal = Boolean(topBias && topBias.score >= 26);
  const isEmptyInput = text.trim().length === 0;

  let recommendation = "Add more context first";
  let tone = "moderate";

  if (isEmptyInput) {
    recommendation = "Add more context first";
    tone = "moderate";
  } else if (extremeRisk && extremeRisk.score >= 38) {
    recommendation = "Do not decide yet";
    tone = "caution";
  } else if (pressure >= 78 || hasStrongSignal) {
    recommendation = "Do not decide yet";
    tone = "caution";
  } else if (pressure >= 42 || hasHighRiskBias || hasMultipleSignals) {
    recommendation = "Delay and compare alternatives";
    tone = "moderate";
  } else if (hasAnyMeaningfulSignal) {
    recommendation = "Proceed with caution";
    tone = "moderate";
  } else {
    recommendation = "Low pressure detected";
    tone = "positive";
  }

  const mainReason = isEmptyInput
    ? "Enter a real decision with context, trade-offs, urgency, cost, and alternatives before relying on the recommendation."
    : topBias
    ? `The strongest signal is ${topBias.name}. This suggests the decision may be influenced by ${topBias.label.toLowerCase()} rather than only objective value.`
    : "No dominant behavioural bias was detected. This does not prove the decision is safe; it only means the current wording contains limited pressure signals.";

  const secondaryReason = isEmptyInput
    ? "The tool is intentionally conservative: without enough information, it will not suggest proceeding."
    : extremeRisk && extremeRisk.score >= 38
    ? "This is a large or hard-to-reverse decision with weak planning signals. It should not be treated as a simple proceed decision."
    : pressure >= 78 || hasStrongSignal
    ? "Decision pressure is high. Acting immediately may increase regret risk. Pause before committing."
    : pressure >= 42 || hasHighRiskBias || hasMultipleSignals
    ? "Several pressure signals or unresolved risks are present. Compare alternatives before acting."
    : hasAnyMeaningfulSignal
    ? "The decision may still be reasonable, but there is at least one behavioural pressure signal. Check the downside before acting."
    : "Decision pressure appears low based on the current wording, but this is not a guarantee. Add more detail if the decision has financial, career, or irreversible consequences.";

  return {
    decisionType: detectDecisionType(text),
    results,
    pressure,
    reflectiveIndex,
    recommendation,
    tone,
    mainReason,
    secondaryReason,
    generatedAt: new Date().toLocaleString()
  };
}

export default function App() {
  const [input, setInput] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("nudgelens-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const liveAnalysis = useMemo(() => analyseDecision(input), [input]);
  const current = savedAnalysis || liveAnalysis;
  const topBias = current.results[0];
  const hasInput = input.trim().length > 0;
  const accentColor =
    current.tone === "caution"
      ? "#d93025"
      : current.tone === "moderate"
      ? "#f29900"
      : "#188038";
  const glowColor =
    current.tone === "caution"
      ? "rgba(217,48,37,.22)"
      : current.tone === "moderate"
      ? "rgba(242,153,0,.24)"
      : "rgba(24,128,56,.22)";

  function runAnalysis() {
    const next = analyseDecision(input);
    setSavedAnalysis(next);

    if (input.trim()) {
      const record = {
        id: Date.now(),
        date: next.generatedAt,
        text: input,
        recommendation: next.recommendation,
        pressure: next.pressure,
        reflectiveIndex: next.reflectiveIndex,
        decisionType: next.decisionType,
        topBias: next.results[0]?.name || "No strong bias"
      };

      const updated = [record, ...history].slice(0, 30);
      setHistory(updated);
      localStorage.setItem("nudgelens-history", JSON.stringify(updated));
    }
  }

  function exportCSV() {
    const rows = [
      ["date", "decision_type", "recommendation", "pressure", "reflective_index", "top_bias", "text"],
      ...history.map((item) => [
        item.date,
        item.decisionType,
        item.recommendation,
        item.pressure,
        item.reflectiveIndex,
        item.topBias,
        item.text.replaceAll("\n", " ")
      ])
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nudgelens-research-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="nl-page" style={styles.page}>
      <style>{`
        @keyframes feedbackReveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes borderGlow {
          0% {
            box-shadow: 0 0 0 rgba(26,115,232,0);
          }
          45% {
            box-shadow: 0 0 36px var(--glow);
          }
          100% {
            box-shadow: 0 8px 30px rgba(60,64,67,.11);
          }
        }

        @keyframes inputBreath {
          0% { box-shadow: 0 1px 6px rgba(32,33,36,.18); }
          50% { box-shadow: 0 8px 28px rgba(26,115,232,.16); }
          100% { box-shadow: 0 1px 6px rgba(32,33,36,.18); }
        }

        .feedback-reveal {
          opacity: 0;
          animation: feedbackReveal 620ms cubic-bezier(.2,.8,.2,1) forwards,
                     borderGlow 1300ms ease-out forwards;
        }

        .delay-1 { animation-delay: 80ms, 80ms; }
        .delay-2 { animation-delay: 220ms, 220ms; }
        .delay-3 { animation-delay: 360ms, 360ms; }
        .delay-4 { animation-delay: 500ms, 500ms; }
        .delay-5 { animation-delay: 650ms, 650ms; }

        @media (max-width: 640px) {
          body {
            overflow-x: hidden;
          }

          .nl-page {
            padding: 18px 14px !important;
            overflow-x: hidden !important;
          }

          .nl-shell {
            width: 100% !important;
            max-width: 430px !important;
            margin: 0 auto !important;
          }

          .nl-title {
            font-size: 30px !important;
            line-height: 1.12 !important;
            letter-spacing: -0.8px !important;
          }

          .nl-description {
            max-width: 340px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            font-size: 14px !important;
            line-height: 1.55 !important;
          }

          .nl-search-area {
            margin: 20px auto 26px !important;
          }

          .nl-search-box {
            min-height: 118px !important;
            border-radius: 28px !important;
            padding: 20px !important;
            font-size: 16px !important;
          }

          .nl-recommendation-card,
          .nl-analysis-card {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 28px !important;
            padding: 22px 18px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }

          .nl-top-row {
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .nl-decision-type {
            max-width: 155px !important;
            text-align: center !important;
            line-height: 1.25 !important;
          }

          .nl-recommendation-text {
            font-size: 30px !important;
            line-height: 1.12 !important;
            text-align: center !important;
            margin-top: 18px !important;
          }

          .nl-reason-text {
            font-size: 15px !important;
            line-height: 1.72 !important;
            text-align: center !important;
          }

          .nl-index-row {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            align-items: stretch !important;
            margin-top: 22px !important;
          }

          .nl-index-box {
            min-width: 0 !important;
            min-height: 92px !important;
            padding: 14px 8px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
            word-break: normal !important;
            overflow-wrap: normal !important;
          }

          .nl-index-box span {
            display: block !important;
            font-size: 13px !important;
            line-height: 1.25 !important;
            color: #3c4043 !important;
          }

          .nl-index-box strong {
            display: block !important;
            margin-top: 5px !important;
            font-size: 16px !important;
            line-height: 1.2 !important;
          }

          .nl-section-title {
            text-align: center !important;
            font-size: 24px !important;
            margin-bottom: 18px !important;
          }

          .nl-analysis-summary {
            text-align: center !important;
            padding: 18px 14px !important;
          }
        }
      `}</style>
      <div className="nl-shell" style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoDot}></span>
            <span style={styles.productName}>NudgeLens</span>
          </div>

          <h1 className="nl-title" style={styles.title}>Decision Reflection Assistant</h1>
          <p className="nl-description" style={styles.description}>
            Describe a decision in English or Chinese, and NudgeLens will identify possible behavioural pressure before you act.
          </p>
        </header>

        <main className="nl-search-area" style={styles.searchArea}>
          <textarea
            className="nl-search-box"
            style={{ ...styles.searchBox, animation: hasInput ? "inputBreath 2.8s ease-in-out infinite" : "none" }}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setSavedAnalysis(null);
            }}
            placeholder="Describe your decision here..."
          />

          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={runAnalysis}>
              Analyse decision
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                setInput("");
                setSavedAnalysis(null);
              }}
            >
              Clear
            </button>
          </div>
        </main>

        {hasInput && (
          <>
        <section
          className="feedback-reveal delay-1 nl-recommendation-card"
          style={{
            ...styles.recommendationCard,
            borderColor: accentColor,
            background: `linear-gradient(135deg, #ffffff 0%, ${glowColor} 100%)`,
            "--glow": glowColor
          }}
        >
          <div className="nl-top-row" style={styles.topRow}>
            <span style={styles.cardLabel}>General decision</span>
            <span className="nl-decision-type" style={styles.decisionType}>{current.decisionType}</span>
          </div>

          <h2
            className="nl-recommendation-text"
            style={{
              ...styles.recommendationText,
              color:
                current.tone === "caution"
                  ? "#d93025"
                  : current.tone === "moderate"
                  ? "#f29900"
                  : "#188038"
            }}
          >
            {current.recommendation}
          </h2>

          <p className="nl-reason-text" style={styles.reasonText}>{current.mainReason}</p>
          <p className="nl-reason-text" style={styles.reasonText}>{current.secondaryReason}</p>

          <div className="nl-index-row" style={styles.indexRow}>
            <div className="feedback-reveal delay-2 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Reflective index</span>
              <strong>{current.reflectiveIndex}</strong>
            </div>
            <div className="feedback-reveal delay-3 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Decision pressure</span>
              <strong>{current.pressure}</strong>
            </div>
            <div className="feedback-reveal delay-4 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Top signal</span>
              <strong>{topBias ? topBias.name : "None"}</strong>
            </div>
          </div>
        </section>

        <section
          className="feedback-reveal delay-5 nl-analysis-card"
          style={{ ...styles.analysisCard, borderColor: accentColor, "--glow": glowColor }}
        >
          <h3 className="nl-section-title" style={styles.sectionTitle}>Analysis</h3>

          {topBias ? (
            <div className="nl-analysis-summary" style={styles.analysisSummary}>
              <strong>{topBias.name}</strong>
              <p>{topBias.interpretation}</p>
              <p>{topBias.nudge}</p>
            </div>
          ) : (
            <p style={styles.mutedText}>
              No strong bias is visible yet. Add more context about price, urgency, social pressure, uncertainty, or alternatives for richer analysis.
            </p>
          )}

          <details style={styles.detailsBox}>
            <summary style={styles.detailsSummary}>Show detailed reasoning</summary>

            {current.results.length === 0 ? (
              <p style={styles.mutedText}>No detailed bias signals detected.</p>
            ) : (
              current.results.map((bias) => (
                <div key={bias.id} style={styles.biasBox}>
                  <div style={styles.biasHeader}>
                    <div>
                      <strong>{bias.name}</strong>
                      <p>{bias.label}</p>
                    </div>
                    <span style={styles.biasScore}>
                      {bias.level} · {bias.score}
                    </span>
                  </div>
                  <p><b>Evidence:</b> {bias.evidence.join(", ")}</p>
                  <p><b>Interpretation:</b> {bias.interpretation}</p>
                  <p><b>Nudge:</b> {bias.nudge}</p>
                  <p><b>Reflection:</b> {bias.question}</p>
                </div>
              ))
            )}
          </details>

          <details style={styles.detailsBox}>
            <summary style={styles.detailsSummary}>Research history and export</summary>

            <button style={styles.secondaryButton} onClick={exportCSV}>
              Export CSV
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                setHistory([]);
                localStorage.removeItem("nudgelens-history");
              }}
            >
              Clear history
            </button>

            {history.length === 0 ? (
              <p style={styles.mutedText}>No saved decisions yet.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} style={styles.historyItem}>
                  <span>{item.date} · {item.decisionType}</span>
                  <p>{item.text}</p>
                  <strong>{item.recommendation} · {item.topBias}</strong>
                </div>
              ))
            )}
          </details>
        </section>
          </>
        )}
      </div>
      <Analytics />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #f8fbff 0%, #ffffff 44%)",
    color: "#202124",
    fontFamily: "Arial, sans-serif",
    padding: "28px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  shell: {
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    paddingTop: "20px",
    paddingBottom: "12px"
  },
  logoRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  logoDot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335)"
  },
  productName: {
    color: "#5f6368",
    fontWeight: 600
  },
  title: {
    fontSize: "42px",
    lineHeight: 1.1,
    fontWeight: 600,
    letterSpacing: "-1.4px",
    margin: 0
  },
  description: {
    color: "#5f6368",
    fontSize: "16px",
    lineHeight: 1.6,
    marginTop: "12px"
  },
  searchArea: {
    maxWidth: "860px",
    margin: "24px auto 22px",
    textAlign: "center"
  },
  searchBox: {
    width: "100%",
    minHeight: "132px",
    border: "1px solid #dadce0",
    borderRadius: "34px",
    padding: "22px 28px",
    fontSize: "17px",
    lineHeight: 1.65,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "0 1px 6px rgba(32,33,36,.18)",
    color: "#202124",
    background: "#ffffff"
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "18px"
  },
  primaryButton: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    padding: "12px 22px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px"
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#1a73e8",
    border: "1px solid #dadce0",
    borderRadius: "999px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "8px",
    marginTop: "8px"
  },
  recommendationCard: {
    border: "1.5px solid #dadce0",
    borderRadius: "30px",
    padding: "26px",
    background: "#ffffff",
    boxShadow: "0 8px 30px rgba(60,64,67,.11)",
    marginBottom: "20px",
    boxSizing: "border-box"
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center"
  },
  cardLabel: {
    color: "#5f6368",
    fontSize: "13px",
    fontWeight: 600
  },
  decisionType: {
    color: "#5f6368",
    background: "#f1f3f4",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px"
  },
  recommendationText: {
    fontSize: "38px",
    lineHeight: 1.1,
    marginTop: "14px",
    marginBottom: "14px",
    letterSpacing: "-1px"
  },
  reasonText: {
    color: "#3c4043",
    fontSize: "16px",
    lineHeight: 1.7,
    margin: "8px 0"
  },
  indexRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "20px"
  },
  indexBox: {
    background: "#f8fafd",
    border: "1.5px solid #e8eaed",
    borderRadius: "22px",
    padding: "16px",
    boxSizing: "border-box",
    textAlign: "center"
  },
  analysisCard: {
    border: "1.5px solid #dadce0",
    borderRadius: "30px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 8px 30px rgba(60,64,67,.11)",
    boxSizing: "border-box"
  },
  sectionTitle: {
    marginTop: 0,
    fontSize: "22px"
  },
  analysisSummary: {
    background: "#f8fafd",
    border: "1px solid #e8eaed",
    borderRadius: "24px",
    padding: "18px",
    lineHeight: 1.7,
    marginBottom: "14px"
  },
  mutedText: {
    color: "#5f6368",
    lineHeight: 1.7
  },
  detailsBox: {
    borderTop: "1px solid #e8eaed",
    paddingTop: "14px",
    marginTop: "14px"
  },
  detailsSummary: {
    cursor: "pointer",
    color: "#1a73e8",
    fontWeight: 600,
    marginBottom: "12px"
  },
  biasBox: {
    border: "1px solid #e8eaed",
    borderRadius: "22px",
    padding: "16px",
    lineHeight: 1.65,
    marginTop: "12px"
  },
  biasHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start"
  },
  biasScore: {
    background: "#e8f0fe",
    color: "#1967d2",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap"
  },
  historyItem: {
    borderTop: "1px solid #e8eaed",
    paddingTop: "12px",
    marginTop: "12px",
    lineHeight: 1.6,
    color: "#3c4043"
  }
};