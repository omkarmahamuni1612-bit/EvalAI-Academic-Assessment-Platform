// Verification test for proportional difficulty-aware evaluation.
// Run with: node frontend/test-evaluation.mjs
import { evaluateSubmission, difficultyConfig } from "./src/data/workflowData.js";

let failures = 0;
const results = [];

function check(name, condition, detail = "") {
  if (condition) {
    results.push(`PASS  ${name}`);
  } else {
    failures += 1;
    results.push(`FAIL  ${name} ${detail}`);
  }
}

// Build a submission whose evaluation carries the given total marks,
// rubric maxes and per-criterion scores. Scores are expressed as fractions
// of each criterion max so the same answer quality is reproduced at any
// totalMarks scale.
function makeSubmission(totalMarks, rubric) {
  const rubricSum = rubric.reduce((sum, item) => sum + item.score, 0);
  return {
    id: "test-sub",
    student: "Test Student",
    roll: "T-001",
    status: "Submitted",
    evaluation: {
      score: rubricSum,
      totalMarks,
      grade: "Grade B",
      confidence: "90%",
      semanticRelevance: "80%",
      evaluationDifficulty: "moderate",
      answerText: "Test answer text",
      referenceAnswer: "Reference answer",
      rubric: rubric.map((item) => ({
        name: item.name,
        score: item.score,
        max: item.max,
        confidence: "Medium",
        reason: "Test reason",
      })),
      feedback: { strengths: "S", improvements: "I", missing: "M" },
    },
  };
}

// Proportional rubric layouts for 20 / 40 / 60 marks.
// The "Sneha-quality" answer keeps the same relative gaps at every scale:
// Concept 67%, Accuracy 67%, Reasoning 80%, Presentation 100%.
const rubric20 = [
  { name: "Concept", score: 4, max: 6 },
  { name: "Accuracy", score: 4, max: 6 },
  { name: "Reasoning", score: 4, max: 5 },
  { name: "Presentation", score: 3, max: 3 },
];
const rubric40 = [
  { name: "Concept", score: 8, max: 12 },
  { name: "Accuracy", score: 8, max: 12 },
  { name: "Reasoning", score: 8, max: 10 },
  { name: "Presentation", score: 6, max: 6 },
];
const rubric60 = [
  { name: "Concept", score: 12, max: 18 },
  { name: "Accuracy", score: 12, max: 18 },
  { name: "Reasoning", score: 12, max: 15 },
  { name: "Presentation", score: 9, max: 9 },
];

const scales = [
  { totalMarks: 20, rubric: rubric20 },
  { totalMarks: 40, rubric: rubric40 },
  { totalMarks: 60, rubric: rubric60 },
];

// ---- 1. Difficulty ordering with meaningful weaknesses ----
for (const { totalMarks, rubric } of scales) {
  const sub = makeSubmission(totalMarks, rubric);
  const easy = evaluateSubmission(sub, "easy");
  const moderate = evaluateSubmission(sub, "moderate");
  const hard = evaluateSubmission(sub, "hard");

  const name = `order ${totalMarks}m`;
  check(`${name}: easy >= moderate`, easy.score >= moderate.score, `(${easy.score} < ${moderate.score})`);
  check(`${name}: moderate >= hard`, moderate.score >= hard.score, `(${moderate.score} < ${hard.score})`);
  check(`${name}: easy > hard (meaningful gap)`, easy.score > hard.score, `(${easy.score} == ${hard.score})`);
}

// ---- 2. Bounds: 0 <= score <= totalMarks ----
for (const { totalMarks, rubric } of scales) {
  for (const difficulty of ["easy", "moderate", "hard"]) {
    const { score } = evaluateSubmission(makeSubmission(totalMarks, rubric), difficulty);
    check(`bounds ${totalMarks}m/${difficulty}: 0 <= score <= ${totalMarks}`, score >= 0 && score <= totalMarks, `(score=${score})`);
  }
}

// ---- 3. Rubric criterion scores are clamped to [0, max] ----
for (const { totalMarks, rubric } of scales) {
  for (const difficulty of ["easy", "moderate", "hard"]) {
    const ev = evaluateSubmission(makeSubmission(totalMarks, rubric), difficulty);
    const allClamped = ev.rubric.every((item) => item.score >= 0 && item.score <= item.max);
    check(`rubric clamps ${totalMarks}m/${difficulty}`, allClamped);
  }
}

// ---- 4. Score equals rubric sum, and rubric maxes sum to totalMarks ----
for (const { totalMarks, rubric } of scales) {
  const ev = evaluateSubmission(makeSubmission(totalMarks, rubric), "moderate");
  const maxSum = ev.rubric.reduce((sum, item) => sum + item.max, 0);
  const scoreSum = ev.rubric.reduce((sum, item) => sum + item.score, 0);
  check(`rubric maxes sum ${totalMarks}m`, maxSum === totalMarks, `(${maxSum} != ${totalMarks})`);
  check(`score equals rubric sum ${totalMarks}m`, ev.score === Math.round(scoreSum), `(${ev.score} != ${Math.round(scoreSum)})`);
}

// ---- 5. Perfect answer: difficulty must not change a perfect score ----
for (const { totalMarks } of scales) {
  const perfect = (name, max) => ({ name, score: max, max });
  const perfectRubric =
    totalMarks === 20
      ? [perfect("A", 6), perfect("B", 6), perfect("C", 5), perfect("D", 3)]
      : totalMarks === 40
        ? [perfect("A", 12), perfect("B", 12), perfect("C", 10), perfect("D", 6)]
        : [perfect("A", 18), perfect("B", 18), perfect("C", 15), perfect("D", 9)];
  for (const difficulty of ["easy", "moderate", "hard"]) {
    const { score } = evaluateSubmission(makeSubmission(totalMarks, perfectRubric), difficulty);
    check(`perfect ${totalMarks}m/${difficulty} keeps full marks`, score === totalMarks, `(score=${score})`);
  }
}

// ---- 6. Empty-bottom answer: all-zero rubric stays at 0 ----
for (const { totalMarks } of scales) {
  const zeroRubric =
    totalMarks === 20
      ? [{ name: "A", score: 0, max: 6 }, { name: "B", score: 0, max: 6 }, { name: "C", score: 0, max: 5 }, { name: "D", score: 0, max: 3 }]
      : totalMarks === 40
        ? [{ name: "A", score: 0, max: 12 }, { name: "B", score: 0, max: 12 }, { name: "C", score: 0, max: 10 }, { name: "D", score: 0, max: 6 }]
        : [{ name: "A", score: 0, max: 18 }, { name: "B", score: 0, max: 18 }, { name: "C", score: 0, max: 15 }, { name: "D", score: 0, max: 9 }];
  for (const difficulty of ["easy", "moderate", "hard"]) {
    const { score } = evaluateSubmission(makeSubmission(totalMarks, zeroRubric), difficulty);
    check(`zero ${totalMarks}m/${difficulty} stays 0`, score === 0, `(score=${score})`);
  }
}

// ---- 7. Detail printout for the meaningful-weakness answer ----
console.log("=== Difficulty scaling with meaningful weaknesses ===");
for (const { totalMarks, rubric } of scales) {
  const line = [totalMarks, ...["easy", "moderate", "hard"].map((d) => {
    const ev = evaluateSubmission(makeSubmission(totalMarks, rubric), d);
    return `${ev.score}/${ev.totalMarks} (${ev.grade})`;
  })];
  console.log(`  ${line[0]} marks -> Easy: ${line[1]} | Moderate: ${line[2]} | Hard: ${line[3]}`);
}

console.log("\n=== difficultyConfig ===");
for (const [key, cfg] of Object.entries(difficultyConfig)) {
  console.log(`  ${key}: toleranceFactor=${cfg.toleranceFactor}`);
}

// ---- 8. Raw per-criterion scores for one 20-mark example ----
const raw = evaluateSubmission(makeSubmission(20, rubric20), "hard");
console.log("\n=== 20-mark hard per-criterion (raw) ===");
raw.rubric.forEach((item) => console.log(`  ${item.name}: ${item.score} / ${item.max}`));

console.log("\n" + results.join("\n"));
console.log(`\n${failures === 0 ? "ALL TESTS PASSED ✅" : `${failures} TEST(S) FAILED ❌`}`);
process.exit(failures === 0 ? 0 : 1);