import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { useSnackbar } from 'notistack';
import { ReactNode, useState } from 'react';

interface ImageSelectorProps {
  onImageSelect: (imageSrc: string) => void
  children: ReactNode
  tabs?: [string, ReactNode][]
}

export default function ImageSelector (props: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const { tabs = [], children, onImageSelect } = props;
  const { enqueueSnackbar } = useSnackbar();
  return (
    <PopperPopup popupContent={(
      <Box sx={{
        width: 750
      }}
      >
        <MultiTabs tabs={[
          ...tabs,
          [
            'Upload',
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}
            >
              <Button component='label' variant='contained'>
                Choose an image
                <input
                  type='file'
                  hidden
                  accept='image/*'
                  onChange={(e) => {
                    const firstFile = e.target.files?.[0];
                    if (firstFile) {
                      // file size in mb
                      const fileSize = firstFile.size / 1024 / 1024;
                      if (fileSize > 1) {
                        enqueueSnackbar(`File size ${fileSize.toFixed(2)} Mb too large. Limit 1 Mb`, {
                          variant: 'error'
                        });
                      }
                      else {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const { result } = reader;
                          onImageSelect(result as string);
                        };
                        reader.readAsDataURL(firstFile);
                      }
                    }
                  }}
                />
              </Button>
            </Box>
          ],
          [
            'Link',
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center'
            }}
            >
              <TextField fullWidth placeholder='Paste the image link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
              <Button
                sx={{
                  width: 250
                }}
                onClick={() => {
                  onImageSelect(embedLink);
                  setEmbedLink('');
                }}
              >
                Embed Image
              </Button>
            </Box>
          ]
        ]}
        />
      </Box>
  )}
    >
      {children}
    </PopperPopup>
  );
}
