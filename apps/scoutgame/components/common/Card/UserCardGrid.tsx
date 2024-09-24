import { Grid2 as Grid } from '@mui/material';

import { UserCard } from 'components/common/Card/UserCard';
import type { BuilderUserInfo } from 'lib/builders/interfaces';

export function UserCardGrid({ users }: { users: BuilderUserInfo[] }) {
  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6, md: 12, lg: 12 }}>
      {users.map((userCard) => (
        <Grid key={userCard.username} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
          <UserCard key={userCard.username} user={userCard} variant='small' withDetails={false} />
        </Grid>
      ))}
    </Grid>
  );
}
