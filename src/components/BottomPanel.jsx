const BottomPanel = ({ 
  bottomTab, 
  setBottomTab, 
  cmdLog, 
  cmdInput, 
  setCmdInput, 
  execCmd, 
  cmdRef, 
  timelineFrame, 
  setTimelineFrame, 
  timelinePlaying, 
  setTimelinePlaying, 
  vp, 
  worldPt, 
  drawing, 
  startPt, 
  camAngle, 
  camPitch, 
  camDist, 
  firstSel3d, 
  envSettings 
}) => {
  const acBlue = "#0078d4";
  const acDim = "#777";
  const acText = "#cccccc";
  const acDark = "#1e1e1e";

  return (
    <div style={{ background: "#111", borderTop: `1px solid #444`, flexShrink: 0, display: "flex", flexDirection: "column", height: 100 }}>
      {/* Bottom tabs */}
      <div style={{ display: "flex", background: "#1a1a1a", borderBottom: "1px solid #333", height: 20, flexShrink: 0 }}>
        {[{ id: "cmd", l: "Command" }, { id: "timeline", l: "Timeline" }, { id: "coords", l: "Coordinates" }].map(t => (
          <div key={t.id} onClick={() => setBottomTab(t.id)} style={{
            padding: "2px 10px", cursor: "pointer", fontSize: 9,
            color: bottomTab === t.id ? "#ffffff" : acDim,
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
  );
};

export default BottomPanel;