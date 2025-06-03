import { Grid } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetUserCredentials } from 'charmClient/hooks/credentials';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProfileTypes } from 'hooks/useMemberProfileTypes';

import { useMemberCollections } from '../../../../hooks/useMemberCollections';
import { useMemberPropertyValues } from '../../../../hooks/useMemberPropertyValues';

import { CollectionWidget } from './components/CollectionWidget/CollectionWidget';
import { CredentialsWidget } from './components/CredentialsWidget';
import { EnsWidget } from './components/EnsWidget';
import { MemberPropertiesWidget } from './components/MemberPropertiesWidget/MemberPropertiesWidget';
import { SummonProfileWidget } from './components/SummonProfileWidget';

export function ProfileWidgets({
  userId,
  readOnly,
  setActiveTab,
  showAllProfileTypes = false
}: {
  setActiveTab?: Dispatch<SetStateAction<number>>;
  userId: string;
  readOnly?: boolean;
  showAllProfileTypes?: boolean;
}) {
  const { space } = useCurrentSpace();
  const {
    memberPropertyValues = [],
    isLoading: isLoadingMemberPropertiesValues,
    canEditSpaceProfile
  } = useMemberPropertyValues(userId);
  const { memberProfileTypes } = useMemberProfileTypes();
  const { isLoading: isLoadingUserCredentials, data: userCredentials } = useGetUserCredentials({ userId });
  const { data: ensProfile, isLoading: isLoadingEnsProfile } = useSWR(`public/profile/${userId}/ens`, () =>
    charmClient.publicProfile.getEnsProfile(userId)
  );

  const { data: summonProfile, isLoading: isLoadingSummonProfile } = useSWR(
    space && `public/profile/${userId}/summon`,
    () => charmClient.publicProfile.getSummonProfile(userId, space!.id)
  );

  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });

  const readOnlyMemberProperties = !space || !canEditSpaceProfile(space.id);

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const hideCollections = pinnedNfts.length === 0 && poaps.length === 0 && readOnlyMemberProperties;
  const isLoading =
    isLoadingSummonProfile &&
    isLoadingEnsProfile &&
    isFetchingPoaps &&
    isFetchingNfts &&
    isLoadingMemberPropertiesValues &&
    isLoadingUserCredentials;

  if (isLoading) {
    return <LoadingComponent isLoading minHeight={300} />;
  }

  return (
    <Grid container spacing={4}>
      {(showAllProfileTypes ? memberProfileTypes : memberProfileTypes?.filter(({ isHidden }) => !isHidden))?.map(
        ({ id }) => {
          switch (id) {
            case 'ens':
              return (
                ensProfile && (
                  <Grid size={{ xs: 12, md: 6 }} alignItems='stretch' key={id}>
                    <EnsWidget ensProfile={ensProfile} />
                  </Grid>
                )
              );

            case 'credentials':
              return (
                userCredentials &&
                userCredentials?.length !== 0 && (
                  <Grid size={{ xs: 12, md: 6 }} alignItems='stretch' key={id}>
                    <CredentialsWidget setActiveTab={setActiveTab} credentials={userCredentials ?? []} />
                  </Grid>
                )
              );

            case 'collection':
              return (
                !hideCollections &&
                (!nftsError || !poapsError) && (
                  <Grid size={{ xs: 12, md: 6 }} alignItems='stretch' key={id}>
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
                <Grid size={{ xs: 12, md: 6 }} alignItems='stretch' key={id}>
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
                  <Grid size={{ xs: 12, md: 6 }} alignItems='stretch' key={id}>
                    <SummonProfileWidget summonProfile={summonProfile} />
                  </Grid>
                )
              );
            }

            default:
              return null;
          }
        }
      )}
    </Grid>
  );
}
