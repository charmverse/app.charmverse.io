import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails ({ memberId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile, updateSpaceValues } = useMemberPropertyValues(memberId);
  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);

  const { query, pathname } = useRouter();

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  if (!memberPropertyValues?.length) {
    return null;
  }

  useEffect(() => {
    if (query.workspace) {
      const expandedWorkspaceAccordion = document.getElementById(`workspace-properties-accordion-${query.workspace}`);
      if (expandedWorkspaceAccordion) {
        expandedWorkspaceAccordion.scrollIntoView({
          behavior: 'smooth'
        });
        setUrlWithoutRerender(pathname, { workspace: null });
      }
    }
  }, [query]);

  return (
    <Box mt={2}>
      {memberPropertyValues.map(pv => (
        <SpaceDetailsAccordion
          key={pv.spaceId}
          spaceName={pv.spaceName}
          spaceImage={pv.spaceImage}
          properties={pv.properties}
          readOnly={!canEditSpaceProfile(pv.spaceId)}
          onEdit={() => setEditSpaceId(pv.spaceId)}
          expanded={query.workspace === pv.spaceId}
          spaceId={pv.spaceId}
        />
      ))}

      <MemberPropertiesPopupForm
        onClose={() => setEditSpaceId(null)}
        memberId={memberId}
        spaceId={editSpaceId}
        updateMemberPropertyValues={updateSpaceValues}
      />
    </Box>
  );
}

