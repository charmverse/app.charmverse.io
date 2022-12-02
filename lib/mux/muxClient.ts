import Mux from '@mux/mux-node';

const muxTokenId = process.env.MUX_TOKEN_ID as string | undefined;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET as string | undefined;

let maybeMux: Mux | undefined;
if (muxTokenId && muxTokenSecret) {
  maybeMux = new Mux(muxTokenId, muxTokenSecret);
}

export const mux = maybeMux;
