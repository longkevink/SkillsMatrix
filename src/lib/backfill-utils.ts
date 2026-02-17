export function normalizeRankedIds(ids: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  }

  return normalized;
}

export function moveItemBetweenLists(
  source: string[],
  target: string[],
  activeId: string,
  targetIndex: number
) {
  const nextSource = source.filter((id) => id !== activeId);
  const nextTarget = [...target];

  const insertIndex = Math.max(0, Math.min(targetIndex, nextTarget.length));
  nextTarget.splice(insertIndex, 0, activeId);

  return {
    source: normalizeRankedIds(nextSource),
    target: normalizeRankedIds(nextTarget),
  };
}
