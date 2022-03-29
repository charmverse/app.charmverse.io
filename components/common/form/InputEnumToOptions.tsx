import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';

export interface Props {
  onChange?: (option: string) => any
  defaultValue?: string,
  title?: string
  keyAndLabel: Record<string, string | number>
}

export function InputEnumToOptions ({ onChange = () => {}, defaultValue, title, keyAndLabel }: Props) {

  const options = Object.entries(keyAndLabel);

  return (
    <FormControl fullWidth>
      {
        title && (<InputLabel id='demo-simple-select-label'>{title}</InputLabel>)
      }

      <Select
        labelId='selection'
        id='selection'
        defaultValue={defaultValue}
        onChange={(ev, _ev) => {
          onChange(ev.target.value);
        }}
      >
        {
          options.map(option => {
            return <MenuItem value={option[0]} key={option[0]}>{option[1]}</MenuItem>;
          })
        }
      </Select>
    </FormControl>
  );
}

export function ReviewerOption ({ user, avatarSize, ...props }: { user: Contributor, avatarSize?: 'small' | 'medium' } & HTMLAttributes<HTMLLIElement>) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <Box component='li' display='flex' gap={1} {...props}>
      <Avatar size={avatarSize} name={ensName || getDisplayName(user)} avatar={user.avatar} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
