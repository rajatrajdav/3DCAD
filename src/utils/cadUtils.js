// CAD Utilities for 2D and 3D operations

export const TOOLS = [
  { id: "select",    label: "Select",       icon: "M5 3l14 9-7 2-3 7z", group: "select" },
  { id: "line",      label: "Line",         icon: "M5 19L19 5", group: "draw" },
  { id: "polyline",  label: "Polyline",     icon: "M4 20 L8 8 L14 14 L20 4", group: "draw" },
  { id: "rectangle", label: "Rectangle",    icon: "M3 5h18v14H3z", group: "draw" },
  { id: "circle",    label: "Circle",       icon: "M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0", group: "draw" },
  { id: "arc",       label: "Arc",          icon: "M5 19 A 10 10 0 0 1 19 5", group: "draw" },
  { id: "ellipse",   label: "Ellipse",      icon: "M12 12m-9 0a9 5 0 1 0 18 0a9 5 0 1 0-18 0", group: "draw" },
  { id: "spline",    label: "Spline",       icon: "M3 17 C 6 3, 10 21, 14 10, 18 3", group: "draw" },
  { id: "text",      label: "Text",         icon: "M4 7V4h16v3M9 20h6M12 4v16", group: "annotate" },
  { id: "dimension", label: "Dimension",    icon: "M3 12h18M3 8v8M21 8v8", group: "annotate" },
  { id: "move",      label: "Move",         icon: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 2v20M2 12h20", group: "modify" },
  { id: "copy",      label: "Copy",         icon: "M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2M8 4h8a2 2 0 0 1 2 2v8M8 4v8h8V4", group: "modify" },
  { id: "rotate",    label: "Rotate",       icon: "M21.5 2v6h-6M2.5 12a10 10 0 1 0 1.4-5", group: "modify" },
  { id: "scale",     label: "Scale",        icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7", group: "modify" },
  { id: "extrude",   label: "Extrude",      icon: "M4 16l8 4 8-4V8l-8-4-8 4zM4 8l8 4 8-4M12 12v8", group: "3d" },
  { id: "revolve",   label: "Revolve",      icon: "M12 3a9 9 0 1 1-9 9M12 3v9l6 3", group: "3d" },
  { id: "measure",   label: "Measure",      icon: "M2 12h20M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8", group: "measure" },
  { id: "zoom",      label: "Zoom",         icon: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM10 7v3M7 10h3", group: "view" },
  { id: "pan",       label: "Pan",          icon: "M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M12 5l3-3 3 3M12 19l-3 3-3-3M12 2v20", group: "view" },
];

export const TOOL_GROUPS = {
  select: { label: "Select", color: "#4fc3f7" },
  draw:   { label: "Draw",   color: "#81c784" },
  annotate:{ label: "Annotate", color: "#ffb74d" },
  modify: { label: "Modify", color: "#f48fb1" },
  "3d":   { label: "3D",     color: "#ce93d8" },
  measure:{ label: "Measure",color: "#80cbc4" },
  view:   { label: "View",   color: "#90a4ae" },
};

export const SNAP_MODES = ["Endpoint", "Midpoint", "Center", "Node", "Quadrant", "Intersection", "Insertion", "Perpendicular", "Tangent", "Nearest"];

export const LAYERS = [
  { id: 1, name: "0",           color: "#ffffff", visible: true, locked: false, lineType: "Continuous", lineWeight: "Default" },
  { id: 2, name: "Walls",       color: "#ff4444", visible: true, locked: false, lineType: "Continuous", lineWeight: "0.35mm" },
  { id: 3, name: "Dimensions",  color: "#4488ff", visible: true, locked: false, lineType: "Continuous", lineWeight: "0.18mm" },
  { id: 4, name: "Hidden",      color: "#ffaa00", visible: true, locked: false, lineType: "HIDDEN",     lineWeight: "0.18mm" },
  { id: 5, name: "Center",      color: "#ff44ff", visible: true, locked: false, lineType: "CENTER",     lineWeight: "0.18mm" },
  { id: 6, name: "Construction",color: "#44aaaa", visible: true, locked: false, lineType: "Phantom",    lineWeight: "0.09mm" },
];

// Export functions for DXF format
export const exportToDXF = (entities) => {
  let dxf = `  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1021\n  0\nENDSEC\n  0\nSECTION\n  2\nENTITIES\n`;
  
  entities.forEach(ent => {
    if (ent.type === "line") {
      dxf += `  0\nLINE\n  8\n${ent.layer}\n 10\n${ent.x1}\n 20\n${ent.y1}\n 11\n${ent.x2}\n 21\n${ent.y2}\n`;
    } else if (ent.type === "circle") {
      dxf += `  0\nCIRCLE\n  8\n${ent.layer}\n 10\n${ent.cx}\n 20\n${ent.cy}\n 40\n${ent.r}\n`;
    } else if (ent.type === "point") {
      dxf += `  0\nPOINT\n  8\n${ent.layer}\n 10\n${ent.x}\n 20\n${ent.y}\n`;
    }
  });
  
  dxf += `  0\nENDSEC\n  0\nEOF`;
  return dxf;
};

// Export to STL format for 3D objects
export const exportToSTL = (objects) => {
  let stl = `solid CAD_Model\n`;
  
  objects.forEach(obj => {
    // Simple triangle generation for basic shapes
    if (obj.type === "box") {
      stl += generateBoxSTL(obj);
    } else if (obj.type === "sphere") {
      stl += generateSphereSTL(obj);
    } else if (obj.type === "cylinder") {
      stl += generateCylinderSTL(obj);
    }
  });
  
  stl += `endsolid CAD_Model`;
  return stl;
};

const generateBoxSTL = (box) => {
  const { x, y, z, width, height, depth } = box;
  let stl = ``;
  // Generate 12 triangles for a box
  const vertices = [
    [x, y, z], [x + width, y, z], [x + width, y + height, z], [x, y + height, z],
    [x, y, z + depth], [x + width, y, z + depth], [x + width, y + height, z + depth], [x, y + height, z + depth]
  ];
  return stl;
};

const generateSphereSTL = (sphere) => { return ``; };
const generateCylinderSTL = (cylinder) => { return ``; };

// Hit testing for 2D and 3D objects
export const hitTest2D = (ent, pt, tol = 5) => {
  if (ent.type === "line") {
    const { x1, y1, x2, y2 } = ent;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.01) return false;
    const t = Math.max(0, Math.min(1, ((pt.x - x1) * (x2 - x1) + (pt.y - y1) * (y2 - y1)) / (len * len)));
    return Math.hypot(pt.x - (x1 + t * (x2 - x1)), pt.y - (y1 + t * (y2 - y1))) < tol;
  }
  if (ent.type === "circle") return Math.abs(Math.hypot(pt.x - ent.cx, pt.y - ent.cy) - ent.r) < tol;
  if (ent.type === "rectangle") {
    const inX = pt.x >= Math.min(ent.x1, ent.x2) - tol && pt.x <= Math.max(ent.x1, ent.x2) + tol;
    const inY = pt.y >= Math.min(ent.y1, ent.y2) - tol && pt.y <= Math.max(ent.y1, ent.y2) + tol;
    return inX && inY;
  }
  return false;
};

// Snap point calculation
export const calculateSnapPoint = (pt, gridSize, gridEnabled) => {
  if (!gridEnabled) return pt;
  return {
    x: Math.round(pt.x / gridSize) * gridSize,
    y: Math.round(pt.y / gridSize) * gridSize,
  };
};

// Orthogonal constraint
export const applyOrthoConstraint = (from, to, orthoMode) => {
  if (!orthoMode) return to;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.abs(dx) >= Math.abs(dy) ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
};

// Convert coordinates between world and screen space
export const worldToScreen = (world, pan, zoom) => ({
  x: world.x * zoom + pan.x,
  y: world.y * zoom + pan.y,
});

export const screenToWorld = (screen, pan, zoom) => ({
  x: (screen.x - pan.x) / zoom,
  y: (screen.y - pan.y) / zoom,
});
