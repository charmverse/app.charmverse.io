export function cx(...args: any[]) {
  const classes: string[] = [];
  for (const arg of args) {
    if (!arg) {
      continue;
    }
    classes.push(arg);
  }
  return classes.join(' ');
}

/** Based on https://developer.mozilla.org/docs/Web/HTTP/Browser_detection_using_the_user_agent */
export function isTouchDevice() {
  let hasTouchScreen = false;
  if ('maxTouchPoints' in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ('msMaxTouchPoints' in navigator) {
    // @ts-ignore
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    const mQ =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      matchMedia('(pointer:coarse)');
    if (mQ && mQ.media === '(pointer:coarse)') {
      hasTouchScreen = !!mQ.matches;
    } else if ('orientation' in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      // @ts-ignore
      const UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

export function makeSafeForCSS(name: string) {
  return name.replace(/[^a-z0-9]/g, function (s: string) {
    let c = s.charCodeAt(0);
    if (c === 32) {
      return '-';
    }
    if (c >= 65 && c <= 90) {
      return '_' + s.toLowerCase();
    }
    return '__';
  });
}