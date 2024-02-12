import type { LitContracts } from '@lit-protocol/contracts-sdk';

import { isProdEnv } from 'config/constants';

export const litOwnerWalletAddress = '0x5A4d8d2F5de4D6ae29A91EE67E3adAedb53B0081';

export const litWalletPrivateKey = 'YOUR_PRIVATE_KEY';

export const litNetwork: LitContracts['network'] = isProdEnv ? 'habanero' : 'manzano';
