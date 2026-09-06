/**
 * Sanitizes an object by recursively stripping all undefined values.
 * This guarantees that payloads passed to Firestore setDoc/updateDoc never crash
 * the Firestore driver with "Function setDoc() called with invalid data. Unsupported field value: undefined".
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = sanitizeFirestorePayload(value);
      }
    }
    return result as T;
  }

  return obj;
}
