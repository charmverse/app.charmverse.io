import PersonIcon from '@mui/icons-material/Person';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { VisibilityView } from '@prisma/client';
import type { SVGProps } from 'react';

import GalleryIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/gallery';
import TableIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/table';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { UNHIDEABLE_MEMBER_PROPERTIES } from 'lib/members/constants';
import type { MemberPropertyWithPermissions } from 'lib/members/interfaces';

function VisibilityViewIcon ({
  view,
  ...props
}: {
  view: VisibilityView;
} & SVGProps<any>) {
  if (view === 'gallery') {
    return <GalleryIcon {...props} />;
  }
  else if (view === 'table') {
    return <TableIcon {...props} />;
  }

  return <PersonIcon {...props as any} />;
}

function MemberPropertyVisibilityView ({
  view,
  enabledViews,
  memberPropertyId
}: {
  view: VisibilityView;
  enabledViews: VisibilityView[];
  memberPropertyId: string;
}) {
  const { updateMemberPropertyVisibility } = useMemberProperties();
  const isDisabled = !enabledViews.includes(view);

  return (
    <Tooltip title={`Property is ${isDisabled ? 'invisible' : 'visible'} in ${view} view`}>
      <Typography sx={{
        display: 'flex',
        alignItems: 'center',
        color: isDisabled ? 'action.disabled' : 'inherit',
        cursor: 'pointer'
      }}
      >
        <VisibilityViewIcon
          view={view}
          width={20}
          height={20}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            updateMemberPropertyVisibility({
              memberPropertyId,
              view,
              visible: isDisabled
            });
          }}
        />
      </Typography>
    </Tooltip>
  );
}

export function MemberPropertyVisibility ({
  property
}: {
  property: MemberPropertyWithPermissions;
}) {
  const enabledViews = property.enabledViews;
  if (UNHIDEABLE_MEMBER_PROPERTIES.includes(property.type)) {
    return null;
  }
  return (
    <>
      <Typography variant='overline' alignItems='center' display='flex'>
        View Visibility
      </Typography>
      <Stack gap={1} flexDirection='row' mb={1}>
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='gallery'
        />
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='table'
        />
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='profile'
        />
      </Stack>
    </>
  );
}
