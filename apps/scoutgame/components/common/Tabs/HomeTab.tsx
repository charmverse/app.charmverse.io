import 'server-only';

import { delay } from '@root/lib/utils/async';

import { ActivityTable } from './ActivityTable';

const data = [
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      username: '@devorain'
    },
    notification: {
      message: 'Contribution ACCEPTED',
      type: 'contribution'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/e5dba747-be62-49be-a7ba-71cf27b17174/ffb61d92-fcb0-4b88-91f2-a81838d73689/pixil-frame-0.png',
      username: '@drea'
    },
    notification: {
      message: 'Contribution STREAK',
      type: 'contribution'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/dc521ceb-495e-40cc-940e-3b1cafc7a2e1/0969b51d-83cd-4ce6-abe2-d47deca5741b/b6a3203b9dc30b6e2494abceb0846615.jpg',
      username: '@alexpoon.eth'
    },
    notification: {
      message: '1st contribution',
      type: 'contribution'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg',
      username: '@ccarella'
    },
    notification: {
      message: 'Grant WON',
      type: 'grant'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/05ae8fbd-a142-46dd-b0e8-9e0570e86324/41f03d51-06cf-405c-b1c4-d29d7fea4d7a/57509b7029d19788d944bc503a6b479d.png',
      username: '@iliasc'
    },
    notification: {
      message: 'SCOUTED @safwan',
      type: 'scout'
    },
    date: '2023-12-05'
  },
  {
    user: {
      avatar:
        'https://cdn.charmverse.io/user-content/5456438a-8f49-4ad1-bbb2-4a9ef884e323/81f51168-702c-4352-9654-7d6312e76156/S2dAJtBX9JCJl9OEGJvsMsVmmJzjIJbjBR22wFeY050.jpg',
      username: 'xandra'
    },
    notification: {
      message: 'Contribution ACCEPTED',
      type: 'contribution'
    },
    date: '2023-12-05'
  }
];

export async function HomeTab({ tab }: { tab: string }) {
  await delay(3000);
  // const data = await getTabData(tab); @TODO: Implement getTabData and remove delay
  // For now we only show the activity tab
  return <ActivityTable data={data as any} />;
}
