import type { PageType } from '@charmverse/core/prisma-client';
import type { Node } from 'prosemirror-model';

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
    type: PageType;
    galleryImage: string | null;
    hasContent: boolean;
    diffs: ClientDiffMessage[];
  };
  lastSavedVersion?: number;
  node: Node;
};

export const docRooms = new Map<string | undefined, DocumentRoom>();
