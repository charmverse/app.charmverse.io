import { useEffect, useMemo, useState } from 'react';
import { Modal } from 'components/common/Modal';
import { GetGuildsResponse, guild } from '@guildxyz/sdk';
import { Avatar, Box, Checkbox, List, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import Link from 'components/common/Link';
import Button, { StyledSpinner } from '../../../common/Button';

export default function ImportGuildRolesButton () {
  const [showImportedRolesModal, setShowImportedRolesModal] = useState(false);
  const [guilds, setGuilds] = useState<GetGuildsResponse>([]);
  const [fetchingGuilds, setFetchingGuilds] = useState(false);
  const [importingRoles, setImportingRoles] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<number[]>([]);

  const selectedGuildIdsSet = useMemo(() => new Set(selectedGuildIds), [selectedGuildIds]);
  useEffect(() => {
    async function main () {
      if (showImportedRolesModal) {
        setFetchingGuilds(true);
        // if (currentUser && currentUser?.addresses?.[0]) {
        // }
        const allGuilds = await guild.getAll();
        setGuilds(allGuilds.slice(0, 50));
        setFetchingGuilds(false);
      }
    }
    main();
  }, [showImportedRolesModal]);

  const isAllGuildSelected = selectedGuildIds.length === guilds.length;

  function resetState () {
    setShowImportedRolesModal(false);
    setSelectedGuildIds([]);
    setGuilds([]);
  }

  return (
    <>
      <div onClick={() => setShowImportedRolesModal(true)}>Import Roles</div>
      <Modal size='large' title='Import Guild roles' onClose={resetState} open={showImportedRolesModal}>
        {fetchingGuilds ? <StyledSpinner />
          : (
            <div>
              <Box display='flex' justifyContent='space-between'>
                <Box display='flex' alignItems='center'>
                  <Checkbox
                    checked={isAllGuildSelected}
                    onClick={() => {
                      if (isAllGuildSelected) {
                        setSelectedGuildIds([]);
                      }
                      else {
                        setSelectedGuildIds(guilds.map(_guild => _guild.id));
                      }
                    }}
                  />
                  <Typography sx={{
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}
                  >Select All
                  </Typography>
                </Box>
                <Typography color='secondary' variant='subtitle1'>{selectedGuildIds.length} / {guilds.length}</Typography>
              </Box>
              <Box sx={{
                maxHeight: 325,
                overflow: 'auto',
                paddingRight: 1
              }}
              >
                {guilds.map(_guild => (
                  <List
                    key={_guild.id}
                    sx={{
                      display: 'flex'
                    }}
                  >
                    <Checkbox
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
                          disabled={importingRoles}
                        >
                          <ListItemIcon sx={{ mr: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }} src={_guild.imageUrl} />
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
                            <Box display='flex' gap={1}>
                              <Typography variant='subtitle2' color='secondary'>
                                {_guild.memberCount} Member(s)
                              </Typography>
                              <Typography variant='subtitle2' color='secondary'>
                                {_guild.roles.length} Role(s)
                              </Typography>
                            </Box>
                          </ListItemText>
                        </MenuItem>
                      </Link>
                    </Box>
                  </List>
                ))}
              </Box>
              <Button
                sx={{
                  mt: 5
                }}
                disabled={importingRoles}
                onClick={() => {
                  setImportingRoles(true);
                }}
              >Import Roles
              </Button>
            </div>
          )}
      </Modal>
    </>
  );
}
