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

// Scene hierarchy node
const mkNode = (id, name, type, parentId = null) => ({ id, name, type, parentId, children: [], visible: true, locked: false });

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

// ── LIGHT PRESETS ──────────────────────────────────────────────────────────
const LIGHT_TYPES = ["point", "spot", "directional", "sun", "ambient"];

// ── 3D OBJECT DEFAULTS ─────────────────────────────────────────────────────
const OBJ3D_DEFAULTS = {
  box3d:        { w: 60,  h: 60,   d: 60,   color: "#4488cc" },
  sphere3d:     { r: 40,             color: "#cc4444" },
  cylinder3d:   { r: 30,  h: 80,   color: "#44cc88" },
  cone3d:       { r: 40,  h: 80,   color: "#ccaa44" },
  torus3d:      { r: 40,  tube: 12, color: "#cc44cc" },
  wedge3d:      { w: 60,  h: 50,   d: 60,   color: "#44cccc" },
  pyramid3d:    { base: 60, h: 80,  color: "#cc8844" },
  plane3d:      { w: 100, h: 100,  color: "#888888" },
  capsule3d:    { r: 20,  h: 80,   color: "#ff8844" },
};

// ── Math helpers ─────────────────────────────────────────────────────────
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

// ── 3D Renderer ────────────────────────────────────────────────────────────
function draw3DScene(ctx, W, H, objects3d, lights, camAngle, camPitch, camDist, selIds, visualStyle, envSettings, showGrid, showAxes, editMode) {
  // BG
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

  // Stars for night
  if (envSettings.skybox === "night") {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5) % W, sy = (i * 97.3) % (H * 0.6);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Fog overlay
  if (envSettings.fog) {
    const fogGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
    fogGrad.addColorStop(0, "transparent");
    fogGrad.addColorStop(1, `rgba(${envSettings.fogColor || "180,180,200"},0.35)`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, W, H);
  }

  const project = (x, y, z) => {
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
  };

  // Grid floor
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

  // Water plane
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

  // Sort back to front
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
      // Rotation Y
      let nx = x * Math.cos(ry2) + z * Math.sin(ry2);
      let nz = -x * Math.sin(ry2) + z * Math.cos(ry2);
      x = nx; z = nz;
      // Rotation X
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

    // Light icons
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

    // Selection glow
    if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 15; }
    ctx.restore();
  });

  // Axis indicator
  if (showAxes) {
    ctx.save();
    const ax = 50, ay = H - 50;
    [[30, 0, 0, "#ff4444", "X"], [0, -30, 0, "#44cc44", "Y"], [0, 0, 30, "#4488ff", "Z"]].forEach(([dx, dy, dz, c, lbl]) => {
      const tip = project(dx * 0.5, dy * 0.5, dz * 0.5);
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.lineTo(ax + dx * 0.5, ay + dy * 0.5); ctx.stroke();
      ctx.fillStyle = c; ctx.font = "bold 10px monospace";
      ctx.fillText(lbl, ax + dx * 0.58, ay + dy * 0.58 + 4);
    });
    ctx.restore();
  }

  // Measurement overlays
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
  viewfront: "M3 3h18v18H3z", viewright: "M3 3h18v18H3zM12 3v18", viewiso: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
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
  char_template: "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20a8 8 0 0 1 16 0",
  rig_bones: "M6 6l6 6M18 6l-6 6M12 12v6M9 18h6",
  pose_tool: "M12 2a2 2 0 1 0 0 4M12 6l-3 6M12 6l3 6M9 12l-2 8M15 12l2 8M9 20h6",
  duplicate: "M8 8H4v14h14v-4M20 4H10v10h10V4z",
  mirror3d: "M12 3v18M5 7l4 5-4 5M19 7l-4 5 4 5",
  align3d: "M3 6h18M3 12h18M3 18h18M12 3v18",
  pivot: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4",
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
  select: "Select",
};

// ════════════════════════════════════════════════════════════════════════════
export default function CADEditor() {
  // ── Viewport
  const [vp, setVp] = useState("3d");

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
  const [editMode, setEditMode] = useState("obj_mode"); // obj_mode|vert_mode|edge_mode|face_mode|sculpt_mode

  // ── Lights
  const [lights, setLights] = useState([
    { id: 9001, type: "directional", color: "#ffffff", intensity: 1.0, x: 200, y: -300, z: 100 },
    { id: 9002, type: "ambient", color: "#334466", intensity: 0.4, x: 0, y: 0, z: 0 },
  ]);

  // ── Scene hierarchy
  const [sceneNodes, setSceneNodes] = useState([
    mkNode(1, "Scene", "root"),
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
  const [transformMode, setTransformMode] = useState("move"); // move|rotate|scale

  // ── Lasso / box select
  const [boxSelStart, setBoxSelStart] = useState(null);
  const [boxSelEnd, setBoxSelEnd] = useState(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  // ── Drag pan
  const [isDrag, setIsDrag] = useState(false);
  const [dragSt, setDragSt] = useState(null);

  // ── Physics
  const [physics, setPhysics] = useState({ gravity: -9.8, enabled: false, bounce: 0.3, friction: 0.5 });

  // ── Timeline
  const [timelineFrame, setTimelineFrame] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const timelineRef = useRef(null);

  // ── Command
  const [cmdLog, setCmdLog] = useState(["Welcome to 3DCAD Studio Pro", "Command:"]);
  const [cmdInput, setCmdInput] = useState("");
  const [searchQ, setSearchQ] = useState("");

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
    const id = setInterval(() => setTimelineFrame(f => (f + 1) % 240), 33);
    return () => clearInterval(id);
  }, [timelinePlaying]);

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

    // Preview
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

    // Box select
    if (isBoxSelecting && boxSelStart && boxSelEnd) {
      ctx.save(); ctx.strokeStyle = "#00bfff"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.fillStyle = "rgba(0,120,255,0.07)";
      const x = Math.min(boxSelStart.x, boxSelEnd.x), y = Math.min(boxSelStart.y, boxSelEnd.y);
      const w2 = Math.abs(boxSelEnd.x - boxSelStart.x), h2 = Math.abs(boxSelEnd.y - boxSelStart.y);
      ctx.fillRect(x, y, w2, h2); ctx.strokeRect(x, y, w2, h2); ctx.setLineDash([]); ctx.restore();
    }

    // Snap square
    if (snap && tempPt) {
      const s = toS(tempPt.x, tempPt.y);
      ctx.save(); ctx.strokeStyle = "#ffff00"; ctx.lineWidth = 1.5; ctx.strokeRect(s.x - 5, s.y - 5, 10, 10); ctx.restore();
    }

    // Crosshair
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cursor.y); ctx.lineTo(cursor.x - 8, cursor.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x + 8, cursor.y); ctx.lineTo(W, cursor.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x, 0); ctx.lineTo(cursor.x, cursor.y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cursor.x, cursor.y + 8); ctx.lineTo(cursor.x, H); ctx.stroke();
    ctx.restore();

    // UCS
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
    // Include lights as special objects for rendering
    const allObjs = [...objs3d];
    draw3DScene(ctx, canvas.width, canvas.height, allObjs, lights, camAngle, camPitch, camDist, selIds3d, visualStyle, envSettings, showGrid3d, showAxes3d, editMode);

    // Edit mode overlay
    if (editMode !== "obj_mode") {
      ctx.save();
      ctx.fillStyle = "rgba(0,120,255,0.12)";
      ctx.fillRect(0, 0, canvas.width, 24);
      ctx.fillStyle = "#00bfff"; ctx.font = "bold 11px monospace";
      ctx.fillText(`  ◉ ${editMode.replace("_", " ").toUpperCase()} — Press TAB to cycle`, 8, 16);
      ctx.restore();
    }
  }, [vp, objs3d, lights, selIds3d, camAngle, camPitch, camDist, visualStyle, envSettings, showGrid3d, showAxes3d, editMode, csz]);

  // ── Mouse ─────────────────────────────────────────────────────────────
  const onMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    setCursor({ x: sx, y: sy });

    if (vp === "3d") {
      if (orbiting && orbitStart) {
        const dx = (sx - orbitStart.x) * 0.008, dy = (sy - orbitStart.y) * 0.008;
        setCamAngle(a => a + dx);
        setCamPitch(p => Math.max(-1.4, Math.min(1.4, p + dy)));
        setOrbitStart({ x: sx, y: sy });
      }
      if (isDrag && dragSt && tool === "pan") {
        // Pan in 3D (shift the cam angle slightly)
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
      if (e.button === 0 && tool === "select") {
        // Pick 3D object (screen-space bounding box approximation)
        const W = csz.w, H = csz.h;
        const project = (x, y, z) => {
          const ca = Math.cos(camAngle), sa = Math.sin(camAngle);
          const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
          const rx = x * ca - z * sa, ry = x * sa + z * ca;
          const rz = y * cp - ry * sp, ry2 = y * sp + ry * cp;
          const pz = ry2 + camDist;
          if (pz <= 0) return null;
          const scale = camDist / pz;
          return { x: W / 2 + rx * scale, y: H / 2 - rz * scale, z: pz, scale };
        };
        const hit = [...objs3d].reverse().find(obj => {
          const c = project(obj.x, obj.y || 0, obj.z);
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
    if (vp === "3d") { setOrbiting(false); setIsDrag(false); return; }
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

  // ── Add from asset library ─────────────────────────────────────────────
  const addFromLibrary = useCallback((asset) => {
    const mat = { ...MATERIALS.Default, color: asset.color };
    const newObj = {
      id: nextId(), shape: asset.shape,
      x: (Math.random() - 0.5) * 160,
      y: 0,
      z: (Math.random() - 0.5) * 160,
      rotX: 0, rotY: 0, rotZ: 0,
      material: mat,
      ...Object.fromEntries(Object.entries(asset).filter(([k]) => ["w", "h", "d", "r", "tube", "base"].includes(k))),
    };
    setObjs3d(p => [...p, newObj]);
    addSceneNode(asset.label, asset.shape, 1);
    logCmd(`Added ${asset.label}`);
    setVp("3d");
  }, []);

  // ── Add light ──────────────────────────────────────────────────────────
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

  // ── Generate architecture ──────────────────────────────────────────────
  const genArchitecture = (type) => {
    const spread = 150;
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
      // 4 walls + floor
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

  // ── Update 3D object ───────────────────────────────────────────────────
  const upd3D = (id, changes) => setObjs3d(p => p.map(o => o.id === id ? { ...o, ...changes } : o));
  const updMat = (id, matChanges) => setObjs3d(p => p.map(o => o.id === id ? { ...o, material: { ...(o.material || MATERIALS.Default), ...matChanges } } : o));

  // ── Delete selected ────────────────────────────────────────────────────
  const del3D = () => {
    if (selIds3d.length === 0) return;
    setObjs3d(p => p.filter(o => !selIds3d.includes(o.id)));
    logCmd(`Deleted ${selIds3d.length} object(s)`);
    setSelIds3d([]);
  };

  // ── Duplicate selected ─────────────────────────────────────────────────
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

  // ── Mirror selected ────────────────────────────────────────────────────
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
      if (e.key === "Escape") { resetDraw(); setSelIds2d([]); setSelIds3d([]); log("*Cancel*"); }
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
      // G/R/S = Move/Rotate/Scale in 3D
      if (e.key === "g" && vp === "3d") setTransformMode("move");
      if (e.key === "r" && vp === "3d") setTransformMode("rotate");
      if (e.key === "s" && vp === "3d") setTransformMode("scale");
      // Number pad views
      if (e.key === "1") { setCamAngle(0); setCamPitch(0); }
      if (e.key === "3") { setCamAngle(Math.PI / 2); setCamPitch(0); }
      if (e.key === "7") { setCamAngle(0); setCamPitch(Math.PI / 2); }
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
      log("Commands: box sphere cyl cone torus plane capsule wall roof floor room clear 2d 3d undo redo del dup wireframe shaded realistic grid zoom");
      log("Hotkeys: Del=delete Tab=editmode G=move R=rotate S=scale 1/3/7=views Ctrl+D=duplicate Ctrl+Z=undo");
      return;
    }
    log(`Unknown: "${cmd}". Type 'help' for commands.`);
  };

  // ── Computed ───────────────────────────────────────────────────────────
  const selObjs3d = objs3d.filter(o => selIds3d.includes(o.id));
  const selEnt2d = entities.filter(e => selIds2d.includes(e.id));
  const firstSel3d = selObjs3d[0];

  // ════════════════════════════════════════════════════════════════════════
  // COLORS / STYLES
  // ════════════════════════════════════════════════════════════════════════
  const acBg = "#2d2d30", acRibBg = "#3c3c3c", acDark = "#1e1e1e";
  const acBorder = "#1a1a1a", acText = "#cccccc", acLt = "#ffffff";
  const acDim = "#777", acBlue = "#0078d4", acGreen = "#4ec94e";

  const sApp = {
    display: "flex", flexDirection: "column", width: "100vw", height: "100vh",
    background: "#2d2d30", color: acText,
    fontFamily: "'Segoe UI', 'SF Pro Text', Tahoma, sans-serif",
    fontSize: 11, overflow: "hidden", userSelect: "none",
  };

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

  // ── Scene tree renderer ────────────────────────────────────────────────
  const renderTree = (nodes, depth = 0) => nodes.map(node => (
    <div key={node.id}>
      <div onClick={() => { setSelNodeId(node.id); if (node.type !== "root") setSelIds3d([node.id]); }}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "2px 4px 2px " + (8 + depth * 12) + "px",
          cursor: "pointer", fontSize: 9,
          background: selNodeId === node.id ? "#1a3a5a" : "transparent",
          borderLeft: selNodeId === node.id ? "2px solid #0078d4" : "2px solid transparent",
          color: acText,
        }}>
        {node.children.length > 0 && (
          <span onClick={ev => { ev.stopPropagation(); setExpandedNodes(s => { const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
            style={{ cursor: "pointer", color: acDim, fontSize: 8, width: 10 }}>
            {expandedNodes.has(node.id) ? "▼" : "▶"}
          </span>
        )}
        {node.children.length === 0 && <span style={{ width: 10 }} />}
        <span style={{ fontSize: 9 }}>
          {node.type === "root" ? "🌐" : node.type.includes("3d") ? "◈" : "—"}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
        <span onClick={ev => { ev.stopPropagation(); }} style={{ color: acDim, fontSize: 8 }}>👁</span>
      </div>
      {expandedNodes.has(node.id) && node.children.length > 0 && renderTree(node.children, depth + 1)}
    </div>
  ));

  const curRibbonGroups = RIBBON[ribbonTab] || RIBBON.Home;

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={sApp}>

      {/* ══ APP BAR ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", background: "#1e1e1e",
        borderBottom: `1px solid ${acBorder}`, height: 28, flexShrink: 0, padding: "0 4px", gap: 2,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 28, background: "#c00000", cursor: "pointer",
          color: "#fff", fontSize: 14, fontWeight: "bold", marginRight: 4, flexShrink: 0,
        }}>A</div>

        {[
          { icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", title: "New", action: () => { setEntities([]); setObjs3d([]); pushHist([]); } },
          { icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", title: "Open" },
          { icon: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8", title: "Save" },
        ].map((b, i) => (
          <button key={i} title={b.title} onClick={b.action}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer", borderRadius: 2 }}>
            <Ic d={b.icon} s={13} />
          </button>
        ))}

        <div style={{ width: 1, height: 14, background: "#444", margin: "0 3px" }} />
        <button onClick={undo} title="Undo Ctrl+Z" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer" }}><Ic d="M9 14L4 9l5-5M4 9h11a4 4 0 0 1 0 8h-1" s={13} /></button>
        <button onClick={redo} title="Redo Ctrl+Y" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer" }}><Ic d="M15 14l5-5-5-5M20 9H9a4 4 0 0 0 0 8h1" s={13} /></button>
        <div style={{ width: 1, height: 14, background: "#444", margin: "0 3px" }} />

        {/* Viewport toggle */}
        {["2d", "3d"].map(v => (
          <button key={v} onClick={() => setVp(v)} style={{
            padding: "2px 8px", background: vp === v ? "#0078d4" : "#2a2a2a",
            color: vp === v ? "#fff" : "#aaa", border: `1px solid ${vp === v ? "#0078d4" : "#555"}`,
            borderRadius: 2, cursor: "pointer", fontSize: 10, fontWeight: "bold",
          }}>{v.toUpperCase()}</button>
        ))}

        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: acText }}>{activeFile} — 3DCAD Studio Pro</div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #555", borderRadius: 2, padding: "2px 6px", gap: 4, marginRight: 6, minWidth: 150 }}>
          <Ic d="M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" s={11} c="#888" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search tools..."
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 10, outline: "none", width: 100 }} />
        </div>

        {["─", "□", "✕"].map((s, i) => (
          <button key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer", borderRadius: 0, fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = i === 2 ? "#c00000" : "#555"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >{s}</button>
        ))}
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
                      if (isLight) {
                        const lt = tid.replace("light_", "");
                        addLight(lt); return;
                      }
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

        {/* ── LEFT SIDEBAR (180px) ─────────────────────────────────────── */}
        <div style={{ width: 180, background: acDark, borderRight: `1px solid ${acBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          {/* Sidebar tabs */}
          <div style={{ display: "flex", background: acBg, borderBottom: `1px solid ${acBorder}`, flexShrink: 0 }}>
            {[{ id: "tools", l: "Tools" }, { id: "assets", l: "Assets" }, { id: "scene", l: "Scene" }].map(t => (
              <div key={t.id} onClick={() => setSidebarTab(t.id)} style={{
                flex: 1, textAlign: "center", padding: "4px 0", cursor: "pointer", fontSize: 9,
                color: sidebarTab === t.id ? acLt : acDim,
                borderBottom: sidebarTab === t.id ? "2px solid #0078d4" : "2px solid transparent",
              }}>{t.l}</div>
            ))}
          </div>

          {/* TOOLS sidebar */}
          {sidebarTab === "tools" && (
            <div style={{ overflow: "auto", flex: 1, padding: 4 }}>
              {[
                { label: "SELECT", tools: [{ id: "select", icon: TOOL_ICONS.select, label: "Select" }] },
                { label: "TRANSFORM", tools: [{ id: "move", icon: TOOL_ICONS.move, label: "Move (G)" }, { id: "rotate", icon: TOOL_ICONS.rotate, label: "Rotate (R)" }, { id: "scale", icon: TOOL_ICONS.scale, label: "Scale (S)" }] },
                { label: "PRIMITIVES", tools: ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "plane3d", "capsule3d", "pyramid3d"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "ARCHITECTURE", tools: ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "LIGHTS", tools: ["light_point", "light_spot", "light_dir", "light_sun"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
                { label: "CAMERA", tools: [{ id: "orbit3d", icon: TOOL_ICONS.orbit3d, label: "Orbit" }, { id: "pan", icon: TOOL_ICONS.pan, label: "Pan" }, { id: "zoom", icon: TOOL_ICONS.zoom, label: "Zoom" }, { id: "reset_cam", icon: TOOL_ICONS.reset_cam, label: "Reset" }] },
                { label: "EDIT MODE", tools: ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
              ].map(group => (
                <div key={group.label} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 8, color: acDim, padding: "2px 2px 2px 2px", letterSpacing: "0.06em", borderBottom: `1px solid #2a2a2a`, marginBottom: 2 }}>{group.label}</div>
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
              {/* 3D selection quick actions */}
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

          {/* ASSETS sidebar */}
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

          {/* SCENE sidebar */}
          {sidebarTab === "scene" && (
            <div style={{ overflow: "auto", flex: 1 }}>
              <div style={{ fontSize: 8, color: acDim, padding: "4px 6px", background: "#1a1a1a", borderBottom: `1px solid #111` }}>SCENE HIERARCHY</div>
              {renderTree(sceneNodes)}
              <div style={{ borderTop: `1px solid #222`, padding: "4px 8px" }}>
                <div style={{ fontSize: 8, color: acDim, marginBottom: 4 }}>OBJECTS IN SCENE: {objs3d.length}</div>
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

        {/* ── CANVAS ───────────────────────────────────────────────────── */}
        <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative", background: vp === "3d" ? "#111" : "#414141" }}>
          <canvas ref={canvasRef} width={csz.w} height={csz.h}
            style={{
              display: "block", width: "100%", height: "100%",
              cursor: vp === "3d" ? (orbiting ? "grabbing" : tool === "pan" ? "all-scroll" : "default") :
                (tool === "pan" || isDrag ? "grabbing" : "crosshair"),
            }}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onDoubleClick={onDblClick}
            onWheel={onWheel}
            onContextMenu={onCtxMenu}
          />

          {/* 3D overlay */}
          {vp === "3d" && (
            <div style={{ position: "absolute", right: 10, top: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Visual style */}
              <div style={{ background: "rgba(20,20,20,0.9)", border: "1px solid #444", borderRadius: 4, padding: 4 }}>
                <div style={{ fontSize: 8, color: acDim, textAlign: "center", marginBottom: 2 }}>VISUAL</div>
                {["wireframe", "shaded", "realistic", "conceptual", "xray"].map(vs => (
                  <div key={vs} onClick={() => setVisualStyle(vs)}
                    style={{ fontSize: 9, cursor: "pointer", padding: "2px 6px", borderRadius: 2, background: visualStyle === vs ? "#0078d4" : "transparent", color: visualStyle === vs ? "#fff" : "#bbb" }}>
                    {vs}
                  </div>
                ))}
              </div>
              {/* Views */}
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
            <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(20,20,20,0.85)", border: "1px solid #333", borderRadius: 3, padding: "3px 8px", fontSize: 9, color: "#bbb", pointerEvents: "none" }}>
              {editMode !== "obj_mode" ? `✎ ${editMode.replace("_", " ").toUpperCase()} | ` : ""}
              Style: {visualStyle} | Objects: {objs3d.length} | Drag=orbit Scroll=zoom RMB=orbit
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
        <div style={{ width: 220, background: acDark, borderLeft: `1px solid ${acBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: acBg, borderBottom: `1px solid ${acBorder}`, flexShrink: 0 }}>
            {[{ id: "props", l: "Props" }, { id: "material", l: "Material" }, { id: "layers", l: "Layers" }, { id: "physics", l: "Physics" }].map(t => (
              <div key={t.id} onClick={() => setRightTab(t.id)} style={{
                flex: 1, textAlign: "center", padding: "4px 2px", cursor: "pointer", fontSize: 9,
                color: rightTab === t.id ? acLt : acDim,
                borderBottom: rightTab === t.id ? "2px solid #0078d4" : "2px solid transparent",
              }}>{t.l}</div>
            ))}
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>

            {/* ── PROPERTIES ── */}
            {rightTab === "props" && (
              <>
                {vp === "3d" && firstSel3d ? (
                  <>
                    <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acBlue, display: "flex", justifyContent: "space-between" }}>
                      <span>{firstSel3d.shape.replace("3d", "").toUpperCase()} #{firstSel3d.id}</span>
                      {selIds3d.length > 1 && <span style={{ color: acDim }}>+{selIds3d.length - 1} more</span>}
                    </div>
                    {/* Transform */}
                    <div style={{ padding: "4px 8px", borderBottom: `1px solid #222` }}>
                      <div style={{ fontSize: 9, color: acDim, marginBottom: 4 }}>TRANSFORM</div>
                      <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                        {["move", "rotate", "scale"].map(m => (
                          <button key={m} onClick={() => setTransformMode(m)} style={{
                            flex: 1, padding: "2px 2px", background: transformMode === m ? "#0078d4" : "#2a2a2a",
                            border: `1px solid ${transformMode === m ? "#0078d4" : "#444"}`,
                            color: transformMode === m ? "#fff" : "#aaa", borderRadius: 2, cursor: "pointer", fontSize: 8,
                          }}>{m[0].toUpperCase() + m.slice(1)}</button>
                        ))}
                      </div>
                      {/* Position */}
                      <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>Position</div>
                      {["x", "y", "z"].map(ax => (
                        <div key={ax} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, color: ["#ff5555", "#55cc55", "#5588ff"][["x", "y", "z"].indexOf(ax)], width: 12 }}>{ax.toUpperCase()}</span>
                          <input type="number" value={(firstSel3d[ax] || 0).toFixed(1)}
                            onChange={e => selIds3d.forEach(sid => upd3D(sid, { [ax]: +e.target.value }))}
                            style={{ ...sInput, width: 55 }} />
                        </div>
                      ))}
                      {/* Rotation */}
                      <div style={{ fontSize: 9, color: acDim, marginBottom: 2, marginTop: 4 }}>Rotation (°)</div>
                      {["rotX", "rotY", "rotZ"].map((ax, i) => (
                        <div key={ax} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, color: ["#ff5555", "#55cc55", "#5588ff"][i], width: 12 }}>{["X", "Y", "Z"][i]}</span>
                          <input type="number" value={((firstSel3d[ax] || 0) * 180 / Math.PI).toFixed(1)}
                            onChange={e => selIds3d.forEach(sid => upd3D(sid, { [ax]: +e.target.value * Math.PI / 180 }))}
                            style={{ ...sInput, width: 55 }} />
                        </div>
                      ))}
                    </div>
                    {/* Dimensions */}
                    <div style={{ padding: "4px 8px", borderBottom: `1px solid #222` }}>
                      <div style={{ fontSize: 9, color: acDim, marginBottom: 3 }}>DIMENSIONS</div>
                      {firstSel3d.w !== undefined && [["W", "w"], ["H", "h"], ["D", "d"]].map(([l, k]) => (
                        <div key={k} style={sPropRow}>
                          <span style={{ color: acDim }}>{l}</span>
                          <input type="number" value={firstSel3d[k] || 0} onChange={e => selIds3d.forEach(sid => upd3D(sid, { [k]: +e.target.value }))} style={sInput} />
                        </div>
                      ))}
                      {firstSel3d.r !== undefined && (
                        <div style={sPropRow}>
                          <span style={{ color: acDim }}>Radius</span>
                          <input type="number" value={firstSel3d.r} onChange={e => selIds3d.forEach(sid => upd3D(sid, { r: +e.target.value }))} style={sInput} />
                        </div>
                      )}
                      {firstSel3d.base !== undefined && (
                        <div style={sPropRow}>
                          <span style={{ color: acDim }}>Base</span>
                          <input type="number" value={firstSel3d.base} onChange={e => selIds3d.forEach(sid => upd3D(sid, { base: +e.target.value }))} style={sInput} />
                        </div>
                      )}
                    </div>
                    {/* Quick actions */}
                    <div style={{ padding: "4px 8px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button onClick={duplicate3D} style={{ flex: 1, padding: "3px", background: "#1a3a5a", border: "1px solid #2a5a8a", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>Duplicate</button>
                        <button onClick={() => mirror3D("x")} style={{ flex: 1, padding: "3px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>Mirror X</button>
                        <button onClick={del3D} style={{ flex: 1, padding: "3px", background: "#5a1111", border: "1px solid #8a2222", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9 }}>Delete</button>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, cursor: "pointer", fontSize: 9 }}>
                        <input type="checkbox" checked={!!firstSel3d.showMeasure} onChange={e => selIds3d.forEach(sid => upd3D(sid, { showMeasure: e.target.checked }))} />
                        Show measurements
                      </label>
                    </div>
                  </>
                ) : vp === "3d" ? (
                  <>
                    <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acLt }}>3D Scene</div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Objects</span><span>{objs3d.length}</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Lights</span><span>{lights.length}</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Visual Style</span><span style={{ color: acLt }}>{visualStyle}</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Edit Mode</span><span style={{ color: "#00d4ff" }}>{editMode.replace("_", " ")}</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Cam Angle</span><span>{(camAngle * 57.3).toFixed(1)}°</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Cam Pitch</span><span>{(camPitch * 57.3).toFixed(1)}°</span></div>
                    <div style={sPropRow}><span style={{ color: acDim }}>Cam Dist</span><span>{camDist.toFixed(0)}</span></div>
                    <div style={{ padding: "6px 8px", fontSize: 9, color: acDim, lineHeight: 1.6 }}>
                      <div>🖱 Left drag = Orbit</div>
                      <div>🖱 Right drag = Pan</div>
                      <div>🖱 Scroll = Zoom</div>
                      <div>Tab = Cycle edit mode</div>
                      <div>G/R/S = Move/Rot/Scale</div>
                      <div>Del = Delete selected</div>
                      <div>Ctrl+D = Duplicate</div>
                      <div>1/3/7 = Views</div>
                    </div>
                  </>
                ) : (
                  // 2D properties
                  <>
                    <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acLt }}>
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
                <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acLt }}>Material Editor</div>
                {/* Presets */}
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
                {/* Manual controls */}
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
                {/* Lighting controls */}
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
                <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acLt, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                <div style={{ background: acBg, padding: "4px 8px", borderBottom: `1px solid ${acBorder}`, fontSize: 10, fontWeight: "bold", color: acLt }}>Physics Settings</div>
                <div style={{ padding: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer", fontSize: 10 }}>
                    <input type="checkbox" checked={physics.enabled} onChange={e => setPhysics(p => ({ ...p, enabled: e.target.checked }))} />
                    Enable Physics Simulation
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

      {/* ══ LAYOUT TABS ══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", background: "#2a2a2a", borderTop: `1px solid ${acBorder}`, height: 20, padding: "0 4px", flexShrink: 0 }}>
        {["Model", "Layout1", "Layout2"].map(t => (
          <div key={t} onClick={() => setLayoutTab(t)} style={{
            padding: "1px 10px", cursor: "pointer", fontSize: 9,
            background: layoutTab === t ? "#0078d4" : "#444",
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

      {/* ══ BOTTOM PANEL ════════════════════════════════════════════════ */}
      <div style={{ background: "#111", borderTop: `1px solid #444`, flexShrink: 0, display: "flex", flexDirection: "column", height: 100 }}>
        {/* Bottom tabs */}
        <div style={{ display: "flex", background: "#1a1a1a", borderBottom: "1px solid #333", height: 20, flexShrink: 0 }}>
          {[{ id: "cmd", l: "Command" }, { id: "timeline", l: "Timeline" }, { id: "coords", l: "Coordinates" }].map(t => (
            <div key={t.id} onClick={() => setBottomTab(t.id)} style={{
              padding: "2px 10px", cursor: "pointer", fontSize: 9,
              color: bottomTab === t.id ? acLt : acDim,
              borderBottom: bottomTab === t.id ? "2px solid #0078d4" : "2px solid transparent",
              background: "transparent",
            }}>{t.l}</div>
          ))}
        </div>

        {/* Command */}
        {bottomTab === "cmd" && (
          <>
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
          </>
        )}

        {/* Timeline */}
        {bottomTab === "timeline" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <button onClick={() => setTimelineFrame(0)} style={{ padding: "2px 6px", background: "#2a2a2a", border: "1px solid #444", color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 10 }}>⏮</button>
              <button onClick={() => setTimelinePlaying(p => !p)} style={{ padding: "2px 8px", background: timelinePlaying ? "#c00000" : "#0078d4", border: "none", color: "#fff", borderRadius: 2, cursor: "pointer", fontSize: 10 }}>
                {timelinePlaying ? "⏹ Stop" : "▶ Play"}
              </button>
              <span style={{ fontSize: 9, color: acDim }}>Frame: {timelineFrame} / 240</span>
              <div style={{ flex: 1 }}>
                <input type="range" min={0} max={239} value={timelineFrame} onChange={e => setTimelineFrame(+e.target.value)}
                  style={{ width: "100%", height: 14 }} />
              </div>
              <span style={{ fontSize: 9, color: acDim }}>FPS: 30</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, height: 30, background: "#1a1a1a", borderRadius: 3, padding: "0 4px", overflowX: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} style={{ width: 10, borderRight: "1px solid #333", height: "100%", display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                    <span style={{ fontSize: 7, color: "#555", writingMode: "horizontal-tb" }}>{i * 10}</span>
                  </div>
                ))}
              </div>
              {/* Playhead */}
              <div style={{ position: "absolute", left: 8 + timelineFrame * 0.5, width: 2, height: 30, background: "#ff4444", borderRadius: 1, pointerEvents: "none" }} />
            </div>
          </div>
        )}

        {/* Coordinates */}
        {bottomTab === "coords" && (
          <div style={{ flex: 1, padding: "6px 8px", display: "flex", gap: 20, alignItems: "flex-start" }}>
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
                <div>
                  <div style={{ fontSize: 9, color: acDim, marginBottom: 2 }}>UNITS</div>
                  <select style={{ background: acDark, color: acText, border: "1px solid #444", fontSize: 9, padding: "1px 3px" }}>
                    {["mm", "cm", "m", "in", "ft"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
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
                    Skybox: {envSettings.skybox}<br />
                    Fog: {envSettings.fog ? "ON" : "OFF"}<br />
                    Water: {envSettings.water ? "ON" : "OFF"}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ STATUS BAR ══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", background: "#0078d4", height: 22, padding: "0 8px", gap: 0, flexShrink: 0, borderTop: "1px solid #005a9e" }}>
        <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 10, minWidth: 200, marginRight: 8 }}>
          {vp === "2d"
            ? `${worldPt.x.toFixed(3)},  ${worldPt.y.toFixed(3)},  0.000`
            : `3D | ${objs3d.length} objects | ${selIds3d.length} selected | ${editMode.replace("_mode", "")}`}
        </div>
        {vp === "2d" && [
          { label: "MODEL", active: true, action: () => {} },
          { label: "GRID", active: grid, action: () => setGrid(g => !g) },
          { label: "SNAP", active: snap, action: () => setSnap(s => !s) },
          { label: "ORTHO", active: orthoOn, action: () => setOrthoOn(o => !o) },
          { label: "DYN", active: dynInput, action: () => setDynInput(d => !d) },
        ].map(b => (
          <div key={b.label} onClick={b.action} style={{
            padding: "0 7px", cursor: "pointer", height: 22, display: "flex", alignItems: "center",
            color: b.active ? "#fff" : "rgba(255,255,255,0.5)",
            fontSize: 10, borderRight: "1px solid rgba(255,255,255,0.15)",
            background: b.active ? "rgba(255,255,255,0.15)" : "transparent",
            fontWeight: b.active ? "bold" : "normal",
          }}>{b.label}</div>
        ))}
        {vp === "3d" && [
          { label: "GRID", active: showGrid3d, action: () => setShowGrid3d(g => !g) },
          { label: "AXES", active: showAxes3d, action: () => setShowAxes3d(a => !a) },
          { label: visualStyle.toUpperCase(), active: true, action: () => {} },
        ].map(b => (
          <div key={b.label} onClick={b.action} style={{
            padding: "0 7px", cursor: "pointer", height: 22, display: "flex", alignItems: "center",
            color: b.active ? "#fff" : "rgba(255,255,255,0.5)",
            fontSize: 10, borderRight: "1px solid rgba(255,255,255,0.15)",
            background: b.active ? "rgba(255,255,255,0.15)" : "transparent",
          }}>{b.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, padding: "0 8px", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
          {vp === "2d" ? `${TOOL_LABEL[tool] || tool} | ${layer}` : `${editMode.replace("_mode", "")} | ${visualStyle}`}
        </div>
        <div style={{ padding: "0 6px", cursor: "pointer", fontSize: 11 }} title="Notifications">🔔</div>
      </div>
    </div>
  );
}