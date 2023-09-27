export function isExternalUrl(urlOrPath: string) {
  try {
    const url = new URL(urlOrPath);
    return !!url.origin;
  } catch (e) {
    return false;
  }
}
