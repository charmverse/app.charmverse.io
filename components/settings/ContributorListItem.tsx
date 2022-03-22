
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import CheckIcon from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import Avatar from 'components/common/Avatar';
import { Contributor } from 'models';
import getDisplayName from 'lib/users/getDisplayName';
import useENSName from 'hooks/useENSName';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function StyledListItemText (props: any) {
  return (
    <ListItemText
      primaryTypographyProps={{
        fontWeight: 500
      }}
      secondaryTypographyProps={{
        sx: { whiteSpace: 'normal' }
      }}
      {...props}
    />
  );
}

const roleActions = ['makeAdmin', 'makeContributor', 'removeFromSpace'] as const;
export type RoleAction = typeof roleActions[number];

interface Props {
  contributor: Contributor;
  isAdmin?: boolean;
  isSpaceOwner?: boolean;
  onChange: (action: RoleAction, contributor: Contributor) => void;
}

export default function ContributorRow ({ isAdmin, isSpaceOwner, contributor, onChange }: Props) {
  const ensName = useENSName(contributor.addresses[0]);
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });

  function handleMenuItemClick (action: RoleAction) {
    onChange(action, contributor);
    popupState.close();
  }

  const actions = roleActions.filter(action => {
    switch (action) {
      case 'makeAdmin':
        return isAdmin;
      case 'makeContributor':
        return isAdmin;
      case 'removeFromSpace': {
        return isAdmin && !isSpaceOwner;
      }
      default:
        return false;
    }
  });

  const activeRoleAction = (contributor.role === 'admin') ? 'makeAdmin' : 'makeContributor';

  return (
    <StyledRow pb={2} mb={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={ensName || getDisplayName(contributor)} avatar={contributor?.avatar} />
        <Box pl={2}>
          <Typography variant='body1'><strong>{ensName || getDisplayName(contributor)}</strong></Typography>
          {ensName && <Typography variant='body2'>{getDisplayName(contributor)}</Typography>}
        </Box>
      </Box>
      <Box sx={{ width: 150 }}>
        {actions.length > 0 ? (
          <>
            <Button
              color='secondary'
              size='small'
              variant='outlined'
              {...bindTrigger(popupState)}
              endIcon={<KeyboardArrowDownIcon fontSize='small' />}
            >
              {contributor.role}
            </Button>
            {/* <Typography color='secondary' variant='body2' sx={{ px: 3 }} {...bindTrigger(popupState)}>
            {contributor.role}
          </Typography> */}
            <Menu
              {...bindMenu(popupState)}
              PaperProps={{
                sx: { width: 300 }
              }}
            >
              {actions.map((action) => (
                <MenuItem
                  key={action}
                // selected={index === selectedIndex}
                  onClick={(event) => handleMenuItemClick(action)}
                >
                  {action === 'makeAdmin' && (
                  <StyledListItemText
                    primary='Admin'
                    secondary='Can access all settings and invite new members to the workspace'
                  />
                  )}
                  {action === 'makeContributor' && (
                  <StyledListItemText
                    primary='Contributor'
                    secondary='Cannot change workspace settings or invite new members to the workspace'
                  />
                  )}
                  {action === 'removeFromSpace' && (
                  <StyledListItemText
                    primaryTypographyProps={{ fontWeight: 500, color: 'error' }}
                    primary='Remove from team'
                  />
                  )}
                  {action === activeRoleAction && (
                  <ListItemIcon>
                    <CheckIcon fontSize='small' />
                  </ListItemIcon>
                  )}
                </MenuItem>
              ))}
            </Menu>
          </>
        )
          : (
            <Typography color='secondary'>
              {contributor.role}
            </Typography>
          )}
      </Box>
    </StyledRow>
  );
}
