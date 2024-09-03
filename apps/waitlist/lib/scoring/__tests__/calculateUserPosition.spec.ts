// Commented out this test as we are not using this method currently. If we need to only calculate user position in a pinch, it will be useful to have

// ---------------------

// import type { Prisma } from '@charmverse/core/prisma-client';
// import { prisma } from '@charmverse/core/prisma-client';

// import { randomFid } from '../../../../../testing/utils/farcaster';
// import type { ConnectWaitlistTier } from '../calculateUserPosition';
// import { calculateUserPosition, getTier, waitlistTiers } from '../calculateUserPosition';

// // Function to shuffle an array deterministically using a seeded random number generator
// function seededShuffle(array: number[], seed: number): number[] {
//   const result = array.slice(); // Create a copy of the array
//   let currentIndex = result.length;
//   let temporaryValue;
//   let randomIndex;

//   // Use a seed-based random number generator (deterministic)
//   function seededRandom() {
//     // eslint-disable-next-line no-plusplus
//     const x = Math.sin(seed++) * 10000;
//     return x - Math.floor(x);
//   }

//   // Fisher-Yates shuffle
//   while (currentIndex !== 0) {
//     randomIndex = Math.floor(seededRandom() * currentIndex);
//     currentIndex -= 1;

//     // Swap the current element with the random one
//     temporaryValue = result[currentIndex];
//     result[currentIndex] = result[randomIndex];
//     result[randomIndex] = temporaryValue;
//   }

//   return result;
// }

// const usersToGenerate = 150;

// const scores = Array.from({ length: usersToGenerate }, (_, index) => 1000 - index * 10); // Scores range from 1000 to -500

// const shuffledScores = seededShuffle(scores, 42); // Seed value can be any number (42 in this case)

// const fids = Array.from({ length: usersToGenerate }, () => randomFid());

// // This test suite uses a deterministically randomised set of scores. The expected percentiles and scores were manually observed then set as the expected test output.
// describe('calculateUserPosition', () => {
//   beforeAll(async () => {
//     // Seed database with 150 waitlist slots
//     const waitlistSlots: Prisma.ConnectWaitlistSlotCreateManyInput[] = Array.from(
//       { length: usersToGenerate },
//       (_, index) => {
//         const initialPosition = index + 1;

//         const fid = fids[index];

//         const username = `uname:${fid}`;

//         const score = shuffledScores[index];

//         return {
//           fid,
//           score,
//           initialPosition,
//           percentile: 0, // This will be recalculated
//           username
//         };
//       }
//     );

//     // Insert the waitlist slots into the test database
//     await prisma.connectWaitlistSlot.createMany({
//       data: waitlistSlots
//     });
//   });

//   it('should calculate correct rank and percentile for users, with lower score resulting in higher percentile', async () => {
//     // User with fid 1 should have the highest score
//     const result = await calculateUserPosition({ fid: fids[0] });

//     // Validate rank and percentile
//     expect(result.percentile).toBe(88);
//     expect(result.tier).toBe('mythic');
//     expect(result.score).toBe(-310);

//     const secondResult = await calculateUserPosition({ fid: fids[92] });

//     // Validate rank and percentile
//     expect(secondResult.percentile).toBe(70);
//     expect(secondResult.tier).toBe('epic');
//     expect(secondResult.score).toBe(-40);
//   });

//   it('should refresh the saved percentile and indicate if it changed', async () => {
//     const targetFid = fids[73];

//     const currentPercentile = await prisma.connectWaitlistSlot.findUnique({
//       where: { fid: targetFid },
//       select: { percentile: true }
//     });

//     // Created as 0 in the test env
//     expect(currentPercentile?.percentile).toBe(0);

//     const calculation = await calculateUserPosition({ fid: targetFid });

//     expect(calculation.tierChange).toBe('up');

//     const secondCalculation = await calculateUserPosition({ fid: targetFid });

//     expect(secondCalculation.tierChange).toBe('none');

//     const refreshedPercentile = await prisma.connectWaitlistSlot.findUnique({
//       where: { fid: targetFid },
//       select: { percentile: true }
//     });

//     expect(refreshedPercentile?.percentile).toBe(55);
//   });
// }); // Adjust the path to where ConnectWaitlistTier is defined

// describe('getTier', () => {
//   it('should return "legendary" for percentile 96 or higher', () => {
//     expect(getTier(100)).toBe<ConnectWaitlistTier>('legendary');
//     expect(getTier(96)).toBe<ConnectWaitlistTier>('legendary');
//   });

//   it('should return "mythic" for percentile between 81 and 95', () => {
//     expect(getTier(95)).toBe<ConnectWaitlistTier>('mythic');
//     expect(getTier(81)).toBe<ConnectWaitlistTier>('mythic');
//   });

//   it('should return "epic" for percentile between 61 and 80', () => {
//     expect(getTier(80)).toBe<ConnectWaitlistTier>('epic');
//     expect(getTier(61)).toBe<ConnectWaitlistTier>('epic');
//   });

//   it('should return "rare" for percentile between 41 and 60', () => {
//     expect(getTier(60)).toBe<ConnectWaitlistTier>('rare');
//     expect(getTier(41)).toBe<ConnectWaitlistTier>('rare');
//   });

//   it('should return "common" for percentile between 1 and 40', () => {
//     expect(getTier(40)).toBe<ConnectWaitlistTier>('common');
//     expect(getTier(1)).toBe<ConnectWaitlistTier>('common');
//   });

//   it('should return "common" for percentile below 1', () => {
//     expect(getTier(0)).toBe<ConnectWaitlistTier>('common');
//     expect(getTier(-5)).toBe<ConnectWaitlistTier>('common');
//   });
// });
