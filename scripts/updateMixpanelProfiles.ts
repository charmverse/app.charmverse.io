import { prisma } from 'db'
import { getTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { getTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { sessionUserRelations } from 'lib/session/config';

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

  // Batch update
  // https://developer.mixpanel.com/reference/group-batch-update
  const res = await fetch('https://api.mixpanel.com/groups#group-batch-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/plain'
    },
    body: JSON.stringify(profiles)
  })
  const data = await res.json()

  if (data === 1) {
    console.log('🔥', `Updated ${spaces.length} group profiles successfully.`);
  } else {
    console.log('❌', 'Failed to update group profiles.');
  }
}

async function updateMixpanelUserProfiles() {
  const users = await prisma.user.findMany({
    where: {
      spaces: {
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
        }
      }
    },
    discordUser: true,
    telegramUser: true,
    notificationState: true,
    wallets: true,
    // include spaces
    spaces: true
  } });

  const profiles = users.map(user => ({
    $token: MIXPANEL_API_KEY,
    $distinct_id: user.id,
    $set: getTrackUserProfile(user, user.spaces)
  }))

  // Batch update
  // https://developer.mixpanel.com/reference/profile-batch-update
  const res = await fetch('https://api.mixpanel.com/engage#profile-batch-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/plain'
    },
    body: JSON.stringify(profiles)
  })
  const data = await res.json()

  if (data === 1) {
    console.log('🔥', `Updated ${users.length} group profiles successfully.`);
  } else {
    console.log('❌', 'Failed to update user profiles.');
  }
}

// updateMixpanelGroupProfiles()
updateMixpanelUserProfiles()