import 'server-only';

import { delay } from '@root/lib/utils/async';

import { ActivityTable } from './ActivityTable';
import { LeaderboardTable } from './LeaderboardTable';
import { TopBuildersTable } from './TopBuildersTable';
import { TopScoutsTable } from './TopScoutsTable';

const activityData = [
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      username: '@devorain',
      earned: 100,
      bonus: 20
    },
    notification: {
      message: 'Contribution ACCEPTED',
      type: 'contribution',
      detail: '/charmverse'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/ffb61d92-fcb0-4b88-91f2-a81838d73689/pixil-frame-0.png',
      username: '@drea',
      earned: 90,
      bonus: 20
    },
    notification: {
      message: 'Contribution STREAK',
      type: 'contribution',
      detail: '/charmverse'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/dc521ceb-495e-40cc-940e-3b1cafc7a2e1/0969b51d-83cd-4ce6-abe2-d47deca5741b/b6a3203b9dc30b6e2494abceb0846615.jpg',
      username: '@alexpoon.eth',
      earned: 120,
      bonus: 20
    },
    notification: {
      message: '1st contribution',
      type: 'contribution',
      detail: '/charmverse'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg',
      username: '@ccarella',
      earned: 10
    },
    notification: {
      message: 'Grant WON',
      type: 'grant',
      detail: 'Refi in Arbitrum'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/05ae8fbd-a142-46dd-b0e8-9e0570e86324/41f03d51-06cf-405c-b1c4-d29d7fea4d7a/57509b7029d19788d944bc503a6b479d.png',
      username: '@iliasc',
      earned: 100,
      bonus: 20
    },
    notification: {
      message: 'SCOUTED @safwan',
      type: 'scout',
      detail: '@safwan'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5456438a-8f49-4ad1-bbb2-4a9ef884e323/81f51168-702c-4352-9654-7d6312e76156/S2dAJtBX9JCJl9OEGJvsMsVmmJzjIJbjBR22wFeY050.jpg',
      username: 'xandra',
      earned: 56,
      bonus: 20
    },
    notification: {
      message: 'Contribution ACCEPTED',
      type: 'contribution',
      detail: '/charmverse'
    },
    date: '2023-12-05'
  }
];

const leaderboardData = [
  {
    progress: 90,
    gems: 100,
    price: 56,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      username: '@devorain'
    }
  },
  {
    progress: 30,
    price: 76,
    gems: 33,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/ffb61d92-fcb0-4b88-91f2-a81838d73689/pixil-frame-0.png',
      username: '@drea'
    }
  },
  {
    progress: 80,
    price: 99,
    gems: 92,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/dc521ceb-495e-40cc-940e-3b1cafc7a2e1/0969b51d-83cd-4ce6-abe2-d47deca5741b/b6a3203b9dc30b6e2494abceb0846615.jpg',
      username: '@alexpoon.eth'
    }
  },
  {
    progress: 70,
    price: 100,
    gems: 80,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg',
      username: '@ccarella'
    }
  },
  {
    progress: 10,
    price: 100,
    gems: 2,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/05ae8fbd-a142-46dd-b0e8-9e0570e86324/41f03d51-06cf-405c-b1c4-d29d7fea4d7a/57509b7029d19788d944bc503a6b479d.png',
      username: '@iliasc'
    }
  },
  {
    progress: 50,
    price: 100,
    gems: 14,
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5456438a-8f49-4ad1-bbb2-4a9ef884e323/81f51168-702c-4352-9654-7d6312e76156/S2dAJtBX9JCJl9OEGJvsMsVmmJzjIJbjBR22wFeY050.jpg',
      username: 'xandra'
    }
  }
];

const topscoutsData = [
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      username: '@devorain'
    },
    season: 1,
    allTime: 12,
    scouted: 345,
    nftsHeld: 1
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/ffb61d92-fcb0-4b88-91f2-a81838d73689/pixil-frame-0.png',
      username: '@drea'
    },
    season: 2,
    allTime: 15,
    scouted: 15,
    nftsHeld: 3
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/dc521ceb-495e-40cc-940e-3b1cafc7a2e1/0969b51d-83cd-4ce6-abe2-d47deca5741b/b6a3203b9dc30b6e2494abceb0846615.jpg',
      username: '@alexpoon.eth'
    },
    season: 3,
    allTime: 12,
    scouted: 32,
    nftsHeld: 7
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg',
      username: '@ccarella'
    },
    season: 2,
    allTime: 22,
    scouted: 43,
    nftsHeld: 12
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/05ae8fbd-a142-46dd-b0e8-9e0570e86324/41f03d51-06cf-405c-b1c4-d29d7fea4d7a/57509b7029d19788d944bc503a6b479d.png',
      username: '@iliasc'
    },
    season: 1,
    allTime: 178,
    scouted: 67,
    nftsHeld: 56
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5456438a-8f49-4ad1-bbb2-4a9ef884e323/81f51168-702c-4352-9654-7d6312e76156/S2dAJtBX9JCJl9OEGJvsMsVmmJzjIJbjBR22wFeY050.jpg',
      username: 'xandra'
    },
    season: 4,
    allTime: 68,
    scouted: 27,
    nftsHeld: 22
  }
];

const topBuildersData = [
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      username: '@devorain'
    },
    season: 1,
    allTime: 12,
    scoutedBy: 145,
    price: 100
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/ffb61d92-fcb0-4b88-91f2-a81838d73689/pixil-frame-0.png',
      username: '@drea'
    },
    season: 2,
    allTime: 15,
    scoutedBy: 15,
    price: 10
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/dc521ceb-495e-40cc-940e-3b1cafc7a2e1/0969b51d-83cd-4ce6-abe2-d47deca5741b/b6a3203b9dc30b6e2494abceb0846615.jpg',
      username: '@alexpoon.eth'
    },
    season: 3,
    allTime: 12,
    scoutedBy: 25,
    price: 48
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg',
      username: '@ccarella'
    },
    season: 2,
    allTime: 22,
    scoutedBy: 286,
    price: 100
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/05ae8fbd-a142-46dd-b0e8-9e0570e86324/41f03d51-06cf-405c-b1c4-d29d7fea4d7a/57509b7029d19788d944bc503a6b479d.png',
      username: '@iliasc'
    },
    season: 1,
    allTime: 178,
    scoutedBy: 35,
    price: 100
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5456438a-8f49-4ad1-bbb2-4a9ef884e323/81f51168-702c-4352-9654-7d6312e76156/S2dAJtBX9JCJl9OEGJvsMsVmmJzjIJbjBR22wFeY050.jpg',
      username: 'xandra'
    },
    season: 4,
    allTime: 68,
    scoutedBy: 335,
    price: 200
  }
];

export async function HomeTab({ tab }: { tab: string }) {
  await delay(3000);
  // const data = await getTabData(tab); @TODO: Implement getTabData and remove delay

  if (tab === 'activity') {
    return <ActivityTable data={activityData as any} />;
  }

  if (tab === 'topscouts') {
    return <TopScoutsTable data={topscoutsData as any} />;
  }

  if (tab === 'topbuilders') {
    return <TopBuildersTable data={topBuildersData as any} />;
  }

  return <LeaderboardTable data={leaderboardData as any} />;
}
