import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { Stack, TextField, Typography } from '@mui/material';
import type { TalentProfile } from '@packages/scoutgame/users/getUserByPath';
import { useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { ProfileLinks } from '../ProfileLinks';
import { ShareProfile } from '../ShareProfile';

type EditableDisplayNameProps = {
  displayName: string;
  onDisplayNameChange?: (displayName: string) => void;
  control: Control<any>;
  isLoading?: boolean;
  githubLogin?: string;
  farcasterName?: string | null;
  hasMoxieProfile?: boolean;
  talentProfile?: TalentProfile;
  userPath: string;
};

export function EditableName({
  displayName,
  onDisplayNameChange,
  control,
  isLoading,
  githubLogin,
  farcasterName,
  hasMoxieProfile,
  talentProfile,
  userPath
}: EditableDisplayNameProps) {
  const {
    field: displayNameField,
    fieldState: { error }
  } = useController({
    name: 'displayName',
    control
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isDisplayNameDirty, setIsDisplayNameDirty] = useState(false);
  const displayNameRef = useRef<string>(displayName);

  const updateDisplayName = (value: string) => {
    setIsEditingDisplayName(false);
    setIsDisplayNameDirty(false);
    onDisplayNameChange?.(value);
    displayNameRef.current = value;
  };

  const resetDisplayName = () => {
    setIsEditingDisplayName(false);
    setIsDisplayNameDirty(false);
    displayNameField.onChange(displayNameRef.current);
  };

  return (
    <Stack direction='row' alignItems='center' flexWrap='nowrap' justifyContent='space-between' width='100%' gap={1}>
      <Stack width={isEditingDisplayName ? '80%' : '100%'}>
        {isEditingDisplayName ? (
          <TextField
            required
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateDisplayName(displayNameField.value);
              } else if (e.key === 'Escape') {
                resetDisplayName();
              }
            }}
            {...displayNameField}
            onChange={(event) => {
              setIsDisplayNameDirty(true);
              displayNameField.onChange(event);
            }}
            fullWidth
            autoFocus
            error={!!error?.message}
            sx={{
              my: 0.5,
              '& .MuiInputBase-input': {
                padding: 0.5,
                paddingLeft: 1
              }
            }}
          />
        ) : (
          <Stack direction='row' alignItems='center' gap={1}>
            <Typography variant='h6'>{displayNameField.value}</Typography>
            <EditIcon
              onClick={() => setIsEditingDisplayName(true)}
              sx={{ cursor: 'pointer' }}
              color='primary'
              fontSize='small'
            />
            {farcasterName || githubLogin || talentProfile || hasMoxieProfile ? (
              <ProfileLinks
                farcasterName={farcasterName}
                githubLogin={githubLogin}
                hasMoxieProfile={hasMoxieProfile}
                talentProfile={talentProfile}
              />
            ) : null}
            <ShareProfile userPath={userPath} />
          </Stack>
        )}
      </Stack>
      {isEditingDisplayName && (
        <Stack direction='row' gap={0.5}>
          {isDisplayNameDirty && !error?.message && displayNameField.value ? (
            <CheckCircleIcon
              sx={{ cursor: 'pointer' }}
              color='success'
              fontSize='small'
              onClick={() => updateDisplayName(displayNameField.value)}
            />
          ) : null}
          <CancelIcon sx={{ cursor: 'pointer' }} color='error' fontSize='small' onClick={resetDisplayName} />
        </Stack>
      )}
    </Stack>
  );
}
