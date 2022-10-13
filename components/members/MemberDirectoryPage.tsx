import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import EditIcon from '@mui/icons-material/Edit';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NumbersIcon from '@mui/icons-material/Numbers';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Chip, ClickAwayListener, Collapse, IconButton, Menu, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import type { MemberPropertyType, Role } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { DEFAULT_MEMBER_PROPERTIES } from 'lib/members/utils';
import DiscordIcon from 'public/images/discord_logo.svg';

const memberPropertiesRecord: Record<MemberPropertyType, {
  label: string;
  icon: ReactNode;
}> = {
  text: {
    label: 'Text',
    icon: <SubjectIcon fontSize='small' />
  },
  number: {
    label: 'Number',
    icon: <NumbersIcon fontSize='small' />
  },
  phone: {
    label: 'Phone',
    icon: <PhoneIcon fontSize='small' />
  },
  url: {
    label: 'URL',
    icon: <LinkIcon fontSize='small' />
  },
  email: {
    label: 'Email',
    icon: <AlternateEmailIcon fontSize='small' />
  },
  wallet_address: {
    label: 'Wallet',
    icon: <AccountBalanceWalletIcon fontSize='small' />
  },
  select: {
    label: 'Select',
    icon: <FormatListBulletedIcon fontSize='small' />
  },
  multiselect: {
    label: 'Multi-select',
    icon: <ListIcon fontSize='small' />
  },
  role: {
    label: 'Role',
    icon: <MilitaryTechIcon fontSize='small' />
  },
  profile_pic: {
    label: 'Profile pic',
    icon: <InsertPhotoIcon fontSize='small' />
  },
  timezone: {
    label: 'Timezone',
    icon: <AccessTimeIcon fontSize='small' />
  },
  discord: {
    label: 'Discord',
    icon: <DiscordIcon width={18.5} height={18.5} />
  },
  twitter: {
    label: 'Twitter',
    icon: <TwitterIcon fontSize='small' />
  },
  name: {
    label: 'Name',
    icon: <DriveFileRenameOutlineIcon fontSize='small' />
  }
};

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
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const propertyRenamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
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
                                  {(memberProperty.value as Role[]).map(role => <Chip size='small' label={role.name} variant='outlined' />)}
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
                    <Box display='flex' gap={0.5} alignItems='center'>
                      {memberPropertiesRecord[property.type].icon}
                      <Typography variant='body2'>{property.name}</Typography>
                    </Box>
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
              <Button
                variant='text'
                size='small'
                color='secondary'
                startIcon={<AddIcon />}
                onClick={addMemberPropertyPopupState.open}
              >
                Add Property
              </Button>
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
        {Object.entries(memberPropertiesRecord).map(([memberPropertyValue, { icon, label }]) => (
          <MenuItem
            key={label}
            onClick={() => {
              setSelectedPropertyType(memberPropertyValue as MemberPropertyType);
              setPropertyName(label);
              addMemberPropertyPopupState.close();
              propertyNamePopupState.open();
            }}
            sx={{
              gap: 1
            }}
          >
            {icon}
            <Typography>{label}</Typography>
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
