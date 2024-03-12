import { useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberProfileJson } from 'lib/profile/memberProfiles';
import { memberProfileLabels, memberProfileNames } from 'lib/profile/memberProfiles';
import { sortArrayByObjectProperty } from 'lib/utils/array';

export const useMemberProfileTypes = () => {
  const { space, isLoading } = useCurrentSpace();

  const memberProfileTypes = useMemo(() => {
    const dbMemberProfiles = Object.fromEntries(
      ((space?.memberProfiles || []) as MemberProfileJson[]).map((_feat) => [_feat.id, _feat])
    );

    const sortedMemberProfiles = sortArrayByObjectProperty(
      memberProfileNames.map((n) => ({ id: n, title: memberProfileLabels[n] })),
      'id',
      ((space?.memberProfiles || []) as MemberProfileJson[]).map((feat) => feat.id)
    );

    const extendedMemberProfiles = sortedMemberProfiles.map((feat) => ({
      ...feat,
      isHidden: !!dbMemberProfiles[feat.id]?.isHidden
    }));

    return extendedMemberProfiles;
  }, [space?.memberProfiles]);

  return { memberProfileTypes, isLoading };
};
