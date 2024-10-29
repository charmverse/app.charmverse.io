import { syncUserNFTsFromOnchainData } from "@packages/scoutgame/builderNfts/syncUserNFTsFromOnchainData";



const username = ''

export async function manualNftResync() {
  if (!username) {
    throw new Error('Please provide a username');
  };

  await syncUserNFTsFromOnchainData({username})
  console.log('manualNftResync');
}


// manualNftResync().then(console.log)