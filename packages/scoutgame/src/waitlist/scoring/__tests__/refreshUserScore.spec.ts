import { prisma } from '@charmverse/core/prisma-client';

import { randomFid } from '../../../../../../testing/utils/farcaster';
import { refreshUserScore } from '../refreshUserScore';

describe('refreshUserScore', () => {
  it('should calculate the score correctly based on initial position and number of referrals to the fid', async () => {
    const targetFid = randomFid();

    const initialPosition = 10;

    const waitlistSlot = await prisma.connectWaitlistSlot.create({
      data: {
        fid: targetFid,
        username: 'test',
        referredByFid: null,
        score: 0,
        initialPosition
      }
    });

    const totalReferrals = 5;

    const referrals = await prisma.connectWaitlistSlot.createMany({
      data: Array.from({ length: totalReferrals }, (_, index) => ({
        fid: randomFid(),
        username: `test${index}`,
        referredByFid: targetFid,
        score: 0,
        initialPosition: 0
      }))
    });

    // Core formula we are testing
    const formulaOutput = initialPosition - totalReferrals * 100;

    await refreshUserScore({ fid: targetFid });

    const updatedWaitlistSlot = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid: targetFid
      }
    });

    expect(updatedWaitlistSlot?.score).toBe(formulaOutput);
  });

  it('should count 10 extra clicks if the user has a github account connected', async () => {
    const targetFid = randomFid();

    const initialPosition = 10;

    const waitlistSlot = await prisma.connectWaitlistSlot.create({
      data: {
        fid: targetFid,
        username: 'test',
        referredByFid: null,
        score: 0,
        initialPosition,
        githubLogin: 'xyz'
      }
    });

    const totalReferrals = 5;

    const referrals = await prisma.connectWaitlistSlot.createMany({
      data: Array.from({ length: totalReferrals }, (_, index) => ({
        fid: randomFid(),
        username: `test${index}`,
        referredByFid: targetFid,
        score: 0,
        initialPosition: 0
      }))
    });

    // Core formula we are testing
    const formulaOutput = initialPosition - (totalReferrals + 10) * 100;

    await refreshUserScore({ fid: targetFid });

    const updatedWaitlistSlot = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid: targetFid
      }
    });

    expect(updatedWaitlistSlot?.score).toBe(formulaOutput);
  });
});
