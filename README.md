# BoundaryFlow Cross-Device System Simulator

**A mobile-app, restricted-wearable, and authorized-console safety system demonstrated through an interactive cross-device web simulator.**

> A restraining order should not remain a silent document. BoundaryFlow turns it into a dynamic, perceivable, and traceable safety boundary.

## Overview

BoundaryFlow is an app-and-wearable safety system demonstrated through an interactive cross-device web simulator.

BoundaryFlow is not a conventional website or web dashboard. The product model is a coordinated safety system made of a Protected Person App, a Restricted Person Wearable, an Authorized Management Console, and safety engines responsible for boundary interpretation, friction, relay, trace, and protective-zone configuration.

The OpenAI Build Week artifact in this repository is an **interactive cross-device web-based system simulator**. It uses one local simulated case and one shared boundary state to demonstrate how the App, Wearable, Boundary Field, Console, event timeline, and notification relay respond together.

## The Problem

A legal boundary can exist on paper while remaining difficult to perceive in the moment:

- A protected person may not become aware of an approach until it is already close.
- A restricted person may receive no immediate physical feedback when approaching a prohibited boundary.
- Event traces and authorized management response may begin only after escalation.
- A legal document alone does not create a perceivable, real-time safety boundary.

BoundaryFlow explores how earlier, synchronized feedback might make a boundary more understandable and traceable. It does **not** claim to guarantee prevention, determine guilt, or replace emergency services.

## The Product Model

### Protected Person App

- Current safety state and relative distance
- Contextual safety guidance
- Simulated Silent Notify and One-Tap Help actions
- Event-note and event-log interactions
- No exposed precise restricted-person location
- No reverse location exposure of the protected person

### Restricted Person Wearable

- Online and offline state
- Pairing and battery status
- Warning level
- Soft, repeated, strong, and continuous vibration states
- Visual indicator and simulated audio-alert state
- Tamper-suspected and tamper-confirmed states
- Compliance and last-synchronization state

The wearable is represented as a required functional system surface, not as a decorative product image.

### Authorized Management Console

- Case summary and synchronized boundary level
- Wearable and case status
- Event timeline
- Notification relay
- Relative event trace without a real map
- Simulated evidence logging

### Dynamic Boundary and Safety Engines

The future product model includes the Boundary Engine, Friction Engine, Safety Relay Engine, Violation Trace Engine, and Protective Zone Configuration Engine. In v0.1, the simulator represents their coordinated behavior through:

- Relative-distance simulation
- Zone and state transitions
- Synchronized App, Wearable, Console, timeline, and relay state
- Offline, tamper, escalation, retreat, and resolution flows
- No real map or precise location exposure

## Four Boundary Zones

The implemented slider ranges from 20 m to 700 m. Its current thresholds are:

| Boundary level | Implemented relative-distance range | System meaning |
|---|---:|---|
| Normal | 501–700 m | Outside the active boundary layers |
| Awareness | 301–500 m | Outer awareness boundary entered |
| Caution | 151–300 m | Increased proximity awareness |
| Restricted | 51–150 m | Restricted boundary entered |
| Critical | 20–50 m | Critical proximity to the protected core |

The simulator maps relative distance into a boundary level and synchronizes every visible system surface. Smaller values move the restricted-device marker inward; larger values move it outward.

## Main Demo Flow

1. Start **Auto Demo**.
2. Observe relative distance decrease and the marker move toward the protected core.
3. Watch the zones escalate through Awareness, Caution, Restricted, and Critical.
4. Observe the Protected App guidance and actions change.
5. Observe the Restricted Wearable warning, vibration, indicator, and audio states.
6. Review synchronized Console, timeline, notification-relay, and simulated evidence updates.
7. Trigger Offline or Tamper scenarios when demonstrating incident handling.
8. Continue through Retreat and Resolved, or use **Resolve Incident**.

## Key Features

- Synchronized cross-device simulation
- Four-zone escalation and distance-driven state transitions
- Auto Demo with Pause, Resume, and Reset
- Manual relative-distance control
- Protected-person App simulation
- Restricted Wearable state simulation
- Authorized Console, event timeline, and notification relay
- Offline and Restore Online scenarios
- Tamper Suspected and Tamper Confirmed scenarios
- Incident resolution
- Silent Notify and One-Tap Help interactions
- Responsive desktop and windowed layouts
- Local mock case and event data
- No precise location or reverse location exposure

## Safety and Ethical Boundaries

- All people, devices, cases, distances, events, notifications, and evidence records are simulated.
- No live GPS, real map, precise residence, or protected-person location is used or displayed.
- The restricted-person surface never receives the protected person’s precise location or navigation guidance toward them.
- There is no public tracking, vigilante use, or private creation of monitoring targets.
- There is no court, law-enforcement, monitoring-center, or emergency-service integration.
- Silent Notify and One-Tap Help do not deliver real alerts or emergency requests.
- The simulator does not determine guilt, criminal liability, or legal compliance.
- The simulator does not perform predictive policing or automated risk adjudication.
- Judicial or otherwise authorized activation is required in the intended future product model.
- No claim is made that simulated evidence would be legally admissible.

The simulator responds to distance, direction, persistence, device state, and boundary conditions. It does not judge people or determine criminal liability.

BoundaryFlow v0.1 is not a substitute for emergency services, legal advice, or a deployed personal-safety system. Real-world development would require human legal, privacy, security, accessibility, safety, and operational review.

See [Safety Boundaries](docs/SAFETY_BOUNDARIES.md) for the complete policy statement.

## What Is Real in v0.1

- Working cross-surface synchronization
- Working relative-distance simulation
- Working boundary-state transitions
- Working Protected App state and actions
- Working Wearable visual state
- Working Console state
- Working event timeline and notification relay
- Working Offline and Tamper scenarios
- Working Auto Demo controls
- Working responsive interface
- Working local mock data

## Current Limitations

These are explicit v0.1 boundaries, not hidden production capabilities:

- No manufactured wearable
- No live GPS or cellular device connection
- No court, law-enforcement, monitoring-center, or emergency-service integration
- No real notification delivery
- No real evidence chain or admissibility claim
- No identity verification
- No production authentication
- No backend or database
- No legal or operational safety certification
- No live GPT-5.6 runtime
- Simulator data only

## How GPT-5.6 and Codex Were Used

### Alex — Original Concept, Product Direction, and Final Decisions

Alex originated the BoundaryFlow concept, identified the problem that restraining orders can remain silent until a violation has escalated, and defined the idea of a dynamic and perceivable safety boundary. Alex defined the Protected App, Restricted Wearable, Authorized Console, and engine architecture; required the wearable to remain a functional system surface; established the no-reverse-location-exposure rule, four boundary zones, escalation logic, ethical and legal boundaries, MVP scope, and necessary interactions. Alex supplied and reviewed the original visual direction, reviewed simulator behavior and visual quality, and made all final product decisions and approvals.

**Alex originated the concept, defined the product boundaries, directed the product vision, and approved every major design and implementation decision.**

### GPT-5.6 — Product Reasoning, Safety Architecture, Visual Translation, and Implementation Specification

GPT-5.6 translated Alex’s direction into a formal product architecture and kept the future safety system distinct from the Build Week web simulator. It helped define the responsibilities of the App, Wearable, Console, Boundary Engine, Friction Engine, Violation Trace Engine, Safety Relay Engine, and Protective Zone Configuration Engine; the four-zone model; the Normal → Awareness → Caution → Restricted → Critical → Retreat → Resolved flow; the safety grammar and ethical constraints; cross-device synchronization; and the rule that the restricted surface never exposes the protected person’s precise location.

GPT-5.6 also translated the visual boards into implementable interface and interaction specifications, wrote detailed engineering and correction instructions for Codex, reviewed screenshots and demo recordings, identified layout and synchronization issues, refined the sonar visualization and responsive behavior, and helped prepare submission language while preserving honest simulator limitations.

**GPT-5.6 translated the original concept into the product architecture, safety grammar, cross-device interaction model, visual system, and implementation specifications.**

GPT-5.6 is not embedded as a live runtime model inside the deployed simulator. It does not monitor real users, perform live risk analysis, or operate the deployed artifact.

### Codex — Software Engineering, Testing, and Deployment Preparation

Codex was used inside VS Code as the software-engineering execution layer. It structured the Next.js application; implemented the React and TypeScript surfaces; built the SVG/CSS Boundary Field and sonar sweep; synchronized distance, App, Wearable, Console, timeline, and relay state; implemented Auto Demo and incident controls; modeled wearable connection, vibration, warning, audio, tamper, compliance, and synchronization states; created local mock events; fixed hydration, layout, cropping, spacing, and responsive issues; and ran linting, production builds, browser checks, responsive checks, and interaction verification.

**Codex converted the product specification into a tested, interactive, deployable cross-device system simulator.**

The implementation was iteratively reviewed and directed by Alex, with GPT-5.6 providing product, safety, visual, and interaction evaluation throughout development.

### Collaboration Model

```text
Alex
  ↓
Original concept, product boundaries, safety principles, and final decisions

GPT-5.6
  ↓
Product architecture, safety grammar, visual translation, interaction specifications, and review

Codex
  ↓
Software implementation, debugging, testing, validation, and deployment preparation

BoundaryFlow Cross-Device System Simulator
```

This project was not produced through a single prompt. It emerged through an iterative loop of human direction, GPT-5.6 product reasoning, Codex implementation, testing, visual review, and correction.

See [AI Contributions](docs/AI_CONTRIBUTIONS.md) for the extended disclosure.

## Tech Stack

- Next.js 15
- React 19
- TypeScript 5
- CSS
- Programmatic SVG
- Browser-local React state and mock data
- ESLint
- Playwright Core with local Microsoft Edge for verification scripts

No Tailwind, Framer Motion, backend service, database, external API, or runtime AI dependency is used.

## Run Locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Verification

```bash
npm run test:final
npm run lint
npm run build
npm run start
```

`test:final` uses Playwright Core and the locally installed Microsoft Edge executable used during development. The deployed simulator itself does not require Playwright.

## Deployment

BoundaryFlow is prepared for Vercel import as a standard Next.js project:

- Framework preset: Next.js
- Build command: `npm run build`
- No API keys required
- No environment variables required for v0.1
- No backend or database required
- No login required

The repository is deployment-ready, but this README does not claim a live deployment URL until one is confirmed.

## Repository Structure

```text
src/app/                        Next.js App Router source, styles, and icon
scripts/                        Browser-based smoke, visual, geometry, and final checks
docs/                           AI contribution, Build Week, and safety documentation
01_preconstruction_boards/     Original visual reference boards
02_generated_asset_packs/      Curated visual reference sheets
artifacts/                      Local verification screenshots; excluded from release commits
package.json                    Scripts and dependency manifest
package-lock.json               Reproducible npm dependency lock
```

The reference boards and curated asset sheets are source materials. Complete sheets are not embedded into the simulator; the working interface uses reusable React, SVG, and CSS surfaces.

## Build Week

Built for OpenAI Build Week 2026 as an exploration of how GPT-5.6 and Codex can collaborate across product reasoning, safety architecture, cross-device interaction design, software engineering, testing, and deployment preparation.

The project demonstrates not only what Codex can implement, but how GPT-5.6 can help define a new product and safety grammar for Codex to build.

See [Build Week Submission Notes](docs/BUILD_WEEK_SUBMISSION.md).

## Credits

**Original concept, product direction, and final approval:** Alex  
**Product reasoning, safety architecture, visual translation, and implementation specification:** GPT-5.6  
**Software engineering, debugging, testing, and deployment preparation:** Codex  
**Created through iterative Alex × GPT-5.6 × Codex collaboration**

---

**Release statement:** BoundaryFlow v0.1 is a deployable interactive simulator of a future app, restricted-wearable, authorized-console, and safety-engine system.
