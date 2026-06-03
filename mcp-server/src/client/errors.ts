export class Club360ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'Club360ApiError';
  }
}

export function extractApiMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const data = body as Record<string, unknown>;
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  const msg = data.message;
  if (Array.isArray(msg)) return msg.map(String).join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (msg != null && typeof msg === 'object') return JSON.stringify(msg);
  return '';
}

export function formatToolError(err: unknown): string {
  if (err instanceof Club360ApiError) {
    return JSON.stringify(
      {
        ok: false,
        statusCode: err.statusCode,
        message: err.message,
        hint:
          err.statusCode === 403
            ? 'Permiso denegado para tu rol. Ver club360://guide/permissions'
            : err.statusCode === 404
              ? 'Recurso no encontrado. Usá *_find antes de mutar.'
              : undefined,
      },
      null,
      2,
    );
  }
  if (err instanceof Error) {
    return JSON.stringify({ ok: false, message: err.message }, null, 2);
  }
  return JSON.stringify({ ok: false, message: String(err) }, null, 2);
}

export function formatToolSuccess(data: unknown): string {
  return JSON.stringify({ ok: true, data }, null, 2);
}
