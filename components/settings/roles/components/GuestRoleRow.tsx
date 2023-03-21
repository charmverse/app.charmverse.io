import styled from '@emotion/styled';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import { RoleMemberRow } from './RoleMemberRow';

interface RoleRowProps {
  isEditable: boolean;
}

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export function GuestRoleRow({ isEditable }: RoleRowProps) {
  const { guests, removeGuest } = useMembers();

  const confirmDeletePopup = usePopupState({ variant: 'popover', popupId: 'confirm-delete' });

  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  async function deleteGuest() {
    if (memberToDelete) {
      await removeGuest(memberToDelete.id);
      setMemberToDelete(null);
    }
  }

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
                onRemove={() => {
                  setMemberToDelete(guest);
                  confirmDeletePopup.open();
                }}
              />
            ))}
          </ScrollableBox>
        </AccordionDetails>
      </Accordion>
      <Box px={2} pb={1}>
        <Typography variant='caption'>To add a guest, share a page with them via email</Typography>
      </Box>

      <ConfirmDeleteModal
        title='Remove guest'
        onClose={() => {
          confirmDeletePopup.close();
          setMemberToDelete(null);
        }}
        open={confirmDeletePopup.isOpen}
        buttonText='Remove guest'
        onConfirm={deleteGuest}
        question={`Are you sure you want to remove ${memberToDelete?.username} from space?`}
      />
    </Box>
  );
}
