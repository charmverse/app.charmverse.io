import { baseUrl, isDevEnv } from 'config/constants';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from 'lib/utilities/domains/getSpaceDomainFromHost';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';
import { getAppOriginURL } from 'lib/utilities/getAppOriginURL';

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

export function isTouchScreen(): boolean {
  const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
  if (typeof window === 'undefined') {
    return false;
  }

  return toMatch.some((toMatchItem) => {
    return window.navigator.userAgent.match(toMatchItem);
  });
}

export function isSmallScreen() {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 600;
  }
  return false;
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

export function scrollIntoView(selector: string) {
  if (typeof document !== 'undefined') {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

export const safeScrollIntoViewIfNeeded = (element: HTMLElement, centerIfNeeded?: boolean) => {
  if (typeof window !== 'undefined') {
    return 'scrollIntoViewIfNeeded' in document.body
      ? (element as any).scrollIntoViewIfNeeded(centerIfNeeded)
      : scrollIntoViewIfNeededPolyfill(element, centerIfNeeded);
  }
  return () => {};
};

function scrollIntoViewIfNeededPolyfill(element: HTMLElement, centerIfNeeded?: boolean) {
  centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

  const parent = (element.closest('#inline-palette-wrapper') || element.parentNode)! as HTMLElement;
  const elementCoords = element.getBoundingClientRect();
  const parentCoords = parent.getBoundingClientRect();
  const elementOffsetTop = elementCoords.top - parentCoords.top;
  const elementOffsetBottom = elementCoords.bottom - parentCoords.top;
  const parentComputedStyle = window.getComputedStyle(parent, null);
  const parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width'), 10);
  const parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width'), 10);
  const overTop = elementOffsetTop < 0;
  const // element.offsetTop - parent.offsetTop < parent.scrollTop,
    overBottom = elementOffsetBottom > parentCoords.height;
  const overLeft = element.offsetLeft - parent.offsetLeft < parent.scrollLeft;
  const overRight =
    element.offsetLeft - parent.offsetLeft + element.clientWidth - parentBorderLeftWidth >
    parent.scrollLeft + parent.clientWidth;
  if ((overTop || overBottom) && centerIfNeeded) {
    parent.scrollTop =
      element.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + element.clientHeight / 2;
  }

  if ((overLeft || overRight) && centerIfNeeded) {
    parent.scrollLeft =
      element.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + element.clientWidth / 2;
  }
  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// @source: https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
export function getNewUrl(params: Record<string, string | null>, currentUrl = window.location.href) {
  const url = new URL(currentUrl, currentUrl.match('http') ? undefined : window.location.origin);
  const urlParams: URLSearchParams = new URLSearchParams(url.search);
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (typeof value === 'string') {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    }
  }
  url.search = urlParams.toString();
  return url;
}

/**
 * update URL without Next.js re-rendering the page
 * source: https://github.com/vercel/next.js/discussions/18072
 *
 * To remove a param from the query, set it as null
 */
export function setUrlWithoutRerender(pathname: string, params: Record<string, string | null>) {
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
  expiresInDays = 10 * 365
}: {
  name: string;
  value: string;
  expiresInDays: number;
}) {
  const expires = new Date();
  const secure = typeof baseUrl === 'string' && baseUrl.includes('https') ? 'secure;' : '';

  expires.setDate(expires.getDate() + expiresInDays);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; ${secure}}`;
}

export function deleteCookie(name: string) {
  setCookie({ name, value: '', expiresInDays: 0 });
}

export function createHighlightDomElement(parentElement: HTMLElement | null) {
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

export function highlightDomElement(domElement: HTMLElement, postHighlight?: () => void) {
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

// strip out custom or domain depending on the host
export function getSubdomainPath(
  path: string,
  config?: { domain: string; customDomain: string | null },
  host?: string
) {
  const subdomain = getSpaceDomainFromHost(host);
  const customDomain = getCustomDomainFromHost(host);

  // strip out domain when using full custom domain
  if (customDomain && config?.domain && config.customDomain && customDomain === config.customDomain) {
    // remove space domain from path for custom domain
    if (path.startsWith(`/${config.domain}`)) {
      return path.replace(`/${config.domain}`, '');
    }

    if (path.startsWith(`/${config.customDomain}`)) {
      return path.replace(`/${config.customDomain}`, '');
    }
  }

  // strip out subdomain when using subdomain
  if (subdomain) {
    return path.replace(new RegExp(`^\\/${subdomain}`), '');
  }

  // if we are not using a custom domain or subdomain, make sure that the space domain exists in the URL
  if (config && !path.startsWith(`/${config?.domain}`)) {
    return `/${config.domain}${path}`;
  }
  return path;
}

export function getSpaceUrl(config: { domain: string; customDomain?: string | null }, host?: string) {
  const { domain } = config;
  const subdomain = getSpaceDomainFromHost(host);
  const customDomain = getCustomDomainFromHost(host);

  if (isLocalhostAlias(host)) {
    return `/${domain}`;
  }

  // we are on proper space custom domain
  if (customDomain && config.customDomain && customDomain === config.customDomain) {
    return '/';
  }

  // we are on custom domain but we want to redirect to a different space
  if (customDomain) {
    // TODO: enable subdomains
    return getDefaultSpaceUrl({ domain });
  }

  // TODO - redirect to different custom domain

  if (!subdomain) return `/${domain}`;
  if (subdomain === domain) return '/';

  // replace old subdomain with desired one
  if (typeof window !== 'undefined') {
    return window?.origin.replace(`${subdomain}.`, `${domain}.`);
  }

  return `/${domain}`;
}

export function getAbsolutePath(path: string, spaceDomain: string | undefined) {
  const absolutePath = spaceDomain ? `/${spaceDomain}${path}` : path;
  const subdomain = getSpaceDomainFromHost();

  if (typeof window !== 'undefined') {
    const origin =
      subdomain && subdomain !== spaceDomain
        ? window?.origin.replace(`${subdomain}.`, `${spaceDomain}.`)
        : window.location.origin;

    return (
      origin + getSubdomainPath(absolutePath, { domain: spaceDomain || '', customDomain: getCustomDomainFromHost() })
    );
  }

  return absolutePath;
}

export function getCustomDomainUrl(customDomain: string, path = '/') {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${customDomain}${path}`;
  }

  const protocol = isDevEnv ? 'http:' : 'https:';

  return `${protocol}//${customDomain}${path}`;
}

export function getDefaultSpaceUrl({
  domain,
  path = '/',
  useSubdomain = false
}: {
  domain: string;
  path?: string;
  useSubdomain?: boolean;
}) {
  let protocol = isDevEnv ? 'http:' : 'https:';
  let port = '';
  const appDomain = getAppApexDomain();

  if (typeof window !== 'undefined') {
    protocol = window.location.protocol;
    port = window.location.port ? `:${window.location.port}` : '';
  }

  if (appDomain) {
    return useSubdomain
      ? `${protocol}//${domain}.${appDomain}${port}${path}`
      : `${protocol}//app.${appDomain}${port}/${domain}${path}`;
  }

  return `/${domain}${path}`;
}

export function shouldRedirectToAppLogin() {
  if (typeof window === 'undefined') {
    return false;
  }

  const isSubdomainUrl = !!getSpaceDomainFromHost();
  const appDomain = getAppApexDomain();

  return isSubdomainUrl && !!appDomain;
}

export function getAppUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  if (isLocalhostAlias()) {
    return new URL(window.location.origin);
  }

  const port = window.location.port ? `:${window.location.port}` : '';

  return getAppOriginURL({ port, protocol: window.location.protocol, host: window.location.host });
}

export function redirectToAppLogin() {
  if (typeof window === 'undefined') {
    return false;
  }

  const appUrl = getAppUrl();

  if (appUrl) {
    const returnUrl = window.location.href;

    appUrl.searchParams.append('returnUrl', returnUrl);
    window.location.href = appUrl.toString();

    return true;
  }

  return false;
}

export function getUserLocale() {
  return typeof navigator !== 'undefined' && navigator?.languages?.length ? navigator.languages[0] : navigator.language;
}
