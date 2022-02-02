
export function isMobile (): boolean {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];
  if (typeof window === 'undefined') {
    return false;
  }

  return toMatch.some((toMatchItem) => {
    return window.navigator.userAgent.match(toMatchItem);
  });
}
