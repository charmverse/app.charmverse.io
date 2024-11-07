'use client';

import { ArrowDropDown as ArrowDropDownIcon, Add as AddIcon } from '@mui/icons-material';
import { Menu, MenuItem, ListItemButton, Stack, Button } from '@mui/material';
import { getLastWeek, getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/scoutgame/dates';
import React, { useState } from 'react';

import { FileDownloadButton } from 'components/common/FileDownloadButton';

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
          <FileDownloadButton filename='github_repos.tsv' src='/api/repos/export' onComplete={closeMenu}>
            All repositories
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton filename={`Celo Weekly Report (${lastWeek}).tsv`} src='/api/partners/celo'>
            Celo Report ({lastWeek})
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton filename={`Game7 Weekly Report (${lastWeek}).tsv`} src='/api/partners/game7'>
            Game7 Report ({lastWeek})
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton filename={`OP Supersim Weekly Report (${lastWeek}).tsv`} src='/api/partners/op-supersim'>
            OP Supersim Report ({lastWeek})
          </FileDownloadButton>
        </MenuItem>
        <MenuItem>
          <FileDownloadButton filename={`Moxie Weekly Report (${lastWeek}).tsv`} src='/api/partners/moxie'>
            Moxie Report ({lastWeek})
          </FileDownloadButton>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
