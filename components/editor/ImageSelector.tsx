import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import Snackbar from 'components/common/Snackbar';
import useSnackbar from 'hooks/useSnackbar';
import { ReactNode, useState } from 'react';

interface ImageSelectorProps {
  onImageSelect: (imageSrc: string) => void
  children: ReactNode
  tabs?: [string, ReactNode][]
}

export default function ImageSelector (props: ImageSelectorProps) {
  const { message, handleClose, isOpen, showMessage } = useSnackbar();
  const [embedLink, setEmbedLink] = useState('');
  const { tabs = [], children, onImageSelect } = props;
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
                        showMessage(`File size ${fileSize.toFixed(2)} Mb too large. Limit 1 Mb`);
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
                disabled={!embedLink}
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
      <Snackbar severity='error' handleClose={handleClose} isOpen={isOpen} message={message ?? ''} />
    </PopperPopup>
  );
}
