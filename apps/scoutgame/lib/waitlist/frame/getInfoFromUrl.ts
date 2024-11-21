import type { FrameScreen } from 'lib/waitlist/mixpanel/trackEventActionSchema';

export function getReferrerFidFromUrl(req: Request): number {
  const reqAsURL = new URL(req.url);

  return parseInt(reqAsURL.pathname.split('/')[3]);
}

export function getCurrentFrameFromUrl(req: Request): FrameScreen {
  const reqAsURL = new URL(req.url);

  return reqAsURL.searchParams.get('current_frame') as FrameScreen;
}

export function encodeCurrentFrame({ url, frame }: { url: string; frame: FrameScreen }): string {
  return `${url}?current_frame=${frame}`;
}
