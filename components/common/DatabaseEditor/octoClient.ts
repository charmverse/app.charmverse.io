import type { Block } from 'lib/databases/block';

import type { ISharing } from './blocks/sharing';
import { OctoUtils } from './octoUtils';
import type { IUser } from './user';
import { Utils } from './utils';

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
  readonly serverUrl: string | undefined;

  constructor(serverUrl?: string, public workspaceId = '0') {
    this.serverUrl = serverUrl;
  }

  fixBlocks(blocks: Block[]): Block[] {
    if (!blocks) {
      return [];
    }

    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);

    return fixedBlocks;
  }
}

const octoClient = new OctoClient();

export { OctoClient };
export default octoClient;
