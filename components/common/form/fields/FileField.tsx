import UploadFileIcon from '@mui/icons-material/UploadFile';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { Button } from 'components/common/Button';
import { FileUploadForm } from 'components/common/CharmEditor/components/file/FileUploadForm';
import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import Link from 'components/common/Link';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { replaceS3Domain } from 'lib/utils/url';

import type { ControlFieldProps, FieldProps } from '../interfaces';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapper, FieldWrapperContainer, ReadonlyCharmContent } from './FieldWrapper';

type Props = ControlFieldProps<UploadedFileInfo> &
  FieldProps &
  FieldWrapperProps & {
    description?: PageContent;
    imageUrl?: string;
  };

export function FileField({ value, ...props }: Props) {
  return (
    <FieldWrapper {...props}>
      <Box display='flex'>
        <FileUploadForm
          align='start'
          disabled={props.disabled}
          onComplete={(uploadedFile) => (props.onChange && uploadedFile ? props.onChange(uploadedFile) : null)}
        />
        {value?.url && (
          <Link sx={{ alignSelf: 'end' }} href={replaceS3Domain(value.url)} external target='_blank'>
            <Box display='flex' alignItems='center' p={0.75}>
              <UploadFileIcon fontSize='small' color='secondary' sx={{ mr: 1.5 }} />
              <Typography color='secondary' alignItems='center' noWrap>
                {value.fileName || value.url}
              </Typography>
              {value.size && (
                <Typography color='secondary' alignItems='center' variant='caption' sx={{ ml: 0.5 }}>
                  ({(value.size / 1024).toFixed()}&nbsp;KB)
                </Typography>
              )}
            </Box>
          </Link>
        )}
      </Box>
    </FieldWrapper>
  );
}
