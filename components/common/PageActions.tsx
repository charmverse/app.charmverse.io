import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import { Divider, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageMeta } from 'lib/pages';
import { humanFriendlyDate } from 'lib/utilities/dates';

import { Utils } from './BoardEditor/focalboard/src/utils';

type SupportedPageType = 'bounty' | 'card' | 'proposal';

const PageTypeQueryParamRecord: Record<SupportedPageType, string> = {
  card: 'cardId',
  bounty: 'bountyId',
  proposal: 'id'
};

export function PageActions ({
  open,
  page,
  onClickDelete,
  anchorEl,
  onClick,
  children
}: {
  page: PageMeta;
  onClick: VoidFunction;
  onClickDelete?: VoidFunction;
  open: boolean;
  anchorEl: HTMLElement | null | undefined;
  children?: ReactNode;
}) {
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const pageCreator = members.find(member => member.id === page.createdBy);

  const pageType = page.type as SupportedPageType;

  function onClickCopyLink () {
    let link = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get(PageTypeQueryParamRecord[pageType]) !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set(PageTypeQueryParamRecord[pageType], page.id);
      link = newUrl.toString();
    }

    Utils.copyTextToClipboard(link);
    showMessage(`Copied ${page.type} link to clipboard`, 'success');
  }

  function onClickOpenInNewTab () {
    let link = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get(PageTypeQueryParamRecord[pageType]) !== page.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set(PageTypeQueryParamRecord[pageType], page.id);
      link = newUrl.toString();
    }

    window.open(link);
  }

  return (
    <Menu
      anchorEl={anchorEl}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={open}
    >
      {children}
      {onClickDelete && (
        <MenuItem dense onClick={onClickDelete}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      )}
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
  );
}
