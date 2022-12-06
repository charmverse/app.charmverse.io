import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { memo, useCallback, useEffect, useState } from 'react';

import Button from 'components/common/Button';
import { useMembers } from 'hooks/useMembers';
import type { PageMeta } from 'lib/pages';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

const StyledTypography = styled(Typography)`
  color: ${({ theme }) => theme.palette.grey[300]};
`;

function DocumentHistory({ page }: { page: PageMeta }) {
  const updateRelativeDatesCb = useCallback(
    () => ({
      createdAt: getRelativeTimeInThePast(new Date(page.createdAt)),
      updatedAt: getRelativeTimeInThePast(new Date(page.updatedAt))
    }),
    [page.updatedAt, page.updatedAt]
  );

  const [{ updatedAt, createdAt }, setTime] = useState(updateRelativeDatesCb());
  const { members } = useMembers();

  const createdBy = members.find((member) => member.id === page.createdBy)?.username ?? 'Unknown user';
  const updatedBy = members.find((member) => member.id === page.updatedBy)?.username ?? createdBy;

  useEffect(() => {
    setTime(updateRelativeDatesCb());
  }, [updateRelativeDatesCb]);

  return (
    <Tooltip
      arrow={false}
      placement='bottom-start'
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(97, 97, 97, 1)',
            top: '-20px'
          }
        }
      }}
      onOpen={() => setTime(updateRelativeDatesCb())}
      title={
        <>
          <StyledTypography variant='caption'>Edited by</StyledTypography> {updatedBy}{' '}
          <StyledTypography variant='caption'>{updatedAt}</StyledTypography>
          <br />
          <StyledTypography variant='caption'>Created by</StyledTypography> {createdBy}{' '}
          <StyledTypography variant='caption'>{createdAt}</StyledTypography>
        </>
      }
    >
      <Box display={{ xs: 'none', lg: 'block' }} mr={2}>
        <Button color='secondary' size='small' variant='text' disabled>
          Edited {updatedAt}
        </Button>
        {/* <Typography color='secondary' fontSize={12.8} variant='caption' fontWeight={500}>Edited {updatedAt}</Typography> */}
      </Box>
    </Tooltip>
  );
}

export default memo(DocumentHistory);
