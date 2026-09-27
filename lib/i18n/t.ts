/** Nested dictionary: leaves are strings, string arrays or arrays of objects (long-form pages). */
export type Messages = { [key: string]: string | Messages | Array<string | Messages> };

export type TParams = Record<string, string | number>;

/**
 * Texts write internal links as "[label](/{lang}/affiliate)". Fill in the language once, when a dictionary is
 * loaded, so no page can forget it (a forgotten one sent visitors to "/{lang}/affiliate", which does not exist).
 * Only "/{lang}" is touched: a bare "{lang}" is a normal placeholder with its own value.
 */
export function fillLinkLanguage(dict: Messages, lang: string): Messages {
  return JSON.parse(JSON.stringify(dict).replaceAll("/{lang}", `/${lang}`)) as Messages;
}

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
