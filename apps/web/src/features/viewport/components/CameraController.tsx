import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type * as THREE from 'three';
import type { CameraPresetState } from '@/types/studio.types';

interface CameraControllerProps {
  preset: CameraPresetState;
}

export function CameraController({ preset }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    const cam = ctrl.object as THREE.PerspectiveCamera;

    if (preset.id === 'standard') {
      cam.position.set(1.12, 0.16, -0.78);
      ctrl.target.set(0, 0.0, 0);
    } else if (preset.id === 'front') {
      cam.position.set(1.35, 0.04, 0.0);
      ctrl.target.set(0, 0.0, 0);
    } else if (preset.id === 'side') {
      cam.position.set(0.55, 0.05, -1.25);
      ctrl.target.set(0, 0.0, 0);
    } else if (preset.id === 'top') {
      cam.position.set(0.35, 1.35, 0.0);
      ctrl.target.set(0, 0.0, 0);
    }
    ctrl.update();
  }, [preset]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={0.45}
      maxDistance={3.5}
    />
  );
}
