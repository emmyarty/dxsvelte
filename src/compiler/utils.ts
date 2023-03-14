export function posixSlash(str: string) {
  if (!str) return str;
  return str.replace(/\\/g, "/");
}