import type { Node } from '@bangle.dev/pm';

import type { DocumentEventHandler } from './documentEvents';
import type { ClientDiffMessage } from './interfaces';

export type DocumentRoom = {
  // eslint-disable-next-line no-use-before-define
  participants: Map<string, DocumentEventHandler>;
  doc: {
    id: string;
    spaceId: string;
    version: number;
    content: any;
    type: string;
    galleryImage: string | null;
    hasContent: boolean;
    diffs: ClientDiffMessage[];
  };
  lastSavedVersion?: number;
  node: Node;
};

export const docRooms = new Map<string | undefined, DocumentRoom>();
