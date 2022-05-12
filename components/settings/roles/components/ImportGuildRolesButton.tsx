import { MouseEventHandler, useEffect, useMemo, useState } from 'react';
import { ScrollableModal } from 'components/common/Modal';
import { guild, user } from '@guildxyz/sdk';
import { Avatar, Box, Button, Checkbox, ListItem, ListItemIcon, ListItemText, MenuItem, SvgIcon, Typography } from '@mui/material';
import Link from 'components/common/Link';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { mutate } from 'swr';
import { useUser } from 'hooks/useUser';
import { FixedSizeList } from 'react-window';
import GuildXYZIcon from 'public/images/guild_logo.svg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useSnackbar } from 'hooks/useSnackbar';
import { PimpedButton, StyledSpinner } from '../../../common/Button';

interface Props {
  onDownArrowClicked: MouseEventHandler<SVGSVGElement>
}

export default function ImportGuildRolesButton ({ onDownArrowClicked } : Props) {
  const [showImportedRolesModal, setShowImportedRolesModal] = useState(false);
  const [guilds, setGuilds] = useState<{id: number, name: string, urlName: string, roles: any[], imageUrl: string}[]>([]);
  const [fetchingGuilds, setFetchingGuilds] = useState(false);
  const [importingRoles, setImportingRoles] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<number[]>([]);
  const [space] = useCurrentSpace();
  const selectedGuildIdsSet = useMemo(() => new Set(selectedGuildIds), [selectedGuildIds]);
  const [currentUser] = useUser();
  const addresses = currentUser?.addresses ?? [];
  const { showMessage } = useSnackbar();

  useEffect(() => {
    async function main () {
      if (showImportedRolesModal) {
        setFetchingGuilds(true);
        const guildMembershipsResponses = await Promise.all(addresses.map(address => user.getMemberships(address)));
        const guildIds: number[] = [];

        guildMembershipsResponses.forEach(guildMembershipsResponse => {
          if (guildMembershipsResponse) {
            guildIds.push(...guildMembershipsResponse.map(guildMembership => guildMembership.guildId));
          }
        });
        const fetchedGuilds = await Promise.all(guildIds?.map(guildId => guild.get(guildId)));

        setGuilds(fetchedGuilds);
        setSelectedGuildIds(fetchedGuilds.map(fetchedGuild => fetchedGuild.id));
        // const allGuilds = await guild.getAll();
        // setGuilds(allGuilds);
        setFetchingGuilds(false);
      }
    }
    main();
  }, [showImportedRolesModal]);

  function resetState () {
    setShowImportedRolesModal(false);
    setImportingRoles(false);
    setFetchingGuilds(false);
    setSelectedGuildIds([]);
    setGuilds([]);
  }

  async function importRoles () {
    if (space) {
      setImportingRoles(true);
      const { importedRolesCount } = await charmClient.importRolesFromGuild({
        guildIds: selectedGuildIds,
        spaceId: space.id
      });
      resetState();
      showMessage(`Successfully imported and assigned ${importedRolesCount} roles from guild.xyz`);
      mutate(`roles/${space.id}`);
    }
  }

  return (
    <>
      <Button
        variant='outlined'
        endIcon={(
          <KeyboardArrowDownIcon onClick={onDownArrowClicked} />
        )}
        startIcon={(
          <SvgIcon sx={{ color: 'text.primary' }}>
            <GuildXYZIcon />
          </SvgIcon>
        )}
        onClick={() => setShowImportedRolesModal(true)}
      >Import roles
      </Button>
      <ScrollableModal size='large' title='Import Guild roles' onClose={resetState} open={showImportedRolesModal}>
        <Box sx={{
          px: 4,
          minHeight: 50
        }}
        >
          {
              fetchingGuilds ? <StyledSpinner /> : guilds.length === 0 ? <Typography variant='subtitle1' color='secondary'>You are not part of any guild(s)</Typography> : (
                <Box sx={{
                  paddingRight: 1
                }}
                >
                  <FixedSizeList
                    height={325}
                    width='100%'
                    itemSize={65}
                    itemCount={guilds.length}
                    overscanCount={5}
                  >
                    {({ index, style }) => {
                      const _guild = guilds[index];
                      return (
                        <ListItem
                          style={style}
                          key={_guild.id}
                          sx={{
                            display: 'flex',
                            pl: 0
                          }}
                        >
                          <Checkbox
                            disabled={importingRoles}
                            checked={selectedGuildIdsSet.has(_guild.id)}
                            onClick={(event) => {
                              if ((event.target as any).checked) {
                                setSelectedGuildIds([...selectedGuildIds, _guild.id]);
                              }
                              else {
                                setSelectedGuildIds(selectedGuildIds.filter(selectedGuildId => selectedGuildId !== _guild.id));
                              }
                            }}
                          />
                          <Box sx={{
                            width: '100%'
                          }}
                          >
                            <Link external target='_blank' href={`https://guild.xyz/${_guild.urlName}`}>
                              <MenuItem
                                component='div'
                                disabled={importingRoles}
                              >
                                <ListItemIcon sx={{ mr: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32 }} src={_guild.imageUrl?.startsWith('/') ? `https://guild.xyz${_guild.imageUrl}` : _guild.imageUrl} />
                                </ListItemIcon>
                                <ListItemText
                                  secondary={_guild.urlName}
                                  sx={{
                                    '& .MuiTypography-root': {
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      flexDirection: 'row'
                                    }
                                  }}
                                >
                                  {_guild.name}
                                  <Box display='flex'>
                                    <Typography variant='subtitle2' color='secondary'>
                                      {_guild.roles.length} Role(s)
                                    </Typography>
                                  </Box>
                                </ListItemText>
                              </MenuItem>
                            </Link>
                          </Box>
                        </ListItem>
                      );
                    }}
                  </FixedSizeList>
                  <PimpedButton
                    loading={importingRoles}
                    sx={{
                      mt: 2
                    }}
                    disabled={importingRoles}
                    onClick={importRoles}
                  >Import Roles
                  </PimpedButton>
                </Box>
              )
            }
        </Box>
      </ScrollableModal>
    </>
  );
}
