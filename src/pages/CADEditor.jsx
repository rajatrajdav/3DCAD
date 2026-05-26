import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── Tiny SVG icon ──────────────────────────────────────────────────────────
const Ic = ({ d, s = 14, c = "currentColor", f = "none", sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke={c} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const GRID = 20;

const LAYERS_DEF = [
  { id: 1, name: "0",           color: "#ffffff", visible: true, locked: false, frozen: false, children: [] },
  { id: 2, name: "Dimensions",  color: "#ff4444", visible: true, locked: false, frozen: false, children: [] },
  { id: 3, name: "Hatch",       color: "#00ccff", visible: true, locked: false, frozen: false, children: [] },
  { id: 4, name: "Text",        color: "#ffff00", visible: true, locked: false, frozen: false, children: [] },
  { id: 5, name: "Walls",       color: "#ff9933", visible: true, locked: false, frozen: false, children: [] },
  { id: 6, name: "Furniture",   color: "#33cc66", visible: true, locked: false, frozen: false, children: [] },
];

const mkNode = (id, name, type, parentId = null) => ({ id, name, type, parentId, children: [], visible: true, locked: false, selectable: true });

// ── ASSET LIBRARY ──────────────────────────────────────────────────────────
const ASSET_LIBRARY = {
  Furniture: [
    { id: "chair",    label: "Chair",    color: "#8B4513", shape: "box3d",      w: 40, h: 80, d: 40 },
    { id: "bed",      label: "Bed",      color: "#6A5ACD", shape: "box3d",      w: 100,h: 50, d: 180},
    { id: "table",    label: "Table",    color: "#DEB887", shape: "box3d",      w: 120,h: 75, d: 80 },
    { id: "sofa",     label: "Sofa",     color: "#708090", shape: "box3d",      w: 180,h: 70, d: 80 },
    { id: "desk",     label: "Desk",     color: "#D2B48C", shape: "box3d",      w: 140,h: 75, d: 70 },
    { id: "lamp",     label: "Lamp",     color: "#FFD700", shape: "cylinder3d", r: 8,  h: 120 },
    { id: "wardrobe", label: "Wardrobe", color: "#8B6914", shape: "box3d",      w: 100,h: 200,d: 55 },
    { id: "shelf",    label: "Shelf",    color: "#A0522D", shape: "box3d",      w: 100,h: 20, d: 30 },
  ],
  Architecture: [
    { id: "wall",     label: "Wall",     color: "#D3D3D3", shape: "box3d",      w: 200,h: 250,d: 20 },
    { id: "door",     label: "Door",     color: "#8B4513", shape: "box3d",      w: 90, h: 210,d: 10 },
    { id: "window",   label: "Window",   color: "#87CEEB", shape: "box3d",      w: 100,h: 120,d: 8  },
    { id: "stairs",   label: "Stairs",   color: "#C0C0C0", shape: "box3d",      w: 100,h: 30, d: 200},
    { id: "column",   label: "Column",   color: "#E8E8E8", shape: "cylinder3d", r: 20, h: 250 },
    { id: "floor",    label: "Floor",    color: "#8B6914", shape: "box3d",      w: 400,h: 10, d: 400},
    { id: "roof",     label: "Roof",     color: "#8B3A3A", shape: "pyramid3d",  base:400, h: 150 },
  ],
  Nature: [
    { id: "tree",     label: "Tree",     color: "#228B22", shape: "cone3d",     r: 50, h: 150 },
    { id: "trunk",    label: "Trunk",    color: "#8B4513", shape: "cylinder3d", r: 12, h: 80  },
    { id: "bush",     label: "Bush",     color: "#3CB371", shape: "sphere3d",   r: 40  },
    { id: "rock",     label: "Rock",     color: "#808080", shape: "sphere3d",   r: 30  },
  ],
  Vehicles: [
    { id: "car_body", label: "Car Body", color: "#CC3333", shape: "box3d",      w: 180,h: 60, d: 80 },
    { id: "wheel",    label: "Wheel",    color: "#222222", shape: "torus3d",    r: 30, tube: 10 },
  ],
  Characters: [
    { id: "head",     label: "Head",     color: "#FDBCB4", shape: "sphere3d",   r: 30  },
    { id: "torso",    label: "Torso",    color: "#4169E1", shape: "box3d",      w: 60, h: 90, d: 35 },
    { id: "arm",      label: "Arm",      color: "#4169E1", shape: "cylinder3d", r: 10, h: 80  },
    { id: "leg",      label: "Leg",      color: "#1E3A8A", shape: "cylinder3d", r: 12, h: 90  },
  ],
};

// ── MATERIAL PRESETS ───────────────────────────────────────────────────────
const MATERIALS = {
  Default:  { color: "#4488cc", roughness: 0.5, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Wood:     { color: "#8B5E3C", roughness: 0.8, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Metal:    { color: "#A8A9AD", roughness: 0.2, metalness: 1.0, opacity: 1.0, emissive: "#111111" },
  Glass:    { color: "#87CEEB", roughness: 0.0, metalness: 0.0, opacity: 0.3, emissive: "#000000" },
  Concrete: { color: "#8A8A8A", roughness: 0.9, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Fabric:   { color: "#6A5ACD", roughness: 1.0, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Marble:   { color: "#F5F5DC", roughness: 0.1, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Gold:     { color: "#FFD700", roughness: 0.1, metalness: 1.0, opacity: 1.0, emissive: "#332200" },
  Plastic:  { color: "#FF6B6B", roughness: 0.4, metalness: 0.0, opacity: 1.0, emissive: "#000000" },
  Brick:    { color: "#B22222", roughness: 0.95, metalness: 0.0, opacity: 1.0, emissive: "#000000"},
};

// ── LIGHT TYPES ────────────────────────────────────────────────────────────
const LIGHT_TYPES = ["point", "spot", "directional", "sun", "ambient"];

// ── 3D OBJECT DEFAULTS ─────────────────────────────────────────────────────
const OBJ3D_DEFAULTS = {
  box3d:        { w: 60,  h: 60,   d: 60,   color: "#4488cc" },
  sphere3d:     { r: 40,           color: "#cc4444" },
  cylinder3d:   { r: 30,  h: 80,   color: "#44cc88" },
  cone3d:       { r: 40,  h: 80,   color: "#ccaa44" },
  torus3d:      { r: 40,  tube: 12, color: "#cc44cc" },
  wedge3d:      { w: 60,  h: 50,   d: 60,   color: "#44cccc" },
  pyramid3d:    { base: 60, h: 80,  color: "#cc8844" },
  plane3d:      { w: 100, h: 100,  color: "#888888" },
  capsule3d:    { r: 20,  h: 80,   color: "#ff8844" },
};

// ── Math helpers ───────────────────────────────────────────────────────────
const snapG = (pt, size = GRID) => ({ x: Math.round(pt.x / size) * size, y: Math.round(pt.y / size) * size });
const ortho = (a, b, on) => {
  if (!on) return b;
  const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
  return dx >= dy ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
};
function hitTest2D(e, pt, tol) {
  if (e.type === "line") {
    const { x1, y1, x2, y2 } = e, L = Math.hypot(x2 - x1, y2 - y1);
    if (L < .01) return false;
    const t = Math.max(0, Math.min(1, ((pt.x - x1) * (x2 - x1) + (pt.y - y1) * (y2 - y1)) / (L * L)));
    return Math.hypot(pt.x - (x1 + t * (x2 - x1)), pt.y - (y1 + t * (y2 - y1))) < tol;
  }
  if (e.type === "circle") return Math.abs(Math.hypot(pt.x - e.cx, pt.y - e.cy) - e.r) < tol;
  if (e.type === "rect") {
    const x0 = Math.min(e.x1, e.x2), x1 = Math.max(e.x1, e.x2), y0 = Math.min(e.y1, e.y2), y1 = Math.max(e.y1, e.y2);
    const nearEdge = (Math.abs(pt.x - x0) < tol || Math.abs(pt.x - x1) < tol) && pt.y >= y0 - tol && pt.y <= y1 + tol;
    const nearEdge2 = (Math.abs(pt.y - y0) < tol || Math.abs(pt.y - y1) < tol) && pt.x >= x0 - tol && pt.x <= x1 + tol;
    return nearEdge || nearEdge2;
  }
  return false;
}

// ── 3D Projection helper ───────────────────────────────────────────────────
function project3D(x, y, z, camAngle, camPitch, camDist, W, H) {
  const ca = Math.cos(camAngle), sa = Math.sin(camAngle);
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  const rx = x * ca - z * sa;
  const ry = x * sa + z * ca;
  const rz = y * cp - ry * sp;
  const ry2 = y * sp + ry * cp;
  const fov = camDist;
  const pz = ry2 + fov;
  if (pz <= 0) return { x: W / 2, y: H / 2, z: -1, scale: 0 };
  const scale = fov / pz;
  return { x: W / 2 + rx * scale, y: H / 2 - rz * scale, z: pz, scale };
}

// ── Draw Transform Gizmo on Canvas ────────────────────────────────────────
function drawTransformGizmo(ctx, obj, camAngle, camPitch, camDist, W, H, transformMode, hoveredGizmoAxis) {
  const cx = obj.x, cy = obj.y || 0, cz = obj.z;
  const center = project3D(cx, cy, cz, camAngle, camPitch, camDist, W, H);
  if (center.z < 0) return;

  const AXIS_LEN = 70;
  const axes = [
    { key: "x", dx: AXIS_LEN, dy: 0, dz: 0, color: "#ff4444", hoverColor: "#ff8888", label: "X" },
    { key: "y", dx: 0, dy: -AXIS_LEN, dz: 0, color: "#44dd44", hoverColor: "#88ff88", label: "Y" },
    { key: "z", dx: 0, dy: 0, dz: AXIS_LEN, color: "#4488ff", hoverColor: "#88aaff", label: "Z" },
  ];

  ctx.save();

  if (transformMode === "move" || transformMode === "scale") {
    axes.forEach(ax => {
      const tip = project3D(cx + ax.dx * 0.4, cy + ax.dy * 0.4, cz + ax.dz * 0.4, camAngle, camPitch, camDist, W, H);
      if (tip.z < 0) return;
      const isHovered = hoveredGizmoAxis === ax.key;
      const col = isHovered ? ax.hoverColor : ax.color;

      ctx.strokeStyle = col;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      if (transformMode === "move") {
        // Arrow head
        const angle = Math.atan2(tip.y - center.y, tip.x - center.x);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x - 10 * Math.cos(angle - 0.4), tip.y - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(tip.x - 10 * Math.cos(angle + 0.4), tip.y - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      } else {
        // Scale box
        ctx.fillStyle = col;
        ctx.fillRect(tip.x - 5, tip.y - 5, 10, 10);
      }

      // Label
      ctx.fillStyle = col;
      ctx.font = "bold 11px monospace";
      ctx.fillText(ax.label, tip.x + 4, tip.y - 4);
    });

    // Center dot
    ctx.fillStyle = isHovered => "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(center.x, center.y, hoveredGizmoAxis === "center" ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 1;
    ctx.stroke();

  } else if (transformMode === "rotate") {
    // Draw rotation rings
    const ringAxes = [
      { key: "x", color: "#ff4444", hoverColor: "#ff8888", angle1: 0, angle2: 1 },
      { key: "y", color: "#44dd44", hoverColor: "#88ff88", angle1: 1, angle2: 0 },
      { key: "z", color: "#4488ff", hoverColor: "#88aaff", angle1: 0.5, angle2: 0.5 },
    ];

    const R = 50 * center.scale * 0.6;
    ringAxes.forEach((ax, i) => {
      const isHovered = hoveredGizmoAxis === ax.key;
      ctx.strokeStyle = isHovered ? ax.hoverColor : ax.color;
      ctx.lineWidth = isHovered ? 3 : 1.5;
      ctx.beginPath();
      if (i === 0) ctx.ellipse(center.x, center.y, R * 0.3, R, 0, 0, Math.PI * 2);
      else if (i === 1) ctx.ellipse(center.x, center.y, R, R * 0.3, 0, 0, Math.PI * 2);
      else ctx.ellipse(center.x, center.y, R, R, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  ctx.restore();
}

// ── Hit test gizmo axes ────────────────────────────────────────────────────
function hitTestGizmo(mx, my, obj, camAngle, camPitch, camDist, W, H, transformMode) {
  if (!obj) return null;
  const cx = obj.x, cy = obj.y || 0, cz = obj.z;
  const center = project3D(cx, cy, cz, camAngle, camPitch, camDist, W, H);
  if (center.z < 0) return null;

  const AXIS_LEN = 70;
  const axes = [
    { key: "x", dx: AXIS_LEN, dy: 0, dz: 0 },
    { key: "y", dx: 0, dy: -AXIS_LEN, dz: 0 },
    { key: "z", dx: 0, dy: 0, dz: AXIS_LEN },
  ];

  // Center hit
  if (Math.hypot(mx - center.x, my - center.y) < 10) return "center";

  if (transformMode === "rotate") {
    const R = 50 * center.scale * 0.6;
    // Check ring hit (approximate)
    const dist = Math.hypot(mx - center.x, my - center.y);
    if (Math.abs(dist - R) < 8) {
      const angle = Math.atan2(my - center.y, mx - center.x);
      if (angle > -0.5 && angle < 0.5) return "x";
      if (angle > 1.0 && angle < 2.1) return "y";
      return "z";
    }
    return null;
  }

  for (const ax of axes) {
    const tip = project3D(cx + ax.dx * 0.4, cy + ax.dy * 0.4, cz + ax.dz * 0.4, camAngle, camPitch, camDist, W, H);
    if (tip.z < 0) continue;
    // Line segment hit
    const L = Math.hypot(tip.x - center.x, tip.y - center.y);
    if (L < 0.1) continue;
    const t = Math.max(0, Math.min(1, ((mx - center.x) * (tip.x - center.x) + (my - center.y) * (tip.y - center.y)) / (L * L)));
    const nearX = center.x + t * (tip.x - center.x);
    const nearY = center.y + t * (tip.y - center.y);
    if (Math.hypot(mx - nearX, my - nearY) < 8) return ax.key;
  }
  return null;
}

// ── 3D Renderer ────────────────────────────────────────────────────────────
function draw3DScene(ctx, W, H, objects3d, lights, camAngle, camPitch, camDist, selIds, visualStyle, envSettings, showGrid, showAxes, editMode) {
  if (envSettings.skybox === "sunset") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a0533"); grad.addColorStop(0.5, "#c0392b"); grad.addColorStop(1, "#e67e22");
    ctx.fillStyle = grad;
  } else if (envSettings.skybox === "day") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a90e8"); grad.addColorStop(1, "#d4f1f4");
    ctx.fillStyle = grad;
  } else if (envSettings.skybox === "night") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#000010"); grad.addColorStop(1, "#0a0a2a");
    ctx.fillStyle = grad;
  } else if (visualStyle === "wireframe") {
    ctx.fillStyle = "#0a0a0a";
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a2030"); grad.addColorStop(1, "#0d1020");
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, W, H);

  if (envSettings.skybox === "night") {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5) % W, sy = (i * 97.3) % (H * 0.6);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  if (envSettings.fog) {
    const fogGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
    fogGrad.addColorStop(0, "transparent");
    fogGrad.addColorStop(1, `rgba(${envSettings.fogColor || "180,180,200"},0.35)`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, W, H);
  }

  const project = (x, y, z) => project3D(x, y, z, camAngle, camPitch, camDist, W, H);

  if (showGrid) {
    ctx.save();
    const gLines = 12, gSpacing = 40;
    ctx.strokeStyle = visualStyle === "wireframe" ? "rgba(0,255,0,0.12)" : "rgba(100,120,160,0.2)";
    ctx.lineWidth = 0.5;
    for (let i = -gLines; i <= gLines; i++) {
      const p1 = project(i * gSpacing, 0, -gLines * gSpacing);
      const p2 = project(i * gSpacing, 0, gLines * gSpacing);
      const p3 = project(-gLines * gSpacing, 0, i * gSpacing);
      const p4 = project(gLines * gSpacing, 0, i * gSpacing);
      if (p1.z > 0 && p2.z > 0) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
      if (p3.z > 0 && p4.z > 0) { ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke(); }
    }
    ctx.restore();
  }

  if (envSettings.water) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    const wGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    wGrad.addColorStop(0, "#1a6ea8"); wGrad.addColorStop(1, "#0d3d5c");
    ctx.fillStyle = wGrad;
    const wPts = [
      project(-400, 2, -400), project(400, 2, -400),
      project(400, 2, 400), project(-400, 2, 400)
    ];
    if (wPts.every(p => p.z > 0)) {
      ctx.beginPath();
      ctx.moveTo(wPts[0].x, wPts[0].y);
      wPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const sorted = [...objects3d].sort((a, b) => {
    const da = Math.sqrt(a.x * a.x + a.z * a.z + (a.y || 0) * (a.y || 0));
    const db = Math.sqrt(b.x * b.x + b.z * b.z + (b.y || 0) * (b.y || 0));
    return db - da;
  });

  sorted.forEach(obj => {
    const sel = selIds.includes(obj.id);
    const mat = obj.material || MATERIALS.Default;
    const col = mat.color || obj.color || "#4488cc";
    const opacity = mat.opacity !== undefined ? mat.opacity : 1.0;
    ctx.save();

    const drawFace = (verts, normal, baseLightDir = { x: 0.5, y: 1, z: 0.3 }) => {
      if (verts.some(v => v.z < 0)) return;
      const light = Math.max(0.15,
        Math.abs(normal.x * baseLightDir.x + normal.y * baseLightDir.y + normal.z * baseLightDir.z)
      );
      const r = parseInt(col.slice(1, 3), 16);
      const g = parseInt(col.slice(3, 5), 16);
      const b2 = parseInt(col.slice(5, 7), 16);
      const emR = parseInt((mat.emissive || "#000000").slice(1, 3), 16);
      const emG = parseInt((mat.emissive || "#000000").slice(3, 5), 16);
      const emB = parseInt((mat.emissive || "#000000").slice(5, 7), 16);
      const metalFactor = 1 - (mat.metalness || 0) * 0.5;
      const lr = Math.min(255, r * light * metalFactor + emR);
      const lg = Math.min(255, g * light * metalFactor + emG);
      const lb = Math.min(255, b2 * light * metalFactor + emB);
      const alpha = visualStyle === "xray" ? 0.25 : opacity;

      if (visualStyle !== "wireframe" && visualStyle !== "xray" || visualStyle === "xray") {
        ctx.globalAlpha = alpha;
        if (visualStyle === "conceptual") {
          ctx.fillStyle = sel ? `rgba(255,200,0,${alpha})` : `rgba(${lr|0},${lg|0},${lb|0},${alpha})`;
        } else if (visualStyle === "shaded" || visualStyle === "realistic") {
          if (mat.roughness > 0.7) {
            ctx.fillStyle = sel ? `rgba(255,200,0,${alpha})` : `rgba(${lr|0},${lg|0},${lb|0},${alpha})`;
          } else {
            const grad = ctx.createLinearGradient(verts[0].x, verts[0].y, verts[2].x, verts[2].y);
            const lc = `rgba(${Math.min(255,lr+40)|0},${Math.min(255,lg+40)|0},${Math.min(255,lb+40)|0},${alpha})`;
            const dc = `rgba(${Math.max(0,lr-30)|0},${Math.max(0,lg-30)|0},${Math.max(0,lb-30)|0},${alpha})`;
            grad.addColorStop(0, lc); grad.addColorStop(1, dc);
            ctx.fillStyle = sel ? `rgba(255,200,0,${alpha})` : grad;
          }
        } else {
          ctx.fillStyle = sel ? `rgba(255,200,0,${alpha})` : `rgba(${lr|0},${lg|0},${lb|0},${alpha})`;
        }
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        verts.slice(1).forEach(v => ctx.lineTo(v.x, v.y));
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : `rgba(0,0,0,${0.3 + (mat.roughness || 0.5) * 0.3})`);
      ctx.lineWidth = sel ? 2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      verts.slice(1).forEach(v => ctx.lineTo(v.x, v.y));
      ctx.closePath(); ctx.stroke();
    };

    const rx = (obj.rotX || 0), ry2 = (obj.rotY || 0), rz2 = (obj.rotZ || 0);

    const applyRot = (x, y, z) => {
      let nx = x * Math.cos(ry2) + z * Math.sin(ry2);
      let nz = -x * Math.sin(ry2) + z * Math.cos(ry2);
      x = nx; z = nz;
      let ny = y * Math.cos(rx) - z * Math.sin(rx);
      nz = y * Math.sin(rx) + z * Math.cos(rx);
      y = ny; z = nz;
      return [x, y, z];
    };

    const pRot = (dx, dy, dz) => {
      const [x2, y2, z2] = applyRot(dx, dy, dz);
      return project(obj.x + x2, (obj.y || 0) + y2, obj.z + z2);
    };

    if (obj.shape === "box3d") {
      const { w = 60, h = 60, d = 60 } = obj;
      const hx = w / 2, hy = h / 2, hz = d / 2;
      const verts = [
        pRot(-hx, -hy, -hz), pRot(hx, -hy, -hz), pRot(hx, hy, -hz), pRot(-hx, hy, -hz),
        pRot(-hx, -hy, hz), pRot(hx, -hy, hz), pRot(hx, hy, hz), pRot(-hx, hy, hz),
      ];
      const faces = [
        { idx: [3, 2, 1, 0], n: { x: 0, y: 0, z: -1 } },
        { idx: [4, 5, 6, 7], n: { x: 0, y: 0, z: 1 } },
        { idx: [0, 1, 5, 4], n: { x: 0, y: -1, z: 0 } },
        { idx: [2, 3, 7, 6], n: { x: 0, y: 1, z: 0 } },
        { idx: [0, 4, 7, 3], n: { x: -1, y: 0, z: 0 } },
        { idx: [1, 2, 6, 5], n: { x: 1, y: 0, z: 0 } },
      ];
      faces.forEach(f => drawFace(f.idx.map(i => verts[i]), f.n));
    } else if (obj.shape === "sphere3d") {
      const { r = 40 } = obj;
      const c = project(obj.x, obj.y || 0, obj.z);
      if (c.z < 0) { ctx.restore(); return; }
      const sr = r * c.scale;
      const mat2 = obj.material || {};
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : (mat2.opacity || 1);
      if (visualStyle !== "wireframe") {
        if (mat2.roughness < 0.3 && visualStyle === "realistic") {
          const grad = ctx.createRadialGradient(c.x - sr * 0.3, c.y - sr * 0.3, sr * 0.05, c.x, c.y, sr);
          grad.addColorStop(0, "#ffffffaa");
          grad.addColorStop(0.3, col + "dd");
          grad.addColorStop(1, col + "33");
          ctx.fillStyle = sel ? "#ffcc0088" : grad;
        } else {
          ctx.fillStyle = sel ? "#ffcc0099" : col + "cc";
        }
        ctx.beginPath(); ctx.arc(c.x, c.y, sr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.4)");
      ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.arc(c.x, c.y, sr, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, sr, sr * 0.3, (i / 3) * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (obj.shape === "cylinder3d") {
      const { r = 30, h = 80 } = obj;
      const top = project(obj.x, (obj.y || 0) - h / 2, obj.z);
      const bot = project(obj.x, (obj.y || 0) + h / 2, obj.z);
      if (top.z < 0 || bot.z < 0) { ctx.restore(); return; }
      const sr = r * top.scale;
      const mat2 = obj.material || {};
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : (mat2.opacity || 1);
      if (visualStyle !== "wireframe") {
        const grad = ctx.createLinearGradient(top.x - sr, top.y, top.x + sr, top.y);
        grad.addColorStop(0, col + "66"); grad.addColorStop(0.3, col + "ee"); grad.addColorStop(1, col + "44");
        ctx.fillStyle = sel ? "#ffcc0077" : grad;
        ctx.beginPath();
        ctx.ellipse(bot.x, bot.y, sr, sr * 0.25, 0, 0, Math.PI);
        ctx.lineTo(top.x - sr, top.y);
        ctx.ellipse(top.x, top.y, sr, sr * 0.25, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sel ? "#ffcc00aa" : col + "cc";
        ctx.beginPath(); ctx.ellipse(top.x, top.y, sr, sr * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.5)");
      ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.ellipse(top.x, top.y, sr, sr * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bot.x, bot.y, sr, sr * 0.25, 0, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(top.x - sr, top.y); ctx.lineTo(bot.x - sr, bot.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(top.x + sr, top.y); ctx.lineTo(bot.x + sr, bot.y); ctx.stroke();
    } else if (obj.shape === "cone3d") {
      const { r = 40, h = 80 } = obj;
      const apex = project(obj.x, (obj.y || 0) - h / 2, obj.z);
      const base = project(obj.x, (obj.y || 0) + h / 2, obj.z);
      if (apex.z < 0 || base.z < 0) { ctx.restore(); return; }
      const sr = r * base.scale;
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : 1;
      if (visualStyle !== "wireframe") {
        ctx.fillStyle = sel ? "#ffcc0077" : col + "aa";
        ctx.beginPath(); ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(base.x - sr, base.y);
        ctx.ellipse(base.x, base.y, sr, sr * 0.25, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sel ? "#ffcc00aa" : col + "cc";
        ctx.beginPath(); ctx.ellipse(base.x, base.y, sr, sr * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.5)");
      ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.ellipse(base.x, base.y, sr, sr * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(base.x - sr, base.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(base.x + sr, base.y); ctx.stroke();
    } else if (obj.shape === "torus3d") {
      const { r = 40, tube = 12 } = obj;
      const c = project(obj.x, obj.y || 0, obj.z);
      if (c.z < 0) { ctx.restore(); return; }
      const sr = r * c.scale, str = tube * c.scale;
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : col);
      ctx.lineWidth = str * 0.7;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, sr, sr * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (obj.shape === "pyramid3d") {
      const { base: bs = 60, h = 80 } = obj;
      const hb = bs / 2;
      const apex = project(obj.x, (obj.y || 0) - h / 2, obj.z);
      const v0 = project(obj.x - hb, (obj.y || 0) + h / 2, obj.z - hb);
      const v1 = project(obj.x + hb, (obj.y || 0) + h / 2, obj.z - hb);
      const v2 = project(obj.x + hb, (obj.y || 0) + h / 2, obj.z + hb);
      const v3 = project(obj.x - hb, (obj.y || 0) + h / 2, obj.z + hb);
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : 1;
      [[v0, v1, apex], [v1, v2, apex], [v2, v3, apex], [v3, v0, apex], [v0, v1, v2, v3]].forEach(face => {
        if (visualStyle !== "wireframe") {
          ctx.fillStyle = sel ? "#ffcc0066" : col + "99";
          ctx.beginPath(); ctx.moveTo(face[0].x, face[0].y);
          face.slice(1).forEach(v => ctx.lineTo(v.x, v.y));
          ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.4)");
        ctx.lineWidth = sel ? 2 : 0.8;
        ctx.beginPath(); ctx.moveTo(face[0].x, face[0].y);
        face.slice(1).forEach(v => ctx.lineTo(v.x, v.y));
        ctx.closePath(); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    } else if (obj.shape === "plane3d") {
      const { w = 100, h = 100 } = obj;
      const v0 = project(obj.x - w / 2, obj.y || 0, obj.z - h / 2);
      const v1 = project(obj.x + w / 2, obj.y || 0, obj.z - h / 2);
      const v2 = project(obj.x + w / 2, obj.y || 0, obj.z + h / 2);
      const v3 = project(obj.x - w / 2, obj.y || 0, obj.z + h / 2);
      if ([v0, v1, v2, v3].some(v => v.z < 0)) { ctx.restore(); return; }
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : 0.8;
      ctx.fillStyle = sel ? "#ffcc0066" : col + "99";
      ctx.beginPath(); ctx.moveTo(v0.x, v0.y); ctx.lineTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.lineTo(v3.x, v3.y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.4)");
      ctx.lineWidth = sel ? 2 : 0.8;
      ctx.beginPath(); ctx.moveTo(v0.x, v0.y); ctx.lineTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.lineTo(v3.x, v3.y); ctx.closePath(); ctx.stroke();
    } else if (obj.shape === "capsule3d") {
      const { r = 20, h = 80 } = obj;
      const top = project(obj.x, (obj.y || 0) - h / 2, obj.z);
      const bot = project(obj.x, (obj.y || 0) + h / 2, obj.z);
      if (top.z < 0 || bot.z < 0) { ctx.restore(); return; }
      const sr = r * top.scale;
      ctx.globalAlpha = visualStyle === "xray" ? 0.3 : 1;
      if (visualStyle !== "wireframe") {
        ctx.fillStyle = sel ? "#ffcc0088" : col + "cc";
        ctx.beginPath(); ctx.arc(top.x, top.y, sr, Math.PI, 0); ctx.lineTo(bot.x + sr, bot.y); ctx.arc(bot.x, bot.y, sr, 0, Math.PI); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sel ? "#ffcc00" : (visualStyle === "wireframe" ? "#00ff88" : "rgba(0,0,0,0.4)");
      ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.arc(top.x, top.y, sr, Math.PI, 0); ctx.lineTo(bot.x + sr, bot.y); ctx.arc(bot.x, bot.y, sr, 0, Math.PI); ctx.closePath(); ctx.stroke();
    }

    if (obj.shape === "light") {
      const c = project(obj.x, obj.y || 0, obj.z);
      if (c.z > 0) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = obj.lightColor || "#FFD700";
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = obj.lightColor || "#FFD700";
        ctx.lineWidth = 1;
        if (obj.lightType === "point") {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * 10, c.y + Math.sin(a) * 10);
            ctx.lineTo(c.x + Math.cos(a) * 16, c.y + Math.sin(a) * 16); ctx.stroke();
          }
        }
        if (sel) {
          ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(c.x, c.y, 12, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 15; }
    ctx.restore();
  });

  if (showAxes) {
    ctx.save();
    const ax = 50, ay = H - 50;
    [[30, 0, 0, "#ff4444", "X"], [0, -30, 0, "#44cc44", "Y"], [0, 0, 30, "#4488ff", "Z"]].forEach(([dx, dy, dz, c, lbl]) => {
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.lineTo(ax + dx * 0.5, ay + dy * 0.5); ctx.stroke();
      ctx.fillStyle = c; ctx.font = "bold 10px monospace";
      ctx.fillText(lbl, ax + dx * 0.58, ay + dy * 0.58 + 4);
    });
    ctx.restore();
  }

  objects3d.forEach(obj => {
    if (obj.showMeasure) {
      const c = project(obj.x, obj.y || 0, obj.z);
      if (c.z > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 1;
        const txt = obj.shape === "box3d" ? `${obj.w||0}×${obj.h||0}×${obj.d||0}` : obj.shape === "sphere3d" ? `r:${obj.r||0}` : obj.shape;
        const tw = ctx.measureText(txt).width;
        ctx.fillRect(c.x - tw / 2 - 3, c.y - 22, tw + 6, 14);
        ctx.strokeRect(c.x - tw / 2 - 3, c.y - 22, tw + 6, 14);
        ctx.fillStyle = "#ffcc00"; ctx.font = "9px monospace";
        ctx.fillText(txt, c.x - tw / 2, c.y - 11);
        ctx.restore();
      }
    }
  });
}

// ── Ribbon defs ────────────────────────────────────────────────────────────
const RIBBON = {
  Home: {
    Draw: ["line", "circle", "rect", "arc", "ellipse", "spline", "polyline", "hatch", "text"],
    Modify: ["move", "copy", "rotate", "mirror", "scale", "trim", "extend", "offset", "fillet", "erase"],
    Annotate: ["dim", "leader", "mtext"],
    View: ["pan", "zoom", "zoomfit"],
  },
  Solid3D: {
    Primitives: ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"],
    Boolean: ["union3d", "subtract3d", "intersect3d"],
    Edit3D: ["extrude3d", "revolve3d", "shell3d"],
    Surface: ["planarsurface", "ruledsurf"],
  },
  Architecture: {
    Generate: ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"],
    Measure: ["measure_dist", "measure_area", "measure_angle"],
  },
  Modeling: {
    Mesh: ["extrude_face", "inset_face", "bevel_edge", "loop_cut", "knife", "merge_verts", "subdivide"],
    EditMode: ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"],
    Sculpt: ["sc_inflate", "sc_smooth", "sc_grab", "sc_clay", "sc_pinch"],
  },
  Lighting: {
    Lights: ["light_point", "light_spot", "light_dir", "light_sun", "light_ambient"],
    Environment: ["sky_day", "sky_sunset", "sky_night", "env_fog", "env_water", "env_grass"],
  },
  View: {
    Navigate: ["pan", "zoom", "orbit3d", "walk", "flymode", "reset_cam"],
    Views: ["viewtop", "viewfront", "viewright", "viewiso"],
    Visual: ["wireframe", "hidden", "conceptual", "realistic", "shaded", "xray"],
    Display: ["toggle_grid", "toggle_axes", "toggle_measure"],
  },
  Output: {
    Plot: ["plot", "exportpdf", "exportstl"],
    Settings: ["pagesetup"],
  },
};

const TOOL_ICONS = {
  line: "M5 19L19 5", circle: "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0",
  rect: "M3 5h18v14H3z", arc: "M3 12a9 9 0 0 1 18 0",
  ellipse: "M12 12m-9 0a9 4 0 1 0 18 0a9 4 0 1 0-18 0",
  spline: "M3 17c3-4 4-8 9-8s6 4 9 1", polyline: "M3 17l4-8 4 4 4-6 6 4",
  hatch: "M3 3l18 18M3 9l12 12M9 3l12 12", text: "M4 7V4h16v3M9 20h6M12 4v16",
  move: "M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M12 5l3-3M12 19l-3 3",
  copy: "M8 17.929H6c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8M10 7h8c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-8c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2z",
  rotate: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8", mirror: "M12 3v18M5 7l4 5-4 5M19 7l-4 5 4 5",
  scale: "M21 21H3M21 21V3M9 15l12 6", trim: "M3 12h7M14 12h7M10 8l2 4-2 4",
  extend: "M3 12h7M14 12h7M10 4v4M10 16v4", offset: "M4 12h16M4 7h12M4 17h12",
  fillet: "M5 19V5h14M5 19c0-4 2-6 6-6h8", erase: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  dim: "M3 6h18M3 6v3M21 6v3M12 6v5", leader: "M3 19l8-12 4 2 4-5", mtext: "M4 6h16M4 10h12M4 14h8",
  pan: "M12 2v20M2 12h20", zoom: "M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  zoomfit: "M5 15H3v4a2 2 0 0 0 2 2h4v-2H5zM5 5h4V3H5a2 2 0 0 0-2 2v4h2zm14-2h-4v2h4v4h2V5a2 2 0 0 0-2-2zm0 16h-4v2h4a2 2 0 0 0 2-2v-4h-2z",
  box3d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  sphere3d: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15 15 0 0 1 0 20",
  cylinder3d: "M12 5c-5 0-8 1.1-8 2.5v9c0 1.4 3 2.5 8 2.5s8-1.1 8-2.5v-9c0-1.4-3-2.5-8-2.5zM4 7.5c0 1.4 3 2.5 8 2.5s8-1.1 8-2.5",
  cone3d: "M12 2L3 19h18L12 2z", torus3d: "M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0",
  wedge3d: "M3 19h18V8L12 2 3 8v11z", pyramid3d: "M12 2L2 20h20L12 2z",
  plane3d: "M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4",
  capsule3d: "M12 2a4 4 0 0 1 4 4v12a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z",
  union3d: "M8 3a5 5 0 1 0 0 10M16 3a5 5 0 1 0 0 10", subtract3d: "M8 4a6 6 0 1 0 0 12M16 8a6 6 0 1 0 0 12",
  intersect3d: "M9 3a7 7 0 1 0 0 14M15 3a7 7 0 1 0 0 14",
  extrude3d: "M3 17h18M7 17V7M17 17V7M7 7h10", revolve3d: "M12 3a9 9 0 1 0 0 18M12 3v18",
  shell3d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4-7 4A2 2 0 0 0 3 8v8l7 4 7-4z",
  planarsurface: "M3 8l9-5 9 5v8l-9 5-9-5V8z", ruledsurf: "M3 4h4v16H3zM17 4h4v16h-4zM3 12h18",
  wall: "M3 3h4v18H3zM17 3h4v18h-4zM7 12h10", door_gen: "M7 3h10v18H7zM7 12h5v9",
  window_gen: "M5 5h14v14H5zM5 12h14M12 5v14", stair_gen: "M3 21h4v-4h4v-4h4v-4h4V3",
  floor_gen: "M3 18h18v3H3z", roof_gen: "M2 20L12 4l10 16z",
  room_gen: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  measure_dist: "M3 12h18M3 6v12M21 6v12", measure_area: "M3 3h18v18H3z",
  measure_angle: "M3 12h9M12 3v9M5 19l7-7",
  extrude_face: "M3 17h18M7 17V7M17 17V7M7 7h10M5 12l2-5M19 12l-2-5",
  inset_face: "M3 3h18v18H3zM6 6h12v12H6z", bevel_edge: "M5 19V5h10l4 4v10H5M15 5l-4 4",
  loop_cut: "M12 3v18M3 12h18", knife: "M5 5l14 14M5 19l7-14",
  merge_verts: "M5 12l7-7 7 7M5 12l7 7 7-7", subdivide: "M3 3h18v18H3zM12 3v18M3 12h18",
  obj_mode: "M21 16V8a2 2 0 0 0-1-1.73l-7-4-7 4A2 2 0 0 0 3 8v8l7 4 7-4z",
  vert_mode: "M12 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  edge_mode: "M6 20l6-12 6 12", face_mode: "M3 3h18v18H3z",
  sculpt_mode: "M12 2a10 10 0 1 0 0 20M6 9c2 0 4 1 6 3s4 3 6 3",
  sc_inflate: "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 4v4M12 16v4M4 12h4M16 12h4",
  sc_smooth: "M3 12c3-4 6-6 9-6s6 2 9 6", sc_grab: "M18 11.5c0 4.7-6 8.5-6 8.5s-6-3.8-6-8.5a6 6 0 0 1 12 0z",
  sc_clay: "M4 19c2-3 4-5 8-5s6 2 8 5M8 9a4 4 0 0 1 8 0", sc_pinch: "M12 4v16M4 12l8-4 8 4",
  light_point: "M12 2a5 5 0 1 0 0 10M12 15v4M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M2 12h2M22 12h-2",
  light_spot: "M12 2L8 8h8L12 2zM8 8v6a4 4 0 0 0 8 0V8",
  light_dir: "M12 2v6M12 16v6M2 12h6M16 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2",
  light_sun: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v12M6 12h12",
  light_ambient: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z",
  sky_day: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6a6 6 0 1 0 0 12",
  sky_sunset: "M3 12h18M12 6a6 6 0 0 1 6 6H6a6 6 0 0 1 6-6z",
  sky_night: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  env_fog: "M3 6h18M3 10h18M3 14h14M3 18h10",
  env_water: "M3 12c2-3 4-4 6-4s4 1 6 4c2-3 4-4 6-4", env_grass: "M3 20l3-8M7 20l2-6M11 20l3-10M15 20l2-6M19 20l3-8",
  orbit3d: "M12 2a10 10 0 1 0 0 20M2 12h20M12 2c-4 3-4 17 0 20",
  walk: "M12 3a1 1 0 1 0 0 2M9 21l3-8 3 8M6 8l6-2 6 2",
  flymode: "M12 2L2 19h20L12 2z", reset_cam: "M3 12a9 9 0 1 0 18 0M3 12l3-3M3 12l3 3",
  viewtop: "M12 2v4M3 7l9-5 9 5M3 7v10l9 5 9-5V7",
  viewfront: "M3 3h18v18H3z", viewright: "M3 3h18v18H3zM12 3v18", viewiso: "M12 2L2 7v10l10 5 10-5V7L12 2zM2 7l10 5M22 7l-10 5M12 22V12",
  wireframe: "M12 2L2 7v10l10 5 10-5V7L12 2z", hidden: "M3 3l18 18M3 3h18v18H3z",
  conceptual: "M12 2L2 7v10l10 5 10-5V7L12 2zM2 7l10 5M22 7l-10 5M12 22V12",
  realistic: "M12 2a10 10 0 1 0 0 20", shaded: "M12 2a10 10 0 1 0 0 20M4 7c2 1 5 2 8 2s6-1 8-2",
  xray: "M3 3l18 18M21 3L3 21M12 2a10 10 0 1 0 0 20",
  toggle_grid: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  toggle_axes: "M3 12h5M12 3v5M3 12l3-2M3 12l3 2", toggle_measure: "M3 6h18M3 6v2M21 6v2M12 6v5",
  plot: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  exportpdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6",
  exportstl: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  pagesetup: "M3 3h18v18H3zM3 9h18M9 21V9",
  select: "M5 3l14 9-7 2-3 7z",
  cursor3d: "M5 3l14 9-7 2-3 7z",
  gizmo_move: "M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M12 5l3-3M12 19l-3 3",
  gizmo_rotate: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8",
  gizmo_scale: "M21 21H3M21 21V3M9 15l12 6",
  gizmo_annotate: "M4 7V4h16v3M9 20h6M12 4v16",
  gizmo_measure: "M3 6h18M3 6v3M21 6v3M12 6v5",
};

const TOOL_LABEL = {
  line: "Line", circle: "Circle", rect: "Rect", arc: "Arc", ellipse: "Ellipse",
  spline: "Spline", polyline: "Pline", hatch: "Hatch", text: "Text",
  move: "Move", copy: "Copy", rotate: "Rotate", mirror: "Mirror", scale: "Scale",
  trim: "Trim", extend: "Extend", offset: "Offset", fillet: "Fillet", erase: "Erase",
  dim: "Dim", leader: "Leader", mtext: "MText", pan: "Pan", zoom: "Zoom", zoomfit: "ZFit",
  box3d: "Box", sphere3d: "Sphere", cylinder3d: "Cylinder", cone3d: "Cone",
  torus3d: "Torus", wedge3d: "Wedge", pyramid3d: "Pyramid", plane3d: "Plane", capsule3d: "Capsule",
  union3d: "Union", subtract3d: "Subtract", intersect3d: "Intersect",
  extrude3d: "Extrude", revolve3d: "Revolve", shell3d: "Shell",
  planarsurface: "PlanSurf", ruledsurf: "RuledSurf",
  wall: "Wall", door_gen: "Door", window_gen: "Window", stair_gen: "Stairs",
  floor_gen: "Floor", roof_gen: "Roof", room_gen: "Room", measure_dist: "Distance",
  measure_area: "Area", measure_angle: "Angle",
  extrude_face: "Extrude", inset_face: "Inset", bevel_edge: "Bevel", loop_cut: "LoopCut",
  knife: "Knife", merge_verts: "Merge", subdivide: "Subdivide",
  obj_mode: "Object", vert_mode: "Vertex", edge_mode: "Edge", face_mode: "Face", sculpt_mode: "Sculpt",
  sc_inflate: "Inflate", sc_smooth: "Smooth", sc_grab: "Grab", sc_clay: "Clay", sc_pinch: "Pinch",
  light_point: "Point", light_spot: "Spot", light_dir: "Direct", light_sun: "Sun", light_ambient: "Ambient",
  sky_day: "Day", sky_sunset: "Sunset", sky_night: "Night",
  env_fog: "Fog", env_water: "Water", env_grass: "Grass",
  orbit3d: "Orbit", walk: "Walk", flymode: "Fly", reset_cam: "Reset",
  viewtop: "Top", viewfront: "Front", viewright: "Right", viewiso: "Iso",
  wireframe: "Wireframe", hidden: "Hidden", conceptual: "Concept", realistic: "Realistic", shaded: "Shaded", xray: "X-Ray",
  toggle_grid: "Grid", toggle_axes: "Axes", toggle_measure: "Measure",
  plot: "Plot", exportpdf: "PDF", exportstl: "STL", pagesetup: "Setup",
  select: "Select", cursor3d: "Cursor", gizmo_move: "Move", gizmo_rotate: "Rotate", gizmo_scale: "Scale",
  gizmo_annotate: "Annotate", gizmo_measure: "Measure",
};

// Workspace tabs (Blender-style)
const WORKSPACES = ["Layout", "Modeling", "Sculpting", "UV Editing", "Shading", "Animation", "Rendering", "Compositing"];

// ════════════════════════════════════════════════════════════════════════════
export default function CADEditor() {
  // ── Viewport
  const [vp, setVp] = useState("3d");
  const [activeWorkspace, setActiveWorkspace] = useState("Layout");

  // ── Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const idRef = useRef(1);
  const cmdRef = useRef(null);

  // ── Canvas size
  const [csz, setCsz] = useState({ w: 900, h: 600 });

  // ── 2D state
  const [entities, setEntities] = useState([]);
  const [selIds2d, setSelIds2d] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan2d, setPan2d] = useState({ x: 450, y: 300 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [worldPt, setWorldPt] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState(null);
  const [tempPt, setTempPt] = useState(null);
  const [polyPts, setPolyPts] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [histIdx, setHistIdx] = useState(0);

  // ── 3D state
  const [objs3d, setObjs3d] = useState([]);
  const [selIds3d, setSelIds3d] = useState([]);
  const [camAngle, setCamAngle] = useState(0.6);
  const [camPitch, setCamPitch] = useState(0.5);
  const [camDist, setCamDist] = useState(400);
  const [orbiting, setOrbiting] = useState(false);
  const [orbitStart, setOrbitStart] = useState(null);
  const [visualStyle, setVisualStyle] = useState("realistic");
  const [showGrid3d, setShowGrid3d] = useState(true);
  const [showAxes3d, setShowAxes3d] = useState(true);
  const [showMeasure3d, setShowMeasure3d] = useState(false);
  const [editMode, setEditMode] = useState("obj_mode");

  // ── Gizmo / Transform state (NEW)
  const [gizmoAxis, setGizmoAxis] = useState(null);         // currently dragging axis
  const [hoveredGizmoAxis, setHoveredGizmoAxis] = useState(null);
  const [gizmoDragStart, setGizmoDragStart] = useState(null);
  const [gizmoDragObj, setGizmoDragObj] = useState(null);    // snapshot of obj at drag start
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);

  // ── Left toolbar tool (viewport-level, Blender-style)
  const [viewportTool, setViewportTool] = useState("select"); // select|cursor3d|gizmo_move|gizmo_rotate|gizmo_scale|gizmo_annotate|gizmo_measure

  // ── Lights
  const [lights, setLights] = useState([
    { id: 9001, type: "directional", color: "#ffffff", intensity: 1.0, x: 200, y: -300, z: 100 },
    { id: 9002, type: "ambient", color: "#334466", intensity: 0.4, x: 0, y: 0, z: 0 },
  ]);

  // ── Scene hierarchy
  const [sceneNodes, setSceneNodes] = useState([
    mkNode(1, "Scene Collection", "root"),
  ]);
  const [expandedNodes, setExpandedNodes] = useState(new Set([1]));
  const [selNodeId, setSelNodeId] = useState(null);

  // ── Environment
  const [envSettings, setEnvSettings] = useState({
    skybox: "default", fog: false, fogColor: "180,180,200",
    water: false, grass: false,
  });

  // ── Tool / UI state
  const [tool, setTool] = useState("select");
  const [layer, setLayer] = useState("0");
  const [layers, setLayers] = useState(LAYERS_DEF);
  const [color, setColor] = useState("#4488cc");
  const [lw, setLw] = useState(1);
  const [snap, setSnap] = useState(true);
  const [grid, setGrid] = useState(true);
  const [orthoOn, setOrthoOn] = useState(false);
  const [polar, setPolar] = useState(false);
  const [dynInput, setDynInput] = useState(true);
  const [lwtOn, setLwtOn] = useState(true);
  const [otrack, setOtrack] = useState(false);

  const [ribbonTab, setRibbonTab] = useState("Solid3D");
  const [rightTab, setRightTab] = useState("props");
  const [bottomTab, setBottomTab] = useState("cmd");
  const [layoutTab, setLayoutTab] = useState("Model");
  const [sidebarTab, setSidebarTab] = useState("tools");
  const [activeFile] = useState("Drawing1.dwg");

  // ── Material panel
  const [selectedMaterial, setSelectedMaterial] = useState("Default");

  // ── Properties transform
  const [transformMode, setTransformMode] = useState("move");

  // ── Lasso / box select
  const [boxSelStart, setBoxSelStart] = useState(null);
  const [boxSelEnd, setBoxSelEnd] = useState(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  // ── Drag pan
  const [isDrag, setIsDrag] = useState(false);
  const [dragSt, setDragSt] = useState(null);

  // ── Physics
  const [physics, setPhysics] = useState({ gravity: -9.8, enabled: false, bounce: 0.3, friction: 0.5 });

  // ── Timeline (NEW enhanced)
  const [timelineFrame, setTimelineFrame] = useState(1);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [timelineStart, setTimelineStart] = useState(1);
  const [timelineEnd, setTimelineEnd] = useState(250);
  const timelineRef = useRef(null);

  // ── Command
  const [cmdLog, setCmdLog] = useState(["Welcome to 3DCAD Studio Pro v2.0", "Blender-style UI | Type 'help' for commands", "Command:"]);
  const [cmdInput, setCmdInput] = useState("");
  const [searchQ, setSearchQ] = useState("");

  // ── Top menu dropdown state
  const [openMenu, setOpenMenu] = useState(null);

  // ── Perspective toggle
  const [isPerspective, setIsPerspective] = useState(true);

  // ── ResizeObserver ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCsz({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    setCsz({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    return () => ro.disconnect();
  }, []);

  // ── Timeline playback ──────────────────────────────────────────────────
  useEffect(() => {
    if (!timelinePlaying) return;
    const id = setInterval(() => setTimelineFrame(f => {
      const next = f + 1;
      if (next > timelineEnd) { setTimelinePlaying(false); return timelineStart; }
      return next;
    }), 33);
    return () => clearInterval(id);
  }, [timelinePlaying, timelineEnd, timelineStart]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const toW = useCallback((sx, sy) => ({ x: (sx - pan2d.x) / zoom, y: (sy - pan2d.y) / zoom }), [pan2d, zoom]);
  const toS = useCallback((wx, wy) => ({ x: wx * zoom + pan2d.x, y: wy * zoom + pan2d.y }), [pan2d, zoom]);
  const nextId = () => { idRef.current++; return idRef.current; };

  const pushHist = (ents) => {
    const h = history.slice(0, histIdx + 1);
    h.push(ents); setHistory(h); setHistIdx(h.length - 1);
  };
  const undo = () => { if (histIdx > 0) { setHistIdx(h => h - 1); setEntities(history[histIdx - 1]); log("UNDO"); } };
  const redo = () => { if (histIdx < history.length - 1) { setHistIdx(h => h + 1); setEntities(history[histIdx + 1]); log("REDO"); } };
  const resetDraw = () => { setDrawing(false); setStartPt(null); setTempPt(null); setPolyPts([]); };
  const log = (msg) => setCmdLog(p => [...p.slice(-199), msg]);
  const logCmd = (msg) => setCmdLog(p => [...p.slice(-199), msg, "Command:"]);

  // ── Add node to scene hierarchy ────────────────────────────────────────
  const addSceneNode = useCallback((name, type, parentId = 1) => {
    const id = nextId();
    const node = mkNode(id, name, type, parentId);
    setSceneNodes(prev => {
      const addToParent = (nodes) => nodes.map(n => {
        if (n.id === parentId) return { ...n, children: [...n.children, node] };
        if (n.children.length) return { ...n, children: addToParent(n.children) };
        return n;
      });
      return addToParent(prev);
    });
    return id;
  }, []);

  // ── 2D Canvas draw ─────────────────────────────────────────────────────
  useEffect(() => {
    if (vp !== "2d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#414141"; ctx.fillRect(0, 0, W, H);

    if (grid) {
      const gs = GRID * zoom;
      if (gs > 6) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        const ox = ((pan2d.x % gs) + gs) % gs, oy = ((pan2d.y % gs) + gs) % gs;
        for (let x = ox; x < W; x += gs)
          for (let y = oy; y < H; y += gs)
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }

    const o = toS(0, 0);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,80,80,0.7)";
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + 50 * zoom, o.y); ctx.stroke();
    ctx.strokeStyle = "rgba(80,220,80,0.7)";
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - 50 * zoom); ctx.stroke();
    ctx.restore();

    const drawEnt = (ent, sel) => {
      const lyr = layers.find(l => l.name === ent.layer) || layers[0];
      if (!lyr.visible) return;
      ctx.save();
      ctx.strokeStyle = sel ? "#00bfff" : (ent.color || "#ffffff");
      ctx.lineWidth = Math.max(0.5, (ent.lw || 1) * (lwtOn ? 1 : 0.5) * zoom);
      if (sel) { ctx.shadowColor = "#00bfff"; ctx.shadowBlur = 6; }
      const dot = (px, py) => { if (!sel) return; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = "#00bfff"; ctx.fill(); };
      if (ent.type === "line") {
        const a = toS(ent.x1, ent.y1), b = toS(ent.x2, ent.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        dot(a.x, a.y); dot(b.x, b.y);
      } else if (ent.type === "rect") {
        const a = toS(ent.x1, ent.y1), b = toS(ent.x2, ent.y2);
        ctx.beginPath(); ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); ctx.stroke();
      } else if (ent.type === "circle") {
        const c = toS(ent.cx, ent.cy);
        ctx.beginPath(); ctx.arc(c.x, c.y, ent.r * zoom, 0, Math.PI * 2); ctx.stroke(); dot(c.x, c.y);
      } else if (ent.type === "text") {
        const s = toS(ent.x, ent.y);
        ctx.font = `${Math.max(10, (ent.sz || 14) * zoom)}px monospace`;
        ctx.fillStyle = ent.color || "#fff"; ctx.fillText(ent.text, s.x, s.y);
      } else if (ent.type === "polyline" || ent.type === "spline") {
        if (!ent.pts || ent.pts.length < 2) { ctx.restore(); return; }
        const p0 = toS(ent.pts[0].x, ent.pts[0].y);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
        ent.pts.slice(1).forEach(p => { const s = toS(p.x, p.y); ctx.lineTo(s.x, s.y); });
        if (ent.closed) ctx.closePath(); ctx.stroke();
      } else if (ent.type === "dim") {
        const a = toS(ent.x1, ent.y1), b = toS(ent.x2, ent.y2), off = 18;
        ctx.beginPath(); ctx.moveTo(a.x, a.y - off); ctx.lineTo(b.x, b.y - off); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - off - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y - off - 4); ctx.stroke();
        ctx.font = "10px monospace"; ctx.fillStyle = "#ffff00";
        ctx.fillText(Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1).toFixed(2), (a.x + b.x) / 2 - 20, (a.y + b.y) / 2 - off - 6);
      }
      ctx.restore();
    };

    entities.forEach(e => drawEnt(e, selIds2d.includes(e.id)));

    if (drawing && startPt && tempPt) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.5, lw); ctx.setLineDash([6, 4]);
      const a = toS(startPt.x, startPt.y), b = toS(tempPt.x, tempPt.y);
      if (tool === "line") { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      else if (tool === "rect") { ctx.beginPath(); ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); ctx.stroke(); }
      else if (tool === "circle") { const r = Math.hypot(tempPt.x - startPt.x, tempPt.y - startPt.y); ctx.beginPath(); ctx.arc(a.x, a.y, r * zoom, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);
      if (dynInput) {
        const dist = Math.hypot(tempPt.x - startPt.x, tempPt.y - startPt.y).toFixed(2);
        ctx.fillStyle = "#ffffcc"; ctx.fillRect(b.x + 10, b.y - 38, 130, 32);
        ctx.strokeStyle = "#888"; ctx.lineWidth = 0.5; ctx.strokeRect(b.x + 10, b.y - 38, 130, 32);
        ctx.fillStyle = "#000"; ctx.font = "10px monospace";
        ctx.fillText(`Dist: ${dist}`, b.x + 14, b.y - 24);
        ctx.fillText(`Δx:${Math.abs(tempPt.x - startPt.x).toFixed(1)}  Δy:${Math.abs(tempPt.y - startPt.y).toFixed(1)}`, b.x + 14, b.y - 10);
      }
      ctx.restore();
    }

    if (isBoxSelecting && boxSelStart && boxSelEnd) {
      ctx.save(); ctx.strokeStyle = "#00bfff"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.fillStyle = "rgba(0,120,255,0.07)";
      const x = Math.min(boxSelStart.x, boxSelEnd.x), y = Math.min(boxSelStart.y, boxSelEnd.y);
      const w2 = Math.abs(boxSelEnd.x - boxSelStart.x), h2 = Math.abs(boxSelEnd.y - boxSelStart.y);
      ctx.fillRect(x, y, w2, h2); ctx.strokeRect(x, y, w2, h2); ctx.setLineDash([]); ctx.restore();
    }

    if (snap && tempPt) {
      const s = toS(tempPt.x, tempPt.y);
      ctx.save(); ctx.strokeStyle = "#ffff00"; ctx.lineWidth = 1.5; ctx.strokeRect(s.x - 5, s.y - 5, 10, 10); ctx.restore();
    }

    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cursor.y); ctx.lineTo(cursor.x - 8, cursor.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x + 8, cursor.y); ctx.lineTo(W, cursor.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x, 0); ctx.lineTo(cursor.x, cursor.y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x, cursor.y + 8); ctx.lineTo(cursor.x, H); ctx.stroke();
    ctx.restore();

    const ux = 28, uy = H - 28;
    ctx.save();
    ctx.lineWidth = 2; ctx.strokeStyle = "#ff3333"; ctx.fillStyle = "#ff3333";
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + 30, uy); ctx.stroke();
    ctx.font = "bold 10px Arial"; ctx.fillText("X", ux + 33, uy + 4);
    ctx.strokeStyle = "#33cc33"; ctx.fillStyle = "#33cc33";
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy - 30); ctx.stroke();
    ctx.fillText("Y", ux - 4, uy - 33);
    ctx.restore();
  }, [entities, pan2d, zoom, cursor, tempPt, drawing, startPt, tool, grid, snap, selIds2d, color, lw, polyPts, layers, dynInput, toS, csz, lwtOn, vp, isBoxSelecting, boxSelStart, boxSelEnd]);

  // ── 3D Canvas draw ─────────────────────────────────────────────────────
  useEffect(() => {
    if (vp !== "3d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const allObjs = [...objs3d];
    draw3DScene(ctx, canvas.width, canvas.height, allObjs, lights, camAngle, camPitch, camDist, selIds3d, visualStyle, envSettings, showGrid3d, showAxes3d, editMode);

    // Draw gizmo for selected object
    const activeTransformMode = viewportTool === "gizmo_move" ? "move"
      : viewportTool === "gizmo_rotate" ? "rotate"
      : viewportTool === "gizmo_scale" ? "scale"
      : transformMode;

    if (selIds3d.length > 0 && (viewportTool === "gizmo_move" || viewportTool === "gizmo_rotate" || viewportTool === "gizmo_scale" || viewportTool === "select")) {
      const firstSel = objs3d.find(o => o.id === selIds3d[0]);
      if (firstSel && activeTransformMode !== "none") {
        drawTransformGizmo(ctx, firstSel, camAngle, camPitch, camDist, canvas.width, canvas.height, activeTransformMode, hoveredGizmoAxis);
      }
    }

    if (editMode !== "obj_mode") {
      ctx.save();
      ctx.fillStyle = "rgba(0,120,255,0.12)";
      ctx.fillRect(0, 0, canvas.width, 24);
      ctx.fillStyle = "#00bfff"; ctx.font = "bold 11px monospace";
      ctx.fillText(`  ◉ ${editMode.replace("_", " ").toUpperCase()} — Press TAB to cycle`, 8, 16);
      ctx.restore();
    }
  }, [vp, objs3d, lights, selIds3d, camAngle, camPitch, camDist, visualStyle, envSettings, showGrid3d, showAxes3d, editMode, csz, hoveredGizmoAxis, viewportTool, transformMode]);

  // ── Mouse ─────────────────────────────────────────────────────────────
  const onMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    setCursor({ x: sx, y: sy });

    if (vp === "3d") {
      // Gizmo drag
      if (isGizmoDragging && gizmoAxis && gizmoDragStart && gizmoDragObj) {
        const dx = sx - gizmoDragStart.x;
        const dy = sy - gizmoDragStart.y;
        const sensitivity = 0.5;
        const activeTransformMode = viewportTool === "gizmo_move" ? "move"
          : viewportTool === "gizmo_rotate" ? "rotate"
          : viewportTool === "gizmo_scale" ? "scale"
          : transformMode;

        selIds3d.forEach(sid => {
          const srcObj = objs3d.find(o => o.id === sid);
          const baseObj = sid === gizmoDragObj.id ? gizmoDragObj : srcObj;
          if (!srcObj) return;

          if (activeTransformMode === "move") {
            const delta = (dx - dy) * sensitivity;
            if (gizmoAxis === "x") setObjs3d(p => p.map(o => o.id === sid ? { ...o, x: baseObj.x + dx * sensitivity } : o));
            else if (gizmoAxis === "y") setObjs3d(p => p.map(o => o.id === sid ? { ...o, y: (baseObj.y || 0) - dy * sensitivity } : o));
            else if (gizmoAxis === "z") setObjs3d(p => p.map(o => o.id === sid ? { ...o, z: baseObj.z + dx * sensitivity } : o));
            else if (gizmoAxis === "center") setObjs3d(p => p.map(o => o.id === sid ? { ...o, x: baseObj.x + dx * sensitivity, z: baseObj.z + dy * sensitivity } : o));
          } else if (activeTransformMode === "scale") {
            const factor = 1 + (dx + dy) * 0.005;
            if (gizmoAxis === "x" && baseObj.w !== undefined) setObjs3d(p => p.map(o => o.id === sid ? { ...o, w: Math.max(1, baseObj.w * (1 + dx * 0.01)) } : o));
            else if (gizmoAxis === "y" && baseObj.h !== undefined) setObjs3d(p => p.map(o => o.id === sid ? { ...o, h: Math.max(1, baseObj.h * (1 - dy * 0.01)) } : o));
            else if (gizmoAxis === "z" && baseObj.d !== undefined) setObjs3d(p => p.map(o => o.id === sid ? { ...o, d: Math.max(1, baseObj.d * (1 + dx * 0.01)) } : o));
            else if (gizmoAxis === "center") {
              const sf = 1 + (dx + dy) * 0.005;
              setObjs3d(p => p.map(o => o.id === sid ? {
                ...o,
                w: baseObj.w !== undefined ? Math.max(1, baseObj.w * sf) : o.w,
                h: baseObj.h !== undefined ? Math.max(1, baseObj.h * sf) : o.h,
                d: baseObj.d !== undefined ? Math.max(1, baseObj.d * sf) : o.d,
                r: baseObj.r !== undefined ? Math.max(1, baseObj.r * sf) : o.r,
              } : o));
            }
          } else if (activeTransformMode === "rotate") {
            const delta = (dx + dy) * 0.01;
            if (gizmoAxis === "x" || gizmoAxis === "y") setObjs3d(p => p.map(o => o.id === sid ? { ...o, rotX: (baseObj.rotX || 0) + delta } : o));
            else if (gizmoAxis === "z") setObjs3d(p => p.map(o => o.id === sid ? { ...o, rotY: (baseObj.rotY || 0) + delta } : o));
            else if (gizmoAxis === "center") setObjs3d(p => p.map(o => o.id === sid ? { ...o, rotY: (baseObj.rotY || 0) + dx * 0.01 } : o));
          }
        });
        return;
      }

      // Hover gizmo detection
      if (selIds3d.length > 0) {
        const firstSel = objs3d.find(o => o.id === selIds3d[0]);
        const activeTransformMode = viewportTool === "gizmo_move" ? "move"
          : viewportTool === "gizmo_rotate" ? "rotate"
          : viewportTool === "gizmo_scale" ? "scale"
          : transformMode;
        if (firstSel) {
          const hovered = hitTestGizmo(sx, sy, firstSel, camAngle, camPitch, camDist, csz.w, csz.h, activeTransformMode);
          setHoveredGizmoAxis(hovered);
        }
      }

      if (orbiting && orbitStart) {
        const dx = (sx - orbitStart.x) * 0.008, dy = (sy - orbitStart.y) * 0.008;
        setCamAngle(a => a + dx);
        setCamPitch(p => Math.max(-1.4, Math.min(1.4, p + dy)));
        setOrbitStart({ x: sx, y: sy });
      }
      if (isDrag && dragSt && tool === "pan") {
        const dx = (sx - dragSt.x) * 0.004;
        setCamAngle(a => a + dx);
        setDragSt({ x: sx, y: sy });
      }
      return;
    }

    let wp = toW(sx, sy);
    if (snap) wp = snapG(wp);
    if (startPt && ["line", "rect", "circle", "arc", "ellipse", "dim"].includes(tool)) wp = ortho(startPt, wp, orthoOn);
    setWorldPt(wp); setTempPt(wp);

    if (isDrag && dragSt && tool === "pan") {
      setPan2d(p => ({ x: p.x + (sx - dragSt.x), y: p.y + (sy - dragSt.y) }));
      setDragSt({ x: sx, y: sy });
    }
    if (isBoxSelecting) setBoxSelEnd({ x: sx, y: sy });
  };

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;

    if (vp === "3d") {
      if (e.button === 0) {
        // Check gizmo hit first
        if (selIds3d.length > 0) {
          const firstSel = objs3d.find(o => o.id === selIds3d[0]);
          const activeTransformMode = viewportTool === "gizmo_move" ? "move"
            : viewportTool === "gizmo_rotate" ? "rotate"
            : viewportTool === "gizmo_scale" ? "scale"
            : transformMode;
          if (firstSel) {
            const hitAxis = hitTestGizmo(sx, sy, firstSel, camAngle, camPitch, camDist, csz.w, csz.h, activeTransformMode);
            if (hitAxis) {
              setGizmoAxis(hitAxis);
              setGizmoDragStart({ x: sx, y: sy });
              setGizmoDragObj({ ...firstSel });
              setIsGizmoDragging(true);
              return;
            }
          }
        }

        if (tool === "select" || viewportTool === "select") {
          const W = csz.w, H = csz.h;
          const hit = [...objs3d].reverse().find(obj => {
            const c = project3D(obj.x, obj.y || 0, obj.z, camAngle, camPitch, camDist, W, H);
            if (!c) return false;
            const approxR = (obj.r || Math.max(obj.w || 40, obj.h || 40, obj.d || 40) / 2) * c.scale;
            return Math.hypot(sx - c.x, sy - c.y) < approxR + 12;
          });
          if (hit) {
            setSelIds3d(e.shiftKey ? (selIds3d.includes(hit.id) ? selIds3d.filter(i => i !== hit.id) : [...selIds3d, hit.id]) : [hit.id]);
            setSelNodeId(hit.id);
          } else if (!e.shiftKey) {
            setSelIds3d([]);
          }
          return;
        }
      }
      if (e.button === 1 || (e.button === 0 && tool === "pan")) { setIsDrag(true); setDragSt({ x: sx, y: sy }); return; }
      if (e.button === 2 || e.button === 0) { setOrbiting(true); setOrbitStart({ x: sx, y: sy }); }
      return;
    }

    if (e.button === 1 || (e.button === 0 && tool === "pan")) { setIsDrag(true); setDragSt({ x: sx, y: sy }); return; }
    if (e.button !== 0) return;

    let wp = toW(sx, sy);
    if (snap) wp = snapG(wp);
    if (startPt && ["line", "rect", "circle", "arc", "ellipse"].includes(tool)) wp = ortho(startPt, wp, orthoOn);

    if (tool === "select") {
      const hit = [...entities].reverse().find(en => hitTest2D(en, wp, 8 / zoom));
      if (hit) setSelIds2d(e.shiftKey ? [...selIds2d, hit.id] : [hit.id]);
      else { setIsBoxSelecting(true); setBoxSelStart({ x: sx, y: sy }); setBoxSelEnd({ x: sx, y: sy }); setSelIds2d([]); }
      return;
    }
    if (tool === "erase") {
      const hit = [...entities].reverse().find(en => hitTest2D(en, wp, 8 / zoom));
      if (hit) { const ne = entities.filter(en => en.id !== hit.id); setEntities(ne); pushHist(ne); logCmd(`Erased ${hit.type}`); }
      return;
    }
    if (tool === "polyline" || tool === "spline") {
      setPolyPts(p => [...p, wp]);
      if (!drawing) { setDrawing(true); setStartPt(wp); log("Specify points, double-click/RMB to finish:"); }
      return;
    }
    if (tool === "text") {
      const txt = prompt("Enter text:", "Text");
      if (!txt) return;
      const ent = { id: nextId(), type: "text", x: wp.x, y: wp.y, sz: 16, text: txt, color, layer, lw };
      const ne = [...entities, ent]; setEntities(ne); pushHist(ne); logCmd("TEXT added"); return;
    }
    if (!drawing) { setDrawing(true); setStartPt(wp); log(`First point: (${wp.x.toFixed(1)},${wp.y.toFixed(1)})`); }
    else finishEnt(wp);
  };

  const onMouseUp = (e) => {
    if (vp === "3d") {
      setOrbiting(false); setIsDrag(false);
      if (isGizmoDragging) {
        setIsGizmoDragging(false);
        setGizmoAxis(null);
        setGizmoDragStart(null);
        setGizmoDragObj(null);
      }
      return;
    }
    if (e.button === 1 || tool === "pan") setIsDrag(false);
    if (isBoxSelecting) {
      setIsBoxSelecting(false);
      if (boxSelStart && boxSelEnd) {
        const x0 = Math.min(boxSelStart.x, boxSelEnd.x), x1 = Math.max(boxSelStart.x, boxSelEnd.x);
        const y0 = Math.min(boxSelStart.y, boxSelEnd.y), y1 = Math.max(boxSelStart.y, boxSelEnd.y);
        const toWp = (sx, sy) => toW(sx, sy);
        const wMin = toWp(x0, y0), wMax = toWp(x1, y1);
        const boxHit = entities.filter(en => {
          if (en.type === "line") return en.x1 >= wMin.x && en.x1 <= wMax.x && en.y1 >= wMin.y && en.y1 <= wMax.y;
          if (en.type === "circle") return en.cx >= wMin.x && en.cx <= wMax.x && en.cy >= wMin.y && en.cy <= wMax.y;
          if (en.type === "rect") return en.x1 >= wMin.x && en.x2 <= wMax.x && en.y1 >= wMin.y && en.y2 <= wMax.y;
          return false;
        });
        setSelIds2d(boxHit.map(e => e.id));
      }
      setBoxSelStart(null); setBoxSelEnd(null);
    }
  };

  const onDblClick = () => {
    if ((tool === "polyline" || tool === "spline") && polyPts.length >= 2) {
      const ent = { id: nextId(), type: tool, pts: [...polyPts], closed: false, color, layer, lw };
      const ne = [...entities, ent]; setEntities(ne); pushHist(ne); logCmd(`${tool.toUpperCase()}`); resetDraw();
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    if (vp === "3d") { setCamDist(d => Math.max(80, Math.min(3000, d * (e.deltaY < 0 ? 0.85 : 1.15)))); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const f = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => { const nz = Math.min(50, Math.max(0.02, z * f)); setPan2d(p => ({ x: mx - (mx - p.x) * (nz / z), y: my - (my - p.y) * (nz / z) })); return nz; });
  };

  const onCtxMenu = (e) => {
    e.preventDefault();
    if ((tool === "polyline" || tool === "spline") && polyPts.length >= 2) onDblClick();
    else resetDraw();
  };

  const finishEnt = (ep) => {
    if (!startPt) return;
    const base = { id: nextId(), color, layer, lw };
    let ent = null;
    if (tool === "line") ent = { ...base, type: "line", x1: startPt.x, y1: startPt.y, x2: ep.x, y2: ep.y };
    else if (tool === "rect") ent = { ...base, type: "rect", x1: startPt.x, y1: startPt.y, x2: ep.x, y2: ep.y };
    else if (tool === "circle") { const r = Math.hypot(ep.x - startPt.x, ep.y - startPt.y); ent = { ...base, type: "circle", cx: startPt.x, cy: startPt.y, r }; }
    else if (tool === "dim") ent = { ...base, type: "dim", x1: startPt.x, y1: startPt.y, x2: ep.x, y2: ep.y, color: "#ffff00" };
    if (ent) { const ne = [...entities, ent]; setEntities(ne); pushHist(ne); logCmd(ent.type.toUpperCase()); }
    resetDraw();
  };

  // ── Add 3D object ──────────────────────────────────────────────────────
  const add3D = useCallback((shape, overrides = {}) => {
    const defs = OBJ3D_DEFAULTS[shape] || { color: "#4488cc" };
    const mat = { ...MATERIALS[selectedMaterial] };
    const newObj = {
      id: nextId(), shape,
      x: (Math.random() - 0.5) * 120,
      y: 0,
      z: (Math.random() - 0.5) * 120,
      rotX: 0, rotY: 0, rotZ: 0,
      scaleX: 1, scaleY: 1, scaleZ: 1,
      material: mat,
      ...defs,
      ...overrides,
    };
    setObjs3d(p => [...p, newObj]);
    addSceneNode(shape.replace("3d", ""), shape, 1);
    logCmd(`Added ${shape}`);
    setVp("3d");
    return newObj.id;
  }, [selectedMaterial]);

  const addFromLibrary = useCallback((asset) => {
    const mat = { ...MATERIALS.Default, color: asset.color };
    const newObj = {
      id: nextId(), shape: asset.shape,
      x: (Math.random() - 0.5) * 160,
      y: 0,
      z: (Math.random() - 0.5) * 160,
      rotX: 0, rotY: 0, rotZ: 0,
      scaleX: 1, scaleY: 1, scaleZ: 1,
      material: mat,
      ...Object.fromEntries(Object.entries(asset).filter(([k]) => ["w", "h", "d", "r", "tube", "base"].includes(k))),
    };
    setObjs3d(p => [...p, newObj]);
    addSceneNode(asset.label, asset.shape, 1);
    logCmd(`Added ${asset.label}`);
    setVp("3d");
  }, []);

  const addLight = (type) => {
    const id = nextId();
    const newLight = {
      id, shape: "light", lightType: type,
      x: (Math.random() - 0.5) * 200,
      y: -100,
      z: (Math.random() - 0.5) * 200,
      lightColor: "#ffffff",
      intensity: 1.0,
    };
    setObjs3d(p => [...p, newLight]);
    logCmd(`Added ${type} light`);
  };

  const genArchitecture = (type) => {
    if (type === "wall") {
      add3D("box3d", { w: 200, h: 250, d: 20, material: { ...MATERIALS.Concrete } });
    } else if (type === "door_gen") {
      add3D("box3d", { w: 90, h: 210, d: 10, material: { ...MATERIALS.Wood } });
    } else if (type === "window_gen") {
      add3D("box3d", { w: 100, h: 120, d: 8, material: { ...MATERIALS.Glass } });
    } else if (type === "stair_gen") {
      for (let i = 0; i < 5; i++) {
        const id = nextId();
        setObjs3d(p => [...p, {
          id, shape: "box3d",
          x: i * 35 - 70, y: -i * 15, z: 0,
          w: 40, h: 30, d: 100,
          rotX: 0, rotY: 0, rotZ: 0,
          material: { ...MATERIALS.Concrete },
        }]);
      }
      logCmd("Stairs generated (5 steps)");
    } else if (type === "floor_gen") {
      add3D("box3d", { w: 400, h: 10, d: 400, y: 130, material: { ...MATERIALS.Marble } });
    } else if (type === "roof_gen") {
      add3D("pyramid3d", { base: 350, h: 120, y: -160, material: { color: "#8B3A3A", roughness: 0.9, metalness: 0, opacity: 1, emissive: "#000" } });
    } else if (type === "room_gen") {
      const wallMat = { ...MATERIALS.Concrete };
      const walls = [
        { x: 0, y: -120, z: -150, w: 320, h: 250, d: 20 },
        { x: 0, y: -120, z: 150, w: 320, h: 250, d: 20 },
        { x: -160, y: -120, z: 0, w: 20, h: 250, d: 300 },
        { x: 160, y: -120, z: 0, w: 20, h: 250, d: 300 },
        { x: 0, y: 5, z: 0, w: 320, h: 10, d: 300 },
      ];
      walls.forEach(w => {
        const id = nextId();
        setObjs3d(p => [...p, { id, shape: "box3d", rotX: 0, rotY: 0, rotZ: 0, material: wallMat, ...w }]);
      });
      logCmd("Room generated");
    }
    setVp("3d");
  };

  const upd3D = (id, changes) => setObjs3d(p => p.map(o => o.id === id ? { ...o, ...changes } : o));
  const updMat = (id, matChanges) => setObjs3d(p => p.map(o => o.id === id ? { ...o, material: { ...(o.material || MATERIALS.Default), ...matChanges } } : o));

  const del3D = () => {
    if (selIds3d.length === 0) return;
    setObjs3d(p => p.filter(o => !selIds3d.includes(o.id)));
    logCmd(`Deleted ${selIds3d.length} object(s)`);
    setSelIds3d([]);
  };

  const duplicate3D = () => {
    const newObjs = selIds3d.map(sid => {
      const src = objs3d.find(o => o.id === sid);
      if (!src) return null;
      return { ...src, id: nextId(), x: src.x + 30, z: src.z + 30 };
    }).filter(Boolean);
    setObjs3d(p => [...p, ...newObjs]);
    setSelIds3d(newObjs.map(o => o.id));
    logCmd(`Duplicated ${newObjs.length} object(s)`);
  };

  const mirror3D = (axis) => {
    setObjs3d(p => p.map(o => {
      if (!selIds3d.includes(o.id)) return o;
      return { ...o, x: axis === "x" ? -o.x : o.x, z: axis === "z" ? -o.z : o.z };
    }));
    logCmd(`Mirrored on ${axis.toUpperCase()}`);
  };

  // ── Keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); duplicate3D(); }
      if (e.key === "Escape") { resetDraw(); setSelIds2d([]); setSelIds3d([]); log("*Cancel*"); setOpenMenu(null); }
      if (e.key === "Delete") {
        if (vp === "3d") del3D();
        else if (selIds2d.length) {
          const ne = entities.filter(en => !selIds2d.includes(en.id));
          setEntities(ne); pushHist(ne); logCmd(`Deleted ${selIds2d.length}`); setSelIds2d([]);
        }
      }
      if (e.key === "F7") { e.preventDefault(); setGrid(g => !g); }
      if (e.key === "F8") { e.preventDefault(); setOrthoOn(o => !o); }
      if (e.key === "F9") { e.preventDefault(); setSnap(s => !s); }
      if (e.key === "Tab" && vp === "3d") {
        e.preventDefault();
        const modes = ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"];
        setEditMode(m => modes[(modes.indexOf(m) + 1) % modes.length]);
      }
      if (e.key === "g" && vp === "3d") { setTransformMode("move"); setViewportTool("gizmo_move"); }
      if (e.key === "r" && vp === "3d") { setTransformMode("rotate"); setViewportTool("gizmo_rotate"); }
      if (e.key === "s" && vp === "3d") { setTransformMode("scale"); setViewportTool("gizmo_scale"); }
      if (e.key === "1") { setCamAngle(0); setCamPitch(0); }
      if (e.key === "3") { setCamAngle(Math.PI / 2); setCamPitch(0); }
      if (e.key === "7") { setCamAngle(0); setCamPitch(Math.PI / 2); }
      if (e.key === " ") { e.preventDefault(); setTimelinePlaying(p => !p); }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [selIds2d, selIds3d, entities, histIdx, history, vp, objs3d]);

  // ── Command processor ──────────────────────────────────────────────────
  const execCmd = (e) => {
    if (e.key !== "Enter") return;
    const cmd = cmdInput.trim().toLowerCase(); setCmdInput(""); if (!cmd) return;
    log(`> ${cmd}`);
    const toolMap = {
      l: "line", line: "line", c: "circle", circle: "circle",
      rec: "rect", rect: "rect", a: "arc", arc: "arc", el: "ellipse",
      pl: "polyline", spl: "spline", t: "text", text: "text",
      e: "erase", erase: "erase", di: "dim", dim: "dim",
      m: "move", move: "move", co: "copy", copy: "copy",
      ro: "rotate", rotate: "rotate", sc: "scale", scale: "scale",
      p: "pan", pan: "pan",
    };
    if (toolMap[cmd]) { setTool(toolMap[cmd]); log(toolMap[cmd].toUpperCase()); return; }
    if (cmd === "box" || cmd === "box3d") { add3D("box3d"); return; }
    if (cmd === "sphere") { add3D("sphere3d"); return; }
    if (cmd === "cyl" || cmd === "cylinder") { add3D("cylinder3d"); return; }
    if (cmd === "cone") { add3D("cone3d"); return; }
    if (cmd === "torus") { add3D("torus3d"); return; }
    if (cmd === "plane") { add3D("plane3d"); return; }
    if (cmd === "capsule") { add3D("capsule3d"); return; }
    if (cmd === "room") { genArchitecture("room_gen"); return; }
    if (cmd === "wall") { genArchitecture("wall"); return; }
    if (cmd === "roof") { genArchitecture("roof_gen"); return; }
    if (cmd === "floor") { genArchitecture("floor_gen"); return; }
    if (cmd === "clear" || cmd === "cls") { setEntities([]); setObjs3d([]); pushHist([]); logCmd("Cleared"); return; }
    if (cmd === "2d") { setVp("2d"); logCmd("Switched to 2D"); return; }
    if (cmd === "3d") { setVp("3d"); logCmd("Switched to 3D"); return; }
    if (cmd === "undo" || cmd === "u") { undo(); return; }
    if (cmd === "redo") { redo(); return; }
    if (cmd === "del" || cmd === "delete") { del3D(); return; }
    if (cmd === "dup" || cmd === "duplicate") { duplicate3D(); return; }
    if (cmd === "zoomfit" || cmd === "ze") { setZoom(1); setPan2d({ x: csz.w / 2, y: csz.h / 2 }); return; }
    if (cmd === "grid") { setShowGrid3d(g => !g); return; }
    if (cmd === "wireframe") { setVisualStyle("wireframe"); return; }
    if (cmd === "shaded") { setVisualStyle("shaded"); return; }
    if (cmd === "realistic") { setVisualStyle("realistic"); return; }
    if (cmd === "help" || cmd === "?") {
      log("Commands: box sphere cyl cone torus plane capsule wall roof floor room clear 2d 3d undo redo del dup wireframe shaded realistic grid");
      log("Hotkeys: Del=delete Tab=editmode G=move R=rotate S=scale 1/3/7=views Ctrl+D=duplicate Ctrl+Z=undo Space=play");
      return;
    }
    log(`Unknown: "${cmd}". Type 'help' for commands.`);
  };

  // ── Computed ───────────────────────────────────────────────────────────
  const selObjs3d = objs3d.filter(o => selIds3d.includes(o.id));
  const selEnt2d = entities.filter(e => selIds2d.includes(e.id));
  const firstSel3d = selObjs3d[0];

  const activeTransformMode = viewportTool === "gizmo_move" ? "move"
    : viewportTool === "gizmo_rotate" ? "rotate"
    : viewportTool === "gizmo_scale" ? "scale"
    : transformMode;

  // ── Style constants ────────────────────────────────────────────────────
  const acBg = "#2d2d30", acRibBg = "#3c3c3c", acDark = "#1e1e1e";
  const acBorder = "#1a1a1a", acText = "#cccccc", acLt = "#ffffff";
  const acDim = "#777", acBlue = "#0078d4", acGreen = "#4ec94e";

  const sRBtn = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 0, width: 38, height: 42, borderRadius: 3, cursor: "pointer",
    background: active ? "#0078d4" : "transparent",
    border: `1px solid ${active ? "#0078d4" : "transparent"}`,
    color: active ? "#fff" : acText, padding: "2px 1px",
    transition: "all 0.1s",
  });

  const sPropRow = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "3px 8px", borderBottom: `1px solid #111`, fontSize: 10,
  };

  const sInput = {
    width: 65, background: "#111", color: "#fff", border: "1px solid #444",
    fontSize: 10, padding: "1px 3px", borderRadius: 2,
  };

  const sNumInput = {
    width: 58, background: "#111", color: "#fff", border: "1px solid #333",
    fontSize: 10, padding: "2px 4px", borderRadius: 2, outline: "none",
    textAlign: "right",
  };

  // ── Outliner tree renderer (NEW enhanced) ──────────────────────────────
  const renderOutlinerTree = (nodes, depth = 0) => nodes.map(node => (
    <div key={node.id}>
      <div onClick={() => { setSelNodeId(node.id); if (node.type !== "root") setSelIds3d([node.id]); }}
        style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "2px 4px 2px " + (6 + depth * 14) + "px",
          cursor: "pointer", fontSize: 10,
          background: selNodeId === node.id ? "#213d5c" : "transparent",
          borderLeft: selNodeId === node.id ? "2px solid #4d9bff" : "2px solid transparent",
          color: node.visible === false ? "#555" : acText,
        }}
        onMouseEnter={e => { if (selNodeId !== node.id) e.currentTarget.style.background = "#1a2a3a"; }}
        onMouseLeave={e => { if (selNodeId !== node.id) e.currentTarget.style.background = "transparent"; }}>
        {/* Expand toggle */}
        <span onClick={ev => { ev.stopPropagation(); setExpandedNodes(s => { const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
          style={{ cursor: "pointer", color: acDim, fontSize: 8, width: 10, flexShrink: 0, textAlign: "center" }}>
          {node.children?.length > 0 ? (expandedNodes.has(node.id) ? "▼" : "▶") : ""}
        </span>
        {/* Icon */}
        <span style={{ fontSize: 10, flexShrink: 0 }}>
          {node.type === "root" ? "📁" : node.type?.includes("3d") ? "⬡" : node.type === "light" ? "💡" : "◻"}
        </span>
        {/* Name */}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10 }}>{node.name}</span>
        {/* Visibility toggle */}
        <span onClick={ev => { ev.stopPropagation(); setSceneNodes(prev => {
          const toggle = (nodes) => nodes.map(n => n.id === node.id ? { ...n, visible: !n.visible } : { ...n, children: toggle(n.children || []) });
          return toggle(prev);
        }); }}
          style={{ cursor: "pointer", color: node.visible !== false ? "#aaa" : "#444", fontSize: 10, flexShrink: 0, padding: "0 2px" }}
          title="Toggle Visibility">
          👁
        </span>
        {/* Selectability toggle */}
        <span onClick={ev => { ev.stopPropagation(); setSceneNodes(prev => {
          const toggle = (nodes) => nodes.map(n => n.id === node.id ? { ...n, selectable: !n.selectable } : { ...n, children: toggle(n.children || []) });
          return toggle(prev);
        }); }}
          style={{ cursor: "pointer", color: node.selectable !== false ? "#aaa" : "#444", fontSize: 9, flexShrink: 0, padding: "0 2px" }}
          title="Toggle Selectability">
          ⊙
        </span>
      </div>
      {expandedNodes.has(node.id) && node.children?.length > 0 && renderOutlinerTree(node.children, depth + 1)}
    </div>
  ));

  const curRibbonGroups = RIBBON[ribbonTab] || RIBBON.Home;

  // ── Viewport left toolbar tools ─────────────────────────────────────
  const viewportLeftTools = [
    { id: "select", icon: TOOL_ICONS.select, label: "Select (S)", shortcut: "S" },
    { id: "cursor3d", icon: TOOL_ICONS.cursor3d, label: "Cursor (C)", shortcut: "C" },
    { id: "gizmo_move", icon: TOOL_ICONS.gizmo_move, label: "Move (G)", shortcut: "G" },
    { id: "gizmo_rotate", icon: TOOL_ICONS.gizmo_rotate, label: "Rotate (R)", shortcut: "R" },
    { id: "gizmo_scale", icon: TOOL_ICONS.gizmo_scale, label: "Scale (S)", shortcut: "S" },
    null, // separator
    { id: "gizmo_annotate", icon: TOOL_ICONS.gizmo_annotate, label: "Annotate", shortcut: "" },
    { id: "gizmo_measure", icon: TOOL_ICONS.gizmo_measure, label: "Measure", shortcut: "" },
  ];

  // ── Top menu items ──────────────────────────────────────────────────
  const topMenus = {
    File: ["New", "Open...", "Open Recent", "---", "Save", "Save As...", "---", "Import...", "Export...", "---", "Quit"],
    Edit: ["Undo", "Redo", "---", "Select All", "Deselect All", "Invert Selection", "---", "Preferences..."],
    Render: ["Render Image", "Render Animation", "---", "View Render", "View Animation", "---", "Render Settings"],
    Window: ["New Window", "Toggle Full Screen", "---", "Workspaces"],
    Help: ["Manual", "Tutorials", "---", "Report Bug", "---", "About 3DCAD Studio Pro"],
  };

  const getStatusBarTip = () => {
    if (vp === "3d") {
      if (isGizmoDragging) return `Dragging ${gizmoAxis?.toUpperCase() || ""} axis | Release to confirm`;
      if (hoveredGizmoAxis) return `Click & drag to ${activeTransformMode} on ${hoveredGizmoAxis.toUpperCase()} axis`;
      if (viewportTool === "select") return "LMB: Select | Shift+LMB: Multi-select | RMB+Drag: Orbit | Scroll: Zoom";
      if (viewportTool === "gizmo_move") return "Drag X/Y/Z arrows to move | Drag center to free move";
      if (viewportTool === "gizmo_rotate") return "Drag rotation rings to rotate | X=red Y=green Z=blue";
      if (viewportTool === "gizmo_scale") return "Drag axis cubes to scale | Drag center for uniform scale";
      return `Tool: ${viewportTool} | Drag: Orbit | Scroll: Zoom | Del: Delete | Tab: Edit Mode`;
    }
    return `Tool: ${TOOL_LABEL[tool] || tool} | Layer: ${layer} | Zoom: ${(zoom * 100).toFixed(0)}% | F7: Grid F8: Ortho F9: Snap`;
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100vw", height: "100vh",
      background: "#2d2d30", color: acText,
      fontFamily: "'Segoe UI', 'SF Pro Text', Tahoma, sans-serif",
      fontSize: 11, overflow: "hidden", userSelect: "none",
    }} onClick={() => setOpenMenu(null)}>

      {/* ══ [1] TOP BAR — Blender-style main menu + workspaces ══════════════ */}
      <div style={{
        display: "flex", alignItems: "center", background: "#1a1a1a",
        borderBottom: `1px solid #000`, height: 26, flexShrink: 0, padding: "0", gap: 0, position: "relative", zIndex: 100,
      }} onClick={e => e.stopPropagation()}>

        {/* App logo */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 26, background: "#c00000", cursor: "pointer",
          color: "#fff", fontSize: 13, fontWeight: "bold", flexShrink: 0,
        }}>3D</div>

        {/* ── File/Edit/etc menus ── */}
        {Object.entries(topMenus).map(([menuName, items]) => (
          <div key={menuName} style={{ position: "relative" }}>
            <div onClick={() => setOpenMenu(openMenu === menuName ? null : menuName)}
              style={{
                padding: "0 10px", cursor: "pointer", height: 26, display: "flex", alignItems: "center",
                fontSize: 11, color: openMenu === menuName ? "#fff" : "#ccc",
                background: openMenu === menuName ? "#0078d4" : "transparent",
              }}
              onMouseEnter={e => { if (openMenu) setOpenMenu(menuName); }}>
              {menuName}
            </div>
            {openMenu === menuName && (
              <div style={{
                position: "absolute", top: 26, left: 0, background: "#252525",
                border: "1px solid #444", borderRadius: "0 3px 3px 3px", minWidth: 160, zIndex: 9999,
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}>
                {items.map((item, i) => item === "---" ? (
                  <div key={i} style={{ height: 1, background: "#3a3a3a", margin: "2px 0" }} />
                ) : (
                  <div key={item} onClick={() => {
                    setOpenMenu(null);
                    if (item === "Undo") undo();
                    else if (item === "Redo") redo();
                    else if (item === "New") { setEntities([]); setObjs3d([]); pushHist([]); }
                    else if (item === "Select All") { setSelIds3d(objs3d.map(o => o.id)); }
                    else if (item === "Deselect All") { setSelIds3d([]); }
                    else if (item === "Render Image") { logCmd("Render: Feature not yet available"); }
                  }}
                    style={{
                      padding: "5px 12px", cursor: "pointer", fontSize: 11, color: "#ccc", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0078d4"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ width: 1, height: 14, background: "#444", margin: "0 4px" }} />

        {/* Quick action buttons */}
        {[
          { icon: "M3 12a9 9 0 1 0 18 0M3 12l3-3M3 12l3 3", title: "Undo", action: undo },
          { icon: "M21 12a9 9 0 1 1-18 0M21 12l-3-3M21 12l-3 3", title: "Redo", action: redo },
        ].map((b, i) => (
          <button key={i} title={b.title} onClick={b.action}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer", borderRadius: 2 }}>
            <Ic d={b.icon} s={12} />
          </button>
        ))}

        <div style={{ width: 1, height: 14, background: "#444", margin: "0 4px" }} />

        {/* ── Workspace tabs (Blender-style) ── */}
        <div style={{ display: "flex", height: 26, alignItems: "stretch", flex: 1, overflow: "hidden" }}>
          {WORKSPACES.map(ws => (
            <div key={ws} onClick={() => { setActiveWorkspace(ws); if (ws === "Modeling") setRibbonTab("Modeling"); else if (ws === "Sculpting") setRibbonTab("Modeling"); else if (ws === "Shading") setRibbonTab("Lighting"); else if (ws === "Animation") setBottomTab("timeline"); }}
              style={{
                padding: "0 10px", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center",
                color: activeWorkspace === ws ? "#fff" : "#999",
                borderBottom: activeWorkspace === ws ? "2px solid #e87d0d" : "2px solid transparent",
                borderRight: "1px solid #2a2a2a",
                background: activeWorkspace === ws ? "#2d2d30" : "transparent",
                whiteSpace: "nowrap",
              }}>
              {ws}
            </div>
          ))}
        </div>

        {/* Viewport toggle */}
        <div style={{ display: "flex", marginRight: 4, gap: 2 }}>
          {["2d", "3d"].map(v => (
            <button key={v} onClick={() => setVp(v)} style={{
              padding: "2px 8px", background: vp === v ? "#0078d4" : "#333",
              color: vp === v ? "#fff" : "#999", border: `1px solid ${vp === v ? "#0078d4" : "#555"}`,
              borderRadius: 2, cursor: "pointer", fontSize: 10, fontWeight: "bold", height: 20,
            }}>{v.toUpperCase()}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #444", borderRadius: 2, padding: "2px 6px", gap: 4, marginRight: 4, width: 130 }}>
          <Ic d="M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" s={10} c="#666" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..."
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 10, outline: "none", width: 80 }} />
        </div>
      </div>

      {/* ══ RIBBON TABS ═══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-end", background: acBg, borderBottom: `1px solid ${acBorder}`, height: 24, padding: "0 4px", flexShrink: 0 }}>
        {Object.keys(RIBBON).map(tab => (
          <div key={tab} onClick={() => setRibbonTab(tab)} style={{
            padding: "3px 10px", cursor: "pointer", fontSize: 10,
            background: ribbonTab === tab ? acRibBg : "transparent",
            color: ribbonTab === tab ? acLt : acDim,
            borderTop: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
            borderLeft: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
            borderRight: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
            borderBottom: ribbonTab === tab ? `1px solid ${acRibBg}` : "1px solid transparent",
            borderRadius: "3px 3px 0 0", marginBottom: ribbonTab === tab ? -1 : 0, zIndex: ribbonTab === tab ? 2 : 1, position: "relative",
          }}>{tab}</div>
        ))}
        <div style={{ flex: 1 }} />
        {[
          { label: "SNAP", active: snap, action: () => setSnap(s => !s) },
          { label: "GRID", active: grid || showGrid3d, action: () => { setGrid(g => !g); setShowGrid3d(g => !g); } },
          { label: "ORTHO", active: orthoOn, action: () => setOrthoOn(o => !o) },
          { label: "DYN", active: dynInput, action: () => setDynInput(d => !d) },
        ].map(b => (
          <div key={b.label} onClick={b.action} style={{
            padding: "0 6px", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center",
            color: b.active ? "#00d4ff" : acDim, fontWeight: b.active ? "bold" : "normal",
            borderLeft: "1px solid #444",
          }}>{b.label}</div>
        ))}
      </div>

      {/* ══ RIBBON CONTENT ════════════════════════════════════════════════ */}
      <div style={{
        background: acRibBg, borderBottom: `2px solid ${acBorder}`,
        display: "flex", flexShrink: 0, height: 66, overflowX: "auto", alignItems: "stretch",
      }}>
        {Object.entries(curRibbonGroups).map(([grpName, tools]) => (
          <div key={grpName} style={{
            display: "flex", flexDirection: "column", padding: "2px 4px 0 4px",
            borderRight: `1px solid #555`, minWidth: 40,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 1, flex: 1, alignContent: "flex-start", paddingTop: 1 }}>
              {tools.map(tid => {
                const icon = TOOL_ICONS[tid];
                const label = TOOL_LABEL[tid] || tid;
                const isActive = tool === tid || visualStyle === tid || editMode === tid;
                const is3DPrim = ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"].includes(tid);
                const isArch = ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].includes(tid);
                const isLight = ["light_point", "light_spot", "light_dir", "light_sun", "light_ambient"].includes(tid);
                const isEnv = ["sky_day", "sky_sunset", "sky_night", "env_fog", "env_water", "env_grass"].includes(tid);
                const isEditMode = ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].includes(tid);
                const isVisual = ["wireframe", "hidden", "conceptual", "realistic", "shaded", "xray"].includes(tid);
                const isView = ["viewtop", "viewfront", "viewright", "viewiso"].includes(tid);
                const isMeasure = ["measure_dist", "measure_area", "measure_angle"].includes(tid);

                return (
                  <div key={tid} style={sRBtn(isActive)} title={label}
                    onClick={() => {
                      if (is3DPrim) { add3D(tid); return; }
                      if (isArch) { genArchitecture(tid); return; }
                      if (isLight) { addLight(tid.replace("light_", "")); return; }
                      if (isEnv) {
                        if (tid === "sky_day") setEnvSettings(e => ({ ...e, skybox: "day" }));
                        else if (tid === "sky_sunset") setEnvSettings(e => ({ ...e, skybox: "sunset" }));
                        else if (tid === "sky_night") setEnvSettings(e => ({ ...e, skybox: "night" }));
                        else if (tid === "env_fog") setEnvSettings(e => ({ ...e, fog: !e.fog }));
                        else if (tid === "env_water") setEnvSettings(e => ({ ...e, water: !e.water }));
                        else if (tid === "env_grass") setEnvSettings(e => ({ ...e, grass: !e.grass }));
                        setVp("3d"); return;
                      }
                      if (isEditMode) { setEditMode(tid); return; }
                      if (isVisual) { setVisualStyle(tid); setVp("3d"); return; }
                      if (isView) {
                        const a = { viewtop: [0, 1.5], viewfront: [0, 0], viewright: [1.57, 0], viewiso: [0.6, 0.5] };
                        const [ang, pitch] = a[tid] || [0.6, 0.5];
                        setCamAngle(ang); setCamPitch(pitch); setVp("3d"); return;
                      }
                      if (tid === "toggle_grid") { setShowGrid3d(g => !g); return; }
                      if (tid === "toggle_axes") { setShowAxes3d(a => !a); return; }
                      if (tid === "toggle_measure") { setShowMeasure3d(m => !m); return; }
                      if (tid === "zoomfit") { setZoom(1); setPan2d({ x: csz.w / 2, y: csz.h / 2 }); return; }
                      if (tid === "orbit3d") { setVp("3d"); return; }
                      if (tid === "reset_cam") { setCamAngle(0.6); setCamPitch(0.5); setCamDist(400); return; }
                      if (tid === "union3d" || tid === "subtract3d" || tid === "intersect3d") {
                        logCmd(`Boolean ${tid} — select 2+ objects first`); return;
                      }
                      if (tid === "extrude3d" || tid === "revolve3d" || tid === "shell3d") {
                        logCmd(`${TOOL_LABEL[tid]} — select a mesh first`); return;
                      }
                      if (isMeasure) { logCmd(`${TOOL_LABEL[tid]} tool active — click objects`); return; }
                      setTool(tid); resetDraw();
                    }}>
                    {icon ? <Ic d={icon} s={14} c={isActive ? "#fff" : acText} /> : <span style={{ fontSize: 9 }}>{label.slice(0, 3)}</span>}
                    <span style={{ fontSize: 7.5, textAlign: "center", lineHeight: 1, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 36 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 8, color: acDim, textAlign: "center", paddingTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{grpName}</div>
          </div>
        ))}

        {/* Quick props */}
        <div style={{ display: "flex", flexDirection: "column", padding: "4px 6px", marginLeft: "auto", minWidth: 120, borderLeft: `1px solid #555` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: acDim, width: 38 }}>Color</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 22, height: 14, border: "1px solid #555", padding: 0, cursor: "pointer", background: "transparent" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: acDim, width: 38 }}>Material</span>
            <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)}
              style={{ background: acDark, color: acText, border: "1px solid #555", fontSize: 8, padding: "0 1px", flex: 1 }}>
              {Object.keys(MATERIALS).map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: acDim, width: 38 }}>Layer</span>
            <select value={layer} onChange={e => setLayer(e.target.value)}
              style={{ background: acDark, color: acText, border: "1px solid #555", fontSize: 8, padding: "0 1px", flex: 1 }}>
              {layers.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 8, color: acDim, marginTop: "auto", textAlign: "center", textTransform: "uppercase" }}>Props</div>
        </div>
      </div>

      {/* ══ WORKSPACE ══════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <div style={{ width: 180, background: acDark, borderRight: `1px solid ${acBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", background: acBg, borderBottom: `1px solid ${acBorder}`, flexShrink: 0 }}>
            {[{ id: "tools", l: "Tools" }, { id: "assets", l: "Assets" }, { id: "scene", l: "Scene" }].map(t => (
              <div key={t.id} onClick={() => setSidebarTab(t.id)} style={{
                flex: 1, textAlign: "center", padding: "4px 0", cursor: "pointer", fontSize: 9,
                color: sidebarTab === t.id ? acLt : acDim,
                borderBottom: sidebarTab === t.id ? "2px solid #0078d4" : "2px solid transparent",
              }}>{t.l}</div>
            ))}
          </div>

          {sidebarTab === "tools" && (
            <div style={{ overflow: "auto", flex: 1, padding: 4 }}>
              {[
                { label: "SELECT", tools: [{ id: "select", icon: TOOL_ICONS.select, label: "Select" }] },
                { label: "TRANSFORM", tools: [{ id: "move", icon: TOOL_ICONS.move, label: "Move (G)" }, { id: "rotate", icon: TOOL_ICONS.rotate, label: "Rotate (R)" }, { id: "scale", icon: TOOL_ICONS.scale, label: "Scale (S)" }] },
                { label: "PRIMITIVES", tools: ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "plane3d", "capsule3d", "pyramid3d"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "ARCHITECTURE", tools: ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "LIGHTS", tools: ["light_point", "light_spot", "light_dir", "light_sun"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "CAMERA", tools: [{ id: "orbit3d", icon: TOOL_ICONS.orbit3d, label: "Orbit" }, { id: "pan", icon: TOOL_ICONS.pan, label: "Pan" }, { id: "reset_cam", icon: TOOL_ICONS.reset_cam, label: "Reset" }] },
                { label: "EDIT MODE", tools: ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
              ].map(group => (
                <div key={group.label} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 8, color: acDim, padding: "2px 2px", letterSpacing: "0.06em", borderBottom: `1px solid #2a2a2a`, marginBottom: 2 }}>{group.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {group.tools.map(t => {
                      const isActive = tool === t.id || visualStyle === t.id || editMode === t.id;
                      return (
                        <div key={t.id} title={t.label}
                          onClick={() => {
                            const is3DPrim2 = ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"].includes(t.id);
                            const isArch2 = ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].includes(t.id);
                            const isLt2 = ["light_point", "light_spot", "light_dir", "light_sun"].includes(t.id);
                            const isEM = ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].includes(t.id);
                            if (is3DPrim2) { add3D(t.id); return; }
                            if (isArch2) { genArchitecture(t.id); return; }
                            if (isLt2) { addLight(t.id.replace("light_", "")); return; }
                            if (isEM) { setEditMode(t.id); return; }
                            if (t.id === "reset_cam") { setCamAngle(0.6); setCamPitch(0.5); setCamDist(400); return; }
                            setTool(t.id); resetDraw();
                          }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            width: 40, height: 38, borderRadius: 3, cursor: "pointer", gap: 1,
                            background: isActive ? "#0078d4" : "#2a2a2a",
                            border: `1px solid ${isActive ? "#0078d4" : "#444"}`,
                            color: isActive ? "#fff" : acText,
                          }}>
                          {t.icon ? <Ic d={t.icon} s={14} c={isActive ? "#fff" : acText} /> : <span style={{ fontSize: 10 }}>{t.label.slice(0, 2)}</span>}
                          <span style={{ fontSize: 7, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 38 }}>{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selIds3d.length > 0 && (
                <div style={{ borderTop: `1px solid #333`, marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: 8, color: acDim, marginBottom: 4 }}>SELECTION ({selIds3d.length})</div>
                  {[
                    { l: "Duplicate", a: duplicate3D },
                    { l: "Mirror X", a: () => mirror3D("x") },
                    { l: "Mirror Z", a: () => mirror3D("z") },
                    { l: "Delete", a: del3D },
                  ].map(b => (
                    <button key={b.l} onClick={b.a} style={{
                      display: "block", width: "100%", marginBottom: 2, padding: "3px 6px",
                      background: b.l === "Delete" ? "#661111" : "#2a3a4a", border: `1px solid #444`,
                      color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9, textAlign: "left",
                    }}>{b.l}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {sidebarTab === "assets" && (
            <div style={{ overflow: "auto", flex: 1 }}>
              {Object.entries(ASSET_LIBRARY).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{ fontSize: 8, color: acDim, padding: "4px 6px 2px", background: "#1a1a1a", borderBottom: `1px solid #111`, letterSpacing: "0.06em" }}>{cat.toUpperCase()}</div>
                  {items.map(asset => (
                    <div key={asset.id} onClick={() => addFromLibrary(asset)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                        cursor: "pointer", borderBottom: `1px solid #111`, fontSize: 10,
                        color: acText,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a3a5a"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ width: 10, height: 10, background: asset.color, borderRadius: 2, flexShrink: 0, display: "inline-block", border: "1px solid #666" }} />
                      <span style={{ flex: 1 }}>{asset.label}</span>
                      <span style={{ fontSize: 8, color: acDim }}>+</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {sidebarTab === "scene" && (
            <div style={{ overflow: "auto", flex: 1 }}>
              <div style={{ fontSize: 8, color: acDim, padding: "4px 6px", background: "#1a1a1a", borderBottom: `1px solid #111` }}>SCENE HIERARCHY</div>
              {renderOutlinerTree(sceneNodes)}
              <div style={{ borderTop: `1px solid #222`, padding: "4px 8px" }}>
                <div style={{ fontSize: 8, color: acDim, marginBottom: 4 }}>OBJECTS: {objs3d.length}</div>
                {objs3d.map(o => (
                  <div key={o.id} onClick={() => setSelIds3d(prev => prev.includes(o.id) ? prev.filter(i => i !== o.id) : [...prev, o.id])}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "2px 4px",
                      cursor: "pointer", borderRadius: 2, marginBottom: 1, fontSize: 9,
                      background: selIds3d.includes(o.id) ? "#1a3a5a" : "transparent",
                      borderLeft: selIds3d.includes(o.id) ? "2px solid #0078d4" : "2px solid transparent",
                    }}>
                    <span style={{ width: 8, height: 8, background: o.material?.color || o.color, borderRadius: 1, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shape.replace("3d", "")}</span>
                    <span style={{ color: acDim, fontSize: 8 }}>#{o.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTRAL: Viewport + gizmo toolbar ──────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* [6] LEFT VIEWPORT TOOLBAR (Blender-style) */}
          {vp === "3d" && (
            <div style={{
              width: 34, background: "#212121", borderRight: "1px solid #111",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "4px 0", gap: 2, flexShrink: 0, overflowY: "auto",
            }}>
              {viewportLeftTools.map((t, i) => t === null ? (
                <div key={`sep-${i}`} style={{ width: 20, height: 1, background: "#333", margin: "3px 0" }} />
              ) : (
                <div key={t.id} title={`${t.label}`}
                  onClick={() => {
                    setViewportTool(t.id);
                    if (t.id === "gizmo_move") setTransformMode("move");
                    else if (t.id === "gizmo_rotate") setTransformMode("rotate");
                    else if (t.id === "gizmo_scale") setTransformMode("scale");
                  }}
                  style={{
                    width: 28, height: 28, borderRadius: 4, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: viewportTool === t.id ? "#0078d4" : "transparent",
                    border: `1px solid ${viewportTool === t.id ? "#3399ff" : "transparent"}`,
                    color: viewportTool === t.id ? "#fff" : "#aaa",
                  }}
                  onMouseEnter={e => { if (viewportTool !== t.id) e.currentTarget.style.background = "#2a2a2a"; }}
                  onMouseLeave={e => { if (viewportTool !== t.id) e.currentTarget.style.background = "transparent"; }}>
                  {t.icon ? <Ic d={t.icon} s={14} c={viewportTool === t.id ? "#fff" : "#aaa"} /> : <span style={{ fontSize: 9 }}>{t.label.slice(0, 2)}</span>}
                </div>
              ))}

              {/* Separator */}
              <div style={{ width: 20, height: 1, background: "#333", margin: "3px 0" }} />

              {/* Visual style quick toggle */}
              {["wireframe", "shaded", "realistic"].map(vs => (
                <div key={vs} title={vs} onClick={() => setVisualStyle(vs)}
                  style={{
                    width: 28, height: 22, borderRadius: 3, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: visualStyle === vs ? "#334" : "transparent",
                    border: `1px solid ${visualStyle === vs ? "#446" : "transparent"}`,
                    fontSize: 7, color: visualStyle === vs ? "#aaf" : "#666",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                  {vs.slice(0, 3)}
                </div>
              ))}
            </div>
          )}

          {/* ── CANVAS ──────────────────────────────────────────────── */}
          <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative", background: vp === "3d" ? "#111" : "#414141" }}>
            <canvas ref={canvasRef} width={csz.w} height={csz.h}
              style={{
                display: "block", width: "100%", height: "100%",
                cursor: isGizmoDragging ? "grabbing"
                  : hoveredGizmoAxis ? (activeTransformMode === "rotate" ? "crosshair" : activeTransformMode === "scale" ? "nwse-resize" : "grab")
                  : vp === "3d" ? (orbiting ? "grabbing" : tool === "pan" ? "all-scroll" : "default")
                  : (tool === "pan" || isDrag ? "grabbing" : "crosshair"),
              }}
              onMouseMove={onMouseMove}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onDoubleClick={onDblClick}
              onWheel={onWheel}
              onContextMenu={onCtxMenu}
            />

            {/* [6] TOP-RIGHT VIEWPORT NAV WIDGETS */}
            {vp === "3d" && (
              <div style={{ position: "absolute", right: 10, top: 10, display: "flex", flexDirection: "column", gap: 6, zIndex: 10 }}>
                {/* Gizmo axis tracker */}
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(20,20,20,0.7)", border: "1px solid #333",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", cursor: "pointer",
                }} title="Camera Orientation Gizmo">
                  <svg width="54" height="54" viewBox="0 0 54 54">
                    {[
                      { label: "X", x: 44, y: 27, ax: "#ff4444" },
                      { label: "Y", x: 27, y: 10, ax: "#44dd44" },
                      { label: "Z", x: 10, y: 44, ax: "#4488ff" },
                      { label: "-X", x: 10, y: 27, ax: "#884444" },
                      { label: "-Y", x: 27, y: 44, ax: "#448844" },
                      { label: "-Z", x: 44, y: 10, ax: "#448888" },
                    ].map(a => (
                      <g key={a.label}>
                        <line x1="27" y1="27" x2={a.x} y2={a.y} stroke={a.ax} strokeWidth="1.5" />
                        <circle cx={a.x} cy={a.y} r="5" fill={a.ax} opacity="0.85"
                          onClick={() => {
                            if (a.label === "X") { setCamAngle(0); setCamPitch(0); }
                            else if (a.label === "Y") { setCamAngle(0); setCamPitch(1.5); }
                            else if (a.label === "Z") { setCamAngle(Math.PI / 2); setCamPitch(0); }
                            else if (a.label === "-X") { setCamAngle(Math.PI); setCamPitch(0); }
                            else if (a.label === "-Y") { setCamAngle(0); setCamPitch(-1.5); }
                            else if (a.label === "-Z") { setCamAngle(-Math.PI / 2); setCamPitch(0); }
                          }} style={{ cursor: "pointer" }} />
                        <text x={a.x} y={a.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="4" fontWeight="bold" style={{ pointerEvents: "none" }}>{a.label}</text>
                      </g>
                    ))}
                    <circle cx="27" cy="27" r="3" fill="#ffffff88" />
                  </svg>
                </div>

                {/* Nav buttons */}
                <div style={{ background: "rgba(20,20,20,0.85)", border: "1px solid #444", borderRadius: 4, overflow: "hidden" }}>
                  {[
                    { icon: "M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0", title: "Zoom", action: () => setCamDist(400) },
                    { icon: "M12 2v20M2 12h20", title: "Pan", action: () => setTool("pan") },
                    { icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z", title: "Camera View", action: () => { setCamAngle(0.6); setCamPitch(0.3); } },
                  ].map((b, i) => (
                    <div key={i} title={b.title} onClick={b.action}
                      style={{
                        width: 28, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", borderBottom: i < 2 ? "1px solid #333" : "none",
                        color: "#999",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2a2a3a"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Ic d={b.icon} s={14} c="#aaa" />
                    </div>
                  ))}
                </div>

                {/* Perspective toggle */}
                <div onClick={() => setIsPerspective(p => !p)}
                  style={{
                    background: "rgba(20,20,20,0.85)", border: "1px solid #444", borderRadius: 4,
                    padding: "3px 6px", cursor: "pointer", fontSize: 9, color: "#bbb", textAlign: "center",
                  }}
                  title="Toggle Perspective/Orthographic">
                  {isPerspective ? "PERSP" : "ORTHO"}
                </div>

                {/* Visual style panel */}
                <div style={{ background: "rgba(20,20,20,0.9)", border: "1px solid #444", borderRadius: 4, padding: 4 }}>
                  <div style={{ fontSize: 8, color: acDim, textAlign: "center", marginBottom: 2 }}>VISUAL</div>
                  {["wireframe", "shaded", "realistic", "conceptual", "xray"].map(vs => (
                    <div key={vs} onClick={() => setVisualStyle(vs)}
                      style={{ fontSize: 9, cursor: "pointer", padding: "2px 6px", borderRadius: 2, background: visualStyle === vs ? "#0078d4" : "transparent", color: visualStyle === vs ? "#fff" : "#bbb" }}>
                      {vs}
                    </div>
                  ))}
                </div>

                {/* Camera presets */}
                <div style={{ background: "rgba(20,20,20,0.9)", border: "1px solid #444", borderRadius: 4, padding: 4 }}>
                  <div style={{ fontSize: 8, color: acDim, textAlign: "center", marginBottom: 2 }}>VIEWS</div>
                  {[["ISO", 0.6, 0.5], ["TOP", 0, 1.5], ["FRONT", 0, 0], ["RIGHT", 1.57, 0]].map(([l, a, p]) => (
                    <div key={l} onClick={() => { setCamAngle(a); setCamPitch(p); }}
                      style={{ fontSize: 9, cursor: "pointer", padding: "2px 6px", borderRadius: 2, background: "rgba(255,255,255,0.06)", color: "#bbb", textAlign: "center", marginBottom: 1 }}>
                      {l}
                    </div>
                  ))}
                  <div onClick={() => { setCamAngle(0.6); setCamPitch(0.5); setCamDist(400); }}
                    style={{ fontSize: 8, cursor: "pointer", padding: "2px 6px", background: "rgba(255,255,255,0.06)", color: "#bbb", textAlign: "center", borderRadius: 2 }}>
                    Reset
                  </div>
                </div>
              </div>
            )}

            {/* Info overlay */}
            {vp === "2d" && (
              <div style={{ position: "absolute", right: 10, top: 10, background: "rgba(30,30,30,0.85)", border: "1px solid #444", borderRadius: 3, padding: "3px 8px", fontSize: 9, color: "#bbb", pointerEvents: "none" }}>
                Zoom: {(zoom * 100).toFixed(0)}%  Objects: {entities.length}
              </div>
            )}
            {vp === "3d" && (
              <div style={{ position: "absolute", left: 44, bottom: 10, background: "rgba(20,20,20,0.85)", border: "1px solid #333", borderRadius: 3, padding: "3px 8px", fontSize: 9, color: "#bbb", pointerEvents: "none" }}>
                {editMode !== "obj_mode" ? `✎ ${editMode.replace("_", " ").toUpperCase()} | ` : ""}
                {viewportTool !== "select" ? `${TOOL_LABEL[viewportTool] || viewportTool} | ` : ""}
                Style: {visualStyle} | Objects: {objs3d.length} | {isPerspective ? "Perspective" : "Orthographic"}
              </div>
            )}

            {/* Gizmo drag hint */}
            {isGizmoDragging && (
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                background: "rgba(0,0,0,0.7)", border: "1px solid #0078d4", borderRadius: 4,
                padding: "6px 14px", fontSize: 11, color: "#fff", pointerEvents: "none",
              }}>
                {activeTransformMode.toUpperCase()} on {gizmoAxis?.toUpperCase() || "XZ"}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Outliner + Properties ──────────────────────── */}
        <div style={{ width: 240, background: acDark, borderLeft: `1px solid ${acBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* ── [2] OUTLINER (top half) ── */}
          <div style={{ flex: "0 0 auto", maxHeight: "38%", display: "flex", flexDirection: "column", borderBottom: `2px solid #111` }}>
            <div style={{
              background: "#1a1a2a", padding: "4px 8px", borderBottom: "1px solid #111",
              fontSize: 10, fontWeight: "bold", color: "#8fa8d0", display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <span>📂 Outliner</span>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 9, color: acDim, cursor: "pointer" }} onClick={() => setObjs3d([])}>🗑</span>
                <span style={{ fontSize: 9, color: acDim, cursor: "pointer" }} onClick={() => add3D("box3d")}>＋</span>
              </div>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              {renderOutlinerTree(sceneNodes)}
              {objs3d.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a" }}>
                  {objs3d.map(o => (
                    <div key={o.id} onClick={() => setSelIds3d(prev => prev.includes(o.id) ? prev.filter(i => i !== o.id) : [...prev, o.id])}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "2px 8px",
                        cursor: "pointer", fontSize: 10,
                        background: selIds3d.includes(o.id) ? "#213d5c" : "transparent",
                        borderLeft: selIds3d.includes(o.id) ? "2px solid #4d9bff" : "2px solid transparent",
                        color: acText,
                      }}
                      onMouseEnter={e => { if (!selIds3d.includes(o.id)) e.currentTarget.style.background = "#1a2a3a"; }}
                      onMouseLeave={e => { if (!selIds3d.includes(o.id)) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 10, height: 10, background: o.material?.color || o.color, borderRadius: 1, flexShrink: 0, display: "inline-block", border: "1px solid #555" }} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shape.replace("3d", "").replace("_gen", "")}</span>
                      {/* visibility eye */}
                      <span style={{ color: "#666", fontSize: 10, cursor: "pointer" }}
                        onClick={ev => { ev.stopPropagation(); }}
                        title="Visibility">👁</span>
                      {/* selectability */}
                      <span style={{ color: "#666", fontSize: 9, cursor: "pointer" }}
                        onClick={ev => { ev.stopPropagation(); }}
                        title="Selectability">⊙</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── [3] PROPERTIES PANEL (bottom half) ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", background: acBg, borderBottom: `1px solid ${acBorder}`, flexShrink: 0 }}>
              {[{ id: "props", l: "Properties" }, { id: "material", l: "Material" }, { id: "layers", l: "Layers" }, { id: "physics", l: "Physics" }].map(t => (
                <div key={t.id} onClick={() => setRightTab(t.id)} style={{
                  flex: 1, textAlign: "center", padding: "4px 2px", cursor: "pointer", fontSize: 9,
                  color: rightTab === t.id ? acLt : acDim,
                  borderBottom: rightTab === t.id ? "2px solid #e87d0d" : "2px solid transparent",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{t.l}</div>
              ))}
            </div>

            <div style={{ overflow: "auto", flex: 1 }}>

              {/* ── PROPERTIES (with Transform: Location/Rotation/Scale) ── */}
              {rightTab === "props" && (
                <>
                  {vp === "3d" && firstSel3d ? (
                    <>
                      <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0", display: "flex", justifyContent: "space-between" }}>
                        <span>⬡ {firstSel3d.shape.replace("3d", "").toUpperCase()} #{firstSel3d.id}</span>
                        {selIds3d.length > 1 && <span style={{ color: acDim }}>+{selIds3d.length - 1}</span>}
                      </div>

                      {/* Transform: Location */}
                      <div style={{ padding: "5px 8px", borderBottom: `1px solid #1a1a1a` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "#aac", fontWeight: "bold" }}>▸ Transform</span>
                          <div style={{ display: "flex", gap: 2 }}>
                            {["move", "rotate", "scale"].map(m => (
                              <button key={m} onClick={() => { setTransformMode(m); setViewportTool(`gizmo_${m}`); }} style={{
                                padding: "1px 5px", background: activeTransformMode === m ? "#e87d0d" : "#2a2a2a",
                                border: `1px solid ${activeTransformMode === m ? "#e87d0d" : "#444"}`,
                                color: activeTransformMode === m ? "#fff" : "#aaa", borderRadius: 2, cursor: "pointer", fontSize: 8,
                              }}>{m[0].toUpperCase()}</button>
                            ))}
                          </div>
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: 4 }}>
                          <div style={{ fontSize: 9, color: "#8fa8d0", marginBottom: 2, fontWeight: "bold" }}>Location</div>
                          {[["X", "x", "#ff6666"], ["Y", "y", "#66dd66"], ["Z", "z", "#6688ff"]].map(([label, key, col]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, color: col, width: 10, fontWeight: "bold", flexShrink: 0 }}>{label}</span>
                              <input type="number" step="1"
                                value={(firstSel3d[key] || 0).toFixed(2)}
                                onChange={e => selIds3d.forEach(sid => upd3D(sid, { [key]: parseFloat(e.target.value) || 0 }))}
                                style={{ ...sNumInput, flex: 1, width: "auto", borderLeft: `2px solid ${col}` }} />
                            </div>
                          ))}
                        </div>

                        {/* Rotation */}
                        <div style={{ marginBottom: 4 }}>
                          <div style={{ fontSize: 9, color: "#8fa8d0", marginBottom: 2, fontWeight: "bold" }}>Rotation (°)</div>
                          {[["X", "rotX", "#ff6666"], ["Y", "rotY", "#66dd66"], ["Z", "rotZ", "#6688ff"]].map(([label, key, col]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, color: col, width: 10, fontWeight: "bold", flexShrink: 0 }}>{label}</span>
                              <input type="number" step="1"
                                value={((firstSel3d[key] || 0) * 180 / Math.PI).toFixed(1)}
                                onChange={e => selIds3d.forEach(sid => upd3D(sid, { [key]: (parseFloat(e.target.value) || 0) * Math.PI / 180 }))}
                                style={{ ...sNumInput, flex: 1, width: "auto", borderLeft: `2px solid ${col}` }} />
                            </div>
                          ))}
                        </div>

                        {/* Scale (dimensions) */}
                        <div>
                          <div style={{ fontSize: 9, color: "#8fa8d0", marginBottom: 2, fontWeight: "bold" }}>Scale / Dimensions</div>
                          {firstSel3d.w !== undefined && [["W", "w", "#ff6666"], ["H", "h", "#66dd66"], ["D", "d", "#6688ff"]].map(([label, key, col]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, color: col, width: 10, fontWeight: "bold", flexShrink: 0 }}>{label}</span>
                              <input type="number" step="1" min="1"
                                value={firstSel3d[key] || 1}
                                onChange={e => selIds3d.forEach(sid => upd3D(sid, { [key]: Math.max(0.1, parseFloat(e.target.value) || 1) }))}
                                style={{ ...sNumInput, flex: 1, width: "auto", borderLeft: `2px solid ${col}` }} />
                            </div>
                          ))}
                          {firstSel3d.r !== undefined && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, color: "#66ddff", width: 10, fontWeight: "bold", flexShrink: 0 }}>R</span>
                              <input type="number" step="1" min="1"
                                value={firstSel3d.r || 1}
                                onChange={e => selIds3d.forEach(sid => upd3D(sid, { r: Math.max(0.1, parseFloat(e.target.value) || 1) }))}
                                style={{ ...sNumInput, flex: 1, width: "auto", borderLeft: "2px solid #66ddff" }} />
                            </div>
                          )}
                          {firstSel3d.base !== undefined && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, color: "#dddd66", width: 16, fontWeight: "bold", flexShrink: 0 }}>B</span>
                              <input type="number" step="1" min="1"
                                value={firstSel3d.base || 1}
                                onChange={e => selIds3d.forEach(sid => upd3D(sid, { base: Math.max(0.1, parseFloat(e.target.value) || 1) }))}
                                style={{ ...sNumInput, flex: 1, width: "auto", borderLeft: "2px solid #dddd66" }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div style={{ padding: "4px 8px" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          <button onClick={duplicate3D} style={{ flex: 1, padding: "3px", background: "#1a3a5a", border: "1px solid #2a5a8a", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>Dup</button>
                          <button onClick={() => mirror3D("x")} style={{ flex: 1, padding: "3px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>MirX</button>
                          <button onClick={del3D} style={{ flex: 1, padding: "3px", background: "#5a1111", border: "1px solid #8a2222", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>Del</button>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, cursor: "pointer", fontSize: 9 }}>
                          <input type="checkbox" checked={!!firstSel3d.showMeasure} onChange={e => selIds3d.forEach(sid => upd3D(sid, { showMeasure: e.target.checked }))} />
                          Show measurements
                        </label>
                      </div>
                    </>
                  ) : vp === "3d" ? (
                    <>
                      <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0" }}>3D Scene Info</div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Objects</span><span>{objs3d.length}</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Lights</span><span>{lights.length}</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Style</span><span style={{ color: acLt }}>{visualStyle}</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Edit Mode</span><span style={{ color: "#00d4ff" }}>{editMode.replace("_", " ")}</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Tool</span><span style={{ color: "#e87d0d" }}>{viewportTool}</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Cam Angle</span><span>{(camAngle * 57.3).toFixed(1)}°</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Cam Pitch</span><span>{(camPitch * 57.3).toFixed(1)}°</span></div>
                      <div style={sPropRow}><span style={{ color: acDim }}>Cam Dist</span><span>{camDist.toFixed(0)}</span></div>
                      <div style={{ padding: "6px 8px", fontSize: 9, color: acDim, lineHeight: 1.7 }}>
                        <div>Select an object to edit its transform.</div>
                        <div>Use the gizmo toolbar (left) to move/rotate/scale.</div>
                        <div>🖱 Drag = Orbit | Scroll = Zoom</div>
                        <div>G/R/S = Transform mode | Tab = Edit mode</div>
                        <div>Del = Delete | Ctrl+D = Duplicate</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0" }}>
                        {selEnt2d.length === 0 ? "2D Properties" : `${selEnt2d[0].type.toUpperCase()} selected`}
                      </div>
                      {selEnt2d.length === 0 ? (
                        <>
                          <div style={sPropRow}><span style={{ color: acDim }}>Tool</span><span style={{ color: acLt }}>{TOOL_LABEL[tool] || tool}</span></div>
                          <div style={sPropRow}><span style={{ color: acDim }}>Layer</span><span>{layer}</span></div>
                          <div style={sPropRow}><span style={{ color: acDim }}>Objects</span><span>{entities.length}</span></div>
                          <div style={sPropRow}><span style={{ color: acDim }}>Zoom</span><span>{(zoom * 100).toFixed(0)}%</span></div>
                        </>
                      ) : selEnt2d.map(ent => (
                        <div key={ent.id}>
                          <div style={sPropRow}><span style={{ color: acDim }}>Layer</span><span>{ent.layer}</span></div>
                          <div style={sPropRow}><span style={{ color: acDim }}>Color</span><span style={{ display: "flex", gap: 4 }}><span style={{ display: "inline-block", width: 10, height: 10, background: ent.color, borderRadius: 1 }} />{ent.color}</span></div>
                          {ent.type === "line" && <>
                            <div style={sPropRow}><span style={{ color: acDim }}>Length</span><span>{Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1).toFixed(2)}</span></div>
                            <div style={sPropRow}><span style={{ color: acDim }}>Angle</span><span>{(Math.atan2(ent.y2 - ent.y1, ent.x2 - ent.x1) * 180 / Math.PI).toFixed(1)}°</span></div>
                          </>}
                          {ent.type === "circle" && <>
                            <div style={sPropRow}><span style={{ color: acDim }}>Radius</span><span>{ent.r.toFixed(2)}</span></div>
                            <div style={sPropRow}><span style={{ color: acDim }}>Area</span><span>{(Math.PI * ent.r * ent.r).toFixed(2)}</span></div>
                          </>}
                          {ent.type === "rect" && <>
                            <div style={sPropRow}><span style={{ color: acDim }}>W</span><span>{Math.abs(ent.x2 - ent.x1).toFixed(2)}</span></div>
                            <div style={sPropRow}><span style={{ color: acDim }}>H</span><span>{Math.abs(ent.y2 - ent.y1).toFixed(2)}</span></div>
                          </>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* ── MATERIAL ── */}
              {rightTab === "material" && (
                <>
                  <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0" }}>Material Editor</div>
                  <div style={{ padding: "4px 6px", borderBottom: `1px solid #222` }}>
                    <div style={{ fontSize: 9, color: acDim, marginBottom: 4 }}>PRESETS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {Object.keys(MATERIALS).map(name => (
                        <div key={name} onClick={() => {
                          setSelectedMaterial(name);
                          if (firstSel3d) selIds3d.forEach(sid => updMat(sid, MATERIALS[name]));
                          else setColor(MATERIALS[name].color);
                        }}
                          style={{
                            padding: "2px 5px", borderRadius: 2, cursor: "pointer", fontSize: 8,
                            background: selectedMaterial === name ? "#0078d4" : "#2a2a2a",
                            border: `1px solid ${selectedMaterial === name ? "#0078d4" : "#444"}`,
                            color: selectedMaterial === name ? "#fff" : "#bbb",
                          }}>{name}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "4px 8px" }}>
                    <div style={{ fontSize: 9, color: acDim, marginBottom: 4 }}>PROPERTIES</div>
                    {firstSel3d ? (
                      <>
                        <div style={sPropRow}><span style={{ color: acDim }}>Color</span>
                          <input type="color" value={firstSel3d.material?.color || "#4488cc"}
                            onChange={e => { selIds3d.forEach(sid => updMat(sid, { color: e.target.value })); }}
                            style={{ width: 40, height: 16, border: "1px solid #555", padding: 0, cursor: "pointer" }} />
                        </div>
                        {[
                          { key: "roughness", label: "Roughness", min: 0, max: 1, step: 0.05 },
                          { key: "metalness", label: "Metalness", min: 0, max: 1, step: 0.05 },
                          { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.05 },
                        ].map(({ key, label, min, max, step }) => (
                          <div key={key} style={{ marginBottom: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                              <span style={{ fontSize: 9, color: acDim }}>{label}</span>
                              <span style={{ fontSize: 9 }}>{((firstSel3d.material?.[key] ?? MATERIALS.Default[key]) * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min={min} max={max} step={step}
                              value={firstSel3d.material?.[key] ?? MATERIALS.Default[key]}
                              onChange={e => selIds3d.forEach(sid => updMat(sid, { [key]: +e.target.value }))}
                              style={{ width: "100%", height: 12 }} />
                          </div>
                        ))}
                        <div style={sPropRow}><span style={{ color: acDim }}>Emissive</span>
                          <input type="color" value={firstSel3d.material?.emissive || "#000000"}
                            onChange={e => selIds3d.forEach(sid => updMat(sid, { emissive: e.target.value }))}
                            style={{ width: 40, height: 16, border: "1px solid #555", padding: 0, cursor: "pointer" }} />
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 9, color: acDim, padding: "8px 0" }}>Select an object to edit its material</div>
                    )}
                  </div>
                  <div style={{ padding: "4px 8px", borderTop: `1px solid #222` }}>
                    <div style={{ fontSize: 9, color: acDim, marginBottom: 4 }}>SCENE LIGHTS</div>
                    {lights.map(l => (
                      <div key={l.id} style={{ padding: "3px 0", borderBottom: `1px solid #1a1a1a`, fontSize: 9 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ color: acText }}>{l.type}</span>
                          <input type="color" value={l.color}
                            onChange={e => setLights(ls => ls.map(x => x.id === l.id ? { ...x, color: e.target.value } : x))}
                            style={{ width: 24, height: 12, border: "none", padding: 0, cursor: "pointer" }} />
                        </div>
                        <input type="range" min={0} max={3} step={0.1} value={l.intensity}
                          onChange={e => setLights(ls => ls.map(x => x.id === l.id ? { ...x, intensity: +e.target.value } : x))}
                          style={{ width: "100%", height: 10 }} />
                      </div>
                    ))}
                    <button onClick={() => {
                      const id = nextId();
                      setLights(l => [...l, { id, type: "point", color: "#ffffff", intensity: 1.0, x: 0, y: -100, z: 0 }]);
                    }} style={{ marginTop: 4, width: "100%", padding: "3px", background: "#1a3a5a", border: "1px solid #2a5a8a", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>
                      + Add Point Light
                    </button>
                  </div>
                </>
              )}

              {/* ── LAYERS ── */}
              {rightTab === "layers" && (
                <>
                  <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Layers</span>
                    <button onClick={() => { const name = prompt("Layer name:", "NewLayer"); if (name) setLayers(l => [...l, { id: l.length + 1, name, color: "#ffffff", visible: true, locked: false, frozen: false }]); }}
                      style={{ background: acBlue, border: "none", color: "#fff", borderRadius: 2, padding: "1px 6px", cursor: "pointer", fontSize: 9 }}>+ New</button>
                  </div>
                  <div style={{ display: "flex", background: "#111", padding: "2px 6px", fontSize: 8, color: acDim, gap: 4 }}>
                    <span style={{ width: 14 }}>✓</span><span style={{ width: 14 }}>V</span><span style={{ width: 14 }}>L</span><span style={{ flex: 1 }}>Name</span><span style={{ width: 12 }}>C</span>
                  </div>
                  {layers.map(lyr => (
                    <div key={lyr.id} onClick={() => setLayer(lyr.name)}
                      style={{ display: "flex", alignItems: "center", padding: "2px 6px", gap: 4, cursor: "pointer", fontSize: 9, background: layer === lyr.name ? "#1a3a5a" : "transparent", borderLeft: layer === lyr.name ? "2px solid #0078d4" : "2px solid transparent", borderBottom: "1px solid #111" }}>
                      <span style={{ width: 14, color: layer === lyr.name ? acBlue : "#333" }}>✓</span>
                      <span style={{ width: 14, cursor: "pointer", fontSize: 10, color: lyr.visible ? "#fff" : "#444" }}
                        onClick={ev => { ev.stopPropagation(); setLayers(ls => ls.map(l => l.id === lyr.id ? { ...l, visible: !l.visible } : l)); }}>👁</span>
                      <span style={{ width: 14, cursor: "pointer", fontSize: 10, color: lyr.locked ? "#ffcc00" : "#333" }}
                        onClick={ev => { ev.stopPropagation(); setLayers(ls => ls.map(l => l.id === lyr.id ? { ...l, locked: !l.locked } : l)); }}>🔒</span>
                      <span style={{ flex: 1, color: layer === lyr.name ? acLt : acText, overflow: "hidden", textOverflow: "ellipsis" }}>{lyr.name}</span>
                      <span style={{ width: 12, height: 10, background: lyr.color, border: "1px solid #444", borderRadius: 1, display: "inline-block" }} />
                    </div>
                  ))}
                </>
              )}

              {/* ── PHYSICS ── */}
              {rightTab === "physics" && (
                <>
                  <div style={{ background: "#1a1a2a", padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: "#8fa8d0" }}>Physics</div>
                  <div style={{ padding: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer", fontSize: 10 }}>
                      <input type="checkbox" checked={physics.enabled} onChange={e => setPhysics(p => ({ ...p, enabled: e.target.checked }))} />
                      Enable Physics
                    </label>
                    {[
                      { k: "gravity", l: "Gravity (m/s²)", min: -20, max: 0, step: 0.1 },
                      { k: "bounce", l: "Bounce (0-1)", min: 0, max: 1, step: 0.05 },
                      { k: "friction", l: "Friction (0-1)", min: 0, max: 1, step: 0.05 },
                    ].map(({ k, l, min, max, step }) => (
                      <div key={k} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, color: acDim }}>{l}</span>
                          <span style={{ fontSize: 9 }}>{physics[k]}</span>
                        </div>
                        <input type="range" min={min} max={max} step={step} value={physics[k]}
                          onChange={e => setPhysics(p => ({ ...p, [k]: +e.target.value }))}
                          style={{ width: "100%", height: 12 }} />
                      </div>
                    ))}
                    {firstSel3d && (
                      <>
                        <div style={{ fontSize: 9, color: acDim, marginTop: 8, marginBottom: 4 }}>OBJECT PHYSICS</div>
                        {[
                          { k: "mass", l: "Mass (kg)", def: 1, min: 0.1, max: 100 },
                          { k: "physBounce", l: "Bounce", def: 0.3, min: 0, max: 1, step: 0.05 },
                        ].map(({ k, l, def, min, max, step = 0.1 }) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: acDim }}>{l}</span>
                            <input type="number" min={min} max={max} step={step}
                              value={firstSel3d[k] || def}
                              onChange={e => selIds3d.forEach(sid => upd3D(sid, { [k]: +e.target.value }))}
                              style={sInput} />
                          </div>
                        ))}
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 9, marginTop: 4 }}>
                          <input type="checkbox" checked={!!firstSel3d.isStatic}
                            onChange={e => selIds3d.forEach(sid => upd3D(sid, { isStatic: e.target.checked }))} />
                          Static (immovable)
                        </label>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ LAYOUT TABS ══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", background: "#252525", borderTop: `1px solid ${acBorder}`, height: 20, padding: "0 4px", flexShrink: 0 }}>
        {["Model", "Layout1", "Layout2"].map(t => (
          <div key={t} onClick={() => setLayoutTab(t)} style={{
            padding: "1px 10px", cursor: "pointer", fontSize: 9,
            background: layoutTab === t ? "#0078d4" : "#3a3a3a",
            color: layoutTab === t ? "#fff" : "#bbb",
            border: `1px solid ${layoutTab === t ? "#005a9e" : "#555"}`,
            borderBottom: "none", borderRadius: "3px 3px 0 0", marginRight: 2,
          }}>{t}</div>
        ))}
        <span style={{ marginLeft: 4, cursor: "pointer", color: acDim, fontSize: 11 }}>＋</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: acDim, fontSize: 9, marginRight: 4 }}>
          <span onClick={() => { setSelIds2d(entities.map(e => e.id)); setSelIds3d(objs3d.map(o => o.id)); }} style={{ cursor: "pointer" }}>SelAll</span>
          <span onClick={del3D} style={{ cursor: "pointer", color: selIds3d.length ? "#ff8888" : acDim }}>Del3D({selIds3d.length})</span>
          <span onClick={() => { setEntities([]); pushHist([]); }} style={{ cursor: "pointer" }}>Clear2D</span>
          <span onClick={() => { setObjs3d([]); setSelIds3d([]); }} style={{ cursor: "pointer" }}>Clear3D</span>
        </div>
      </div>

      {/* ══ BOTTOM AREA: Command + [4] Timeline ══════════════════════════ */}
      <div style={{ background: "#111", borderTop: `1px solid #444`, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        {/* Bottom tabs */}
        <div style={{ display: "flex", background: "#1a1a1a", borderBottom: "1px solid #333", height: 20, flexShrink: 0 }}>
          {[{ id: "cmd", l: "Command" }, { id: "timeline", l: "🎬 Timeline" }, { id: "coords", l: "Coords" }].map(t => (
            <div key={t.id} onClick={() => setBottomTab(t.id)} style={{
              padding: "2px 10px", cursor: "pointer", fontSize: 9,
              color: bottomTab === t.id ? acLt : acDim,
              borderBottom: bottomTab === t.id ? "2px solid #e87d0d" : "2px solid transparent",
            }}>{t.l}</div>
          ))}
        </div>

        {/* Command */}
        {bottomTab === "cmd" && (
          <div style={{ height: 90, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "3px 8px", fontSize: 10, color: "#fff", fontFamily: "monospace", lineHeight: 1.4 }}
              ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
              {cmdLog.map((line, i) => (
                <div key={i} style={{ color: line === "Command:" ? "#999" : line.startsWith("*") ? "#ff9900" : line.startsWith(">") ? acBlue : "#e0e0e0" }}>
                  {line}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "#0a0a0a", borderTop: "1px solid #333", padding: "0 8px", gap: 6 }}>
              <span style={{ color: "#ccc", fontFamily: "monospace", fontSize: 10 }}>Command: </span>
              <input ref={cmdRef} style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 10, outline: "none", fontFamily: "monospace", padding: "3px 0" }}
                value={cmdInput} onChange={e => setCmdInput(e.target.value)} onKeyDown={execCmd}
                placeholder="Type command or 'help'..." autoComplete="off" spellCheck="false" />
            </div>
          </div>
        )}

        {/* [4] TIMELINE (enhanced Blender-style) */}
        {bottomTab === "timeline" && (
          <div style={{ height: 90, display: "flex", flexDirection: "column", padding: "4px 8px" }}>
            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexShrink: 0 }}>
              {/* Transport buttons */}
              <button onClick={() => setTimelineFrame(timelineStart)} title="Jump to Start" style={{ padding: "2px 6px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 12 }}>⏮</button>
              <button onClick={() => setTimelineFrame(f => Math.max(timelineStart, f - 1))} title="Previous Frame" style={{ padding: "2px 6px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 12 }}>◀</button>
              <button onClick={() => setTimelinePlaying(p => !p)} style={{
                padding: "2px 10px", background: timelinePlaying ? "#c00000" : "#0078d4",
                border: "none", color: "#fff", borderRadius: 2, cursor: "pointer", fontSize: 11, minWidth: 50,
              }}>
                {timelinePlaying ? "⏹" : "▶"}
              </button>
              <button onClick={() => setTimelineFrame(f => Math.min(timelineEnd, f + 1))} title="Next Frame" style={{ padding: "2px 6px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 12 }}>▶</button>
              <button onClick={() => setTimelineFrame(timelineEnd)} title="Jump to End" style={{ padding: "2px 6px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 12 }}>⏭</button>

              <div style={{ width: 1, height: 16, background: "#444", margin: "0 4px" }} />

              {/* Frame inputs */}
              <span style={{ fontSize: 9, color: acDim }}>Start</span>
              <input type="number" value={timelineStart} min={1} max={timelineEnd - 1}
                onChange={e => setTimelineStart(Math.max(1, +e.target.value))}
                style={{ width: 46, background: "#1a1a1a", color: "#fff", border: "1px solid #444", fontSize: 10, padding: "2px 4px", borderRadius: 2 }} />

              <span style={{ fontSize: 9, color: "#e87d0d", fontWeight: "bold" }}>Frame</span>
              <input type="number" value={timelineFrame} min={timelineStart} max={timelineEnd}
                onChange={e => setTimelineFrame(Math.max(timelineStart, Math.min(timelineEnd, +e.target.value)))}
                style={{ width: 54, background: "#1a1a1a", color: "#e87d0d", border: "1px solid #664400", fontSize: 10, padding: "2px 4px", borderRadius: 2, fontWeight: "bold", textAlign: "center" }} />

              <span style={{ fontSize: 9, color: acDim }}>End</span>
              <input type="number" value={timelineEnd} min={timelineStart + 1}
                onChange={e => setTimelineEnd(Math.max(timelineStart + 1, +e.target.value))}
                style={{ width: 46, background: "#1a1a1a", color: "#fff", border: "1px solid #444", fontSize: 10, padding: "2px 4px", borderRadius: 2 }} />

              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: acDim }}>FPS: 30</span>
              <span style={{ fontSize: 9, color: "#666" }}>{timelinePlaying ? "● REC" : "○"}</span>
            </div>

            {/* Timeline scrubber */}
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", background: "#1a1a1a", borderRadius: 2, overflow: "hidden", border: "1px solid #2a2a2a" }}>
              {/* Frame ticks */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex", alignItems: "flex-end", paddingBottom: 2, overflow: "hidden" }}>
                {Array.from({ length: Math.min(50, timelineEnd - timelineStart + 1) }).map((_, i) => {
                  const step = Math.ceil((timelineEnd - timelineStart) / 50);
                  const frame = timelineStart + i * step;
                  const pct = (frame - timelineStart) / (timelineEnd - timelineStart) * 100;
                  return (
                    <div key={i} style={{ position: "absolute", left: `${pct}%`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: "#555", whiteSpace: "nowrap" }}>{frame}</span>
                      <div style={{ width: 1, height: 4, background: "#333" }} />
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div style={{
                position: "absolute", left: 0, top: 12, bottom: 0,
                width: `${(timelineFrame - timelineStart) / (timelineEnd - timelineStart) * 100}%`,
                background: "rgba(232,125,13,0.15)", pointerEvents: "none",
              }} />
              {/* Playhead */}
              <div style={{
                position: "absolute",
                left: `calc(${(timelineFrame - timelineStart) / (timelineEnd - timelineStart) * 100}% - 1px)`,
                top: 0, bottom: 0, width: 2, background: "#e87d0d", zIndex: 2, pointerEvents: "none",
              }}>
                <div style={{ width: 8, height: 8, background: "#e87d0d", borderRadius: "0 0 2px 2px", marginLeft: -3, marginTop: 10 }} />
              </div>
              {/* Scrub input */}
              <input type="range" min={timelineStart} max={timelineEnd} value={timelineFrame}
                onChange={e => setTimelineFrame(+e.target.value)}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", opacity: 0, cursor: "pointer", zIndex: 3 }} />
            </div>
          </div>
        )}

        {/* Coordinates */}
        {bottomTab === "coords" && (
          <div style={{ height: 90, padding: "6px 8px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            {vp === "2d" ? (
              <>
                <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>CURSOR (World)</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#00d4ff" }}>
                    X: {worldPt.x.toFixed(4)}<br />
                    Y: {worldPt.y.toFixed(4)}<br />
                    Z: 0.0000
                  </div>
                </div>
                {drawing && startPt && <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>FROM START</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ffcc00" }}>
                    ΔX: {(worldPt.x - startPt.x).toFixed(4)}<br />
                    ΔY: {(worldPt.y - startPt.y).toFixed(4)}<br />
                    D: {Math.hypot(worldPt.x - startPt.x, worldPt.y - startPt.y).toFixed(4)}
                  </div>
                </div>}
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>CAMERA</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#00d4ff" }}>
                    Angle: {(camAngle * 57.3).toFixed(2)}°<br />
                    Pitch: {(camPitch * 57.3).toFixed(2)}°<br />
                    Dist: {camDist.toFixed(1)}
                  </div>
                </div>
                {firstSel3d && <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>SELECTED</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ffcc00" }}>
                    X: {firstSel3d.x.toFixed(2)}<br />
                    Y: {(firstSel3d.y || 0).toFixed(2)}<br />
                    Z: {firstSel3d.z.toFixed(2)}
                  </div>
                </div>}
                <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>ENVIRONMENT</div>
                  <div style={{ fontSize: 9, color: acText, lineHeight: 1.8 }}>
                    Sky: {envSettings.skybox}<br />
                    Fog: {envSettings.fog ? "ON" : "OFF"}<br />
                    Water: {envSettings.water ? "ON" : "OFF"}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ [5] STATUS BAR ══════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", background: "#1e3a1e", height: 20,
        padding: "0 8px", gap: 0, flexShrink: 0, borderTop: "1px solid #2a4a2a",
      }}>
        {/* Status / tip text */}
        <div style={{ color: "#88cc88", fontFamily: "monospace", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          ℹ {getStatusBarTip()}
        </div>

        {/* Toggle indicators */}
        <div style={{ display: "flex", gap: 0, marginLeft: 8, borderLeft: "1px solid #2a4a2a" }}>
          {vp === "2d" ? [
            { label: "SNAP", active: snap, action: () => setSnap(s => !s) },
            { label: "GRID", active: grid, action: () => setGrid(g => !g) },
            { label: "ORTHO", active: orthoOn, action: () => setOrthoOn(o => !o) },
          ].map(b => (
            <div key={b.label} onClick={b.action} style={{
              padding: "0 7px", cursor: "pointer", height: 20, display: "flex", alignItems: "center",
              color: b.active ? "#88ff88" : "#3a5a3a",
              fontSize: 9, borderRight: "1px solid #2a4a2a",
              background: b.active ? "rgba(100,180,100,0.12)" : "transparent",
              fontWeight: b.active ? "bold" : "normal",
            }}>{b.label}</div>
          )) : [
            { label: "GRID", active: showGrid3d, action: () => setShowGrid3d(g => !g) },
            { label: "AXES", active: showAxes3d, action: () => setShowAxes3d(a => !a) },
            { label: visualStyle.toUpperCase().slice(0, 5), active: true, action: () => {} },
            { label: isPerspective ? "PERSP" : "ORTHO", active: true, action: () => setIsPerspective(p => !p) },
          ].map(b => (
            <div key={b.label} onClick={b.action} style={{
              padding: "0 7px", cursor: "pointer", height: 20, display: "flex", alignItems: "center",
              color: b.active ? "#88ff88" : "#3a5a3a",
              fontSize: 9, borderRight: "1px solid #2a4a2a",
              background: b.active ? "rgba(100,180,100,0.12)" : "transparent",
            }}>{b.label}</div>
          ))}
        </div>

        {/* App version */}
        <div style={{ color: "#3a5a3a", fontSize: 9, padding: "0 8px", borderLeft: "1px solid #2a4a2a", whiteSpace: "nowrap" }}>
          3DCAD Studio Pro v2.0 | Blender-style UI
        </div>
      </div>
    </div>
  );
}