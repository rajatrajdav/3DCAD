import React, { useRef } from 'react';
import { GizmoHelper, GizmoViewcube } from '@react-three/drei';

export default function GizmoCube() {
  return (
    <GizmoHelper alignment="top-right" margin={[60, 60]}>
      <GizmoViewcube
        color="#0d1117"
        strokeColor="#63b3ed"
        textColor="#94a3b8"
        opacity={0.9}
      />
    </GizmoHelper>
  );
}
