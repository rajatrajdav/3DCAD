import React, { useRef, useEffect } from 'react';
import { OrbitControls, Grid, Environment, GizmoHelper, GizmoViewcube, TransformControls } from '@react-three/drei';

function SceneObject({ obj, selected, onSelect, transformMode, onObjectUpdate, readOnly, orbitControlsRef }) {
  const meshRef = useRef();
  const controlRef = useRef();
  const pendingUpdate = useRef(null);
  const color = obj.color || '#63b3ed';
  const { position, rotation, scale } = obj;
  const pos = [position.x, position.y, position.z];
  const rot = [rotation.x, rotation.y, rotation.z];
  const scl = [scale.x, scale.y, scale.z];

  useEffect(() => {
    const ctrl = controlRef.current;
    const mesh = meshRef.current;
    if (!ctrl || !mesh) return;

    const handleChange = () => {
      if (!mesh) return;
      pendingUpdate.current = {
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale:    { x: mesh.scale.x,    y: mesh.scale.y,    z: mesh.scale.z },
      };
    };

    const handleDraggingChanged = (event) => {
      if (!orbitControlsRef?.current) return;
      orbitControlsRef.current.enabled = !event.value;
      if (!event.value && pendingUpdate.current) {
        onObjectUpdate?.(obj.id, pendingUpdate.current);
        pendingUpdate.current = null;
      }
    };

    ctrl.addEventListener('change', handleChange);
    ctrl.addEventListener('dragging-changed', handleDraggingChanged);
    ctrl.attach(mesh);

    return () => {
      ctrl.removeEventListener('change', handleChange);
      ctrl.removeEventListener('dragging-changed', handleDraggingChanged);
      ctrl.detach();
      pendingUpdate.current = null;
    };
  }, [obj.id, onObjectUpdate, orbitControlsRef, selected, transformMode]);

  const geometry = () => {
    switch (obj.type) {
      case 'sphere':   return <sphereGeometry args={[obj.radius || 0.5, 32, 32]} />;
      case 'cone':     return <coneGeometry args={[obj.radius || 0.5, obj.height || 1, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[obj.radius || 0.5, obj.radius || 0.5, obj.height || 1, 32]} />;
      case 'box':      return <boxGeometry args={[obj.width || 1, obj.height || 1, obj.depth || 1]} />;
      case 'torus':    return <torusGeometry args={[obj.radius || 1, obj.tubeRadius || 0.3, 32, 32]} />;
      default:         return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <>
      <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} castShadow receiveShadow onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
        {geometry()}
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.5}
          emissive={selected ? color : '#000000'} 
          emissiveIntensity={selected ? 0.15 : 0}
        />
      </mesh>
      {selected && !readOnly && transformMode && (
        <TransformControls ref={controlRef} mode={transformMode} />
      )}
    </>
  );
}

export default function Scene3D({ objects, selectedId, onSelect, onObjectUpdate, readOnly = false, transformMode = null }) {
  const orbitControlsRef = useRef();

  return (
    <>
      <Lighting />
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
      <GizmoHelper alignment="top-right" margin={[60, 60]}>
        <GizmoViewcube
          color="#0d1117"
          strokeColor="#63b3ed"
          textColor="#94a3b8"
          opacity={0.9}
        />
      </GizmoHelper>
      {objects.filter(o => o.visible !== false).map(obj => (
        <SceneObject 
          key={obj.id} 
          obj={obj} 
          selected={selectedId === obj.id} 
          onSelect={readOnly ? () => {} : onSelect}
          transformMode={transformMode}
          onObjectUpdate={onObjectUpdate}
          readOnly={readOnly}
          orbitControlsRef={orbitControlsRef}
        />
      ))}
      <OrbitControls ref={orbitControlsRef} makeDefault enableDamping dampingFactor={0.05} />
      <Environment preset="city" />
    </>
  );
}

function Lighting() {
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
