/** Nested dictionary: leaves are strings, string arrays or arrays of objects (long-form pages). */
export type Messages = { [key: string]: string | Messages | Array<string | Messages> };

export type TParams = Record<string, string | number>;

export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

export function getRaw(dict: Messages, key: string): string | Messages | Array<string | Messages> | undefined {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return cur as string | Messages | Array<string | Messages>;
}

export type TFunction = (key: string, params?: TParams) => string;

export function createT(dict: Messages): TFunction {
  return (key, params) => {
    const v = getRaw(dict, key);
    if (typeof v !== "string") {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing string: ${key}`);
      return key;
    }
    return interpolate(v, params);
  };
}

/** Read an array/object from the dictionary (used by long-form pages). */
export function createRaw(dict: Messages) {
  return function raw<T = Array<string | Messages>>(key: string): T {
    const v = getRaw(dict, key);
    if (v === undefined) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing block: ${key}`);
      return [] as unknown as T;
    }
    return v as unknown as T;
  };
}
