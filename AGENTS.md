# AGENTS.md

## Project

Maestro IA: Adaptive study assistant/professor for ADHD + burnout recovery. Uses Ollama local LLM to create schedules, monitor progress, enforce study sessions, and validate skills.

**User context**: TDAH, burnout, employer demands courses + skill validation. Needs structure, not more overwhelm.

## Tech Stack

- **LLM**: Qwen2.5-coder:3b (local via Ollama)
- **Interface**: HTML/CSS/JS (single file, no external dependencies)
- **Runtime**: Ollama API (local)

## Core Design Principles

1. **Dynamic intervals, not fixed 25/5** - Adapt to energy, task type, time of day, history
2. **Work WITH ADHD neurobiology** - Time blindness, executive fatigue, avoidance cycles, hyperfocus traps
3. **Restore, don't exhaust** - Active breaks over passive scrolling
4. **Measure starts, not hours** - "Successful initiations" as primary metric
5. **Schedule, don't overwhelm** - Break big goals into daily actionable steps

## Learning Paths (Employer Requirements)

| Tool | Type | Priority |
|------|------|----------|
| RPG Maker XP/MV | Game dev | Learn |
| Godot 2D | Game dev | Learn |
| Apache NiFi 2.10.00 + Docker + Impala | Data engineering | Learn + Validate |
| English validation | Language | Validate |

## Interval Modes

| Mode | Work | Break | Use Case |
|------|------|-------|----------|
| Hard Start | 5-10 min | 2-3 min | Low activation, avoidance |
| Regular Study | 15-20 min | 5 min | Reading, exercises |
| Deep Work | 35-45 min | 8-10 min | Writing, programming |
| Low Energy | 10-15 min | 5-8 min | Afternoon, fatigue |
| Reverse Pomodoro | 2-5 min | 10-15 min | Extreme initiation block |

## Key Features

- **Distraction Notepad**: Capture intrusive thoughts, prompt return to task
- **Micro-step restart**: After interruption, ask for next specific micro-step
- **Mandatory rest timer**: Prevent burnout by enforcing breaks
- **Hyperfocus protection**: Alert 5 min before end; "Ride the Wave" extension
- **Energy check**: Slider 1-5 before each interval; adjust duration
- **Hydration/movement reminders**: Every 2 cycles
- **Schedule planner**: Break courses into weekly/daily tasks
- **Skill validation tracker**: Mark skills as learned/in-progress/blocked

## File Structure

- `index.html` - Single file with embedded CSS/JS (vanilla JS, no frameworks)
- `README.md` - Usage instructions

## Important Notes

- Code must be functional immediately in browser
- No complex external dependencies
- Include comments explaining psychological rationale
- Prioritize clarity over cleverness
- Start with Pomodoro core, add schedule planner after
