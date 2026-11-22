# Plentarí — AI-Enabled Food Intelligence & Circular-Commerce Platform

> **Prove Beyond. Scale Beyond. Sustain Beyond.**  
> *Interactive MVP Prototype — IIPC 2026 (Team HMS)*

## Overview
**Plentarí** addresses the dual-sided information gap in local food systems—from pre-harvest demand uncertainty for farmers to late, reactive surplus listing by food merchants[cite: 1, 6]. Instead of discounting leftovers at closing time, Plentarí uses historical sales, weather signals, and local campus events to forecast surplus hours in advance and route food through human-approved pathways[cite: 1, 5, 7].

### Core Pathways
* **Order:** Connects planned upstream agricultural supply and regular meals with predictable demand[cite: 1, 6].
* **Rescue:** Activates proactive discounts (40–70% off) for predicted meal and ingredient surplus 2–4 hours before closing[cite: 1, 2, 3, 8].
* **Share:** Routes verified surplus to vetted community partners and NGOs within tracked capacity limits[cite: 1, 2, 3, 6].

---

## Key Prototype Features
* **Plentarí Market (Consumer PWA):** Mobile-first marketplace featuring `Order`, `Rescue`, and `Share` listings, countdown timers, Food Safety Passports (source, prep time, allergens, Halal verification), and single-use QR pickup passes[cite: 2, 15].
* **Plentarí Partner Workspace:** Merchant and farmer dashboard for logging supply, running interactive "what-if" AI surplus forecasts (weather + campus event signals), approving routing with Responsible AI safety gates, and managing QR pickup queues[cite: 2, 10, 12].
* **Share Reserve Tracker:** Real-time community partner capacity monitoring to prevent NGO over-allocation[cite: 3, 9].
* **Verified Impact Ledger:** Auditable sustainability and recovery metrics (`kg` food waste avoided, methane reduction, `PHP` value recovered) updated strictly upon QR-verified handoffs[cite: 2, 4, 5, 14].

---

## Tech Stack (Prototype)
* **Frontend:** React, TypeScript, Vite, Tailwind CSS[cite: 4, 16]
* **State & Simulation:** Client-side React state & `localStorage` persistence for zero-latency live pitch demonstrations
* **Target Production Architecture:** Next.js PWA, Python/FastAPI intelligence engine, and PostgreSQL Impact Ledger[cite: 4, 9]

---

## Running Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
