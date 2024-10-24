import { prisma } from '@charmverse/core/prisma-client';
import { writeToFarcaster } from '@packages/farcaster/messaging/writeToFarcaster';

import type { ConnectWaitlistTier } from './scoring/constants';
import { getTier } from './scoring/constants';

const embedUrl = 'https://scoutgame.xyz';

const pastTierMessage1 =
  '@username The Scout Game has started! You earned EARLY ENTRY by joining our Waitlist. Check out the action now and begin your Scout journey!';
const pastTierMessage2 =
  "@username The Scout Game has started! You earned EARLY ENTRY by joining our Waitlist. Don't wait to begin your Scout journey. Check out the action now!";

const messages: { tier: ConnectWaitlistTier | 'builder'; messages: string[] }[] = [
  {
    tier: 'legendary',
    messages: [pastTierMessage1, pastTierMessage2]
  },
  {
    tier: 'mythic',
    messages: [pastTierMessage1, pastTierMessage2]
  },
  {
    tier: 'epic',
    messages: [pastTierMessage1, pastTierMessage2]
  },
  {
    tier: 'rare',
    messages: [
      '@username The Scout Game begins now for Rare Scouts. You earned the Rare level from the Waitlist game and have been given 15 points to start scouting with. Check it out now.',
      '@username The Scout Game begins now for Rare Scouts. You earned the Rare level from the Waitlist game and have been given 15 points to start scouting with. Lets go!'
    ]
  },
  {
    tier: 'common',
    messages: [
      '@username The Scout Game begins now for Common Scouts. You earned the Rare level from the Waitilist game and have been given 10 points to start scouting with. Check it out now.',
      '@username The Scout Game begins now for Common Scouts. You earned the Rare level from the Watilist game and have been given 10 points to start scouting with. Lets go!'
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

function getMessage(tier: ConnectWaitlistTier | 'builder', realUsername: string): string {
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

  const message = getMessage(tier, waitlistSlot.username as string);

  await writeToFarcaster({
    neynarSignerId: process.env.NEYNAR_SIGNER_ID as string,
    text: message,
    embedUrl: `https://scoutgame.xyz`
  });
}
