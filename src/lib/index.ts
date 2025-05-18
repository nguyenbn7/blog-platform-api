export type SlugifyOptions = {
  replacement?: string;
  remove?: RegExp;
  lower?: boolean;
  strict?: boolean;
  locale?: string;
  trim?: boolean;
};

export const defaultSlugifyOptions: SlugifyOptions = {
  lower: true,
  locale: "vi",
  trim: true,
};

export function normalizeString(s: string) {
  return s.normalize("NFKC").trim().toLowerCase();
}
