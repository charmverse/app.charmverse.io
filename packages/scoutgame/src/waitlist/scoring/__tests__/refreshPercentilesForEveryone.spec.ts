import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { randomLargeInt, randomIntFromInterval } from '@packages/scoutgame/testing/generators';

import { refreshPercentilesForEveryone } from '../../../../../../apps/waitlist/lib/scoring/refreshPercentilesForEveryone'; // Adjust the import to the correct module
import type { ConnectWaitlistTier, TierChange } from '../constants';
import { refreshUserScore } from '../refreshUserScore';

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

const fids = Array.from({ length: usersToGenerate }, () => randomLargeInt());

const additionalFids: number[] = [];

describe('refreshPercentilesForEveryone', () => {
  beforeAll(async () => {
    await prisma.connectWaitlistSlot.deleteMany({});
  });

  afterEach(async () => {
    await prisma.connectWaitlistSlot.deleteMany();
  });

  it('should correctly refresh percentiles and detect tier changes', async () => {
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
          username,
          // We only want to account for users with at least 1 referral or who connected Github - for simplicity, make this a self referral.
          referredByFid: fid
        };
      }
    );

    await prisma.connectWaitlistSlot.deleteMany();

    // Insert the waitlist slots into the test database
    await prisma.connectWaitlistSlot.createMany({
      data: waitlistSlots
    });

    // Perform the refresh operation
    const tierChangeResults = await refreshPercentilesForEveryone();

    // prettyPrint(tierChangeResults);

    // Everyone starts in the 'common' tier
    // Now, 70% of 150 records should be out of the common tier
    expect(tierChangeResults.length).toBe(104);

    const firstChangedUser = tierChangeResults[0];
    expect(fids.indexOf(firstChangedUser.fid)).toBe(131);

    const secondChangedUser = tierChangeResults[15];
    expect(fids.indexOf(secondChangedUser.fid)).toBe(56);

    const thirdChangedUser = tierChangeResults[50];
    expect(fids.indexOf(thirdChangedUser.fid)).toBe(31);

    const fourthChangedUser = tierChangeResults[70];
    expect(fids.indexOf(fourthChangedUser.fid)).toBe(3);

    const fifthChangedUser = tierChangeResults[103];
    expect(fids.indexOf(fifthChangedUser.fid)).toBe(75);

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

    expect(fourthChangedUser.percentile).toBe(50);
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
    expect(fifthChangedUser.score).toBe(540);
    expect(fifthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fifthChangedUser.tierChange).toBe<TierChange>('up');

    const fifthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fifthChangedUser.fid
      }
    });

    expect(fifthUserWaitlistSlot.percentile).toBe(fifthChangedUser.percentile);
  });

  it('should ignore partner accounts in the calculation', async () => {
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
          username,
          // We only want to account for users with at least 1 referral or who connected Github - for simplicity, make this a self referral.
          referredByFid: fid
        };
      }
    );

    await prisma.connectWaitlistSlot.deleteMany();

    // Insert the waitlist slots into the test database
    await prisma.connectWaitlistSlot.createMany({
      data: waitlistSlots
    });

    // Only difference will be here and then checking calculation is the same
    await prisma.connectWaitlistSlot.createMany({
      data: Array.from({ length: 50 }).map(() => {
        const randomUserFid = randomIntFromInterval(100000, 500000);
        additionalFids.push(randomUserFid);
        const input = {
          fid: randomUserFid,
          username: `username`,
          initialPosition: 0,
          score: -10000000,
          isPartnerAccount: true,
          percentile: 0,
          // We only want to account for users with at least 1 referral or who connected Github - for simplicity, make this a self referral.
          referredByFid: randomUserFid
        } as Prisma.ConnectWaitlistSlotCreateManyInput;

        return input;
      })
    });

    // Perform the refresh operation
    const tierChangeResults = await refreshPercentilesForEveryone();

    const partnerAccounts = await prisma.connectWaitlistSlot.findMany({
      where: {
        isPartnerAccount: true
      }
    });

    for (const partnerAccount of partnerAccounts) {
      expect(partnerAccount.percentile).toBe(100);
    }

    // prettyPrint(tierChangeResults);

    // Everyone starts in the 'common' tier
    // Now, 70% of 150 records should be out of the common tier
    expect(tierChangeResults.length).toBe(104);

    const firstChangedUser = tierChangeResults[0];
    expect(fids.indexOf(firstChangedUser.fid)).toBe(131);

    const secondChangedUser = tierChangeResults[15];
    expect(fids.indexOf(secondChangedUser.fid)).toBe(56);

    const thirdChangedUser = tierChangeResults[50];
    expect(fids.indexOf(thirdChangedUser.fid)).toBe(31);

    const fourthChangedUser = tierChangeResults[70];
    expect(fids.indexOf(fourthChangedUser.fid)).toBe(3);

    const fifthChangedUser = tierChangeResults[103];
    expect(fids.indexOf(fifthChangedUser.fid)).toBe(75);

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

    expect(fourthChangedUser.percentile).toBe(50);
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
    expect(fifthChangedUser.score).toBe(540);
    expect(fifthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fifthChangedUser.tierChange).toBe<TierChange>('up');

    const fifthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fifthChangedUser.fid
      }
    });

    expect(fifthUserWaitlistSlot.percentile).toBe(fifthChangedUser.percentile);
  });

  it('should be accurate with less than 100 users, filling out from legendary downwards', async () => {
    // Seed database with 50 waitlist slots
    const waitlistSlots: Prisma.ConnectWaitlistSlotCreateManyInput[] = Array.from({ length: 35 }, (_, index) => {
      const initialPosition = index + 1;

      const fid = fids[index];

      const username = `uname:${fid}`;

      const score = shuffledScores[index];

      return {
        fid,
        score,
        initialPosition,
        percentile: 0, // This will be recalculated
        username,
        // We only want to account for users with at least 1 referral or who connected Github - for simplicity, make this a self referral.
        referredByFid: fid
      };
    });

    await prisma.connectWaitlistSlot.deleteMany();

    // Insert the waitlist slots into the test database
    await prisma.connectWaitlistSlot.createMany({
      data: waitlistSlots
    });

    // Perform the refresh operation
    const tierChangeResults = await refreshPercentilesForEveryone();

    // Everyone starts in the 'common' tier
    // Now, 70% of 150 records should be out of the common tier
    expect(tierChangeResults.length).toBe(35);

    const firstChangedUser = tierChangeResults[0];
    expect(fids.indexOf(firstChangedUser.fid)).toBe(23);

    const secondChangedUser = tierChangeResults[5];
    expect(fids.indexOf(secondChangedUser.fid)).toBe(14);

    const thirdChangedUser = tierChangeResults[13];
    expect(fids.indexOf(thirdChangedUser.fid)).toBe(25);

    const fourthChangedUser = tierChangeResults[25];
    expect(fids.indexOf(fourthChangedUser.fid)).toBe(26);

    const fifthChangedUser = tierChangeResults[34];
    expect(fids.indexOf(fifthChangedUser.fid)).toBe(5);

    // Test specific cases where we know tier changes should happen

    // We expect the first user to be in the 'legendary' tier after refresh
    expect(firstChangedUser.percentile).toBe(97);
    expect(firstChangedUser.score).toBe(-430);
    expect(firstChangedUser.newTier).toBe<ConnectWaitlistTier>('legendary');
    expect(firstChangedUser.tierChange).toBe<TierChange>('up');

    const firstUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: firstChangedUser.fid
      }
    });

    expect(firstUserWaitlistSlot.percentile).toBe(firstChangedUser.percentile);

    // We expect the last user to be in the 'common' tier after refresh
    expect(secondChangedUser.percentile).toBe(83);
    expect(secondChangedUser.score).toBe(-210);
    expect(secondChangedUser.newTier).toBe<ConnectWaitlistTier>('mythic');
    expect(secondChangedUser.tierChange).toBe<TierChange>('up');

    const secondUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: secondChangedUser.fid
      }
    });

    expect(secondUserWaitlistSlot.percentile).toBe(secondChangedUser.percentile);

    // Add more checks based on expected tier changes after percentile calculation
    expect(thirdChangedUser.percentile).toBe(81);
    expect(thirdChangedUser.score).toBe(100);
    expect(thirdChangedUser.newTier).toBe<ConnectWaitlistTier>('mythic');
    expect(thirdChangedUser.tierChange).toBe<TierChange>('up');

    const thirdUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: thirdChangedUser.fid
      }
    });

    expect(thirdUserWaitlistSlot.percentile).toBe(thirdChangedUser.percentile);

    expect(fourthChangedUser.percentile).toBe(61);
    expect(fourthChangedUser.score).toBe(460);
    expect(fourthChangedUser.newTier).toBe<ConnectWaitlistTier>('epic');
    expect(fourthChangedUser.tierChange).toBe<TierChange>('up');

    const fourthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fourthChangedUser.fid
      }
    });

    expect(fourthUserWaitlistSlot.percentile).toBe(fourthChangedUser.percentile);

    expect(fifthChangedUser.percentile).toBe(61);
    expect(fifthChangedUser.score).toBe(960);
    expect(fifthChangedUser.newTier).toBe<ConnectWaitlistTier>('epic');
    expect(fifthChangedUser.tierChange).toBe<TierChange>('up');

    const fifthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fifthChangedUser.fid
      }
    });

    expect(fifthUserWaitlistSlot.percentile).toBe(fifthChangedUser.percentile);
  });

  it('should only take into account users who connected a Github Account, or have at least 1 referral', async () => {
    const listLength = 50;

    const fidsWithReferral = Array.from({ length: listLength }, () => randomLargeInt());
    const fidsWithGithub = Array.from({ length: listLength }, () => randomLargeInt());

    const expectedFids = [...fidsWithReferral, ...fidsWithGithub];

    const fidsWithoutReferralOrGithub = Array.from({ length: listLength }, () => randomLargeInt());

    await prisma.connectWaitlistSlot.createMany({
      data: [
        ...fidsWithReferral.map((fid, index) => ({
          fid,
          initialPosition: index + 1,
          score: 0,
          percentile: 0,
          username: `uname:${fid}`
        })),
        ...fidsWithGithub.map((fid, index) => ({
          fid,
          initialPosition: listLength + index + 1,
          score: 0,
          percentile: 0,
          username: `uname:${fid}`,
          githubLogin: `githubLogin:${fid}`,
          referredByFid: fidsWithReferral[index]
        })),
        ...fidsWithoutReferralOrGithub.map((fid, index) => ({
          fid,
          initialPosition: 2 * listLength + index + 1,
          // Purposefully high score which shouldnt be taken into account
          score: -100000 + index,
          percentile: 0,
          username: `uname:${fid}`
        }))
      ]
    });

    // Ensure scores are correct
    await Promise.all(expectedFids.map((fid) => refreshUserScore({ fid })));

    const tierChangeResults = await refreshPercentilesForEveryone();

    expect(tierChangeResults.some((tierChange) => fidsWithReferral.includes(tierChange.fid)));

    // Everyone starts in the 'common' tier
    // Now, 70% (-1) of 100 records should be out of the common tier
    expect(tierChangeResults.length).toBe(69);

    const firstChangedUser = tierChangeResults[0];
    expect(expectedFids.indexOf(firstChangedUser.fid)).toBe(50);

    const secondChangedUser = tierChangeResults[5];
    expect(expectedFids.indexOf(secondChangedUser.fid)).toBe(55);

    const thirdChangedUser = tierChangeResults[15];
    expect(expectedFids.indexOf(thirdChangedUser.fid)).toBe(65);

    const fourthChangedUser = tierChangeResults[40];
    expect(expectedFids.indexOf(fourthChangedUser.fid)).toBe(90);

    const fifthChangedUser = tierChangeResults[60];
    expect(expectedFids.indexOf(fifthChangedUser.fid)).toBe(10);

    // Test specific cases where we know tier changes should happen

    // We expect the first user to be in the 'legendary' tier after refresh
    expect(firstChangedUser.percentile).toBe(99);
    expect(firstChangedUser.score).toBe(-949);
    expect(firstChangedUser.newTier).toBe<ConnectWaitlistTier>('legendary');
    expect(firstChangedUser.tierChange).toBe<TierChange>('up');

    const firstUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: firstChangedUser.fid
      }
    });

    expect(firstUserWaitlistSlot.percentile).toBe(firstChangedUser.percentile);

    // We expect the last user to be in the 'common' tier after refresh
    expect(secondChangedUser.percentile).toBe(94);
    expect(secondChangedUser.score).toBe(-944);
    expect(secondChangedUser.newTier).toBe<ConnectWaitlistTier>('mythic');
    expect(secondChangedUser.tierChange).toBe<TierChange>('up');

    const secondUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: secondChangedUser.fid
      }
    });

    expect(secondUserWaitlistSlot.percentile).toBe(secondChangedUser.percentile);

    // Add more checks based on expected tier changes after percentile calculation
    expect(thirdChangedUser.percentile).toBe(84);
    expect(thirdChangedUser.score).toBe(-934);
    expect(thirdChangedUser.newTier).toBe<ConnectWaitlistTier>('mythic');
    expect(thirdChangedUser.tierChange).toBe<TierChange>('up');

    const thirdUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: thirdChangedUser.fid
      }
    });

    expect(thirdUserWaitlistSlot.percentile).toBe(thirdChangedUser.percentile);

    expect(fourthChangedUser.percentile).toBe(50);
    expect(fourthChangedUser.score).toBe(-909);
    expect(fourthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fourthChangedUser.tierChange).toBe<TierChange>('up');

    const fourthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fourthChangedUser.fid
      }
    });

    expect(fourthUserWaitlistSlot.percentile).toBe(fourthChangedUser.percentile);

    expect(fifthChangedUser.percentile).toBe(39);
    expect(fifthChangedUser.score).toBe(-89);
    expect(fifthChangedUser.newTier).toBe<ConnectWaitlistTier>('rare');
    expect(fifthChangedUser.tierChange).toBe<TierChange>('up');

    const fifthUserWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: {
        fid: fifthChangedUser.fid
      }
    });

    expect(fifthUserWaitlistSlot.percentile).toBe(fifthChangedUser.percentile);

    const ignoredUsers = await prisma.connectWaitlistSlot.findMany({
      where: {
        fid: {
          in: fidsWithoutReferralOrGithub
        }
      }
    });

    for (const ignoredUser of ignoredUsers) {
      expect(ignoredUser.percentile).toBe(0);
    }
  });
});
