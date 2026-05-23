import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from '@react-three/fiber';
import { getSession } from "../auth";
import Scene3D from "../components/canvas/Scene3D";
import { TOOLS, TOOL_GROUPS, SNAP_MODES, LAYERS, exportToDXF, hitTest2D, calculateSnapPoint, applyOrthoConstraint } from "../utils/cadUtils";

// ─── Project Management ───────────────────────────────────────────────────────
const PROJECTS_KEY = "3dcad_projects";

function loadProject(userId, projectId) {
  try {
    const projects = JSON.parse(localStorage.getItem(`${PROJECTS_KEY}_${userId}`)) || [];
    return projects.find(p => p.id === projectId) || null;
  } catch { return null; }
}

function saveEntities(userId, projectId, data) {
  try {
    const key = `${PROJECTS_KEY}_${userId}`;
    const projects = JSON.parse(localStorage.getItem(key)) || [];
    localStorage.setItem(key, JSON.stringify(
      projects.map(p => p.id === projectId ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    ));
  } catch {}
}

// ─── Icon Component ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", fill = "none", strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ─── Main CAD Application ───────────────────────────────────────────────────────
export default function CADEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  
  // Project & Data
  const [project, setProject] = useState(null);
  const [viewport, setViewport] = useState("2d"); // "2d" or "3d"
  
  // 2D Canvas State
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  
  // Tool & Drawing State
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [worldCursor, setWorldCursor] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [tempPoint, setTempPoint] = useState(null);
  const [polyPoints, setPolyPoints] = useState([]);
  
  // Entities & Selection
  const [entities_2d, setEntities2D] = useState([]);
  const [entities_3d, setEntities3D] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId3D, setSelectedId3D] = useState(null);
  
  // UI State
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [orthoMode, setOrthoMode] = useState(false);
  const [dynamicInput, setDynamicInput] = useState(true);
  const [currentLayer, setCurrentLayer] = useState("0");
  const [layers, setLayers] = useState(LAYERS);
  const [lineColor, setLineColor] = useState("#00d4ff");
  const [lineWeight, setLineWeight] = useState(1.5);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [commandLog, setCommandLog] = useState(["AutoCAD 3D Professional — Ready"]);
  const [commandInput, setCommandInput] = useState("");
  const [showSnapPanel, setShowSnapPanel] = useState(false);
  const [activeSnaps, setActiveSnaps] = useState(["Endpoint", "Midpoint", "Center", "Intersection"]);
  const [showRibbon, setShowRibbon] = useState(true);
  const [activeRibbonTab, setActiveRibbonTab] = useState("Home");
  const [ucsIcon, setUcsIcon] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [transformMode, setTransformMode] = useState("translate");
  
  const idRef = useRef(1);
  const GRID_SIZE = 20;
  
  // ─── Initialization ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { navigate("/login", { replace: true }); return; }
    const p = loadProject(session.id, id);
    if (!p) { navigate("/projects", { replace: true }); return; }
    setProject(p);
    if (p.entities_2d) setEntities2D(p.entities_2d);
    if (p.entities_3d) setEntities3D(p.entities_3d);
  }, [id, session, navigate]);
  
  // ─── Canvas ResizeObserver ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    setCanvasSize({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    return () => ro.disconnect();
  }, []);
  
  // ─── Auto-save ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session && id) {
      saveEntities(session.id, id, { entities_2d, entities_3d });
    }
  }, [entities_2d, entities_3d, session, id]);
  
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const toWorld = useCallback((sx, sy) => ({
    x: (sx - pan.x) / zoom,
    y: (sy - pan.y) / zoom,
  }), [pan, zoom]);
  
  const toScreen = useCallback((wx, wy) => ({
    x: wx * zoom + pan.x,
    y: wy * zoom + pan.y,
  }), [pan, zoom]);
  
  const nextId = () => { idRef.current += 1; return idRef.current; };
  const log = (msg) => setCommandLog(prev => [...prev.slice(-49), msg]);
  
  const pushHistory = (ents) => {
    const h = history.slice(0, historyIdx + 1);
    h.push(ents);
    setHistory(h);
    setHistoryIdx(h.length - 1);
  };
  
  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(h => h - 1);
      setEntities2D(history[historyIdx - 1]);
      log("UNDO");
    }
  };
  
  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(h => h + 1);
      setEntities2D(history[historyIdx + 1]);
      log("REDO");
    }
  };
  
  // ─── 2D Canvas Rendering ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewport !== "2d") return;
    
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1f2e");
    bg.addColorStop(1, "#111520");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    
    // Grid
    if (gridEnabled) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 0.5;
      const gs = GRID_SIZE * zoom;
      const ox = ((pan.x % gs) + gs) % gs;
      const oy = ((pan.y % gs) + gs) % gs;
      for (let x = ox; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }
    
    // Origin crosshair
    const o = toScreen(0, 0);
    ctx.save();
    ctx.strokeStyle = "rgba(0,212,255,0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(o.x - 30, o.y); ctx.lineTo(o.x + 30, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x, o.y - 30); ctx.lineTo(o.x, o.y + 30); ctx.stroke();
    ctx.restore();
    
    // Draw entities
    const drawEntity = (ent, selected) => {
      const layer = layers.find(l => l.name === ent.layer) || layers[0];
      if (!layer.visible) return;
      
      ctx.save();
      ctx.strokeStyle = selected ? "#ffcc00" : ent.color;
      ctx.lineWidth = selected ? (ent.lineWeight + 1) * zoom : ent.lineWeight * zoom;
      ctx.fillStyle = ent.fill || "transparent";
      
      if (ent.type === "line") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (selected) {
          [a, b].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = "#ffcc00"; ctx.fill(); });
        }
      } else if (ent.type === "rectangle") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      } else if (ent.type === "circle") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, 0, Math.PI * 2); ctx.stroke();
      } else if (ent.type === "text") {
        const s = toScreen(ent.x, ent.y);
        ctx.font = `${Math.max(10, ent.size * zoom)}px 'Courier New', monospace`;
        ctx.fillStyle = ent.color;
        ctx.fillText(ent.text, s.x, s.y);
      }
      
      ctx.restore();
    };
    
    entities_2d.forEach(e => drawEntity(e, selectedIds.includes(e.id)));
    
    // Preview while drawing
    if (drawing && startPoint && tempPoint) {
      const a = toScreen(startPoint.x, startPoint.y);
      const b = toScreen(tempPoint.x, tempPoint.y);
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWeight;
      ctx.setLineDash([6, 4]);
      
      if (activeTool === "line") {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (activeTool === "rectangle") {
        ctx.beginPath(); ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      } else if (activeTool === "circle") {
        const r = Math.hypot(tempPoint.x - startPoint.x, tempPoint.y - startPoint.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, r * zoom, 0, Math.PI * 2); ctx.stroke();
      }
      
      if (dynamicInput) {
        const dx = Math.abs(tempPoint.x - startPoint.x).toFixed(1);
        const dy = Math.abs(tempPoint.y - startPoint.y).toFixed(1);
        const dist = Math.hypot(tempPoint.x - startPoint.x, tempPoint.y - startPoint.y).toFixed(1);
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(b.x + 12, b.y - 36, 130, 46);
        ctx.fillStyle = "#00d4ff";
        ctx.font = "11px 'Courier New'";
        ctx.fillText(`dx: ${dx}  dy: ${dy}`, b.x + 18, b.y - 20);
        ctx.fillText(`dist: ${dist}`, b.x + 18, b.y - 6);
      }
      
      ctx.setLineDash([]);
      ctx.restore();
    }
    
    // Crosshair cursor
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cursor.x, 0); ctx.lineTo(cursor.x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cursor.y); ctx.lineTo(W, cursor.y); ctx.stroke();
    ctx.restore();
    
    // UCS icon
    if (ucsIcon) {
      const ux = 50, uy = H - 50;
      ctx.save();
      ctx.font = "bold 11px 'Courier New'";
      ctx.lineWidth = 2;
      [["X", "#ff4444", 1, 0], ["Y", "#44ff88", 0, -1]].forEach(([lbl, col, dx, dy]) => {
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + dx * 30, uy + dy * 30); ctx.stroke();
        ctx.fillText(lbl, ux + dx * 35 - 4, uy + dy * 35 + 4);
      });
      ctx.restore();
    }
  }, [entities_2d, pan, zoom, cursor, tempPoint, drawing, startPoint, activeTool, gridEnabled, snapEnabled, selectedIds, lineColor, lineWeight, layers, ucsIcon, dynamicInput, toScreen, canvasSize, viewport]);
  
  // ─── Mouse Events (2D) ────────────────────────────────────────────────────────
  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    setCursor({ x: sx, y: sy });
    let wp = toWorld(sx, sy);
    if (snapEnabled) wp = calculateSnapPoint(wp, GRID_SIZE, true);
    if (startPoint) wp = applyOrthoConstraint(startPoint, wp, orthoMode);
    setWorldCursor(wp);
    setTempPoint(wp);
    
    if (isDragging && dragStart) {
      setPan({ x: pan.x + sx - dragStart.x, y: pan.y + sy - dragStart.y });
      setDragStart({ x: sx, y: sy });
    }
  };
  
  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && activeTool === "pan")) {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }
    if (e.button !== 0) return;
    
    let wp = toWorld(e.clientX - canvasRef.current.getBoundingClientRect().left, e.clientY - canvasRef.current.getBoundingClientRect().top);
    if (snapEnabled) wp = calculateSnapPoint(wp, GRID_SIZE, true);
    if (startPoint) wp = applyOrthoConstraint(startPoint, wp, orthoMode);
    
    if (activeTool === "select") {
      const hit = [...entities_2d].reverse().find(ent => hitTest2D(ent, wp, 5 / zoom));
      setSelectedIds(hit ? [hit.id] : []);
      return;
    }
    
    if (!drawing) {
      setDrawing(true);
      setStartPoint(wp);
      log(`First point: (${wp.x.toFixed(1)}, ${wp.y.toFixed(1)})`);
    } else {
      finishEntity(wp);
    }
  };
  
  const handleMouseUp = () => {
    if (activeTool === "pan") setIsDragging(false);
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom(z => {
      const nz = Math.min(20, Math.max(0.05, z * factor));
      setPan(p => ({ x: mx - (mx - p.x) * (nz / z), y: my - (my - p.y) * (nz / z) }));
      return nz;
    });
  };
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    resetDraw();
  };
  
  const finishEntity = (endPt) => {
    if (!startPoint) return;
    let ent = null;
    const eid = nextId();
    const base = { id: eid, color: lineColor, lineWeight, layer: currentLayer };
    
    if (activeTool === "line") {
      ent = { ...base, type: "line", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
    } else if (activeTool === "rectangle") {
      ent = { ...base, type: "rectangle", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
    } else if (activeTool === "circle") {
      const r = Math.hypot(endPt.x - startPoint.x, endPt.y - startPoint.y);
      ent = { ...base, type: "circle", cx: startPoint.x, cy: startPoint.y, r };
    }
    
    if (ent) {
      const ne = [...entities_2d, ent];
      setEntities2D(ne);
      pushHistory(ne);
    }
    resetDraw();
  };
  
  const resetDraw = () => { setDrawing(false); setStartPoint(null); setTempPoint(null); setPolyPoints([]); };
  
  // ─── Keyboard Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Escape") { resetDraw(); setSelectedIds([]); }
      if (e.key === "Delete") {
        if (selectedIds.length) {
          const ne = entities_2d.filter(en => !selectedIds.includes(en.id));
          setEntities2D(ne);
          pushHistory(ne);
          setSelectedIds([]);
        }
      }
      if (e.key === "F8") { e.preventDefault(); setOrthoMode(o => !o); }
      if (e.key === "F9") { e.preventDefault(); setSnapEnabled(s => !s); }
      if (e.key === "F7") { e.preventDefault(); setGridEnabled(g => !g); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, entities_2d, historyIdx]);
  
  // ─── Command Input ───────────────────────────────────────────────────────────
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = commandInput.trim().toLowerCase();
    setCommandInput("");
    log(`> ${cmd}`);
    
    const commands = {
      "line": () => setActiveTool("line"),
      "circle": () => setActiveTool("circle"),
      "rect": () => setActiveTool("rectangle"),
      "save": () => { saveEntities(session.id, id, { entities_2d, entities_3d }); log("Saved"); },
      "export": () => { const dxf = exportToDXF(entities_2d); const blob = new Blob([dxf]); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${project?.name || "drawing"}.dxf`; a.click(); log("Exported to DXF"); },
      "undo": () => undo(),
      "redo": () => redo(),
    };
    
    if (commands[cmd]) commands[cmd]();
    else log(`Unknown: ${cmd}`);
  };
  
  // ─── UI Styles ────────────────────────────────────────────────────────────────
  const S = {
    app: { display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#0d1117", color: "#c9d1d9", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" },
    menuBar: { display: "flex", alignItems: "center", background: "#1a2035", borderBottom: "1px solid #2a3248", height: 28, paddingLeft: 8, gap: 2, fontSize: 12, flexShrink: 0 },
    ribbon: { display: "flex", flexDirection: "column", background: "#1c2540", borderBottom: "1px solid #1e2d4a", flexShrink: 0 },
    ribbonTabs: { display: "flex", borderBottom: "1px solid #1e2d4a", paddingLeft: 4 },
    ribbonTab: (active) => ({ padding: "5px 16px", cursor: "pointer", fontSize: 11.5, fontWeight: active ? 600 : 400, color: active ? "#4fc3f7" : "#7a8ba0", borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent" }),
    workspace: { display: "flex", flex: 1, overflow: "hidden" },
    viewport: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    canvas: { flex: 1, display: "block" },
    rightPanel: { width: 220, background: "#111827", borderLeft: "1px solid #1e2d4a", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
    cmdBar: { background: "#0d1117", borderTop: "1px solid #1e2d4a", padding: "4px 8px", display: "flex", gap: 8, flexShrink: 0 },
    cmdInput: { background: "#1a2035", border: "1px solid #2a3248", borderRadius: 3, color: "#e2e8f0", fontSize: 12, padding: "3px 8px", flex: 1, outline: "none" },
    statusBar: { display: "flex", alignItems: "center", background: "#0a0f1a", borderTop: "1px solid #1e2d4a", height: 24, paddingLeft: 8, gap: 16, fontSize: 11, color: "#5a6a7a", flexShrink: 0 },
  };
  
  // ─── Viewport Tabs ───────────────────────────────────────────────────────────
  const viewportTabs = [
    { id: "2d", label: "2D Drawing" },
    { id: "3d", label: "3D View" },
  ];
  
  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Menu Bar */}
      <div style={S.menuBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="#4fc3f7" strokeWidth="1.5" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>3DCAD</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/projects")} style={{ background: "#1a2545", border: "1px solid #2a3248", color: "#4fc3f7", borderRadius: 3, fontSize: 11, padding: "2px 10px", cursor: "pointer" }}>← Projects</button>
      </div>
      
      {/* Viewport Tabs */}
      <div style={{ display: "flex", background: "#1a2035", borderBottom: "1px solid #2a3248", height: 28, paddingLeft: 8, gap: 2 }}>
        {viewportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewport(tab.id)}
            style={{
              background: viewport === tab.id ? "#2a3248" : "transparent",
              border: "none",
              color: viewport === tab.id ? "#4fc3f7" : "#7a8ba0",
              fontSize: 11,
              padding: "4px 12px",
              cursor: "pointer",
              borderBottom: viewport === tab.id ? "2px solid #4fc3f7" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={{ background: "transparent", border: "none", color: "#7a8ba0", cursor: "pointer", padding: 4 }}>↩</button>
        <button onClick={redo} style={{ background: "transparent", border: "none", color: "#7a8ba0", cursor: "pointer", padding: 4 }}>↪</button>
      </div>
      
      {/* Ribbon */}
      {showRibbon && viewport === "2d" && (
        <div style={S.ribbon}>
          <div style={S.ribbonTabs}>
            {["Home", "View", "Annotate"].map(tab => (
              <div key={tab} style={S.ribbonTab(activeRibbonTab === tab)} onClick={() => setActiveRibbonTab(tab)}>{tab}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 4, paddingRight: 8 }}>
              <button onClick={() => setSnapEnabled(s => !s)} style={{ background: snapEnabled ? "#1a2545" : "transparent", border: snapEnabled ? "1px solid #4fc3f7" : "1px solid #2a3248", color: snapEnabled ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>SNAP</button>
              <button onClick={() => setGridEnabled(g => !g)} style={{ background: gridEnabled ? "#1a2545" : "transparent", border: gridEnabled ? "1px solid #4fc3f7" : "1px solid #2a3248", color: gridEnabled ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>GRID</button>
              <button onClick={() => setOrthoMode(o => !o)} style={{ background: orthoMode ? "#1a2545" : "transparent", border: orthoMode ? "1px solid #4fc3f7" : "1px solid #2a3248", color: orthoMode ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>ORTHO</button>
            </div>
          </div>
          
          <div style={{ display: "flex", padding: "4px 8px", gap: 4, overflowX: "auto" }}>
            {[
              { label: "Select", tools: ["select"] },
              { label: "Draw", tools: ["line", "rectangle", "circle"] },
              { label: "Modify", tools: ["move", "copy", "rotate"] },
            ].map(grp => (
              <div key={grp.label} style={{ display: "flex", gap: 2 }}>
                {grp.tools.map(tid => {
                  const tool = TOOLS.find(t => t.id === tid);
                  return (
                    <button
                      key={tid}
                      onClick={() => setActiveTool(tid)}
                      title={tool?.label}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        background: activeTool === tid ? "#1a2545" : "transparent",
                        border: activeTool === tid ? "1px solid #4fc3f7" : "1px solid #2a3248",
                        borderRadius: 4,
                        cursor: "pointer",
                        color: activeTool === tid ? "#4fc3f7" : "#8090aa",
                        gap: 2,
                      }}
                    >
                      <Icon d={tool?.icon} size={14} color={activeTool === tid ? "#4fc3f7" : "#8090aa"} />
                      <span style={{ fontSize: 7 }}>{tid}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Workspace */}
      <div style={S.workspace}>
        <div style={S.viewport}>
          {viewport === "2d" && (
            <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{ width: "100%", height: "100%", display: "block", cursor: activeTool === "pan" && isDragging ? "grabbing" : "crosshair" }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}
          
          {viewport === "3d" && (
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }} style={{ background: "#060b16" }} onClick={e => { if (e.target === e.currentTarget) setSelectedId3D(null); }}>
              <Suspense fallback={null}>
                <Scene3D 
                  objects={entities_3d} 
                  selectedId={selectedId3D} 
                  onSelect={setSelectedId3D}
                  transformMode={transformMode}
                  readOnly={false}
                />
              </Suspense>
            </Canvas>
          )}
        </div>
        
        {/* Right Panel */}
        <div style={S.rightPanel}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#4fc3f7", background: "#0d1421", borderBottom: "1px solid #1e2d4a" }}>Properties</div>
          <div style={{ padding: 12, fontSize: 11, color: "#5a6a7a", overflow: "auto", flex: 1 }}>
            {viewport === "2d" ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Line Color</div>
                  <input type="color" value={lineColor} onChange={e => setLineColor(e.target.value)} style={{ width: "100%", height: 24, border: "1px solid #2a3248", borderRadius: 3, cursor: "pointer" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Line Weight</div>
                  <input type="range" min={0.5} max={6} step={0.5} value={lineWeight} onChange={e => setLineWeight(+e.target.value)} style={{ width: "100%" }} />
                  <div style={{ fontSize: 9, color: "#8090aa" }}>{lineWeight}px</div>
                </div>
                <div>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Layer</div>
                  <select value={currentLayer} onChange={e => setCurrentLayer(e.target.value)} style={{ width: "100%", background: "#1a2035", color: "#a0aec0", border: "1px solid #2a3248", borderRadius: 3, padding: "3px 4px", fontSize: 10 }}>
                    {layers.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e2d4a", fontSize: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Objects:</span>
                    <span style={{ color: "#4fc3f7" }}>{entities_2d.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Selected:</span>
                    <span style={{ color: "#4fc3f7" }}>{selectedIds.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Zoom:</span>
                    <span style={{ color: "#4fc3f7" }}>{(zoom * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Transform Mode</div>
                  <select value={transformMode} onChange={e => setTransformMode(e.target.value)} style={{ width: "100%", background: "#1a2035", color: "#a0aec0", border: "1px solid #2a3248", borderRadius: 3, padding: "3px 4px", fontSize: 10 }}>
                    <option value="translate">Translate</option>
                    <option value="rotate">Rotate</option>
                    <option value="scale">Scale</option>
                  </select>
                </div>
                <div>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>3D Objects</div>
                  <div style={{ fontSize: 9 }}>{entities_3d.length} objects</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Command Bar */}
      <div style={S.cmdBar}>
        <span style={{ fontSize: 11, color: "#3a4a5a" }}>Command:</span>
        <input
          style={S.cmdInput}
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command... (line, circle, rect, save, export, undo, redo)"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      
      {/* Status Bar */}
      <div style={S.statusBar}>
        <span style={{ color: "#4fc3f7", fontFamily: "'Courier New', monospace", fontSize: 10 }}>
          {viewport === "2d" ? `X: ${worldCursor.x.toFixed(2)}  Y: ${worldCursor.y.toFixed(2)}` : "3D View"}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#3a4a5a" }}>Tool: <span style={{ color: "#4fc3f7" }}>{activeTool.toUpperCase()}</span></span>
        <span style={{ color: "#3a4a5a" }}>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
