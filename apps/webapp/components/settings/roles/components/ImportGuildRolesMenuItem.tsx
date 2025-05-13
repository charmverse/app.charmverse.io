import type { Guild } from '@guildxyz/types';
import { Box, MenuItem, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { Button, StyledSpinner } from 'components/common/Button';
import { ScrollableModal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { guild, user as guildUser } from '@packages/lib/guild-xyz/client';
import GuildXYZIcon from 'public/images/logos/guild_logo.svg';

import GuildsAutocomplete from './GuildsAutocomplete';

export default function ImportGuildRolesMenuItem({ onClose }: { onClose: () => void }) {
  const [showImportedRolesModal, setShowImportedRolesModal] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fetchingGuilds, setFetchingGuilds] = useState(false);
  const [importingRoles, setImportingRoles] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<number[]>([]);
  const { space } = useCurrentSpace();
  const { user: currentUser } = useUser();
  const addresses = currentUser?.wallets.map((w) => w.address) ?? [];
  const { showMessage } = useSnackbar();
  const { refreshRoles } = useRoles();

  useEffect(() => {
    async function main() {
      if (showImportedRolesModal) {
        setFetchingGuilds(true);

        const guildMembershipsResponses = await Promise.all(
          addresses.map((address) => guildUser.getMemberships(address).catch(() => null))
        );
        const userGuildIds = guildMembershipsResponses
          .filter(isTruthy)
          .flat()
          .map((guildMembership) => guildMembership.guildId);

        const allGuilds = await guild.getMany(userGuildIds).catch(() => null);

        setSelectedGuildIds(userGuildIds);
        setGuilds(allGuilds || []);
        setFetchingGuilds(false);
      }
    }
    main();
  }, [showImportedRolesModal]);

  function resetState() {
    setShowImportedRolesModal(false);
    setImportingRoles(false);
    setFetchingGuilds(false);
    setSelectedGuildIds([]);
    setGuilds([]);
    onClose();
  }

  async function importRoles() {
    if (space) {
      setImportingRoles(true);
      const { importedRolesCount } = await charmClient.importRolesFromGuild({
        guildIds: selectedGuildIds,
        spaceId: space.id
      });
      resetState();
      showMessage(`Successfully imported and assigned ${importedRolesCount} roles from guild.xyz`);
      refreshRoles();
    }
  }

  return (
    <>
      <MenuItem
        disableRipple
        onClick={() => {
          setShowImportedRolesModal(true);
        }}
      >
        <GuildXYZIcon
          style={{
            marginRight: 8,
            transform: 'scale(0.75)'
          }}
        />
        Guild.xyz
      </MenuItem>
      <ScrollableModal size='large' title='Import Guild roles' onClose={resetState} open={showImportedRolesModal}>
        <Box
          sx={{
            px: 4,
            minHeight: 50
          }}
        >
          {fetchingGuilds ? (
            <StyledSpinner />
          ) : guilds.length === 0 ? (
            <Typography variant='subtitle1' color='secondary'>
              You are not part of any guild(s)
            </Typography>
          ) : (
            <Box
              sx={{
                paddingRight: 1
              }}
            >
              <GuildsAutocomplete
                disabled={importingRoles || fetchingGuilds}
                onChange={(guildIds) => {
                  setSelectedGuildIds(guildIds);
                }}
                selectedGuildIds={selectedGuildIds}
                guilds={guilds}
              />
              <Button
                loading={importingRoles}
                sx={{
                  mt: 2
                }}
                disabled={importingRoles || selectedGuildIds.length === 0}
                onClick={importRoles}
              >
                Import Roles
              </Button>
            </Box>
          )}
        </Box>
      </ScrollableModal>
    </>
  );
}
