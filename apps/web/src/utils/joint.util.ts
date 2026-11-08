import type { JointMeta } from '@/types/studio.types';

export function buildOpenAllJointValues(
  joints: JointMeta[],
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const j of joints) {
    if (j.id === 'door_hinge') next[j.id] = 105;
    else if (j.id === 'drawer_slide') next[j.id] = 140;
    else if (j.id === 'dial_turn') next[j.id] = 60;
    else if (j.id === 'drum_spin') next[j.id] = 45;
    else if (j.id === 'filter_hinge') next[j.id] = 75;
    else next[j.id] = Math.round(j.min + (j.max - j.min) * 0.7);
  }
  return next;
}

export function buildResetJointValues(
  joints: JointMeta[],
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const j of joints) {
    next[j.id] = j.default ?? 0;
  }
  return next;
}
