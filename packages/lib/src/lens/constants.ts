import { isProdEnv } from '@packages/config/constants';
import { polygon, polygonMumbai } from '@wagmi/core/chains';

export const LensChain = isProdEnv ? polygon.id : polygonMumbai.id;
