
import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from '@packages/scoutgame/builderNfts/artwork/starterPack/uploadStarterPackArtwork';
import { currentSeason } from '@packages/scoutgame/dates';
import {  } from '@packages/scoutgame/builderNfts/artwork/starterPack/uploadStarterPackArtwork';
import fs from 'fs/promises';

async function test() {
  const imageBuffer = await uploadStarterPackArtworkCongrats({
    builderId: 'b6b06446-05ff-4451-9068-450d5ff4b1aa',
    userImage: 'https://cdn.charmverse.io/user-content/e0ec0ec8-0c1f-4745-833d-52c448482d9c/0dd0e3c0-821c-49fc-bd1a-7589ada03019/1ff23917d3954f92aed4351b9c8caa36.jpg',
    tokenId: 55,
    season: currentSeason,
    imageHostingBaseUrl: process.env.DOMAIN,
  });
}


// test();