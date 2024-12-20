import type { MemberPropertyType } from '@charmverse/core/prisma';
import AddIcon from '@mui/icons-material/Add';
import { Button, Menu, MenuItem, Stack, TextField } from '@mui/material';
import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';

import { SelectOptionsList } from 'components/common/form/fields/Select/SelectOptionsList';
import { isSelectType } from 'components/common/form/fields/utils';
import Modal from 'components/common/Modal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';
import { isReturnKey } from 'lib/utils/react';

import { MemberPropertyItem } from './MemberPropertyItem';

export function AddMemberPropertyButton() {
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });
  const admin = useIsAdmin();
  const { mutateMembers } = useMembers();
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const [selectedPropertyType, setSelectedPropertyType] = useState<null | MemberPropertyType>(null);
  const [propertyName, setPropertyName] = useState('');
  const { properties, addProperty } = useMemberProperties();

  const [propertyOptions, setPropertyOptions] = useState<SelectOptionType[]>([]);
  useEffect(() => {
    if (!propertyNamePopupState.isOpen) {
      setPropertyName('');
      setPropertyOptions([]);
    }
  }, [propertyNamePopupState.isOpen]);

  async function onSubmit() {
    if (propertyName && selectedPropertyType) {
      await addProperty({
        index: properties?.length ?? 0,
        name: propertyName,
        options: propertyOptions,
        type: selectedPropertyType
      });

      mutateMembers();
      propertyNamePopupState.close();
    }
  }

  const configurableProperties = useMemo(
    () =>
      Object.entries(MEMBER_PROPERTY_CONFIG).filter(([propertyType, propertyConfig]) => {
        if (propertyConfig.default) {
          return false;
        }
        // Read-only properties can only have one instance, join_date is an example
        if (propertyConfig.readonly && properties?.some((property) => property.type === propertyType)) {
          return false;
        }

        return true;
      }),
    [properties]
  );

  return (
    <>
      <Button
        variant='text'
        size='small'
        color='secondary'
        startIcon={<AddIcon />}
        sx={{
          py: 1,
          px: 2,
          justifyContent: 'flex-start'
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
        {configurableProperties.map(([propertyType]) => (
          <MenuItem
            key={propertyType}
            onClick={() => {
              setSelectedPropertyType(propertyType as MemberPropertyType);
              propertyNamePopupState.open();
              addMemberPropertyPopupState.close();
            }}
          >
            <MemberPropertyItem type={propertyType as MemberPropertyType} />
          </MenuItem>
        ))}
      </Menu>
      <Modal
        size='large'
        open={propertyNamePopupState.isOpen}
        onClose={propertyNamePopupState.close}
        title='Name your property'
      >
        <Stack gap={1}>
          <TextField
            fullWidth
            error={!propertyName || !selectedPropertyType}
            value={propertyName}
            placeholder='Name'
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
            sx={{
              flexGrow: 1
            }}
            onKeyDown={(e) => {
              if (isReturnKey(e)) {
                onSubmit();
              }
            }}
          />
          {isSelectType(selectedPropertyType) && (
            <SelectOptionsList options={propertyOptions} onChange={setPropertyOptions} />
          )}
          <Button
            onMouseDown={(e) => e.preventDefault()}
            disabled={!propertyName || !selectedPropertyType}
            sx={{
              width: 'fit-content'
            }}
            onClick={onSubmit}
          >
            Add property
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
