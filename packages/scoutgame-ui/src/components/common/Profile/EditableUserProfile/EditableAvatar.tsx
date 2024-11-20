import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress } from '@mui/material';
import Image from 'next/image';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { useS3UploadInput } from '../../../../hooks/useS3UploadInput';

type EditableAvatarProps = {
  control: Control<any>;
  avatarSize?: number;
  isLoading?: boolean;
  onAvatarChange?: (url: string) => void;
};

export function EditableAvatar({ control, avatarSize = 100, isLoading, onAvatarChange }: EditableAvatarProps) {
  const { field: avatarField } = useController({
    name: 'avatar',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      avatarField.onChange(url);
      onAvatarChange?.(url);
    }
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: avatarSize,
        minWidth: avatarSize,
        height: avatarSize,
        minHeight: avatarSize,
        borderRadius: '50%',
        backgroundColor: 'inputBackground.main'
      }}
    >
      <input
        disabled={isUploading || isLoading}
        type='file'
        accept='image/*'
        ref={inputRef}
        onChange={onFileChange}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          opacity: 0,
          zIndex: 1,
          cursor: 'pointer',
          borderRadius: '50%'
        }}
      />
      {isUploading ? null : (
        <EditIcon
          sx={{
            fontSize: 16,
            position: 'absolute',
            top: -2.5,
            right: -2.5,
            cursor: 'pointer',
            zIndex: 2
          }}
          color='primary'
          onClick={() => {
            if (isLoading) return;
            inputRef.current?.click();
          }}
        />
      )}
      {isUploading ? (
        <CircularProgress
          color='secondary'
          size={25}
          sx={{
            position: 'absolute',
            top: '35%',
            left: '35%'
          }}
        />
      ) : (
        <Image
          src={avatarField.value}
          alt='avatar'
          width={avatarSize}
          height={avatarSize}
          sizes='100vw'
          style={{
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      )}
    </Box>
  );
}
