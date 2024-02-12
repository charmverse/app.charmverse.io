import * as LitJsSdk from '@lit-protocol/lit-node-client';

import { litNetwork } from './config';

export const litNodeClient = new LitJsSdk.LitNodeClient({
  alertWhenUnauthorized: false,
  litNetwork,
  debug: true
});
