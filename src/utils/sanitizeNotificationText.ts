/** Strip model thinking / prompt leakage before farmers see a notification. */
export function sanitizeNotificationText(text: string, fallback = ''): string {
  let cleaned = String(text ?? '');

  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/```(?:thinking|reasoning|thought)\b[\s\S]*?```/gi, '');

  if (looksLikeReasoning(cleaned)) {
    const afterFinal = cleaned.split(/(?:final answer|farmer[- ]facing|output)\s*[:\-]\s*/i).pop();
    cleaned = afterFinal && !looksLikeReasoning(afterFinal) ? afterFinal : '';
  }

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned || fallback;
}

export function looksLikeReasoning(text: string): boolean {
  const haystack = String(text ?? '').toLowerCase();
  if (!haystack.trim()) return false;

  return [
    '<think',
    'thinking process',
    'deconstruct the request',
    'analyze user input',
    "here's a thinking",
    'here is a thinking',
    'kind=',
    'bestdate=',
    '**goal:**',
  ].some((needle) => haystack.includes(needle));
}
