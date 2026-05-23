import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Lighting from './Lighting';
import GridFloor from './GridFloor';
import GizmoCube from './GizmoCube';

function SceneObject({ obj, selected, onClick }) {
  const meshRef = useRef();
  const color = obj.color || '#63b3ed';
  const { position, rotation, scale } = obj;
  const pos = [position.x, position.y, position.z];
  const rot = [rotation.x, rotation.y, rotation.z];
  const scl = [scale.x, scale.y, scale.z];

  const geometry = () => {
    switch (obj.type) {
      case 'sphere':   return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cone':     return <coneGeometry args={[0.5, 1, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      default:         return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={e => { e.stopPropagation(); onClick(obj.id); }} castShadow receiveShadow>
      {geometry()}
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.5}
        emissive={selected ? color : '#000000'} emissiveIntensity={selected ? 0.15 : 0} />
      {selected && (
        <mesh>
          {geometry()}
          <meshBasicMaterial color={color} wireframe opacity={0.3} transparent />
        </mesh>
      )}
    </mesh>
  );
}

export default function SceneViewport({ objects, selectedId, onSelect, readOnly = false }) {
  return (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}
      style={{ background: '#060b16' }}
      onClick={e => { if (e.target === e.currentTarget) onSelect(null); }}>
      <Lighting />
      <GridFloor />
      <GizmoCube />
      {objects.filter(o => o.visible !== false).map(obj => (
        <SceneObject key={obj.id} obj={obj} selected={selectedId === obj.id} onClick={readOnly ? () => {} : onSelect} />
      ))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      <Environment preset="city" />
    </Canvas>
  );
}
