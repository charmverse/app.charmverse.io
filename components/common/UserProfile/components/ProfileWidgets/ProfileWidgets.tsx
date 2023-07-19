import { Grid } from '@mui/material';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { CollectionWidget } from './CollectionWidget';
import { EnsWidget } from './EnsWidget';
import { LensDefaultProfileWidget } from './LensDefaultProfileWidget';
import { MemberPropertiesWidget } from './MemberPropertiesWidget';
import { SummonProfileWidget } from './SummonProfileWidget';

const profileWidgets = ['charmverse', 'collection', 'ens', 'lens', 'summon'] as const;

export function ProfileWidgets({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();
  return (
    <Grid container spacing={4}>
      {profileWidgets.map((profileWidget) => {
        switch (profileWidget) {
          case 'ens':
            return (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <EnsWidget userId={userId} />
              </Grid>
            );

          case 'collection':
            return (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <CollectionWidget userId={userId} />
              </Grid>
            );

          case 'charmverse':
            return space ? (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <MemberPropertiesWidget userId={userId} />
              </Grid>
            ) : null;

          case 'summon': {
            return (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <SummonProfileWidget userId={userId} />
              </Grid>
            );
          }

          case 'lens':
            return (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
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
