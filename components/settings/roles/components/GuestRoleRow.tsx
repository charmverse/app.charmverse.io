import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DoneIcon from '@mui/icons-material/Done';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Accordion, AccordionSummary, AccordionDetails, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { bindMenu, bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Button from 'components/common/Button';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { spaceOperationLabels } from 'lib/permissions/spaces/client';
import type { ListSpaceRolesResponse } from 'pages/api/roles';
import GuildXYZIcon from 'public/images/guild_logo.svg';

import RoleForm from './RoleForm';
import RoleMemberRow from './RoleMemberRow';
import SpacePermissions from './SpacePermissions';

interface RoleRowProps {
  isEditable: boolean;
  removeGuest: (userId: string) => void;
}

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export function GuestRoleRow({ isEditable, removeGuest }: RoleRowProps) {
  const menuState = usePopupState({ variant: 'popover', popupId: `role-guests` });
  const userPopupState = usePopupState({ variant: 'popover', popupId: `role-guest-users` });
  const confirmDeletePopupState = usePopupState({ variant: 'popover', popupId: 'role-delete' });
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const { members, guests } = useMembers();

  return (
    <Box mb={3}>
      <Accordion style={{ boxShadow: 'none' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
            <Box display='flex' justifyContent='space-between'>
              <Tooltip
                placement='top'
                arrow
                title='Guests only have access to pages you have individually shared with them'
              >
                <Typography variant='h6' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  Guests
                  {guests.length > 0 && <Chip size='small' label={guests.length} />}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>
        <Divider />
        <Box>
          <div
            key='view-content'
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              flexDirection: 'row'
            }}
          >
            <DoneIcon sx={{ fontSize: '18px', mr: 0.5 }} />
            <Typography variant='caption'>Interact with individual pages</Typography>
          </div>
        </Box>

        <AccordionDetails>
          <ScrollableBox rows={guests.length}>
            {guests.map((guest) => (
              <RoleMemberRow
                key={guest.id}
                member={guest}
                isEditable={isEditable}
                onRemove={(userId) => {
                  removeGuest(userId);
                }}
              />
            ))}
          </ScrollableBox>
        </AccordionDetails>
      </Accordion>
      <Box px={2} pb={1}>
        <Typography variant='caption'>To add a guest, share a page with them via email</Typography>
      </Box>
    </Box>
  );
}
