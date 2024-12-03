// using deprectead feature, navigator.userAgent doesnt exist yet in FF - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
export function isMac() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return (
    navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
    navigator.platform.toUpperCase().indexOf('IPHONE') >= 0 ||
    navigator.platform.toUpperCase().indexOf('IPAD') >= 0
  );
}

// https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
export function isIOS() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.platform.startsWith('iP') || (navigator.platform.startsWith('Mac') && navigator.maxTouchPoints > 4);
}

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const cookieMap = document.cookie.split(';').reduce<{ [key: string]: string }>((cookies, cookie) => {
    const _name = cookie.trim().split('=')[0];
    const value = cookie.trim().split('=')[1];
    cookies[_name] = decodeURIComponent(value);
    return cookies;
  }, {});
  return cookieMap[name];
}

// cookies reference: https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
export function setCookie({
  name,
  value,
  expiresInDays = 10 * 365,
  expiresAfterSession = false,
  secure = false
}: {
  name: string;
  value: string;
  expiresInDays?: number;
  expiresAfterSession?: boolean;
  secure?: boolean;
}) {
  const expires = new Date();

  expires.setDate(expires.getDate() + expiresInDays);
  document.cookie = `${name}=${encodeURIComponent(value)};${
    expiresAfterSession ? '' : ` expires=${expires.toUTCString()};`
  } path=/; ${secure ? 'secure;' : ''}}`;
}

// decode the path to handle special characters
export function getBrowserPath() {
  return decodeURIComponent(window.location.pathname + window.location.search);
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
    const mQ = typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)');
    if (mQ && mQ.media === '(pointer:coarse)') {
      hasTouchScreen = !!mQ.matches;
    } else if ('orientation' in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      // @ts-ignore
      const UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

// ref: https://github.com/atomantic/is-ua-webview/tree/main
export function isWebView(ua: string) {
  const rules = [
    // if it says it's a webview, let's go with that
    'WebView',
    // iOS webview will be the same as safari but missing "Safari"
    '(iPhone|iPod|iPad)(?!.*Safari)',
    // Android Lollipop and Above: webview will be the same as native but it will contain "wv"
    // Android KitKat to Lollipop webview will put Version/X.X Chrome/{version}.0.0.0
    'Android.*(;\\s+wv|Version/\\d.\\d\\s+Chrome/\\d+(\\.0){3})',
    // old chrome android webview agent
    'Linux; U; Android'
  ];
  const webviewRegExp = new RegExp(`(${rules.join('|')})`, 'ig');
  return !!ua.match(webviewRegExp);
}
