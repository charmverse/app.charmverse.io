
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { Button, IconButton, MenuList, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 } from 'uuid';

import type { ExistingSelectOption, SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

type Props = {
  options: SelectOptionType[];
  onChange: (options: SelectOptionType[]) => void;
  readOnly?: boolean;
};

export function SelectOptionsList ({ options, readOnly, onChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');

  function createOption () {
    if (newOptionName) {
      // validate if name does not already exist
      onChange([...options, { name: newOptionName, color: getRandomThemeColor(), id: v4(), index: options.length }]);
      setNewOptionName('');
    }
  }

  function updateOption (option: SelectOptionType) {
    // validate if name does not already exist
    if (option.id) {
      const updatedOptions = options.map(o => o.id === option.id ? option : o);
      onChange(updatedOptions);
    }
  }

  function deleteOption (option: SelectOptionType) {
    if (option.id) {
      const updatedOptions = options.filter(o => o.id !== option.id);
      onChange(updatedOptions);
    }
  }

  useEffect(() => {
    setNewOptionName('');
  }, [isEditing]);

  return (
    <Stack>
      <Stack direction='row' alignItems='center' gap={0.5}>
        <Typography variant='subtitle1' sx={{ my: 1 }}>Options</Typography>
        {!!options.length && !isEditing && !readOnly && (
          <IconButton size='small' onClick={() => setIsEditing(true)}>
            <AddOutlinedIcon fontSize='small' />
          </IconButton>
        )}
      </Stack>
      {!options.length && readOnly && <Typography variant='overline'>No options available.</Typography>}
      {!readOnly && (
        isEditing ? (
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <TextField
              placeholder='Type option name..'
              size='small'
              sx={{ width: '100%' }}
              onBlur={() => setIsEditing(false)}
              autoFocus
              onChange={e => setNewOptionName(e.target.value)}
              value={newOptionName}
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  createOption();
                  ev.preventDefault();
                }
              }}
            />
            <Button
              variant='outlined'
              color='primary'
              sx={{
                width: 'fit-content',
                py: 0.8,
                px: 2
              }}
              onMouseDown={e => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                createOption();
              }}
            >
              Add
            </Button>
          </Stack>
        ) : (!options.length ? (
          <Button
            variant='text'
            size='small'
            color='secondary'
            sx={{
              width: 'fit-content',
              my: 0.5,
              px: 2
            }}
            startIcon={<AddOutlinedIcon />}
            onClick={() => setIsEditing(true)}
          >
            Add an option
          </Button>
        ) : null)
      )}

      <MenuList>
        {options.map((option) => (<SelectOptionItem key={option.id} option={option} onChange={updateOption} onDelete={deleteOption} />))}
      </MenuList>
    </Stack>
  );
}
