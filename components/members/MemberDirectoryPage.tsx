import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { Box, ClickAwayListener, Collapse, IconButton, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
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

export default function MemberDirectoryPage () {
  const { members } = useMembers();
  const { properties } = useMemberProperties();
  const [currentView, setCurrentView] = useState<typeof views[number]>('table');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
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
      <div className={`container-container ${isPropertiesDrawerVisible ? 'sidebar-visible' : ''}`}>
        <Box position='relative' display='flex'>
          <Box width='100%'>
            {currentView === 'table' && (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    {properties.map(property => <StyledTableCell>{property.name}</StyledTableCell>)}
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
      </div>
    </CenteredPageContent>
  ) : null;
}
