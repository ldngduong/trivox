import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  PerspectiveCamera,
} from '@react-three/drei';
import { useStudioUiStore } from '@/stores/studio-ui.store';
import type { JointMeta } from '@/types/studio.types';
import { CameraController } from './CameraController';
import { DynamicGlbModel } from './DynamicGlbModel';

interface ViewportCanvasProps {
  glbUrl: string;
  joints: JointMeta[];
}

export function ViewportCanvas({ glbUrl, joints }: ViewportCanvasProps) {
  const jointValues = useStudioUiStore((s) => s.jointValues);
  const hiddenParts = useStudioUiStore((s) => s.hiddenParts);
  const selectedPart = useStudioUiStore((s) => s.selectedPart);
  const setSelectedPart = useStudioUiStore((s) => s.setSelectedPart);
  const autoSpin = useStudioUiStore((s) => s.autoSpin);
  const spinRpm = useStudioUiStore((s) => s.spinRpm);
  const wireframe = useStudioUiStore((s) => s.wireframe);
  const cameraPreset = useStudioUiStore((s) => s.cameraPreset);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      onPointerMissed={() => setSelectedPart(null)}
      className="h-full w-full select-none"
    >
      <color attach="background" args={['#09090b']} />
      <PerspectiveCamera makeDefault position={[1.12, 0.16, -0.78]} fov={38} />
      <CameraController preset={cameraPreset} />

      <ambientLight intensity={0.65} />
      <directionalLight
        position={[2.5, 3.2, -1.8]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-2.0, 1.5, 2.2]} intensity={0.85} />
      <pointLight position={[0.9, 0.2, 0]} intensity={0.5} color="#f4f4f5" />

      <Suspense
        fallback={
          <Html center>
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300">
              Đang tải mô hình 3D...
            </div>
          </Html>
        }
      >
        <Environment preset="city" />
        <DynamicGlbModel
          glbUrl={glbUrl}
          joints={joints}
          jointValues={jointValues}
          hiddenParts={hiddenParts}
          selectedPart={selectedPart}
          onSelectPart={setSelectedPart}
          autoSpin={autoSpin}
          spinRpm={spinRpm}
          wireframe={wireframe}
        />
        <ContactShadows
          position={[0, -0.436, 0]}
          opacity={0.65}
          scale={2.4}
          blur={2.1}
          far={1.2}
        />
      </Suspense>
    </Canvas>
  );
}
