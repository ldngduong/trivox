export interface CodePatchItem {
  target: string;
  replacement: string;
}

export interface CodePatchResult {
  ok: boolean;
  code: string;
  error?: string;
}

export function applyCodePatches(
  source: string,
  patches: CodePatchItem[],
): CodePatchResult {
  if (!Array.isArray(patches) || patches.length === 0) {
    return {
      ok: false,
      code: source,
      error: 'Danh sách patches rỗng.',
    };
  }

  let nextCode = source;
  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i];
    const target = typeof patch.target === 'string' ? patch.target : '';
    const replacement =
      typeof patch.replacement === 'string' ? patch.replacement : '';

    if (!target) {
      return {
        ok: false,
        code: source,
        error: `Patch #${i + 1} thiếu chuỗi target.`,
      };
    }

    if (!nextCode.includes(target)) {
      return {
        ok: false,
        code: source,
        error: `Patch #${i + 1} không khớp với mã nguồn hiện tại. Chuỗi không tìm thấy:\n${target}`,
      };
    }

    nextCode = nextCode.replace(target, replacement);
  }

  return {
    ok: true,
    code: nextCode,
  };
}
