import type { BaseEvent } from './BaseEvent';

export type FarcasterFrameInteraction = BaseEvent & {
  frameUrl: string;
  pageId: string;
};

export type InteractFarcasterFrame = BaseEvent & {
  pageId: string;
};

export interface FarcasterEventMap {
  add_farcaster_frame: FarcasterFrameInteraction;
  view_farcaster_frame: FarcasterFrameInteraction;
  interact_farcaster_frame: InteractFarcasterFrame;
  frame_mint_start: FarcasterFrameInteraction;
  frame_mint_success: FarcasterFrameInteraction;
}
