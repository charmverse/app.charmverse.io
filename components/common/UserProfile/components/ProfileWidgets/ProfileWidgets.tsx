import { Grid } from '@mui/material';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { CollectionWidget } from './CollectionWidget';
import { LensDefaultProfileWidget } from './LensDefaultProfileWidget';
import { SocialWidget } from './SocialWidget';
import { SpaceMemberPropertyWidget } from './SpaceMemberPropertyWidget';

export function ProfileWidgets({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();

  const profileWidgets = ['charmverse', 'collection', 'ens', 'social', 'lens'] as const;

  return (
    <Grid container spacing={4}>
      {profileWidgets.map((profileWidget) => {
        switch (profileWidget) {
          case 'collection':
            return (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <CollectionWidget userId={userId} />
              </Grid>
            );
          case 'social':
            return (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <SocialWidget userId={userId} />
              </Grid>
            );

          case 'charmverse':
            return space ? (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <SpaceMemberPropertyWidget userId={userId} />
              </Grid>
            ) : null;

          case 'lens':
            return (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <LensDefaultProfileWidget userId={userId} />
              </Grid>
            );
          default:
            return null;
        }
      })}
    </Grid>
  );
}
