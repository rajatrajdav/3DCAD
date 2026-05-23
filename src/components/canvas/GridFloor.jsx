import React from 'react';
import { Grid } from '@react-three/drei';

export default function GridFloor() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[30, 30]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#1e3a5f"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#2d5a8e"
      fadeDistance={40}
      fadeStrength={1}
      infiniteGrid
    />
  );
}
