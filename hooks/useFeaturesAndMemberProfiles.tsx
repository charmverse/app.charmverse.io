import type { Feature } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import type { FeatureJson, StaticPagesType } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberProfileJson } from 'lib/profile/memberProfiles';
import { memberProfileLabels, memberProfileNames } from 'lib/profile/memberProfiles';
import { sortArrayByObjectProperty } from 'lib/utilities/array';

type MappedFeatures = Record<
  Feature,
  {
    id: Feature;
    isHidden: boolean;
    title: string;
    path: StaticPagesType;
  }
>;

export const useFeaturesAndMembers = () => {
  const { space, isLoading } = useCurrentSpace();

  const features = useMemo(() => {
    const dbFeatures = Object.fromEntries(((space?.features || []) as FeatureJson[]).map((_feat) => [_feat.id, _feat]));

    const sortedFeatures = sortArrayByObjectProperty(
      STATIC_PAGES,
      'feature',
      ((space?.features || []) as FeatureJson[]).map((feat) => feat.id)
    );

    const extendedFeatures = sortedFeatures.map(({ feature, ...restFeat }) => ({
      ...restFeat,
      id: feature,
      isHidden: !!dbFeatures[feature]?.isHidden,
      title: dbFeatures[feature]?.title || restFeat.title
    }));

    return extendedFeatures;
  }, [space?.features]);

  const memberProfiles = useMemo(() => {
    const dbMemberProfiles = Object.fromEntries(
      ((space?.memberProfiles || []) as MemberProfileJson[]).map((_feat) => [_feat.id, _feat])
    );

    const sortedMemberProfiles = sortArrayByObjectProperty(
      memberProfileNames.map((n) => ({ id: n, title: memberProfileLabels[n] })),
      'id',
      ((space?.memberProfiles || []) as FeatureJson[]).map((feat) => feat.id)
    );

    const extendedMemberProfiles = sortedMemberProfiles.map((feat) => ({
      ...feat,
      isHidden: !!dbMemberProfiles[feat.id]?.isHidden
    }));

    return extendedMemberProfiles;
  }, [space?.memberProfiles]);

  const mappedFeatures = useMemo(() => {
    return features.reduce((acc, val) => {
      acc[val.id] = val;
      return acc;
    }, {} as MappedFeatures);
  }, [features]);

  return { features, memberProfiles, mappedFeatures, isLoading };
};
