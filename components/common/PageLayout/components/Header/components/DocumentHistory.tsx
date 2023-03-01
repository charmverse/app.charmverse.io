import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

const StyledTypography = styled(Typography)`
  color: ${({ theme }) => theme.palette.grey[300]};
`;

export function DocumentHistory({
  page
}: {
  page: { createdAt: Date; createdBy: string; updatedAt: Date; updatedBy: string };
}) {
  const { members } = useMembers();
  const { formatDateTime } = useDateFormatter();

  const createdBy = members.find((member) => member.id === page.createdBy)?.username ?? 'Unknown user';
  const updatedBy = members.find((member) => member.id === page.updatedBy)?.username ?? createdBy;

  const tooltipCreatedAt = getRelativeTimeInThePast(new Date(page.createdAt));
  const tooltipUpdatedAt = getRelativeTimeInThePast(new Date(page.updatedAt));

  return (
    <Tooltip
      arrow={false}
      placement='left'
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(97, 97, 97, 1)',
            top: '-20px'
          }
        }
      }}
      title={
        <>
          <StyledTypography variant='caption'>Edited by</StyledTypography> {updatedBy}{' '}
          <StyledTypography variant='caption'>{tooltipUpdatedAt}</StyledTypography>
          <br />
          <StyledTypography variant='caption'>Created by</StyledTypography> {createdBy}{' '}
          <StyledTypography variant='caption'>{tooltipCreatedAt}</StyledTypography>
        </>
      }
    >
      <Box mx={2} my={1}>
        <Typography variant='subtitle2'>
          Last edited by <strong>{updatedBy}</strong>
        </Typography>
        <Typography variant='subtitle2'>
          at <strong>{formatDateTime(page.updatedAt)}</strong>
        </Typography>
        {/* <Typography color='secondary' fontSize={12.8} variant='caption' fontWeight={500}>Edited {updatedAt}</Typography> */}
      </Box>
    </Tooltip>
  );
}
