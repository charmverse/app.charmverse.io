import { Grid } from '@mui/material';

import { CollectionProfileWidget } from './CollectionProfileWidget';

export function ProfileWidgets({ userId }: { userId: string }) {
  const profileComponents = ['collection', 'ens', 'social', 'charmverse', 'lens'];

  return (
    <Grid container spacing={4}>
      {profileComponents.map((profileComponent) => {
        switch (profileComponent) {
          case 'collection':
          case 'ens':
          case 'social':
            return (
              <Grid item xs={12} md={6}>
                <CollectionProfileWidget userId={userId} />
              </Grid>
            );
          default:
            return null;
        }
      })}
    </Grid>
  );
}
