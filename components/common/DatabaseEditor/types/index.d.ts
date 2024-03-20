export interface IAppWindow extends Window {
  baseURL?: string;
  msCrypto: Crypto;
  openInNewBrowser?: ((href: string) => void) | null;
  webkit?: { messageHandlers: { nativeApp?: { postMessage: <T>(message: T) => void } } };
}
