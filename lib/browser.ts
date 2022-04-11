
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

/** Based on https://developer.mozilla.org/docs/Web/HTTP/Browser_detection_using_the_user_agent */
export function isTouchDevice () {
  let hasTouchScreen = false;
  if ('maxTouchPoints' in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  }
  else if ('msMaxTouchPoints' in navigator) {
    // @ts-ignore
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  }
  else {
    const mQ = typeof window !== 'undefined'
      && window.matchMedia
      && matchMedia('(pointer:coarse)');
    if (mQ && mQ.media === '(pointer:coarse)') {
      hasTouchScreen = !!mQ.matches;
    }
    else if ('orientation' in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    }
    else {
      // Only as a last resort, fall back to user agent sniffing
      // @ts-ignore
      const UA = navigator.userAgent;
      hasTouchScreen = /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA)
        || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

export const safeScrollIntoViewIfNeeded = (
  element: HTMLElement,
  centerIfNeeded?: boolean
) => {
  if (typeof window !== 'undefined') {
    return 'scrollIntoViewIfNeeded' in document.body
      ? (element as any).scrollIntoViewIfNeeded(centerIfNeeded)
      : scrollIntoViewIfNeededPolyfill(element, centerIfNeeded);
  }
  return () => {};
};

function scrollIntoViewIfNeededPolyfill (
  element: HTMLElement,
  centerIfNeeded?: boolean
) {
  centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

  const parent = (element.closest('#inline-palette-wrapper') || element.parentNode)! as HTMLElement;
  const elementCoords = element.getBoundingClientRect();
  const parentCoords = parent.getBoundingClientRect();
  const elementOffsetTop = elementCoords.top - parentCoords.top;
  const elementOffsetBottom = elementCoords.bottom - parentCoords.top;
  const parentComputedStyle = window.getComputedStyle(parent, null);
  const parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width'), 10);
  const parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width'), 10);
  const overTop = elementOffsetTop < 0; const // element.offsetTop - parent.offsetTop < parent.scrollTop,
    overBottom = elementOffsetBottom > parentCoords.height;
  const overLeft = element.offsetLeft - parent.offsetLeft < parent.scrollLeft;
  const overRight = element.offsetLeft
        - parent.offsetLeft
        + element.clientWidth
        - parentBorderLeftWidth
      > parent.scrollLeft + parent.clientWidth;
  const alignWithTop = overTop && !overBottom;
  if ((overTop || overBottom) && centerIfNeeded) {
    parent.scrollTop = element.offsetTop
      - parent.offsetTop
      - parent.clientHeight / 2
      - parentBorderTopWidth
      + element.clientHeight / 2;
  }

  if ((overLeft || overRight) && centerIfNeeded) {
    parent.scrollLeft = element.offsetLeft
      - parent.offsetLeft
      - parent.clientWidth / 2
      - parentBorderLeftWidth
      + element.clientWidth / 2;
  }
  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// source: https://github.com/vercel/next.js/discussions/18072
// update URL without Next.js re-rendering the page
export function silentlyUpdateURL (newUrl: string) {
  window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
}

export function getCookie (name: string): string {
  const cookieMap = document.cookie.split(';').reduce<{ [key: string]: string }>((cookies, cookie) => {
    const _name = cookie.trim().split('=')[0];
    const value = cookie.trim().split('=')[1];
    cookies[_name] = decodeURIComponent(value);
    return cookies;
  }, {});
  return cookieMap[name];
}

// cookies reference: https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
export function setCookie (name: string, value: string, expiresInDays: number = 10 * 365) {
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);
  const domainString = window.location.hostname === 'localhost' ? '' : 'domain=charmverse.io; ';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; ${domainString}path=/; SameSite=Lax; secure`;
}

export function deleteCookie (name: string) {
  setCookie(name, '', 0);
}
