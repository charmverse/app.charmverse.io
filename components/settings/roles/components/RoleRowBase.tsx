import styled from '@emotion/styled';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/LockOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Member } from 'lib/members/interfaces';

import { UserRow } from './UserRow';

type RoleRowProps = {
  readOnlyMembers?: boolean;
  title: string;
  description?: string | ReactNode;
  members: Member[];
  removeMember: (userId: string) => void;
  addMemberButton?: ReactNode;
  permissions?: ReactNode;
  roleActions?: ReactNode;
};

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export function RoleRowBase({
  description,
  roleActions,
  readOnlyMembers,
  title,
  permissions,
  removeMember,
  addMemberButton,
  members
}: RoleRowProps) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <>
      <Divider />
      <Paper sx={{ my: 1 }}>
        <Accordion style={{ boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='h6' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {title}
                  <Chip size='small' label={members.length} />
                </Typography>
              </Box>
              <div onClick={(e) => e.stopPropagation()}>{roleActions}</div>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 0 }}>
            <Tabs value={value} onChange={handleChange}>
              <Tab label='Permissions' />
              <Tab label='Users' />
            </Tabs>
            <TabPanel value={value} index={0}>
              {description && (
                <Box mb={2} display='flex' gap={1} alignItems='center'>
                  <LockIcon />
                  <Typography variant='caption'>{description}</Typography>
                </Box>
              )}
              {permissions}
            </TabPanel>
            <TabPanel value={value} index={1}>
              <ScrollableBox rows={members.length}>
                {members.map((member) => (
                  <UserRow key={member.id} member={member} readOnly={readOnlyMembers} onRemove={removeMember} />
                ))}
              </ScrollableBox>
              {members.length === 0 && (
                <Typography variant='caption' color='textSecondary'>
                  No users
                </Typography>
              )}
              {addMemberButton}
            </TabPanel>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
}

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box py={2}>{children}</Box>}
    </div>
  );
}
