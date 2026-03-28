export type Confidence = "low" | "medium" | "high";
export type StressLevel = "low" | "medium" | "high";
export type BurnoutRisk = "LOW" | "MODERATE" | "HIGH";
export type SubjectWeight = "low" | "medium" | "high";

export interface Subject {
  id: string;
  name: string;
  confidence: Confidence;
  weight: SubjectWeight;
}

export interface SimulationInputs {
  subjects: Subject[];
  daysLeft: number;
  studyHours: number;
  pastPercentage: number;
  weakestSubject: string;
  sleepHours: number;
  stressLevel: StressLevel;
}

export interface SimulationResult {
  scoreMin: number;
  scoreMax: number;
  currentPath: number;
  burnoutRisk: BurnoutRisk;
  burnoutDays: number;
  effortPercent: number;
  mustDo: string[];
  shouldDo: string[];
  drop: string[];
  summary: string;
  focusScore: number;
  focusRatio: number;
  effectiveHours: number;
  wastedHours: number;
  insights: string[];
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "Mathematics", confidence: "medium", weight: "high" },
  { id: "2", name: "Physics", confidence: "low", weight: "medium" },
  { id: "3", name: "English", confidence: "high", weight: "low" },
];

export function generateResults(inputs: SimulationInputs): SimulationResult {
  const subjects =
    inputs.subjects.length > 0 ? inputs.subjects : DEFAULT_SUBJECTS;
  const { studyHours, stressLevel, pastPercentage, sleepHours, daysLeft } =
    inputs;

  // Weight-aware categorization: high-weight subjects go to mustDo regardless of confidence
  const mustDo = subjects
    .filter((s) => s.confidence === "high" || s.weight === "high")
    .map((s) => s.name);
  const shouldDo = subjects
    .filter(
      (s) =>
        (s.confidence === "medium" || s.weight === "medium") &&
        !mustDo.includes(s.name),
    )
    .map((s) => s.name);
  const drop = subjects
    .filter((s) => !mustDo.includes(s.name) && !shouldDo.includes(s.name))
    .map((s) => s.name);

  if (mustDo.length === 0) mustDo.push("Core Concepts");
  if (shouldDo.length === 0) shouldDo.push("Secondary Topics");
  if (drop.length === 0) drop.push("Optional Reading");

  let scoreMin: number;
  let scoreMax: number;
  let burnoutRisk: BurnoutRisk;
  let burnoutDays: number;
  let effortPercent: number;
  let currentPath: number;

  const highConfidenceRatio =
    subjects.filter((s) => s.confidence === "high").length /
    Math.max(subjects.length, 1);

  if (studyHours < 3 || stressLevel === "high") {
    if (pastPercentage > 75 && studyHours >= 3) {
      scoreMin = 55;
      scoreMax = 65;
      burnoutRisk = "MODERATE";
      burnoutDays = 7;
      effortPercent = 30;
    } else {
      scoreMin = 45;
      scoreMax = 55;
      burnoutRisk = "HIGH";
      burnoutDays = 3;
      effortPercent = 20;
    }
  } else if (studyHours <= 5 && stressLevel === "medium") {
    scoreMin = 62;
    scoreMax = 72;
    burnoutRisk = "MODERATE";
    burnoutDays = 10;
    effortPercent = 50;
  } else if (studyHours > 5 && stressLevel === "low" && pastPercentage >= 75) {
    scoreMin = 82;
    scoreMax = 90;
    burnoutRisk = "LOW";
    burnoutDays = 30;
    effortPercent = 90;
  } else if (studyHours > 5 && highConfidenceRatio >= 0.5) {
    scoreMin = 78;
    scoreMax = 84;
    burnoutRisk = "LOW";
    burnoutDays = 20;
    effortPercent = 75;
  } else {
    scoreMin = 65;
    scoreMax = 75;
    burnoutRisk = "MODERATE";
    burnoutDays = 14;
    effortPercent = 55;
  }

  const sleepPenalty = sleepHours < 6 ? 8 : sleepHours < 7 ? 3 : 0;
  scoreMin = Math.max(30, scoreMin - sleepPenalty);
  scoreMax = Math.max(35, scoreMax - sleepPenalty);
  currentPath = Math.max(
    25,
    Math.round(
      pastPercentage * 0.85 -
        (stressLevel === "high" ? 12 : stressLevel === "medium" ? 5 : 0) -
        (studyHours < 3 ? 10 : 0),
    ),
  );

  const daysMultiplier = daysLeft < 7 ? 0.85 : daysLeft < 14 ? 0.93 : 1;
  scoreMin = Math.round(scoreMin * daysMultiplier);
  scoreMax = Math.round(scoreMax * daysMultiplier);

  // Focus ratio computation
  let focusRatio: number;
  if (sleepHours >= 8 && stressLevel === "low") {
    focusRatio = 0.85;
  } else if (sleepHours >= 7 && stressLevel === "medium") {
    focusRatio = 0.7;
  } else if (sleepHours >= 6 && stressLevel === "medium") {
    focusRatio = 0.6;
  } else {
    focusRatio = 0.45;
  }

  const focusScore = Math.min(
    100,
    Math.max(0, Math.round(focusRatio * 100 * (studyHours / 10))),
  );
  const effectiveHours = Math.round(studyHours * focusRatio * 10) / 10;
  const wastedHours = Math.round((studyHours - effectiveHours) * 10) / 10;

  // Insights generation
  const insights: string[] = [];
  if (sleepHours < 6) insights.push("Sleep is your biggest limiting factor.");
  if (studyHours < 3) insights.push("Your current effort is not competitive.");
  if (drop.length > mustDo.length)
    insights.push("You are overinvesting in low-return topics.");
  if (effortPercent < 40)
    insights.push("This preparation level does not qualify as serious.");
  if (burnoutRisk === "HIGH")
    insights.push("Burnout will arrive before your exam does.");
  if (focusRatio < 0.6) insights.push("Most of your study time is noise.");

  // Ensure at least 2 insights
  if (insights.length === 0) {
    insights.push("Maintain current trajectory without complacency.");
    insights.push("High-weight subjects demand consistent daily coverage.");
  } else if (insights.length === 1) {
    insights.push("High-weight subjects demand consistent daily coverage.");
  }

  const summaries: Record<BurnoutRisk, string> = {
    HIGH: `Your current trajectory terminates at ${currentPath}%. Study hours are insufficient, stress indicators are elevated, and preparation depth is shallow. Without immediate restructuring, exam performance will regress from baseline. The system recommends halting low-value tasks entirely.`,
    MODERATE: `Projection lands at ${scoreMin}–${scoreMax}% under current conditions. Mid-tier effort with inconsistent confidence distribution creates fragile preparation. You are consuming energy without proportional output gain. Reallocate time from ${drop[0] || "low-priority topics"} immediately.`,
    LOW: `System projects ${scoreMin}–${scoreMax}%. Your effort-to-confidence ratio is above average. Sleep and stress indicators are acceptable. Primary risk factor is complacency — maintain current intensity through exam window. ${mustDo[0] || "Core subjects"} remain your highest-leverage investment.`,
  };

  return {
    scoreMin,
    scoreMax,
    currentPath,
    burnoutRisk,
    burnoutDays,
    effortPercent,
    mustDo,
    shouldDo,
    drop,
    summary: summaries[burnoutRisk],
    focusScore,
    focusRatio,
    effectiveHours,
    wastedHours,
    insights,
  };
}
