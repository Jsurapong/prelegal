/**
 * Generic document field types for multi-document support.
 * All document types use a flat Record<string, string> for field storage.
 */

export type GenericDocFields = Record<string, string>;

/** Merge non-null, non-empty incoming fields into current fields. */
export function mergeDocFields(
  current: GenericDocFields,
  incoming: Record<string, string | null> | undefined,
): GenericDocFields {
  if (!incoming) return current;
  const result = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value != null && value !== "") {
      result[key] = value;
    }
  }
  return result;
}
