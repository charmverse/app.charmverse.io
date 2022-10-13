import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { Box, ClickAwayListener, Collapse, IconButton, Menu, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';

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

const memberPropertiesLabel: Record<MemberPropertyType, string> = {
  text: 'Text',
  number: 'Number',
  phone: 'Phone',
  url: 'URL',
  email: 'Email',
  wallet: 'Wallet',
  select: 'Select',
  multiselect: 'Multi-select',
  role: 'Role',
  profile_pic: 'Profile pic',
  timezone: 'Timezone',
  wallet_address: 'Wallet address'
};

export default function MemberDirectoryPage () {
  const { members } = useMembers();
  const { properties, addProperty } = useMemberProperties();
  const [currentView, setCurrentView] = useState<typeof views[number]>('table');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const [selectedPropertyType, setSelectedPropertyType] = useState<null | MemberPropertyType>(null);
  const [propertyName, setPropertyName] = useState('');
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
                          return (
                            <TableCell key={property.id}>
                              {memberProperty.value}
                            </TableCell>
                          );
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
              <Button
                variant='text'
                size='small'
                color='secondary'
                startIcon={<AddIcon />}
                onClick={addMemberPropertyPopupState.open}
              >
                Add Property
              </Button>
              {properties.map(property => (
                <Box>
                  {property.name}
                </Box>
              ))}
            </StyledSidebar>
          </Collapse>
        </ClickAwayListener>
      </Box>
      <Menu
        {...bindMenu(addMemberPropertyPopupState)}
        sx={{
          width: '100%'
        }}
      >
        {Object.entries(memberPropertiesLabel).map(([memberPropertyValue, memberPropertyLabel]) => (
          <MenuItem
            key={memberPropertyLabel}
            onClick={() => {
              setSelectedPropertyType(memberPropertyValue as MemberPropertyType);
              setPropertyName(memberPropertyLabel);
              addMemberPropertyPopupState.close();
              propertyNamePopupState.open();
            }}
          >
            <Typography textTransform='capitalize'>{memberPropertyLabel}</Typography>
          </MenuItem>
        ))}
      </Menu>
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
    </CenteredPageContent>
  ) : null;
}
