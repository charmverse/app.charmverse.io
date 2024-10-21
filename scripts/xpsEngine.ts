import * as xps from 'lib/summon/api';

const walletAddress = '0x91d76d31080ca88339a4e506affb4ded4b192bcb';
const discordHandle = 'playerx#2240';
const userId = '351961533563011156';
const achievementId = '354662534299517013';

async function init() {
  // const user3 = await xps.findUserByIdentity({ walletAddress, discordHandle });
  // console.log('user', user3);
  // const inventory = await xps.getUserInventory(userId);
  // console.log('inventory', inventory?.achievements);
  // const achievement = await xps.getAchievementById(achievementId);
  // console.log('achievement', achievement);
}

init().catch((err) => console.error('error', err));
