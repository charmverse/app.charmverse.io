import PersonIcon from '@mui/icons-material/Person';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { VisibilityView } from '@prisma/client';
import type { SVGProps } from 'react';

import GalleryIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/gallery';
import TableIcon from 'components/common/BoardEditor/focalboard/src/widgets/icons/table';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';
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
  memberPropertyId,
  disabled
}: {
  disabled: boolean;
  view: VisibilityView;
  enabledViews: VisibilityView[];
  memberPropertyId: string;
}) {
  const { updateMemberPropertyVisibility } = useMemberProperties();
  const isDisabled = !enabledViews.includes(view);

  return (
    <Tooltip title={!disabled ? `Property is ${isDisabled ? 'invisible' : 'visible'} in ${view} view` : ''}>
      <Typography sx={{
        display: 'flex',
        alignItems: 'center',
        color: isDisabled ? 'action.disabled' : 'inherit',
        cursor: disabled ? 'initial' : 'pointer'
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
  if (MEMBER_PROPERTY_CONFIG[property.type]?.unhideable) {
    return null;
  }

  const admin = isAdmin();
  return (
    <Stack flexDirection='row' justifyContent='space-between' mr={2}>
      <Typography variant='overline' alignItems='center' display='flex'>
        Views
      </Typography>
      <Stack gap={1} flexDirection='row'>
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='gallery'
          disabled={!admin}
        />
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='table'
          disabled={!admin}
        />
        <MemberPropertyVisibilityView
          enabledViews={enabledViews}
          memberPropertyId={property.id}
          view='profile'
          disabled={!admin}
        />
      </Stack>
    </Stack>
  );
}
