import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { octokit } from '@packages/github/client';

import type { SearchUserResult } from './getUser';

export async function createUser({ scout, waitlistUser, farcasterUser }: SearchUserResult): Promise<Scout> {
  if (scout) {
    throw new Error('Scout user already exists');
  }
  if (!scout && !waitlistUser && !farcasterUser) {
    throw new Error('No input data provided to create a user');
  }

  // convert existing waitlist record to scout
  if (waitlistUser) {
    const githubUser = waitlistUser.githubLogin
      ? await octokit.rest.users.getByUsername({ username: waitlistUser.githubLogin })
      : null;
    const profile = await getFarcasterUserById(waitlistUser.fid);
    if (!profile) {
      throw new Error(`No Farcaster profile found for fid: ${waitlistUser.fid}`);
    }
    const displayName = profile.display_name;
    const username = profile.username;
    const avatarUrl = profile.pfp_url;
    const bio = profile.profile.bio.text;
    const githubUserDB =
      githubUser &&
      (await prisma.githubUser.findUnique({
        where: {
          id: githubUser.data.id
        }
      }));
    return prisma.scout.create({
      data: {
        displayName,
        path: username,
        avatar: avatarUrl,
        bio,
        builderStatus: 'applied',
        farcasterId: waitlistUser.fid,
        farcasterName: username,
        githubUser: githubUserDB
          ? { connect: { id: githubUserDB.id } }
          : githubUser
            ? {
                create: {
                  id: githubUser.data.id,
                  login: githubUser.data.login,
                  displayName: githubUser.data.name,
                  email: githubUser.data.email
                }
              }
            : undefined
      }
    });
  } else if (farcasterUser) {
    // create new scout from farcaster user
    const avatarUrl = farcasterUser.pfp_url;
    return prisma.scout.create({
      data: {
        displayName: farcasterUser.display_name,
        path: farcasterUser.username,
        avatar: avatarUrl,
        bio: farcasterUser.profile.bio.text,
        builderStatus: 'applied',
        farcasterId: farcasterUser.fid,
        farcasterName: farcasterUser.username
      }
    });
  }
  throw new Error('Unknown scenario when creating user');
}
