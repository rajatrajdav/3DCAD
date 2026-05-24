import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from '@react-three/fiber';
import { getSession } from "../auth";
import Scene3D from "../components/canvas/Scene3D";
import { TOOLS, TOOL_GROUPS, SNAP_MODES, LAYERS, exportToDXF, exportToSTL, hitTest2D, calculateSnapPoint, applyOrthoConstraint } from "../utils/cadUtils";

const PROJECTS_KEY = "3dcad_projects";

function loadProject(userId, projectId) {
  try {
    const projects = JSON.parse(localStorage.getItem(`${PROJECTS_KEY}_${userId}`)) || [];
    return projects.find(p => p.id === projectId) || null;
  } catch {
    return null;
  }
}

function saveProjectData(userId, projectId, data) {
  try {
    const key = `${PROJECTS_KEY}_${userId}`;
    const projects = JSON.parse(localStorage.getItem(key)) || [];
    localStorage.setItem(key, JSON.stringify(
      projects.map(p => p.id === projectId ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    ));
  } catch {}
}

const Icon = ({ d, size = 16, color = "currentColor", fill = "none", strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export default function CADEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [project, setProject] = useState(null);
  const [viewport, setViewport] = useState("2d");

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [worldCursor, setWorldCursor] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [tempPoint, setTempPoint] = useState(null);
  const [polyPoints, setPolyPoints] = useState([]);

  const [entities2D, setEntities2D] = useState([]);
  const [entities3D, setEntities3D] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId3D, setSelectedId3D] = useState(null);

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
  const [showRibbon, setShowRibbon] = useState(true);
  const [activeRibbonTab, setActiveRibbonTab] = useState("Home");
  const [activeFileTab, setActiveFileTab] = useState("Drawing1.dwg");
  const [layoutTab, setLayoutTab] = useState("Model");
  const [statusInfo, setStatusInfo] = useState("Ready");
  const [ucsIcon, setUcsIcon] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [transforming, setTransforming] = useState(false);
  const [transformId, setTransformId] = useState(null);
  const [transformOriginal, setTransformOriginal] = useState(null);
  const [transformStart, setTransformStart] = useState(null);
  const [activeSnaps, setActiveSnaps] = useState(["Endpoint", "Midpoint", "Center", "Intersection"]);

  const idRef = useRef(1);
  const GRID_SIZE = 20;

  useEffect(() => {
    if (!session) { navigate("/login", { replace: true }); return; }
    const p = loadProject(session.id, id);
    if (!p) { navigate("/projects", { replace: true }); return; }
    setProject(p);
    if (p.entities_2d) setEntities2D(p.entities_2d);
    if (p.entities_3d) setEntities3D(p.entities_3d);
  }, [id, session, navigate]);

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

  useEffect(() => {
    if (session && id) {
      saveProjectData(session.id, id, { entities_2d: entities2D, entities_3d: entities3D });
    }
  }, [entities2D, entities3D, session, id]);

  const toWorld = useCallback((sx, sy) => ({ x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom }), [pan, zoom]);
  const toScreen = useCallback((wx, wy) => ({ x: wx * zoom + pan.x, y: wy * zoom + pan.y }), [pan, zoom]);
  const nextId = () => { idRef.current += 1; return idRef.current; };
  const logCommand = (msg) => setCommandLog(prev => [...prev.slice(-49), msg]);

  const update3DObject = useCallback((id, updates) => {
    setEntities3D(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  }, []);

  const sceneTransformMode = activeTool === 'rotate' ? 'rotate' : activeTool === 'scale' ? 'scale' : activeTool === 'move' ? 'translate' : null;

  const pushHistory = (items) => {
    const h = history.slice(0, historyIdx + 1);
    h.push(items);
    setHistory(h);
    setHistoryIdx(h.length - 1);
  };

  const undo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setEntities2D(prev);
      logCommand("UNDO");
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setEntities2D(next);
      logCommand("REDO");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewport !== "2d") return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a1f2e");
    bg.addColorStop(1, "#111520");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (gridEnabled) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.5;
      const gs = GRID_SIZE * zoom;
      const ox = ((pan.x % gs) + gs) % gs;
      const oy = ((pan.y % gs) + gs) % gs;
      for (let x = ox; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }

    const drawEntity = (ent, selected) => {
      const layer = layers.find(l => l.name === ent.layer) || layers[0];
      if (!layer.visible) return;
      ctx.save();
      ctx.strokeStyle = selected ? "#ffdd57" : ent.color;
      ctx.lineWidth = selected ? (ent.lineWeight + 1) * zoom : ent.lineWeight * zoom;
      ctx.fillStyle = ent.fill || "transparent";
      
      const drawHandles = (points) => {
        if (!selected) return;
        points.forEach(p => {
          const s = toScreen(p.x, p.y);
          ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fillStyle = "#ffdd57"; ctx.fill();
        });
      };

      if (ent.type === "line") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        drawHandles([{ x: ent.x1, y: ent.y1 }, { x: ent.x2, y: ent.y2 }]);
      } else if (ent.type === "rectangle") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        ctx.stroke();
        if (selected) drawHandles([{ x: ent.x1, y: ent.y1 }, { x: ent.x2, y: ent.y2 }, { x: ent.x1, y: ent.y2 }, { x: ent.x2, y: ent.y1 }]);
      } else if (ent.type === "circle") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, 0, Math.PI * 2); ctx.stroke();
        drawHandles([{ x: ent.cx + ent.r, y: ent.cy }]);
      } else if (ent.type === "arc") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, ent.startAngle, ent.endAngle); ctx.stroke();
      } else if (ent.type === "ellipse") {
        const c = toScreen(ent.cx, ent.cy);
        ctx.beginPath(); ctx.ellipse(c.x, c.y, ent.rx * zoom, ent.ry * zoom, ent.rotation, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ent.type === "polyline" || ent.type === "spline") {
        if (!ent.points || ent.points.length < 2) { ctx.restore(); return; }
        const first = toScreen(ent.points[0].x, ent.points[0].y);
        ctx.beginPath(); ctx.moveTo(first.x, first.y);
        ent.points.slice(1).forEach(p => { const s = toScreen(p.x, p.y); ctx.lineTo(s.x, s.y); });
        if (ent.closed) ctx.closePath();
        ctx.stroke();
        if (selected) drawHandles(ent.points);
      } else if (ent.type === "text") {
        const s = toScreen(ent.x, ent.y);
        ctx.font = `${Math.max(12, ent.size * zoom)}px 'Courier New'`;
        ctx.fillStyle = ent.color;
        ctx.fillText(ent.text, s.x, s.y);
      } else if (ent.type === "dimension") {
        const a = toScreen(ent.x1, ent.y1), b = toScreen(ent.x2, ent.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const label = ent.label || `${Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1).toFixed(2)}`;
        ctx.font = "10px 'Courier New'";
        ctx.fillStyle = "#a0eaff";
        ctx.fillText(label, (a.x + b.x) / 2 + 6, (a.y + b.y) / 2 - 6);
      }
      ctx.restore();
    };

    entities2D.forEach(e => drawEntity(e, selectedIds.includes(e.id)));

    if (drawing && startPoint && tempPoint) {
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWeight;
      ctx.setLineDash([6, 4]);
      const a = toScreen(startPoint.x, startPoint.y);
      const b = toScreen(tempPoint.x, tempPoint.y);
      if (activeTool === "line") {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (activeTool === "rectangle") {
        ctx.beginPath(); ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); ctx.stroke();
      } else if (activeTool === "circle") {
        const r = Math.hypot(tempPoint.x - startPoint.x, tempPoint.y - startPoint.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, r * zoom, 0, Math.PI * 2); ctx.stroke();
      } else if (activeTool === "arc") {
        const r = Math.hypot(tempPoint.x - startPoint.x, tempPoint.y - startPoint.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, r * zoom, 0, Math.PI); ctx.stroke();
      } else if (activeTool === "ellipse") {
        const rx = Math.abs(tempPoint.x - startPoint.x);
        const ry = Math.abs(tempPoint.y - startPoint.y);
        ctx.beginPath(); ctx.ellipse(a.x, a.y, rx * zoom || 1, ry * zoom || 1, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (activeTool === "dimension") {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (activeTool === "polyline" || activeTool === "spline") {
        if (polyPoints.length > 0) {
          ctx.beginPath();
          const p0 = toScreen(polyPoints[0].x, polyPoints[0].y);
          ctx.moveTo(p0.x, p0.y);
          polyPoints.slice(1).forEach(point => { const s = toScreen(point.x, point.y); ctx.lineTo(s.x, s.y); });
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
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
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cursor.x, 0); ctx.lineTo(cursor.x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cursor.y); ctx.lineTo(W, cursor.y); ctx.stroke();
    ctx.restore();

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
  }, [entities2D, pan, zoom, cursor, tempPoint, drawing, startPoint, activeTool, gridEnabled, snapEnabled, selectedIds, lineColor, lineWeight, layers, ucsIcon, dynamicInput, toScreen, canvasSize, polyPoints, viewport]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    setCursor({ x: sx, y: sy });
    let wp = toWorld(sx, sy);
    if (snapEnabled) wp = calculateSnapPoint(wp, GRID_SIZE, true);
    if (startPoint && (activeTool === "line" || activeTool === "rectangle" || activeTool === "circle" || activeTool === "arc" || activeTool === "ellipse" || activeTool === "dimension")) {
      wp = applyOrthoConstraint(startPoint, wp, orthoMode);
    }
    setWorldCursor(wp);
    setTempPoint(wp);

    if (transforming && dragStart && transformId != null) {
      const delta = { x: wp.x - transformStart.x, y: wp.y - transformStart.y };
      setTransformStart(wp);
      setEntities2D((prev) => prev.map(ent => {
        if (ent.id !== transformId) return ent;
        if (activeTool === "move" || activeTool === "copy") {
          if (ent.type === "line" || ent.type === "dimension") {
            return { ...ent, x1: ent.x1 + delta.x, y1: ent.y1 + delta.y, x2: ent.x2 + delta.x, y2: ent.y2 + delta.y };
          }
          if (ent.type === "rectangle") {
            return { ...ent, x1: ent.x1 + delta.x, y1: ent.y1 + delta.y, x2: ent.x2 + delta.x, y2: ent.y2 + delta.y };
          }
          if (ent.type === "circle" || ent.type === "arc" || ent.type === "ellipse") {
            return { ...ent, cx: ent.cx + delta.x, cy: ent.cy + delta.y };
          }
          if (ent.type === "polyline" || ent.type === "spline") {
            return { ...ent, points: ent.points.map(p => ({ x: p.x + delta.x, y: p.y + delta.y })) };
          }
          return ent;
        }
        if (activeTool === "rotate") {
          if (ent.type === "line" || ent.type === "dimension") {
            const cx = (ent.x1 + ent.x2) / 2;
            const cy = (ent.y1 + ent.y2) / 2;
            const angle = Math.atan2(wp.y - cy, wp.x - cx) - Math.atan2(transformStart.y - cy, transformStart.x - cx);
            const rotatePoint = (x, y) => {
              const dx = x - cx; const dy = y - cy;
              return { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) };
            };
            const a = rotatePoint(ent.x1, ent.y1);
            const b = rotatePoint(ent.x2, ent.y2);
            return { ...ent, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          }
          if (ent.type === "polyline" || ent.type === "spline") {
            const cx = ent.points.reduce((sum, p) => sum + p.x, 0) / ent.points.length;
            const cy = ent.points.reduce((sum, p) => sum + p.y, 0) / ent.points.length;
            const angle = Math.atan2(wp.y - cy, wp.x - cx) - Math.atan2(transformStart.y - cy, transformStart.x - cx);
            const rotatePoint = (x, y) => {
              const dx = x - cx; const dy = y - cy;
              return { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) };
            };
            return { ...ent, points: ent.points.map(p => rotatePoint(p.x, p.y)) };
          }
          return ent;
        }
        if (activeTool === "scale") {
          const scale = Math.max(0.1, 1 + (wp.x - transformStart.x) * 0.01);
          if (ent.type === "line" || ent.type === "dimension") {
            const cx = (ent.x1 + ent.x2) / 2; const cy = (ent.y1 + ent.y2) / 2;
            const scalePoint = (x, y) => ({ x: cx + (x - cx) * scale, y: cy + (y - cy) * scale });
            const a = scalePoint(ent.x1, ent.y1); const b = scalePoint(ent.x2, ent.y2);
            return { ...ent, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          }
          if (ent.type === "rectangle") {
            const cx = (ent.x1 + ent.x2) / 2; const cy = (ent.y1 + ent.y2) / 2;
            const a = { x: cx + (ent.x1 - cx) * scale, y: cy + (ent.y1 - cy) * scale };
            const b = { x: cx + (ent.x2 - cx) * scale, y: cy + (ent.y2 - cy) * scale };
            return { ...ent, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          }
          if (ent.type === "circle" || ent.type === "arc") {
            return { ...ent, r: Math.max(1, ent.r * scale) };
          }
        }
        return ent;
      }));
    }

    if (isDragging && dragStart && activeTool === "pan") {
      setPan({ x: pan.x + (sx - dragStart.x), y: pan.y + (sy - dragStart.y) });
      setDragStart({ x: sx, y: sy });
    }
  };

  const activeHit = (wp) => {
    const hit = [...entities2D].reverse().find(ent => hitTest2D(ent, wp, 5 / zoom));
    return hit;
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && activeTool === "pan")) {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }
    if (e.button !== 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let wp = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    if (snapEnabled) wp = calculateSnapPoint(wp, GRID_SIZE, true);
    if (startPoint && (activeTool === "line" || activeTool === "rectangle" || activeTool === "circle" || activeTool === "arc" || activeTool === "ellipse" || activeTool === "dimension")) {
      wp = applyOrthoConstraint(startPoint, wp, orthoMode);
    }

    if (activeTool === "select") {
      const hit = activeHit(wp);
      setSelectedIds(hit ? [hit.id] : []);
      return;
    }

    if (activeTool === "erase") {
      const hit = activeHit(wp);
      if (hit) {
        const next = entities2D.filter(ent => ent.id !== hit.id);
        setEntities2D(next); pushHistory(next);
        logCommand(`ERASED ${hit.type.toUpperCase()}`);
      }
      return;
    }

    if (activeTool === "move" || activeTool === "copy" || activeTool === "rotate" || activeTool === "scale") {
      const hit = activeHit(wp);
      if (!hit) return;
      setSelectedIds([hit.id]);
      setTransformId(hit.id);
      setTransformOriginal(hit);
      setTransformStart(wp);
      setTransforming(true);
      if (activeTool === "copy") {
        const copyEntity = { ...hit, id: nextId() };
        setEntities2D(prev => { const next = [...prev, copyEntity]; pushHistory(next); return next; });
        setTransformId(copyEntity.id);
      }
      return;
    }

    if (activeTool === "polyline" || activeTool === "spline") {
      if (!drawing) {
        setDrawing(true);
        setStartPoint(wp);
        setPolyPoints([wp]);
        logCommand(`${activeTool.toUpperCase()} start`);
      } else {
        setPolyPoints(prev => [...prev, wp]);
        logCommand(`Point ${polyPoints.length + 1}`);
      }
      return;
    }

    if (activeTool === "text") {
      const text = prompt("Enter text:", "Text");
      if (!text) return;
      const ent = { id: nextId(), type: "text", x: wp.x, y: wp.y, size: 16, text, color: lineColor, layer: currentLayer, lineWeight };
      const next = [...entities2D, ent];
      setEntities2D(next); pushHistory(next);
      logCommand("TEXT added");
      return;
    }

    if (activeTool === "dimension") {
      if (!drawing) {
        setDrawing(true); setStartPoint(wp); logCommand("DIMENSION first point");
      } else {
        const ent = { id: nextId(), type: "dimension", x1: startPoint.x, y1: startPoint.y, x2: wp.x, y2: wp.y, layer: currentLayer, color: lineColor, lineWeight };
        const next = [...entities2D, ent]; setEntities2D(next); pushHistory(next); logCommand("Dimension added"); resetDraw();
      }
      return;
    }

    if (!drawing) {
      setDrawing(true);
      setStartPoint(wp);
      logCommand(`First point: (${wp.x.toFixed(1)}, ${wp.y.toFixed(1)})`);
    } else {
      finishEntity(wp);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === "pan") setIsDragging(false);
    if (transforming) {
      setTransforming(false);
      setTransformId(null);
      setTransformOriginal(null);
      logCommand(`${activeTool.toUpperCase()} complete`);
    }
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
    if (activeTool === "polyline" || activeTool === "spline") {
      if (polyPoints.length > 1) {
        const ent = { id: nextId(), type: activeTool, points: polyPoints, closed: false, layer: currentLayer, color: lineColor, lineWeight };
        const next = [...entities2D, ent]; setEntities2D(next); pushHistory(next); logCommand(`${activeTool.toUpperCase()} finished`);
      }
    }
    resetDraw();
  };

  const finishEntity = (endPt) => {
    if (!startPoint) return;
    let ent = null;
    const base = { id: nextId(), layer: currentLayer, color: lineColor, lineWeight };
    if (activeTool === "line") ent = { ...base, type: "line", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
    else if (activeTool === "rectangle") ent = { ...base, type: "rectangle", x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y };
    else if (activeTool === "circle") {
      const r = Math.hypot(endPt.x - startPoint.x, endPt.y - startPoint.y);
      ent = { ...base, type: "circle", cx: startPoint.x, cy: startPoint.y, r };
    } else if (activeTool === "arc") {
      const r = Math.hypot(endPt.x - startPoint.x, endPt.y - startPoint.y);
      ent = { ...base, type: "arc", cx: startPoint.x, cy: startPoint.y, r, startAngle: 0, endAngle: Math.PI };
    } else if (activeTool === "ellipse") {
      ent = { ...base, type: "ellipse", cx: startPoint.x, cy: startPoint.y, rx: Math.abs(endPt.x - startPoint.x), ry: Math.abs(endPt.y - startPoint.y), rotation: 0 };
    }
    if (ent) {
      const next = [...entities2D, ent]; setEntities2D(next); pushHistory(next); logCommand(`${ent.type.toUpperCase()} created`);
    }
    resetDraw();
  };

  const resetDraw = () => { setDrawing(false); setStartPoint(null); setTempPoint(null); setPolyPoints([]); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Escape") { resetDraw(); setSelectedIds([]); }
      if (e.key === "Delete") {
        if (selectedIds.length) {
          const next = entities2D.filter(ent => !selectedIds.includes(ent.id));
          setEntities2D(next); pushHistory(next); setSelectedIds([]); logCommand("Deleted selection");
        }
      }
      if (e.key === "F8") { e.preventDefault(); setOrthoMode(o => !o); }
      if (e.key === "F9") { e.preventDefault(); setSnapEnabled(s => !s); }
      if (e.key === "F7") { e.preventDefault(); setGridEnabled(g => !g); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, entities2D, historyIdx]);

  const commandActions = {
    // File operations
    new: () => { setEntities2D([]); setEntities3D([]); logCommand("New drawing created"); },
    open: () => { logCommand("Open dialog"); },
    save: () => { saveProjectData(session.id, id, { entities_2d: entities2D, entities_3d: entities3D }); logCommand("Saved project"); },
    export: () => {
      const dxf = exportToDXF(entities2D);
      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${project?.name || 'drawing'}.dxf`; a.click();
      logCommand("Exported DXF");
    },
    print: () => { window.print(); logCommand("Print dialog"); },
    
    // Drawing tools
    line: () => setActiveTool("line"),
    circle: () => setActiveTool("circle"),
    rect: () => setActiveTool("rectangle"),
    rectangle: () => setActiveTool("rectangle"),
    polyline: () => setActiveTool("polyline"),
    spline: () => setActiveTool("spline"),
    arc: () => setActiveTool("arc"),
    ellipse: () => setActiveTool("ellipse"),
    text: () => setActiveTool("text"),
    mtext: () => setActiveTool("text"),
    dimension: () => setActiveTool("dimension"),
    linear: () => setActiveTool("dimension"),
    angular: () => setActiveTool("dimension"),
    radius: () => setActiveTool("dimension"),
    leader: () => setActiveTool("leader"),
    qleader: () => setActiveTool("leader"),
    mleader: () => setActiveTool("leader"),
    
    // Modify tools
    erase: () => setActiveTool("erase"),
    move: () => setActiveTool("move"),
    copy: () => setActiveTool("copy"),
    rotate: () => setActiveTool("rotate"),
    scale: () => setActiveTool("scale"),
    mirror: () => setActiveTool("mirror"),
    offset: () => setActiveTool("offset"),
    array: () => setActiveTool("array"),
    stretch: () => setActiveTool("stretch"),
    trim: () => setActiveTool("trim"),
    extend: () => setActiveTool("extend"),
    break: () => setActiveTool("break"),
    join: () => setActiveTool("join"),
    fillet: () => setActiveTool("fillet"),
    chamfer: () => setActiveTool("chamfer"),
    
    // View tools
    zoom: () => { setZoom(1); setPan({ x: canvasSize.w / 2, y: canvasSize.h / 2 }); },
    pan: () => setActiveTool("pan"),
    orbit: () => setActiveTool("orbit"),
    walk: () => setActiveTool("walk"),
    top: () => { logCommand("Top view"); },
    front: () => { logCommand("Front view"); },
    right: () => { logCommand("Right view"); },
    iso: () => { logCommand("Isometric view"); },
    wireframe: () => { logCommand("Wireframe mode"); },
    hidden: () => { logCommand("Hidden line mode"); },
    realistic: () => { logCommand("Realistic mode"); },
    shaded: () => { logCommand("Shaded mode"); },
    grid: () => setGridEnabled(g => !g),
    snap: () => setSnapEnabled(s => !s),
    ortho: () => setOrthoMode(o => !o),
    polar: () => setPolarMode(p => !p),
    
    // Layer and properties
    layer: () => { logCommand("Layer manager"); },
    properties: () => { logCommand("Properties panel"); },
    
    // Block operations
    block: () => { logCommand("Create block"); },
    insert: () => { logCommand("Insert block"); },
    wblock: () => { logCommand("Write block"); },
    
    // Utilities
    measure: () => setActiveTool("measure"),
    calculator: () => { logCommand("Calculator"); },
    
    // Standard commands
    undo: undo,
    redo: redo,
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = commandInput.trim().toLowerCase();
    setCommandInput("");
    logCommand(`> ${cmd}`);
    if (commandActions[cmd]) commandActions[cmd](); else logCommand(`Unknown command: ${cmd}`);
  };

  const S = {
    app: { display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#0b101b", color: "#d8e9ff", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" },
    menuBar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#131a2c", borderBottom: "1px solid #334168", height: 34, padding: "0 10px", gap: 8, fontSize: 12, flexShrink: 0 },
    appTitle: { display: "flex", alignItems: "center", gap: 10, color: "#d4e7ff", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
    appButton: { display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 5, border: "1px solid #2e4164", background: "#0f1830", color: "#8db8ff", cursor: "pointer" },
    quickAccess: { display: "flex", alignItems: "center", gap: 4 },
    quickButton: (active) => ({ width: 28, height: 28, borderRadius: 5, border: "1px solid #2d3a5f", background: active ? "#0f57d1" : "#0f1830", color: active ? "#e4f3ff" : "#9bb5d9", display: "grid", placeItems: "center", cursor: "pointer" }),
    fileTabs: { display: "flex", alignItems: "center", gap: 2, padding: "4px 10px", minHeight: 30, background: "#101826", borderBottom: "1px solid #2e4167" },
    fileTab: (active) => ({ padding: "5px 16px", borderRadius: "5px 5px 0 0", background: active ? "#0f4ec8" : "transparent", color: active ? "#eef6ff" : "#9cb5df", cursor: "pointer", fontSize: 11, border: active ? "1px solid #1d4db5" : "1px solid transparent", borderBottom: active ? "none" : "1px solid transparent" }),
    workspaceTabs: { display: "flex", alignItems: "center", gap: 2, padding: "0 10px", minHeight: 30, background: "#101826", borderBottom: "1px solid #2d3e6a" },
    workspaceTab: (active) => ({ padding: "6px 14px", cursor: "pointer", borderRadius: active ? "6px 6px 0 0" : 6, background: active ? "#0f4ec8" : "transparent", color: active ? "#eef6ff" : "#9ab4d6", fontSize: 11, fontWeight: active ? 700 : 500 }),
    infoBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#101826", borderBottom: "1px solid #243360", color: "#8da4c6", fontSize: 11 },
    ribbon: { display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#1b243f,#111827)", borderBottom: "1px solid #263a62", flexShrink: 0, color: "#d8ebff" },
    ribbonTabs: { display: "flex", alignItems: "center", padding: "6px 10px", gap: 2, borderBottom: "1px solid #293959" },
    ribbonTab: (active) => ({ padding: "8px 18px", cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#ffffff" : "#a5b8d8", background: active ? "#0f4ec8" : "transparent", borderRadius: active ? "6px 6px 0 0" : 6 }),
    ribbonQuick: { display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" },
    ribbonContent: { display: "flex", gap: 2, padding: "8px 12px", overflowX: "auto", background: "linear-gradient(180deg, #1e2a47, #151f37)" },
    ribbonGroup: { display: "flex", flexDirection: "column", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, minWidth: 140, padding: "8px 6px", borderBottom: "2px solid #0f4ec8" },
    ribbonGroupLarge: { display: "flex", flexDirection: "column", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, minWidth: 180, padding: "8px 6px", borderBottom: "2px solid #0f4ec8" },
    ribbonGroupHeader: { fontSize: 9, color: "#6b8bb3", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    ribbonTools: { display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "flex-start" },
    ribbonToolsLarge: { display: "flex", gap: 4, justifyContent: "center" },
    ribbonButton: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", background: active ? "#0f4ec8" : "rgba(255,255,255,0.03)", border: active ? "1px solid #2971d5" : "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: active ? "#ffffff" : "#b1c3e0", cursor: "pointer", minHeight: 60, minWidth: 42, textAlign: "center", transition: "all 0.15s ease" }),
    ribbonButtonLarge: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: active ? "#0f4ec8" : "rgba(255,255,255,0.05)", border: active ? "1px solid #2971d5" : "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: active ? "#ffffff" : "#b1c3e0", cursor: "pointer", minHeight: 80, minWidth: 70, textAlign: "center", transition: "all 0.15s ease" }),
    ribbonButtonIcon: { width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 4, background: "rgba(255,255,255,0.08)" },
    ribbonButtonIconLarge: { width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 6, background: "rgba(255,255,255,0.1)" },
    workspace: { display: "flex", flex: 1, overflow: "hidden", position: "relative" },
    viewport: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
    viewportOverlay: { position: "absolute", right: 14, top: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 },
    overlayButton: { width: 42, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,24,56,0.85)", color: "#dbe8ff", display: "grid", placeItems: "center", cursor: "pointer" },
    rightPanel: { width: 280, background: "#101826", borderLeft: "1px solid #1f2d53", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
    cmdBar: { background: "#0e1728", borderTop: "1px solid #213458", padding: "8px 10px", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 },
    cmdLabel: { fontSize: 11, color: "#78a1d1", minWidth: 70 },
    cmdInput: { background: "#14203b", border: "1px solid #2f476f", borderRadius: 4, color: "#e4f2ff", fontSize: 12, padding: "8px 12px", flex: 1, outline: "none" },
    statusBar: { display: "flex", alignItems: "center", background: "#0a1322", borderTop: "1px solid #23335f", minHeight: 30, padding: "0 10px", gap: 16, fontSize: 11, color: "#7f9dc7", flexShrink: 0 },
    statusLeft: { display: "flex", alignItems: "center", gap: 10 },
    statusGroup: { display: "flex", alignItems: "center", gap: 8 },
    statusTag: (active) => ({ padding: "4px 8px", borderRadius: 5, border: active ? "1px solid #3f7eea" : "1px solid #23355c", background: active ? "rgba(63,126,234,0.18)" : "#101826", color: active ? "#e8f5ff" : "#8da4c6", fontSize: 10, cursor: "pointer" }),
    layoutTabs: { display: "flex", alignItems: "center", gap: 4 },
    layoutTab: (active) => ({ padding: "4px 9px", borderRadius: 4, background: active ? "#0f4ec8" : "#121a30", color: active ? "#eef6ff" : "#9cb5df", fontSize: 11, cursor: "pointer" }),
    statusAccent: { color: "#8ec9ff", fontFamily: "'Courier New', monospace", fontSize: 10 },
    toolBtn: (active, tid) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 8px", background: active ? "#0f4ec8" : "#121d36", border: active ? `1px solid #2971d5` : "1px solid #1f2c4f", borderRadius: 6, cursor: "pointer", color: active ? "#ffffff" : "#b0c1dc", minWidth: 64, minHeight: 76, textAlign: "center" }),
    panelHeader: { padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#8ec7ff", background: "#101822", borderBottom: "1px solid #253356" },
  };

  const viewportTabs = [
    { id: "2d", label: "2D Drafting" },
    { id: "3d", label: "3D Model" },
  ];

  const toolbarGroups = [
    { label: "Draw", tools: ["line", "polyline", "rectangle", "circle", "arc", "ellipse", "spline", "text", "dimension"] },
    { label: "Modify", tools: ["select", "move", "copy", "rotate", "scale", "erase"] },
    { label: "View", tools: ["pan", "zoom"] },
  ];

  const RIBBON_TABS = ["File", "Home", "Insert", "Annotate", "Modify", "View", "Manage", "Output"];
  const RIBBON_GROUPS = {
    File: [
      { label: "New", tools: ["new"], large: true },
      { label: "Open", tools: ["open"], large: true },
      { label: "Save", tools: ["save"], large: true },
      { label: "Export", tools: ["export", "print"] },
    ],
    Home: [
      { label: "Draw", tools: ["line", "polyline", "rectangle", "circle", "arc"] },
      { label: "Modify", tools: ["move", "copy", "rotate", "scale", "mirror"] },
      { label: "Layers", tools: ["layer", "properties"] },
      { label: "Block", tools: ["block", "insert"] },
      { label: "Utilities", tools: ["measure", "calculator"] },
    ],
    Insert: [
      { label: "Block", tools: ["insert", "block", "wblock"] },
      { label: "Reference", tools: ["attach", "clip", "adjust"] },
      { label: "Import", tools: ["import", "pdf", "image"] },
    ],
    Annotate: [
      { label: "Text", tools: ["text", "mtext", "style"] },
      { label: "Dimensions", tools: ["dimension", "linear", "angular", "radius"] },
      { label: "Leaders", tools: ["leader", "qleader", "mleader"] },
      { label: "Tables", tools: ["table", "tablestyle"] },
    ],
    Modify: [
      { label: "Modify", tools: ["erase", "copy", "mirror", "offset", "array"] },
      { label: "Transform", tools: ["move", "rotate", "scale", "stretch"] },
      { label: "Edit", tools: ["trim", "extend", "break", "join", "fillet", "chamfer"] },
    ],
    View: [
      { label: "Navigate", tools: ["pan", "zoom", "orbit", "walk"] },
      { label: "Views", tools: ["top", "front", "right", "iso"] },
      { label: "Visual Styles", tools: ["wireframe", "hidden", "realistic", "shaded"] },
      { label: "Show", tools: ["grid", "snap", "ortho", "polar"] },
    ],
    Manage: [
      { label: "CAD Standards", tools: ["standards", "check", "configure"] },
      { label: "Customization", tools: ["cui", "options", "settings"] },
    ],
    Output: [
      { label: "Plot", tools: ["plot", "preview", "batch"] },
      { label: "Export", tools: ["export", "pdf", "dwf", "image"] },
      { label: "Publish", tools: ["publish", "transmit", "etransmit"] },
    ],
  };

  return (
    <div style={S.app}>
      <div style={S.menuBar}>
        <div style={S.appTitle}>
          <button style={S.appButton} title="Application menu">A</button>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: 11 }}>AutoCAD UI</span>
            <span style={{ fontSize: 9, color: "#92b7ff" }}>3DCAD Studio</span>
          </div>
          <div style={S.quickAccess}>
            <button style={S.quickButton(false)} title="Save">💾</button>
            <button style={S.quickButton(false)} title="Undo">↶</button>
            <button style={S.quickButton(false)} title="Redo">↷</button>
            <button style={S.quickButton(false)} title="New">✚</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={undo} style={{ background: "transparent", border: "1px solid #22345a", color: "#a2bbdb", borderRadius: 4, fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>Undo</button>
          <button onClick={redo} style={{ background: "transparent", border: "1px solid #22345a", color: "#a2bbdb", borderRadius: 4, fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>Redo</button>
          <button onClick={() => navigate("/projects")} style={{ background: "#0f4ec8", border: "1px solid #2a5fd3", color: "#fff", borderRadius: 4, fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>Projects</button>
        </div>
      </div>

      <div style={S.fileTabs}>
        {[
          { id: 'start', label: 'Start' },
          { id: 'drawing', label: activeFileTab },
          { id: 'sheet1', label: 'Sheet1' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveFileTab(tab.label)} style={S.fileTab(activeFileTab === tab.label)}>{tab.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: "#8da8cf", fontSize: 11 }}>File tabs</span>
      </div>

      <div style={S.workspaceTabs}>
        {viewportTabs.map(tab => (
          <button key={tab.id} onClick={() => setViewport(tab.id)} style={S.workspaceTab(viewport === tab.id)}>{tab.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: "#8da8cf", fontSize: 11 }}>Workspace: {viewport === "2d" ? "Drafting & Annotation" : "3D Modeling"}</span>
      </div>

      <div style={S.infoBar}>
        <span>{activeFileTab} — {project?.name || 'Untitled'}</span>
        <span>{statusInfo}</span>
        <span>{viewport === '2d' ? `UCS: ${ucsIcon ? 'On' : 'Off'}` : `Objects: ${entities3D.length}`}</span>
      </div>

      {showRibbon && (viewport === "2d" || viewport === "3d") && (
        <div style={S.ribbon}>
          <div style={S.ribbonTabs}>
            {RIBBON_TABS.map(tab => (
              <div key={tab} style={S.ribbonTab(activeRibbonTab === tab)} onClick={() => setActiveRibbonTab(tab)}>{tab}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={S.ribbonQuick}>
              <button onClick={() => setSnapEnabled(s => !s)} style={S.quickButton(snapEnabled)} title="Object Snap">SNAP</button>
              <button onClick={() => setGridEnabled(g => !g)} style={S.quickButton(gridEnabled)} title="Grid Display">GRID</button>
              <button onClick={() => setOrthoMode(o => !o)} style={S.quickButton(orthoMode)} title="Ortho Mode">ORTHO</button>
              <button onClick={() => setDynamicInput(d => !d)} style={S.quickButton(dynamicInput)} title="Dynamic Input">DYN</button>
            </div>
          </div>
          <div style={S.ribbonContent}>
            {(RIBBON_GROUPS[activeRibbonTab] || RIBBON_GROUPS.Home).map(group => (
              <div key={group.label} style={group.large ? S.ribbonGroupLarge : S.ribbonGroup}>
                <div style={S.ribbonGroupHeader}>
                  <span>{group.label}</span>
                  <Icon d="M19 9l-7 7-7-7" size={12} color="#6b8bb3" />
                </div>
                <div style={group.large ? S.ribbonToolsLarge : S.ribbonTools}>
                  {group.tools.map(tid => {
                    const tool = TOOLS.find(t => t.id === tid);
                    const isCommandAction = typeof commandActions?.[tid] === 'function';
                    const active = activeTool === tid;
                    const isLarge = group.large || ['new', 'open', 'save'].includes(tid);
                    return (
                      <button
                        key={tid}
                        onClick={() => isCommandAction ? commandActions[tid]() : setActiveTool(tid)}
                        title={tool?.label || tid.charAt(0).toUpperCase() + tid.slice(1)}
                        style={isLarge ? S.ribbonButtonLarge(active) : S.ribbonButton(active)}
                      >
                        <div style={isLarge ? S.ribbonButtonIconLarge : S.ribbonButtonIcon}>
                          {tool?.icon ? (
                            <Icon d={tool.icon} size={isLarge ? 24 : 16} color={active ? "#ffffff" : "#aac2ff"} />
                          ) : (
                            <span style={{ fontSize: isLarge ? 20 : 14, fontWeight: 'bold' }}>
                              {tid === 'new' ? '📄' : tid === 'open' ? '📂' : tid === 'save' ? '💾' : 
                               tid === 'export' ? '📤' : tid === 'print' ? '🖨️' : tid === 'layer' ? '📋' : 
                               tid === 'properties' ? '⚙️' : tid === 'block' ? '🧩' : tid === 'insert' ? '➕' :
                               tid === 'measure' ? '📏' : tid === 'calculator' ? '🧮' : tid.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: isLarge ? 11 : 9, 
                          color: active ? "#ffffff" : "#b5c6e3", 
                          lineHeight: 1.2,
                          textAlign: 'center',
                          fontWeight: isLarge ? 600 : 400
                        }}>
                          {tool?.label || tid.charAt(0).toUpperCase() + tid.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={S.workspace}>
        <div style={S.viewport}>
          {viewport === "2d" && (
            <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{ width: "100%", height: "100%", display: "block", cursor: activeTool === "pan" ? "grab" : "crosshair" }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
              />
              <div style={S.viewportOverlay}>
                <button style={S.overlayButton} title="View Cube">🧭</button>
                <button style={S.overlayButton} title="Navigation Bar">⎋</button>
              </div>
            </div>
          )}
          {viewport === "3d" && (
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 55 }} style={{ background: "#060b16" }}>
              <Suspense fallback={null}>
                <Scene3D
                  objects={entities3D}
                  selectedId={selectedId3D}
                  onSelect={setSelectedId3D}
                  onObjectUpdate={update3DObject}
                  transformMode={sceneTransformMode}
                />
              </Suspense>
            </Canvas>
          )}
        </div>
        <div style={S.rightPanel}>
          <div style={S.panelHeader}>Properties</div>
          <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
            {viewport === "2d" ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Layer</div>
                  <select value={currentLayer} onChange={e => setCurrentLayer(e.target.value)} style={{ width: "100%", background: "#1a2035", color: "#a0aec0", border: "1px solid #2a3248", borderRadius: 3, padding: "5px" }}>
                    {layers.map(layer => <option key={layer.id} value={layer.name}>{layer.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", color: "#4fc3f7", marginBottom: 4 }}>Line Color</label>
                  <input type="color" value={lineColor} onChange={e => setLineColor(e.target.value)} style={{ width: "100%", height: 34, border: "1px solid #2a3248", borderRadius: 4, background: "transparent" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>Line Weight</div>
                  <input type="range" min={0.5} max={6} step={0.5} value={lineWeight} onChange={e => setLineWeight(+e.target.value)} style={{ width: "100%" }} />
                  <div style={{ fontSize: 11, marginTop: 4, color: "#9bb7d5" }}>{lineWeight}px</div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1e2d4a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 11, color: "#8aa" }}>Entities</span><span style={{ color: "#4fc3f7" }}>{entities2D.length}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 11, color: "#8aa" }}>Selection</span><span style={{ color: "#4fc3f7" }}>{selectedIds.length}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "#8aa" }}>Zoom</span><span style={{ color: "#4fc3f7" }}>{(zoom * 100).toFixed(0)}%</span></div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4fc3f7", marginBottom: 4 }}>3D Transform</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {['translate','rotate','scale'].map(mode => (
                      <button key={mode} onClick={() => setActiveTool(mode)} style={{ flex: 1, padding: '6px', borderRadius: 4, border: activeTool === mode ? '1px solid #4fc3f7' : '1px solid #2a3248', background: activeTool === mode ? '#1a2545' : 'transparent', color: activeTool === mode ? '#4fc3f7' : '#8090aa', cursor: 'pointer' }}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <button onClick={() => {
                    const next = [...entities3D, { id: nextId(), type: 'box', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#4fc3f7' }];
                    setEntities3D(next); logCommand('Added 3D box');
                  }} style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #2a3248', background: '#141d2e', color: '#9ccfff', cursor: 'pointer' }}>Add 3D Box</button>
                </div>
                <div>
                  <button onClick={() => {
                    const next = [...entities3D, { id: nextId(), type: 'sphere', position: { x: 0, y: 0.75, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#ffcc66', radius: 0.75 }];
                    setEntities3D(next); logCommand('Added 3D sphere');
                  }} style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #2a3248', background: '#141d2e', color: '#f6c17e', cursor: 'pointer' }}>Add 3D Sphere</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={S.cmdBar}>
        <span style={S.cmdLabel}>Command:</span>
        <input style={S.cmdInput} value={commandInput} onChange={e => setCommandInput(e.target.value)} onKeyDown={handleCommand} placeholder="Type a command or press Enter" autoComplete="off" spellCheck="false" />
      </div>

      <div style={S.statusBar}>
        <div style={S.statusLeft}>
          <span style={S.statusAccent}>{viewport === "2d" ? `X: ${worldCursor.x.toFixed(2)} Y: ${worldCursor.y.toFixed(2)}` : `3D objects: ${entities3D.length}`}</span>
          <span style={S.statusAccent}>Tool: {activeTool.toUpperCase()}</span>
          <span style={S.statusAccent}>Zoom: {(zoom * 100).toFixed(0)}%</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={S.statusGroup}>
          {['Snap', 'Grid', 'Ortho', 'Dyn'].map((name, index) => {
            const active = name === 'Snap' ? snapEnabled : name === 'Grid' ? gridEnabled : name === 'Ortho' ? orthoMode : dynamicInput;
            return <span key={name} style={S.statusTag(active)}>{name}</span>;
          })}
        </div>
        <div style={S.layoutTabs}>
          {['Model', 'Layout1', 'Layout2'].map(name => (
            <button key={name} onClick={() => setLayoutTab(name)} style={S.layoutTab(layoutTab === name)}>{name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
