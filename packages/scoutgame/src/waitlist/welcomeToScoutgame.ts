import { prisma } from '@charmverse/core/prisma-client';
import { writeToFarcaster } from '@packages/farcaster/messaging/writeToFarcaster';

import { getTier } from './scoring/constants';

const messages = [
  {
    tier: 'legendary',
    messages: [
      '@username The Scout Game begins now for Legendary Scouts. You earned the Legendary level from the Watilist game and have been given 50 points to start scouting with. Check it out now. https://scoutgame.xyz/',
      "@username The Scout Game begins now for Legendary Scouts. You earned the Legendary level from the Watilist game and have been given 50 points to start scouting with. Let's go! https://scoutgame.xyz/"
    ]
  },
  {
    tier: 'builder',
    messages: [
      '@username Welcome to the Scout Game as a Builder. You signed up to be a builder during the Waitlist and were selected during our curation process. Builders earn points for their contributions to open source projects. You may have scored points already. Check it at https://scoutgame.xyz/',
      '@username Welcome to the Scout Game as a Builder. You signed up to be a builder during the Waitlist and were have been selected during our curation process.'
    ]
  }
];

function getMessage(tier: 'legendary' | 'builder', realUsername: string): string {
  // Find the message group by tier
  const group = messages.find((messageGroup) => messageGroup.tier === tier);
  if (!group) {
    throw new Error('Tier not found.');
  }
  // Get a random message from the group's messages
  const randomMessage = group.messages[Math.floor(Math.random() * group.messages.length)];
  // Interpolate @username with the real username
  return randomMessage.replace(/@username/g, `@${realUsername}`);
}

export async function welcomeFromWaitlistToScoutgame({ fid }: { fid: number }): Promise<void> {
  const waitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    }
  });

  if (!waitlistSlot.username) {
    throw new Error('Username not found.');
  }

  const tier = getTier(waitlistSlot.percentile);

  const message = getMessage(tier === 'legendary' ? 'legendary' : 'builder', waitlistSlot.username as string);

  await writeToFarcaster({
    neynarSignerId: process.env.NEYNAR_SIGNER_ID as string,
    text: message
  });
}

// prisma.connectWaitlistSlot
//   .upsert({
//     where: {
//       fid: 4339
//     },
//     create: {
//       fid: 4339,
//       username: 'meb'
//     },
//     update: {}
//   })
//   .then(() => welcomeFromWaitlistToScoutgame({ fid: 4339 }).then(console.log))
//   .catch(console.error);
