import { syncUserNFTsFromOnchainData } from "@packages/scoutgame/builderNfts/syncUserNFTsFromOnchainData";



const userPath = ''

export async function manualNftResync() {
  if (!userPath) {
    throw new Error('Please provide a username');
  };

  await syncUserNFTsFromOnchainData({path: userPath})
  console.log('manualNftResync');
}


// manualNftResync().then(console.log)