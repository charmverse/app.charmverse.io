import AddIcon from '@mui/icons-material/Add';
import { Button, Menu, MenuItem } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';

import isAdmin from 'hooks/useIsAdmin';
import { DEFAULT_MEMBER_PROPERTIES, DefaultMemberPropertyDict } from 'lib/members/constants';

import { MemberPropertyItem } from './MemberPropertyItem';

export function AddMemberPropertyButton ({
  onClick
}: {
  onClick: (memberPropertyType: MemberPropertyType) => void;
}) {
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });
  const admin = isAdmin();

  return (
    <>
      <Button
        variant='text'
        size='small'
        color='secondary'
        startIcon={<AddIcon />}
        sx={{
          p: 1
        }}
        disabled={!admin}
        onClick={addMemberPropertyPopupState.open}
      >
        Add Property
      </Button>
      <Menu
        {...bindMenu(addMemberPropertyPopupState)}
        sx={{
          width: '100%',
          '& .MuiListItemIcon-root': {
            minWidth: 30
          }
        }}
      >
        {Object.keys(DefaultMemberPropertyDict).map((memberPropertyType) => (
          !DEFAULT_MEMBER_PROPERTIES.includes(memberPropertyType as any) && (
            <MenuItem
              key={memberPropertyType}
              onClick={() => {
                onClick(memberPropertyType as MemberPropertyType);
                addMemberPropertyPopupState.close();
              }}
            >
              <MemberPropertyItem
                type={memberPropertyType as MemberPropertyType}
              />
            </MenuItem>
          )
        ))}
      </Menu>
    </>
  );
}
