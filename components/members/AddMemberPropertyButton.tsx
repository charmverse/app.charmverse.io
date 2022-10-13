import AddIcon from '@mui/icons-material/Add';
import { Button, Menu, MenuItem } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';

import { DEFAULT_MEMBER_PROPERTIES, MemberPropertyTypesLabel } from 'lib/members/utils';

import { MemberPropertyItem } from './MemberPropertyItem';

export function AddMemberPropertyButton ({
  onClick
}: {
  onClick: (memberPropertyType: MemberPropertyType) => void;
}) {
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });

  return (
    <>
      <Button
        variant='text'
        size='small'
        color='secondary'
        startIcon={<AddIcon />}
        onClick={addMemberPropertyPopupState.open}
      >
        Add Property
      </Button>
      <Menu
        {...bindMenu(addMemberPropertyPopupState)}
        sx={{
          width: '100%'
        }}
      >
        {Object.keys(MemberPropertyTypesLabel).map((memberPropertyType) => (
          !DEFAULT_MEMBER_PROPERTIES.includes(memberPropertyType as any) && (
            <MenuItem
              key={memberPropertyType}
              onClick={() => {
                onClick(memberPropertyType as MemberPropertyType);
                addMemberPropertyPopupState.close();
              }}
              sx={{
                gap: 1
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
