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
