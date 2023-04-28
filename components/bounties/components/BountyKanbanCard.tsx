import styled from '@emotion/styled';
import { Box, CardHeader, Typography } from '@mui/material';
import { memo } from 'react';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import { usePage } from 'hooks/usePage';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';
import { fancyTrim } from 'lib/utilities/strings';

import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails;
  page: PageMeta;
  onClick: () => void;
  onDelete: (bountyId: string) => void;
  readOnly: boolean;
  onDuplicate?: (duplicatePageResponse: DuplicatePageResponse) => void;
}

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

function BountyKanbanCard({ onDelete, bounty, page: bountyPage, onDuplicate, onClick, readOnly }: Props) {
  const { page } = usePage({ pageIdOrPath: bountyPage?.id });
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
          title={bountyPage ? bountyPage.title || 'Untitled' : ''}
          sx={{ p: 0 }}
          titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }}
        />
        <Box width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>{fancyTrim(page?.contentText, 50)}</Typography>
          <BountyStatusBadge bounty={bounty} hideStatus={true} truncate />
        </Box>
      </Box>
      {onDelete && (
        <PageActions
          page={bountyPage}
          onDuplicate={onDuplicate}
          readOnly={readOnly}
          onClickDelete={() => onDelete(bounty.id)}
        />
      )}
    </StyledBox>
  );
}

export default memo(BountyKanbanCard);
