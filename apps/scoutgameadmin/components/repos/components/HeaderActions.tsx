'use client';

import { ArrowDropDown as ArrowDropDownIcon, Add as AddIcon } from '@mui/icons-material';
import { Menu, MenuItem, ListItemButton, Stack, Button } from '@mui/material';
import { getLastWeek, getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/scoutgame/dates';
import React, { useState } from 'react';

import { ExportButton } from 'components/common/ExportButton';

import { AddRepoButton } from './AddRepoButton/AddRepoButton';

export function HeaderActions() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  function closeMenu() {
    setAnchorEl(null);
  }
  const lastWeek = getWeekStartEndFormatted(getDateFromISOWeek(getLastWeek()).toJSDate());
  return (
    <Stack gap={2} direction='row'>
      <AddRepoButton variant='contained' color='primary' startIcon={<AddIcon />}>
        Add
      </AddRepoButton>
      <Button variant='outlined' onClick={(event) => setAnchorEl(event.currentTarget)} endIcon={<ArrowDropDownIcon />}>
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem>
          <ExportButton filename='github_repos.tsv' src='/api/repos/export' onComplete={closeMenu}>
            All repositories
          </ExportButton>
        </MenuItem>
        <MenuItem>
          <ExportButton filename='celo_export.tsv' src='/api/bonus-export/celo'>
            Celo Report | {lastWeek}
          </ExportButton>
        </MenuItem>
        <MenuItem>
          <ExportButton filename='moxie_export.tsv' src='/api/repos/moxie-report'>
            Moxie Report | {lastWeek}
          </ExportButton>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
