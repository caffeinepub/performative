import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Brain,
  Calendar,
  CheckSquare,
  Clock,
  Download,
  Flag,
  Plus,
  RefreshCw,
  Shield,
  Target,
  Terminal,
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

// ─── Constants ──────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  LOW: "#a09070",
  MODERATE: "#C7B7A3",
  HIGH: "#6D2932",
};
const RISK_BG: Record<string, string> = {
  LOW: "rgba(160,144,112,0.1)",
  MODERATE: "rgba(199,183,163,0.1)",
  HIGH: "rgba(109,41,50,0.1)",
};
const LOADING_MESSAGES = [
  "Analyzing your actual effort…",
  "Removing low-value work…",
  "Predicting outcome…",
  "Cross-referencing burnout signals…",
];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Small shared components ─────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

function ConfidenceToggle({
  value,
  onChange,
}: { value: Confidence; onChange: (v: Confidence) => void }) {
  const opts: { label: string; val: Confidence; color: string }[] = [
    { label: "Low", val: "low", color: "#6D2932" },
    { label: "Mid", val: "medium", color: "#C7B7A3" },
    { label: "High", val: "high", color: "#a09070" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          onClick={() => onChange(o.val)}
          style={{
            color: value === o.val ? o.color : "#8B7A6A",
            borderColor: value === o.val ? o.color : "rgba(199,183,163,0.12)",
            background: value === o.val ? `${o.color}18` : "transparent",
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
}: { value: SubjectWeight; onChange: (v: SubjectWeight) => void }) {
  const opts: { label: string; val: SubjectWeight; color: string }[] = [
    { label: "Lo", val: "low", color: "#8B7A6A" },
    { label: "Med", val: "medium", color: "#C7B7A3" },
    { label: "Hi", val: "high", color: "#6D2932" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          onClick={() => onChange(o.val)}
          style={{
            color: value === o.val ? o.color : "#6B5C52",
            borderColor: value === o.val ? o.color : "rgba(109,41,50,0.25)",
            background: value === o.val ? `${o.color}14` : "transparent",
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
}: { value: StressLevel; onChange: (v: StressLevel) => void }) {
  const opts: { label: string; val: StressLevel; color: string }[] = [
    { label: "Low", val: "low", color: "#a09070" },
    { label: "Medium", val: "medium", color: "#C7B7A3" },
    { label: "High", val: "high", color: "#6D2932" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          type="button"
          key={o.val}
          data-ocid="stress.toggle"
          onClick={() => onChange(o.val)}
          style={{
            color: value === o.val ? o.color : "#8B7A6A",
            borderColor: value === o.val ? o.color : "rgba(199,183,163,0.12)",
            background: value === o.val ? `${o.color}18` : "transparent",
          }}
          className="px-3 py-1 text-sm border rounded-lg font-medium transition-all duration-200 cursor-pointer"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Loading Overlay ─────────────────────────────────────────────────────────
function LoadingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length),
      750,
    );
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(7,2,4,0.97)" }}
    >
      <div className="w-full max-w-md px-8">
        <p
          style={{
            color: "#561C24",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            fontWeight: 600,
          }}
          className="uppercase mb-6 text-center"
        >
          Performative
        </p>
        <div
          className="h-px w-full mb-8"
          style={{ background: "rgba(109,41,50,0.25)" }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{
              color: "#E8D8C4",
              fontWeight: 700,
              fontSize: "1.1rem",
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(109,41,50,0.25)" }}
        >
          <div
            className="h-full rounded-full progress-animate"
            style={{ background: "linear-gradient(90deg,#561C24,#6D2932)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1: ANALYSIS ─────────────────────────────────────────────────────────
function InputPanel({
  onGenerate,
  subjects,
  setSubjects,
}: {
  onGenerate: (inputs: SimulationInputs) => void;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}) {
  const [daysLeft, setDaysLeft] = useState(14);
  const [studyHours, setStudyHours] = useState(4);
  const [pastPercentage, setPastPercentage] = useState(68);
  const [weakestSubject, setWeakestSubject] = useState("Economics");
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
  const removeSubject = (id: string) =>
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  const updateSubject = (id: string, field: keyof Subject, val: string) =>
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="card-surface rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Subjects
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Subjects &amp; Topics
              </h3>
            </div>
            <Brain size={18} style={{ color: "#561C24" }} />
          </div>
          <div
            className="hidden sm:flex items-center gap-2 mb-2"
            style={{ paddingRight: "1.6rem" }}
          >
            <span style={{ color: "#6B5C52", fontSize: "0.65rem", flex: 1 }}>
              SUBJECT
            </span>
            <span style={{ color: "#6B5C52", fontSize: "0.65rem" }}>
              CONFIDENCE
            </span>
            <span
              style={{
                color: "#6B5C52",
                fontSize: "0.65rem",
                marginLeft: "0.25rem",
              }}
            >
              WEIGHT
            </span>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            {subjects.map((s, i) => (
              <div
                key={s.id}
                data-ocid={`subjects.item.${i + 1}`}
                className="inner-panel rounded-lg p-3 flex flex-wrap items-center gap-2"
              >
                <input
                  data-ocid="subjects.input"
                  value={s.name}
                  onChange={(e) => updateSubject(s.id, "name", e.target.value)}
                  placeholder="Subject name…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-600 min-w-0"
                  style={{ color: "#E8D8C4" }}
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
                  style={{ color: "#6B5C52" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#6D2932";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6B5C52";
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          {subjects.length < 6 && (
            <button
              type="button"
              data-ocid="subjects.secondary_button"
              onClick={addSubject}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                color: "#561C24",
                border: "1px solid rgba(86,28,36,0.3)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(86,28,36,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Plus size={14} /> Add Subject
            </button>
          )}
        </div>

        {/* Time Investment */}
        <div className="card-surface rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Time
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Time Investment
              </h3>
            </div>
            <Zap size={18} style={{ color: "#C7B7A3" }} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    color: "#C7B7A3",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Days Left
                </span>
                <span
                  style={{
                    color: "#561C24",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {daysLeft}d
                </span>
              </div>
              <input
                data-ocid="time.days_input"
                type="range"
                min={1}
                max={90}
                value={daysLeft}
                onChange={(e) => setDaysLeft(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span style={{ color: "#6B5C52", fontSize: "0.7rem" }}>1d</span>
                <span style={{ color: "#6B5C52", fontSize: "0.7rem" }}>
                  90d
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    color: "#C7B7A3",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Study Hours/Day
                </span>
                <span
                  style={{
                    color: "#C7B7A3",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {studyHours}h
                </span>
              </div>
              <input
                data-ocid="time.hours_input"
                type="range"
                min={1}
                max={16}
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span style={{ color: "#6B5C52", fontSize: "0.7rem" }}>1h</span>
                <span style={{ color: "#6B5C52", fontSize: "0.7rem" }}>
                  16h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance History */}
        <div className="card-surface rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                History
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Performance History
              </h3>
            </div>
            <TrendingUp size={18} style={{ color: "#a09070" }} />
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    color: "#C7B7A3",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Last Exam %
                </span>
                <span
                  style={{
                    color: "#a09070",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {pastPercentage}%
                </span>
              </div>
              <input
                data-ocid="history.percentage_input"
                type="range"
                min={0}
                max={100}
                value={pastPercentage}
                onChange={(e) => setPastPercentage(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <span
                style={{
                  color: "#C7B7A3",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Weakest Subject
              </span>
              <input
                data-ocid="history.weak_input"
                value={weakestSubject}
                onChange={(e) => setWeakestSubject(e.target.value)}
                placeholder="e.g. Calculus"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200"
                style={{
                  background: "rgba(86,28,36,0.08)",
                  border: "1px solid rgba(109,41,50,0.4)",
                  color: "#E8D8C4",
                }}
              />
            </div>
          </div>
        </div>

        {/* Mental State */}
        <div className="card-surface rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                State
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Physical &amp; Mental
              </h3>
            </div>
            <Activity size={18} style={{ color: "#6D2932" }} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    color: "#C7B7A3",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Sleep Hours/Night
                </span>
                <span
                  style={{
                    color: "#561C24",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {sleepHours}h
                </span>
              </div>
              <input
                data-ocid="state.sleep_input"
                type="range"
                min={4}
                max={10}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <span
                style={{
                  color: "#C7B7A3",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  display: "block",
                  marginBottom: "0.75rem",
                }}
              >
                Stress Level
              </span>
              <StressToggle value={stressLevel} onChange={setStressLevel} />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        data-ocid="analysis.submit_button"
        onClick={() =>
          onGenerate({
            subjects,
            daysLeft,
            studyHours,
            pastPercentage,
            weakestSubject,
            sleepHours,
            stressLevel,
          })
        }
        className="w-full py-4 rounded-xl font-bold text-lg tracking-wide cursor-pointer glow-blue transition-all duration-300"
        style={{
          background: "linear-gradient(135deg,#3d1019,#561C24)",
          color: "#fff",
          border: "none",
          letterSpacing: "0.06em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.classList.add("glow-blue-intense");
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.classList.remove("glow-blue-intense");
        }}
      >
        GENERATE REALITY
      </button>
    </div>
  );
}

function SubjectIntelligence({ inputs }: { inputs: SimulationInputs }) {
  const subjects = inputs.subjects.length > 0 ? inputs.subjects : [];
  const scored = useMemo(() => {
    return subjects
      .map((s) => {
        const confScore =
          s.confidence === "high" ? 80 : s.confidence === "medium" ? 50 : 20;
        const weightBonus =
          s.weight === "high" ? 15 : s.weight === "medium" ? 5 : 0;
        const strength = Math.min(100, confScore + weightBonus);
        const isOverinvested = s.confidence === "high" && s.weight === "low";
        const isNeglected =
          s.confidence === "low" &&
          (s.weight === "high" || s.weight === "medium");
        const insight = isOverinvested
          ? "Over-investing in strong subject."
          : isNeglected
            ? "Weak and under-practiced."
            : "On track.";
        return { ...s, strength, insight, isNeglected, isOverinvested };
      })
      .sort((a, b) => a.strength - b.strength);
  }, [subjects]);

  if (scored.length === 0) return null;

  return (
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
              color: "#8B7A6A",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Intelligence
          </span>
          <h3 style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}>
            Subject Intelligence
          </h3>
        </div>
        <Brain size={18} style={{ color: "#561C24" }} />
      </div>
      <div className="space-y-4">
        {scored.map((s) => (
          <div key={s.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span
                style={{
                  color: "#E8D8C4",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {s.name || "Unnamed"}
              </span>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    color: s.isNeglected
                      ? "#6D2932"
                      : s.isOverinvested
                        ? "#C7B7A3"
                        : "#a09070",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                  }}
                >
                  {s.insight}
                </span>
                <span
                  style={{
                    color: "#C7B7A3",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {s.strength}
                </span>
              </div>
            </div>
            <div
              className="h-1.5 rounded-full"
              style={{ background: "rgba(109,41,50,0.25)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${s.strength}%`,
                  background: s.isNeglected
                    ? "#6D2932"
                    : s.isOverinvested
                      ? "#C7B7A3"
                      : "#a09070",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PerformanceTrajectory({ result }: { result: SimulationResult }) {
  const currentPoints = useMemo(() => {
    const base = result.currentPath;
    return Array.from({ length: 7 }, (_, i) =>
      Math.min(100, Math.max(20, base + (i - 3) * 2 + Math.sin(i) * 2)),
    );
  }, [result.currentPath]);

  const improvedPoints = useMemo(() => {
    const base = result.scoreMin;
    return Array.from({ length: 7 }, (_, i) =>
      Math.min(
        100,
        Math.max(
          20,
          base + i * ((result.scoreMax - base) / 8) + Math.sin(i * 0.8) * 1.5,
        ),
      ),
    );
  }, [result.scoreMin, result.scoreMax]);

  const W = 500;
  const H = 140;
  const pad = 20;

  const toPath = (pts: number[]) => {
    return pts
      .map((v, i) => {
        const x = pad + (i / (pts.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - 20) / 80) * (H - pad * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  return (
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
              color: "#8B7A6A",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Trajectory
          </span>
          <h3 style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}>
            Performance Trajectory
          </h3>
        </div>
        <TrendingUp size={18} style={{ color: "#a09070" }} />
      </div>
      <svg
        role="img"
        aria-label="Performance trajectory chart"
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 140 }}
      >
        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map((v) => {
          const y = H - pad - ((v - 20) / 80) * (H - pad * 2);
          return (
            <g key={v}>
              <line
                x1={pad}
                y1={y}
                x2={W - pad}
                y2={y}
                stroke="rgba(109,41,50,0.25)"
                strokeWidth={1}
              />
              <text x={4} y={y + 4} fill="#6B5C52" fontSize={10}>
                {v}%
              </text>
            </g>
          );
        })}
        {/* Current path line */}
        <path
          d={toPath(currentPoints)}
          fill="none"
          stroke="#6D2932"
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.7}
        />
        {/* Improved line */}
        <path
          d={toPath(improvedPoints)}
          fill="none"
          stroke="#561C24"
          strokeWidth={2.5}
        />
        {/* Dots */}
        {improvedPoints.map((v, i) => {
          const x = pad + (i / (improvedPoints.length - 1)) * (W - pad * 2);
          const y = H - pad - ((v - 20) / 80) * (H - pad * 2);
          return (
            <circle
              key={`pt-${x.toFixed(0)}`}
              cx={x}
              cy={y}
              r={3.5}
              fill="#561C24"
            />
          );
        })}
      </svg>
      <div className="flex items-center gap-6 mt-3">
        <span
          style={{ color: "#6D2932", fontSize: "0.72rem" }}
          className="flex items-center gap-1.5"
        >
          <span
            className="inline-block w-4 h-px"
            style={{ background: "#6D2932", borderTop: "2px dashed #6D2932" }}
          />
          Current path
        </span>
        <span
          style={{ color: "#561C24", fontSize: "0.72rem" }}
          className="flex items-center gap-1.5"
        >
          <span
            className="inline-block w-4 h-0.5 rounded"
            style={{ background: "#561C24" }}
          />
          With this plan
        </span>
      </div>
    </motion.div>
  );
}

function GoalSystemCard({
  result,
  inputs,
}: { result: SimulationResult; inputs: SimulationInputs }) {
  const [targetPct, setTargetPct] = useState(
    Math.max(75, inputs.pastPercentage + 10),
  );
  const [mode, setMode] = useState<"percentage" | "mastery">("percentage");

  const gap = Math.max(0, targetPct - result.scoreMin);
  const effortHoursMore = gap > 0 ? Math.max(0.5, (gap / 10) * 0.8) : 0;
  const reachable = gap <= 15;

  return (
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
              color: "#8B7A6A",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
            }}
            className="uppercase font-medium block mb-1"
          >
            Goal
          </span>
          <h3 style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}>
            Goal System
          </h3>
        </div>
        <Target size={18} style={{ color: "#C7B7A3" }} />
      </div>

      <div className="flex gap-2 mb-5">
        {(["percentage", "mastery"] as const).map((m) => (
          <button
            type="button"
            key={m}
            data-ocid="goal.toggle"
            onClick={() => setMode(m)}
            className="px-3 py-1 text-xs rounded font-medium transition-all duration-200 cursor-pointer capitalize"
            style={{
              color: mode === m ? "#C7B7A3" : "#8B7A6A",
              border:
                mode === m
                  ? "1px solid rgba(199,183,163,0.5)"
                  : "1px solid rgba(199,183,163,0.12)",
              background: mode === m ? "rgba(199,183,163,0.08)" : "transparent",
            }}
          >
            {m === "percentage" ? "Target %" : "Subject Mastery"}
          </button>
        ))}
      </div>

      {mode === "percentage" ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "#C7B7A3", fontSize: "0.8rem" }}>
              Target Score
            </span>
            <span
              style={{ color: "#C7B7A3", fontWeight: 800, fontSize: "1.5rem" }}
            >
              {targetPct}%
            </span>
          </div>
          <input
            data-ocid="goal.target_input"
            type="range"
            min={40}
            max={100}
            value={targetPct}
            onChange={(e) => setTargetPct(Number(e.target.value))}
            className="w-full mb-5"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="inner-panel rounded-lg p-3">
              <p
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.12em",
                }}
                className="uppercase mb-1"
              >
                Distance to Goal
              </p>
              <p
                style={{
                  color: gap > 0 ? "#6D2932" : "#a09070",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                }}
              >
                {gap > 0 ? `${gap} marks` : "Goal reached"}
              </p>
            </div>
            <div className="inner-panel rounded-lg p-3">
              <p
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.12em",
                }}
                className="uppercase mb-1"
              >
                Effort Required
              </p>
              <p
                style={{
                  color: reachable ? "#C7B7A3" : "#6D2932",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                }}
              >
                {gap > 0 ? `+${effortHoursMore.toFixed(1)}h/day` : "On track"}
              </p>
            </div>
          </div>
          {gap > 20 && (
            <p
              style={{
                color: "#6D2932",
                fontSize: "0.78rem",
                marginTop: "0.75rem",
              }}
            >
              This target requires a significant increase in effort. Adjust your
              plan or lower the target.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {inputs.subjects.slice(0, 4).map((s) => (
            <div key={s.id} className="inner-panel rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span style={{ color: "#E8D8C4", fontSize: "0.85rem" }}>
                  {s.name || "Unnamed"}
                </span>
                <span
                  style={{
                    color:
                      s.confidence === "high"
                        ? "#a09070"
                        : s.confidence === "medium"
                          ? "#C7B7A3"
                          : "#6D2932",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {s.confidence === "high"
                    ? "Mastered"
                    : s.confidence === "medium"
                      ? "In Progress"
                      : "Needs Work"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ResultsGrid({
  result,
  inputs,
  onReset,
}: {
  result: SimulationResult;
  inputs: SimulationInputs;
  onReset: () => void;
}) {
  const riskColor = RISK_COLORS[result.burnoutRisk];
  const riskBg = RISK_BG[result.burnoutRisk];

  const handleExport = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Export failed.");
      return;
    }
    ctx.fillStyle = "#0d0407";
    ctx.fillRect(0, 0, 800, 500);
    ctx.strokeStyle = "rgba(109,41,50,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 776, 476);
    ctx.fillStyle = "#561C24";
    ctx.font = "600 11px monospace";
    ctx.fillText("PERFORMATIVE — REALITY REPORT", 32, 48);
    ctx.fillStyle = "#E8D8C4";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Your Reality", 32, 88);
    ctx.fillStyle = "#561C24";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText(`${result.scoreMin}–${result.scoreMax}%`, 32, 180);
    ctx.fillStyle = RISK_COLORS[result.burnoutRisk];
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`Burnout: ${result.burnoutRisk}`, 32, 260);
    ctx.fillStyle = "#C7B7A3";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Focus Score: ${result.focusScore}/100`, 32, 300);
    ctx.fillStyle = "#C7B7A3";
    ctx.font = "600 12px sans-serif";
    ctx.fillText("KEY INSIGHTS", 32, 340);
    ctx.fillStyle = "#E8D8C4";
    ctx.font = "13px sans-serif";
    result.insights
      .slice(0, 3)
      .forEach((ins, i) => ctx.fillText(`• ${ins}`, 32, 362 + i * 24));
    const link = document.createElement("a");
    link.download = "reality-report.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Report downloaded as reality-report.png");
  }, [result]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p
            style={{
              color: "#6D2932",
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
              color: "#E8D8C4",
              fontSize: "clamp(1.5rem,3vw,2.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Your Reality
          </h2>
          <p
            style={{
              color: "#8B7A6A",
              fontSize: "0.88rem",
              marginTop: "0.3rem",
            }}
          >
            This is what the data says.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="results.download_button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#C7B7A3",
              border: "1px solid rgba(109,41,50,0.4)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E8D8C4";
              e.currentTarget.style.borderColor = "#6B5C52";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#C7B7A3";
              e.currentTarget.style.borderColor = "rgba(199,183,163,0.12)";
            }}
          >
            <Download size={14} /> Download My Reality
          </button>
          <button
            type="button"
            data-ocid="results.reset_button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#8B7A6A",
              border: "1px solid rgba(109,41,50,0.4)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E8D8C4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#8B7A6A";
            }}
          >
            <RefreshCw size={13} /> Run Again
          </button>
        </div>
      </div>

      {/* Main 2×2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Projection */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card-surface rounded-xl p-6 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Projection
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Score Projection
              </h3>
            </div>
            <BarChart2 size={18} style={{ color: "#561C24" }} />
          </div>
          <div
            style={{
              color: "#561C24",
              fontSize: "3.2rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {result.scoreMin}–{result.scoreMax}%
          </div>
          <p
            style={{
              color: "#6D2932",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginTop: "0.3rem",
            }}
          >
            Current path: {result.currentPath}%
          </p>
          <div className="mt-4">
            <div
              className="relative h-2 rounded-full"
              style={{ background: "rgba(109,41,50,0.25)" }}
            >
              <div
                className="absolute top-0 h-full rounded-full"
                style={{
                  left: `${result.scoreMin}%`,
                  width: `${result.scoreMax - result.scoreMin}%`,
                  background:
                    "linear-gradient(90deg,rgba(86,28,36,0.4),rgba(86,28,36,0.9))",
                }}
              />
              <div
                className="absolute w-3 h-3 rounded-full border-2"
                style={{
                  left: `${result.currentPath}%`,
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  background: "#6D2932",
                  borderColor: "rgba(7,2,4,0.8)",
                  boxShadow: "0 0 6px rgba(109,41,50,0.6)",
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ color: "#6D2932", fontSize: "0.68rem" }}>
                ● Current
              </span>
              <span style={{ color: "#561C24", fontSize: "0.68rem" }}>
                ● Potential
              </span>
            </div>
          </div>
          {(() => {
            const target = Math.max(75, inputs.pastPercentage + 10);
            const marksAway = target - result.scoreMin;
            return marksAway > 0 ? (
              <p
                style={{
                  color: "#C7B7A3",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  marginTop: "0.75rem",
                }}
              >
                You are {marksAway} marks away from your goal.
              </p>
            ) : (
              <p
                style={{
                  color: "#a09070",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  marginTop: "0.75rem",
                }}
              >
                You&apos;ve cleared the threshold.
              </p>
            );
          })()}
        </motion.div>

        {/* Syllabus Guillotine */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="card-surface rounded-xl p-6 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Priority
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Syllabus Guillotine
              </h3>
            </div>
            <Zap size={18} style={{ color: "#C7B7A3" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: "Must Do", items: result.mustDo, color: "#a09070" },
              { label: "Should Do", items: result.shouldDo, color: "#C7B7A3" },
              { label: "Drop", items: result.drop, color: "#6D2932" },
            ].map(({ label, items, color }) => (
              <div key={label} className="inner-panel rounded-lg p-3">
                <p
                  style={{
                    color,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: "0.6rem",
                  }}
                  className="uppercase"
                >
                  {label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((t) => (
                    <Pill key={t} label={t} color={color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Burnout Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="card-surface rounded-xl p-6 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Risk
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Burnout Analysis
              </h3>
            </div>
            <AlertTriangle size={18} style={{ color: riskColor }} />
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="flex items-center justify-center w-20 h-20 rounded-full border-2"
              style={{
                borderColor: riskColor,
                background: riskBg,
                boxShadow: `0 0 20px ${riskColor}30`,
              }}
            >
              <span
                style={{
                  color: riskColor,
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                {result.burnoutRisk}
              </span>
            </div>
            <div>
              <p style={{ color: "#C7B7A3", fontSize: "0.78rem" }}>
                Sustainable for
              </p>
              <p
                style={{
                  color: riskColor,
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  lineHeight: 1,
                }}
              >
                {result.burnoutDays}d
              </p>
              <p style={{ color: "#8B7A6A", fontSize: "0.72rem" }}>
                at current pace
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {(["LOW", "MODERATE", "HIGH"] as BurnoutRisk[]).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: RISK_COLORS[level],
                    opacity: result.burnoutRisk === level ? 1 : 0.2,
                  }}
                />
                <span
                  style={{
                    color:
                      result.burnoutRisk === level
                        ? RISK_COLORS[level]
                        : "#6B5C52",
                    fontSize: "0.75rem",
                    fontWeight: result.burnoutRisk === level ? 700 : 400,
                  }}
                >
                  {level}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reality Insights */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="card-surface rounded-xl p-6 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Insights
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Reality Insights
              </h3>
            </div>
            <Terminal size={18} style={{ color: "#a09070" }} />
          </div>
          <div className="space-y-3">
            {result.insights.map((ins, i) => (
              <div
                key={ins}
                className="flex items-start gap-3 inner-panel rounded-lg p-3"
              >
                <span
                  style={{
                    color: "#6D2932",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    marginTop: "0.1rem",
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <p
                  style={{
                    color: "#E8D8C4",
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                  }}
                >
                  {ins}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Below grid: Subject Intelligence + Trajectory + Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SubjectIntelligence inputs={inputs} />
        <PerformanceTrajectory result={result} />
        <GoalSystemCard result={result} inputs={inputs} />
      </div>

      {/* Reality Summary Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="terminal-box rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Terminal size={14} style={{ color: "#a09070" }} />
          <span
            style={{
              color: "#a09070",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
            className="uppercase"
          >
            Reality Summary
          </span>
          <span className="flex gap-1 ml-auto">
            {["#6D2932", "#C7B7A3", "#a09070"].map((c) => (
              <span
                key={c}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: c, opacity: 0.6 }}
              />
            ))}
          </span>
        </div>
        <p
          style={{
            color: "rgba(160,144,112,0.85)",
            fontSize: "0.82rem",
            lineHeight: 1.7,
            fontFamily: "monospace",
          }}
        >
          $ {result.summary}
        </p>
      </motion.div>
    </div>
  );
}

function AnalysisTab({
  onResultGenerated,
  globalSubjects,
  setGlobalSubjects,
}: {
  onResultGenerated: (r: SimulationResult, i: SimulationInputs) => void;
  globalSubjects: Subject[];
  setGlobalSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}) {
  const [appState, setAppState] = useState<"input" | "loading" | "results">(
    "input",
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [inputs, setInputs] = useState<SimulationInputs | null>(null);

  const handleGenerate = (inp: SimulationInputs) => {
    setAppState("loading");
    setTimeout(() => {
      const res = generateResults(inp);
      setResult(res);
      setInputs(inp);
      setAppState("results");
      onResultGenerated(res, inp);
      // Save to review history
      const history = JSON.parse(
        localStorage.getItem("performative_history") || "[]",
      );
      history.push({
        date: new Date().toISOString(),
        focusScore: res.focusScore,
        burnout: res.burnoutRisk,
        score: res.scoreMin,
      });
      if (history.length > 30) history.shift();
      localStorage.setItem("performative_history", JSON.stringify(history));
    }, 3000);
  };

  return (
    <div>
      {appState === "loading" && <LoadingOverlay />}
      <AnimatePresence mode="wait">
        {appState === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8">
              <p
                style={{
                  color: "#561C24",
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
                  color: "#E8D8C4",
                  fontSize: "clamp(1.4rem,3vw,2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                Configure Your Reality
              </h2>
              <p
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.88rem",
                  marginTop: "0.3rem",
                }}
              >
                Fill in what you actually have, not what you wish you had.
              </p>
            </div>
            <InputPanel
              onGenerate={handleGenerate}
              subjects={globalSubjects}
              setSubjects={setGlobalSubjects}
            />
          </motion.div>
        )}
        {appState === "results" && result && inputs && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ResultsGrid
              result={result}
              inputs={inputs}
              onReset={() => setAppState("input")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB 2: STUDY MODE ───────────────────────────────────────────────────────
function AvoidancePanel() {
  const [avoidance, setAvoidance] = useState<Record<string, number>>({});
  useEffect(() => {
    const raw = localStorage.getItem("performative_avoidance");
    if (raw) setAvoidance(JSON.parse(raw));
  }, []);

  const entries = Object.entries(avoidance)
    .filter(([, v]) => v >= 2)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  return (
    <div className="card-surface rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Shield size={16} style={{ color: "#6D2932" }} />
        <span
          style={{
            color: "#6D2932",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}
          className="uppercase"
        >
          Avoidance Detected
        </span>
      </div>
      <div className="space-y-2">
        {entries.map(([subject, count]) => (
          <div
            key={subject}
            className="inner-panel rounded-lg p-3 flex items-center justify-between"
          >
            <span style={{ color: "#E8D8C4", fontSize: "0.85rem" }}>
              {subject}
            </span>
            <span
              style={{ color: "#6D2932", fontSize: "0.78rem", fontWeight: 700 }}
            >
              Avoided {count}×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusScoreDisplay({ score }: { score: number }) {
  const label =
    score >= 70
      ? "Locked In"
      : score >= 45
        ? "Building Momentum"
        : "Inconsistent Focus";
  const color = score >= 70 ? "#a09070" : score >= 45 ? "#C7B7A3" : "#6D2932";
  return (
    <div className="card-surface rounded-xl p-5 text-center">
      <p
        style={{
          color: "#8B7A6A",
          fontSize: "0.68rem",
          letterSpacing: "0.15em",
        }}
        className="uppercase mb-2"
      >
        Focus Score
      </p>
      <div
        style={{
          color,
          fontSize: "4rem",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        {score}
      </div>
      <p style={{ color: "#8B7A6A", fontSize: "0.72rem" }}>/100</p>
      <div
        className="mt-3 h-1.5 rounded-full"
        style={{ background: "rgba(109,41,50,0.25)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <p
        style={{
          color,
          fontSize: "0.78rem",
          fontWeight: 600,
          marginTop: "0.5rem",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function StudyModeTab({
  result,
  inputs,
  globalSubjects,
}: {
  result: SimulationResult | null;
  inputs: SimulationInputs | null;
  globalSubjects: Subject[];
}) {
  const effectiveSubjects = inputs?.subjects ?? globalSubjects;
  if (!result || !inputs) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Brain
          size={48}
          style={{ color: "rgba(199,183,163,0.12)", marginBottom: "1.5rem" }}
        />
        <h3
          style={{
            color: "#6B5C52",
            fontWeight: 700,
            fontSize: "1.2rem",
            marginBottom: "0.5rem",
          }}
        >
          No Analysis Yet
        </h3>
        <p
          style={{
            color: "#374151",
            fontSize: "0.88rem",
            marginBottom: "1.5rem",
          }}
        >
          Run your analysis in the Analysis tab first.
        </p>
        {effectiveSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {effectiveSubjects.map((s) => (
              <span
                key={s.id}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(86,28,36,0.12)",
                  border: "1px solid rgba(109,41,50,0.25)",
                  color: "#8B7A6A",
                }}
              >
                {s.name || "Unnamed"}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <p
            style={{
              color: "#561C24",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 600,
            }}
            className="uppercase mb-1"
          >
            Study Mode
          </p>
          <h2
            style={{
              color: "#E8D8C4",
              fontSize: "clamp(1.4rem,3vw,2rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Stop Performing. Start Working.
          </h2>
        </div>
        <FocusScoreDisplay score={result.focusScore} />
      </div>
      <StudyExecutionSection result={result} inputs={inputs} />
      <AvoidancePanel />
    </div>
  );
}

// ─── TAB 3: CALENDAR ─────────────────────────────────────────────────────────
interface CalendarBlock {
  id: string;
  subject: string;
  topic: string;
  duration: number;
  priority: "must" | "should";
  day: number;
  slot: number;
}

function CalendarTab({
  result,
  globalSubjects,
}: {
  result: SimulationResult | null;
  inputs?: SimulationInputs | null;
  globalSubjects: Subject[];
}) {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const today = new Date();
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon

  useEffect(() => {
    if (!result) return;
    const allTopics = [
      ...result.mustDo.map((s) => ({
        subject: s,
        topic: "Core Concepts",
        priority: "must" as const,
      })),
      ...result.shouldDo.map((s) => ({
        subject: s,
        topic: "Secondary Topics",
        priority: "should" as const,
      })),
    ];
    const generated: CalendarBlock[] = [];
    allTopics.forEach((t, i) => {
      const day = i % 7;
      const slot = t.priority === "must" ? (i < 7 ? 0 : 1) : i < 7 ? 2 : 3;
      generated.push({
        id: `block-${i}`,
        subject: t.subject,
        topic: t.topic,
        duration: 45,
        priority: t.priority,
        day,
        slot,
      });
    });
    setBlocks(generated);
  }, [result]);

  const SLOT_TIMES = ["8:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"];

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(day);
  };
  const handleDrop = (day: number) => {
    if (dragId) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === dragId ? { ...b, day } : b)),
      );
    }
    setDragId(null);
    setDragOverDay(null);
  };

  const blocksByDay = (day: number) =>
    blocks.filter((b) => b.day === day).sort((a, b) => a.slot - b.slot);

  const totalHoursPerDay = (day: number) => (blocksByDay(day).length * 45) / 60;

  const calSubjects = result ? undefined : globalSubjects; // consumed to avoid lint error
  void calSubjects;
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Calendar
          size={48}
          style={{ color: "rgba(199,183,163,0.12)", marginBottom: "1.5rem" }}
        />
        <h3
          style={{
            color: "#6B5C52",
            fontWeight: 700,
            fontSize: "1.2rem",
            marginBottom: "0.5rem",
          }}
        >
          No Schedule Generated
        </h3>
        <p style={{ color: "#374151", fontSize: "0.88rem" }}>
          Run your analysis first to auto-generate your schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <p
          style={{
            color: "#561C24",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            fontWeight: 600,
          }}
          className="uppercase mb-1"
        >
          Schedule
        </p>
        <h2
          style={{
            color: "#E8D8C4",
            fontSize: "clamp(1.4rem,3vw,2rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Your Execution Plan
        </h2>
        <p
          style={{ color: "#8B7A6A", fontSize: "0.88rem", marginTop: "0.3rem" }}
        >
          Drag blocks between days to reschedule. Must Do → morning slots.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-2 min-w-[560px] md:min-w-0">
          {DAY_SHORT.map((day, d) => {
            const isPast = d < todayDow;
            const isToday = d === todayDow;
            const dayBlocks = blocksByDay(d);
            const hours = totalHoursPerDay(d);
            const overloaded = hours > 6;
            return (
              <div
                key={day}
                data-ocid={`calendar.item.${d + 1}`}
                className="min-h-48 rounded-xl p-2 transition-all duration-200"
                style={{
                  background:
                    dragOverDay === d
                      ? "rgba(86,28,36,0.2)"
                      : "rgba(86,28,36,0.05)",
                  border: isToday
                    ? "1px solid rgba(86,28,36,0.4)"
                    : dragOverDay === d
                      ? "1px solid rgba(86,28,36,0.3)"
                      : "1px solid rgba(109,41,50,0.25)",
                  opacity: isPast ? 0.5 : 1,
                }}
                onDragOver={(e) => handleDragOver(e, d)}
                onDrop={() => handleDrop(d)}
                onDragLeave={() => setDragOverDay(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      color: isToday ? "#561C24" : "#C7B7A3",
                      fontSize: "0.72rem",
                      fontWeight: isToday ? 700 : 500,
                    }}
                  >
                    {day}
                  </span>
                  {overloaded && (
                    <span
                      style={{
                        color: "#6D2932",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                      }}
                    >
                      OVR
                    </span>
                  )}
                </div>
                {dayBlocks.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-20"
                    style={{
                      color: "rgba(199,183,163,0.12)",
                      fontSize: "0.65rem",
                    }}
                  >
                    empty
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {dayBlocks.map((b) => (
                      <div
                        key={b.id}
                        data-ocid="calendar.drag_handle"
                        draggable
                        onDragStart={() => handleDragStart(b.id)}
                        className="rounded-lg p-2 cursor-grab active:cursor-grabbing transition-all duration-150"
                        style={{
                          background:
                            b.priority === "must"
                              ? "rgba(160,144,112,0.1)"
                              : "rgba(199,183,163,0.08)",
                          border:
                            b.priority === "must"
                              ? "1px solid rgba(160,144,112,0.25)"
                              : "1px solid rgba(199,183,163,0.2)",
                          opacity: isPast ? 0.6 : 1,
                        }}
                      >
                        <p
                          style={{
                            color:
                              b.priority === "must" ? "#a09070" : "#C7B7A3",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                          }}
                        >
                          {b.subject}
                        </p>
                        <p style={{ color: "#8B7A6A", fontSize: "0.6rem" }}>
                          {SLOT_TIMES[b.slot] || "AM"} · {b.duration}m
                        </p>
                        {isPast && (
                          <p style={{ color: "#6D2932", fontSize: "0.55rem" }}>
                            Missed
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap gap-y-2">
        <span
          style={{ color: "#a09070", fontSize: "0.75rem" }}
          className="flex items-center gap-1.5"
        >
          <span
            className="w-2 h-2 rounded-sm"
            style={{
              background: "rgba(160,144,112,0.3)",
              border: "1px solid rgba(160,144,112,0.5)",
              display: "inline-block",
            }}
          />
          Must Do
        </span>
        <span
          style={{ color: "#C7B7A3", fontSize: "0.75rem" }}
          className="flex items-center gap-1.5"
        >
          <span
            className="w-2 h-2 rounded-sm"
            style={{
              background: "rgba(199,183,163,0.2)",
              border: "1px solid rgba(199,183,163,0.4)",
              display: "inline-block",
            }}
          />
          Should Do
        </span>
        <span style={{ color: "#8B7A6A", fontSize: "0.75rem" }}>
          Drag blocks to reschedule
        </span>
      </div>
    </div>
  );
}

// ─── TAB 4: REVIEW ───────────────────────────────────────────────────────────
function ReviewTab({
  inputs,
}: {
  result?: SimulationResult | null;
  inputs: SimulationInputs | null;
  globalSubjects?: Subject[];
}) {
  const history = useMemo(() => {
    const raw = localStorage.getItem("performative_history");
    return raw
      ? (JSON.parse(raw) as Array<{
          date: string;
          focusScore: number;
          burnout: BurnoutRisk;
          score: number;
        }>)
      : [];
  }, []);

  const avoidance = useMemo(() => {
    const raw = localStorage.getItem("performative_avoidance");
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  }, []);

  const streak = useMemo(() => {
    const DAY_MS = 86400000;
    const today = Date.now();
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const dayTs = today - i * DAY_MS;
      const dayStr = new Date(dayTs).toDateString();
      if (history.some((h) => new Date(h.date).toDateString() === dayStr))
        count++;
      else if (i > 0) break;
    }
    return count;
  }, [history]);

  const avgFocus =
    history.length > 0
      ? Math.round(
          history.reduce((s, h) => s + h.focusScore, 0) / history.length,
        )
      : 0;
  const strongestSubject = inputs?.subjects.reduce(
    (best, s) =>
      s.confidence === "high" || (!best && s.confidence === "medium")
        ? s
        : best,
    null as Subject | null,
  );
  const weakestSubject = inputs?.subjects.reduce(
    (worst, s) =>
      s.confidence === "low" || (!worst && s.confidence === "medium")
        ? s
        : worst,
    null as Subject | null,
  );

  const consistencyPct =
    history.length > 0 ? Math.min(100, Math.round((streak / 7) * 100)) : 0;

  const highRiskAreas = Object.entries(avoidance)
    .filter(([, v]) => v >= 2)
    .map(([k]) => k);

  const insights: string[] = [];
  if (history.length > 2 && avgFocus < 50)
    insights.push(
      "Your effort is inconsistent. Low focus scores across sessions.",
    );
  if (highRiskAreas.length > 0)
    insights.push(
      `You are avoiding ${highRiskAreas[0]}. This will cost you marks.`,
    );
  if (inputs && (inputs.sleepHours ?? 7) < 6)
    insights.push("Sleep is your biggest limiting factor right now.");
  if (history.length > 1)
    insights.push("You planned more than you executed. Close the gap.");
  if (insights.length === 0)
    insights.push("No session data yet. Complete sessions to see patterns.");

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <p
          style={{
            color: "#561C24",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            fontWeight: 600,
          }}
          className="uppercase mb-1"
        >
          Review
        </p>
        <h2
          style={{
            color: "#E8D8C4",
            fontSize: "clamp(1.4rem,3vw,2rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Weekly Review
        </h2>
        <p
          style={{ color: "#8B7A6A", fontSize: "0.88rem", marginTop: "0.3rem" }}
        >
          What the data says about how you actually worked.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-surface rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Summary
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Weekly Summary
              </h3>
            </div>
            <BarChart2 size={18} style={{ color: "#561C24" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Sessions Logged",
                value: String(history.length),
                color: "#561C24",
              },
              {
                label: "Avg Focus Score",
                value: avgFocus > 0 ? `${avgFocus}/100` : "N/A",
                color:
                  avgFocus >= 70
                    ? "#a09070"
                    : avgFocus >= 45
                      ? "#C7B7A3"
                      : "#6D2932",
              },
              {
                label: "Strongest Subject",
                value: strongestSubject?.name || "N/A",
                color: "#a09070",
              },
              {
                label: "Weakest Subject",
                value: weakestSubject?.name || "N/A",
                color: "#6D2932",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="inner-panel rounded-lg p-3">
                <p
                  style={{
                    color: "#8B7A6A",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                  }}
                  className="uppercase mb-1"
                >
                  {label}
                </p>
                <p style={{ color, fontWeight: 800, fontSize: "1.1rem" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Habit Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card-surface rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Habits
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Habit Tracking
              </h3>
            </div>
            <Clock size={18} style={{ color: "#C7B7A3" }} />
          </div>
          <div className="flex gap-2 mb-5">
            {DAY_SHORT.map((d, i) => {
              const dayTs = Date.now() - (6 - i) * 86400000;
              const dayStr = new Date(dayTs).toDateString();
              const active = history.some(
                (h) => new Date(h.date).toDateString() === dayStr,
              );
              return (
                <div
                  key={d}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full h-8 rounded"
                    style={{
                      background: active
                        ? "rgba(86,28,36,0.3)"
                        : "rgba(109,41,50,0.25)",
                      border: active
                        ? "1px solid rgba(86,28,36,0.5)"
                        : "1px solid rgba(199,183,163,0.12)",
                    }}
                  />
                  <span style={{ color: "#8B7A6A", fontSize: "0.6rem" }}>
                    {d}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="inner-panel rounded-lg p-3">
              <p
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                }}
                className="uppercase mb-1"
              >
                Study Streak
              </p>
              <p
                style={{
                  color: streak > 0 ? "#561C24" : "#6B5C52",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                }}
              >
                {streak}d
              </p>
            </div>
            <div className="inner-panel rounded-lg p-3">
              <p
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                }}
                className="uppercase mb-1"
              >
                Consistency
              </p>
              <p
                style={{
                  color:
                    consistencyPct >= 60
                      ? "#a09070"
                      : consistencyPct >= 30
                        ? "#C7B7A3"
                        : "#6D2932",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                }}
              >
                {consistencyPct}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mistake Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card-surface rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Risk Areas
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Mistake Tracker
              </h3>
            </div>
            <AlertTriangle size={18} style={{ color: "#6D2932" }} />
          </div>
          {highRiskAreas.length > 0 ? (
            <div className="space-y-2">
              {highRiskAreas.map((area) => (
                <div
                  key={area}
                  className="inner-panel rounded-lg p-3 flex items-center justify-between"
                >
                  <span style={{ color: "#E8D8C4", fontSize: "0.85rem" }}>
                    {area}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      color: "#6D2932",
                      background: "rgba(109,41,50,0.12)",
                      border: "1px solid rgba(109,41,50,0.3)",
                    }}
                  >
                    HIGH RISK
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              data-ocid="review.empty_state"
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckSquare
                size={32}
                style={{
                  color: "rgba(199,183,163,0.12)",
                  marginBottom: "0.75rem",
                }}
              />
              <p style={{ color: "#6B5C52", fontSize: "0.83rem" }}>
                No high-risk areas detected yet.
              </p>
            </div>
          )}
        </motion.div>

        {/* Reality Insights */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card-surface rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                style={{
                  color: "#8B7A6A",
                  fontSize: "0.68rem",
                  letterSpacing: "0.15em",
                }}
                className="uppercase font-medium block mb-1"
              >
                Intelligence
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Reality Insights
              </h3>
            </div>
            <Flag size={18} style={{ color: "#a09070" }} />
          </div>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div
                key={ins}
                className="inner-panel rounded-lg p-3 flex items-start gap-3"
              >
                <span
                  style={{
                    color: "#6D2932",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    marginTop: "0.1rem",
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <p
                  style={{
                    color: "#E8D8C4",
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                  }}
                >
                  {ins}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── TAB NAVIGATION ──────────────────────────────────────────────────────────
type TabKey = "analysis" | "study" | "calendar" | "review";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "analysis", label: "Analysis", icon: <BarChart2 size={15} /> },
  { key: "study", label: "Study Mode", icon: <Zap size={15} /> },
  { key: "calendar", label: "Calendar", icon: <Calendar size={15} /> },
  { key: "review", label: "Review", icon: <TrendingUp size={15} /> },
];

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [globalResult, setGlobalResult] = useState<SimulationResult | null>(
    null,
  );
  const [globalInputs, setGlobalInputs] = useState<SimulationInputs | null>(
    null,
  );
  const [globalSubjects, setGlobalSubjects] = useState<Subject[]>([
    { id: "1", name: "Mathematics", confidence: "medium", weight: "high" },
    { id: "2", name: "Economics", confidence: "low", weight: "medium" },
    { id: "3", name: "English", confidence: "high", weight: "low" },
  ]);

  const handleResultGenerated = (r: SimulationResult, i: SimulationInputs) => {
    setGlobalResult(r);
    setGlobalInputs(i);
    setGlobalSubjects(i.subjects);
  };

  return (
    <div style={{ background: "rgba(7,2,4,0.95)", minHeight: "100vh" }}>
      <Toaster theme="dark" />

      {/* Header */}
      <header
        style={{
          background: "rgba(7,2,4,0.95)",
          borderBottom: "1px solid rgba(109,41,50,0.25)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span
                style={{
                  color: "#561C24",
                  fontSize: "0.65rem",
                  letterSpacing: "0.25em",
                  fontWeight: 700,
                }}
                className="uppercase"
              >
                Performative
              </span>
              {globalResult && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    color: RISK_COLORS[globalResult.burnoutRisk],
                    background: RISK_BG[globalResult.burnoutRisk],
                    border: `1px solid ${RISK_COLORS[globalResult.burnoutRisk]}40`,
                  }}
                >
                  {globalResult.burnoutRisk}
                </span>
              )}
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  data-ocid={`nav.${tab.key}.link`}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    color: activeTab === tab.key ? "#E8D8C4" : "#8B7A6A",
                    background:
                      activeTab === tab.key
                        ? "rgba(109,41,50,0.25)"
                        : "transparent",
                    border:
                      activeTab === tab.key
                        ? "1px solid rgba(109,41,50,0.5)"
                        : "1px solid transparent",
                    boxShadow:
                      activeTab === tab.key
                        ? "0 0 12px rgba(86,28,36,0.4), inset 0 0 8px rgba(86,28,36,0.1)"
                        : "none",
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-10 pb-24 md:pb-10">
        <AnimatePresence mode="wait">
          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnalysisTab
                onResultGenerated={handleResultGenerated}
                globalSubjects={globalSubjects}
                setGlobalSubjects={setGlobalSubjects}
              />
            </motion.div>
          )}
          {activeTab === "study" && (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StudyModeTab
                result={globalResult}
                inputs={globalInputs}
                globalSubjects={globalSubjects}
              />
            </motion.div>
          )}
          {activeTab === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarTab
                result={globalResult}
                inputs={globalInputs}
                globalSubjects={globalSubjects}
              />
            </motion.div>
          )}
          {activeTab === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ReviewTab
                result={globalResult}
                inputs={globalInputs}
                globalSubjects={globalSubjects}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center"
        style={{
          background: "rgba(7,2,4,0.97)",
          borderTop: "1px solid rgba(109,41,50,0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            data-ocid={`mobile_nav.${tab.key}.link`}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 cursor-pointer"
            style={{
              color: activeTab === tab.key ? "#E8D8C4" : "#6B5C52",
              background: "transparent",
              border: "none",
            }}
          >
            <span
              style={{ color: activeTab === tab.key ? "#561C24" : "#6B5C52" }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: activeTab === tab.key ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(109,41,50,0.25)",
          marginTop: "4rem",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-6 mb-16 md:mb-0 flex items-center justify-between">
          <span style={{ color: "#374151", fontSize: "0.75rem" }}>
            © {new Date().getFullYear()} Performative
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#374151",
              fontSize: "0.75rem",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#8B7A6A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#374151";
            }}
          >
            Built with ♥ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
