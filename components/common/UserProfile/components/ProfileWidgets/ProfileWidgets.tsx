import type { MemberPropertyType } from '@charmverse/core/src/prisma-client';
import { Grid, Stack } from '@mui/material';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { Social } from 'components/u/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';

import { useMemberCollections } from '../../hooks/useMemberCollections';
import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';
import { MemberProperties } from '../MemberProperties';
import { NftsList } from '../NftsList';
import { OrgsList } from '../OrgsList';
import { PoapsList } from '../PoapsList';

import { EnsWidget } from './EnsWidget';
import { LensDefaultProfileWidget } from './LensDefaultProfileWidget';
import { ProfileWidget } from './ProfileWidget';
import { SocialWidget } from './SocialWidget';

const profileWidgets = ['lens', 'charmverse', 'social', 'collection', 'ens'] as const;

export function ProfileWidgets({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();

  const { data: defaultLensProfile, isLoading: isLoadingLensProfile } = useSWR(`public/profile/${userId}/lens`, () =>
    charmClient.publicProfile.getLensProfile(userId)
  );

  const { data: ensProfile, isLoading: isLoadingEnsProfile } = useSWR(`public/profile/${userId}/ens`, () =>
    charmClient.publicProfile.getEnsProfile(userId)
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

  const { getDisplayProperties } = useMemberProperties();

  const visibleProperties = getDisplayProperties('profile');

  const currentSpacePropertyValues = memberPropertyValues?.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  const currentSpacePropertyNonEmptyValues = (
    currentSpacePropertyValues?.properties.filter((propertyValue) =>
      visibleProperties.some((prop) => prop.id === propertyValue.memberPropertyId)
    ) ?? []
  ).filter(
    (property) =>
      (Array.isArray(property.value) ? property.value.length !== 0 : !!property.value) &&
      // These are not shown in member properties, so even if their value exist we don't want to show them
      !(['bio', 'discord', 'twitter', 'linked_in', 'github', 'timezone'] as MemberPropertyType[]).includes(
        property.type
      )
  );

  const socialDetails = (userDetails?.social as Social | undefined) ?? {};

  const hideSocials =
    !userDetails?.social ||
    (socialDetails?.discordUsername?.length === 0 &&
      socialDetails?.githubURL?.length === 0 &&
      socialDetails?.twitterURL?.length === 0 &&
      socialDetails?.linkedinURL?.length === 0);

  const pinnedOrgs = orgs.filter((org) => org.isPinned);
  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const hideCollections = pinnedNfts.length === 0 && pinnedOrgs.length === 0 && poaps.length === 0;

  const isLoading =
    isFetchingNfts ||
    isFetchingOrgs ||
    isFetchingPoaps ||
    isLoadingLensProfile ||
    isLoadingUserDetails ||
    isLoadingSpaceMemberPropertyValues ||
    isLoadingEnsProfile;

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  return (
    <Grid container spacing={4}>
      {profileWidgets.map((profileWidget) => {
        switch (profileWidget) {
          case 'ens':
            return ensProfile ? (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <EnsWidget ensProfile={ensProfile} />
              </Grid>
            ) : null;

          case 'collection':
            return hideCollections ? null : (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <ProfileWidget title='Collection'>
                  <Stack spacing={2}>
                    {nftsError || pinnedNfts.length === 0 ? null : (
                      <NftsList
                        userId={userId}
                        nfts={nfts}
                        nftsError={nftsError}
                        isFetchingNfts={isFetchingNfts}
                        mutateNfts={mutateNfts}
                        readOnly
                      />
                    )}

                    {orgsError || pinnedOrgs.length === 0 ? null : (
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
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <SocialWidget socialDetails={socialDetails} />
              </Grid>
            );

          case 'charmverse':
            return space &&
              memberPropertyValues &&
              currentSpacePropertyValues &&
              currentSpacePropertyValues.properties.length !== 0 &&
              currentSpacePropertyNonEmptyValues.length !== 0 ? (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <ProfileWidget title='CharmVerse Details'>
                  <MemberProperties properties={currentSpacePropertyNonEmptyValues} />
                </ProfileWidget>
              </Grid>
            ) : null;

          case 'lens':
            return defaultLensProfile ? (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
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
