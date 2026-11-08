import {
  COMMON_JOINT_LABELS,
  COMMON_PART_LABELS,
} from '../constants/label-dictionary.constants.js';

export function formatJointLabel(id: string): string {
  if (COMMON_JOINT_LABELS[id]) return COMMON_JOINT_LABELS[id];
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPartLabel(name: string): string {
  const base = name.split('.')[0];
  if (COMMON_PART_LABELS[base]) {
    const suffix = name.includes('.')
      ? ` ${parseInt(name.split('.')[1], 10)}`
      : '';
    return `${COMMON_PART_LABELS[base]}${suffix}`;
  }
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
