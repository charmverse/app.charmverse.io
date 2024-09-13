import { prisma } from '@charmverse/core/prisma-client';

import { randomFid } from '../../../../../testing/utils/farcaster';
import { joinWaitlist } from '../joinWaitlist'; // Replace with your actual module

describe('joinWaitlist', () => {
  it('should return existing waitlist slot if user already exists', async () => {
    const targetFid = randomFid();

    // Insert a test user into the database
    const existingSlot = await prisma.connectWaitlistSlot.create({
      data: {
        fid: targetFid,
        username: 'existingUser',
        score: 100,
        referredByFid: null
      }
    });

    const result = await joinWaitlist({ fid: targetFid, username: 'existingUser' });

    // Verify that the existing user is returned
    expect(result.isNew).toBe(false);
    expect(result.waitlistSlot.fid).toBe(existingSlot.fid);
    expect(result.waitlistSlot.username).toBe(existingSlot.username);
  });

  it('should create a new waitlist slot if user does not exist (no referral)', async () => {
    const targetFid = randomFid();

    const result = await joinWaitlist({ fid: targetFid, username: 'newUser' });

    // Verify that a new waitlist slot is created
    const createdSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: { fid: targetFid }
    });

    expect(result.isNew).toBe(true);
    expect(createdSlot).toBeTruthy();
    expect(result.waitlistSlot.fid).toBe(targetFid);
    expect(result.waitlistSlot.username).toBe('newUser');
    expect(result.waitlistSlot.score).toBe(createdSlot?.score);
  });

  it('should create a new waitlist slot and update referred user score', async () => {
    const targetFid = randomFid();

    const referrerFid = randomFid();

    // Insert the referrer into the database
    const referrer = await prisma.connectWaitlistSlot.create({
      data: {
        fid: referrerFid,
        username: 'referrer',
        score: 50,
        referredByFid: null
      }
    });

    // Call joinWaitlist with a referral
    const result = await joinWaitlist({
      fid: targetFid,
      username: 'newUserWithReferral',
      referredByFid: referrer.fid
    });

    // Verify that the new user was added to the waitlist
    const newUser = await prisma.connectWaitlistSlot.findUnique({
      where: { fid: targetFid }
    });
    expect(newUser).toBeTruthy();
    expect(result.isNew).toBe(true);
    expect(newUser?.percentile).toBe(1);
    expect(newUser?.score).toBe(newUser?.initialPosition);

    // Verify that the referred user's score was updated (you would define in refreshUserScore)
    const updatedReferrer = await prisma.connectWaitlistSlot.findUniqueOrThrow({
      where: { fid: referrerFid }
    });

    // Check if referrer score is updated (refreshUserScore should handle this)
    expect(updatedReferrer.score).not.toBe(referrer.score);
  });

  it('should initialise partner accounts to percentile 100', async () => {
    const targetFid = randomFid();

    // Call joinWaitlist with a referral
    const result = await joinWaitlist({
      fid: targetFid,
      username: 'newUserWithReferral',
      isPartnerAccount: true
    });

    // Verify that the new user was added to the waitlist
    const newUser = await prisma.connectWaitlistSlot.findUnique({
      where: { fid: targetFid }
    });
    expect(newUser).toBeTruthy();
    expect(result.isNew).toBe(true);
    expect(newUser?.percentile).toBe(100);
    expect(newUser?.score).toBe(newUser?.initialPosition);
    expect(newUser?.isPartnerAccount).toBe(true);
  });
});
