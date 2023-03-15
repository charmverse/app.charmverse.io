import styled from '@emotion/styled';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import { useMembers } from 'hooks/useMembers';

import RoleMemberRow from './RoleMemberRow';

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
