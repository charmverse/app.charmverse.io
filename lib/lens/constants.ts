import { polygon, polygonMumbai } from '@wagmi/core/chains';

import { isProdEnv } from '@root/config/constants';

export const LensChain = isProdEnv ? polygon.id : polygonMumbai.id;
