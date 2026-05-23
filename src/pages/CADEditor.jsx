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
        if (activeTool === "move") {
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
        }
        if (activeTool === "copy") {
          return ent; // copy handled at start of transform
        }
        if (activeTool === "rotate") {
          const angle = Math.atan2(wp.y - ent.cy, wp.x - ent.cx) - Math.atan2(transformStart.y - ent.cy, transformStart.x - ent.cx);
          if (ent.type === "line" || ent.type === "dimension") {
            const rotatePoint = (x, y) => {
              const dx = x - ent.cx; const dy = y - ent.cy;
              return { x: ent.cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: ent.cy + dx * Math.sin(angle) + dy * Math.cos(angle) };
            };
            const a = rotatePoint(ent.x1, ent.y1); const b = rotatePoint(ent.x2, ent.y2);
            return { ...ent, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          }
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
    line: () => setActiveTool("line"),
    circle: () => setActiveTool("circle"),
    rect: () => setActiveTool("rectangle"),
    rectangle: () => setActiveTool("rectangle"),
    polyline: () => setActiveTool("polyline"),
    spline: () => setActiveTool("spline"),
    arc: () => setActiveTool("arc"),
    ellipse: () => setActiveTool("ellipse"),
    text: () => setActiveTool("text"),
    dimension: () => setActiveTool("dimension"),
    erase: () => setActiveTool("erase"),
    move: () => setActiveTool("move"),
    copy: () => setActiveTool("copy"),
    rotate: () => setActiveTool("rotate"),
    scale: () => setActiveTool("scale"),
    zoom: () => { setZoom(1); setPan({ x: canvasSize.w / 2, y: canvasSize.h / 2 }); },
    pan: () => setActiveTool("pan"),
    undo: undo,
    redo: redo,
    save: () => { saveProjectData(session.id, id, { entities_2d: entities2D, entities_3d: entities3D }); logCommand("Saved project"); },
    export: () => {
      const dxf = exportToDXF(entities2D);
      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${project?.name || 'drawing'}.dxf`; a.click();
      logCommand("Exported DXF");
    }
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = commandInput.trim().toLowerCase();
    setCommandInput("");
    logCommand(`> ${cmd}`);
    if (commandActions[cmd]) commandActions[cmd](); else logCommand(`Unknown command: ${cmd}`);
  };

  const S = {
    app: { display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#0d1117", color: "#c9d1d9", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" },
    menuBar: { display: "flex", alignItems: "center", background: "#1a2035", borderBottom: "1px solid #2a3248", height: 28, paddingLeft: 8, gap: 2, fontSize: 12, flexShrink: 0 },
    ribbon: { display: "flex", flexDirection: "column", background: "#1c2540", borderBottom: "1px solid #1e2d4a", flexShrink: 0 },
    ribbonTabs: { display: "flex", borderBottom: "1px solid #1e2d4a", paddingLeft: 4 },
    ribbonTab: (active) => ({ padding: "5px 16px", cursor: "pointer", fontSize: 11.5, fontWeight: active ? 600 : 400, color: active ? "#4fc3f7" : "#7a8ba0", borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent" }),
    ribbonItems: { display: "flex", flexWrap: "wrap", gap: 4, padding: "4px 8px" },
    workspace: { display: "flex", flex: 1, overflow: "hidden" },
    viewport: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    canvas: { flex: 1, display: "block" },
    rightPanel: { width: 260, background: "#111827", borderLeft: "1px solid #1e2d4a", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
    cmdBar: { background: "#0d1117", borderTop: "1px solid #1e2d4a", padding: "4px 8px", display: "flex", gap: 8, flexShrink: 0 },
    cmdInput: { background: "#1a2035", border: "1px solid #2a3248", borderRadius: 3, color: "#e2e8f0", fontSize: 12, padding: "3px 8px", flex: 1, outline: "none" },
    statusBar: { display: "flex", alignItems: "center", background: "#0a0f1a", borderTop: "1px solid #1e2d4a", height: 24, paddingLeft: 8, gap: 16, fontSize: 11, color: "#5a6a7a", flexShrink: 0 },
    toolBtn: (active, tid) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: active ? "#1a2545" : "transparent", border: active ? `1px solid ${TOOL_GROUPS[TOOLS.find(t => t.id===tid)?.group]?.color || '#4fc3f7'}` : "1px solid #2a3248", borderRadius: 5, cursor: "pointer", color: active ? "#4fc3f7" : "#8090aa", gap: 2, minWidth: 42 }),
    panelHeader: { padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#4fc3f7", background: "#0d1421", borderBottom: "1px solid #1e2d4a" },
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

  return (
    <div style={S.app}>
      <div style={S.menuBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="#4fc3f7" strokeWidth="1.5" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <span>3DCAD Studio</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/projects")} style={{ background: "#1a2545", border: "1px solid #2a3248", color: "#4fc3f7", borderRadius: 3, fontSize: 11, padding: "2px 10px", cursor: "pointer" }}>← Projects</button>
      </div>

      <div style={{ display: "flex", background: "#1a2035", borderBottom: "1px solid #2a3248", height: 28, paddingLeft: 8, gap: 2 }}>
        {viewportTabs.map(tab => (
          <button key={tab.id} onClick={() => setViewport(tab.id)} style={{ background: viewport === tab.id ? "#2a3248" : "transparent", border: "none", color: viewport === tab.id ? "#4fc3f7" : "#7a8ba0", fontSize: 11, padding: "4px 12px", cursor: "pointer", borderBottom: viewport === tab.id ? "2px solid #4fc3f7" : "none" }}>{tab.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={{ background: "transparent", border: "none", color: "#7a8ba0", cursor: "pointer", padding: 4 }}>↩</button>
        <button onClick={redo} style={{ background: "transparent", border: "none", color: "#7a8ba0", cursor: "pointer", padding: 4 }}>↪</button>
      </div>

      {showRibbon && viewport === "2d" && (
        <div style={S.ribbon}>
          <div style={S.ribbonTabs}>
            {[["Home", "Home"], ["View", "View"], ["Annotate", "Annotate"]].map(([tab]) => (
              <div key={tab} style={S.ribbonTab(activeRibbonTab === tab)} onClick={() => setActiveRibbonTab(tab)}>{tab}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 4, paddingRight: 8 }}>
              <button onClick={() => setSnapEnabled(s => !s)} style={{ background: snapEnabled ? "#1a2545" : "transparent", border: snapEnabled ? "1px solid #4fc3f7" : "1px solid #2a3248", color: snapEnabled ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>SNAP</button>
              <button onClick={() => setGridEnabled(g => !g)} style={{ background: gridEnabled ? "#1a2545" : "transparent", border: gridEnabled ? "1px solid #4fc3f7" : "1px solid #2a3248", color: gridEnabled ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>GRID</button>
              <button onClick={() => setOrthoMode(o => !o)} style={{ background: orthoMode ? "#1a2545" : "transparent", border: orthoMode ? "1px solid #4fc3f7" : "1px solid #2a3248", color: orthoMode ? "#4fc3f7" : "#7a8ba0", borderRadius: 3, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>ORTHO</button>
            </div>
          </div>
          <div style={S.ribbonItems}>
            {toolbarGroups.map(group => (
              <div key={group.label} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {group.tools.map(tid => {
                  const tool = TOOLS.find(t => t.id === tid);
                  return (
                    <button key={tid} onClick={() => setActiveTool(tid)} title={tool?.label} style={S.toolBtn(activeTool === tid, tid)}>
                      <Icon d={tool?.icon} size={14} color={activeTool === tid ? TOOL_GROUPS[tool.group]?.color : "#8090aa"} />
                      <span style={{ fontSize: 7, color: activeTool === tid ? "#cdefff" : "#8090aa" }}>{tool?.label}</span>
                    </button>
                  );
                })}
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
            </div>
          )}
          {viewport === "3d" && (
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 55 }} style={{ background: "#060b16" }}>
              <Suspense fallback={null}>
                <Scene3D objects={entities3D} selectedId={selectedId3D} onSelect={setSelectedId3D} transformMode={activeTool === "rotate" ? "rotate" : activeTool === "scale" ? "scale" : "translate"} />
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
        <span style={{ fontSize: 11, color: "#3a4a5a" }}>Command:</span>
        <input style={S.cmdInput} value={commandInput} onChange={e => setCommandInput(e.target.value)} onKeyDown={handleCommand} placeholder="line, circle, rect, erase, move, copy, rotate, scale, export, undo" autoComplete="off" spellCheck="false" />
      </div>

      <div style={S.statusBar}>
        <span style={{ color: "#4fc3f7", fontFamily: "'Courier New', monospace", fontSize: 10 }}>{viewport === "2d" ? `X: ${worldCursor.x.toFixed(2)}  Y: ${worldCursor.y.toFixed(2)}` : `3D objects: ${entities3D.length}`}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#3a4a5a" }}>Tool: <span style={{ color: "#4fc3f7" }}>{activeTool.toUpperCase()}</span></span>
        <span style={{ color: "#3a4a5a" }}>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
