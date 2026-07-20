"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Level = "normal" | "awareness" | "caution" | "restricted" | "critical" | "retreat" | "resolved";
type TamperState = "normal" | "suspected" | "confirmed";
type Vibration = "none" | "soft" | "repeated" | "strong" | "continuous";
type EventType =
  | "simulator_started"
  | "awareness_entered"
  | "caution_entered"
  | "restricted_entered"
  | "critical_entered"
  | "retreat_started"
  | "resolved"
  | "wearable_offline"
  | "wearable_online"
  | "tamper_suspected"
  | "tamper_confirmed"
  | "silent_notification_sent"
  | "help_requested"
  | "event_note_added"
  | "event_log_viewed"
  | "evidence_saved";
type TimelineEvent = { id: string; time: string; type: EventType; level: Level; title: string; detail: string };
type IconName = "shield" | "bell" | "watch" | "console" | "route" | "signal" | "reset" | "play" | "pause" | "lock" | "note";
type RelayStatus = "pending" | "sent" | "acknowledged" | "logged" | "escalated";

const INITIAL_DEMO_TIME = "18:30:34";
const INITIAL_EVENT: TimelineEvent = {
  id: "initial-simulator-event",
  time: INITIAL_DEMO_TIME,
  type: "simulator_started",
  level: "normal",
  title: "模擬器已啟動",
  detail: "App、Boundary、Wearable 與 Console 同步完成"
};

const META: Record<Level, { label: string; en: string; color: string; message: string; guidance: string }> = {
  normal: { label: "正常", en: "NORMAL", color: "#6fc7ff", message: "防護已啟用", guidance: "Protection is active." },
  awareness: { label: "預警", en: "AWARENESS", color: "#7fcaff", message: "偵測到外圈接近", guidance: "A restricted device is approaching the outer boundary." },
  caution: { label: "警戒", en: "CAUTION", color: "#ffb84d", message: "請提高警覺", guidance: "Stay aware and move toward a safer area." },
  restricted: { label: "限制", en: "RESTRICTED", color: "#ff784d", message: "限制邊界已被進入", guidance: "The restricted boundary has been entered." },
  critical: { label: "危急", en: "CRITICAL", color: "#ff4d5a", message: "安全轉送已啟動", guidance: "Critical proximity detected. Safety relay is active." },
  retreat: { label: "撤退中", en: "RETREAT", color: "#ffb84d", message: "對方正在遠離", guidance: "The restricted device is moving away." },
  resolved: { label: "已解除", en: "RESOLVED", color: "#78c8ec", message: "事件已解除並封存", guidance: "The event has been resolved and recorded." }
};

const LEVEL_EVENT: Partial<Record<Level, EventType>> = {
  awareness: "awareness_entered",
  caution: "caution_entered",
  restricted: "restricted_entered",
  critical: "critical_entered",
  retreat: "retreat_started",
  resolved: "resolved"
};

const EVENT_ICON: Record<EventType, IconName> = {
  simulator_started: "play", awareness_entered: "bell", caution_entered: "bell", restricted_entered: "lock",
  critical_entered: "bell", retreat_started: "route", resolved: "shield", wearable_offline: "signal",
  wearable_online: "signal", tamper_suspected: "lock", tamper_confirmed: "lock",
  silent_notification_sent: "bell", help_requested: "bell", event_note_added: "note",
  event_log_viewed: "console", evidence_saved: "shield"
};

const DEMO_STEPS: Array<{ second: number; distance: number; level: Level; action?: "suspected" | "confirmed" | "restore" }> = [
  { second: 5, distance: 470, level: "awareness" },
  { second: 12, distance: 270, level: "caution" },
  { second: 20, distance: 125, level: "restricted" },
  { second: 28, distance: 38, level: "critical" },
  { second: 38, distance: 38, level: "critical", action: "suspected" },
  { second: 45, distance: 38, level: "critical", action: "confirmed" },
  { second: 55, distance: 64, level: "critical", action: "restore" },
  { second: 62, distance: 180, level: "retreat" },
  { second: 72, distance: 640, level: "resolved" }
];

function getClientTime(): string {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(new Date());
}

function levelFor(distance: number): Level {
  return distance <= 50 ? "critical" : distance <= 150 ? "restricted" : distance <= 300 ? "caution" : distance <= 500 ? "awareness" : "normal";
}

function distanceToRadius(distance: number): number {
  const points = [
    { distance: 20, radius: 34 },
    { distance: 50, radius: 64 },
    { distance: 150, radius: 132 },
    { distance: 300, radius: 215 },
    { distance: 500, radius: 300 },
    { distance: 700, radius: 355 }
  ];
  const bounded = Math.max(points[0].distance, Math.min(points[points.length - 1].distance, distance));
  for (let index = 1; index < points.length; index += 1) {
    const outer = points[index];
    const inner = points[index - 1];
    if (bounded <= outer.distance) {
      const progress = (bounded - inner.distance) / (outer.distance - inner.distance);
      return Math.round(inner.radius + (outer.radius - inner.radius) * progress);
    }
  }
  return points[points.length - 1].radius;
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    shield: <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />,
    watch: <path d="M9 2h6l1 4H8l1-4Zm0 20h6l1-4H8l1 4ZM7 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />,
    console: <path d="M4 5h16v11H4V5Zm5 15h6m-3-4v4" />,
    route: <path d="M5 19c4 0 3-6 7-6s3-8 7-8M5 19l-2-2m2 2-2 2M19 5l2-2m-2 2 2 2" />,
    signal: <path d="M5 12.5a10 10 0 0 1 14 0M8 16a6 6 0 0 1 8 0m-4 4h.01" />,
    reset: <path d="M4 4v6h6M5 9a8 8 0 1 1 2 8" />,
    play: <path d="m9 6 9 6-9 6V6Z" />,
    pause: <path d="M9 6v12m6-12v12" />,
    lock: <path d="M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Z" />,
    note: <path d="M5 3h11l3 3v15H5V3Zm11 0v4h4M8 11h8M8 15h6" />
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Pill({ level, pulse = false }: { level: Level; pulse?: boolean }) {
  const meta = META[level];
  return <span className={`pill ${pulse ? "pulse" : ""}`} style={{ "--tone": meta.color } as CSSProperties}><i />{meta.en}<b>{meta.label}</b></span>;
}

function BoundaryField({ distance, level, online, violationTrace }: { distance: number; level: Level; online: boolean; violationTrace: boolean }) {
  const meta = META[level];
  const markerRadius = distanceToRadius(distance);
  const markerX = 400 + markerRadius;
  const markerY = 176;
  const sweepDuration = level === "critical" ? "4s" : level === "caution" || level === "restricted" ? "4.8s" : "5.8s";
  return (
    <div className={`field level-${level} ${!online ? "signal-interrupted" : ""}`} style={{ "--tone": meta.color, "--sweep-speed": sweepDuration } as CSSProperties}>
      <svg className="boundary-svg" viewBox="0 0 800 340" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`受限制裝置距離保護核心 ${distance} 公尺`}>
        <defs>
          <radialGradient id="coreGlow"><stop offset="0" stopColor={meta.color} stopOpacity=".3" /><stop offset="1" stopColor={meta.color} stopOpacity="0" /></radialGradient>
          <radialGradient id="sweepGlow" gradientUnits="userSpaceOnUse" cx="400" cy="176" r="320"><stop offset="0" stopColor="#63c8ff" stopOpacity=".025" /><stop offset=".62" stopColor="#63c8ff" stopOpacity=".1" /><stop offset="1" stopColor="#63c8ff" stopOpacity="0" /></radialGradient>
          <linearGradient id="trailFade" x1="0" y1="0" x2="1" y2="0"><stop stopColor={meta.color} stopOpacity=".55" /><stop offset="1" stopColor={meta.color} stopOpacity="0" /></linearGradient>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <ellipse className="field-ambient" cx="400" cy="176" rx="350" ry="116" fill="url(#coreGlow)" />
        <ellipse className="sonar-frame-ring" cx="400" cy="176" rx="342" ry="106" />
        <g className="sweep-group">
          <path className="sonar-afterglow" d="M400 176 352 80A342 106 0 0 1 400 70Z" fill="url(#sweepGlow)" />
          <path className="sonar-wedge" d="M400 176 400 70A342 106 0 0 1 540 80Z" fill="url(#sweepGlow)" />
          <line className="sonar-leading-edge" x1="400" y1="176" x2="540" y2="80" />
        </g>

        <g className="ring-layer ring-awareness"><ellipse cx="400" cy="176" rx="300" ry="92" /><circle cx="100" cy="176" r="2.5" /><circle cx="700" cy="176" r="2.5" /><circle cx="400" cy="84" r="2.5" /></g>
        <g className="ring-layer ring-caution"><ellipse cx="400" cy="176" rx="215" ry="66" /><circle cx="185" cy="176" r="2.5" /><circle cx="615" cy="176" r="2.5" /><circle cx="400" cy="110" r="2.5" /></g>
        <g className="ring-layer ring-restricted"><ellipse cx="400" cy="176" rx="132" ry="41" /><circle cx="268" cy="176" r="2.5" /><circle cx="532" cy="176" r="2.5" /><circle cx="400" cy="135" r="2.5" /></g>
        <g className="ring-layer ring-critical"><ellipse cx="400" cy="176" rx="64" ry="20" /><circle cx="336" cy="176" r="2.5" /><circle cx="464" cy="176" r="2.5" /></g>

        <g className="protected-core">
          <circle className="core-orbit outer" cx="400" cy="176" r="43" />
          <circle className="core-orbit inner" cx="400" cy="176" r="34" />
          <circle className="core-shield-svg" cx="400" cy="176" r="27" />
          <path className="house-svg" d="M382 175 400 159 418 175V193H382Z M395 193V180H405V193" />
          <circle className="core-center-dot" cx="400" cy="176" r="2.5" />
          <text className="core-caption" x="400" y="225" textAnchor="middle">PROTECTED CORE</text>
        </g>

        <g className="marker-geometry" data-radius={markerRadius} data-axis="fixed-radial" style={{ "--marker-x": `${markerX}px`, "--marker-y": `${markerY}px` } as CSSProperties}>
          <line className="marker-trail-svg" x1="8" y1="0" x2={Math.min(28, 13 + markerRadius * 0.04)} y2="0" stroke="url(#trailFade)" />
          <circle className="marker-crossing-pulse" key={level} r="20" />
          <circle className="marker-pulse-svg" r="18" />
          <circle className="marker-node-svg" r="12" filter="url(#softGlow)" />
          <rect x="-4.5" y="-6" width="9" height="12" rx="2.5" />
          <path d="M-2.5-2H2.5M-2.5 1H2.5" />
          <text className="marker-name-svg" x="19" y="-3">R-DEVICE</text>
          <text className="marker-distance-svg" x="19" y="8">{distance}m</text>
        </g>

        <g className="distance-readout-svg" transform="translate(744 260)"><text className="distance-value-svg" textAnchor="end">{distance}</text><text className="distance-unit-svg" x="4">m</text><text className="distance-caption-svg" y="14" textAnchor="end">RELATIVE DISTANCE</text></g>
        <g className="legend-svg" transform="translate(214 315)"><circle className="legend-awareness" r="3" /><text x="8">預警 500m</text><circle className="legend-caution" cx="100" r="3" /><text x="108">警戒 300m</text><circle className="legend-restricted" cx="200" r="3" /><text x="208">限制 150m</text><circle className="legend-critical" cx="300" r="3" /><text x="308">危急 50m</text></g>
      </svg>
      {violationTrace && <div className="trace-badge"><Icon name="route" /> VIOLATION TRACE ACTIVE</div>}
      {!online && <div className="signal-badge"><Icon name="signal" /> SIGNAL INTERRUPTED</div>}
    </div>
  );
}

function PanelTitle({ icon, eyebrow, title, status }: { icon: "shield" | "watch" | "console"; eyebrow: string; title: string; status?: ReactNode }) {
  return <div className="panel-title"><div className="panel-mark"><Icon name={icon} /></div><div><span>{eyebrow}</span><h2>{title}</h2></div>{status && <div className="panel-title-status">{status}</div>}</div>;
}

export default function Simulator() {
  const [distance, setDistance] = useState(640);
  const [level, setLevel] = useState<Level>("normal");
  const [online, setOnline] = useState(true);
  const [tamper, setTamper] = useState<TamperState>("normal");
  const [playing, setPlaying] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);
  const [demoElapsed, setDemoElapsed] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([INITIAL_EVENT]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [actionFeedback, setActionFeedback] = useState("");
  const [soundMuted, setSoundMuted] = useState(true);
  const [headerTime, setHeaderTime] = useState(INITIAL_DEMO_TIME.slice(0, 5));
  const [lastSync, setLastSync] = useState(INITIAL_DEMO_TIME);
  const eventSequence = useRef(1);
  const lastLevel = useRef<Level>("normal");
  const completedDemoSteps = useRef<Set<number>>(new Set());
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    setHeaderTime(getClientTime().slice(0, 5));
    const clock = window.setInterval(() => setHeaderTime(getClientTime().slice(0, 5)), 30000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);

  const pushEvent = useCallback((type: EventType, eventLevel: Level, title: string, detail: string, notify = false) => {
    const event: TimelineEvent = {
      id: `runtime-event-${eventSequence.current++}`,
      time: getClientTime(),
      type,
      level: eventLevel,
      title,
      detail
    };
    setEvents(previous => [event, ...previous].slice(0, 24));
    if (notify) setNotificationCount(count => count + 1);
    if (online) setLastSync(event.time);
  }, [online]);

  const transitionTo = useCallback((nextLevel: Level, nextDistance: number, source: string) => {
    const bounded = Math.max(20, Math.min(700, Math.round(nextDistance)));
    setDistance(bounded);
    setLevel(nextLevel);
    if (nextLevel !== lastLevel.current) {
      const type = LEVEL_EVENT[nextLevel];
      if (type) {
        const detail = nextLevel === "restricted"
          ? `${source} · 距離 ${bounded}m · Violation trace 已啟動`
          : nextLevel === "critical"
            ? `${source} · 距離 ${bounded}m · Critical evidence 已建立`
            : `${source} · 相對距離 ${bounded}m`;
        pushEvent(type, nextLevel, `${META[nextLevel].label}狀態啟動`, detail, nextLevel === "critical" || nextLevel === "resolved");
        if (nextLevel === "critical") pushEvent("evidence_saved", "critical", "危急證據已保存", "距離、裝置回饋與通知狀態已寫入稽核紀錄");
        if (nextLevel === "resolved") pushEvent("evidence_saved", "resolved", "事件證據完成封存", "Critical、Retreat 與 Resolved 狀態鏈已完整記錄");
      }
      lastLevel.current = nextLevel;
    }
  }, [pushEvent]);

  const applyDistance = useCallback((nextDistance: number, source = "手動控制") => {
    transitionTo(levelFor(nextDistance), nextDistance, source);
  }, [transitionTo]);

  const setOffline = useCallback(() => {
    if (!online) return;
    setOnline(false);
    pushEvent("wearable_offline", level, "穿戴裝置離線", "最後同步已凍結，管理升級程序已啟動", true);
  }, [level, online, pushEvent]);

  const restoreOnline = useCallback(() => {
    if (online) return;
    setOnline(true);
    const time = getClientTime();
    setLastSync(time);
    pushEvent("wearable_online", level, "穿戴裝置恢復連線", "狀態補傳完成，四端同步已恢復", true);
  }, [level, online, pushEvent]);

  const setTamperState = useCallback((next: Exclude<TamperState, "normal">) => {
    if (tamper === next) return;
    setTamper(next);
    const confirmed = next === "confirmed";
    pushEvent(confirmed ? "tamper_confirmed" : "tamper_suspected", confirmed ? "critical" : "caution", confirmed ? "確認防拆事件" : "疑似拆卸裝置", confirmed ? "高優先事件與證據紀錄已建立" : "Management escalation 準備中", confirmed);
    if (confirmed) pushEvent("evidence_saved", "critical", "防拆證據已保存", "裝置感測快照已寫入不可變更事件紀錄");
  }, [pushEvent, tamper]);

  const resolveIncident = useCallback(() => {
    setTamper("normal");
    if (!online) setOnline(true);
    transitionTo("resolved", 640, "手動解除");
    setPlaying(false);
  }, [online, transitionTo]);

  const reset = useCallback(() => {
    setPlaying(false);
    setDemoStarted(false);
    setDemoElapsed(0);
    setOnline(true);
    setTamper("normal");
    setDistance(640);
    setLevel("normal");
    setNotificationCount(0);
    setActionFeedback("");
    setSoundMuted(true);
    setLastSync(INITIAL_DEMO_TIME);
    setEvents([INITIAL_EVENT]);
    eventSequence.current = 1;
    lastLevel.current = "normal";
    completedDemoSteps.current = new Set();
  }, []);

  const toggleDemo = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!demoStarted || demoElapsed >= 72) {
      reset();
      setDemoStarted(true);
      pushEvent("simulator_started", "normal", "Auto Demo 已開始", "72 秒跨裝置情境開始錄製");
    }
    setPlaying(true);
  }, [demoElapsed, demoStarted, playing, pushEvent, reset]);

  useEffect(() => {
    if (!playing) return;
    const tick = window.setTimeout(() => setDemoElapsed(second => second + 1), 1000);
    return () => window.clearTimeout(tick);
  }, [demoElapsed, playing]);

  useEffect(() => {
    if (!demoStarted) return;
    const step = DEMO_STEPS.find(item => item.second === demoElapsed);
    if (!step || completedDemoSteps.current.has(step.second)) return;
    completedDemoSteps.current.add(step.second);
    if (step.action === "suspected") setTamperState("suspected");
    if (step.action === "confirmed") setTamperState("confirmed");
    if (step.action === "restore") {
      setTamper("normal");
      if (!online) restoreOnline();
      pushEvent("wearable_online", step.level, "裝置狀態已恢復", "防拆警示解除，持續監測中");
    }
    transitionTo(step.level, step.distance, "Auto Demo");
    if (step.second === 72) setPlaying(false);
  }, [demoElapsed, demoStarted, online, pushEvent, restoreOnline, setTamperState, transitionTo]);

  const appAction = (action: "silent" | "help" | "note" | "log") => {
    const feedback = action === "silent" ? "Silent notification sent" : action === "help" ? "Safety relay activated" : action === "note" ? "Event note recorded" : "Event log opened";
    setActionFeedback(feedback);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setActionFeedback(""), 2200);
    if (action === "silent") pushEvent("silent_notification_sent", level, "靜默通知已送出", "安全聯絡人已收到低干擾提醒", true);
    if (action === "help") pushEvent("help_requested", "critical", "一鍵求助已啟動", "Safety Contact 與管理端已收到高優先通知", true);
    if (action === "note") pushEvent("event_note_added", level, "事件備註已新增", "被保護者端新增一筆模擬備註");
    if (action === "log") pushEvent("event_log_viewed", level, "已查看事件紀錄", "App 端事件記錄頁已開啟");
  };

  const vibration: Vibration = useMemo(() => {
    if (!online) return "none";
    if (level === "critical") return "continuous";
    if (level === "restricted") return "strong";
    if (level === "caution") return "repeated";
    if (level === "awareness" || level === "retreat") return "soft";
    return "none";
  }, [level, online]);
  const audioAlert = online && (level === "restricted" || level === "critical");
  const tone = META[level].color;
  const latestAlert = events[0];
  const violationTrace = level === "restricted" || level === "critical";
  const compliance = tamper === "confirmed" ? "NON-COMPLIANT" : tamper === "suspected" ? "REVIEW" : "COMPLIANT";
  const caseStatus = level === "resolved" ? "RESOLVED" : level === "normal" ? "MONITORING" : "ACTIVE";
  const relayNodes: Array<{ name: string; icon: IconName; status: RelayStatus }> = [
    { name: "Protected App", icon: "shield", status: notificationCount > 0 ? "acknowledged" : "sent" },
    { name: "Wearable", icon: "watch", status: online ? "acknowledged" : "pending" },
    { name: "Authorized Console", icon: "console", status: "logged" },
    { name: "Safety Contact", icon: "bell", status: level === "critical" || events.some(event => event.type === "help_requested") ? "sent" : "pending" },
    { name: "Management Escalation", icon: "lock", status: tamper === "confirmed" || level === "critical" ? "escalated" : tamper === "suspected" || !online ? "pending" : "logged" },
    { name: "Evidence Logged", icon: "note", status: events.some(event => event.type === "evidence_saved") ? "logged" : "pending" }
  ];

  return (
    <main className="simulator" style={{ "--tone": tone } as CSSProperties}>
      <div className="ambient a1" /><div className="ambient a2" />
      <header className="topbar">
        <div className="brand"><div className="brand-glyph"><Icon name="shield" size={22} /></div><div><h1>BoundaryFlow</h1><p>CROSS-DEVICE SYSTEM SIMULATOR</p></div></div>
        <div className="system-live"><span /><div><small>SYSTEM STATUS</small><strong>{online ? "ALL SYSTEMS ONLINE" : "DEVICE LINK DEGRADED"}</strong></div></div>
        <div className="header-meta"><span>CASE</span><b>BF-2026-0720-01</b><i /><span>LOCAL</span><b>{headerTime}</b></div>
      </header>

      <section className="control-deck">
        <div className="control-group playback-group">
          <div className="group-label"><span>01</span><div><small>SCENARIO PLAYBACK</small><b>接近、事件與撤退</b></div></div>
          <div className="playback-actions"><button className={`control primary ${playing ? "active" : ""}`} onClick={toggleDemo}><Icon name={playing ? "pause" : "play"} />{playing ? "暫停" : demoStarted && demoElapsed < 72 ? "繼續" : "Auto Demo"}<em>{demoStarted ? `${demoElapsed}s` : "72s"}</em></button><button className="control reset-control" onClick={reset}><Icon name="reset" />重置</button></div>
        </div>
        <div className="control-group distance-group">
          <div className="distance-heading"><div><small>02 · DISTANCE SIMULATION</small><strong>{distance}<em>m</em></strong></div><Pill level={level} /></div>
          <div className="distance-control"><input aria-label="目標距離" type="range" min="20" max="700" value={distance} onChange={event => applyDistance(Number(event.target.value))} /><div className="range-labels"><span>CRITICAL 20m</span><span>OUTER 700m</span></div></div>
        </div>
        <div className="control-group incident-group">
          <div className="group-label compact"><span>03</span><div><small>INCIDENT CONTROLS</small><b>診斷操作</b></div></div>
          <div className="incident-controls"><button className={!online ? "active" : ""} onClick={setOffline}>Trigger Offline</button><button onClick={restoreOnline}>Restore Online</button><button className={tamper === "suspected" ? "active" : ""} onClick={() => setTamperState("suspected")}>Tamper Suspected</button><button className={tamper === "confirmed" ? "active danger-control" : ""} onClick={() => setTamperState("confirmed")}>Tamper Confirmed</button><button onClick={resolveIncident}>Resolve Incident</button></div>
        </div>
      </section>

      <div className="sync-rail"><div><i /> APP</div><span /><div><i /> BOUNDARY ENGINE</div><span /><div className={!online ? "broken" : ""}><i /> WEARABLE</div><span /><div><i /> AUTHORIZED CONSOLE</div><b>{online ? "即時同步" : "同步中斷 · 正在升級"}</b></div>

      <section className="device-grid">
        <article className={`glass app-panel app-${level}`}>
          <PanelTitle icon="shield" eyebrow="PROTECTED PERSON" title="被保護者 App" status={<span className="live-dot">{online ? "SYSTEM ONLINE" : "LINK RECOVERY"}</span>} />
          <div className="phone-shell">
            <div className="phone-notch" />
            <div className="phone-top"><span>PROTECTION ACTIVE</span><b>BoundaryFlow</b><span className={online ? "online-text" : "danger"}>{online ? "● ONLINE" : "● DEGRADED"}</span></div>
            <div className="app-hero">
              <div className="app-status-row"><Pill level={level} pulse={level === "critical"} /></div>
              <div className="shield-orb"><Icon name={level === "normal" || level === "resolved" ? "shield" : "bell"} size={32} /></div>
              <h3>{!online ? "系統正在處理裝置中斷" : META[level].message}</h3>
              <p>CURRENT DISTANCE <strong>{distance} m</strong></p>
            </div>
            <div className="app-message"><Icon name="route" /><div><span>SAFETY GUIDANCE</span><b>{!online ? "Device telemetry is interrupted. Safety relay remains active." : META[level].guidance}</b></div></div>
            <div className="app-actions">
              <button onClick={() => appAction("silent")}><Icon name="bell" />Silent Notify</button>
              <button className="sos" onClick={() => appAction("help")}><Icon name="shield" />One-Tap Help</button>
              <button onClick={() => appAction("note")}><Icon name="note" />Add Event Note</button>
              <button onClick={() => appAction("log")}><Icon name="console" />View Event Log</button>
            </div>
            <div className={`action-feedback ${actionFeedback ? "show" : ""}`}><i /><span>{actionFeedback || "Action synchronized"}</span></div>
            <div className="phone-nav"><button className="active"><Icon name="shield" /><span>Protection</span></button><button><Icon name="note" /><span>Events</span></button><button><Icon name="console" /><span>Settings</span></button></div>
          </div>
        </article>

        <article className="glass field-panel">
          <PanelTitle icon="shield" eyebrow="LIVE CORE SIMULATION" title="動態邊界場" status={<Pill level={level} pulse={level === "critical"} />} />
          <BoundaryField distance={distance} level={level} online={online} violationTrace={violationTrace} />
        </article>

        <article className={`glass wearable-panel ${!online ? "offline" : ""} vibration-${vibration} tamper-${tamper}`}>
          <PanelTitle icon="watch" eyebrow="RESTRICTED DEVICE" title="受限制穿戴裝置" status={<span className={`connection ${online ? "on" : "off"}`}>{online ? "ONLINE" : "OFFLINE"}</span>} />
          <div className="wearable-stage"><div className="wearable-ripple" /><div className="device-product"><div className="strap top" /><div className="watch-body"><div className="watch-light" /><div className="watch-face"><Icon name={tamper === "normal" ? "shield" : "lock"} size={38} /><span>{online ? META[level].label : "OFFLINE"}</span></div></div><div className="strap bottom" /></div></div>
          <div className="wearable-primary"><div><span>CONNECTION</span><strong className={online ? "ok" : "danger"}>{online ? "ONLINE" : "OFFLINE"}</strong></div><div><span>WARNING</span><strong style={{ color: tone }}>{META[level].en}</strong></div><div><span>VIBRATION</span><strong>{vibration.toUpperCase()}</strong></div><div><span>TAMPER</span><strong className={tamper !== "normal" ? "danger" : ""}>{tamper.toUpperCase()}</strong></div></div>
          <div className="device-facts secondary">
            <div><span>DEVICE ID</span><b>WB-7A8C</b></div><div><span>PAIRED</span><b>YES</b></div><div><span>BATTERY</span><b>78%</b></div>
            <div><span>COMPLIANCE</span><b className={tamper !== "normal" ? "warning-text" : "ok"}>{compliance}</b></div><div><span>AUDIO</span><b className={audioAlert ? "danger" : ""}>{audioAlert ? "ON" : "OFF"}</b></div>
            <div><span>INDICATOR</span><b><i className="status-light" style={{ background: online ? tone : "#68717a", boxShadow: `0 0 10px ${online ? tone : "transparent"}` }} />{online ? META[level].en : "OFF"}</b></div><div className="wide"><span>LAST SYNC</span><b>{lastSync}</b></div>
          </div>
          <div className="audio-row"><div><Icon name="bell" /><span>Demo sound</span></div><button aria-label="切換示範音效" className={!soundMuted ? "on" : ""} onClick={() => setSoundMuted(muted => !muted)}><i />{soundMuted ? "MUTED" : "VISUAL ON"}</button></div>
        </article>
      </section>

      <section className="glass console-panel">
        <PanelTitle icon="console" eyebrow="AUTHORIZED CONSOLE" title="授權管理主控台" status={<div className="console-tabs"><button className="active">即時事件</button><button>證據紀錄</button><button>裝置</button></div>} />
        <div className="console-grid">
          <div className="case-card flow-stage" data-step="01 · CASE STATE">
            <div className="case-head"><div><span>CASE SUMMARY</span><h3>BF-2026-0720-01</h3></div><Pill level={level} /></div>
            <div className="metrics expanded"><div><span>CURRENT DISTANCE</span><strong>{distance}<small> m</small></strong></div><div><span>CURRENT LEVEL</span><strong style={{ color: tone }}>{META[level].en}</strong></div><div><span>WEARABLE</span><strong className={online ? "ok" : "danger"}>{online ? "ONLINE" : "OFFLINE"}</strong></div><div><span>EVENTS</span><strong>{events.length}</strong></div><div><span>NOTIFICATIONS</span><strong>{notificationCount}</strong></div><div><span>CASE STATUS</span><strong>{caseStatus}</strong></div></div>
            <div className="route-map"><div className="map-grid" /><svg viewBox="0 0 500 120" preserveAspectRatio="none"><path d="M10 95 C90 95 70 60 145 68 S230 20 290 42 S360 92 410 52 S455 35 490 18" fill="none" stroke="var(--tone)" strokeWidth="3"/><circle cx="490" cy="18" r="6" fill="var(--tone)" /></svg><span>RELATIVE TRACE · NO PRECISE LOCATION</span></div>
          </div>
          <div className="timeline flow-stage" data-step="02 · EVENT TRACE"><div className="subhead"><div><span>EVENT TIMELINE</span><h3>跨裝置事件時間軸</h3></div><b>{events.length} EVENTS</b></div><div className="event-list">{events.slice(0, 7).map((event, index) => <div className={`event ${index === 0 ? "active-event" : ""} event-${event.level}`} key={event.id} style={{ "--event": META[event.level].color } as CSSProperties}><time>{event.time}</time><i>{index === 0 && <span />}</i><div className="event-copy"><strong><Icon name={EVENT_ICON[event.type]} size={12} />{event.title}</strong><p>{event.detail}</p><small>{event.type}</small></div></div>)}</div></div>
          <div className="notifications flow-stage" data-step="03 · RELAY → EVIDENCE"><div className="subhead"><div><span>NOTIFICATION RELAY</span><h3>通知與稽核</h3></div><Icon name="bell" /></div><div className="notice featured"><i /><div><span>LATEST SYSTEM REPORT</span><strong>{latestAlert.title}</strong><p>{latestAlert.detail}</p></div><time>{latestAlert.time}</time></div><div className={`relay-list ${level === "critical" ? "relay-critical" : ""}`}>{relayNodes.map((node, index) => <div key={node.name} style={{ "--relay-index": index } as CSSProperties}><Icon name={node.icon} /><span>{node.name}</span><b className={`relay-${node.status}`}>{node.status.toUpperCase()}</b></div>)}</div><button className="export" onClick={() => pushEvent("evidence_saved", level, "事件證據已封存", "PDF / JSON 模擬匯出完成")}>儲存事件證據 <span>PDF / JSON</span></button></div>
        </div>
      </section>
      <footer><span>BOUNDARYFLOW v0.3 · VISUAL REFINEMENT</span><span><i /> LOCAL MOCK ENGINE · NO PRECISE LOCATION</span><span>讓邊界先響，保護從預警開始</span></footer>
    </main>
  );
}
