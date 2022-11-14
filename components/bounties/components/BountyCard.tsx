import styled from '@emotion/styled';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, CardHeader, Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { useMembers } from 'hooks/useMembers';
import { usePageDetails } from 'hooks/usePageDetails';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import { isTouchScreen } from 'lib/utilities/browser';
import { humanFriendlyDate } from 'lib/utilities/dates';
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
  const { members } = useMembers();
  const pageCreator = members.find(member => member.id === page.createdBy);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { showMessage } = useSnackbar();
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  function onClickDelete () {
    deletePage({ pageId: page.id });
  }

  function onClickCopyLink () {
    let bountyLink = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get('bountyId') !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set('bountyId', page.id);
      bountyLink = newUrl.toString();
    }

    Utils.copyTextToClipboard(bountyLink);
    showMessage('Copied bounty link to clipboard', 'success');
  }

  function onClickOpenInNewTab () {
    let bountyLink = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get('bountyId') !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set('bountyId', page.id);
      bountyLink = newUrl.toString();
    }

    window.open(bountyLink);
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
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={handleClose}
        open={open}
      >
        <MenuItem dense onClick={onClickDelete}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={onClickCopyLink}>
          <LinkIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={onClickOpenInNewTab}>
          <LaunchIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Open in new tab</ListItemText>
        </MenuItem>
        <Divider />
        {
          pageCreator && (
            <Stack sx={{
              px: 1
            }}
            >
              <Typography variant='subtitle2'>
                Last edited by {pageCreator.username}
              </Typography>
              <Typography variant='subtitle2'>
                Last edited at {humanFriendlyDate(page.updatedAt)}
              </Typography>
            </Stack>
          )
        }
      </Menu>
    </StyledBox>
  );
}

export default memo(BountyCard);
