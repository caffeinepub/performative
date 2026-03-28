# Performative — Study Execution Section + Behavioral Features

## Current State
App has: Hero → Input (4 cards with subjects/weight/confidence, time, performance, mental state) → Loading overlay → Results dashboard (6 cards: Priority Breakdown, Score Projection, Effort Reality, Burnout Risk, Focus Score, Time Waste Analyzer) → Improvement Simulator → Reality Insights → Daily Study Plan → Streak Tracker → Terminal Summary → Action buttons.

`simulation.ts` exports Subject (with weight+confidence), SimulationInputs, SimulationResult (with focusScore, effectiveHours, wastedHours, insights, mustDo, shouldDo, burnoutRisk, scoreMin/Max, etc.).

App state machine: 'hero' | 'input' | 'loading' | 'results'. `lastInputs` is stored alongside `result` and passed to ResultsSection.

## Requested Changes (Diff)

### Add

**A. Study Execution Section** — Full section below the results dashboard cards area, before the terminal summary. Title: "STOP PERFORMING. START WORKING." Grid of 4 cards:

1. **Pomodoro Focus Timer** — Large card with circular SVG countdown timer. Focus 25min / Break 5min defaults. Adjustable 15-60min via input. Start/Pause/Reset. State label "FOCUS MODE" / "BREAK TIME". Pulsing border during focus (blue glow), softer amber during break. Audio alert toggle (use Web Audio API beep on completion, no external assets).

2. **Session Clock** — Displays current time (live). Total session time since first Start. Deep Work Timer: resets if user pauses more than 2 times in a session ("Discipline penalty applied"). Show uninterrupted focus streak in minutes.

3. **Task Execution Panel ("Do This Now")** — Pull top 3-5 tasks from `result.mustDo`. Show as checkable items. On check: subtle slide-out animation, next unchecked task comes into focus. Track completed count. Store avoidance: tasks that are never checked go to avoidance list in localStorage.

4. **Focus Integrity** — Starts at 100%. Drops 10% per pause (after first), 15% per task switch. Shows percentage meter. Label: >=80% "Solid Focus", 50-79% "Slipping", <50% "Performing, not working".

**B. Session Summary Popup** — After timer completes (focus session ends), show a modal-style overlay:
- "Session Report"
- Time studied, tasks completed, focus score
- One-line feedback based on focusIntegrity: >=80% → "You worked. Keep going.", 50-79% → "You were present, but inconsistent.", <50% → "This was not a work session."

**C. Brutal Mode Toggle** — Persistent toggle in top-right corner of ResultsSection header. When ON:
- Hides everything except: current task (top mustDo), Pomodoro timer, score projection
- Replaces section title with "DO THE WORK."
- Typography becomes ultra-minimal, direct
- Short directive texts: "Do this now.", "Timer running.", "Stop reading. Start working."
- On toggle off: everything restores smoothly

**D. One Decision Button** — "Tell Me What To Do" button inside Task Execution Panel:
- Selects the #1 mustDo subject automatically
- Highlights it
- Auto-starts the Pomodoro timer
- Shows "Working on: [subject]" in a focused minimal overlay

**E. Time Bleed Indicator** — Live counter during active timer sessions:
- Shows: "Planned: Xh | Actual focus: Xm | Bleed: Xm"
- Bleed = time elapsed when timer was paused
- "You've lost X minutes to nothing."
- Updates every second

**F. Avoidance Detector** — Reads localStorage avoidance data (tasks never clicked):
- If a subject appears unchecked across sessions: "You've avoided [subject] X times."
- Display in Reality Insights panel as an extra insight if avoidance data exists

**G. Finish Line Tracker** — Add to Score Projection card in the existing results grid:
- Below the existing score range, add: "You are [N] marks away from your goal."
- N = target (assume 75% or `inputs.pastPercentage + 10`, whichever is higher) - scoreMin
- If already above target: "You've cleared the threshold. Now widen the gap."

### Modify
- `ResultsSection`: Add Brutal Mode state, wrap lower content with conditional render. Add "STOP PERFORMING" section before terminal summary.
- Score Projection card: add Finish Line line.
- Reality Insights: surface avoidance data from localStorage.

### Remove
- Nothing.

## Implementation Plan
1. Create `src/frontend/src/StudyExecutionSection.tsx` with all 4 timer cards + session summary modal
2. Create `src/frontend/src/BrutalMode.tsx` minimal overlay component  
3. Update `App.tsx` ResultsSection to import and render StudyExecutionSection, add BrutalMode toggle, add Finish Line to score card
4. Update Reality Insights to check localStorage for avoidance data
5. All new code follows existing inline-style dark theme pattern
