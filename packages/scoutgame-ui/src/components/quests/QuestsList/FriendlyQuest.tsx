import { Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { Hidden } from '../../common/Hidden';
import { Info } from '../../friends/components/Info';
import { InviteButtons } from '../../friends/components/InviteButtons';
import { MyFriends } from '../../friends/components/MyFriends';
import { Stats } from '../../friends/components/Stats';

export function FriendlyQuest({ friends, title }: { friends: SessionUser[]; title?: string }) {
  return (
    <Stack gap={2} py={{ md: 2 }} data-test='friendly-quest'>
      {title && (
        <Typography variant='h4' textAlign='center' color='secondary' fontWeight='600'>
          {title}
        </Typography>
      )}
      <Info />
      <InviteButtons friends={friends} stats={<Stats friends={friends} />} />
      <Hidden mdDown>
        <MyFriends friends={friends} title='My Friends' />
      </Hidden>
    </Stack>
  );
}
