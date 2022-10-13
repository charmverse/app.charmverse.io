import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Chip, ClickAwayListener, Collapse, IconButton, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { DEFAULT_MEMBER_PROPERTIES, MemberPropertyTypesLabel } from 'lib/members/utils';

import { AddMemberPropertyButton } from './AddMemberPropertyButton';
import { MemberPropertyItem } from './MemberPropertyItem';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

const views = ['table', 'gallery'] as const;

export default function MemberDirectoryPage () {
  const { members } = useMembers();
  const { properties, addProperty, deleteProperty, updateProperty } = useMemberProperties();
  const [currentView, setCurrentView] = useState<typeof views[number]>('table');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const propertyRenamePopupState = usePopupState({ variant: 'popover', popupId: 'property-rename-modal' });
  const [selectedPropertyType, setSelectedPropertyType] = useState<null | MemberPropertyType>(null);
  const [propertyName, setPropertyName] = useState('');
  const [editedPropertyId, setEditedPropertyId] = useState<string | null>(null);
  return properties && members ? (
    <CenteredPageContent>
      <Typography variant='h1' my={2}>Member Directory</Typography>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Tabs textColor='primary' indicatorColor='secondary' value={currentView} sx={{ minHeight: 0, mb: '-4px' }}>
          {views.map(view => (
            <Tab
              component='div'
              disableRipple
              key={view}
              label={(
                <StyledButton
                  startIcon={iconForViewType(view)}
                  onClick={() => {
                    setCurrentView(view);
                  }}
                  variant='text'
                  size='small'
                  color={currentView === view ? 'textPrimary' : 'secondary'}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </StyledButton>
              )}
              sx={{ p: 0, mb: '5px' }}
              value={view}
            />
          ))}
        </Tabs>
        <IconButton onClick={() => setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible)}>
          <MoreHoriz color='secondary' />
        </IconButton>
      </Stack>
      <Box position='relative' display='flex' minHeight={500} height='100%'>
        <Box width='100%'>
          {currentView === 'table' && (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {properties.map(property => <StyledTableCell key={property.name}>{property.name}</StyledTableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map(member => {
                  return (
                    <TableRow key={member.id}>
                      {properties.map(property => {
                        const memberProperty = member.properties.find(_property => _property.id === property.id);
                        if (memberProperty) {
                          switch (memberProperty.type) {
                            case 'role': {
                              return (
                                <TableCell key={property.id}>
                                  {member.roles.map(role => <Chip size='small' label={role.name} variant='outlined' />)}
                                </TableCell>
                              );
                            }
                            default: {
                              return (
                                <TableCell key={property.id}>
                                  {memberProperty.value}
                                </TableCell>
                              );
                            }
                          }
                        }
                        return null;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
        <ClickAwayListener mouseEvent={false} onClickAway={() => setIsPropertiesDrawerVisible(false)}>
          <Collapse in={isPropertiesDrawerVisible} orientation='horizontal' sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
            <StyledSidebar>
              <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
                <Typography fontWeight='bold' variant='body2'>Properties</Typography>
              </Box>

              <Stack gap={1.5} p={1}>
                {properties.map(property => (
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    sx={{
                      '&:hover .icons': {
                        opacity: 1
                      }
                    }}
                    alignItems='center'
                  >
                    <MemberPropertyItem
                      type={property.type}
                      name={property.name}
                    />
                    <Box
                      display='flex'
                      gap={0.5}
                      className='icons'
                      sx={{
                        opacity: 0
                      }}
                    >
                      <EditIcon
                        cursor='pointer'
                        fontSize='small'
                        color='secondary'
                        onClick={() => {
                          propertyRenamePopupState.open();
                          setPropertyName(property.name);
                          setEditedPropertyId(property.id);
                        }}
                      />
                      {!DEFAULT_MEMBER_PROPERTIES.includes(property.type as any) && (
                        <DeleteIcon
                          cursor='pointer'
                          fontSize='small'
                          color='secondary'
                          onClick={() => {
                            deleteProperty(property.id);
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
              <AddMemberPropertyButton
                onClick={(memberPropertyType) => {
                  setSelectedPropertyType(memberPropertyType as MemberPropertyType);
                  setPropertyName(MemberPropertyTypesLabel[memberPropertyType]);
                  propertyNamePopupState.open();
                }}
              />
            </StyledSidebar>
          </Collapse>
        </ClickAwayListener>
      </Box>
      <Modal size='large' open={propertyNamePopupState.isOpen} onClose={propertyNamePopupState.close} title='Name your property'>
        <Box>
          <TextField
            error={!propertyName || !selectedPropertyType}
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
          />
          <Button
            disabled={!propertyName || !selectedPropertyType}
            onClick={async () => {
              if (propertyName && selectedPropertyType) {
                await addProperty({
                  index: properties.length,
                  name: propertyName,
                  options: null,
                  type: selectedPropertyType
                });
                setPropertyName('');
                propertyNamePopupState.close();
              }
            }}
          >Add
          </Button>
        </Box>
      </Modal>

      <Modal size='large' open={propertyRenamePopupState.isOpen} onClose={propertyRenamePopupState.close} title='Rename property'>
        <Box>
          <TextField
            error={!propertyName || !editedPropertyId}
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
          />
          <Button
            disabled={!propertyName || !editedPropertyId}
            onClick={async () => {
              if (propertyName && editedPropertyId) {
                await updateProperty({
                  index: properties.length,
                  name: propertyName,
                  id: editedPropertyId
                });
                setPropertyName('');
                propertyRenamePopupState.close();
                setEditedPropertyId(null);
              }
            }}
          >Rename
          </Button>
        </Box>
      </Modal>
    </CenteredPageContent>
  ) : null;
}
