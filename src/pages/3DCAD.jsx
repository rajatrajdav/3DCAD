// Backward compatibility wrapper - all functionality moved to CADEditor
export { default } from './CADEditor';
// Backward compatibility wrapper - all functionality moved to CADEditor
export { default } from './CADEditor';

const PROJECTS_KEY = "3dcad_projects";
function loadProject(userId, projectId) {
  try {
    const projects = JSON.parse(localStorage.getItem(`${PROJECTS_KEY}_${userId}`)) || [];
    return projects.find(p => p.id === projectId) || null;
  } catch { return null; }
}
function saveEntities(userId, projectId, entities) {
  try {
    const key = `${PROJECTS_KEY}_${userId}`;
    const projects = JSON.parse(localStorage.getItem(key)) || [];
    localStorage.setItem(key, JSON.stringify(
      projects.map(p => p.id === projectId ? { ...p, entities, updatedAt: new Date().toISOString() } : p)
    ));
  } catch {}
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", fill = "none", strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  { id: "select",    label: "Select",       icon: "M5 3l14 9-7 2-3 7z", group: "select" },
  { id: "line",      label: "Line",         icon: "M5 19L19 5", group: "draw" },
  { id: "polyline",  label: "Polyline",     icon: "M4 20 L8 8 L14 14 L20 4", group: "draw" },
  { id: "rectangle", label: "Rectangle",    icon: "M3 5h18v14H3z", group: "draw" },
  { id: "circle",    label: "Circle",       icon: "M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0", group: "draw" },
  { id: "arc",       label: "Arc",          icon: "M5 19 A 10 10 0 0 1 19 5", group: "draw" },
  { id: "ellipse",   label: "Ellipse",      icon: "M12 12m-9 0a9 5 0 1 0 18 0a9 5 0 1 0-18 0", group: "draw" },
  { id: "spline",    label: "Spline",       icon: "M3 17 C 6 3, 10 21, 14 10, 18 3", group: "draw" },
  { id: "hatch",     label: "Hatch",        icon: "M4 4l16 16M4 8l12 12M4 12l8 8M8 4l12 12", group: "draw" },
  { id: "text",      label: "Text",         icon: "M4 7V4h16v3M9 20h6M12 4v16", group: "annotate" },
  { id: "dimension", label: "Dimension",    icon: "M3 12h18M3 8v8M21 8v8", group: "annotate" },
  { id: "leader",    label: "Leader",       icon: "M3 3l6 6m0 0l9 3-6-9", group: "annotate" },
  { id: "move",      label: "Move",         icon: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 2v20M2 12h20", group: "modify" },
  { id: "copy",      label: "Copy",         icon: "M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2M8 4h8a2 2 0 0 1 2 2v8M8 4v8h8V4", group: "modify" },
  { id: "rotate",    label: "Rotate",       icon: "M21.5 2v6h-6M2.5 12a10 10 0 1 0 1.4-5", group: "modify" },
  { id: "mirror",    label: "Mirror",       icon: "M12 3v18M5 7l-3 5 3 5M19 7l3 5-3 5", group: "modify" },
  { id: "scale",     label: "Scale",        icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7", group: "modify" },
  { id: "trim",      label: "Trim",         icon: "M3 12h6m6 0h6M8 5l8 14", group: "modify" },
  { id: "extend",    label: "Extend",       icon: "M3 12h18M15 5l4 7-4 7", group: "modify" },
  { id: "fillet",    label: "Fillet",       icon: "M4 20 L4 8 A 6 6 0 0 1 10 2 L20 2", group: "modify" },
  { id: "chamfer",   label: "Chamfer",      icon: "M4 20 L4 8 L10 2 L20 2", group: "modify" },
  { id: "extrude",   label: "Extrude",      icon: "M4 16l8 4 8-4V8l-8-4-8 4zM4 8l8 4 8-4M12 12v8", group: "3d" },
  { id: "revolve",   label: "Revolve",      icon: "M12 3a9 9 0 1 1-9 9M12 3v9l6 3", group: "3d" },
  { id: "sweep",     label: "Sweep",        icon: "M3 12 C 6 6, 18 6, 21 12 C 18 18, 6 18, 3 12", group: "3d" },
  { id: "loft",      label: "Loft",         icon: "M5 18h14M8 6h8L20 18H4z", group: "3d" },
  { id: "measure",   label: "Measure",      icon: "M2 12h20M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8", group: "measure" },
  { id: "zoom",      label: "Zoom",         icon: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM10 7v3M7 10h3", group: "view" },
  { id: "pan",       label: "Pan",          icon: "M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M12 5l3-3 3 3M12 19l-3 3-3-3M12 2v20", group: "view" },
  { id: "orbit",     label: "Orbit 3D",     icon: "M12 2a10 10 0 1 0 10 10M17 12a5 5 0 1 1-5-5", group: "view" },
];

const TOOL_GROUPS = {
  select: { label: "Select", color: "#4fc3f7" },
  draw:   { label: "Draw",   color: "#81c784" },
  annotate:{ label: "Annotate", color: "#ffb74d" },
  modify: { label: "Modify", color: "#f48fb1" },
  "3d":   { label: "3D",     color: "#ce93d8" },
  measure:{ label: "Measure",color: "#80cbc4" },
  view:   { label: "View",   color: "#90a4ae" },
};

const SNAP_MODES = ["Endpoint", "Midpoint", "Center", "Node", "Quadrant", "Intersection", "Insertion", "Perpendicular", "Tangent", "Nearest"];

const LAYERS = [
  { id: 1, name: "0",           color: "#ffffff", visible: true, locked: false, lineType: "Continuous", lineWeight: "Default" },
  { id: 2, name: "Walls",       color: "#ff4444", visible: true, locked: false, lineType: "Continuous", lineWeight: "0.35mm" },
  { id: 3, name: "Dimensions",  color: "#4488ff", visible: true, locked: false, lineType: "Continuous", lineWeight: "0.18mm" },
  { id: 4, name: "Hidden",      color: "#ffaa00", visible: true, locked: false, lineType: "HIDDEN",     lineWeight: "0.18mm" },
  { id: 5, name: "Center",      color: "#ff44ff", visible: true, locked: false, lineType: "CENTER",     lineWeight: "0.18mm" },
  { id: 6, name: "Construction",color: "#44aaaa", visible: true, locked: false, lineType: "Phantom",    lineWeight: "0.09mm" },
];

// ─── Main CAD App ─────────────────────────────────────────────────────────────
export default function CAD() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [project, setProject] = useState(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [activeTool, setActiveTool] = useState("select");
  const [activeGroup, setActiveGroup] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [worldCursor, setWorldCursor] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [orthoMode, setOrthoMode] = useState(false);
  const [polarMode, setPolarMode] = useState(false);
  const [currentLayer, setCurrentLayer] = useState("0");
  const [layers, setLayers] = useState(LAYERS);
  const [commandLog, setCommandLog] = useState(["AutoCAD 3D Professional — Ready", "Type a command or select a tool"]);
  const [commandInput, setCommandInput] = useState("");
  const [showLayers, setShowLayers] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [viewMode, setViewMode] = useState("2D Top");
  const [lineColor, setLineColor] = useState("#00d4ff");
  const [lineWeight, setLineWeight] = useState(1.5);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [activeSnaps, setActiveSnaps] = useState(["Endpoint","Midpoint","Center","Intersection"]);
  const [tempPoint, setTempPoint] = useState(null);
  const [polyPoints, setPolyPoints] = useState([]);
  const [showSnapPanel, setShowSnapPanel] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [showRibbon, setShowRibbon] = useState(true);
  const [activeRibbonTab, setActiveRibbonTab] = useState("Home");
  const [ucsIcon, setUcsIcon] = useState(true);
  const [dynamicInput, setDynamicInput] = useState(true);
  const [lineTypeScale, setLineTypeScale] = useState(1);
  const [showCoordDialog, setShowCoordDialog] = useState(false);
  const [coordInput, setCoordInput] = useState("");
  const [idCounter, setIdCounter] = useState(1);
  const idRef = useRef(1);
  const GRID_SIZE = 20;

  // ── Load project & restore entities ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { navigate("/login", { replace: true }); return; }
    const p = loadProject(session.id, id);
    if (!p) { navigate("/projects", { replace: true }); return; }
    setProject(p);
    if (p.entities && p.entities.length) {
      setEntities(p.entities);
      setHistory([p.entities]);
      setHistoryIdx(0);
    }
  }, [id]);

  // ── ResizeObserver: keep canvas filling its container ─────────────────────────────────────────────────────────────
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
    // Set initial size
    setCanvasSize({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    return () => ro.disconnect();
  }, []);

  // ── Auto-save entities to localStorage ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session && id) saveEntities(session.id, id, entities);
  }, [entities]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toWorld = useCallback((sx, sy) => ({
    x: (sx - pan.x) / zoom,
    y: (sy - pan.y) / zoom,
  }), [pan, zoom]);

  const toScreen = useCallback((wx, wy) => ({
    x: wx * zoom + pan.x,
    y: wy * zoom + pan.y,
  }), [pan, zoom]);

  const snapToGrid = (pt) => ({
    x: Math.round(pt.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(pt.y / GRID_SIZE) * GRID_SIZE,
  });

  const applyOrtho = (from, to) => {
    if (!orthoMode) return to;
    const dx = to.x - from.x, dy = to.y - from.y;
    return Math.abs(dx) >= Math.abs(dy)
      ? { x: to.x, y: from.y }
      : { x: from.x, y: to.y };
  };

  const nextId = () => { idRef.current += 1; return idRef.current; };

  const log = (msg) => setCommandLog(prev => [...prev.slice(-49), msg]);

  const pushHistory = (newEnts) => {
    const h = history.slice(0, historyIdx + 1);
    h.push(newEnts);
    setHistory(h);
    setHistoryIdx(h.length - 1);
  };

  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(h => h - 1);
      setEntities(history[historyIdx - 1]);
      log("UNDO");
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(h => h + 1);
      setEntities(history[historyIdx + 1]);
      log("REDO");
    }
  };

  // ── Canvas drawing ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
      // Major grid
      const mgs = gs * 5;
      const mox = ((pan.x % mgs) + mgs) % mgs;
      const moy = ((pan.y % mgs) + mgs) % mgs;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.8;
      for (let x = mox; x < W; x += mgs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = moy; y < H; y += mgs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
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
    ctx.setLineDash([]);
    ctx.restore();

    // Entities
    const drawEntity = (ent, selected) => {
      const layer = layers.find(l => l.name === ent.layer) || layers[0];
      if (!layer.visible) return;
      ctx.save();
      ctx.strokeStyle = selected ? "#ffcc00" : ent.color;
      ctx.lineWidth = selected ? (ent.lineWeight + 1) * zoom : ent.lineWeight * zoom;
      ctx.fillStyle = ent.fill || "transparent";
      ctx.shadowColor = selected ? "#ffcc00" : ent.color;
      ctx.shadowBlur = selected ? 8 : 3;

      if (ent.type === "line") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (selected) {
          [a, b].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fillStyle="#ffcc00"; ctx.fill(); });
        }
      } else if (ent.type === "rectangle") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.strokeRect(Math.min(a.x,b.x), Math.min(a.y,b.y), Math.abs(b.x-a.x), Math.abs(b.y-a.y));
        if (selected) {
          [a,{x:b.x,y:a.y},b,{x:a.x,y:b.y}].forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle="#ffcc00"; ctx.fill(); });
        }
      } else if (ent.type === "circle") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, 0, Math.PI*2); ctx.stroke();
        if (selected) {
          ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI*2); ctx.fillStyle="#ffcc00"; ctx.fill();
        }
      } else if (ent.type === "arc") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, ent.startAngle, ent.endAngle); ctx.stroke();
      } else if (ent.type === "polyline") {
        if (!ent.points || ent.points.length < 2) { ctx.restore(); return; }
        ctx.beginPath();
        const p0 = toScreen(ent.points[0].x, ent.points[0].y);
        ctx.moveTo(p0.x, p0.y);
        ent.points.slice(1).forEach(p => { const s = toScreen(p.x,p.y); ctx.lineTo(s.x,s.y); });
        if (ent.closed) ctx.closePath();
        ctx.stroke();
        if (selected) ent.points.forEach(p => { const s=toScreen(p.x,p.y); ctx.beginPath(); ctx.arc(s.x,s.y,4,0,Math.PI*2); ctx.fillStyle="#ffcc00"; ctx.fill(); });
      } else if (ent.type === "text") {
        const s = toScreen(ent.x, ent.y);
        ctx.font = `${Math.max(10, ent.size * zoom)}px 'Courier New', monospace`;
        ctx.fillStyle = ent.color;
        ctx.shadowBlur = 0;
        ctx.fillText(ent.text, s.x, s.y);
      } else if (ent.type === "ellipse") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.ellipse(c.x, c.y, ent.rx*zoom, ent.ry*zoom, ent.rotation, 0, Math.PI*2); ctx.stroke();
      } else if (ent.type === "spline") {
        if (!ent.points || ent.points.length < 2) { ctx.restore(); return; }
        ctx.beginPath();
        const pts = ent.points.map(p => toScreen(p.x,p.y));
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x+pts[i+1].x)/2, my = (pts[i].y+pts[i+1].y)/2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
        ctx.stroke();
      }
      ctx.restore();
    };

    entities.forEach(e => drawEntity(e, selectedIds.includes(e.id)));

    // Preview while drawing
    if (drawing && startPoint && tempPoint) {
      const a = toScreen(startPoint.x, startPoint.y);
      const b = toScreen(tempPoint.x, tempPoint.y);
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWeight;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 6;

      if (activeTool === "line") {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (activeTool === "rectangle") {
        ctx.beginPath(); ctx.strokeRect(Math.min(a.x,b.x), Math.min(a.y,b.y), Math.abs(b.x-a.x), Math.abs(b.y-a.y));
      } else if (activeTool === "circle") {
        const r = Math.hypot(tempPoint.x-startPoint.x, tempPoint.y-startPoint.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, r*zoom, 0, Math.PI*2); ctx.stroke();
      } else if (activeTool === "arc") {
        const r = Math.hypot(tempPoint.x-startPoint.x, tempPoint.y-startPoint.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, r*zoom, 0, Math.PI); ctx.stroke();
      } else if (activeTool === "ellipse") {
        const rx = Math.abs(tempPoint.x-startPoint.x), ry = Math.abs(tempPoint.y-startPoint.y);
        ctx.beginPath(); ctx.ellipse(a.x, a.y, rx*zoom||1, ry*zoom||1, 0, 0, Math.PI*2); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Dynamic dimension
      if (dynamicInput && activeTool !== "select") {
        const dx = Math.abs(tempPoint.x - startPoint.x).toFixed(1);
        const dy = Math.abs(tempPoint.y - startPoint.y).toFixed(1);
        const dist = Math.hypot(tempPoint.x-startPoint.x, tempPoint.y-startPoint.y).toFixed(1);
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(b.x+12, b.y-36, 130, 46);
        ctx.fillStyle = "#00d4ff";
        ctx.font = "11px 'Courier New'";
        ctx.fillText(`dx: ${dx}  dy: ${dy}`, b.x+18, b.y-20);
        ctx.fillText(`dist: ${dist}`, b.x+18, b.y-6);
      }

      ctx.restore();
    }

    // Polyline preview
    if ((activeTool === "polyline" || activeTool === "spline") && polyPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWeight;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const p0 = toScreen(polyPoints[0].x, polyPoints[0].y);
      ctx.moveTo(p0.x, p0.y);
      polyPoints.slice(1).forEach(p => { const s=toScreen(p.x,p.y); ctx.lineTo(s.x,s.y); });
      if (tempPoint) { const s=toScreen(tempPoint.x,tempPoint.y); ctx.lineTo(s.x,s.y); }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Snap indicator
    if (snapEnabled && tempPoint) {
      const s = toScreen(tempPoint.x, tempPoint.y);
      ctx.save();
      ctx.strokeStyle = "#ffdd00";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#ffdd00";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    // Crosshair cursor
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cursor.x, 0); ctx.lineTo(cursor.x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cursor.y); ctx.lineTo(W, cursor.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // UCS icon
    if (ucsIcon) {
      const ux = 50, uy = H - 50;
      ctx.save();
      ctx.font = "bold 11px 'Courier New'";
      ctx.lineWidth = 2;
      [["X","#ff4444",1,0],["Y","#44ff88",0,-1]].forEach(([lbl,col,dx,dy]) => {
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux+dx*30, uy+dy*30); ctx.stroke();
        ctx.fillText(lbl, ux+dx*35-4, uy+dy*35+4);
      });
      ctx.strokeStyle = "#4499ff"; ctx.fillStyle = "#4499ff";
      ctx.beginPath(); ctx.moveTo(ux,uy); ctx.lineTo(ux-15,uy+10); ctx.stroke();
      ctx.fillText("Z", ux-28, uy+22);
      ctx.restore();
    }
  }, [entities, pan, zoom, cursor, tempPoint, drawing, startPoint, activeTool, gridEnabled, snapEnabled, selectedIds, lineColor, lineWeight, polyPoints, layers, ucsIcon, dynamicInput, toScreen, canvasSize]);

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    setCursor({ x: sx, y: sy });
    let wp = toWorld(sx, sy);
    if (snapEnabled) wp = snapToGrid(wp);
    if (startPoint) wp = applyOrtho(startPoint, wp);
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
      const rect = canvasRef.current.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }
    if (e.button !== 0) return;

    let wp = toWorld(
      e.clientX - canvasRef.current.getBoundingClientRect().left,
      e.clientY - canvasRef.current.getBoundingClientRect().top
    );
    if (snapEnabled) wp = snapToGrid(wp);
    if (startPoint) wp = applyOrtho(startPoint, wp);

    if (activeTool === "select") {
      const hit = [...entities].reverse().find(ent => hitTest(ent, wp));
      setSelectedIds(hit ? (e.shiftKey ? [...selectedIds, hit.id] : [hit.id]) : []);
      return;
    }

    if (activeTool === "polyline" || activeTool === "spline") {
      setPolyPoints(prev => [...prev, wp]);
      if (!drawing) { setDrawing(true); setStartPoint(wp); }
      log(`Point ${polyPoints.length + 1}: (${wp.x.toFixed(1)}, ${wp.y.toFixed(1)})`);
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

  const handleMouseUp = (e) => {
    if (e.button === 1 || activeTool === "pan") setIsDragging(false);
  };

  const handleDblClick = () => {
    if ((activeTool === "polyline" || activeTool === "spline") && polyPoints.length >= 2) {
      const eid = nextId();
      const ent = { id: eid, type: activeTool === "spline" ? "spline" : "polyline", points: [...polyPoints], color: lineColor, lineWeight, layer: currentLayer };
      const ne = [...entities, ent];
      setEntities(ne); pushHistory(ne);
      log(`${activeTool.toUpperCase()} created with ${polyPoints.length} points`);
      resetDraw();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
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
    if ((activeTool === "polyline" || activeTool === "spline") && polyPoints.length >= 2) handleDblClick();
    else { resetDraw(); }
  };

  const finishEntity = (endPt) => {
    if (!startPoint) return;
    let ent = null;
    const eid = nextId();
    const base = { id: eid, color: lineColor, lineWeight, layer: currentLayer };

    if (activeTool === "line") {
      ent = { ...base, type: "line", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
      log(`LINE: (${startPoint.x.toFixed(1)},${startPoint.y.toFixed(1)}) → (${endPt.x.toFixed(1)},${endPt.y.toFixed(1)})`);
    } else if (activeTool === "rectangle") {
      ent = { ...base, type: "rectangle", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
      log(`RECTANGLE created`);
    } else if (activeTool === "circle") {
      const r = Math.hypot(endPt.x-startPoint.x, endPt.y-startPoint.y);
      ent = { ...base, type: "circle", cx: startPoint.x, cy: startPoint.y, r };
      log(`CIRCLE: r=${r.toFixed(1)}`);
    } else if (activeTool === "arc") {
      const r = Math.hypot(endPt.x-startPoint.x, endPt.y-startPoint.y);
      const ang = Math.atan2(endPt.y-startPoint.y, endPt.x-startPoint.x);
      ent = { ...base, type: "arc", cx: startPoint.x, cy: startPoint.y, r, startAngle: ang-Math.PI/2, endAngle: ang+Math.PI/2 };
      log(`ARC created`);
    } else if (activeTool === "ellipse") {
      const rx = Math.abs(endPt.x-startPoint.x), ry = Math.abs(endPt.y-startPoint.y);
      ent = { ...base, type: "ellipse", cx: startPoint.x, cy: startPoint.y, rx, ry, rotation: 0 };
      log(`ELLIPSE created`);
    }

    if (ent) {
      const ne = [...entities, ent];
      setEntities(ne); pushHistory(ne);
    }
    resetDraw();
  };

  const resetDraw = () => { setDrawing(false); setStartPoint(null); setTempPoint(null); setPolyPoints([]); };

  const hitTest = (ent, pt) => {
    const tol = 5 / zoom;
    if (ent.type === "line") {
      const { x1,y1,x2,y2 } = ent;
      const len = Math.hypot(x2-x1,y2-y1);
      if (len < 0.01) return false;
      const t = Math.max(0,Math.min(1,((pt.x-x1)*(x2-x1)+(pt.y-y1)*(y2-y1))/(len*len)));
      return Math.hypot(pt.x-(x1+t*(x2-x1)), pt.y-(y1+t*(y2-y1))) < tol;
    }
    if (ent.type === "circle") return Math.abs(Math.hypot(pt.x-ent.cx,pt.y-ent.cy)-ent.r) < tol;
    if (ent.type === "rectangle") {
      const inX = pt.x >= Math.min(ent.x1,ent.x2)-tol && pt.x <= Math.max(ent.x1,ent.x2)+tol;
      const inY = pt.y >= Math.min(ent.y1,ent.y2)-tol && pt.y <= Math.max(ent.y1,ent.y2)+tol;
      return inX && inY;
    }
    return false;
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const kd = (e) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Escape") { resetDraw(); setSelectedIds([]); }
      if (e.key === "Delete") {
        if (selectedIds.length) {
          const ne = entities.filter(en => !selectedIds.includes(en.id));
          setEntities(ne); pushHistory(ne);
          log(`Deleted ${selectedIds.length} object(s)`);
          setSelectedIds([]);
        }
      }
      if (e.key === "F8") { e.preventDefault(); setOrthoMode(o => !o); }
      if (e.key === "F9") { e.preventDefault(); setSnapEnabled(s => !s); }
      if (e.key === "F7") { e.preventDefault(); setGridEnabled(g => !g); }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  });

  // ── Command input ─────────────────────────────────────────────────────────
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = commandInput.trim().toLowerCase();
    setCommandInput("");
    log(`> ${cmd}`);
    const cmds = {
      "line": () => setActiveTool("line"),
      "l": () => setActiveTool("line"),
      "circle": () => setActiveTool("circle"),
      "c": () => setActiveTool("circle"),
      "rect": () => setActiveTool("rectangle"),
      "rec": () => setActiveTool("rectangle"),
      "arc": () => setActiveTool("arc"),
      "a": () => setActiveTool("arc"),
      "pl": () => setActiveTool("polyline"),
      "polyline": () => setActiveTool("polyline"),
      "spline": () => setActiveTool("spline"),
      "el": () => setActiveTool("ellipse"),
      "ellipse": () => setActiveTool("ellipse"),
      "text": () => setActiveTool("text"),
      "t": () => setActiveTool("text"),
      "zoom": () => { setZoom(1); setPan({x:0,y:0}); },
      "z": () => { setZoom(1); setPan({x:0,y:0}); },
      "erase": () => {
        if (selectedIds.length) {
          const ne = entities.filter(en => !selectedIds.includes(en.id));
          setEntities(ne); pushHistory(ne); setSelectedIds([]);
          log(`Erased ${selectedIds.length} object(s)`);
        }
      },
      "e": () => {
        if (selectedIds.length) {
          const ne = entities.filter(en => !selectedIds.includes(en.id));
          setEntities(ne); pushHistory(ne); setSelectedIds([]);
        }
      },
      "undo": () => undo(),
      "u": () => undo(),
      "redo": () => redo(),
      "grid": () => setGridEnabled(g => !g),
      "ortho": () => setOrthoMode(o => !o),
      "snap": () => setSnapEnabled(s => !s),
      "select": () => setActiveTool("select"),
      "pan": () => setActiveTool("pan"),
      "clear": () => { setEntities([]); pushHistory([]); log("Drawing cleared"); },
    };
    if (cmds[cmd]) cmds[cmd]();
    else log(`Unknown command: ${cmd}`);
  };

  const selectAll = () => setSelectedIds(entities.map(e => e.id));

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    const ne = entities.filter(en => !selectedIds.includes(en.id));
    setEntities(ne); pushHistory(ne);
    log(`Deleted ${selectedIds.length} object(s)`);
    setSelectedIds([]);
  };

  const zoomFit = () => {
    if (!entities.length) { setZoom(1); setPan({x:0,y:0}); return; }
    const canvas = canvasRef.current;
    const W = canvas.width, H = canvas.height;
    setZoom(1); setPan({x: W/2, y: H/2});
  };

  const toolColor = (tool) => {
    const g = TOOLS.find(t => t.id === tool)?.group;
    return TOOL_GROUPS[g]?.color || "#666";
  };

  // ─── Ribbon tabs ──────────────────────────────────────────────────────────
  const RIBBON_TABS = ["Home","Insert","Annotate","Parametric","View","Manage","Output","Add-ins"];
  const RIBBON_GROUPS = {
    Home: [
      { label: "Draw", tools: ["line","polyline","rectangle","circle","arc","ellipse","spline","hatch"] },
      { label: "Modify", tools: ["move","copy","rotate","mirror","scale","trim","extend","fillet","chamfer"] },
      { label: "3D Tools", tools: ["extrude","revolve","sweep","loft"] },
      { label: "Annotation", tools: ["text","dimension","leader"] },
    ],
    View: [
      { label: "Navigate", tools: ["zoom","pan","orbit"] },
      { label: "Measure", tools: ["measure"] },
    ],
  };

  // ─── UI ──────────────────────────────────────────────────────────────────
  const S = {
    app: { display:"flex", flexDirection:"column", width:"100vw", height:"100vh", background:"#0d1117", color:"#c9d1d9", fontFamily:"'Segoe UI', 'SF Pro Display', sans-serif", overflow:"hidden", userSelect:"none" },
    menuBar: { display:"flex", alignItems:"center", background:"linear-gradient(90deg,#1a2035,#0f1623)", borderBottom:"1px solid #2a3248", height:28, paddingLeft:8, gap:2, fontSize:12, flexShrink:0 },
    menuItem: { padding:"2px 10px", cursor:"pointer", borderRadius:3, color:"#a0aec0", transition:"background 0.15s" },
    ribbon: { background:"linear-gradient(180deg,#1c2540,#151e30)", borderBottom:"1px solid #1e2d4a", flexShrink:0 },
    ribbonTabs: { display:"flex", borderBottom:"1px solid #1e2d4a", paddingLeft:4 },
    ribbonTab: (active) => ({ padding:"5px 16px", cursor:"pointer", fontSize:11.5, fontWeight:active?600:400, color:active?"#4fc3f7":"#7a8ba0", borderBottom:active?"2px solid #4fc3f7":"2px solid transparent", background:"transparent", transition:"all 0.15s", letterSpacing:"0.02em" }),
    ribbonContent: { display:"flex", padding:"6px 8px", gap:2, overflowX:"auto" },
    ribbonGroup: { display:"flex", flexDirection:"column", alignItems:"center", borderRight:"1px solid #1e2d4a", paddingRight:10, marginRight:8 },
    ribbonGroupLabel: { fontSize:9, color:"#4a5568", marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase" },
    ribbonTools: { display:"flex", gap:3, flexWrap:"wrap", maxWidth:260 },
    toolBtn: (active, tid) => ({
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      width:46, height:44, background:active ? `${toolColor(tid)}22` : "transparent",
      border:`1px solid ${active ? toolColor(tid) : "transparent"}`,
      borderRadius:4, cursor:"pointer", color: active ? toolColor(tid) : "#8090aa",
      transition:"all 0.15s", gap:2,
    }),
    toolLabel: { fontSize:8.5, textAlign:"center", lineHeight:1.1, letterSpacing:"0.02em" },
    workspace: { display:"flex", flex:1, overflow:"hidden" },
    leftPanel: { display:"flex", flexDirection:"column", background:"#111827", borderRight:"1px solid #1e2d4a", width:46, alignItems:"center", paddingTop:6, gap:1, flexShrink:0 },
    canvas: { flex:1, display:"block", cursor: activeTool==="pan"||isDragging?"grabbing":"crosshair" },
    rightPanel: { width:220, background:"#111827", borderLeft:"1px solid #1e2d4a", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 },
    panelHeader: { padding:"8px 12px", fontSize:11, fontWeight:600, color:"#4fc3f7", background:"#0d1421", borderBottom:"1px solid #1e2d4a", letterSpacing:"0.05em", textTransform:"uppercase" },
    bottomBar: { display:"flex", alignItems:"center", background:"#0a0f1a", borderTop:"1px solid #1e2d4a", height:24, paddingLeft:8, gap:16, fontSize:11, color:"#5a6a7a", flexShrink:0 },
    statusBtn: (active) => ({ cursor:"pointer", color:active?"#4fc3f7":"#5a6a7a", fontWeight:active?600:400, padding:"0 4px" }),
    cmdBar: { background:"#0d1117", borderTop:"1px solid #1e2d4a", padding:"4px 8px", display:"flex", alignItems:"center", gap:8, flexShrink:0 },
    cmdLog: { flex:1, overflowY:"auto", maxHeight:64, fontSize:11, color:"#4fc3f7", fontFamily:"'Courier New',monospace", lineHeight:1.6 },
    cmdInput: { background:"#1a2035", border:"1px solid #2a3248", borderRadius:3, color:"#e2e8f0", fontSize:12, padding:"3px 8px", width:200, fontFamily:"'Courier New',monospace", outline:"none" },
    layerRow: (active) => ({ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", cursor:"pointer", background:active?"#1a2545":"transparent", borderLeft:active?"2px solid #4fc3f7":"2px solid transparent", fontSize:11 }),
    propRow: { display:"flex", justifyContent:"space-between", padding:"3px 10px", fontSize:11, borderBottom:"1px solid #0d1421" },
    propLabel: { color:"#5a6a7a" },
    propValue: { color:"#a0aec0" },
  };

  const selectedEntities = entities.filter(e => selectedIds.includes(e.id));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Menu Bar */}
      <div style={S.menuBar}>
        <div style={{ display:"flex", alignItems:"center", marginRight:10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {["File","Edit","View","Insert","Format","Tools","Draw","Dimension","Modify","Window","Help"].map(m => (
          <div key={m} style={S.menuItem} onMouseEnter={e=>e.target.style.background="#1e2d4a"} onMouseLeave={e=>e.target.style.background="transparent"}>{m}</div>
        ))}
        <div style={{ flex:1 }} />
        <div style={{ fontSize:11, color:"#3a4a5a", marginRight:12 }}>3DCAD — {project?.name || "Loading..."}</div>
        <button onClick={() => navigate("/projects")} style={{ background:"#1a2545", border:"1px solid #2a3248", color:"#4fc3f7", borderRadius:3, fontSize:11, padding:"2px 10px", cursor:"pointer", marginRight:8 }}>← Projects</button>
      </div>

      {/* Ribbon */}
      {showRibbon && (
        <div style={S.ribbon}>
          <div style={S.ribbonTabs}>
            {RIBBON_TABS.map(tab => (
              <div key={tab} style={S.ribbonTab(activeRibbonTab===tab)} onClick={() => setActiveRibbonTab(tab)}>{tab}</div>
            ))}
            <div style={{ flex:1 }} />
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0 10px" }}>
              <button onClick={undo} title="Undo (Ctrl+Z)" style={{ background:"transparent", border:"none", color:"#7a8ba0", cursor:"pointer", padding:4 }}>↩</button>
              <button onClick={redo} title="Redo (Ctrl+Y)" style={{ background:"transparent", border:"none", color:"#7a8ba0", cursor:"pointer", padding:4 }}>↪</button>
              <button onClick={() => { setEntities([]); pushHistory([]); }} style={{ background:"transparent", border:"none", color:"#7a8ba0", cursor:"pointer", fontSize:10, padding:"2px 6px" }}>CLEAR</button>
            </div>
          </div>
          <div style={S.ribbonContent}>
            {(RIBBON_GROUPS[activeRibbonTab] || RIBBON_GROUPS.Home).map(grp => (
              <div key={grp.label} style={S.ribbonGroup}>
                <div style={S.ribbonTools}>
                  {grp.tools.map(tid => {
                    const tool = TOOLS.find(t => t.id === tid);
                    if (!tool) return null;
                    return (
                      <div key={tid} style={S.toolBtn(activeTool===tid, tid)} onClick={() => { setActiveTool(tid); resetDraw(); log(`Tool: ${tool.label}`); }} title={tool.label}>
                        <Icon d={tool.icon} size={16} color={activeTool===tid ? toolColor(tid) : "#8090aa"} />
                        <span style={S.toolLabel}>{tool.label}</span>
                      </div>
                    );
                  })}
                </div>
                <span style={S.ribbonGroupLabel}>{grp.label}</span>
              </div>
            ))}
            {/* Color & Weight */}
            <div style={S.ribbonGroup}>
              <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"2px 4px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color:"#5a6a7a" }}>Color</span>
                  <input type="color" value={lineColor} onChange={e=>setLineColor(e.target.value)} style={{ width:32, height:20, border:"none", background:"transparent", cursor:"pointer" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color:"#5a6a7a" }}>Weight</span>
                  <input type="range" min={0.5} max={6} step={0.5} value={lineWeight} onChange={e=>setLineWeight(+e.target.value)} style={{ width:60 }} />
                  <span style={{ fontSize:10, color:"#a0aec0" }}>{lineWeight}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color:"#5a6a7a" }}>Layer</span>
                  <select value={currentLayer} onChange={e=>setCurrentLayer(e.target.value)} style={{ background:"#1a2035", color:"#a0aec0", border:"1px solid #2a3248", borderRadius:3, fontSize:10, padding:"1px 4px" }}>
                    {layers.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <span style={S.ribbonGroupLabel}>Properties</span>
            </div>
            <div style={S.ribbonGroup}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {[["2D Top","2D"],["Isometric","ISO"],["Perspective","3D"],["Front","FR"],["Side","SD"]].map(([v,lbl]) => (
                  <div key={v} onClick={() => setViewMode(v)} style={{ fontSize:10, cursor:"pointer", color:viewMode===v?"#4fc3f7":"#7a8ba0", background:viewMode===v?"#1a2545":"transparent", borderRadius:3, padding:"2px 8px", border:viewMode===v?"1px solid #2a4a6a":"1px solid transparent" }}>{lbl}</div>
                ))}
              </div>
              <span style={S.ribbonGroupLabel}>View</span>
            </div>
          </div>
        </div>
      )}

      {/* Workspace */}
      <div style={S.workspace}>
        {/* Left mini toolbar */}
        <div style={S.leftPanel}>
          {[
            { id:"select", icon:"M5 3l14 9-7 2-3 7z" },
            { id:"zoom",   icon:"M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM10 7v3M7 10h3" },
            { id:"pan",    icon:"M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M12 5l3-3 3 3M12 19l-3 3-3-3M12 2v20" },
          ].map(t => (
            <div key={t.id} onClick={() => setActiveTool(t.id)} title={t.id} style={{ width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:4, cursor:"pointer", background:activeTool===t.id?"#1a2545":"transparent", border:activeTool===t.id?"1px solid #4fc3f7":"1px solid transparent", color:activeTool===t.id?"#4fc3f7":"#5a6a7a", marginBottom:2 }}>
              <Icon d={t.icon} size={15} />
            </div>
          ))}
          <div style={{ flex:1 }} />
          <div onClick={zoomFit} title="Zoom Fit" style={{ width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:4, cursor:"pointer", color:"#5a6a7a", marginBottom:4 }}>
            <Icon d="M5 15H3v4a2 2 0 0 0 2 2h4v-2H5zM5 5h4V3H5a2 2 0 0 0-2 2v4h2zm14-2h-4v2h4v4h2V5a2 2 0 0 0-2-2zm0 16h-4v2h4a2 2 0 0 0 2-2v-4h-2z" size={15} />
          </div>
        </div>

        {/* Canvas container — fills remaining space */}
        <div ref={containerRef} style={{ flex:1, overflow:"hidden", position:"relative" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ ...S.canvas, width:"100%", height:"100%", display:"block" }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDblClick}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        />
        </div>

        {/* Right Panel */}
        <div style={S.rightPanel}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid #1e2d4a" }}>
            {["Properties","Layers","Snaps"].map(tab => (
              <div key={tab} onClick={() => { setShowLayers(tab==="Layers"); setShowProperties(tab==="Properties"); setShowSnapPanel(tab==="Snaps"); }} style={{ flex:1, textAlign:"center", padding:"6px 4px", fontSize:10.5, cursor:"pointer", color:(showLayers&&tab==="Layers")||(showProperties&&tab==="Properties")||(showSnapPanel&&tab==="Snaps")?"#4fc3f7":"#5a6a7a", borderBottom:(showLayers&&tab==="Layers")||(showProperties&&tab==="Properties")||(showSnapPanel&&tab==="Snaps")?"2px solid #4fc3f7":"2px solid transparent", background:"transparent", letterSpacing:"0.02em" }}>
                {tab}
              </div>
            ))}
          </div>

          {/* Properties panel */}
          {showProperties && (
            <div style={{ overflow:"auto", flex:1 }}>
              <div style={S.panelHeader}>Object Properties</div>
              {selectedEntities.length === 0 ? (
                <div style={{ padding:12, fontSize:11, color:"#3a4a5a" }}>No selection</div>
              ) : (
                <>
                  {selectedEntities.map(ent => (
                    <div key={ent.id}>
                      <div style={{ ...S.propRow, background:"#0d1421" }}>
                        <span style={{ ...S.propLabel, textTransform:"uppercase", fontWeight:600, color:"#4fc3f7" }}>{ent.type}</span>
                        <span style={{ ...S.propValue, fontSize:9 }}>#{ent.id}</span>
                      </div>
                      <div style={S.propRow}><span style={S.propLabel}>Layer</span><span style={S.propValue}>{ent.layer}</span></div>
                      <div style={S.propRow}><span style={S.propLabel}>Color</span><span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, background:ent.color, borderRadius:2, display:"inline-block" }} /><span style={S.propValue}>{ent.color}</span></span></div>
                      <div style={S.propRow}><span style={S.propLabel}>LW</span><span style={S.propValue}>{ent.lineWeight}px</span></div>
                      {ent.type==="line" && <>
                        <div style={S.propRow}><span style={S.propLabel}>Length</span><span style={S.propValue}>{Math.hypot(ent.x2-ent.x1,ent.y2-ent.y1).toFixed(2)}</span></div>
                        <div style={S.propRow}><span style={S.propLabel}>Angle</span><span style={S.propValue}>{(Math.atan2(ent.y2-ent.y1,ent.x2-ent.x1)*180/Math.PI).toFixed(1)}°</span></div>
                      </>}
                      {ent.type==="circle" && <div style={S.propRow}><span style={S.propLabel}>Radius</span><span style={S.propValue}>{ent.r.toFixed(2)}</span></div>}
                      {ent.type==="rectangle" && <>
                        <div style={S.propRow}><span style={S.propLabel}>Width</span><span style={S.propValue}>{Math.abs(ent.x2-ent.x1).toFixed(2)}</span></div>
                        <div style={S.propRow}><span style={S.propLabel}>Height</span><span style={S.propValue}>{Math.abs(ent.y2-ent.y1).toFixed(2)}</span></div>
                      </>}
                    </div>
                  ))}
                </>
              )}
              <div style={S.panelHeader}>General</div>
              <div style={S.propRow}><span style={S.propLabel}>Objects</span><span style={S.propValue}>{entities.length}</span></div>
              <div style={S.propRow}><span style={S.propLabel}>Selected</span><span style={S.propValue}>{selectedIds.length}</span></div>
              <div style={S.propRow}><span style={S.propLabel}>Zoom</span><span style={S.propValue}>{(zoom*100).toFixed(0)}%</span></div>
              <div style={S.propRow}><span style={S.propLabel}>View</span><span style={S.propValue}>{viewMode}</span></div>
              <div style={S.propRow}><span style={S.propLabel}>Layer</span><span style={S.propValue}>{currentLayer}</span></div>
            </div>
          )}

          {/* Layers panel */}
          {showLayers && (
            <div style={{ overflow:"auto", flex:1 }}>
              <div style={S.panelHeader}>Layer Manager</div>
              <div style={{ padding:"4px 8px", display:"flex", gap:4 }}>
                <button onClick={() => { const n = prompt("New layer name:"); if (n) setLayers(l => [...l, {id:l.length+1,name:n,color:"#ffffff",visible:true,locked:false,lineType:"Continuous",lineWeight:"Default"}]); }} style={{ fontSize:10, background:"#1a2545", color:"#4fc3f7", border:"1px solid #2a3248", borderRadius:3, padding:"2px 8px", cursor:"pointer" }}>+ New</button>
              </div>
              {layers.map(layer => (
                <div key={layer.id} style={S.layerRow(currentLayer===layer.name)} onClick={() => setCurrentLayer(layer.name)}>
                  <div onClick={e=>{e.stopPropagation();setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,visible:!l.visible}:l));}} style={{ color:layer.visible?"#4fc3f7":"#3a4a5a", cursor:"pointer", fontSize:13 }}>{layer.visible?"👁":"🚫"}</div>
                  <div onClick={e=>{e.stopPropagation();setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,locked:!l.locked}:l));}} style={{ color:layer.locked?"#ffcc00":"#3a4a5a", cursor:"pointer", fontSize:12 }}>{layer.locked?"🔒":"🔓"}</div>
                  <div style={{ width:10, height:10, background:layer.color, borderRadius:2, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:11, color:currentLayer===layer.name?"#e2e8f0":"#8090aa" }}>{layer.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Snap panel */}
          {showSnapPanel && (
            <div style={{ overflow:"auto", flex:1 }}>
              <div style={S.panelHeader}>Object Snaps</div>
              <div style={{ padding:"6px 8px" }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, marginBottom:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={snapEnabled} onChange={e=>setSnapEnabled(e.target.checked)} />
                  <span style={{ color:"#4fc3f7" }}>Enable Snaps (F9)</span>
                </label>
                {SNAP_MODES.map(s => (
                  <label key={s} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, marginBottom:4, cursor:"pointer", opacity:snapEnabled?1:0.4 }}>
                    <input type="checkbox" checked={activeSnaps.includes(s)} onChange={() => setActiveSnaps(a => a.includes(s)?a.filter(x=>x!==s):[...a,s])} disabled={!snapEnabled} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Default: show properties tab selected */}
          {!showLayers && !showProperties && !showSnapPanel && (
            <div style={{ padding:12, fontSize:11, color:"#3a4a5a" }}>Select a tab above</div>
          )}
        </div>
      </div>

      {/* Command area */}
      <div style={S.cmdBar}>
        <div style={S.cmdLog}>
          {commandLog.slice(-4).map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <span style={{ fontSize:11, color:"#3a4a5a" }}>Command:</span>
        <input style={S.cmdInput} value={commandInput} onChange={e=>setCommandInput(e.target.value)} onKeyDown={handleCommand} placeholder="Enter command..." autoComplete="off" spellCheck="false" />
      </div>

      {/* Status Bar */}
      <div style={S.bottomBar}>
        <span style={{ color:"#4fc3f7", fontFamily:"'Courier New',monospace", fontSize:11 }}>
          X: {worldCursor.x.toFixed(2)}  Y: {worldCursor.y.toFixed(2)}  Z: 0.00
        </span>
        <div style={{ width:1, height:14, background:"#1e2d4a" }} />
        <span style={S.statusBtn(snapEnabled)} onClick={()=>setSnapEnabled(s=>!s)} title="F9">SNAP</span>
        <span style={S.statusBtn(gridEnabled)} onClick={()=>setGridEnabled(g=>!g)} title="F7">GRID</span>
        <span style={S.statusBtn(orthoMode)} onClick={()=>setOrthoMode(o=>!o)} title="F8">ORTHO</span>
        <span style={S.statusBtn(polarMode)} onClick={()=>setPolarMode(p=>!p)}>POLAR</span>
        <span style={S.statusBtn(dynamicInput)} onClick={()=>setDynamicInput(d=>!d)}>DYN</span>
        <div style={{ flex:1 }} />
        <span style={{ color:"#3a4a5a" }}>Tool: <span style={{ color:toolColor(activeTool) }}>{activeTool.toUpperCase()}</span></span>
        <span style={{ color:"#3a4a5a" }}>Zoom: {(zoom*100).toFixed(0)}%</span>
        <span style={{ color:"#3a4a5a" }}>Layer: <span style={{ color:"#4fc3f7" }}>{currentLayer}</span></span>
        <span style={{ color:"#3a4a5a" }}>Objects: {entities.length}</span>
        <span onClick={selectAll} style={{ ...S.statusBtn(false), cursor:"pointer" }}>Select All</span>
        <span onClick={deleteSelected} style={{ ...S.statusBtn(false), color:selectedIds.length?"#ff6b6b":"#3a4a5a", cursor:"pointer" }}>Delete</span>
        <div style={{ width:1, height:14, background:"#1e2d4a" }} />
        <span style={{ color:"#3a4a5a", marginRight:4 }}>MODEL</span>
      </div>
    </div>
  );
}