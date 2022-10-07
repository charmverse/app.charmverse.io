import { prisma } from 'db'
import { getTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { getTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { sessionUserRelations } from 'lib/session/config';
import { chunk } from 'lodash';

const MIXPANEL_API_KEY = process.env.MIXPANEL_API_KEY as string;

export {};

async function updateMixpanelGroupProfiles() {
  // Group by workspace
  const spaces = await prisma.space.findMany({ where: { deletedAt: null }});

  const profiles = spaces.map(space => ({
    $token: MIXPANEL_API_KEY,
    $group_key: "Space Id",
    $group_id: space.id,
    $set: getTrackGroupProfile(space)
  }))

  // Mixpanel batch group update limit - 200
  // https://developer.mixpanel.com/reference/limits-1
  const chunks = chunk(profiles, 200);
  console.log('🔥', 'Number of group chunks:', chunks.length);

  const promises = chunks.map(async profilesChunk => {
    // Batch update
    // https://developer.mixpanel.com/reference/group-batch-update
    const res = await fetch('https://api.mixpanel.com/groups#group-batch-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(profilesChunk)
    })

    return await res.json() as number
  });


  const results = await Promise.all(promises)

  if (results.every(r => r === 1)) {
    console.log('🔥', `Updated ${spaces.length} group profiles successfully.`);
  } else {
    console.log('❌', 'Failed to update some of group profiles.');
  }
}

async function updateMixpanelUserProfiles() {
  const users = await prisma.user.findMany({
    where: {
      spaceRoles: {
          some: {} // user has at least one space
      }
    },
    include: {
    favorites: {
      where: {
        page: {
          deletedAt: null
        }
      },
      select: {
        pageId: true
      }
    },
    spaceRoles: {
      include: {
        spaceRoleToRole: {
          include: {
            role: true
          }
        },
        space: true
      }
    },
    discordUser: true,
    telegramUser: true,
    notificationState: true,
    wallets: true
  } });

  const profiles = users.map(user => ({
    $token: MIXPANEL_API_KEY,
    $distinct_id: user.id,
    $set: getTrackUserProfile(user, user.spaceRoles.map(role => role.space))
  }))

  // Mixpanel batch profile update limit - 2000
  // https://developer.mixpanel.com/reference/user-profile-limits
  const chunks = chunk(profiles, 2000);
  console.log('🔥', 'Number of profile chunks:', chunks.length);

  const promises = chunks.map(async profilesChunk => {
    // Batch update
    // https://developer.mixpanel.com/reference/profile-batch-update
    const res = await fetch('https://api.mixpanel.com/engage#profile-batch-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(profilesChunk)
    })

    return await res.json() as number
  });


  const results = await Promise.all(promises)

  if (results.every(r => r === 1)) {
    console.log('🔥', `Updated ${users.length} user profiles successfully.`);
  } else {
    console.log('❌', 'Failed to update user profiles.');
  }
}

updateMixpanelGroupProfiles()
updateMixpanelUserProfiles()