import styled from '@emotion/styled';
import LaunchIcon from '@mui/icons-material/Launch';
import { Stack } from '@mui/material';
import type { OpProjectFieldValue } from '@packages/lib/proposals/forms/interfaces';

import { StyledTypography } from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import Link from 'components/common/Link';

const Typography = styled(StyledTypography)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function OptimismProjectLink({ value }: { value?: OpProjectFieldValue }) {
  if (!value) {
    return null;
  }

  return (
    <Link href={`https://retrolist.app/project/${value.projectRefUID}`} target='_blank'>
      <Stack direction='row' gap={0.5} alignItems='center'>
        <Typography>{value.projectTitle}</Typography>
        <LaunchIcon fontSize='small' />
      </Stack>
    </Link>
  );
}
