import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, CardHeader, IconButton, Typography } from '@mui/material';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import { usePageDetails } from 'hooks/usePageDetails';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import { isTouchScreen } from 'lib/utilities/browser';
import { fancyTrim } from 'lib/utilities/strings';

import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails;
  page: PageMeta;
  onClick?: () => void;
}

const StyledBox = styled(Box)`
  ${({ theme }) => hoverIconsStyle({ theme, isTouchScreen: isTouchScreen() })}
`;

function BountyCard ({ bounty, page, onClick }: Props) {
  const { pageDetails } = usePageDetails(page?.id);
  const { deletePage } = usePages();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function onClickDelete () {
    deletePage({ pageId: page.id });
  }

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
        <CardHeader title={page?.title || 'Untitled'} sx={{ p: 0 }} titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }} />
        <Box width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>
            {fancyTrim(pageDetails?.contentText, 50)}
          </Typography>
          <BountyStatusBadge bounty={bounty} hideStatus={true} truncate />
        </Box>
      </Box>
      <IconButton
        size='small'
        className='icons'
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          p: 1,
          m: 1
        }}
        onClick={handleClick}
      >
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      <PageActions
        pageType='bounty'
        anchorEl={anchorEl}
        onClick={handleClose}
        open={open}
        onClickDelete={onClickDelete}
        pageCreatedBy={page.createdBy}
        pageId={page.id}
        pageUpdatedAt={page.updatedAt}
      />
    </StyledBox>
  );
}

export default memo(BountyCard);
