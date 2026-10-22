import { ClientError, type HttpResponse } from '../types';

export const TIMEOUT_MS = 10_000;

/** fetch con timeout de 10 s (AbortController + setTimeout). */
export async function fetchWithTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<HttpResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw new ClientError('TIMEOUT');
    }
    throw new ClientError('NETWORK');
  } finally {
    clearTimeout(timer);
  }
}
