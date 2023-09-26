import { Grid } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';

import { useMemberCollections } from '../../hooks/useMemberCollections';
import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';

import { CollectionWidget } from './CollectionWidget';
import { EnsWidget } from './EnsWidget';
import { LensProfileWidget } from './LensProfileWidget';
import { MemberPropertiesWidget } from './MemberPropertiesWidget/MemberPropertiesWidget';
import { SummonProfileWidget } from './SummonProfileWidget';

export function ProfileWidgets({ userId, readOnly }: { userId: string; readOnly?: boolean }) {
  const { space } = useCurrentSpace();
  const {
    memberPropertyValues = [],
    isLoading: isLoadingMemberPropertiesValues,
    canEditSpaceProfile
  } = useMemberPropertyValues(userId);
  const { memberProfiles } = useFeaturesAndMembers();

  const { data: ensProfile, isLoading: isLoadingEnsProfile } = useSWR(`public/profile/${userId}/ens`, () =>
    charmClient.publicProfile.getEnsProfile(userId)
  );

  const { data: lensProfile, isLoading: isLoadingLensProfile } = useSWR(`public/profile/${userId}/lens`, () =>
    charmClient.publicProfile.getLensProfile(userId)
  );

  const { data: summonProfile, isLoading: isLoadingSummonProfile } = useSWR(`public/profile/${userId}/summon`, () =>
    charmClient.publicProfile.getSummonProfile(userId)
  );

  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const hideCollections = pinnedNfts.length === 0 && poaps.length === 0;
  const isLoading =
    isLoadingSummonProfile &&
    isLoadingEnsProfile &&
    isFetchingPoaps &&
    isFetchingNfts &&
    isLoadingMemberPropertiesValues &&
    isLoadingLensProfile;

  const readOnlyMemberProperties = !space || !canEditSpaceProfile(space.id);

  if (isLoading) {
    return <LoadingComponent isLoading minHeight={300} />;
  }

  return (
    <Grid container spacing={4}>
      {memberProfiles
        ?.filter(({ isHidden }) => !isHidden)
        .map(({ id }) => {
          switch (id) {
            case 'ens':
              return (
                ensProfile && (
                  <Grid item xs={12} md={6} alignItems='stretch' key={id}>
                    <EnsWidget ensProfile={ensProfile} />
                  </Grid>
                )
              );

            case 'collection':
              return (
                !hideCollections &&
                (!nftsError || !poapsError) && (
                  <Grid item xs={12} md={6} alignItems='stretch' key={id}>
                    <CollectionWidget
                      mutateNfts={mutateNfts}
                      nfts={nfts}
                      poaps={poaps}
                      userId={userId}
                      readOnly={readOnly}
                    />
                  </Grid>
                )
              );

            case 'charmverse':
              return space ? (
                <Grid item xs={12} md={6} alignItems='stretch' key={id}>
                  <MemberPropertiesWidget
                    memberPropertyValues={memberPropertyValues}
                    readOnly={readOnlyMemberProperties}
                    userId={userId}
                  />
                </Grid>
              ) : null;

            case 'summon': {
              return (
                summonProfile && (
                  <Grid item xs={12} md={6} alignItems='stretch' key={id}>
                    <SummonProfileWidget summonProfile={summonProfile} />
                  </Grid>
                )
              );
            }

            case 'lens':
              return (
                lensProfile && (
                  <Grid item xs={12} md={6} alignItems='stretch' key={id}>
                    <LensProfileWidget lensProfile={lensProfile} />
                  </Grid>
                )
              );

            default:
              return null;
          }
        })}
    </Grid>
  );
}
