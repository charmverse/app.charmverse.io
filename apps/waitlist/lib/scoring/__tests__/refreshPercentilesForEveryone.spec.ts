import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { randomFid } from '../../../../../testing/utils/farcaster';
import type { ConnectWaitlistTier, TierChange } from '../constants';
import { refreshPercentilesForEveryone } from '../refreshPercentilesForEveryone'; // Adjust the import to the correct module

// Function to shuffle an array deterministically using a seeded random number generator
function seededShuffle(array: number[], seed: number): number[] {
  const result = array.slice(); // Create a copy of the array
  let currentIndex = result.length;
  let temporaryValue;
  let randomIndex;

  // Use a seed-based random number generator (deterministic)
  function seededRandom() {
    // eslint-disable-next-line no-plusplus
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Fisher-Yates shuffle
  while (currentIndex !== 0) {
    randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex -= 1;

    // Swap the current element with the random one
    temporaryValue = result[currentIndex];
    result[currentIndex] = result[randomIndex];
    result[randomIndex] = temporaryValue;
  }

  return result;
}

const usersToGenerate = 150;

const scores = Array.from({ length: usersToGenerate }, (_, index) => 1000 - index * 10); // Scores range from 1000 to -500

const shuffledScores = seededShuffle(scores, 42); // Seed value can be any number (42 in this case)

const fids = Array.from({ length: usersToGenerate }, () => randomFid());

describe('refreshPercentilesForEveryone', () => {
  beforeAll(async () => {
    // Seed database with 150 waitlist slots
    const waitlistSlots: Prisma.ConnectWaitlistSlotCreateManyInput[] = Array.from(
      { length: usersToGenerate },
      (_, index) => {
        const initialPosition = index + 1;

        const fid = fids[index];

        const username = `uname:${fid}`;

        const score = shuffledScores[index];

        return {
          fid,
          score,
          initialPosition,
          percentile: 0, // This will be recalculated
          username
        };
      }
    );

    await prisma.connectWaitlistSlot.deleteMany();

    // Insert the waitlist slots into the test database
    await prisma.connectWaitlistSlot.createMany({
      data: waitlistSlots
    });
  });

  // afterAll(async () => {
  //   // Clean up the database after all tests
  //   await prisma.connectWaitlistSlot.deleteMany();
  // });

  it('should correctly refresh percentiles and detect tier changes', async () => {
    // Perform the refresh operation
    const tierChangeResults = await refreshPercentilesForEveryone();

    // prettyPrint(tierChangeResults);

    // Everyone starts in the 'common' tier
    // Now, 70% of 150 records should be out of the common tier
    expect(tierChangeResults.length).toBe(106);

    const firstChangedUser = tierChangeResults[0];
    expect(fids.indexOf(firstChangedUser.fid)).toBe(131);

    const secondChangedUser = tierChangeResults[15];
    expect(fids.indexOf(secondChangedUser.fid)).toBe(56);

    const thirdChangedUser = tierChangeResults[50];
    expect(fids.indexOf(thirdChangedUser.fid)).toBe(31);

    const fourthChangedUser = tierChangeResults[70];
    expect(fids.indexOf(fourthChangedUser.fid)).toBe(3);

    const fifthChangedUser = tierChangeResults[104];
    expect(fids.indexOf(fifthChangedUser.fid)).toBe(15);

    // Test specific cases where we know tier changes should happen

    // We expect the first user to be in the 'legendary' tier after refresh
    expect(firstChangedUser.percentile).toBe(99);
    expect(firstChangedUser.score).toBe(-490);
    expect(firstChangedUser.newTier).toBe<ConnectWaitlistTier>('legendary');
    expect(firstChangedUser.tierChange).toBe<TierChange>('up');

    const firstUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: firstChangedUser.fid
      }
    });

    expect(firstUserWaitlistSlot.percentile).toBe(firstChangedUser.percentile);

    // We expect the last user to be in the 'common' tier after refresh
    expect(secondChangedUser.percentile).toBe(89);
    expect(secondChangedUser.score).toBe(-340);
    expect(secondChangedUser.newTier).toBe<ConnectWaitlistTier>('mythic');
    expect(secondChangedUser.tierChange).toBe<TierChange>('up');

    const secondUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: secondChangedUser.fid
      }
    });

    expect(secondUserWaitlistSlot.percentile).toBe(secondChangedUser.percentile);

    // Add more checks based on expected tier changes after percentile calculation
    expect(thirdChangedUser.percentile).toBe(66);
    expect(thirdChangedUser.score).toBe(10);
    expect(thirdChangedUser.newTier).toBe<ConnectWaitlistTier>('epic');
    expect(thirdChangedUser.tierChange).toBe<TierChange>('up');

    const thirdUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: thirdChangedUser.fid
      }
    });

    expect(thirdUserWaitlistSlot.percentile).toBe(thirdChangedUser.percentile);

    expect(fourthChangedUser.percentile).toBe(53);
    expect(fourthChangedUser.score).toBe(210);
    expect(fourthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fourthChangedUser.tierChange).toBe<TierChange>('up');

    const fourthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fourthChangedUser.fid
      }
    });

    expect(fourthUserWaitlistSlot.percentile).toBe(fourthChangedUser.percentile);

    expect(fifthChangedUser.percentile).toBe(31);
    expect(fifthChangedUser.score).toBe(550);
    expect(fifthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fifthChangedUser.tierChange).toBe<TierChange>('up');

    const fifthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fifthChangedUser.fid
      }
    });

    expect(fifthUserWaitlistSlot.percentile).toBe(fifthChangedUser.percentile);
  });
});
