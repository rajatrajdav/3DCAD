const Icon = ({ d, s = 14, c = "currentColor", f = "none", sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke={c} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export default Icon;