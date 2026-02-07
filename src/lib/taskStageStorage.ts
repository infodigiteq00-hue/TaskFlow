const TASK_STAGE_CUSTOM_KEY = 'task-stage-custom';

export function getCustomTaskStages(): string[] {
  try {
    const raw = localStorage.getItem(TASK_STAGE_CUSTOM_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addCustomTaskStage(stage: string): void {
  const trimmed = stage.trim();
  if (!trimmed) return;
  const list = getCustomTaskStages();
  if (list.includes(trimmed)) return;
  list.push(trimmed);
  try {
    localStorage.setItem(TASK_STAGE_CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
