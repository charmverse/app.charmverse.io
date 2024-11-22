import { airstackRequest } from './airstackRequest';

type MoxieFanToken = {
  currentPrice: number;
  currentPriceInWei: number;
  dailyVolumeChange: number;
  fanTokenAddress: string;
  fanTokenName: string;
  fanTokenSymbol: string;
  lockedTvl: number;
  tlv: number;
  tokenLockedAmount: number;
  tokenUnlockedAmount: number;
  totalSupply: number;
  uniqueHolders: number;
  unlockedTvl: number;
};

export async function getMoxieFanToken(farcasterId: number): Promise<MoxieFanToken | null> {
  const query = `
    query MyQuery {
      MoxieFanTokens(
        input: {filter: {fanTokenSymbol: {_eq: "fid:${farcasterId}"}}, blockchain: ALL}
      ) {
        MoxieFanToken {
          currentPrice
          currentPriceInWei
          dailyVolumeChange
          fanTokenAddress
          fanTokenName
          fanTokenSymbol
          lockedTvl
          tlv
          tokenLockedAmount
          tokenUnlockedAmount
          totalSupply
          uniqueHolders
          unlockedTvl
        }
      }
    }
  `;
  const data = await airstackRequest(query);
  return data.data.MoxieFanTokens.MoxieFanToken?.[0] || null;
}
