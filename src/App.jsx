function analyseDecision(text) {
  const cleaned = normalize(text.trim());
  const isShort = cleaned.length < 25;

  const matched = SIGNALS.map(signal => {
    const hits = signal.words.filter(word => cleaned.includes(word.toLowerCase()));
    return {
      ...signal,
      hits,
      score: hits.length * signal.weight
    };
  }).filter(signal => signal.hits.length > 0);

  let pressure = matched.reduce((sum, signal) => sum + signal.score, 0);

  /* =========================
     🧠 结构级判断（新增核心）
  ========================== */

  const hasBut =
    cleaned.includes("but") ||
    cleaned.includes("但是") ||
    cleaned.includes("但");

  const noCondition =
    cleaned.includes("without") ||
    cleaned.includes("没有");

  const hasUrgency =
    cleaned.includes("tomorrow") ||
    cleaned.includes("now") ||
    cleaned.includes("马上");

  const emotional =
    ["afraid", "scared", "担心", "害怕"].some(w => cleaned.includes(w));

  /* ===== 核心：组合风险 ===== */

  if (hasBut) pressure += 15;

  if (noCondition) pressure += 18;

  if (hasUrgency && noCondition) pressure += 25;

  if (emotional && noCondition) pressure += 20;

  if (matched.length >= 3) pressure += 12;

  if (matched.length >= 5) pressure += 18;

  if (isShort) pressure += 15;

  pressure = Math.max(0, Math.min(100, pressure));

  /* =========================
     🎯 分类升级
  ========================== */

  const category =
    pressure >= 80 ? "risky" :
    pressure >= 55 ? "uncertain" :
    pressure >= 30 ? "clear" :
    "calm";

  const scenario = detectScenario(text);
  const topSignal = matched.sort((a, b) => b.score - a.score)[0];

  /* =========================
     🧠 顾问级输出（更像真人）
  ========================== */

  let summary;
  let advisorView;
  let feasibility;
  let nextStep;
  let confidence;

  if (pressure >= 80) {
    summary = "The decision structure is unstable.";
    feasibility = "Low";
    advisorView =
      "The problem is not the goal. The problem is that the conditions required to support the decision are not currently present. Acting now introduces avoidable failure risk.";
    nextStep =
      "Do not execute. Stabilise one variable first: information, timing, or fallback.";
    confidence = "Low reliability";
  }

  else if (pressure >= 55) {
    summary = "The decision is directionally valid but structurally weak.";
    feasibility = "Medium-low";
    advisorView =
      "The idea may be correct, but execution risk is high because dependencies are unresolved or assumptions are untested.";
    nextStep =
      topSignal?.action || "Strengthen one weak assumption before acting.";
    confidence = "Moderate uncertainty";
  }

  else if (pressure >= 30) {
    summary = "The decision is mostly viable.";
    feasibility = "Medium-high";
    advisorView =
      "No major structural flaw detected. However, the decision could benefit from small validation steps.";
    nextStep =
      "Test the decision with a reversible small action.";
    confidence = "Reasonable stability";
  }

  else {
    summary = "Low pressure context.";
    feasibility = "High";
    advisorView =
      "The current input shows no major behavioural distortion. More detail would improve accuracy.";
    nextStep =
      "Optional: validate with one external check.";
    confidence = "High stability";
  }

  return {
    summary,
    advisorView,
    feasibility,
    nextStep,
    pressure,
    confidence,
    category,
    scenario,
    topSignal: topSignal?.label || "None",
    matched
  };
}