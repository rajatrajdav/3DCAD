import React, { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';

export default function TransformControl({ target, mode, onUpdate }) {
  const controlRef = useRef();

  useEffect(() => {
    const ctrl = controlRef.current;
    if (!ctrl) return;
    const onChange = () => {
      if (ctrl.object) {
        onUpdate({
          position: { x: ctrl.object.position.x, y: ctrl.object.position.y, z: ctrl.object.position.z },
          rotation: { x: ctrl.object.rotation.x, y: ctrl.object.rotation.y, z: ctrl.object.rotation.z },
          scale:    { x: ctrl.object.scale.x,    y: ctrl.object.scale.y,    z: ctrl.object.scale.z },
        });
      }
    };
    ctrl.addEventListener('change', onChange);
    return () => ctrl.removeEventListener('change', onChange);
  }, [onUpdate]);

  if (!target) return null;
  return <TransformControls ref={controlRef} object={target} mode={mode} />;
}
