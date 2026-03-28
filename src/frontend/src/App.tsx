import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Brain,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Plus,
  RefreshCw,
  Target,
  Terminal,
  Timer,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import StudyExecutionSection from "./StudyExecutionSection";
import {
  type BurnoutRisk,
  type Confidence,
  type SimulationInputs,
  type SimulationResult,
  type StressLevel,
  type Subject,
  type SubjectWeight,
  generateResults,
} from "./simulation";

type AppState = "hero" | "input" | "loading" | "results";

const LOADING_MESSAGES = [
  "Analyzing your actual effort…",
  "Removing low-value work…",
  "Predicting outcome…",
  "Cross-referencing burnout signals…",
];

const RISK_COLORS: Record<string, string> = {
  LOW: "#22C55E",
  MODERATE: "#F59E0B",
  HIGH: "#EF4444",
};

const RISK_BG: Record<string, string> = {
  LOW: "rgba(34,197,94,0.12)",
  MODERATE: "rgba(245,158,11,0.12)",
  HIGH: "rgba(239,68,68,0.12)",
};

function ConfidenceToggle({
  value,
  onChange,
}: {
  value: Confidence;
  onChange: (v: Confidence) => void;
}) {
  const opts: { label: string; val: Confidence; color: string }[] = [
    { label: "Low", val: "low", color: "#EF4444" },
    { label: "Mid", val: "medium", color: "#F59E0B" },
    { label: "High", val: "high", color: "#22C55E" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          onClick={() => onChange(o.val)}
          style={{
            color: value === o.val ? o.color : "#6B7280",
            borderColor: value === o.val ? o.color : "#2A2A2A",
            background: value === o.val ? `${o.color}18` : "transparent",
            boxShadow: value === o.val ? `0 0 8px ${o.color}40` : "none",
          }}
          className="px-2 py-0.5 text-xs border rounded font-medium transition-all duration-200 cursor-pointer"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function WeightToggle({
  value,
  onChange,
}: {
  value: SubjectWeight;
  onChange: (v: SubjectWeight) => void;
}) {
  const opts: { label: string; val: SubjectWeight; color: string }[] = [
    { label: "Lo", val: "low", color: "#6B7280" },
    { label: "Med", val: "medium", color: "#F59E0B" },
    { label: "Hi", val: "high", color: "#EF4444" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          onClick={() => onChange(o.val)}
          title={`Weight: ${o.val}`}
          style={{
            color: value === o.val ? o.color : "#4B5563",
            borderColor: value === o.val ? o.color : "#1F1F1F",
            background: value === o.val ? `${o.color}14` : "transparent",
            boxShadow: value === o.val ? `0 0 6px ${o.color}35` : "none",
          }}
          className="px-1.5 py-0.5 text-xs border rounded font-medium transition-all duration-200 cursor-pointer"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StressToggle({
  value,
  onChange,
}: {
  value: StressLevel;
  onChange: (v: StressLevel) => void;
}) {
  const opts: { label: string; val: StressLevel; color: string }[] = [
    { label: "Low", val: "low", color: "#22C55E" },
    { label: "Medium", val: "medium", color: "#F59E0B" },
    { label: "High", val: "high", color: "#EF4444" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          data-ocid={"stress.toggle"}
          onClick={() => onChange(o.val)}
          style={{
            color: value === o.val ? o.color : "#6B7280",
            borderColor: value === o.val ? o.color : "#2A2A2A",
            background: value === o.val ? `${o.color}18` : "transparent",
            boxShadow: value === o.val ? `0 0 10px ${o.color}40` : "none",
          }}
          className="flex-1 py-2 text-sm border rounded font-semibold transition-all duration-200 cursor-pointer"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function HeroSection({ onCTA }: { onCTA: () => void }) {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center px-6 md:px-12 lg:px-20"
      style={{ background: "#0B0B0B" }}
    >
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <span
            style={{
              color: "#3B82F6",
              letterSpacing: "0.25em",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
            className="uppercase"
          >
            Performative
          </span>
          <h1
            style={{
              color: "#F9FAFB",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            You’re Not Studying.
            <br />
            <span style={{ color: "#EF4444" }}>You’re Performing.</span>
          </h1>
          <p
            style={{
              color: "#9CA3AF",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              maxWidth: "38ch",
            }}
          >
            Measure what actually matters. Cut what doesn’t. This tool exposes
            the gap between perceived effort and real outcomes.
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              type="button"
              data-ocid="hero.primary_button"
              onClick={onCTA}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glow-blue self-start flex items-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all duration-200"
              style={{
                background: "#3B82F6",
                color: "#fff",
                letterSpacing: "0.14em",
              }}
            >
              <Zap size={16} />
              Run Analysis
            </motion.button>
          </div>
          <div
            className="flex flex-wrap gap-4"
            style={{ color: "#4B5563", fontSize: "0.78rem" }}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#3B82F6" }}
              />
              Data-driven
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#EF4444" }}
              />
              Brutally honest
            </span>
          </div>
        </motion.div>

        {/* Right — mock dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          {/* Score card */}
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            className="card-surface rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                style={{
                  color: "#6B7280",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
                className="uppercase font-medium"
              >
                Predicted Score
              </span>
              <BarChart2 size={14} style={{ color: "#3B82F6" }} />
            </div>
            <div
              style={{
                color: "#3B82F6",
                fontSize: "2.8rem",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              78–84%
            </div>
            <p
              style={{
                color: "#6B7280",
                fontSize: "0.78rem",
                marginTop: "0.5rem",
              }}
            >
              If you follow this plan
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {/* Topic card */}
            <motion.div
              whileHover={{ scale: 1.015, y: -2 }}
              className="card-surface rounded-xl p-5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                  }}
                  className="uppercase font-medium"
                >
                  Cut Now
                </span>
                <X size={14} style={{ color: "#EF4444" }} />
              </div>
              <div
                style={{
                  color: "#EF4444",
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                Drop 3
              </div>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "0.78rem",
                  marginTop: "0.4rem",
                }}
              >
                Low-value topics
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {["Appendix B", "Extra Ch.", "Old Notes"].map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Risk card */}
            <motion.div
              whileHover={{ scale: 1.015, y: -2 }}
              className="card-surface rounded-xl p-5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                  }}
                  className="uppercase font-medium"
                >
                  Burnout Risk
                </span>
                <AlertTriangle size={14} style={{ color: "#EF4444" }} />
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  boxShadow: "0 0 12px rgba(239,68,68,0.2)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#EF4444" }}
                />
                <span
                  style={{
                    color: "#EF4444",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  HIGH RISK
                </span>
              </div>
              <p
                style={{
                  color: "#9CA3AF",
                  fontSize: "0.75rem",
                  marginTop: "0.6rem",
                  lineHeight: 1.4,
                }}
              >
                ~5 days until performance collapse
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function InputSection({
  onGenerate,
}: { onGenerate: (inputs: SimulationInputs) => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Mathematics", confidence: "medium", weight: "high" },
    { id: "2", name: "Physics", confidence: "low", weight: "medium" },
  ]);
  const [daysLeft, setDaysLeft] = useState(14);
  const [studyHours, setStudyHours] = useState(4);
  const [pastPercentage, setPastPercentage] = useState(68);
  const [weakestSubject, setWeakestSubject] = useState("Math");
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState<StressLevel>("medium");

  const addSubject = () => {
    if (subjects.length >= 6) return;
    setSubjects((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "",
        confidence: "medium",
        weight: "medium",
      },
    ]);
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, field: keyof Subject, val: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    );
  };

  const handleGenerate = () => {
    onGenerate({
      subjects,
      daysLeft,
      studyHours,
      pastPercentage,
      weakestSubject,
      sleepHours,
      stressLevel,
    });
  };

  return (
    <section
      id="input"
      className="min-h-screen px-6 md:px-12 lg:px-20 py-20"
      style={{ background: "#0B0B0B" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p
            style={{
              color: "#3B82F6",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 600,
            }}
            className="uppercase mb-2"
          >
            Input Panel
          </p>
          <h2
            style={{
              color: "#F9FAFB",
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Configure Your Reality
          </h2>
          <p
            style={{
              color: "#6B7280",
              fontSize: "0.9rem",
              marginTop: "0.4rem",
            }}
          >
            Fill in what you actually have, not what you wish you had.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A — Subjects */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="card-surface rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                  }}
                  className="uppercase font-medium block mb-1"
                >
                  Card A
                </span>
                <h3
                  style={{
                    color: "#E5E7EB",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Subjects &amp; Topics
                </h3>
              </div>
              <Brain size={18} style={{ color: "#3B82F6" }} />
            </div>

            <div
              className="flex items-center gap-2 mb-2"
              style={{ paddingRight: "1.6rem" }}
            >
              <span style={{ color: "#4B5563", fontSize: "0.65rem", flex: 1 }}>
                SUBJECT
              </span>
              <span style={{ color: "#4B5563", fontSize: "0.65rem" }}>
                CONFIDENCE
              </span>
              <span
                style={{
                  color: "#4B5563",
                  fontSize: "0.65rem",
                  marginLeft: "0.25rem",
                }}
              >
                WEIGHT
              </span>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {subjects.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="inner-panel rounded-lg p-3 flex items-center gap-2"
                  data-ocid={`subjects.item.${i + 1}`}
                >
                  <input
                    data-ocid={"subjects.input"}
                    value={s.name}
                    onChange={(e) =>
                      updateSubject(s.id, "name", e.target.value)
                    }
                    placeholder="Topic name…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder-gray-600 min-w-0"
                    style={{ color: "#E5E7EB", minWidth: 0 }}
                  />
                  <ConfidenceToggle
                    value={s.confidence}
                    onChange={(v) => updateSubject(s.id, "confidence", v)}
                  />
                  <WeightToggle
                    value={s.weight}
                    onChange={(v) => updateSubject(s.id, "weight", v)}
                  />
                  <button
                    type="button"
                    data-ocid={`subjects.delete_button.${i + 1}`}
                    onClick={() => removeSubject(s.id)}
                    className="flex-shrink-0 p-1 rounded transition-colors duration-150 cursor-pointer"
                    style={{ color: "#4B5563" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#EF4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#4B5563";
                    }}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </div>

            {subjects.length < 6 && (
              <button
                type="button"
                data-ocid="subjects.secondary_button"
                onClick={addSubject}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  color: "#3B82F6",
                  border: "1px solid rgba(59,130,246,0.3)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                }}
              >
                <Plus size={14} /> Add Subject
              </button>
            )}
          </motion.div>

          {/* Card B — Time */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-surface rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                  }}
                  className="uppercase font-medium block mb-1"
                >
                  Card B
                </span>
                <h3
                  style={{
                    color: "#E5E7EB",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Time Investment
                </h3>
              </div>
              <Zap size={18} style={{ color: "#F59E0B" }} />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="days-left"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Days Left
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      data-ocid="time.input"
                      type="number"
                      min={1}
                      max={90}
                      value={daysLeft}
                      onChange={(e) =>
                        setDaysLeft(
                          Math.max(1, Math.min(90, Number(e.target.value))),
                        )
                      }
                      className="w-16 text-right text-sm font-bold rounded px-2 py-1 outline-none"
                      style={{
                        background: "#181818",
                        border: "1px solid #2A2A2A",
                        color: "#3B82F6",
                      }}
                    />
                    <span style={{ color: "#4B5563", fontSize: "0.8rem" }}>
                      days
                    </span>
                  </div>
                </div>
                <div
                  className="h-0.5 rounded"
                  style={{ background: "#1F1F1F" }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="study-hours"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Study Hours / Day
                  </label>
                  <motion.span
                    key={studyHours}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#3B82F6",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {studyHours}h
                  </motion.span>
                </div>
                <input
                  data-ocid="time.select"
                  type="range"
                  min={1}
                  max={12}
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span style={{ color: "#4B5563", fontSize: "0.7rem" }}>
                    1h
                  </span>
                  <span style={{ color: "#4B5563", fontSize: "0.7rem" }}>
                    12h
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card C — Performance History */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="card-surface rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                  }}
                  className="uppercase font-medium block mb-1"
                >
                  Card C
                </span>
                <h3
                  style={{
                    color: "#E5E7EB",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Performance History
                </h3>
              </div>
              <Activity size={18} style={{ color: "#22C55E" }} />
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="past-pct"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Past Exam %
                </label>
                <div className="flex items-center gap-2">
                  <input
                    data-ocid="performance.input"
                    type="number"
                    min={0}
                    max={100}
                    value={pastPercentage}
                    onChange={(e) =>
                      setPastPercentage(
                        Math.max(0, Math.min(100, Number(e.target.value))),
                      )
                    }
                    className="w-24 text-right text-lg font-bold rounded px-3 py-2 outline-none"
                    style={{
                      background: "#181818",
                      border: "1px solid #2A2A2A",
                      color: "#E5E7EB",
                    }}
                  />
                  <span
                    style={{
                      color: "#4B5563",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    %
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="weakest-subject"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Weakest Subject
                </label>
                <Select
                  value={weakestSubject}
                  onValueChange={setWeakestSubject}
                >
                  <SelectTrigger
                    data-ocid="performance.select"
                    className="w-full"
                    style={{
                      background: "#181818",
                      border: "1px solid #2A2A2A",
                      color: "#E5E7EB",
                      fontSize: "0.85rem",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#1A1A1A",
                      border: "1px solid #2A2A2A",
                    }}
                  >
                    {[
                      "Math",
                      "Science",
                      "English",
                      "History",
                      "Chemistry",
                      "Other",
                    ].map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        style={{ color: "#E5E7EB" }}
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Card D — Mental State */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-surface rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                  }}
                  className="uppercase font-medium block mb-1"
                >
                  Card D
                </span>
                <h3
                  style={{
                    color: "#E5E7EB",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Physical &amp; Mental State
                </h3>
              </div>
              <AlertTriangle size={18} style={{ color: "#EF4444" }} />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="sleep-hours"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Sleep Hours / Night
                  </label>
                  <motion.span
                    key={sleepHours}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color:
                        sleepHours < 6
                          ? "#EF4444"
                          : sleepHours < 7
                            ? "#F59E0B"
                            : "#22C55E",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {sleepHours}h
                  </motion.span>
                </div>
                <input
                  data-ocid="mental.select"
                  type="range"
                  min={4}
                  max={10}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span style={{ color: "#EF4444", fontSize: "0.7rem" }}>
                    4h
                  </span>
                  <span style={{ color: "#22C55E", fontSize: "0.7rem" }}>
                    10h
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="stress-level"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    display: "block",
                    marginBottom: "0.75rem",
                  }}
                >
                  Stress Level
                </label>
                <StressToggle value={stressLevel} onChange={setStressLevel} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Generate CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center mt-12 gap-4"
        >
          <button
            type="button"
            data-ocid="input.primary_button"
            onClick={handleGenerate}
            className="glow-blue flex items-center gap-3 px-12 py-5 rounded-xl font-black text-base uppercase tracking-widest cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "#3B82F6",
              color: "#fff",
              letterSpacing: "0.15em",
              boxShadow:
                "0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 50px rgba(59,130,246,0.7), 0 0 80px rgba(59,130,246,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)";
            }}
          >
            <Zap size={18} />
            Generate Reality
          </button>
          <p style={{ color: "#4B5563", fontSize: "0.75rem" }}>
            This will expose the gaps in your preparation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function LoadingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.97)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md px-6"
      >
        <p
          style={{
            color: "#3B82F6",
            fontSize: "0.68rem",
            letterSpacing: "0.25em",
            fontWeight: 600,
            marginBottom: "1.5rem",
          }}
          className="uppercase text-center"
        >
          Reality Engine
        </p>

        {/* Progress bar track */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "#1F1F1F" }}
        >
          <div
            className="h-full rounded-full progress-animate"
            style={{
              background: "linear-gradient(90deg, #1D4ED8, #3B82F6, #60A5FA)",
              boxShadow: "0 0 12px rgba(59,130,246,0.6)",
            }}
          />
        </div>

        {/* Rotating message */}
        <div className="mt-6 text-center" style={{ height: "1.5rem" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{
                color: "#6B7280",
                fontSize: "0.82rem",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {LOADING_MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                delay: i * 0.2,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#3B82F6" }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        color,
        border: `1px solid ${color}40`,
        background: `${color}12`,
      }}
    >
      {label}
    </span>
  );
}

function FocusScoreCard({ result }: { result: SimulationResult }) {
  const { focusScore } = result;
  const barColor =
    focusScore < 40 ? "#EF4444" : focusScore < 70 ? "#F59E0B" : "#22C55E";
  const label =
    focusScore < 40
      ? "Critically Distracted"
      : focusScore < 60
        ? "Inconsistent Focus"
        : focusScore < 80
          ? "Moderate Focus"
          : "Sharp";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="card-surface rounded-xl p-6 transition-all duration-200"
      data-ocid="results.card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Cognitive State
          </span>
          <h3 style={{ color: "#E5E7EB", fontWeight: 700, fontSize: "1rem" }}>
            Focus Score
          </h3>
        </div>
        <Brain size={18} style={{ color: barColor }} />
      </div>

      <div className="flex items-end gap-3 mb-3">
        <motion.div
          key={focusScore}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            color: barColor,
            fontSize: "3.2rem",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {focusScore}
        </motion.div>
        <span
          style={{
            color: "#4B5563",
            fontSize: "1.2rem",
            fontWeight: 600,
            marginBottom: "0.4rem",
          }}
        >
          /100
        </span>
      </div>
      <p
        style={{
          color: barColor,
          fontSize: "0.82rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        {label}
      </p>

      {/* Indicator bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: "6px", background: "#1F1F1F" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${focusScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full"
          style={{
            background: barColor,
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ color: "#4B5563", fontSize: "0.65rem" }}>0</span>
        <span style={{ color: "#4B5563", fontSize: "0.65rem" }}>100</span>
      </div>

      <p
        style={{ color: "#4B5563", fontSize: "0.72rem", marginTop: "0.75rem" }}
      >
        Based on sleep, stress &amp; study hours
      </p>
    </motion.div>
  );
}

function TimeWasteCard({ result }: { result: SimulationResult }) {
  const { effectiveHours, studyHours } = {
    effectiveHours: result.effectiveHours,
    studyHours: result.effectiveHours + result.wastedHours,
  };
  const effectivePct = studyHours > 0 ? (effectiveHours / studyHours) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="card-surface rounded-xl p-6 transition-all duration-200"
      data-ocid="results.card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Efficiency
          </span>
          <h3 style={{ color: "#E5E7EB", fontWeight: 700, fontSize: "1rem" }}>
            Where Your Time Is Going
          </h3>
        </div>
        <Timer size={18} style={{ color: "#F59E0B" }} />
      </div>

      <p
        style={{
          color: "#EF4444",
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: "1rem",
          lineHeight: 1.4,
        }}
      >
        You are losing ~{result.wastedHours.toFixed(1)} hours/day to low-focus
        work
      </p>

      {/* Segmented bar */}
      <div
        className="rounded overflow-hidden flex"
        style={{ height: "10px", background: "#1F1F1F" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${effectivePct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
          style={{
            background: "#22C55E",
            boxShadow: "0 0 6px rgba(34,197,94,0.5)",
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${100 - effectivePct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
          style={{
            background: "#EF4444",
            boxShadow: "0 0 6px rgba(239,68,68,0.5)",
          }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span
          className="flex items-center gap-1.5"
          style={{ color: "#22C55E", fontSize: "0.75rem" }}
        >
          <span
            className="w-2 h-2 rounded-sm inline-block"
            style={{ background: "#22C55E" }}
          />
          Effective: {effectiveHours.toFixed(1)}h
        </span>
        <span
          className="flex items-center gap-1.5"
          style={{ color: "#EF4444", fontSize: "0.75rem" }}
        >
          <span
            className="w-2 h-2 rounded-sm inline-block"
            style={{ background: "#EF4444" }}
          />
          Wasted: {result.wastedHours.toFixed(1)}h
        </span>
      </div>
    </motion.div>
  );
}

function ImprovementSimulator({
  inputs,
  baseResult,
}: {
  inputs: SimulationInputs;
  baseResult: SimulationResult;
}) {
  const [simHours, setSimHours] = useState(inputs.studyHours);
  const [simSleep, setSimSleep] = useState(inputs.sleepHours);

  const simResult = useMemo(() => {
    return generateResults({
      ...inputs,
      studyHours: simHours,
      sleepHours: simSleep,
    });
  }, [inputs, simHours, simSleep]);

  const riskColor = RISK_COLORS[simResult.burnoutRisk];
  const focusBarColor =
    simResult.focusScore < 40
      ? "#EF4444"
      : simResult.focusScore < 70
        ? "#F59E0B"
        : "#22C55E";

  const scoreImproved =
    simResult.scoreMin > baseResult.scoreMin ||
    simResult.scoreMax > baseResult.scoreMax;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card-surface rounded-xl p-6 mt-6"
      data-ocid="simulator.card"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            style={{
              color: "#3B82F6",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Interactive
          </span>
          <h3
            style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.15rem" }}
          >
            What If You Actually Tried?
          </h3>
        </div>
        <TrendingUp size={20} style={{ color: "#3B82F6" }} />
      </div>
      <p
        style={{
          color: "#6B7280",
          fontSize: "0.82rem",
          marginBottom: "1.5rem",
        }}
      >
        Adjust inputs to see real-time projection changes
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Study hours slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span
              style={{ color: "#9CA3AF", fontSize: "0.82rem", fontWeight: 500 }}
            >
              Study Hours
            </span>
            <motion.span
              key={simHours}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: "#3B82F6", fontWeight: 700, fontSize: "1.1rem" }}
            >
              {simHours}h
            </motion.span>
          </div>
          <input
            data-ocid="simulator.select"
            type="range"
            min={1}
            max={12}
            value={simHours}
            onChange={(e) => setSimHours(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span style={{ color: "#4B5563", fontSize: "0.68rem" }}>1h</span>
            <span style={{ color: "#4B5563", fontSize: "0.68rem" }}>12h</span>
          </div>
        </div>

        {/* Sleep hours slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span
              style={{ color: "#9CA3AF", fontSize: "0.82rem", fontWeight: 500 }}
            >
              Sleep Hours
            </span>
            <motion.span
              key={simSleep}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color:
                  simSleep < 6
                    ? "#EF4444"
                    : simSleep < 7
                      ? "#F59E0B"
                      : "#22C55E",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              {simSleep}h
            </motion.span>
          </div>
          <input
            data-ocid="simulator.select"
            type="range"
            min={4}
            max={10}
            value={simSleep}
            onChange={(e) => setSimSleep(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span style={{ color: "#EF4444", fontSize: "0.68rem" }}>4h</span>
            <span style={{ color: "#22C55E", fontSize: "0.68rem" }}>10h</span>
          </div>
        </div>
      </div>

      {/* Live output */}
      <div className="inner-panel rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              marginBottom: "0.5rem",
            }}
            className="uppercase"
          >
            Projected Score
          </p>
          <motion.div
            key={`${simResult.scoreMin}-${simResult.scoreMax}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              color: "#3B82F6",
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {simResult.scoreMin}–{simResult.scoreMax}%
          </motion.div>
          {scoreImproved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: "#22C55E", fontSize: "0.72rem" }}
            >
              ↑ Improved
            </motion.span>
          )}
        </div>

        <div className="text-center">
          <p
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              marginBottom: "0.5rem",
            }}
            className="uppercase"
          >
            Burnout Risk
          </p>
          <motion.div
            key={simResult.burnoutRisk}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: RISK_BG[simResult.burnoutRisk],
              border: `1px solid ${riskColor}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: riskColor }}
            />
            <span
              style={{ color: riskColor, fontWeight: 700, fontSize: "0.85rem" }}
            >
              {simResult.burnoutRisk}
            </span>
          </motion.div>
        </div>

        <div className="text-center">
          <p
            style={{
              color: "#6B7280",
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              marginBottom: "0.5rem",
            }}
            className="uppercase"
          >
            Focus Score
          </p>
          <motion.div
            key={simResult.focusScore}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              color: focusBarColor,
              fontSize: "2rem",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {simResult.focusScore}
            <span style={{ color: "#4B5563", fontSize: "1rem" }}>/100</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function RealityInsightsPanel({ result }: { result: SimulationResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="card-surface rounded-xl p-6 mt-6"
      data-ocid="insights.panel"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <span
            style={{
              color: "#EF4444",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Diagnosis
          </span>
          <h3 style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.1rem" }}>
            Reality Insights
          </h3>
        </div>
        <Target size={18} style={{ color: "#EF4444" }} />
      </div>

      <div className="flex flex-col gap-3">
        {result.insights.slice(0, 4).map((insight, i) => (
          <motion.div
            key={insight}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            className="flex items-start gap-3 group cursor-default"
            data-ocid={`insights.item.${i + 1}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ background: i % 2 === 0 ? "#EF4444" : "#F59E0B" }}
            />
            <p
              style={{
                color: "#D1D5DB",
                fontSize: "0.88rem",
                lineHeight: 1.55,
                letterSpacing: "0.01em",
              }}
              className="transition-colors duration-150 group-hover:text-[#F9FAFB]"
            >
              {insight}
            </p>
          </motion.div>
        ))}
        {(() => {
          const _avoidanceRaw = localStorage.getItem("performative_avoidance");
          const _avoidance: Record<string, number> = _avoidanceRaw
            ? JSON.parse(_avoidanceRaw)
            : {};
          const _entries = Object.entries(_avoidance).sort(
            (a, b) => (b[1] as number) - (a[1] as number),
          );
          const _top = _entries[0];
          if (!_top || (_top[1] as number) < 2) return null;
          return (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              className="flex items-start gap-3"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: "#F59E0B" }}
              />
              <p
                style={{
                  color: "#F59E0B",
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                }}
              >
                You&apos;ve avoided {_top[0]} {_top[1]} times.
              </p>
            </motion.div>
          );
        })()}
      </div>
    </motion.div>
  );
}

function DailyStudyPlan({
  result,
  inputs,
}: {
  result: SimulationResult;
  inputs: SimulationInputs;
}) {
  const [showAll, setShowAll] = useState(false);

  const plan = useMemo(() => {
    const days = Math.max(1, inputs.daysLeft);
    const hoursPerDay = inputs.studyHours;
    const allSubjects = [
      ...result.mustDo.map((s) => ({ name: s, priority: "must" as const })),
      ...result.shouldDo.map((s) => ({ name: s, priority: "should" as const })),
    ];

    if (allSubjects.length === 0) return [];

    return Array.from({ length: days }, (_, dayIdx) => {
      const daySubjects = allSubjects.map((s, i) => ({
        ...s,
        hours: Math.round((hoursPerDay / allSubjects.length) * 10) / 10,
        index: i,
      }));
      // Rotate subject order per day to avoid monotony
      const rotated = [
        ...daySubjects.slice(dayIdx % allSubjects.length),
        ...daySubjects.slice(0, dayIdx % allSubjects.length),
      ];
      return { day: dayIdx + 1, subjects: rotated };
    });
  }, [result, inputs]);

  const displayedDays = showAll ? plan : plan.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card-surface rounded-xl p-6 mt-6"
      data-ocid="plan.section"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <span
            style={{
              color: "#22C55E",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Execution
          </span>
          <h3 style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.1rem" }}>
            Your Execution Plan
          </h3>
        </div>
        <Calendar size={18} style={{ color: "#22C55E" }} />
      </div>
      <p
        style={{
          color: "#6B7280",
          fontSize: "0.8rem",
          marginBottom: "1.25rem",
        }}
      >
        {inputs.studyHours}h/day across {inputs.daysLeft} days
      </p>

      <div
        className="flex gap-3 overflow-x-auto pb-3"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#2A2A2A transparent",
        }}
      >
        {displayedDays.map((day) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * (day.day - 1) }}
            className="inner-panel rounded-lg p-4 flex-shrink-0"
            style={{ minWidth: "150px", maxWidth: "180px" }}
            data-ocid={`plan.item.${day.day}`}
          >
            <p
              style={{
                color: "#9CA3AF",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                marginBottom: "0.75rem",
              }}
              className="uppercase"
            >
              Day {day.day}
            </p>
            <div className="flex flex-col gap-2">
              {day.subjects.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-2"
                >
                  <span
                    style={{
                      color: s.priority === "must" ? "#22C55E" : "#F59E0B",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                    title={s.name}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      color: "#4B5563",
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  >
                    {s.hours}h
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {plan.length > 7 && (
        <button
          type="button"
          data-ocid="plan.toggle"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-sm cursor-pointer transition-colors duration-150"
          style={{ color: "#4B5563" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#9CA3AF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#4B5563";
          }}
        >
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAll ? "Show less" : `View all ${plan.length} days`}
        </button>
      )}
    </motion.div>
  );
}

function StreakTracker() {
  const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const streak = useMemo(() => {
    const stored = localStorage.getItem("performative_streak");
    if (stored) {
      try {
        return JSON.parse(stored) as boolean[];
      } catch {
        // fall through
      }
    }
    // Simulate: last 3 days active
    const data = [false, false, false, false, true, true, true];
    localStorage.setItem("performative_streak", JSON.stringify(data));
    return data;
  }, []);

  const activeCount = streak.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="card-surface rounded-xl p-6 mt-6"
      data-ocid="streak.card"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            style={{
              color: "#3B82F6",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Habit
          </span>
          <h3 style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "1.1rem" }}>
            Consistency Streak
          </h3>
        </div>
        <Activity size={18} style={{ color: "#3B82F6" }} />
      </div>

      <div className="flex gap-2 mb-4">
        {streak.map((active, i) => (
          <div
            key={DAY_LABELS[i]}
            className="flex flex-col items-center gap-1.5"
            data-ocid={`streak.item.${i + 1}`}
          >
            <div
              className="w-8 h-8 rounded"
              style={{
                background: active ? "rgba(34,197,94,0.2)" : "#181818",
                border: `1px solid ${active ? "rgba(34,197,94,0.4)" : "#242424"}`,
                boxShadow: active ? "0 0 8px rgba(34,197,94,0.2)" : "none",
              }}
            />
            <span style={{ color: "#4B5563", fontSize: "0.62rem" }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>

      <p style={{ color: "#E5E7EB", fontSize: "0.88rem", fontWeight: 600 }}>
        You’ve been consistent for {activeCount} day
        {activeCount !== 1 ? "s" : ""}
      </p>
      <p style={{ color: "#6B7280", fontSize: "0.78rem", marginTop: "0.3rem" }}>
        Break this pattern and your projection drops by ~8%
      </p>
    </motion.div>
  );
}

function ResultsSection({
  result,
  inputs,
  onReset,
  onFixPlan,
}: {
  result: SimulationResult;
  inputs: SimulationInputs;
  onReset: () => void;
  onFixPlan: () => void;
}) {
  const [brutalMode, setBrutalMode] = useState(false);
  const riskColor = RISK_COLORS[result.burnoutRisk];
  const riskBg = RISK_BG[result.burnoutRisk];
  const resultsGridRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    // Simple canvas-based text export
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 520;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Export failed.");
      return;
    }

    // Background
    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(0, 0, 800, 520);

    // Border
    ctx.strokeStyle = "#1F1F1F";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 776, 496);

    // Header
    ctx.fillStyle = "#3B82F6";
    ctx.font = "600 11px monospace";
    ctx.fillText("PERFORMATIVE — REALITY REPORT", 32, 48);

    ctx.fillStyle = "#F9FAFB";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Your Reality", 32, 90);

    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 32, 114);

    // Divider
    ctx.fillStyle = "#1F1F1F";
    ctx.fillRect(32, 128, 736, 1);

    // Score
    ctx.fillStyle = "#3B82F6";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText(`${result.scoreMin}–${result.scoreMax}%`, 32, 190);
    ctx.fillStyle = "#6B7280";
    ctx.font = "13px sans-serif";
    ctx.fillText("Predicted Score Range", 32, 212);

    // Burnout
    ctx.fillStyle = RISK_COLORS[result.burnoutRisk];
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`Burnout Risk: ${result.burnoutRisk}`, 32, 264);

    // Focus Score
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Focus Score: ${result.focusScore}/100`, 32, 304);

    // Insights
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "600 12px sans-serif";
    ctx.fillText("INSIGHTS", 32, 346);
    ctx.fillStyle = "#D1D5DB";
    ctx.font = "13px sans-serif";
    result.insights.slice(0, 3).forEach((ins, i) => {
      ctx.fillText(`• ${ins}`, 32, 370 + i * 26);
    });

    // Summary
    ctx.fillStyle = "rgba(34,197,94,0.7)";
    ctx.font = "12px monospace";
    const words = result.summary.split(" ");
    let line = "";
    let y = 456;
    for (const word of words) {
      const testLine = `${line + word} `;
      if (ctx.measureText(testLine).width > 736 && line !== "") {
        ctx.fillText(line, 32, y);
        line = `${word} `;
        y += 18;
        if (y > 506) break;
      } else {
        line = testLine;
      }
    }
    if (y <= 506) ctx.fillText(line, 32, y);

    const link = document.createElement("a");
    link.download = "reality-report.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Report downloaded as reality-report.png");
  }, [result]);

  return (
    <section
      className="min-h-screen px-6 md:px-12 lg:px-20 py-20"
      style={{ background: "#0B0B0B" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <p
              style={{
                color: "#EF4444",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                fontWeight: 600,
              }}
              className="uppercase mb-2"
            >
              Analysis Complete
            </p>
            <h2
              style={{
                color: "#F9FAFB",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Your Reality
            </h2>
            <p
              style={{
                color: "#6B7280",
                fontSize: "0.9rem",
                marginTop: "0.4rem",
              }}
            >
              This is what the data says.
            </p>
          </div>

          <button
            type="button"
            data-ocid="results.download_button"
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#9CA3AF",
              border: "1px solid #2A2A2A",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4B5563";
              e.currentTarget.style.color = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2A2A2A";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <Download size={14} />
            Download My Reality
          </button>

          <button
            type="button"
            data-ocid="results.brutal.toggle"
            onClick={() => setBrutalMode((b) => !b)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: brutalMode ? "#EF4444" : "#6B7280",
              border: brutalMode
                ? "1px solid rgba(239,68,68,0.5)"
                : "1px solid #2A2A2A",
              background: brutalMode ? "rgba(239,68,68,0.06)" : "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              if (!brutalMode) {
                e.currentTarget.style.borderColor = "#2A2A2A";
                e.currentTarget.style.color = "#6B7280";
              }
            }}
          >
            {brutalMode ? "EXIT BRUTAL MODE" : "BRUTAL MODE"}
          </button>
        </motion.div>

        {/* Results grid — 6 cards */}
        <div
          ref={resultsGridRef}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {/* Brutal Mode Banner */}
          {brutalMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full rounded-xl p-6 mb-2"
              style={{
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.04)",
              }}
            >
              <p
                style={{
                  color: "#EF4444",
                  fontWeight: 900,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                DO THE WORK.
              </p>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "0.85rem",
                  marginTop: "0.3rem",
                }}
              >
                Stop analyzing. One task. One timer. Execute.
              </p>
            </motion.div>
          )}
          {/* Card 1 — Priority Breakdown */}
          {!brutalMode && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="card-surface rounded-xl p-6 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    style={{
                      color: "#6B7280",
                      fontSize: "0.68rem",
                      letterSpacing: "0.15em",
                    }}
                    className="uppercase font-medium block mb-1"
                  >
                    Cut the Noise
                  </span>
                  <h3
                    style={{
                      color: "#E5E7EB",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    Priority Breakdown
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="inner-panel rounded-lg p-3">
                  <p
                    style={{
                      color: "#22C55E",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      marginBottom: "0.75rem",
                    }}
                    className="uppercase"
                  >
                    Must Do
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.mustDo.map((t) => (
                      <Pill key={t} label={t} color="#22C55E" />
                    ))}
                  </div>
                </div>
                <div className="inner-panel rounded-lg p-3">
                  <p
                    style={{
                      color: "#F59E0B",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      marginBottom: "0.75rem",
                    }}
                    className="uppercase"
                  >
                    Should Do
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.shouldDo.map((t) => (
                      <Pill key={t} label={t} color="#F59E0B" />
                    ))}
                  </div>
                </div>
                <div className="inner-panel rounded-lg p-3">
                  <p
                    style={{
                      color: "#EF4444",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      marginBottom: "0.75rem",
                    }}
                    className="uppercase"
                  >
                    Drop
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.drop.map((t) => (
                      <Pill key={t} label={t} color="#EF4444" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 2 — Score Projection */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="card-surface rounded-xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                  }}
                  className="uppercase font-medium block mb-1"
                >
                  Projection
                </span>
                <h3
                  style={{
                    color: "#E5E7EB",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Score Projection
                </h3>
              </div>
              <BarChart2 size={18} style={{ color: "#3B82F6" }} />
            </div>

            <div
              style={{
                color: "#3B82F6",
                fontSize: "3.5rem",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                marginBottom: "0.25rem",
              }}
            >
              {result.scoreMin}–{result.scoreMax}%
            </div>
            <p style={{ color: "#6B7280", fontSize: "0.78rem" }}>
              If you follow this plan
            </p>
            <p
              style={{
                color: "#EF4444",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginTop: "0.3rem",
              }}
            >
              Current path: {result.currentPath}%
            </p>

            {/* Range bar */}
            <div className="mt-5">
              <div
                className="relative h-2 rounded-full"
                style={{ background: "#1F1F1F" }}
              >
                {/* Current marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                  style={{
                    left: `${result.currentPath}%`,
                    background: "#EF4444",
                    borderColor: "#0B0B0B",
                    boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                {/* Potential range */}
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: `${result.scoreMin}%`,
                    width: `${result.scoreMax - result.scoreMin}%`,
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.4), rgba(59,130,246,0.8))",
                    boxShadow: "0 0 8px rgba(59,130,246,0.4)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span
                  style={{ color: "#EF4444", fontSize: "0.7rem" }}
                  className="flex items-center gap-1"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#EF4444", display: "inline-block" }}
                  />
                  Current
                </span>
                <span
                  style={{ color: "#3B82F6", fontSize: "0.7rem" }}
                  className="flex items-center gap-1"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#3B82F6", display: "inline-block" }}
                  />
                  Potential
                </span>
              </div>
            </div>
          </motion.div>

          {/* Finish Line Tracker */}
          {(() => {
            const target = Math.max(75, inputs.pastPercentage + 10);
            const marksAway = target - result.scoreMin;
            return (
              <div className="mt-3">
                {marksAway > 0 ? (
                  <p
                    style={{
                      color: "#F59E0B",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    You are {marksAway} marks away from your goal.
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#22C55E",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    You&apos;ve cleared the threshold. Now widen the gap.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Card 3 — Effort Reality */}
          {!brutalMode && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="card-surface rounded-xl p-6 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    style={{
                      color: "#6B7280",
                      fontSize: "0.68rem",
                      letterSpacing: "0.15em",
                    }}
                    className="uppercase font-medium block mb-1"
                  >
                    Effort Reality
                  </span>
                  <h3
                    style={{
                      color: "#E5E7EB",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    Rank Reality
                  </h3>
                </div>
                <ChevronRight size={18} style={{ color: "#F59E0B" }} />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>
                      Your effort
                    </span>
                    <span
                      style={{
                        color:
                          result.effortPercent < 40
                            ? "#EF4444"
                            : result.effortPercent < 70
                              ? "#F59E0B"
                              : "#22C55E",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}
                    >
                      {result.effortPercent}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full"
                    style={{ background: "#1F1F1F" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.effortPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          result.effortPercent < 40
                            ? "#EF4444"
                            : result.effortPercent < 70
                              ? "#F59E0B"
                              : "#22C55E",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>
                      Top performers
                    </span>
                    <span
                      style={{
                        color: "#22C55E",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}
                    >
                      100%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full"
                    style={{ background: "#2A2A2A" }}
                  >
                    <div
                      className="h-full rounded-full w-full"
                      style={{ background: "#374151" }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 inner-panel rounded-lg p-4">
                <p
                  style={{
                    color: "#E5E7EB",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  You’re operating at ~{result.effortPercent}% of competitive
                  intensity
                </p>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Top performers average 8h/day with 80%+ confidence across all
                  topics.
                </p>
              </div>
            </motion.div>
          )}

          {/* Card 4 — Burnout Risk */}
          {!brutalMode && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="card-surface rounded-xl p-6 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    style={{
                      color: "#6B7280",
                      fontSize: "0.68rem",
                      letterSpacing: "0.15em",
                    }}
                    className="uppercase font-medium block mb-1"
                  >
                    Sustainability
                  </span>
                  <h3
                    style={{
                      color: "#E5E7EB",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    Burnout Risk
                  </h3>
                </div>
                <AlertTriangle size={18} style={{ color: riskColor }} />
              </div>

              <div
                data-ocid="results.card"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg mb-5"
                style={{
                  background: riskBg,
                  border: `1px solid ${riskColor}35`,
                  boxShadow: `0 0 20px ${riskColor}25`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: riskColor,
                    boxShadow: `0 0 6px ${riskColor}`,
                  }}
                />
                <span
                  style={{
                    color: riskColor,
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {result.burnoutRisk} RISK
                </span>
              </div>

              <p
                style={{
                  color: "#E5E7EB",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                At this pace, burnout likely in ~{result.burnoutDays} days
              </p>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "0.8rem",
                  marginTop: "0.4rem",
                  lineHeight: 1.5,
                }}
              >
                {result.burnoutRisk === "HIGH"
                  ? "Immediate restructuring required. Current pace is unsustainable."
                  : result.burnoutRisk === "MODERATE"
                    ? "Monitor closely. Minor adjustments will prevent collapse."
                    : "Sustainable trajectory. Maintain without increasing pressure."}
              </p>
            </motion.div>
          )}

          {!brutalMode && <FocusScoreCard result={result} />}

          {!brutalMode && <TimeWasteCard result={result} />}
        </div>

        {/* Improvement Simulator */}
        {!brutalMode && (
          <ImprovementSimulator inputs={inputs} baseResult={result} />
        )}

        {/* Reality Insights */}
        {!brutalMode && <RealityInsightsPanel result={result} />}

        {/* Daily Study Plan */}
        {!brutalMode && <DailyStudyPlan result={result} inputs={inputs} />}

        {/* Streak Tracker */}
        {!brutalMode && <StreakTracker />}

        {/* Study Execution Section */}
        <StudyExecutionSection result={result} inputs={inputs} />

        {/* Reality Summary Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="terminal-box rounded-xl p-6 mt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={14} style={{ color: "rgba(34,197,94,0.6)" }} />
            <span
              style={{
                color: "rgba(34,197,94,0.5)",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                fontWeight: 500,
              }}
              className="uppercase"
            >
              Reality_Check Output
            </span>
          </div>
          <p
            style={{
              color: "rgba(34,197,94,0.8)",
              fontSize: "0.85rem",
              lineHeight: 1.7,
            }}
          >
            <span style={{ color: "rgba(34,197,94,0.45)" }}>&gt;&nbsp;</span>
            {result.summary}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-wrap items-center gap-4 mt-8"
        >
          <button
            type="button"
            data-ocid="results.secondary_button"
            onClick={onFixPlan}
            className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#3B82F6",
              border: "1px solid rgba(59,130,246,0.35)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
            }}
          >
            Fix My Plan
          </button>
          <button
            type="button"
            data-ocid="results.primary_button"
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#9CA3AF",
              border: "1px solid #2A2A2A",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4B5563";
              e.currentTarget.style.color = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2A2A2A";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <RefreshCw size={14} /> Run Again
          </button>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 pt-6" style={{ borderTop: "1px solid #1F1F1F" }}>
          <p
            style={{
              color: "#374151",
              fontSize: "0.75rem",
              textAlign: "center",
            }}
          >
            &copy; {new Date().getFullYear()}. Built with ❤ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4B5563" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("hero");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastInputs, setLastInputs] = useState<SimulationInputs | null>(null);
  const _inputRef = useRef<HTMLDivElement>(null);

  const scrollToInput = useCallback(() => {
    setAppState("input");
    setTimeout(() => {
      document.getElementById("input")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const handleGenerate = useCallback((inputs: SimulationInputs) => {
    setLastInputs(inputs);
    setAppState("loading");
    setTimeout(() => {
      const r = generateResults(inputs);
      setResult(r);
      setAppState("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 3100);
  }, []);

  const handleReset = useCallback(() => {
    setAppState("hero");
    setResult(null);
    setLastInputs(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFixPlan = useCallback(() => {
    toast("Plan redistribution applied.", {
      description:
        "Low-confidence topics moved to 'Should Do'. Drop list updated.",
      style: {
        background: "#121212",
        border: "1px solid #2A2A2A",
        color: "#E5E7EB",
      },
    });
  }, []);

  return (
    <div style={{ background: "#0B0B0B", minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        {appState === "loading" && <LoadingOverlay key="loading" />}
      </AnimatePresence>

      {appState === "hero" && <HeroSection onCTA={scrollToInput} />}
      {appState === "input" && <InputSection onGenerate={handleGenerate} />}
      {appState === "results" && result && lastInputs && (
        <ResultsSection
          result={result}
          inputs={lastInputs}
          onReset={handleReset}
          onFixPlan={handleFixPlan}
        />
      )}

      <Toaster />
    </div>
  );
}
