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
  const highRiskBiasIds = ["extreme_risk", "overconfidence", "loss_aversion", "sunk_cost"];
  const hasHighRiskBias = results.some(
    (item) => highRiskBiasIds.includes(item.id) && item.score >= 38
  );

  let recommendation = "Reasonable to proceed";
  let tone = "positive";

  if (extremeRisk && extremeRisk.score >= 38) {
    recommendation = "Do not decide yet";
    tone = "caution";
  } else if (pressure >= 72 || (topBias && topBias.score >= 72)) {
    recommendation = "Do not decide yet";
    tone = "caution";
  } else if (pressure >= 38 || hasHighRiskBias || results.length >= 2) {
    recommendation = "Delay and compare alternatives";
    tone = "moderate";
  }

  const mainReason = topBias
    ? `The strongest signal is ${topBias.name}. This suggests the decision may be influenced by ${topBias.label.toLowerCase()} rather than only objective value.`
    : "No dominant behavioural bias was detected. The decision language appears relatively balanced.";

  const secondaryReason =
    extremeRisk && extremeRisk.score >= 38
      ? "This is a large or hard-to-reverse decision with weak planning signals. It should not be treated as a simple proceed decision."
      : pressure >= 72
      ? "Decision pressure is high. Acting immediately may increase regret risk."
      : pressure >= 38 || hasHighRiskBias || results.length >= 2
      ? "Some pressure signals are present. A short delay and comparison with alternatives may improve clarity."
      : "Decision pressure is low. The current framing does not show strong urgency, fear, or social-pressure signals.";

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
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoDot}></span>
            <span style={styles.productName}>NudgeLens</span>
          </div>

          <h1 style={styles.title}>Decision Reflection Assistant</h1>
          <p style={styles.description}>
            Describe a decision in English or Chinese, and NudgeLens will identify possible behavioural pressure before you act.
          </p>
        </header>

        <main style={styles.searchArea}>
          <textarea
            style={styles.searchBox}
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

        <section style={styles.recommendationCard}>
          <div style={styles.topRow}>
            <span style={styles.cardLabel}>Primary recommendation</span>
            <span style={styles.decisionType}>{current.decisionType}</span>
          </div>

          <h2
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

          <p style={styles.reasonText}>{current.mainReason}</p>
          <p style={styles.reasonText}>{current.secondaryReason}</p>

          <div style={styles.indexRow}>
            <div style={styles.indexBox}>
              <span>Reflective index</span>
              <strong>{current.reflectiveIndex}</strong>
            </div>
            <div style={styles.indexBox}>
              <span>Decision pressure</span>
              <strong>{current.pressure}</strong>
            </div>
            <div style={styles.indexBox}>
              <span>Top signal</span>
              <strong>{topBias ? topBias.name : "None"}</strong>
            </div>
          </div>
        </section>

        <section style={styles.analysisCard}>
          <h3 style={styles.sectionTitle}>Analysis</h3>

          {topBias ? (
            <div style={styles.analysisSummary}>
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
      </div>
      <Analytics />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#202124",
    fontFamily: "Arial, sans-serif",
    padding: "28px"
  },
  shell: {
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
    border: "1px solid #dadce0",
    borderRadius: "30px",
    padding: "26px",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(60,64,67,.08), 0 2px 8px rgba(60,64,67,.08)",
    marginBottom: "20px"
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
    border: "1px solid #e8eaed",
    borderRadius: "22px",
    padding: "16px"
  },
  analysisCard: {
    border: "1px solid #dadce0",
    borderRadius: "30px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(60,64,67,.08), 0 2px 8px rgba(60,64,67,.08)"
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