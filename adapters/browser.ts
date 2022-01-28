
export function getCookie (name: string): string {
  const cookieMap = document.cookie.split(';').reduce<{ [key: string]: string }>((cookies, cookie) => {
    const name = cookie.trim().split('=')[0];
    const value = cookie.trim().split('=')[1];
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
  return cookieMap[name];
}

// cookies reference: https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
export function setCookie (name: string, value: string, expiresInDays: number = 10 * 365) {
  let expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);
  const domainString = window.location.hostname === 'localhost' ? '' : 'domain=charmverse.io; ';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; ${domainString}path=/; SameSite=Lax; secure`;
}
