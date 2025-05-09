import type { MemberProperty } from '@charmverse/core/prisma';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { Box, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { SelectOptionsList } from 'components/common/form/fields/Select/SelectOptionsList';
import { isSelectType } from 'components/common/form/fields/utils';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { MemberPropertySidebarDetails } from 'components/members/components/MemberDirectorySidebar/MemberPropertySidebarDetails';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { MEMBER_PROPERTY_CONFIG, PREMIUM_MEMBER_PROPERTIES } from '@packages/lib/members/constants';
import type { MemberPropertyWithPermissions } from '@packages/lib/members/interfaces';
import { isReturnKey, mergeRefs } from '@packages/lib/utils/react';

import { MemberPropertyItem } from './MemberPropertyItem';

function MemberPropertyItemForm({ property, close }: { property: MemberProperty; close: VoidFunction }) {
  const { updateProperty } = useMemberProperties();
  const [propertyName, setPropertyName] = useState('');
  const [propertyOptions, setPropertyOptions] = useState<SelectOptionType[]>(
    (property?.options as SelectOptionType[]) ?? []
  );

  useEffect(() => {
    setPropertyName(property.name);
  }, []);

  const isSelectPropertyType = isSelectType(property.type);

  const isDisabled =
    propertyName.length === 0 ||
    (isSelectPropertyType && (property.options as SelectOptionType[])?.find((po) => po.name.length === 0));

  async function onSubmit() {
    if (!isDisabled) {
      await updateProperty({
        name: propertyName,
        id: property.id,
        options: propertyOptions
      });
      setPropertyName('');
      close();
    }
  }
  return (
    <Stack gap={2}>
      <Stack>
        <FieldLabel>Name</FieldLabel>
        <TextField
          error={!propertyName}
          value={propertyName}
          onChange={(e) => {
            setPropertyName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (isReturnKey(e)) {
              onSubmit();
            }
          }}
          autoFocus
        />
      </Stack>

      {isSelectPropertyType && <SelectOptionsList options={propertyOptions} onChange={setPropertyOptions} />}

      <Button
        disabled={isDisabled}
        onClick={onSubmit}
        sx={{
          width: 'fit-content'
        }}
      >
        Update property
      </Button>
    </Stack>
  );
}

export function MemberPropertySidebarItem({ property }: { property: MemberPropertyWithPermissions }) {
  const ref = useRef<HTMLDivElement>(null);

  const [toggled, setToggled] = useState(false);
  const { updateProperty, deleteProperty, addPropertyPermissions, removePropertyPermission } = useMemberProperties();
  const propertyRenamePopupState = usePopupState({ variant: 'popover', popupId: 'property-rename-modal' });
  const admin = useIsAdmin();
  const { isFreeSpace } = useIsFreeSpace();

  const hidePremiumPropertyDetails = isFreeSpace && PREMIUM_MEMBER_PROPERTIES.includes(property.type);

  const [{ offset }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item: property,
    collect(monitor) {
      return {
        offset: monitor.getDifferenceFromInitialOffset()
      };
    }
  }));

  const [{ canDrop, isOverCurrent }, drop] = useDrop<
    MemberPropertyWithPermissions,
    any,
    { canDrop: boolean; isOverCurrent: boolean }
  >(
    () => ({
      accept: 'item',
      drop: async (droppedProperty, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) {
          return;
        }
        await updateProperty({
          id: droppedProperty.id,
          index: property.index
        });
      },
      collect: (monitor) => {
        let canDropItem: boolean = true;
        // We use this to bypass the thrown error: Invariant Violation: Expected to find a valid target.
        // If there is an error thrown, set canDrop to false.
        try {
          canDropItem = monitor.canDrop();
        } catch {
          canDropItem = false;
        }
        return {
          isOverCurrent: monitor.isOver({ shallow: true }),
          canDrop: canDropItem
        };
      }
    }),
    [property]
  );

  const updateToggle = !hidePremiumPropertyDetails ? () => setToggled(!toggled) : undefined;

  const deleteConfirmation = usePopupState({ variant: 'popover', popupId: 'delete-confirmation' });
  const isAdjacentActive = admin && canDrop && isOverCurrent;
  return (
    <Stack height='fit-content' ref={admin ? mergeRefs([ref, drag, drop, dragPreview]) : null}>
      <MenuItem
        dense
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          '&:hover .icons': {
            opacity: 1
          },
          width: '100%',
          '& .MuiListItemIcon-root': {
            minWidth: 30
          },
          pl: 1,
          ...((offset?.y ?? 0) < 0
            ? {
                borderTopColor: isAdjacentActive ? 'action.focus' : 'background.paper',
                borderTopWidth: 2,
                borderTopStyle: 'solid'
              }
            : {
                borderBottomColor: isAdjacentActive ? 'action.focus' : 'background.paper',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid'
              })
        }}
        onClick={updateToggle}
      >
        <ArrowRightIcon
          onClick={updateToggle}
          sx={{
            transform: toggled ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease-in-out'
          }}
        />
        <MemberPropertyItem type={property.type} name={property.name} />
        {!hidePremiumPropertyDetails && (
          <Box
            display='flex'
            gap={0.5}
            className='icons'
            sx={{
              opacity: 0,
              alignItems: 'center'
            }}
          >
            <Tooltip title={`Edit ${property.name} property.`} disableInteractive>
              <EditIcon
                cursor='pointer'
                fontSize='small'
                color='secondary'
                onClick={(e) => {
                  e.stopPropagation();
                  propertyRenamePopupState.open();
                }}
              />
            </Tooltip>
            {!MEMBER_PROPERTY_CONFIG[property.type]?.default && (
              <Tooltip title={`Delete ${property.name} property.`} disableInteractive>
                <DeleteOutlinedIcon
                  cursor='pointer'
                  fontSize='small'
                  color='secondary'
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConfirmation.open();
                  }}
                />
              </Tooltip>
            )}
            <ConfirmDeleteModal
              title='Delete property'
              question='Are you sure you want to delete this property?'
              onConfirm={() => {
                deleteProperty(property.id);
              }}
              onClose={deleteConfirmation.close}
              open={deleteConfirmation.isOpen}
            />
          </Box>
        )}
      </MenuItem>
      {!hidePremiumPropertyDetails && (
        <MemberPropertySidebarDetails
          isExpanded={toggled}
          updateProperty={updateProperty}
          property={property}
          addPermissions={addPropertyPermissions}
          removePermission={removePropertyPermission}
        />
      )}

      <Modal
        size='large'
        open={propertyRenamePopupState.isOpen}
        onClose={propertyRenamePopupState.close}
        title={`Update ${property.name}`}
      >
        <MemberPropertyItemForm close={propertyRenamePopupState.close} property={property} />
      </Modal>
    </Stack>
  );
}
