import Mux from '@mux/mux-node';

import { muxTokenId, muxTokenSecret } from './config';

let maybeMux: Mux | undefined;
if (muxTokenId && muxTokenSecret) {
  maybeMux = new Mux({ tokenId: muxTokenId, tokenSecret: muxTokenSecret });
}

export const mux = maybeMux;
