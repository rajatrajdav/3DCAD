import React from 'react';

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-10, 5, -10]} intensity={0.3} color="#4299e1" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#63b3ed" />
    </>
  );
}
