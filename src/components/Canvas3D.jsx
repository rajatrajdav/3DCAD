import { useEffect } from 'react';

const Canvas3D = ({ 
  canvasRef, 
  csz, 
  vp, 
  objs3d, 
  lights, 
  selIds3d, 
  camAngle, 
  camPitch, 
  camDist, 
  visualStyle, 
  envSettings, 
  showGrid3d, 
  showAxes3d, 
  editMode, 
  onMouseMove, 
  onMouseDown, 
  onMouseUp, 
  onWheel, 
  orbiting, 
  tool, 
  isDrag, 
  draw3DScene 
}) => {
  // ── 3D Canvas draw ─────────────────────────────────────────────────────
  useEffect(() => {
    if (vp !== "3d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
  }, [vp, objs3d, lights, selIds3d, camAngle, camPitch, camDist, visualStyle, envSettings, showGrid3d, showAxes3d, editMode, csz, draw3DScene]);

  if (vp !== "3d") return null;

  return (
    <>
      <canvas ref={canvasRef} width={csz.w} height={csz.h}
        style={{
          display: "block", width: "100%", height: "100%",
          cursor: orbiting ? "grabbing" : tool === "pan" ? "all-scroll" : "default",
        }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
      />

      {/* 3D overlay controls */}
      <div style={{ position: "absolute", right: 10, top: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Visual style */}
        <div style={{ background: "rgba(20,20,20,0.9)", border: "1px solid #444", borderRadius: 4, padding: 4 }}>
          <div style={{ fontSize: 8, color: "#777", textAlign: "center", marginBottom: 2 }}>VISUAL</div>
          {["wireframe", "shaded", "realistic", "conceptual", "xray"].map(vs => (
            <div key={vs} onClick={() => setVisualStyle(vs)}
              style={{ fontSize: 9, cursor: "pointer", padding: "2px 6px", borderRadius: 2, background: visualStyle === vs ? "#0078d4" : "transparent", color: visualStyle === vs ? "#fff" : "#bbb" }}>
              {vs}
            </div>
          ))}
        </div>
        {/* Views */}
        <div style={{ background: "rgba(20,20,20,0.9)", border: "1px solid #444", borderRadius: 4, padding: 4 }}>
          <div style={{ fontSize: 8, color: "#777", textAlign: "center", marginBottom: 2 }}>VIEWS</div>
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

      {/* Info overlay */}
      <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(20,20,20,0.85)", border: "1px solid #333", borderRadius: 3, padding: "3px 8px", fontSize: 9, color: "#bbb", pointerEvents: "none" }}>
        {editMode !== "obj_mode" ? `✎ ${editMode.replace("_", " ").toUpperCase()} | ` : ""}
        Style: {visualStyle} | Objects: {objs3d.length} | Drag=orbit Scroll=zoom RMB=orbit
      </div>
    </>
  );
};

export default Canvas3D;