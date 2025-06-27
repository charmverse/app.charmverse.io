import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { AssignedPagePermission } from '@packages/core/permissions';

import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

type Props = {
  permission: AssignedPagePermission;
};
export function PermissionInheritedFrom({ permission }: Props) {
  const { pages } = usePages();
  const { space } = useCurrentSpace();

  const sourcePage = permission.sourcePermission ? pages[permission.sourcePermission.pageId] : null;

  if (!sourcePage) {
    return null;
  }

  return (
    <Box display='block'>
      <Typography variant='caption'>
        Inherited from
        <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${sourcePage.path}`}>
          {sourcePage.title || 'Untitled'}
        </Link>
      </Typography>
    </Box>
  );
}
