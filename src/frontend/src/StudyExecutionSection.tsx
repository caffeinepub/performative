import {
  CheckSquare,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SimulationInputs, SimulationResult } from "./simulation";

function playBeep(frequency = 440, duration = 0.5) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    // Audio not available
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

interface SessionSummaryData {
  focusMinutes: number;
  tasksCompleted: number;
  integrity: number;
}

export default function StudyExecutionSection({
  result,
  inputs,
}: {
  result: SimulationResult;
  inputs: SimulationInputs;
}) {
  // --- Timer State ---
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [pauseCount, setPauseCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  // --- Session Clock State ---
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [deepWorkStart, setDeepWorkStart] = useState<Date | null>(null);
  const [bleedSeconds, setBleedSeconds] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [deepWorkElapsed, setDeepWorkElapsed] = useState(0);
  const bleedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // --- Tasks State ---
  const [tasks, setTasks] = useState<Array<{ name: string; done: boolean }>>(
    () => result.mustDo.slice(0, 5).map((name) => ({ name, done: false })),
  );
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);

  // --- Avoidance ---
  const [avoidanceDisplay, setAvoidanceDisplay] = useState<string | null>(null);

  // --- Summary Modal ---
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<SessionSummaryData>({
    focusMinutes: 0,
    tasksCompleted: 0,
    integrity: 100,
  });

  const totalDuration =
    timerMode === "focus" ? focusDuration * 60 : breakDuration * 60;
  const circumference = 2 * Math.PI * 54;
  const progress = timeLeft / totalDuration;
  const strokeDashoffset = circumference * (1 - progress);

  const integrity = Math.max(
    0,
    100 - (pauseCount > 1 ? (pauseCount - 1) * 12 : 0),
  );

  // Current time ticker
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Session elapsed ticker
  useEffect(() => {
    if (sessionStart) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionElapsed(
          Math.floor((Date.now() - sessionStart.getTime()) / 1000),
        );
      }, 1000);
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    }
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [sessionStart]);

  // Deep work elapsed ticker
  useEffect(() => {
    if (deepWorkStart && isRunning) {
      const t = setInterval(() => {
        setDeepWorkElapsed(
          Math.floor((Date.now() - deepWorkStart.getTime()) / 1000),
        );
      }, 1000);
      return () => clearInterval(t);
    }
  }, [deepWorkStart, isRunning]);

  // Bleed tracker — accumulates when paused and session started
  useEffect(() => {
    if (sessionStart && !isRunning) {
      bleedIntervalRef.current = setInterval(() => {
        setBleedSeconds((p) => p + 1);
      }, 1000);
    } else {
      if (bleedIntervalRef.current) clearInterval(bleedIntervalRef.current);
    }
    return () => {
      if (bleedIntervalRef.current) clearInterval(bleedIntervalRef.current);
    };
  }, [sessionStart, isRunning]);

  // Main timer countdown
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (soundEnabled) playBeep(timerMode === "focus" ? 440 : 880);

          if (timerMode === "focus") {
            // session just ended
            const focusMin = focusDuration;
            setFocusSeconds((fs) => fs + focusDuration * 60);
            setSessionCount((c) => c + 1);
            setSummaryData({
              focusMinutes: focusMin,
              tasksCompleted: doneCount,
              integrity,
            });
            setShowSummary(true);
            setTimerMode("break");
            setIsRunning(false);
            setDeepWorkStart(null);
            return breakDuration * 60;
          }
          setTimerMode("focus");
          setIsRunning(false);
          return focusDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isRunning,
    timerMode,
    focusDuration,
    breakDuration,
    soundEnabled,
    doneCount,
    integrity,
  ]);

  // Load avoidance from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("performative_avoidance");
    if (raw) {
      const avoidance: Record<string, number> = JSON.parse(raw);
      const sorted = Object.entries(avoidance).sort(
        (a, b) => (b[1] as number) - (a[1] as number),
      );
      const top = sorted[0];
      if (top && (top[1] as number) >= 2) {
        setAvoidanceDisplay(`You've avoided ${top[0]} ${top[1]} times.`);
      }
    }
  }, []);

  // Track avoidance on unmount
  useEffect(() => {
    return () => {
      const raw = localStorage.getItem("performative_avoidance") || "{}";
      const avoidance: Record<string, number> = JSON.parse(raw);
      for (const t of tasks) {
        if (!t.done) {
          avoidance[t.name] = (avoidance[t.name] || 0) + 1;
        }
      }
      localStorage.setItem("performative_avoidance", JSON.stringify(avoidance));
    };
  }, [tasks]);

  const handleStartPause = useCallback(() => {
    if (!sessionStart) {
      setSessionStart(new Date());
    }
    if (isRunning) {
      setPauseCount((p) => p + 1);
      setDeepWorkStart(null);
    } else {
      setDeepWorkStart(new Date());
      setDeepWorkElapsed(0);
    }
    setIsRunning((r) => !r);
  }, [isRunning, sessionStart]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimerMode("focus");
    setTimeLeft(focusDuration * 60);
    setDeepWorkStart(null);
  }, [focusDuration]);

  const handleFocusDurationChange = useCallback(
    (val: number) => {
      const clamped = Math.max(15, Math.min(60, val));
      setFocusDuration(clamped);
      if (!isRunning && timerMode === "focus") setTimeLeft(clamped * 60);
    },
    [isRunning, timerMode],
  );

  const handleAutoStart = useCallback(() => {
    const first = tasks.find((t) => !t.done);
    if (first) {
      setActiveTask(first.name);
      if (!sessionStart) setSessionStart(new Date());
      if (!isRunning) {
        setIsRunning(true);
        setDeepWorkStart(new Date());
        setDeepWorkElapsed(0);
      }
    }
  }, [tasks, sessionStart, isRunning]);

  const handleTaskCheck = useCallback((index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: true } : t)),
    );
    setDoneCount((c) => c + 1);
  }, []);

  const bleedMinutes = Math.floor(bleedSeconds / 60);
  const bleedSecs = bleedSeconds % 60;
  const focusMinutes = Math.floor(focusSeconds / 60);
  const plannedMinutes = Math.round(inputs.studyHours * 60);

  const integrityColor =
    integrity >= 80 ? "#a09070" : integrity >= 50 ? "#C7B7A3" : "#6D2932";
  const integrityLabel =
    integrity >= 80
      ? "Solid Focus"
      : integrity >= 50
        ? "Slipping"
        : "Performing, not working";

  const timerColor = timerMode === "focus" ? "#561C24" : "#C7B7A3";

  const sessionFeedback =
    integrity >= 80
      ? "You worked. Keep going."
      : integrity >= 50
        ? "You were present, but inconsistent."
        : "This was not a work session.";

  return (
    <>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-10 mb-6"
        data-ocid="execution.section"
      >
        <p
          style={{
            color: "#561C24",
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
          className="uppercase mb-2"
        >
          Execution Mode
        </p>
        <h2
          style={{
            color: "#E8D8C4",
            fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Stop Performing. Start Working.
        </h2>
        <p
          style={{ color: "#8B7A6A", fontSize: "0.88rem", marginTop: "0.3rem" }}
        >
          The analysis is done. Now execute.
        </p>
      </motion.div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Pomodoro Focus Timer */}
        <motion.div
          animate={{
            boxShadow:
              isRunning && timerMode === "focus"
                ? [
                    "0 0 0px rgba(86,28,36,0)",
                    "0 0 22px rgba(86,28,36,0.35)",
                    "0 0 0px rgba(86,28,36,0)",
                  ]
                : "0 0 0px rgba(86,28,36,0)",
          }}
          transition={{
            duration: 2,
            repeat:
              isRunning && timerMode === "focus" ? Number.POSITIVE_INFINITY : 0,
          }}
          className="card-surface rounded-xl p-6"
          data-ocid="execution.timer.card"
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
                {sessionCount > 0
                  ? `Session ${sessionCount + 1}`
                  : "Focus Session"}
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Focus Timer
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-ocid="execution.sound.toggle"
                onClick={() => setSoundEnabled((s) => !s)}
                style={{
                  color: soundEnabled ? "#561C24" : "#6B5C52",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>

          {/* SVG Circle Timer */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                aria-label="Focus timer"
              >
                <title>Focus timer</title>
                {/* Background track */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="rgba(109,41,50,0.25)"
                  strokeWidth="6"
                />
                {/* Progress arc */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 70 70)"
                  style={{
                    transition: "stroke-dashoffset 1s linear, stroke 0.3s",
                  }}
                />
              </svg>
              {/* Center text */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ pointerEvents: "none" }}
              >
                <span
                  style={{
                    color: "#E8D8C4",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
                <span
                  style={{
                    color: timerColor,
                    fontSize: "0.6rem",
                    letterSpacing: "0.15em",
                    fontWeight: 600,
                    marginTop: "2px",
                  }}
                  className="uppercase"
                >
                  {timerMode === "focus" ? "Focus Mode" : "Break Time"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                data-ocid="execution.timer.toggle"
                onClick={handleStartPause}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  color: isRunning ? "#C7B7A3" : "#561C24",
                  border: `1px solid ${isRunning ? "rgba(199,183,163,0.4)" : "rgba(86,28,36,0.4)"}`,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isRunning
                    ? "rgba(199,183,163,0.08)"
                    : "rgba(86,28,36,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                data-ocid="execution.timer.reset"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  color: "#8B7A6A",
                  border: "1px solid rgba(109,41,50,0.4)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6B5C52";
                  e.currentTarget.style.color = "#C7B7A3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(199,183,163,0.12)";
                  e.currentTarget.style.color = "#8B7A6A";
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>

            {/* Duration adjust */}
            <div className="flex items-center gap-2 mt-3">
              <span style={{ color: "#6B5C52", fontSize: "0.75rem" }}>
                Focus:
              </span>
              <input
                type="number"
                min={15}
                max={60}
                value={focusDuration}
                onChange={(e) =>
                  handleFocusDurationChange(Number(e.target.value))
                }
                data-ocid="execution.timer.input"
                className="w-14 text-center rounded px-2 py-1 text-sm"
                style={{
                  background: "rgba(86,28,36,0.1)",
                  border: "1px solid rgba(109,41,50,0.4)",
                  color: "#E8D8C4",
                  outline: "none",
                }}
              />
              <span style={{ color: "#6B5C52", fontSize: "0.75rem" }}>min</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Session Clock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="card-surface rounded-xl p-6"
          data-ocid="execution.clock.card"
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
                Live Tracking
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Session Clock
              </h3>
            </div>
            <Clock size={16} style={{ color: "#561C24" }} />
          </div>

          <div className="space-y-4">
            {/* Current time */}
            <div className="inner-panel rounded-lg p-3 flex items-center justify-between">
              <span style={{ color: "#8B7A6A", fontSize: "0.78rem" }}>Now</span>
              <span
                style={{
                  color: "#E8D8C4",
                  fontWeight: 700,
                  fontSize: "1rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* Session time */}
            <div className="inner-panel rounded-lg p-3 flex items-center justify-between">
              <span style={{ color: "#8B7A6A", fontSize: "0.78rem" }}>
                Session time
              </span>
              <span
                style={{
                  color: sessionStart ? "#a09070" : "#6B5C52",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {sessionStart ? formatDuration(sessionElapsed) : "Not started"}
              </span>
            </div>

            {/* Deep work streak */}
            <div className="inner-panel rounded-lg p-3 flex items-center justify-between">
              <span style={{ color: "#8B7A6A", fontSize: "0.78rem" }}>
                Deep work streak
              </span>
              <span
                style={{
                  color: deepWorkStart && isRunning ? "#561C24" : "#6B5C52",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {deepWorkStart && isRunning
                  ? formatDuration(deepWorkElapsed)
                  : "—"}
              </span>
            </div>

            {/* Time Bleed Indicator */}
            <div
              className="rounded-lg p-3"
              style={{
                border: "1px solid rgba(109,41,50,0.25)",
                background: "rgba(7,2,4,0.7)",
              }}
            >
              <p
                style={{
                  color: "#6B5C52",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                }}
                className="uppercase mb-2"
              >
                Time Bleed
              </p>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: "#8B7A6A" }}>Planned</span>
                <span style={{ color: "#C7B7A3" }}>{plannedMinutes}m</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: "#8B7A6A" }}>Focus</span>
                <span style={{ color: "#a09070" }}>{focusMinutes}m</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#8B7A6A" }}>Bleed</span>
                <span
                  style={{ color: bleedSeconds > 0 ? "#6D2932" : "#6B5C52" }}
                >
                  {bleedMinutes}m {bleedSecs}s
                </span>
              </div>
              {bleedSeconds > 300 && (
                <p
                  style={{
                    color: "#6D2932",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  You've lost {bleedMinutes}m {bleedSecs}s to nothing.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Task Execution Panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-surface rounded-xl p-6"
          data-ocid="execution.tasks.card"
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
                Priority Queue
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Do This Now
              </h3>
            </div>
            <CheckSquare size={16} style={{ color: "#a09070" }} />
          </div>

          {/* Task List */}
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {tasks
                .filter((t) => !t.done)
                .slice(0, 5)
                .map((task, i) => (
                  <motion.div
                    key={task.name}
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-default group"
                    style={{
                      border: "1px solid rgba(109,41,50,0.25)",
                      background:
                        activeTask === task.name
                          ? "rgba(86,28,36,0.05)"
                          : "transparent",
                    }}
                    data-ocid={`execution.tasks.item.${i + 1}`}
                  >
                    <button
                      type="button"
                      data-ocid={`execution.tasks.checkbox.${i + 1}`}
                      onClick={() =>
                        handleTaskCheck(
                          tasks.findIndex((t) => t.name === task.name),
                        )
                      }
                      className="flex-shrink-0 w-4 h-4 rounded-sm border transition-all duration-150 cursor-pointer"
                      style={{
                        border: "1px solid #561C24",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(86,28,36,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    />
                    <span
                      style={{
                        color: activeTask === task.name ? "#561C24" : "#E8D8C4",
                        fontSize: "0.85rem",
                        flex: 1,
                      }}
                    >
                      {task.name}
                    </span>
                    {activeTask === task.name && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#561C24" }}
                      />
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>

            {tasks.every((t) => t.done) && (
              <p
                style={{
                  color: "#a09070",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  padding: "1rem 0",
                }}
              >
                All priority tasks cleared.
              </p>
            )}
          </div>

          {/* Auto-start button */}
          {activeTask ? (
            <div
              className="rounded-lg px-4 py-2.5 mb-3"
              style={{
                border: "1px solid rgba(86,28,36,0.3)",
                background: "rgba(86,28,36,0.06)",
              }}
            >
              <p
                style={{
                  color: "#C7B7A3",
                  fontSize: "0.7rem",
                  marginBottom: "2px",
                }}
              >
                Working on
              </p>
              <p
                style={{
                  color: "#561C24",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {activeTask}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            data-ocid="execution.tasks.primary_button"
            onClick={handleAutoStart}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: "#E8D8C4",
              border: "1px solid rgba(86,28,36,0.35)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(86,28,36,0.1)";
              e.currentTarget.style.borderColor = "rgba(86,28,36,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(86,28,36,0.35)";
            }}
          >
            Tell Me What To Do
          </button>

          {/* Avoidance display */}
          {avoidanceDisplay && (
            <p
              style={{
                color: "#C7B7A3",
                fontSize: "0.78rem",
                marginTop: "0.75rem",
              }}
              data-ocid="execution.tasks.error_state"
            >
              ⚠ {avoidanceDisplay}
            </p>
          )}
        </motion.div>

        {/* Card 4: Focus Integrity */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="card-surface rounded-xl p-6"
          data-ocid="execution.integrity.card"
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
                Session Quality
              </span>
              <h3
                style={{ color: "#E8D8C4", fontWeight: 700, fontSize: "1rem" }}
              >
                Focus Integrity
              </h3>
            </div>
            <Shield size={16} style={{ color: integrityColor }} />
          </div>

          {/* Large percentage */}
          <motion.div
            key={integrity}
            initial={{ opacity: 0.6, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              color: integrityColor,
              fontSize: "3.5rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              marginBottom: "0.35rem",
            }}
          >
            {integrity}%
          </motion.div>

          <p
            style={{
              color: integrityColor,
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            {integrityLabel}
          </p>

          {/* Progress bar */}
          <div
            className="h-2 rounded-full mb-4"
            style={{ background: "rgba(109,41,50,0.25)" }}
          >
            <motion.div
              animate={{ width: `${integrity}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: integrityColor }}
            />
          </div>

          <div className="space-y-3">
            <p
              style={{ color: "#8B7A6A", fontSize: "0.8rem", lineHeight: 1.5 }}
            >
              Every pause costs you focus capital.
            </p>
            <div className="inner-panel rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span style={{ color: "#6B5C52", fontSize: "0.75rem" }}>
                  Pauses
                </span>
                <span
                  style={{
                    color: pauseCount > 2 ? "#6D2932" : "#C7B7A3",
                    fontWeight: 700,
                  }}
                >
                  {pauseCount}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span style={{ color: "#6B5C52", fontSize: "0.75rem" }}>
                  Sessions
                </span>
                <span style={{ color: "#C7B7A3", fontWeight: 700 }}>
                  {sessionCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Zap
              size={14}
              style={{
                color: "#6B5C52",
                display: "inline",
                marginRight: "6px",
              }}
            />
            <span style={{ color: "#6B5C52", fontSize: "0.75rem" }}>
              {pauseCount === 0
                ? "No interruptions recorded."
                : `${pauseCount} interruption${pauseCount > 1 ? "s" : ""} recorded this session.`}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Session Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.8)" }}
            data-ocid="execution.modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="card-surface rounded-xl p-8 max-w-sm w-full mx-4"
              style={{ border: "1px solid rgba(109,41,50,0.4)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  style={{
                    color: "#E8D8C4",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                  }}
                >
                  Session Report
                </h3>
                <button
                  type="button"
                  data-ocid="execution.modal.close_button"
                  onClick={() => setShowSummary(false)}
                  style={{
                    color: "#6B5C52",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                className="h-px mb-6"
                style={{ background: "rgba(109,41,50,0.25)" }}
              />

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span style={{ color: "#8B7A6A", fontSize: "0.85rem" }}>
                    Time studied
                  </span>
                  <span style={{ color: "#E8D8C4", fontWeight: 700 }}>
                    {summaryData.focusMinutes}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#8B7A6A", fontSize: "0.85rem" }}>
                    Tasks completed
                  </span>
                  <span style={{ color: "#E8D8C4", fontWeight: 700 }}>
                    {summaryData.tasksCompleted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#8B7A6A", fontSize: "0.85rem" }}>
                    Focus integrity
                  </span>
                  <span style={{ color: integrityColor, fontWeight: 700 }}>
                    {summaryData.integrity}%
                  </span>
                </div>
              </div>

              <div
                className="rounded-lg p-4 mb-6"
                style={{
                  background: "rgba(7,2,4,0.7)",
                  border: "1px solid rgba(109,41,50,0.25)",
                }}
              >
                <p
                  style={{
                    color: "#C7B7A3",
                    fontSize: "0.85rem",
                    lineHeight: 1.55,
                  }}
                >
                  {sessionFeedback}
                </p>
              </div>

              <button
                type="button"
                data-ocid="execution.modal.confirm_button"
                onClick={() => setShowSummary(false)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  color: "#561C24",
                  border: "1px solid rgba(86,28,36,0.35)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(86,28,36,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
