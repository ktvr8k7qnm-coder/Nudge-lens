function analyzeDecision(text) {
  const t = normalize(text);

  /* =======================
     🧠 STATE LAYER（更细）
  ======================= */
  let state = {
    energy: 0,
    pressure: 0,
    avoidance: 0,
    desire: 0,
    clarity: 0
  };

  if (t.includes("tired")) state.energy -= 1;
  if (t.includes("stress")) state.pressure += 1;
  if (t.includes("dont want")) state.avoidance += 1;
  if (t.includes("want")) state.desire += 1;
  if (t.includes("think") || t.includes("consider")) state.clarity += 1;

  /* =======================
     🧠 PATTERN（升级）
  ======================= */
  let pattern = "neutral";

  if (state.avoidance && state.energy < 0) pattern = "fatigue avoidance";
  else if (state.pressure && state.desire) pattern = "pressure-driven desire";
  else if (state.pressure && state.avoidance) pattern = "stress escape";
  else if (state.desire && !state.clarity) pattern = "impulse tendency";

  /* =======================
     🔍 ORIGINAL SIGNALS
  ======================= */
  const intent = detectIntent(t);
  const drivers = detectDrivers(t);
  const constraints = detectConstraints(t);
  const bias = detectBias(t);
  const tension = buildTension(drivers, constraints);
  const scenarioBase = simulate(intent);
  const secondBase = secondOrder(intent);

  /* =======================
     📊 SCORE（更稳定）
  ======================= */
  let score =
    state.pressure * 1.3 +
    state.avoidance * 1.2 +
    state.desire * 0.7 +
    bias.reduce((a, b) => a + b.w, 0) +
    tension.length * 0.6 -
    constraints.length * 0.4;

  const probability = sigmoid(score - 1.4);
  const pressure = Math.min(100, probability * 100);

  /* =======================
     🧠 HEADLINE（更有“人味”）
  ======================= */
  let headline = generateHeadline(pressure, drivers, tension, bias);

  const nuanceAddOn = pick([
    " — something subtle is influencing it",
    " — not just a straightforward choice",
    " — worth a second look",
    ""
  ]);

  headline += nuanceAddOn;

  /* =======================
     💬 QUICK（像人）
  ======================= */
  const quick = pick([
    "This feels slightly driven by how things feel right now.",
    "You might be reacting to the moment more than the situation.",
    "There’s a bit of emotional or situational pull here.",
    "It doesn’t look like a fully neutral decision."
  ]);

  /* =======================
     🧠 DEEP（专业 + 有趣）
  ======================= */
  const deep = `
If we slow this down a bit, this decision isn’t just about the situation itself — it’s also about your current state.

Right now, it looks like a "${pattern}" pattern. That usually means the decision is being shaped by temporary conditions (like energy, stress, or mood), not just long-term preference.

${tension.length ? `There’s a quiet tension between ${tension.join(", ")}, which suggests you're balancing competing needs.` : ""}

From a behavioural perspective, signals like (${bias.map(b => b.id).join(", ") || "none strong"}) suggest this isn’t purely objective thinking.

What’s interesting is that in real life, people often feel very sure in moments like this — but later realise the decision was more about how they felt than what they actually wanted.
`;

  /* =======================
     🎬 SCENARIO（更像人在讲）
  ======================= */
  const scenario = `
If you act right now → ${scenarioBase.act}  
But more importantly, you’re reinforcing this *style* of deciding.

If you wait a bit → ${scenarioBase.wait}  
And interestingly, the decision itself might start to feel different.

So this isn’t just action vs delay — it’s reacting vs letting your state reset.
`;

  /* =======================
     🔁 SECOND ORDER（更深一层）
  ======================= */
  const second = `
Over time → ${secondBase}

But the deeper layer is this: repeated decisions under similar conditions slowly train your default behaviour.

So the long-term effect isn’t just *what you choose*, but *how you tend to choose under pressure*.
`;

  /* =======================
     🎯 ACTION（像真人建议）
  ======================= */
  const action = pick([
    "You don’t have to decide this right now.",
    "Try revisiting this when things feel a bit more neutral.",
    "If it still feels right later, that’s a stronger signal.",
    "Give yourself a small pause — it often changes clarity more than you expect.",
    "Sometimes the best move is just waiting for your state to reset slightly."
  ]);

  return {
    headline,
    quick,
    deep,
    scenario,
    second,
    action
  };
}