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
    const msg = data.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (typeof data.error === 'string') return data.error;
  }
  return '';
}
