// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { Block, createBlock } from './block';

export type CharmTextBlock = Block & {
    type: 'charm_text'
}

function createCharmTextBlock (block?: Partial<Block>): CharmTextBlock {
  return {
    ...createBlock(block),
    type: 'charm_text'
  };
}

export { createCharmTextBlock };
