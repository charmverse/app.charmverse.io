
// using deprectead feature, navigator.userAgent doesnt exist yet in FF - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
export function isMac () {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

export function isTouchScreen (): boolean {
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

export function isSmallScreen () {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 600;
  }
  return false;
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
      && window.matchMedia('(pointer:coarse)');
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

// @source: https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
export function getNewUrl (params: Record<string, string | null>, currentUrl = window.location.href) {
  const url = new URL(currentUrl, currentUrl.match('http') ? undefined : window.location.origin);
  const urlParams: URLSearchParams = new URLSearchParams(url.search);
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (typeof value === 'string') {
        urlParams.set(key, value);
      }
      else {
        urlParams.delete(key);
      }
    }
  }
  url.search = urlParams.toString();
  return url;
}

// update URL without Next.js re-rendering the page
// source: https://github.com/vercel/next.js/discussions/18072
export function setUrlWithoutRerender (pathname: string, params: Record<string, string | null>) {

  const newUrl = getNewUrl(params);
  // get the path that Next.js uses internally
  const nextjsPath = `${pathname}${newUrl.search}`;
  // get the path that appears in the browsr
  const displayPath = newUrl.toString().replace(window.location.origin, '');

  const newState = {
    ...window.history.state,
    as: displayPath,
    url: nextjsPath
  };

  window.history.replaceState(newState, '', displayPath);
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
export function setCookie ({ name, value, expiresInDays = 10 * 365 }: { name: string, value: string, expiresInDays: number }) {
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; secure`;
}

export function deleteCookie (name: string) {
  setCookie({ name, value: '', expiresInDays: 0 });
}

export function createHighlightDomElement (parentElement: HTMLElement | null) {
  if (parentElement) {
    setTimeout(() => {
      const boundingRect = parentElement.getBoundingClientRect();
      // Need to create a custom element as adding styling to prosemirror-node isn't possible
      const highlightElement = document.createElement('span');
      document.body.appendChild(highlightElement);
      // console.log('boundingRect', boundingRect, parentElement);
      highlightElement.style.display = 'block';
      highlightElement.style.position = 'absolute';
      // Set the location of the custom element
      highlightElement.style.top = `${boundingRect.top}px`;
      highlightElement.style.left = `${boundingRect.left}px`;
      highlightElement.style.width = `${boundingRect.width}px`;
      highlightElement.style.height = `${boundingRect.height}px`;
      highlightDomElement(highlightElement, () => {
        // Remove the custom element after the highlighting is done
        document.body.removeChild(highlightElement);
      });
    }, 500);
  }
}

export function highlightDomElement (domElement: HTMLElement, postHighlight?: () => void) {
  domElement.scrollIntoView({
    behavior: 'smooth'
  });
  domElement.style.backgroundColor = 'var(--charmeditor-active)';
  domElement.style.transition = 'background-color 250ms ease-in-out';
  // Remove the highlight after 500 ms
  setTimeout(() => {
    domElement.style.removeProperty('background-color');
    postHighlight?.();
  }, 1000);
}
