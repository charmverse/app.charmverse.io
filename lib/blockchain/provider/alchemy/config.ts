import { RPCList } from 'connectors/chains';

export const supportedChains = RPCList.filter((chain) => chain.alchemyUrl);
export const supportedChainIds = RPCList.map((chain) => chain.chainId);
export type SupportedChainId = (typeof supportedChainIds)[number];
