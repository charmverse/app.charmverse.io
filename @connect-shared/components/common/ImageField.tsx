'use client';

import ImageIcon from '@mui/icons-material/Image';
import { Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { shape } from '@mui/system';
import Image from 'next/image';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';

import { useS3UploadInput } from '../../hooks/useS3UploadInput';

const height = 96;

export function ImageField<T extends FieldValues = object>({
  control,
  name,
  type
}: {
  type: 'avatar' | 'cover';
  control: Control<T>;
  name: keyof T;
}) {
  const typedName = name as Path<T>;
  const { field } = useController({
    name: typedName,
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    }
  });

  return (
    <Controller
      name={typedName}
      control={control}
      render={() => (
        <Box
          sx={{
            position: 'relative',
            width: type === 'avatar' ? 125 : '100%',
            height,
            borderRadius: shape.borderRadius
          }}
        >
          <input
            disabled={isUploading}
            type='file'
            accept={'image/*'}
            ref={inputRef}
            onChange={onFileChange}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              opacity: 0,
              zIndex: 1,
              cursor: 'pointer'
            }}
          />

          <Box
            borderRadius={2}
            height='100%'
            display='flex'
            alignItems='center'
            justifyContent='center'
            bgcolor='inputBackground.main'
            flexDirection='column'
            overflow='hidden'
            gap={0}
          >
            {isUploading ? (
              <CircularProgress color='secondary' size={40} />
            ) : field.value ? (
              <Image
                src={field.value as string}
                alt={`Add ${type}`}
                width={500}
                height={height}
                sizes='100vw'
                style={{
                  width: '100%',
                  height,
                  objectFit: 'cover'
                }}
              />
            ) : (
              <>
                <ImageIcon color='secondary' />
                <Typography color='secondary' variant='caption'>
                  Add {type === 'avatar' ? 'avatar' : 'cover'}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
    />
  );
}
