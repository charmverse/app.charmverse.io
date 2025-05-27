import { log } from '@charmverse/core/log';
import { styled } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/LockOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  SvgIcon,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import Modal from 'components/common/Modal';
import type { Props as UpgradeProps } from 'components/settings/subscription/UpgradeWrapper';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Member } from '@packages/lib/members/interfaces';

import { MemberRow } from './MemberRow';

type RoleRowProps = {
  readOnlyMembers?: boolean;
  title: string;
  description?: string | ReactNode;
  members: Member[];
  eligibleMembers: Member[];
  onAddMembers?: (memberIds: string[]) => Promise<void>;
  permissions?: ReactNode;
  roleActions?: ReactNode;
  memberRoleId?: string;
  upgradeProps?: UpgradeProps;
  descriptionIcon?: any;
};

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export function RoleRowBase({
  description,
  roleActions,
  eligibleMembers,
  memberRoleId,
  readOnlyMembers,
  title,
  permissions,
  onAddMembers,
  members,
  upgradeProps,
  descriptionIcon
}: RoleRowProps) {
  const [openTab, setOpenTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setOpenTab(newValue);
  };

  return (
    <Paper sx={{ my: 2 }}>
      <Accordion style={{ boxShadow: 'none' }} data-test={`role-row-${title}`}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='h6' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {title}
                <Chip size='small' label={members.length} />
                {descriptionIcon && (
                  <Tooltip title={description}>
                    <SvgIcon sx={{ height: 20 }} component={descriptionIcon} inheritViewBox />
                  </Tooltip>
                )}
                {upgradeProps?.upgradeContext && (
                  <UpgradeChip upgradeContext={upgradeProps.upgradeContext} onClick={upgradeProps.onClick} />
                )}
              </Typography>
            </Box>
            <div onClick={(e) => e.stopPropagation()}>{roleActions}</div>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ py: 0 }}>
          <Tabs value={openTab} onChange={handleChange}>
            <Tab label='Users' />
            <Tab label='Permissions' data-test='role-settings-permissions-tab' />
          </Tabs>
          <TabPanel value={openTab} index={0}>
            <ScrollableBox rows={members.length}>
              {members.map((member) => (
                <MemberRow key={member.id} member={member} readOnly={!!readOnlyMembers} memberRoleId={memberRoleId} />
              ))}
            </ScrollableBox>
            {members.length === 0 && (
              <Typography variant='caption' color='textSecondary'>
                No users
              </Typography>
            )}
            {onAddMembers && (
              <AddMembersButton eligibleMemberIds={eligibleMembers.map((m) => m.id)} onAddMembers={onAddMembers} />
            )}
          </TabPanel>
          <TabPanel value={openTab} index={1}>
            {description && (
              <Box mb={2} display='flex' gap={1} alignItems='center'>
                <LockIcon />
                <Typography variant='caption'>{description}</Typography>
              </Box>
            )}
            {description && permissions && <Divider sx={{ mb: 2 }} />}
            {permissions}
          </TabPanel>
        </AccordionDetails>
      </Accordion>
    </Paper>
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

type ButtonProps = {
  onAddMembers: (memberIds: string[]) => Promise<void>;
  eligibleMemberIds: string[];
};

function AddMembersButton({ onAddMembers, eligibleMemberIds }: ButtonProps) {
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const { showMessage } = useSnackbar();

  const userPopupState = usePopupState({ variant: 'popover', popupId: `add-members-input` });
  function showMembersPopup() {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers(ids: string[]) {
    setNewMembers(ids);
  }
  async function addMembers() {
    try {
      await onAddMembers(newMembers);
    } catch (error) {
      log.warn('Error adding member to role', { error });
      showMessage((error as Error).message || 'Something went wrong', 'error');
    }
    userPopupState.close();
  }

  return (
    <Box mt={2}>
      <Button onClick={showMembersPopup} variant='text' color='secondary'>
        + Add members
      </Button>
      <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
        {eligibleMemberIds.length === 0 ? (
          <Typography variant='body2'>All eligible members have been added to this role</Typography>
        ) : (
          <Grid container direction='column' spacing={3}>
            <Grid item>
              <InputSearchMemberMultiple
                filter={{ mode: 'include', userIds: eligibleMemberIds }}
                onChange={onChangeNewMembers}
              />
            </Grid>
            <Grid item>
              <Button disabled={newMembers.length === 0} onClick={addMembers}>
                Add
              </Button>
            </Grid>
          </Grid>
        )}
      </Modal>
    </Box>
  );
}
