import type { Space } from '@charmverse/core/prisma-client';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, ListItemText, Tooltip } from '@mui/material';
import type { MenuProps } from '@mui/material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { Button } from 'components/common/Button';
import { useTokenGateAccess } from 'hooks/useTokenGateAccess';

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    maxWidth: 260,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0'
    },
    '& .MuiMenuItem-root': {
      alignItems: 'flex-start',
      whiteSpace: 'normal',
      '& .MuiBox-root': {
        display: 'flex',
        flexDirection: 'column'
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.text.secondary,
        marginTop: theme.spacing(0.2),
        marginRight: theme.spacing(1)
      }
    }
  }
}));

interface InviteActionsProps {
  isAdmin: boolean;
  onOpenInvitesClick: () => void;
  onOpenTokenGateClick: () => void;
  space: Space;
}

function InviteActions({ isAdmin, onOpenInvitesClick, onOpenTokenGateClick, space }: InviteActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { canCreateTokenGate, hasReachedLimit, currentCount, maxCount } = useTokenGateAccess({ space });

  const handleAddClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const tokenGateTooltip = !isAdmin
    ? 'Only space admins can create invite links'
    : !canCreateTokenGate
      ? `You have reached the maximum number of token gates (${currentCount}/${maxCount}) for your subscription tier`
      : '';

  return (
    <>
      <Tooltip title={tokenGateTooltip} arrow>
        {/* Tooltip on disabled button requires one block element below wrapper */}
        <span>
          <Button
            id='add-invites-button'
            aria-controls={open ? 'add-invites-menu' : undefined}
            aria-haspopup='true'
            aria-expanded={open ? 'true' : undefined}
            disableElevation
            onClick={handleAddClick}
            endIcon={<KeyboardArrowDownIcon />}
            disabled={!isAdmin}
          >
            Add
          </Button>
        </span>
      </Tooltip>
      <StyledMenu
        id='add-invites-menu'
        MenuListProps={{
          'aria-labelledby': 'add-invites-button'
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem onClick={onOpenInvitesClick} disableRipple dense>
          <AddIcon fontSize='small' />
          <Box>
            <ListItemText
              primary='Add a Private Link'
              secondary='Anyone with this link can join your space'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption', color: 'secondary' }}
            />
          </Box>
        </MenuItem>
        <MenuItem onClick={onOpenTokenGateClick} disableRipple dense disabled={!canCreateTokenGate}>
          <AddIcon fontSize='small' />
          <Box>
            <ListItemText
              primary='Add a Token Gate'
              secondary={
                hasReachedLimit
                  ? `You have reached the maximum number of token gates (${currentCount}/${maxCount}) for your subscription tier`
                  : 'Control access to your space with tokens & NFTS (Wallet Required)'
              }
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption', color: 'secondary' }}
            />
          </Box>
        </MenuItem>
      </StyledMenu>
    </>
  );
}

export default memo(InviteActions);
