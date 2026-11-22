import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

const letterheadDark = "/plentari-letterhead-dark.png"
const letterheadLight = "/plentari-letterhead-light.png"
const markDark = "/plentari-mark-dark.png"
const markLight = "/plentari-mark-light.png"

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = "dashboard" | "market" | "passport" | "impact"
type Notify = (message: string) => void
type Theme = "light" | "dark"
type Language = "en" | "fil"
type Preferences = {
  theme: Theme
  language: Language
  toggleTheme: () => void
  toggleLanguage: () => void
}
type DemoRole = "consumer" | "partner"
type ReservationStatus = "Pending" | "Ready" | "Collected" | "QR-Verified"

type LiveReservation = {
  id: string
  consumer: string
  item: string
  qty: number
  price: number
  pickupWindow: string
  status: ReservationStatus
  kgPerUnit: number
  source: string
  createdAt: number
}

type LiveListing = {
  id: string
  name: string
  qty: number
  originalQty: number
  price: number
  rescuePrice: number
  route: "Order" | "Rescue" | "Share"
  source: string
  safeUntil: string
  readyBy: string
  kgPerUnit: number
  image: string
}

type LedgerEntry = {
  id: string
  title: string
  source: string
  time: string
  value: string
  impact: string
  kgNum: number
  phpNum: number
}

type SharedState = {
  reservations: LiveReservation[]
  setReservations: React.Dispatch<React.SetStateAction<LiveReservation[]>>
  listings: LiveListing[]
  setListings: React.Dispatch<React.SetStateAction<LiveListing[]>>
  ledger: LedgerEntry[]
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>
  leafPoints: number
  setLeafPoints: React.Dispatch<React.SetStateAction<number>>
  ngoReserved: number
  setNgoReserved: React.Dispatch<React.SetStateAction<number>>
  totalWasteKg: number
  totalPhp: number
  totalMeals: number
}

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  en: {
    overview: "Overview",
    supply: "Supply & Harvest",
    reservations: "Reservations",
    reports: "Impact Reports",
    settings: "Settings",
    market: "Market",
    ticket: "QR Ticket",
    impact: "Impact Ledger",
    greeting: "Good morning, Amina",
    greetingCopy: "Plan today's supply and turn potential surplus into community value.",
    mission: "Today's mission",
    missionCopy: "Complete one more action to earn your Good Food badge.",
    order: "Order",
    rescue: "Rescue",
    share: "Share",
    available: "Available near you",
    goodFood: "Good food, right on time.",
    passes: "Passes",
    partner: "Partner",
    everyPlate: "Every plate adds up.",
    reservationConfirmed: "Reservation Confirmed",
    mealWaiting: "Your meal is waiting.",
    showPass: "Show this pass at pickup to complete your handoff.",
    source: "Source",
    preparation: "Preparation time",
    allergens: "Allergens",
    validPickup: "VALID FOR PICKUP",
    scanPickup: "Scan at pickup to verify handoff",
    savedWallet: "Saved to your Plentari wallet",
    offlineCopy: "Available offline until pickup is complete.",
    wasteAvoided: "WASTE & METHANE AVOIDED",
    recoveredValue: "RECOVERED VALUE",
    reporting: "PARTNER & LOCAL GOVERNMENT REPORTING",
    addBasket: "Add to Basket",
    simulateScan: "Simulate QR Scan ✓",
  },
  fil: {
    overview: "Pangkalahatan",
    supply: "Ani at Suplay",
    reservations: "Mga Reserbasyon",
    reports: "Ulat ng Epekto",
    settings: "Mga Setting",
    market: "Pamilihan",
    ticket: "QR Tiket",
    impact: "Talaan ng Epekto",
    greeting: "Magandang umaga, Amina",
    greetingCopy: "Planuhin ang suplay ngayon at gawing tulong sa komunidad ang sobrang pagkain.",
    mission: "Misyon ngayong araw",
    missionCopy: "Tapusin ang isa pang gawain para makuha ang Good Food badge.",
    order: "Umorder",
    rescue: "Sagipin",
    share: "Ibahagi",
    available: "Malapit at available",
    goodFood: "Masarap na pagkain, nasa tamang oras.",
    passes: "Mga Tiket",
    partner: "Partner",
    everyPlate: "Mahalaga ang bawat plato.",
    reservationConfirmed: "Kumpirmado ang Reserbasyon",
    mealWaiting: "Handa na ang iyong pagkain.",
    showPass: "Ipakita ang tiket na ito sa pagkuha para makumpleto ang handoff.",
    source: "Pinagmulan",
    preparation: "Oras ng paghahanda",
    allergens: "Allergens",
    validPickup: "ORAS NG PAGKUHA",
    scanPickup: "I-scan sa pagkuha para makumpirma ang handoff",
    savedWallet: "Naka-save sa iyong Plentari wallet",
    offlineCopy: "Magagamit offline hanggang makuha ang pagkain.",
    wasteAvoided: "BASURA AT METHANE NA NAIWASAN",
    recoveredValue: "HALAGANG NABAWI",
    reporting: "ULAT PARA SA PARTNER AT LOKAL NA PAMAHALAAN",
    addBasket: "Ilagay sa Basket",
    simulateScan: "I-simulate ang QR Scan ✓",
  },
} as const

// ─── Images ───────────────────────────────────────────────────────────────────

const FOOD_IMAGE = "https://images.unsplash.com/photo-1679279726937-122c49626802?auto=format&fit=crop&w=720&h=480&q=72"
const TOMATO_IMAGE = "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=720&h=480&q=72"
const CURRY_IMAGE = "https://images.unsplash.com/photo-1695720247911-817755ad7d02?auto=format&fit=crop&w=720&h=480&q=72"
const BREAD_IMAGE = "https://images.unsplash.com/photo-1549438247-223f2db1dd29?auto=format&fit=crop&w=720&h=480&q=72"
const GREENS_IMAGE = "https://images.unsplash.com/photo-1591586116988-62fe65164f8d?auto=format&fit=crop&w=720&h=480&q=72"

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_LISTINGS: LiveListing[] = [
  { id: "LST-001", name: "Chicken Adobo with Rice", qty: 64, originalQty: 64, price: 95, rescuePrice: 48, route: "Rescue", source: "MSU Canteen 1", safeUntil: "2:30 PM", readyBy: "11:30 AM", kgPerUnit: 0.42, image: FOOD_IMAGE },
  { id: "LST-002", name: "Vegetable Curry", qty: 24, originalQty: 24, price: 85, rescuePrice: 55, route: "Share", source: "Campus Food Hall", safeUntil: "2:15 PM", readyBy: "11:45 AM", kgPerUnit: 0.38, image: CURRY_IMAGE },
  { id: "LST-003", name: "Ugly Produce", qty: 42, originalQty: 42, price: 100, rescuePrice: 65, route: "Order", source: "Lanao Growers Cluster", safeUntil: "May 23", readyBy: "10:00 AM", kgPerUnit: 1.0, image: TOMATO_IMAGE },
  { id: "LST-004", name: "Day-Fresh Pandesal", qty: 30, originalQty: 30, price: 60, rescuePrice: 40, route: "Rescue", source: "Lakeside Bakery", safeUntil: "4:00 PM", readyBy: "8:00 AM", kgPerUnit: 0.3, image: BREAD_IMAGE },
  { id: "LST-005", name: "Leafy Greens Bundle", qty: 20, originalQty: 20, price: 110, rescuePrice: 75, route: "Order", source: "Marantao Family Farm", safeUntil: "May 25", readyBy: "7:00 AM", kgPerUnit: 0.6, image: GREENS_IMAGE },
]

const INITIAL_RESERVATIONS: LiveReservation[] = [
  { id: "PLN-0842", consumer: "Sara Macapaar", item: "Chicken Adobo with Rice", qty: 1, price: 48, pickupWindow: "12:45–1:30 PM", status: "Ready", kgPerUnit: 0.42, source: "MSU Canteen 1", createdAt: Date.now() - 3600000 },
  { id: "PLN-0847", consumer: "Jamal Hadji", item: "Vegetable Curry", qty: 1, price: 55, pickupWindow: "1:00–1:45 PM", status: "Pending", kgPerUnit: 0.38, source: "Campus Food Hall", createdAt: Date.now() - 1800000 },
  { id: "PLN-0851", consumer: "Aisha Ali", item: "Chicken Adobo with Rice", qty: 2, price: 96, pickupWindow: "1:15–2:00 PM", status: "Pending", kgPerUnit: 0.42, source: "MSU Canteen 1", createdAt: Date.now() - 900000 },
  { id: "PLN-0829", consumer: "Community Hub", item: "Vegetable Curry", qty: 8, price: 0, pickupWindow: "11:30 AM", status: "Collected", kgPerUnit: 0.38, source: "Campus Food Hall", createdAt: Date.now() - 7200000 },
]

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: "LED-001", title: "Chicken Adobo Rescue", source: "MSU Canteen 1", time: "Today, 1:18 PM", value: "+₱48", impact: "0.42 kg", kgNum: 0.42, phpNum: 48 },
  { id: "LED-002", title: "Native Tomato Pre-order", source: "Lanao Growers Cluster", time: "Today, 9:42 AM", value: "+₱130", impact: "2.0 kg", kgNum: 2.0, phpNum: 130 },
  { id: "LED-003", title: "Vegetable Curry Rescue", source: "Campus Food Hall", time: "Yesterday, 5:06 PM", value: "+₱55", impact: "0.38 kg", kgNum: 0.38, phpNum: 55 },
  { id: "LED-004", title: "Community Rice Share", source: "Marawi Community Hub", time: "May 18, 3:24 PM", value: "Shared", impact: "3.5 kg", kgNum: 3.5, phpNum: 0 },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, ReactNode> = {
    moon: <path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3Z" />,
    globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
    trophy: (<><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z" /></>),
    grid: (<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>),
    leaf: (<path d="M20.5 3.5C12 3.8 6.8 7.3 5.8 13.3c-.4 2.3.3 4.3 1.8 5.7 1.6-5.4 5.1-8.8 9.9-10.9-4.1 2.9-6.8 6.5-8 10.8 7.3.6 11.5-5.1 11-15.4Z" />),
    box: (<><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" /><path d="M12 11v10" /></>),
    chart: (<><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>),
    settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>),
    bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>),
    upload: (<><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 15v5H4v-5" /></>),
    spark: (<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />),
    warning: (<><path d="M10.4 3.7 2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3L13.6 3.7a2 2 0 0 0-3.2 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
    pin: (<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>),
    cart: (<><path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.7L21 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>),
    clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    arrow: (<><path d="m9 18 6-6-6-6" /></>),
    check: <path d="m5 12 4 4L19 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    close: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
    share: (<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4" /></>),
    home: (<><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>),
    ticket: (<><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" /><path d="M9 5v14" /></>),
    trend: (<><path d="m3 17 6-6 4 4 7-8" /><path d="M15 7h5v5" /></>),
    refresh: (<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>),
    sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>),
    cloud: (<><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></>),
    rain: (<><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16v2M8 20v2M16 16v2M16 20v2M12 18v2M12 22v2" /></>),
    users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
    shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></>),
  }
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? "logo-compact" : "logo-letterhead"}`} role="img" aria-label="Plentari">
      <img className="brand-asset brand-asset-light" src={compact ? markLight : letterheadLight} alt="" />
      <img className="brand-asset brand-asset-dark" src={compact ? markDark : letterheadDark} alt="" />
    </div>
  )
}

function HarvestEmblem({ size = 72 }: { size?: number }) {
  return (
    <span className="harvest-emblem" role="img" aria-label="Plentari verified harvest achievement" style={{ width: size, height: size }}>
      <img className="brand-asset brand-asset-light" src={markLight} alt="" />
      <img className="brand-asset brand-asset-dark" src={markDark} alt="" />
    </span>
  )
}

function PreferenceButtons({ preferences, compact = false }: { preferences: Preferences; compact?: boolean }) {
  return (
    <div className={`preference-buttons ${compact ? "compact" : ""}`}>
      <button onClick={preferences.toggleLanguage} aria-label="Switch language" title="Switch English and Filipino">
        <Icon name="globe" size={16} />
        <span>{preferences.language === "en" ? "EN" : "FIL"}</span>
      </button>
      <button onClick={preferences.toggleTheme} aria-label="Toggle dark mode" title="Toggle light and dark mode">
        <Icon name="moon" size={16} />
        {!compact && <span>{preferences.theme === "light" ? "Light" : "Dark"}</span>}
      </button>
    </div>
  )
}

function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <h2>{title}</h2>
          <button aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  )
}

function MobileNav({ active, onChange, language }: { active: Screen; onChange: (s: Screen) => void; language: Language }) {
  const t = translations[language]
  return (
    <nav className="mobile-nav">
      <button className={active === "market" ? "active" : ""} onClick={() => onChange("market")}>
        <Icon name="home" /><span>{t.market}</span>
      </button>
      <button className={active === "passport" ? "active" : ""} onClick={() => onChange("passport")}>
        <Icon name="ticket" /><span>{t.passes}</span>
      </button>
      <button className={active === "impact" ? "active" : ""} onClick={() => onChange("impact")}>
        <Icon name="trend" /><span>{t.impact}</span>
      </button>
      <button onClick={() => onChange("dashboard")}>
        <Icon name="grid" /><span>{t.partner}</span>
      </button>
    </nav>
  )
}

// QR Code (SVG-rendered pattern)
const qrPattern = [
  "111111101001101111111","100000101101101000001","101110101010101011101",
  "101110100111101011101","101110101010101011101","100000101011101000001",
  "111111101010101111111","000000001111100000000","110101110011111010011",
  "011010001101001101100","101111111011111001111","010001001110001100100",
  "111010111001111011101","000000001011001010100","111111101101111011101",
  "100000101010001010100","101110101111111111111","101110100011001100000",
  "101110101110111011101","100000100100001010100","111111101111111011111",
]
function QRCode() {
  return (
    <div className="qr-wrap" aria-label="Reservation pickup QR code">
      <div className="qr-grid">
        {qrPattern.join("").split("").map((cell, i) => (
          <i className={cell === "1" ? "filled" : ""} key={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Demo Role Switcher Banner ─────────────────────────────────────────────────

function DemoRoleBanner({
  role, setRole, screen, setScreen, onReset,
}: {
  role: DemoRole
  setRole: (r: DemoRole) => void
  screen: Screen
  setScreen: (s: Screen) => void
  onReset: () => void
}) {
  return (
    <div className="demo-banner">
      <div className="demo-banner-left">
        <span className="demo-dot" />
        <span className="demo-label">
          Demo · {role === "consumer" ? "👤 Sara Macapaar (Student Buyer)" : "🏪 MSU Canteen 1 (Partner)"}
        </span>
      </div>
      <div className="demo-banner-right">
        <button
          className="demo-switch-btn"
          onClick={() => {
            if (role === "consumer") {
              setRole("partner")
              setScreen("dashboard")
            } else {
              setRole("consumer")
              setScreen("market")
            }
          }}
        >
          {role === "consumer" ? "Switch to Partner Dashboard →" : "← Switch to Consumer View"}
        </button>
        <button className="demo-reset-btn" onClick={onReset} title="Reset demo data">
          <Icon name="refresh" size={14} />
          Reset
        </button>
      </div>
    </div>
  )
}

// ─── Publish Safety Gate Modal ─────────────────────────────────────────────────

function PublishSafetyModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(false)
  const canPublish = check1 && check2
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-ai-badge"><Icon name="shield" size={18} /></span>
          <div>
            <h2>Responsible AI · Human Approval</h2>
            <p>AI recommends — you verify before it goes live.</p>
          </div>
        </div>
        <div className="modal-item-name">Publishing: <strong>{itemName}</strong></div>
        <div className="modal-checks">
          <label className={`modal-check-row ${check1 ? "checked" : ""}`}>
            <input type="checkbox" checked={check1} onChange={(e) => setCheck1(e.target.checked)} />
            <span>
              <strong>Food Quality & Safety</strong>
              <small>I confirm food quality, allergen info, and safe-until pickup deadline.</small>
            </span>
          </label>
          <label className={`modal-check-row ${check2 ? "checked" : ""}`}>
            <input type="checkbox" checked={check2} onChange={(e) => setCheck2(e.target.checked)} />
            <span>
              <strong>Halal Compliance</strong>
              <small>I verify Halal preparation & handling compliance for this batch.</small>
            </span>
          </label>
        </div>
        <p className="modal-note">
          <Icon name="shield" size={12} /> These checks are logged to your verified partner record and cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className={`modal-confirm ${canPublish ? "ready" : ""}`} disabled={!canPublish} onClick={onConfirm}>
            <Icon name="check" size={15} /> Confirm & Publish Live
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── NGO Share Tracker ─────────────────────────────────────────────────────────

function NgoShareTracker({ reserved, capacity = 25 }: { reserved: number; capacity?: number }) {
  const pct = Math.min(100, Math.round((reserved / capacity) * 100))
  const full = reserved >= capacity
  return (
    <div className={`ngo-tracker ${full ? "full" : ""}`}>
      <div className="ngo-tracker-head">
        <span><Icon name="users" size={14} /> Share Reserve Tracker</span>
        <span className={`ngo-badge ${full ? "full" : ""}`}>{full ? "At Capacity" : "Accepting"}</span>
      </div>
      <div className="ngo-tracker-name">Marawi Community Kitchen</div>
      <div className="ngo-tracker-bar">
        <div className="ngo-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="ngo-tracker-nums">
        <span>{reserved} / {capacity} meals reserved today</span>
        <span>{capacity - reserved} slots remaining</span>
      </div>
    </div>
  )
}

// ─── Forecast Simulator ────────────────────────────────────────────────────────

type Weather = "sunny" | "rain" | "heavy"
type Event = "normal" | "exams" | "festival"

function ForecastSimulator({
  qty,
  price,
  onWeatherChange,
}: {
  qty: number
  price: number
  onWeatherChange?: (w: Weather) => void
}) {
  const [weather, setWeather] = useState<Weather>("rain")
  const [event, setEvent] = useState<Event>("exams")

  const weatherMod = weather === "sunny" ? 0 : weather === "rain" ? -0.08 : -0.22
  const eventMod = event === "normal" ? 0 : event === "exams" ? 0.14 : 0.18
  const combined = 1 + weatherMod + eventMod

  const salesLow = Math.round(qty * combined * 0.72)
  const salesHigh = Math.round(qty * combined * 0.81)
  const surplusLow = Math.max(0, qty - salesHigh)
  const surplusHigh = Math.max(0, qty - salesLow)
  const sellThrough = Math.round(combined * 76)
  const discountPrice = Math.round(price * 0.5)

  const b2cMeals = Math.round(surplusHigh * 0.56)
  const b2bMeals = Math.round(surplusHigh * 0.33)
  const ngoMeals = surplusHigh - b2cMeals - b2bMeals
  const b2cPct = Math.round((b2cMeals / Math.max(1, surplusHigh)) * 100)
  const b2bPct = Math.round((b2bMeals / Math.max(1, surplusHigh)) * 100)

  const handleWeather = (w: Weather) => {
    setWeather(w)
    onWeatherChange?.(w)
  }

  return (
    <div className="forecast-sim">
      <div className="sim-controls">
        <div className="sim-control-group">
          <span className="sim-label"><Icon name="cloud" size={12} /> WEATHER</span>
          <div className="sim-pills">
            {([["sunny", "☀️ Sunny", "+0%"], ["rain", "🌧 Light Rain", "−8%"], ["heavy", "⛈ Heavy Rain", "−22%"]] as [Weather, string, string][]).map(([w, label, mod]) => (
              <button key={w} className={`sim-pill ${weather === w ? "active" : ""}`} onClick={() => handleWeather(w)}>
                {label} <small>{mod}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="sim-control-group">
          <span className="sim-label"><Icon name="spark" size={12} /> LOCAL EVENTS</span>
          <div className="sim-pills">
            {([["normal", "🎓 Regular Day", "0%"], ["exams", "📝 Campus Exams", "+14%"], ["festival", "🎉 Festival", "+18%"]] as [Event, string, string][]).map(([ev, label, mod]) => (
              <button key={ev} className={`sim-pill ${event === ev ? "active" : ""}`} onClick={() => setEvent(ev)}>
                {label} <small>{mod}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="forecast forecast-split">
        <div>
          <span>EXPECTED SALES</span>
          <strong>{salesLow}–{salesHigh}</strong>
          <em>meals by 1:00 PM</em>
        </div>
        <div>
          <span>PREDICTED SURPLUS</span>
          <strong>{surplusLow}–{surplusHigh}</strong>
          <em>meals after peak</em>
        </div>
      </div>
      <div className="sim-sellthrough">
        Projected sell-through: <strong>{sellThrough}%</strong> · Suggested rescue price: <strong>₱{discountPrice}</strong>
      </div>
      <div className="routing-alert">
        <div className="routing-title">
          <span><Icon name="trend" size={17} /></span>
          <div>
            <strong>Recommended Routing</strong>
            <p>Optimized for value recovery and community impact</p>
          </div>
        </div>
        <div className="routing-list">
          <div>
            <span>B2C Discount</span>
            <i><b style={{ width: `${b2cPct}%` }} /></i>
            <strong>{b2cMeals} meals</strong>
          </div>
          <div>
            <span>B2B Ingredients</span>
            <i><b style={{ width: `${b2bPct}%` }} /></i>
            <strong>{b2bMeals} meals</strong>
          </div>
          <div>
            <span>NGO Share</span>
            <i><b style={{ width: `${Math.max(4, 100 - b2cPct - b2bPct)}%` }} /></i>
            <strong>{ngoMeals} meals</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Partner Module Pages ──────────────────────────────────────────────────────

function PartnerModulePage({
  page,
  notify,
  openOverview,
  shared,
}: {
  page: string
  notify: Notify
  openOverview: () => void
  shared: SharedState
}) {
  const { reservations, setReservations, ledger, setLedger, setLeafPoints, setListings, ngoReserved, totalWasteKg, totalPhp, totalMeals } = shared
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [supplyPeriod, setSupplyPeriod] = useState("Today")
  const [reservationFilter, setReservationFilter] = useState("All")
  const [reservationSearch, setReservationSearch] = useState("")
  const [reportPeriod, setReportPeriod] = useState("Monthly")
  const forecastPoints = [
    { label: "9 AM", value: 48, x: 8, y: 42 },
    { label: "10 AM", value: 57, x: 39, y: 34 },
    { label: "11 AM", value: 69, x: 70, y: 24 },
    { label: "12 PM", value: 76, x: 101, y: 17 },
    { label: "1 PM", value: 82, x: 132, y: 11 },
  ]
  const [forecastPoint, setForecastPoint] = useState(forecastPoints.length - 1)

  if (page === "Supply & Harvest") {
    const supplyRows = shared.listings.map(l => [
      l.name, `${l.qty} ${l.route === "Order" ? "kg" : "meals"}`,
      `${l.readyBy} / ${l.safeUntil}`, l.route, l.qty > 0 ? "Published" : "Sold Out",
    ])
    const supplyTotals: Record<string, { expected: string; routed: string }> = {
      Today: { expected: String(shared.listings.reduce((a, l) => a + l.qty, 0)), routed: "18" },
      "This week": { expected: "401", routed: "74" },
      History: { expected: "182", routed: "182" },
    }
    return (
      <div className="partner-page">
        <div className="partner-toolbar">
          <div className="module-tabs">
            {["Today", "This week", "History"].map((period) => (
              <button key={period} className={supplyPeriod === period ? "active" : ""} onClick={() => { setSupplyPeriod(period); notify(`${period} supply plan selected.`) }}>
                {period}
              </button>
            ))}
          </div>
          <button className="primary-small" onClick={openOverview}>+ Log supply</button>
        </div>
        <div className="module-summary">
          <article>
            <span>EXPECTED TODAY</span>
            <strong>{supplyTotals[supplyPeriod].expected}</strong>
            <p>meals and produce units</p>
          </article>
          <article className="forecast-summary">
            <span>FORECAST TO SELL</span>
            <strong>{forecastPoints[forecastPoint].value}%</strong>
            <p>Projected sell-through by {forecastPoints[forecastPoint].label}</p>
            <div className="forecast-line-wrap">
              <svg viewBox="0 0 140 52" role="img" aria-label="Forecast sell-through from 9 AM to 1 PM">
                <defs>
                  <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#c3e86d" stopOpacity=".5" />
                    <stop offset="1" stopColor="#c3e86d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="forecast-area" d="M8 42 L39 34 L70 24 L101 17 L132 11 L132 48 L8 48 Z" />
                <polyline className="forecast-line" points={forecastPoints.map(p => `${p.x},${p.y}`).join(" ")} />
                {forecastPoints.map((p, i) => (
                  <circle key={p.label} className={forecastPoint === i ? "active" : ""} cx={p.x} cy={p.y}
                    r={forecastPoint === i ? 4 : 3} role="button" tabIndex={0}
                    aria-label={`${p.label}: ${p.value}% forecast`}
                    onClick={() => setForecastPoint(i)} onMouseEnter={() => setForecastPoint(i)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setForecastPoint(i) } }} />
                ))}
              </svg>
              <div className="forecast-axis"><span>9 AM</span><span>1 PM</span></div>
              <div className="forecast-tooltip" style={{ left: `calc(${(forecastPoints[forecastPoint].x / 140) * 100}% - 20px)` }}>
                {forecastPoints[forecastPoint].value}%
              </div>
            </div>
          </article>
          <article>
            <span>ROUTED TO RESCUE</span>
            <strong>{supplyTotals[supplyPeriod].routed}</strong>
            <p>units protected early</p>
          </article>
        </div>
        <NgoShareTracker reserved={ngoReserved} />
        <article className="module-card">
          <div className="module-card-head">
            <div>
              <h2>{supplyPeriod === "Today" ? "Today's supply plan" : supplyPeriod === "This week" ? "This week's supply plan" : "Supply history"}</h2>
              <p>Live availability and AI-assisted routing</p>
            </div>
            <button onClick={() => notify("Supply plan exported as CSV.")}><Icon name="upload" size={15} /> Export</button>
          </div>
          <div className="data-table supply-table">
            <div className="table-row table-head">
              <span>ITEM</span><span>QUANTITY</span><span>READY / SAFE UNTIL</span><span>ROUTING</span><span>STATUS</span>
            </div>
            {(supplyPeriod === "Today" ? supplyRows : supplyPeriod === "This week" ? [
              ["Chicken Adobo", "220 meals", "Mon–Fri / Daily", "Mixed routing", "Published"],
              ["Vegetable Curry", "96 meals", "Tue–Fri / Daily", "B2C Rescue", "Scheduled"],
              ["Leafy Greens", "85 kg", "Wed / May 25", "Pre-harvest", "Scheduled"],
            ] : [
              ["Rice Share", "80 meals", "May 19 / Completed", "NGO Share", "Collected"],
              ["Ugly Produce", "42 kg", "May 18 / Completed", "B2B Ingredient", "Collected"],
              ["Pandesal", "60 packs", "May 17 / Completed", "B2C Rescue", "Collected"],
            ]).map((row, i) => (
              <div className="table-row" key={i}>
                <span><i className="item-dot" />{row[0]}<small>MSU Canteen 1</small></span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span><em className={`status-pill ${row[4].toLowerCase().replace(/\s/g, "-")}`}>{row[4]}</em></span>
              </div>
            ))}
          </div>
        </article>
        <div className="module-callout">
          <span><Icon name="spark" size={18} /></span>
          <div>
            <strong>Forecast updated 4 minutes ago</strong>
            <p>Light rain is likely to shift 8–12 meals into proactive rescue.</p>
          </div>
          <button onClick={openOverview}>Review routing</button>
        </div>
      </div>
    )
  }

  if (page === "Reservations") {
    const verifyQR = (index: number) => {
      const res = reservations[index]
      const next = [...reservations]
      const nextStatus: ReservationStatus = res.status === "Pending" ? "Ready" : res.status === "Ready" ? "QR-Verified" : "Collected"
      next[index] = { ...res, status: nextStatus }
      setReservations(next)
      if (nextStatus === "QR-Verified") {
        const kgSaved = res.qty * res.kgPerUnit
        const newEntry: LedgerEntry = {
          id: `LED-${Date.now()}`,
          title: `${res.item} Handoff`,
          source: res.source,
          time: "Just now",
          value: res.price > 0 ? `+₱${res.price}` : "Shared",
          impact: `${kgSaved.toFixed(2)} kg`,
          kgNum: kgSaved,
          phpNum: res.price,
        }
        setLedger((prev) => [newEntry, ...prev])
        setLeafPoints((p) => p + Math.round(kgSaved * 10))
        setListings((prev) => prev.map(l => l.name === res.item ? { ...l, qty: Math.max(0, l.qty - res.qty) } : l))
        notify(`${res.id} QR verified! Impact logged to ledger.`)
      } else {
        notify(nextStatus === "Ready" ? `${res.id} marked ready for pickup.` : `${res.id} handoff complete.`)
      }
    }

    const filtered = reservations.filter((r, i) => {
      const matchFilter = reservationFilter === "All" || r.status === reservationFilter
      const matchSearch = [r.id, r.consumer, r.item].join(" ").toLowerCase().includes(reservationSearch.toLowerCase())
      return matchFilter && matchSearch
    })

    return (
      <div className="partner-page">
        <div className="partner-toolbar">
          <div className="reservation-filter">
            {["All", "Ready", "Pending", "QR-Verified", "Collected"].map((f) => (
              <button key={f} className={reservationFilter === f ? "active" : ""} onClick={() => setReservationFilter(f)}>
                {f} <span>{f === "All" ? reservations.length : reservations.filter(r => r.status === f).length}</span>
              </button>
            ))}
          </div>
          <label className="table-search">
            <span>⌕</span>
            <input aria-label="Search reservations" placeholder="Search reservation" value={reservationSearch} onChange={(e) => setReservationSearch(e.target.value)} />
          </label>
        </div>
        <div className="reservation-overview">
          <div>
            <span className="overview-icon"><Icon name="clock" /></span>
            <p>Next pickup<strong>12:45 PM</strong></p>
          </div>
          <div>
            <span className="overview-icon"><Icon name="ticket" /></span>
            <p>Awaiting handoff<strong>{reservations.filter(r => r.status === "Pending" || r.status === "Ready").length} reservations</strong></p>
          </div>
          <div>
            <span className="overview-icon"><Icon name="check" /></span>
            <p>QR verified today<strong>{reservations.filter(r => r.status === "QR-Verified" || r.status === "Collected").length} pickups</strong></p>
          </div>
        </div>
        <article className="module-card">
          <div className="module-card-head">
            <div><h2>Pickup queue</h2><p>Confirm preparation, then verify the physical handoff</p></div>
            <span className="live-badge"><i /> Live queue</span>
          </div>
          <div className="reservation-list">
            {filtered.map((res) => {
              const idx = reservations.indexOf(res)
              const isDone = res.status === "QR-Verified" || res.status === "Collected"
              return (
                <div className="reservation-row" key={res.id}>
                  <div className="reservation-code">
                    <Icon name="ticket" size={17} />
                    <span>
                      <strong>{res.id}</strong>
                      <small>{res.consumer}</small>
                    </span>
                  </div>
                  <div>
                    <strong>{res.item}{res.qty > 1 ? ` × ${res.qty}` : ""}</strong>
                    <small>Pickup {res.pickupWindow}</small>
                  </div>
                  <em className={`status-pill ${res.status.toLowerCase().replace(/-/g, "")}`}>{res.status}</em>
                  <button disabled={isDone} onClick={() => verifyQR(idx)}>
                    {res.status === "Pending" ? "Mark ready" : res.status === "Ready" ? "Verify QR" : "Completed ✓"}
                  </button>
                </div>
              )
            })}
            {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--grey)", padding: "20px 0", fontSize: "11px" }}>No reservations match your filter.</p>}
          </div>
        </article>
      </div>
    )
  }

  if (page === "Impact Reports") {
    const BASE = { waste: 542, value: 24100, meals: 1284 }
    const ledgerKg = ledger.reduce((a, l) => a + l.kgNum, 0)
    const ledgerPhp = ledger.reduce((a, l) => a + l.phpNum, 0)
    const ledgerMeals = ledger.length

    const reportData = {
      Monthly: {
        waste: (BASE.waste + ledgerKg).toFixed(0),
        value: (BASE.value + ledgerPhp).toLocaleString(),
        meals: (BASE.meals + ledgerMeals).toLocaleString(),
        progress: "84%",
        bars: [42, 55, 49, 71, 64, 88, 79, 96, 84, 110, 102, 124],
      },
      Quarterly: { waste: "1,486", value: "68,450", meals: "3,612", progress: "78%", bars: [61, 72, 66, 82, 75, 93, 88, 104, 98, 118, 111, 130] },
      Annual: { waste: "5,924", value: "271,800", meals: "14,206", progress: "92%", bars: [48, 62, 58, 77, 70, 91, 86, 101, 96, 116, 121, 136] },
    }[(reportPeriod as "Monthly" | "Quarterly" | "Annual")]

    return (
      <div className="partner-page">
        <div className="partner-toolbar">
          <div className="module-tabs">
            {["Monthly", "Quarterly", "Annual"].map((p) => (
              <button key={p} className={reportPeriod === p ? "active" : ""} onClick={() => setReportPeriod(p)}>{p}</button>
            ))}
          </div>
          <button className="primary-small" onClick={() => notify(`${reportPeriod} impact report downloaded.`)}>
            <Icon name="upload" size={15} /> Download report
          </button>
        </div>
        <div className="impact-report-grid">
          <article className="impact-hero-card">
            <p>VERIFIED IMPACT · {reportPeriod.toUpperCase()}</p>
            <strong>{reportData.waste} <small>kg</small></strong>
            <span>food waste and methane avoided</span>
            <div className="impact-progress"><i style={{ width: reportData.progress }} /></div>
            <em>{reportData.progress} of your {reportPeriod.toLowerCase()} goal</em>
          </article>
          <article className="report-metric">
            <span><Icon name="trend" /></span>
            <p>RECOVERED VALUE</p>
            <strong>PHP {reportData.value}</strong>
            <em>↑ 12% from April</em>
          </article>
          <article className="report-metric">
            <span><Icon name="box" /></span>
            <p>MEALS KEPT IN MOTION</p>
            <strong>{reportData.meals}</strong>
            <em>98% QR verified</em>
          </article>
        </div>
        <article className="module-card chart-card">
          <div className="module-card-head">
            <div><h2>Waste avoided over time</h2><p>Only completed, QR-verified handoffs are counted</p></div>
            <span className="verified-key"><i /> Verified kg</span>
          </div>
          <div className="report-chart">
            {reportData.bars.map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}px` }} />
                <span>{["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"][i]}</span>
              </div>
            ))}
          </div>
        </article>
        <div className="government-note">
          <Icon name="check" />
          <p><strong>Government-ready reporting</strong><br />Methodology, timestamps, source partners, and QR handoffs are included in every export.</p>
          <button onClick={() => notify("Impact methodology opened.")}>View methodology</button>
        </div>
      </div>
    )
  }

  // Settings
  return (
    <div className="partner-page settings-page">
      <div className="settings-grid">
        <article className="module-card settings-card">
          <div className="module-card-head">
            <div><h2>Partner profile</h2><p>Information visible across Plentari</p></div>
            <span className="verified-setting"><Icon name="check" size={12} /> Verified</span>
          </div>
          <div className="settings-form">
            <label>Organization name<input defaultValue="MSU Canteen 1" /></label>
            <div>
              <label>Partner type
                <select defaultValue="canteen">
                  <option value="canteen">Campus canteen</option>
                  <option>Grower cluster</option>
                </select>
              </label>
              <label>Phone number<input defaultValue="+63 917 842 1093" /></label>
            </div>
            <label>Pickup address<input defaultValue="MSU Main Campus, Marawi City" /></label>
          </div>
        </article>
        <article className="module-card settings-card">
          <div className="module-card-head">
            <div><h2>Fulfillment preferences</h2><p>Control routing and operational alerts</p></div>
          </div>
          <div className="settings-toggles">
            {[
              ["Proactive rescue routing", "Recommend discounts before closing", true],
              ["NGO share matching", "Route eligible surplus to verified NGOs", true],
              ["B2B ingredient offers", "Allow bulk offers to food businesses", true],
              ["SMS pickup alerts", "Send an alert for every reservation", false],
            ].map(([title, copy, enabled]) => (
              <label key={String(title)}>
                <span><strong>{title}</strong><small>{copy}</small></span>
                <input type="checkbox" defaultChecked={Boolean(enabled)} />
                <i />
              </label>
            ))}
          </div>
        </article>
        <article className="module-card settings-card hours-card">
          <div className="module-card-head">
            <div><h2>Operating hours</h2><p>Used for forecasts and pickup windows</p></div>
          </div>
          <div className="hours-row">
            <span>Monday – Friday</span>
            <input type="time" defaultValue="08:00" />
            <em>to</em>
            <input type="time" defaultValue="17:00" />
          </div>
          <div className="hours-row">
            <span>Saturday</span>
            <input type="time" defaultValue="09:00" />
            <em>to</em>
            <input type="time" defaultValue="14:00" />
          </div>
        </article>
      </div>
      <div className="settings-actions">
        <span>{settingsSaved ? "All changes saved." : "Changes are saved only when you confirm."}</span>
        <button onClick={() => { setSettingsSaved(true); notify("Partner settings saved.") }}>
          <Icon name="check" size={16} /> Save settings
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard (Partner Workspace) ────────────────────────────────────────────

function Dashboard({
  notify, onChange, preferences, shared,
}: {
  notify: Notify
  onChange: (screen: Screen) => void
  preferences: Preferences
  shared: SharedState
}) {
  const { listings, setListings, reservations, setReservations, setNgoReserved, ngoReserved, leafPoints } = shared
  const [mode, setMode] = useState<"manual" | "csv">("manual")
  const [activeNav, setActiveNav] = useState("Overview")
  const [extraItem, setExtraItem] = useState(false)
  const [hub, setHub] = useState<"MSU Canteen 1 – Meals" | "Lanao Growers Cluster – Pre-Harvest">("MSU Canteen 1 – Meals")
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [published, setPublished] = useState(false)

  // Controlled form state for supply entry
  const [formName, setFormName] = useState("Chicken Adobo with Rice")
  const [formQty, setFormQty] = useState(64)
  const [formPrice, setFormPrice] = useState(95)
  const [formReadyBy, setFormReadyBy] = useState("11:30")
  const [formSafeUntil, setFormSafeUntil] = useState("14:30")
  const [formRoute, setFormRoute] = useState<"Rescue" | "Order" | "Share">("Rescue")

  const t = translations[preferences.language]

  const loadSamplePOS = () => {
    if (hub === "MSU Canteen 1 – Meals") {
      setFormName("Chicken Adobo with Rice")
      setFormQty(64); setFormPrice(95); setFormReadyBy("11:30"); setFormSafeUntil("14:30"); setFormRoute("Rescue")
    } else {
      setFormName("Native Tomatoes (Ugly Produce)")
      setFormQty(42); setFormPrice(100); setFormReadyBy("10:00"); setFormSafeUntil("18:00"); setFormRoute("Order")
    }
    notify("Sample POS data loaded.")
  }

  const handlePublishConfirm = () => {
    setShowPublishModal(false)
    setPublished(true)
    // Add to live listings
    const newListing: LiveListing = {
      id: `LST-${Date.now()}`,
      name: formName,
      qty: formQty,
      originalQty: formQty,
      price: formPrice,
      rescuePrice: Math.round(formPrice * 0.5),
      route: formRoute,
      source: hub === "MSU Canteen 1 – Meals" ? "MSU Canteen 1" : "Lanao Growers Cluster",
      safeUntil: formSafeUntil,
      readyBy: formReadyBy,
      kgPerUnit: 0.42,
      image: formRoute === "Order" ? TOMATO_IMAGE : FOOD_IMAGE,
    }
    setListings((prev) => {
      const existing = prev.findIndex(l => l.name === formName)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + formQty }
        return updated
      }
      return [...prev, newListing]
    })
    if (formRoute === "Share") {
      setNgoReserved((n) => Math.min(25, n + Math.min(5, formQty)))
    }
    notify("Supply plan published to Plentari Market! Listings updated.")
  }

  return (
    <section className="dashboard-screen">
      {showPublishModal && (
        <PublishSafetyModal
          itemName={formName}
          onConfirm={handlePublishConfirm}
          onCancel={() => setShowPublishModal(false)}
        />
      )}

      {/* Mobile tab strip (< 768px) */}
      <div className="mobile-partner-tabs">
        {["Overview", "Supply & Harvest", "Reservations", "Impact Reports"].map((tab) => (
          <button key={tab} className={activeNav === tab ? "active" : ""} onClick={() => setActiveNav(tab)}>
            {tab === "Supply & Harvest" ? "Supply" : tab === "Impact Reports" ? "Reports" : tab}
          </button>
        ))}
      </div>

      <aside className="sidebar">
        <Logo />
        <div className="workspace-label">PARTNER WORKSPACE</div>
        <nav className="side-nav">
          <button className={activeNav === "Overview" ? "active" : ""} onClick={() => setActiveNav("Overview")}>
            <Icon name="grid" /> {t.overview}
          </button>
          <button className={activeNav === "Supply & Harvest" ? "active" : ""} onClick={() => setActiveNav("Supply & Harvest")}>
            <Icon name="leaf" /> {t.supply}
          </button>
          <button className={activeNav === "Reservations" ? "active" : ""} onClick={() => setActiveNav("Reservations")}>
            <Icon name="box" /> {t.reservations}{" "}
            <span className="nav-count">{reservations.filter(r => r.status === "Pending" || r.status === "Ready").length}</span>
          </button>
          <button className={activeNav === "Impact Reports" ? "active" : ""} onClick={() => setActiveNav("Impact Reports")}>
            <Icon name="chart" /> {t.reports}
          </button>
        </nav>
        <div className="workspace-label app-modules-label">APP MODULES</div>
        <nav className="side-nav module-links" aria-label="App modules">
          <button onClick={() => onChange("market")}><Icon name="home" /> {t.market}</button>
          <button onClick={() => onChange("passport")}><Icon name="ticket" /> {t.ticket}</button>
          <button onClick={() => onChange("impact")}><Icon name="trend" /> {t.impact}</button>
        </nav>
        <div className="farmer-level">
          <HarvestEmblem size={45} />
          <div>
            <span>LEVEL 4 · FOOD KEEPER</span>
            <strong>{leafPoints} leaf points</strong>
            <i><b /></i>
          </div>
        </div>
        <div className="sidebar-bottom">
          <PreferenceButtons preferences={preferences} />
          <button className={activeNav === "Settings" ? "active" : ""} onClick={() => setActiveNav("Settings")}>
            <Icon name="settings" /> {t.settings}
          </button>
          <div className="partner-profile">
            <div className="avatar">MC</div>
            <div><strong>MSU Canteen 1</strong><span>Verified partner</span></div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dash-header">
          <div>
            <p className="eyebrow">{activeNav === "Overview" ? "MONDAY, MAY 20" : "PARTNER MODULE"}</p>
            <h1>{activeNav === "Overview" ? t.greeting : activeNav}</h1>
            <p>{activeNav === "Overview" ? t.greetingCopy
              : activeNav === "Supply & Harvest" ? "Manage availability, forecasts, and proactive surplus routing."
              : activeNav === "Reservations" ? "Prepare orders and verify every physical handoff."
              : activeNav === "Impact Reports" ? "Track verified outcomes and generate government-ready reports."
              : "Manage your partner profile, fulfillment rules, and alerts."}</p>
          </div>
          <button className="icon-button" aria-label="Notifications" onClick={() => notify("You're all caught up. No new alerts.")}>
            <Icon name="bell" />
          </button>
        </div>

        {activeNav === "Overview" ? (
          <>
            <div className="dash-stats">
              <div>
                <span>Today's reservations</span>
                <strong>{reservations.length}</strong>
                <em>+12% vs. last Monday</em>
              </div>
              <div>
                <span>Meals rescued this week</span>
                <strong>{shared.totalMeals + 120}</strong>
                <em>{(shared.totalWasteKg + 28.4).toFixed(1)} kg waste avoided</em>
              </div>
              <div>
                <span>Partner reliability</span>
                <strong>98%</strong>
                <em>Excellent standing</em>
              </div>
            </div>

            <article className="daily-mission">
              <HarvestEmblem size={66} />
              <div className="mission-copy">
                <span>PLENTARI GUIDE · 2 OF 3 COMPLETE</span>
                <h2>{t.mission}</h2>
                <p>{t.missionCopy}</p>
              </div>
              <div className="mission-steps">
                <span className="done"><Icon name="check" size={14} /> Log supply</span>
                <span className="done"><Icon name="check" size={14} /> Publish rescue</span>
                <span><Icon name="ticket" size={14} /> Verify 1 pickup</span>
              </div>
              <div className="mission-reward">
                <Icon name="trophy" size={18} />
                <strong>+120</strong>
                <span>leaf points</span>
              </div>
            </article>

            <div className="dashboard-grid">
              {/* Supply Entry Card */}
              <article className="dash-card supply-card">
                <div className="card-heading">
                  <div>
                    <span className="step-badge">1</span>
                    <div>
                      <h2>Today's Expected Harvest/Meals</h2>
                      <p>Log expected harvest or prepared meals for today.</p>
                    </div>
                  </div>
                  <span className="draft-badge">{published ? "Live" : "Draft"}</span>
                </div>

                {/* Hub selector */}
                <div className="hub-selector">
                  <button className={hub === "MSU Canteen 1 – Meals" ? "active" : ""} onClick={() => { setHub("MSU Canteen 1 – Meals"); setPublished(false) }}>
                    🏫 MSU Canteen 1
                  </button>
                  <button className={hub === "Lanao Growers Cluster – Pre-Harvest" ? "active" : ""} onClick={() => { setHub("Lanao Growers Cluster – Pre-Harvest"); setPublished(false) }}>
                    🌾 Lanao Growers
                  </button>
                </div>

                <div className="mode-toggle">
                  <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual</button>
                  <button className={mode === "csv" ? "active" : ""} onClick={() => setMode("csv")}>
                    <Icon name="upload" size={16} /> CSV Upload
                  </button>
                </div>

                {mode === "manual" ? (
                  <div className="entry-form">
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 1 }}>Product or meal name
                        <input value={formName} onChange={e => setFormName(e.target.value)} />
                      </label>
                      <label style={{ width: 90 }}>Route
                        <select value={formRoute} onChange={e => setFormRoute(e.target.value as "Rescue" | "Order" | "Share")}>
                          <option value="Rescue">Rescue</option>
                          <option value="Order">Order</option>
                          <option value="Share">Share</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Expected quantity
                        <div className="input-unit">
                          <input type="number" value={formQty} onChange={e => setFormQty(Number(e.target.value))} />
                          <span>meals</span>
                        </div>
                      </label>
                      <label>Ready by<input type="time" value={formReadyBy} onChange={e => setFormReadyBy(e.target.value)} /></label>
                    </div>
                    <div className="form-row">
                      <label>Regular price
                        <div className="input-unit currency">
                          <span>₱</span>
                          <input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} />
                        </div>
                      </label>
                      <label>Safe until<input type="time" value={formSafeUntil} onChange={e => setFormSafeUntil(e.target.value)} /></label>
                    </div>
                    {extraItem && (
                      <label className="extra-item">Additional product or meal
                        <input autoFocus placeholder="Enter item name" />
                      </label>
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="add-row" onClick={() => setExtraItem(!extraItem)}>
                        {extraItem ? "− Remove additional item" : "+ Add another item"}
                      </button>
                      <button className="sample-pos-btn" onClick={loadSamplePOS} title="Load sample POS data">
                        <Icon name="upload" size={12} /> Load Sample POS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-zone">
                    <div className="upload-icon"><Icon name="upload" /></div>
                    <strong>Drop your supply sheet here</strong>
                    <p>CSV up to 5 MB · Use the Plentari template</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <label className="file-button">Choose file
                        <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) notify(`${f.name} is ready to import.`) }} />
                      </label>
                      <button className="sample-pos-btn" onClick={loadSamplePOS}>
                        <Icon name="upload" size={12} /> Sample POS Data
                      </button>
                    </div>
                  </div>
                )}
              </article>

              {/* AI Forecast Card */}
              <article className="dash-card intelligence-card">
                <div className="card-heading compact">
                  <div>
                    <span className="ai-badge"><Icon name="spark" size={16} /></span>
                    <div>
                      <h2>AI Forecast: Expected Sales &amp; Predicted Surplus</h2>
                      <p>Predictive signals from your hub and local context</p>
                    </div>
                  </div>
                  <span className="live-badge"><i /> Live</span>
                </div>

                <ForecastSimulator qty={formQty} price={formPrice} />

                <button
                  className={`publish-button ${published ? "published" : ""}`}
                  onClick={() => { if (!published) setShowPublishModal(true) }}
                >
                  <Icon name={published ? "check" : "shield"} />
                  {published ? "Published to Plentari Market" : "Approve & Publish"}
                </button>
                <p className="publish-note">AI recommends. You approve. Human safety gate required.</p>
              </article>
            </div>
          </>
        ) : (
          <PartnerModulePage page={activeNav} notify={notify} openOverview={() => setActiveNav("Overview")} shared={shared} />
        )}
      </main>
    </section>
  )
}

// ─── Market (Consumer) ─────────────────────────────────────────────────────────

function Market({
  onChange, notify, preferences, shared,
}: {
  onChange: (s: Screen) => void
  notify: Notify
  preferences: Preferences
  shared: SharedState
}) {
  const { listings, reservations, setReservations, ngoReserved } = shared
  const [tab, setTab] = useState("Rescue")
  const [basketItems, setBasketItems] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [hub, setHub] = useState("MSU–Marawi Campus Hub")
  const [sheet, setSheet] = useState<null | "menu" | "basket" | "location" | "all">(null)
  const t = translations[preferences.language]

  const feedCopy: Record<string, { title: string; subtitle: string }> = {
    Order: { title: "Plan ahead", subtitle: "Reserve harvests before they reach the hub" },
    Rescue: { title: "Available near you", subtitle: "Proactive offers before food becomes surplus" },
    Share: { title: "Community shares", subtitle: "Verified food support from trusted partners" },
  }

  const tabListings = listings.filter(l => l.route === tab && l.qty > 0)
  const basketTotal = basketItems.reduce((total, name) => {
    const listing = listings.find(l => l.name === name)
    return total + (listing?.rescuePrice ?? 0)
  }, 0)

  const addToBasket = (name: string) => {
    setBasketItems(items => [...items, name])
    notify(`${name} added to your basket.`)
  }

  const confirmReservation = () => {
    if (basketItems.length === 0) return
    const newReservations: LiveReservation[] = basketItems.map((name, i) => {
      const listing = listings.find(l => l.name === name)!
      const id = `PLN-${String(900 + reservations.length + i).padStart(4, "0")}`
      return {
        id,
        consumer: "Sara Macapaar",
        item: name,
        qty: 1,
        price: listing?.rescuePrice ?? 0,
        pickupWindow: "1:30–2:15 PM",
        status: "Pending",
        kgPerUnit: listing?.kgPerUnit ?? 0.4,
        source: listing?.source ?? "MSU Canteen 1",
        createdAt: Date.now(),
      }
    })
    setReservations(prev => [...prev, ...newReservations])
    setBasketItems([])
    setSheet(null)
    onChange("passport")
    notify("Reservation confirmed! Your pickup pass is ready.")
  }

  return (
    <section className="phone-screen market-screen">
      <div className="mobile-topbar">
        <button className="round-button" aria-label="Open menu" onClick={() => setSheet("menu")}>
          <span className="menu-lines" />
        </button>
        <Logo />
        <button className="round-button basket-button" aria-label={`${basketItems.length} items in basket`} onClick={() => setSheet("basket")}>
          <Icon name="cart" size={19} />
          {basketItems.length > 0 && <span>{basketItems.length}</span>}
        </button>
      </div>

      <main className="phone-content">
        <button className="location" onClick={() => setSheet("location")}>
          <span><Icon name="pin" size={17} /></span>
          <span><small>YOUR HUB</small>{hub}</span>
          <Icon name="arrow" size={17} />
        </button>
        <div className="mobile-game-strip">
          <HarvestEmblem size={42} />
          <div>
            <span>3-DAY GOOD FOOD STREAK</span>
            <strong>{shared.leafPoints} leaf points</strong>
          </div>
          <div className="streak-days">
            <i className="done">M</i><i className="done">T</i><i className="done">W</i><i>T</i>
          </div>
        </div>
        <div className="market-intro">
          <p>Good afternoon, Sara</p>
          <h1>{t.goodFood}</h1>
        </div>
        <div className="market-tabs" role="tablist">
          {["Order", "Rescue", "Share"].map((item) => (
            <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} key={item}
              onClick={() => { setTab(item); if (item !== "Rescue") notify(`${item} inventory preview selected.`) }}>
              {item === "Order" ? t.order : item === "Rescue" ? t.rescue : t.share}
              {item === "Rescue" && <span>{listings.filter(l => l.route === "Rescue" && l.qty > 0).length}</span>}
            </button>
          ))}
        </div>
        <div className="feed-heading">
          <div>
            <h2>{tab === "Rescue" ? t.available : feedCopy[tab].title}</h2>
            <p>{feedCopy[tab].subtitle}</p>
          </div>
          <button onClick={() => setSheet("all")}>See all</button>
        </div>

        {tab === "Share" && <NgoShareTracker reserved={ngoReserved} />}

        {tabListings.length === 0 && (
          <div className="empty-feed">
            <Icon name="leaf" size={32} />
            <p>No {tab.toLowerCase()} offers right now.<br /><small>Partner publishes will appear here instantly.</small></p>
          </div>
        )}

        {tabListings.slice(0, 1).map(listing => (
          <article key={listing.id} className="product-card featured">
            <div className="product-photo">
              <img src={listing.image} alt={listing.name} />
              <span className="photo-badge"><Icon name="clock" size={13} /> Safe until {listing.safeUntil}</span>
              <button className={saved ? "saved" : ""} aria-label={saved ? `Remove ${listing.name} from saved` : `Save ${listing.name}`}
                onClick={() => { setSaved(!saved); notify(saved ? "Removed from your saved offers." : "Saved for quick access.") }}>
                <Icon name="leaf" size={18} />
              </button>
            </div>
            <div className="product-info">
              <div className="seller">
                <span className="seller-mark">{listing.source[0]}</span>
                <span>{listing.source.toUpperCase()}<small>0.3 km away</small></span>
                <span className="verified"><Icon name="check" size={11} /></span>
              </div>
              <h3>{listing.source} – {listing.name}</h3>
              <div className="product-bottom">
                <div>
                  <strong>₱{listing.rescuePrice}</strong>
                  <del>₱{listing.price}</del>
                  <span className="rescue-label">PROACTIVE {listing.route.toUpperCase()} · {listing.qty} LEFT</span>
                </div>
                <button className="add-to-basket" onClick={() => addToBasket(listing.name)}>
                  <Icon name="cart" size={16} /> {t.addBasket}
                </button>
              </div>
            </div>
          </article>
        ))}

        {tabListings.slice(1).map(listing => (
          <article key={listing.id} className="product-card horizontal extra-product">
            <img src={listing.image} alt={listing.name} loading="lazy" />
            <div className="horizontal-info">
              <span className="preharvest">{listing.route.toUpperCase()} · {listing.qty} LEFT</span>
              <h3>{listing.name}</h3>
              <p>{listing.source} · 0.6 km</p>
              <div>
                <strong>₱{listing.rescuePrice} <small>/ unit</small></strong>
                <button className="ingredient-add add-to-basket" onClick={() => addToBasket(listing.name)}>
                  <Icon name="cart" size={16} /> {t.addBasket}
                </button>
              </div>
            </div>
          </article>
        ))}

        {tab === "Share" && (
          <>
            <article className="product-card horizontal extra-product">
              <img src={CURRY_IMAGE} alt="Community rice meal share" />
              <div className="horizontal-info">
                <span className="preharvest">COMMUNITY SHARE · VERIFIED</span>
                <h3>Family Rice Meal Pack</h3>
                <p>Marawi Community Hub · 0.8 km</p>
                <div>
                  <strong>Free <small>/ verified recipient</small></strong>
                  <button className="ingredient-add" onClick={() => notify("Community share request submitted.")}>Request</button>
                </div>
              </div>
            </article>
            <article className="share-info-card">
              <span><Icon name="share" /></span>
              <div>
                <strong>Share food safely</strong>
                <p>All community shares use verified sources and QR handoffs.</p>
              </div>
              <button onClick={() => notify("Community sharing guide opened.")}>Learn more</button>
            </article>
          </>
        )}
      </main>

      <MobileNav active="market" onChange={onChange} language={preferences.language} />

      {sheet === "menu" && (
        <MobileSheet title="Plentari menu" onClose={() => setSheet(null)}>
          <div className="sheet-menu">
            <button onClick={() => { setSheet(null); onChange("market") }}><Icon name="home" /> Explore Market<Icon name="arrow" /></button>
            <button onClick={() => { setSheet(null); onChange("passport") }}><Icon name="ticket" /> Pickup passes<Icon name="arrow" /></button>
            <button onClick={() => { setSheet(null); onChange("impact") }}><Icon name="trend" /> My impact<Icon name="arrow" /></button>
          </div>
          <div className="mobile-preferences">
            <div><strong>Display &amp; language</strong><span>Make Plentari easier to use</span></div>
            <PreferenceButtons preferences={preferences} />
          </div>
        </MobileSheet>
      )}

      {sheet === "basket" && (
        <MobileSheet title={`Your basket · ${basketItems.length} items`} onClose={() => setSheet(null)}>
          <div className="basket-summary">
            {basketItems.length === 0 && <p style={{ textAlign: "center", color: "var(--grey)", padding: "20px 0" }}>Your basket is empty.</p>}
            {basketItems.map((name, i) => {
              const listing = listings.find(l => l.name === name)
              return (
                <div className="basket-item" key={`${name}-${i}`}>
                  {listing && <img src={listing.image} alt="" />}
                  <div>
                    <strong>{name}</strong>
                    <span>{listing?.source ?? "MSU Canteen 1"} · Pickup today</span>
                  </div>
                  <strong>₱{listing?.rescuePrice ?? 0}</strong>
                  <button className="basket-remove" aria-label={`Remove ${name}`}
                    onClick={() => setBasketItems(items => items.filter((_, idx) => idx !== i))}>×</button>
                </div>
              )
            })}
            <div className="basket-total"><span>Estimated total</span><strong>₱{basketTotal}</strong></div>
            <button className="sheet-primary" disabled={basketItems.length === 0} onClick={confirmReservation}>Reserve for pickup</button>
          </div>
        </MobileSheet>
      )}

      {sheet === "location" && (
        <MobileSheet title="Choose your campus hub" onClose={() => setSheet(null)}>
          <div className="location-list">
            {["MSU–Marawi Campus Hub", "Iligan City Hub"].map((h) => (
              <button key={h} className={hub === h ? "selected" : ""} onClick={() => { setHub(h); setSheet(null); notify(`${h} selected.`) }}>
                <span><Icon name="pin" /></span>
                <div><strong>{h}</strong><small>{h === "MSU–Marawi Campus Hub" ? "Current hub · 6 offers nearby" : "28.6 km · 12 offers"}</small></div>
                <Icon name={hub === h ? "check" : "arrow"} />
              </button>
            ))}
          </div>
        </MobileSheet>
      )}

      {sheet === "all" && (
        <MobileSheet title={`All ${tab} offers`} onClose={() => setSheet(null)}>
          <div className="all-offers">
            <p>Showing verified offers available from your selected hub.</p>
            {tabListings.map((l, i) => (
              <button key={l.id} onClick={() => { setSheet(null); notify(`${l.name} selected.`) }}>
                <span className="offer-index">0{i + 1}</span>
                <div><strong>{l.name}</strong><small>{l.qty} remaining · ₱{l.rescuePrice}</small></div>
                <Icon name="arrow" />
              </button>
            ))}
            {tabListings.length === 0 && <p style={{ color: "var(--grey)" }}>No {tab.toLowerCase()} offers available right now.</p>}
          </div>
        </MobileSheet>
      )}
    </section>
  )
}

// ─── Passport (Consumer QR Passes) ────────────────────────────────────────────

function Passport({
  onChange, notify, preferences, shared,
}: {
  onChange: (s: Screen) => void
  notify: Notify
  preferences: Preferences
  shared: SharedState
}) {
  const { reservations, setReservations, setLedger, setLeafPoints, setListings } = shared
  const [showEvidence, setShowEvidence] = useState(false)
  const [activePassIdx, setActivePassIdx] = useState(0)
  const t = translations[preferences.language]

  const myPasses = reservations.filter(r => r.consumer === "Sara Macapaar")
  const activePass = myPasses[activePassIdx] ?? myPasses[0]

  const simulateQRScan = () => {
    if (!activePass) return
    const idx = reservations.findIndex(r => r.id === activePass.id)
    if (idx < 0 || activePass.status === "QR-Verified" || activePass.status === "Collected") return
    const updated = [...reservations]
    updated[idx] = { ...activePass, status: "QR-Verified" }
    setReservations(updated)
    const kgSaved = activePass.qty * activePass.kgPerUnit
    const newEntry: LedgerEntry = {
      id: `LED-${Date.now()}`,
      title: `${activePass.item} Handoff`,
      source: activePass.source,
      time: "Just now",
      value: activePass.price > 0 ? `+₱${activePass.price}` : "Shared",
      impact: `${kgSaved.toFixed(2)} kg`,
      kgNum: kgSaved,
      phpNum: activePass.price,
    }
    setLedger(prev => [newEntry, ...prev])
    setLeafPoints(p => p + Math.round(kgSaved * 10))
    setListings(prev => prev.map(l => l.name === activePass.item ? { ...l, qty: Math.max(0, l.qty - activePass.qty) } : l))
    notify("QR scan verified! Handoff logged to your Impact Ledger.")
  }

  const sharePass = async () => {
    const shareData = { title: "Plentari pickup pass", text: `Reservation ${activePass?.id ?? "PLN-0842"} at ${activePass?.source ?? "MSU Canteen 1"}.` }
    try {
      if (typeof navigator.share === "function") await navigator.share(shareData)
      else await navigator.clipboard.writeText(shareData.text)
      notify(typeof navigator.share === "function" ? "Pickup pass shared." : "Pickup details copied.")
    } catch {
      notify("Sharing cancelled. Your pickup pass is still saved.")
    }
  }

  return (
    <section className="phone-screen passport-screen">
      <div className="simple-header">
        <button aria-label="Back to market" onClick={() => onChange("market")}><Icon name="back" /></button>
        <span>{t.reservationConfirmed}</span>
        <div className="simple-actions">
          <PreferenceButtons preferences={preferences} compact />
          <button aria-label="Share pickup pass" onClick={sharePass}><Icon name="share" /></button>
        </div>
      </div>

      <main className="passport-content">
        {/* Pass selector tabs */}
        {myPasses.length > 1 && (
          <div className="pass-tabs">
            {myPasses.map((p, i) => (
              <button key={p.id} className={activePassIdx === i ? "active" : ""} onClick={() => setActivePassIdx(i)}>
                {p.id} <em className={`status-pill ${p.status.toLowerCase().replace(/-/g, "")}`}>{p.status}</em>
              </button>
            ))}
          </div>
        )}

        {!activePass ? (
          <div className="empty-pass">
            <Icon name="ticket" size={48} />
            <h2>No passes yet</h2>
            <p>Add items to your basket in the Market and reserve them to get a pickup pass.</p>
            <button className="sheet-primary" onClick={() => onChange("market")}>Browse Market</button>
          </div>
        ) : (
          <>
            <div className="confirmed-icon">
              {activePass.status === "QR-Verified" || activePass.status === "Collected"
                ? <Icon name="check" size={28} />
                : <Icon name="ticket" size={28} />}
            </div>
            <p className="confirmation-kicker">
              {activePass.status === "QR-Verified" ? "PICKUP COMPLETE · QR VERIFIED" : t.reservationConfirmed.toUpperCase()}
            </p>
            <h1>{activePass.status === "QR-Verified" ? "Handoff complete!" : t.mealWaiting}</h1>
            <p className="confirmation-copy">{t.showPass}</p>

            <article className="passport-card">
              <div className="passport-title">
                <div>
                  <span>FOOD SAFETY PASSPORT</span>
                  <h2>{activePass.item}</h2>
                </div>
                <button className="halal" onClick={() => setShowEvidence(true)}>Halal evidence attached</button>
              </div>
              <div className="passport-details">
                <div><span>{t.source}</span><strong>{activePass.source}</strong></div>
                <div><span>{t.preparation}</span><strong>11:00 AM</strong></div>
                <div><span>{t.allergens}</span><strong>None</strong></div>
              </div>
              <div className="pickup-window">
                <Icon name="clock" />
                <div><span>{t.validPickup}</span><strong>{activePass.pickupWindow}</strong></div>
              </div>
            </article>

            <div className="qr-section">
              <QRCode />
              <h2>{t.scanPickup}</h2>
              <p>Reservation <strong>{activePass.id}</strong> · Single use only</p>
            </div>

            {/* Simulate QR Scan button */}
            {activePass.status !== "QR-Verified" && activePass.status !== "Collected" && (
              <button className="simulate-qr-btn" onClick={simulateQRScan}>
                <Icon name="check" size={16} /> {t.simulateScan}
              </button>
            )}
            {(activePass.status === "QR-Verified" || activePass.status === "Collected") && (
              <div className="qr-verified-banner">
                <Icon name="check" size={16} /> QR Verified · Impact logged to your ledger
              </div>
            )}

            <div className="wallet-note">
              <span><Icon name="check" size={14} /></span>
              <p><strong>{t.savedWallet}</strong><br />{t.offlineCopy}</p>
            </div>
          </>
        )}
      </main>

      <MobileNav active="passport" onChange={onChange} language={preferences.language} />

      {showEvidence && (
        <MobileSheet title="Halal evidence" onClose={() => setShowEvidence(false)}>
          <div className="evidence-card">
            <span className="evidence-seal"><Icon name="check" size={24} /></span>
            <p>VERIFIED FOOD SAFETY RECORD</p>
            <h3>Halal preparation evidence</h3>
            <dl>
              <div><dt>Partner</dt><dd>{activePass?.source ?? "MSU Canteen 1"}</dd></div>
              <div><dt>Evidence ID</dt><dd>HL-MSU-2026-184</dd></div>
              <div><dt>Last reviewed</dt><dd>May 12, 2026</dd></div>
            </dl>
            <button className="sheet-primary" onClick={() => { setShowEvidence(false); notify("Evidence record verified.") }}>Done</button>
          </div>
        </MobileSheet>
      )}
    </section>
  )
}

// ─── Impact Ledger (Consumer) ──────────────────────────────────────────────────

function Impact({
  onChange, notify, preferences, shared,
}: {
  onChange: (s: Screen) => void
  notify: Notify
  preferences: Preferences
  shared: SharedState
}) {
  const { ledger, totalWasteKg, totalPhp, leafPoints } = shared
  const [period, setPeriod] = useState("This month")
  const [sheet, setSheet] = useState<null | "notifications" | "export">(null)
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null)
  const t = translations[preferences.language]

  const BASE_WASTE = 542; const BASE_VALUE = 24100
  const dynamicWaste = (BASE_WASTE + totalWasteKg).toFixed(1)
  const dynamicValue = (BASE_VALUE + totalPhp).toLocaleString()
  const dynamicGrowthWaste = `${((totalWasteKg / BASE_WASTE) * 100 + 18).toFixed(0)}%`
  const dynamicGrowthValue = `${((totalPhp / BASE_VALUE) * 100 + 12).toFixed(0)}%`

  const metrics = period === "This month"
    ? { waste: dynamicWaste, value: dynamicValue, wasteGrowth: dynamicGrowthWaste, valueGrowth: dynamicGrowthValue }
    : { waste: "3,824", value: "168,700", wasteGrowth: "31%", valueGrowth: "27%" }

  return (
    <section className="phone-screen impact-screen">
      <div className="impact-header">
        <Logo />
        <div className="header-actions">
          <PreferenceButtons preferences={preferences} compact />
          <button className="round-button" aria-label="Notifications" onClick={() => setSheet("notifications")}>
            <Icon name="bell" size={19} />
            <i />
          </button>
        </div>
      </div>

      <main className="impact-content">
        <div className="impact-title">
          <div><p>{t.reporting}</p><h1>{t.everyPlate}</h1></div>
          <select aria-label="Impact period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>This month</option>
            <option>This year</option>
          </select>
        </div>

        {/* Live leaf points banner */}
        <div className="leaf-points-banner">
          <HarvestEmblem size={36} />
          <div>
            <span>YOUR LEAF POINTS</span>
            <strong>{leafPoints}</strong>
          </div>
          <span className="level-badge">Level 4 · Food Keeper</span>
        </div>

        <div className="metric-grid">
          <article>
            <span className="metric-icon"><Icon name="leaf" /></span>
            <p>{t.wasteAvoided}</p>
            <strong>{metrics.waste} <small>kg</small></strong>
            <span className="metric-growth">↑ {metrics.wasteGrowth} in this period</span>
          </article>
          <article>
            <span className="metric-icon"><Icon name="trend" /></span>
            <p>{t.recoveredValue}</p>
            <strong><small>PHP</small> {metrics.value}</strong>
            <span className="metric-growth">↑ {metrics.valueGrowth} in this period</span>
          </article>
        </div>

        <article className="community-card">
          <div>
            <span>COMMUNITY MILESTONE</span>
            <strong>{(1284 + shared.totalMeals).toLocaleString()} meals kept in motion</strong>
            <p>That's enough to serve {Math.floor((1284 + shared.totalMeals) / 30)} classrooms.</p>
          </div>
          <div className="milestone-art">
            <Icon name="leaf" size={44} />
            <i>84%</i>
          </div>
        </article>

        <div className="ledger-heading">
          <div><h2>Impact ledger</h2><p>Outcomes logged only through physical fulfillment</p></div>
          <button aria-label="Export verified transaction report" onClick={() => setSheet("export")}>•••</button>
        </div>

        <div className="transaction-list">
          {ledger.map((item, i) => (
            <button className="transaction-entry" key={item.id} onClick={() => setSelectedEntry(item)}>
              <div className="transaction-icon">
                <Icon name={i === 1 ? "leaf" : i === 3 ? "share" : "box"} size={18} />
              </div>
              <div className="transaction-main">
                <strong>{item.title}</strong>
                <span>{item.source}</span>
                <div><time>{item.time}</time><em>QR-VERIFIED</em></div>
              </div>
              <div className="transaction-value">
                <strong>{item.value}</strong>
                <span>{item.impact}</span>
              </div>
            </button>
          ))}
        </div>
      </main>

      <MobileNav active="impact" onChange={onChange} language={preferences.language} />

      {sheet === "notifications" && (
        <MobileSheet title="Impact updates" onClose={() => setSheet(null)}>
          <div className="notification-list">
            <div>
              <span><Icon name="trend" /></span>
              <p><strong>Your monthly report is ready</strong><small>{metrics.waste} kg of waste and methane avoided.</small></p>
            </div>
            <div>
              <span><Icon name="check" /></span>
              <p><strong>{ledger.filter(l => l.time.includes("Just now") || l.time.includes("Today")).length} handoffs verified today</strong><small>Every outcome was logged by QR.</small></p>
            </div>
          </div>
        </MobileSheet>
      )}

      {sheet === "export" && (
        <MobileSheet title="Export impact ledger" onClose={() => setSheet(null)}>
          <div className="export-options">
            <p>Exports include timestamps, source partners, impact methodology, and QR verification.</p>
            <button onClick={() => { setSheet(null); notify("PDF impact report downloaded.") }}>
              <span><Icon name="chart" /></span>
              <div><strong>Government-ready PDF</strong><small>Formatted summary and methodology</small></div>
              <Icon name="arrow" />
            </button>
            <button onClick={() => { setSheet(null); notify("CSV ledger downloaded.") }}>
              <span><Icon name="grid" /></span>
              <div><strong>Transaction CSV</strong><small>All verified ledger records</small></div>
              <Icon name="arrow" />
            </button>
          </div>
        </MobileSheet>
      )}

      {selectedEntry && (
        <MobileSheet title="Verified transaction" onClose={() => setSelectedEntry(null)}>
          <div className="transaction-detail">
            <span className="verified-seal"><Icon name="check" size={22} /></span>
            <p>QR-VERIFIED HANDOFF</p>
            <h3>{selectedEntry.title}</h3>
            <dl>
              <div><dt>Source</dt><dd>{selectedEntry.source}</dd></div>
              <div><dt>Timestamp</dt><dd>{selectedEntry.time}</dd></div>
              <div><dt>Recovered value</dt><dd>{selectedEntry.value}</dd></div>
              <div><dt>Waste avoided</dt><dd>{selectedEntry.impact}</dd></div>
            </dl>
            <button className="sheet-primary" onClick={() => setSelectedEntry(null)}>Close record</button>
          </div>
        </MobileSheet>
      )}
    </section>
  )
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({ leaving }: { leaving: boolean }) {
  return (
    <div className={`app-loading-screen ${leaving ? "leaving" : ""}`} role="status" aria-live="polite" aria-label="Plentari is loading">
      <div className="loading-brand">
        <img src={markDark} alt="Plentari" />
        <p>Growing smarter food systems</p>
      </div>
      <div className="loading-progress" aria-hidden="true"><i /></div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* ignore */ }
  }, [key, state])
  return [state, setState]
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("market")
  const [demoRole, setDemoRole] = useState<DemoRole>("consumer")
  const [notice, setNotice] = useState("")
  const [theme, setTheme] = useLocalState<Theme>("plt_theme", "light")
  const [language, setLanguage] = useLocalState<Language>("plt_lang", "en")
  const [loading, setLoading] = useState(true)
  const [loadingLeaving, setLoadingLeaving] = useState(false)

  // Shared live state
  const [listings, setListings] = useLocalState<LiveListing[]>("plt_listings", INITIAL_LISTINGS)
  const [reservations, setReservations] = useLocalState<LiveReservation[]>("plt_reservations", INITIAL_RESERVATIONS)
  const [ledger, setLedger] = useLocalState<LedgerEntry[]>("plt_ledger", INITIAL_LEDGER)
  const [leafPoints, setLeafPoints] = useLocalState<number>("plt_leaf", 860)
  const [ngoReserved, setNgoReserved] = useLocalState<number>("plt_ngo", 8)

  const totalWasteKg = useMemo(() => ledger.reduce((a, l) => a + l.kgNum, 0), [ledger])
  const totalPhp = useMemo(() => ledger.reduce((a, l) => a + l.phpNum, 0), [ledger])
  const totalMeals = useMemo(() => ledger.length, [ledger])

  const shared: SharedState = {
    reservations, setReservations,
    listings, setListings,
    ledger, setLedger,
    leafPoints, setLeafPoints,
    ngoReserved, setNgoReserved,
    totalWasteKg, totalPhp, totalMeals,
  }

  const preferences: Preferences = {
    theme, language,
    toggleTheme: () => setTheme(v => v === "light" ? "dark" : "light"),
    toggleLanguage: () => setLanguage(v => v === "en" ? "fil" : "en"),
  }

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(c => c === message ? "" : c), 2800)
  }

  const resetDemo = () => {
    setListings(INITIAL_LISTINGS)
    setReservations(INITIAL_RESERVATIONS)
    setLedger(INITIAL_LEDGER)
    setLeafPoints(860)
    setNgoReserved(8)
    setScreen("market")
    setDemoRole("consumer")
    notify("Demo data reset.")
  }

  useEffect(() => {
    const t1 = window.setTimeout(() => setLoadingLeaving(true), 1500)
    const t2 = window.setTimeout(() => setLoading(false), 1900)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [])

  if (loading) return <LoadingScreen leaving={loadingLeaving} />

  const isConsumer = screen !== "dashboard"

  return (
    <div className="app-shell" data-theme={theme} lang={language}>
      <DemoRoleBanner role={demoRole} setRole={setDemoRole} screen={screen} setScreen={setScreen} onReset={resetDemo} />

      <div className={`preview-stage ${!isConsumer ? "tablet-stage" : "phone-stage"}`}>
        <div className={!isConsumer ? "tablet-frame" : "phone-frame"}>
          {screen === "dashboard" && (
            <Dashboard notify={notify} onChange={setScreen} preferences={preferences} shared={shared} />
          )}
          {screen === "market" && (
            <Market onChange={setScreen} notify={notify} preferences={preferences} shared={shared} />
          )}
          {screen === "passport" && (
            <Passport onChange={setScreen} notify={notify} preferences={preferences} shared={shared} />
          )}
          {screen === "impact" && (
            <Impact onChange={setScreen} notify={notify} preferences={preferences} shared={shared} />
          )}
        </div>
      </div>

      <div className={`app-toast ${notice ? "visible" : ""}`} role="status" aria-live="polite">
        <span><Icon name="check" size={14} /></span>
        {notice}
      </div>
    </div>
  )
}
