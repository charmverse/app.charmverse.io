import { Grid, Stack } from '@mui/material';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { Social } from 'components/u/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { useMemberCollections } from '../../hooks/useMemberCollections';
import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';
import { NftsList } from '../NftsList';
import { OrgsList } from '../OrgsList';
import { PoapsList } from '../PoapsList';

import { LensDefaultProfileWidget } from './LensDefaultProfileWidget';
import { ProfileWidget } from './ProfileWidget';
import { SocialWidget } from './SocialWidget';
import { SpaceMemberPropertyWidget } from './SpaceMemberPropertyWidget';

const profileWidgets = ['charmverse', 'collection', 'ens', 'social', 'lens'] as const;

export function ProfileWidgets({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();

  const { data: defaultLensProfile, isLoading: isLoadingLensProfile } = useSWR(`lens/profile/${userId}`, () =>
    charmClient.profile.getLensDefaultProfile(userId)
  );
  const { memberPropertyValues, isLoading: isLoadingSpaceMemberPropertyValues } = useMemberPropertyValues(userId);

  const { data: userDetails, isLoading: isLoadingUserDetails } = useSWRImmutable(`/userDetails/${userId}`, () => {
    return charmClient.getUserDetails();
  });

  const {
    isFetchingNfts,
    isFetchingOrgs,
    isFetchingPoaps,
    mutateNfts,
    mutateOrgs,
    nfts,
    nftsError,
    orgs,
    orgsError,
    poaps,
    poapsError
  } = useMemberCollections({ memberId: userId });

  const socialDetails = (userDetails?.social as Social | undefined) ?? {};

  const currentSpacePropertyValues = memberPropertyValues?.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  const hideSocials =
    !userDetails?.social ||
    (socialDetails?.discordUsername?.length === 0 &&
      socialDetails?.githubURL?.length === 0 &&
      socialDetails?.twitterURL?.length === 0 &&
      socialDetails?.linkedinURL?.length === 0);

  const hideCollections = nfts.length === 0 && orgs.length === 0 && poaps.length === 0;

  const isLoading =
    isFetchingNfts ||
    isFetchingOrgs ||
    isFetchingPoaps ||
    isLoadingLensProfile ||
    isLoadingUserDetails ||
    isLoadingSpaceMemberPropertyValues;

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  return (
    <Grid container spacing={4}>
      {profileWidgets.map((profileWidget) => {
        switch (profileWidget) {
          case 'collection':
            return hideCollections ? null : (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <ProfileWidget title='Collection'>
                  <Stack spacing={2}>
                    {nftsError || nfts.length === 0 ? null : (
                      <NftsList
                        userId={userId}
                        nfts={nfts}
                        nftsError={nftsError}
                        isFetchingNfts={isFetchingNfts}
                        mutateNfts={mutateNfts}
                        readOnly
                      />
                    )}

                    {orgsError || orgs.length === 0 ? null : (
                      <OrgsList
                        userId={userId}
                        orgs={orgs}
                        orgsError={orgsError}
                        isFetchingOrgs={isFetchingOrgs}
                        mutateOrgs={mutateOrgs}
                        readOnly
                      />
                    )}

                    {poapsError || poaps.length === 0 ? null : (
                      <PoapsList poaps={poaps} poapsError={poapsError} isFetchingPoaps={isFetchingPoaps} />
                    )}
                  </Stack>
                </ProfileWidget>
              </Grid>
            );

          case 'social':
            return hideSocials ? null : (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <SocialWidget socialDetails={socialDetails} />
              </Grid>
            );

          case 'charmverse':
            return space &&
              memberPropertyValues &&
              currentSpacePropertyValues &&
              currentSpacePropertyValues.properties.length !== 0 ? (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <SpaceMemberPropertyWidget memberPropertyValues={memberPropertyValues} />
              </Grid>
            ) : null;

          case 'lens':
            return defaultLensProfile ? (
              <Grid item xs={12} md={6} alignItems='stretch'>
                <LensDefaultProfileWidget lensProfile={defaultLensProfile} />
              </Grid>
            ) : null;

          default:
            return null;
        }
      })}
    </Grid>
  );
}
