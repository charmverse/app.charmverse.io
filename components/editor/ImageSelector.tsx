import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { ReactNode, useState } from 'react';

interface ImageSelectorProps {
  onImageSelect: (imageSrc: string) => void
  children: ReactNode
  tabs?: [string, ReactNode][]
}

export default function ImageSelector (props: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const { tabs = [], children, onImageSelect } = props;

  return (
    <PopperPopup popupContent={(
      <Box>
        <MultiTabs tabs={[
          ...tabs,
          [
            'Upload',
            <div>
              <Button component='label' variant='contained'>
                Choose an image
                <input
                  type='file'
                  hidden
                  onChange={(e) => {
                    const firstFile = e.target.files?.[0];
                    if (firstFile) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const { result } = reader;
                        onImageSelect(result as string);
                      };
                      reader.readAsDataURL(firstFile);
                    }
                  }}
                />
              </Button>
            </div>
          ],
          [
            'Link',
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
            >
              <TextField placeholder='Paste the image link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
              <Button onClick={() => {
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
