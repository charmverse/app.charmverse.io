import { getMoxieFanToken, getMoxieFanTokenAmount } from '../app/api/partners/moxie/route';

(async () => {
  const nft = await getMoxieFanToken(603);
  console.log(nft);
  const amount = await getMoxieFanTokenAmount({ builderFid: 603, scoutFid: 602 });
  console.log(amount);
})();
