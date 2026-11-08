import { create } from 'zustand';
import type { CameraPresetState, ToolStep } from '@/types/studio.types';

interface StudioUiStoreState {
  jointValues: Record<string, number>;
  hiddenParts: Record<string, boolean>;
  selectedPart: string | null;
  autoSpin: boolean;
  spinRpm: number;
  wireframe: boolean;
  showRefImage: boolean;
  cameraPreset: CameraPresetState;
  activeSteps: ToolStep[];
  isProcessing: boolean;
  setJointValues: (values: Record<string, number>) => void;
  updateJointValue: (jointId: string, value: number) => void;
  togglePartVisibility: (partId: string) => void;
  setSelectedPart: (partId: string | null) => void;
  setAutoSpin: (spinning: boolean) => void;
  setSpinRpm: (rpm: number) => void;
  setWireframe: (wireframe: boolean) => void;
  setShowRefImage: (show: boolean) => void;
  triggerCameraPreset: (id: string) => void;
  setActiveSteps: (steps: ToolStep[]) => void;
  appendActiveStep: (step: ToolStep) => void;
  updateActiveStep: (step: ToolStep) => void;
  setIsProcessing: (processing: boolean) => void;
}

export const useStudioUiStore = create<StudioUiStoreState>((set) => ({
  jointValues: {},
  hiddenParts: {},
  selectedPart: null,
  autoSpin: false,
  spinRpm: 800,
  wireframe: false,
  showRefImage: false,
  cameraPreset: { id: 'standard', tick: 0 },
  activeSteps: [],
  isProcessing: false,
  setJointValues: (jointValues) => set({ jointValues }),
  updateJointValue: (jointId, value) =>
    set((s) => ({
      jointValues: { ...s.jointValues, [jointId]: value },
    })),
  togglePartVisibility: (partId) =>
    set((s) => ({
      hiddenParts: { ...s.hiddenParts, [partId]: !s.hiddenParts[partId] },
    })),
  setSelectedPart: (selectedPart) => set({ selectedPart }),
  setAutoSpin: (autoSpin) => set({ autoSpin }),
  setSpinRpm: (spinRpm) => set({ spinRpm }),
  setWireframe: (wireframe) => set({ wireframe }),
  setShowRefImage: (showRefImage) => set({ showRefImage }),
  triggerCameraPreset: (id) =>
    set((s) => ({
      cameraPreset: { id, tick: s.cameraPreset.tick + 1 },
    })),
  setActiveSteps: (activeSteps) => set({ activeSteps }),
  appendActiveStep: (step) =>
    set((s) => ({ activeSteps: [...s.activeSteps, step] })),
  updateActiveStep: (step) =>
    set((s) => ({
      activeSteps: s.activeSteps.map((st) => (st.id === step.id ? step : st)),
    })),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
}));
