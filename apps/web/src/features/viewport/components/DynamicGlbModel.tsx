import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { JointMeta, JointNodeBinding } from '@/types/studio.types';

interface DynamicGlbModelProps {
  glbUrl: string;
  joints: JointMeta[];
  jointValues: Record<string, number>;
  hiddenParts: Record<string, boolean>;
  selectedPart: string | null;
  onSelectPart: (partId: string | null) => void;
  autoSpin: boolean;
  spinRpm: number;
  wireframe: boolean;
}

export function DynamicGlbModel({
  glbUrl,
  joints,
  jointValues,
  hiddenParts,
  selectedPart,
  onSelectPart,
  autoSpin,
  spinRpm,
  wireframe,
}: DynamicGlbModelProps) {
  const { scene } = useGLTF(glbUrl);
  const jointsRef = useRef<Record<string, JointNodeBinding>>({});
  const rootGroupRef = useRef<THREE.Group>(null);
  const spinAngleRef = useRef(0);

  const jointConfigMap = useMemo(() => {
    const map: Record<string, JointMeta> = {};
    for (const j of joints) {
      map[j.id] = j;
    }
    return map;
  }, [joints]);

  const clonedScene = useMemo(() => {
    const root = scene.clone(true);
    const bindings: Record<string, JointNodeBinding> = {};

    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          if (mesh.name.includes('glass')) {
            mat.transparent = true;
            mat.opacity = 0.28;
            mat.roughness = 0.08;
            mat.metalness = 0.1;
            mat.depthWrite = false;
          } else if (
            mesh.name.includes('door_ring') ||
            mesh.name.includes('led_screen')
          ) {
            mat.roughness = 0.14;
            mat.metalness = 0.25;
          } else if (mesh.name.includes('drum_shell')) {
            mat.roughness = 0.16;
            mat.metalness = 0.92;
          } else if (
            mesh.name.includes('cabinet') ||
            mesh.name.includes('top_lid') ||
            mesh.name.includes('drawer_tray') ||
            mesh.name.includes('filter_flap')
          ) {
            mat.roughness = 0.35;
            mat.metalness = 0.62;
          }
          mesh.material = mat;
        }
      }

      const j = obj.userData?.s3d_joint;
      if (j && j.name) {
        bindings[j.name] = {
          node: obj,
          type: j.type || 'revolute',
          restPos: obj.position.clone(),
          restQuat: obj.quaternion.clone(),
          axis: j.axis
            ? new THREE.Vector3(j.axis[0], j.axis[1], j.axis[2]).normalize()
            : new THREE.Vector3(0, 1, 0),
          restValue: j.value || 0,
        };
      }
    });

    jointsRef.current = bindings;
    return root;
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const baseName = mesh.name.split('.')[0];
        mesh.visible = !hiddenParts[mesh.name] && !hiddenParts[baseName];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.wireframe = wireframe;
          if (
            selectedPart &&
            (mesh.name === selectedPart || baseName === selectedPart)
          ) {
            mat.emissive = new THREE.Color('#27272a');
            mat.emissiveIntensity = 0.6;
          } else if (!mesh.name.includes('led')) {
            mat.emissive = new THREE.Color('#000000');
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, hiddenParts, wireframe, selectedPart]);

  useFrame((state, delta) => {
    const bindings = jointsRef.current;
    Object.entries(bindings).forEach(([name, binding]) => {
      const cfg = jointConfigMap[name];
      const rawVal = jointValues[name] ?? cfg?.default ?? 0;

      let targetVal =
        binding.type === 'prismatic'
          ? rawVal
          : THREE.MathUtils.degToRad(rawVal);

      if (binding.type === 'continuous' && autoSpin) {
        const radPerSec = (spinRpm / 60) * Math.PI * 2 * 0.15;
        spinAngleRef.current =
          (spinAngleRef.current + delta * radPerSec) % (Math.PI * 2);
        targetVal += spinAngleRef.current;
      }

      const deltaVal = targetVal - binding.restValue;
      const { node, type, restPos, restQuat, axis } = binding;

      if (type === 'prismatic') {
        const offset = axis
          .clone()
          .multiplyScalar(deltaVal)
          .applyQuaternion(restQuat);
        node.position.copy(restPos).add(offset);
      } else if (type === 'revolute' || type === 'continuous') {
        const rot = new THREE.Quaternion().setFromAxisAngle(axis, deltaVal);
        node.quaternion.copy(restQuat).multiply(rot);
      }
    });

    if (rootGroupRef.current) {
      if (autoSpin) {
        const t = state.clock.elapsedTime;
        const factor = Math.min(1.5, spinRpm / 800);
        const amp = 0.0009 * factor;
        rootGroupRef.current.position.set(
          Math.sin(t * 58) * amp,
          -0.425 + Math.cos(t * 64) * (amp * 0.6),
          Math.sin(t * 52 + 1.2) * amp,
        );
      } else {
        rootGroupRef.current.position.set(0, -0.425, 0);
      }
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, -0.425, 0]}>
      <pointLight
        position={[0.16, -0.04, 0]}
        intensity={1.8}
        distance={0.75}
        color="#f4f4f5"
      />
      <primitive
        object={clonedScene}
        onClick={(e: { stopPropagation: () => void; object?: THREE.Object3D }) => {
          e.stopPropagation();
          if (e.object?.name) {
            onSelectPart(
              selectedPart === e.object.name ? null : e.object.name,
            );
          }
        }}
      />
    </group>
  );
}
