import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { Stack, TextField, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

type EditableBioProps = {
  bio?: string | null;
  onBioChange?: (bio: string) => void;
  control: Control<any>;
  isDesktop?: boolean;
};

export const DEFAULT_BIO =
  'I’m playing the Scout Game: discovering builders, earning rewards, and supporting the future onchain.';

export function EditableBio({ bio, onBioChange, control, isDesktop }: EditableBioProps) {
  const {
    field: bioField,
    fieldState: { error }
  } = useController({
    name: 'bio',
    control
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isBioDirty, setIsBioDirty] = useState(false);
  const previousBioRef = useRef<string>(bio || '');

  const updateBio = (value: string) => {
    setIsEditingBio(false);
    setIsBioDirty(false);
    onBioChange?.(value);
    previousBioRef.current = value;
  };

  const resetBio = () => {
    setIsEditingBio(false);
    setIsBioDirty(false);
    bioField.onChange(previousBioRef.current);
  };

  if (isEditingBio) {
    return (
      <Stack gap={1}>
        <TextField
          {...bioField}
          onChange={(event) => {
            setIsBioDirty(true);
            bioField.onChange(event);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              updateBio(bioField.value);
            } else if (e.key === 'Escape') {
              resetBio();
            }
          }}
          slotProps={{
            input: {
              multiline: true,
              rows: 3,
              placeholder: DEFAULT_BIO
            }
          }}
          error={!!error?.message}
          autoFocus
        >
          {bioField.value}
        </TextField>
        <Stack direction='row' gap={0.5}>
          {isBioDirty && !error?.message ? (
            <CheckCircleIcon
              sx={{ cursor: 'pointer' }}
              color='success'
              fontSize='small'
              onClick={() => updateBio(bioField.value)}
            />
          ) : null}
          <CancelIcon sx={{ cursor: 'pointer' }} color='error' fontSize='small' onClick={resetBio} />
        </Stack>
      </Stack>
    );
  }

  return (
    <Typography variant={isDesktop ? 'body2' : 'caption'}>
      {bioField.value || DEFAULT_BIO}
      <span style={{ marginLeft: '4px' }}>
        <EditIcon
          sx={{ fontSize: 16, position: 'relative', top: '2px', cursor: 'pointer' }}
          onClick={() => setIsEditingBio(true)}
          color='primary'
        />
      </span>
    </Typography>
  );
}
