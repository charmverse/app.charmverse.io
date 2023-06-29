import { Stack } from '@mui/system';

import { NftsList } from '../NftsList';
import { OrgsList } from '../OrgsList';
import { PoapsList } from '../PoapsList';

import { ProfileWidget } from './ProfileWidget';

export function CollectionWidget({ userId }: { userId: string }) {
  return (
    <ProfileWidget title='Collection'>
      <Stack spacing={2}>
        <NftsList userId={userId} readOnly />
        <OrgsList userId={userId} readOnly />
        <PoapsList userId={userId} />
      </Stack>
    </ProfileWidget>
  );
}
