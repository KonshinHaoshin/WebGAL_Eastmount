# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebGAL is a web-based Visual Novel engine. This fork (WebGAL_Eastmount / "Dragonspring") extends the base engine with additional features including judgment/testimony systems, inventory management, manopedia (encyclopedia), and phone UI components.

## Commands

```bash
# Install dependencies (uses Yarn workspaces)
yarn install

# Build everything (parser first, then webgal)
yarn build

# Development mode
yarn dev

# Build/test individual packages
yarn parser:build          # Build parser package
yarn parser:test           # Run parser tests with vitest
yarn parser:test-coverage  # Run parser tests with coverage
yarn webgal:build          # Build webgal package
yarn webgal:dev            # Run webgal dev server on port 3000

# Lint webgal package
cd packages/webgal && yarn lint
```

## Architecture

### Monorepo Structure (Yarn Workspaces)

- **packages/parser** — Script parser library that converts WebGAL script syntax into executable scene data. Built with Rollup, outputs ES/CJS/UMD formats. Uses Chevrotain for parsing.
- **packages/webgal** — Main React application (the visual novel engine). Built with Vite + React 17 + Redux Toolkit.
- **packages/server** — Simple Express server for local debugging of WebGAL projects.
- **packages/yukimi** — Yukimi compiler tooling (ykmc.exe).

### Core Engine Architecture (packages/webgal)

**Entry Flow:**
1. `main.tsx` → initializes i18n, Redux store, renders `App.tsx`
2. `App.tsx` → composes all UI layers (Stage, Menu, Title, Backlog, etc.)
3. `initializeScript.ts` → fetches game config, loads start scene, initializes Pixi.js stage

**Core Modules (`src/Core/`):**
- `WebGAL.ts` / `webgalCore.ts` — Central singleton containing SceneManager, BacklogManager, AnimationManager, Gameplay, Events
- `Modules/scene.ts` — Scene state management with scene stack for call/return
- `Modules/perform/` — Performance (animation/effect) lifecycle management
- `controller/gamePlay/` — Script execution: `scriptExecutor.ts` runs sentences, `runScript.ts` dispatches to handlers, `nextSentence.ts` advances flow

**Script Execution Pipeline:**
1. Scene text fetched and parsed by `sceneParser` (from parser package)
2. `scriptExecutor` iterates through sentences, handles `when` conditions and variable interpolation
3. `runScript` dispatches to command handlers in `gameScripts/`
4. Handlers return `IPerform` objects describing animations/effects with duration and cleanup

**Game Script Commands (`src/Core/gameScripts/`):**
Each file implements a command type (say, bgm, changeFigure, setVar, choose, etc.). Commands return `IPerform` interface with:
- `performName`, `duration`, `isHoldOn`
- `stopFunction` for cleanup
- `blockingNext()` / `blockingAuto()` for flow control

**State Management (Redux Toolkit):**
- `stageReducer` — Current stage state (backgrounds, figures, text, BGM, effects, Live2D, inventory)
- `GUIReducer` — UI visibility states
- `userDataReducer` — User preferences and global variables
- `savesReducer` — Save/load game data

**Rendering Layers (`src/Stage/`, `src/UI/`):**
Z-index hierarchy:
- 1: Stage background
- 3–5: Pixi performances and figures
- 6: Textbox
- 8–10: Choices, control panel, quick save/load
- 11–12: Video, fullscreen performances
- 13–17: Title, Menu layers
- 19–20: Intro animation, global dialogs

### Parser Package (packages/parser)

Converts WebGAL script syntax to `ISentence` objects:
```
Speaker:Dialog text. -vocal.ogg -arg=value;
```

Key files:
- `sceneParser.ts` — Main entry, splits scene into sentences
- `scriptParser/scriptParser.ts` — Parses individual script lines
- `scriptParser/argsParser.ts` — Extracts arguments from script syntax
- `configParser/configParser.ts` — Parses game config.txt
- `styleParser/` — SCSS to CSS-in-JS conversion

### Animation System

Animations are PIXI.Ticker callbacks. "Transforms" are instant (0ms) animations. Internal transforms track cumulative effects per stage object key. Objects with active animations are locked from transform updates until animation completes.

## Code Conventions

- TypeScript with strict mode; path alias `@/*` maps to `src/*`
- ESLint with alloy config + prettier, max complexity 30
- Prettier: 120 char lines, 2-space indent, single quotes, trailing commas, LF line endings
- Redux slices follow `{name}Reducer.ts` / `{name}Interface.ts` pattern
- Chinese comments are common throughout the codebase

## Game Assets Structure

Games are loaded from `./game/` directory:
- `config.txt` — Game configuration
- `start.txt` — Entry scene script
- `animation/animationTable.json` — Custom animation definitions
- `userStyleSheet.css` — Custom styles
