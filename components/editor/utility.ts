// This file was moved from bangle.io `lib/utils/utility.ts` so we can also use it in bangle.dev

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
  console.log('parent', parent, parentCoords, elementOffsetBottom, overTop, overBottom);
  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
