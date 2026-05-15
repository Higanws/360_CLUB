export function extractApiMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as Record<string, unknown>;
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }
    const msg = data.message;
    if (Array.isArray(msg)) return msg.map(String).join(', ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (msg != null && typeof msg === 'object') {
      return JSON.stringify(msg);
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return '';
}
