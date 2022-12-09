import styled from '@emotion/styled';
import { Box, CardHeader, Typography } from '@mui/material';
import { memo } from 'react';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import { usePageDetails } from 'hooks/usePageDetails';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { fancyTrim } from 'lib/utilities/strings';

import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails;
  page: PageMeta;
  onClick?: () => void;
  onDelete?: (bountyId: string) => void;
  getPagePermissions: (pageId: string, page?: PageMeta | undefined) => IPagePermissionFlags;
}

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

function BountyCard({ onDelete, bounty, getPagePermissions, page, onClick }: Props) {
  const { pageDetails } = usePageDetails(page?.id);
  const pagePermission = getPagePermissions(page.id);
  return (
    <StyledBox
      onClick={onClick}
      className='KanbanCard'
      sx={{
        height: 'fit-content',
        display: 'grid' // make child full height,
      }}
      data-test={`bounty-card-${bounty?.id}`}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <CardHeader
          title={page?.title || 'Untitled'}
          sx={{ p: 0 }}
          titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }}
        />
        <Box width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>{fancyTrim(pageDetails?.contentText, 50)}</Typography>
          <BountyStatusBadge bounty={bounty} hideStatus={true} truncate />
        </Box>
      </Box>
      {onDelete && (
        <PageActions page={page} onClickDelete={pagePermission?.delete ? () => onDelete(bounty.id) : undefined} />
      )}
    </StyledBox>
  );
}

export default memo(BountyCard);
