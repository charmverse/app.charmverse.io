import type { VisibilityView } from '@charmverse/core/prisma';
import PersonIcon from '@mui/icons-material/Person';
import { Stack, Tooltip, Typography } from '@mui/material';

import GalleryIcon from 'components/common/DatabaseEditor/widgets/icons/gallery';
import TableIcon from 'components/common/DatabaseEditor/widgets/icons/table';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { MEMBER_PROPERTY_CONFIG } from '@packages/lib/members/constants';
import type { MemberPropertyWithPermissions } from '@packages/lib/members/interfaces';

function VisibilityViewIcon({
  view,
  ...props
}: {
  view: VisibilityView;
} & { fontSize?: 'small' }) {
  if (view === 'gallery') {
    return <GalleryIcon {...props} />;
  } else if (view === 'table') {
    return <TableIcon {...props} />;
  }

  return <PersonIcon {...(props as any)} />;
}

function MemberPropertyVisibilityView({
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
      <Typography
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: isDisabled ? 'action.disabled' : 'inherit',
          cursor: disabled ? 'initial' : 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          updateMemberPropertyVisibility({
            memberPropertyId,
            view,
            visible: isDisabled
          });
        }}
      >
        <VisibilityViewIcon view={view} fontSize='small' />
      </Typography>
    </Tooltip>
  );
}

export function MemberPropertyVisibility({ property }: { property: MemberPropertyWithPermissions }) {
  const enabledViews = property.enabledViews;

  const admin = useIsAdmin();

  if (MEMBER_PROPERTY_CONFIG[property.type]?.unhideable) {
    return null;
  }

  return (
    <Stack flexDirection='row' justifyContent='space-between'>
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
