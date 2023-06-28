import { Grid } from '@mui/material';

import { CollectionWidget } from './CollectionWidget';
import { SocialWidget } from './SocialWidget';

export function ProfileWidgets({ userId }: { userId: string }) {
  const profileComponents = ['collection', 'ens', 'social', 'charmverse', 'lens'];

  return (
    <Grid container spacing={4}>
      {profileComponents.map((profileComponent) => {
        switch (profileComponent) {
          case 'collection':
            return (
              <Grid item xs={12} md={6}>
                <CollectionWidget userId={userId} />
              </Grid>
            );
          case 'social':
            return (
              <Grid item xs={12} md={6}>
                <SocialWidget userId={userId} />
              </Grid>
            );
          default:
            return null;
        }
      })}
    </Grid>
  );
}
