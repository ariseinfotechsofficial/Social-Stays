/** "Villas in {name}" → "Villas in Mandu". Unknown placeholders are left as they are. */
export const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
