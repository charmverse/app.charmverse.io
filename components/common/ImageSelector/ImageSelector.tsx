import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { uploadToS3 } from 'lib/aws/uploadToS3';
import { ReactNode, useState } from 'react';
import ImageSelectorGallery from './ImageSelectorGallery';

interface ImageSelectorProps {
  onImageSelect: (imageSrc: string) => void
  children: ReactNode
  galleryImages?: { [category: string]: string[] }
}

export default function ImageSelector ({ children, galleryImages, onImageSelect }: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const tabs: [string, ReactNode][] = [];

  if (galleryImages) {
    tabs.push([
      'Gallery',
      <ImageSelectorGallery
        onImageClick={onImageSelect}
        items={galleryImages}
      />
    ]);
  }

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
                  onChange={async (e) => {
                    const firstFile = e.target.files?.[0];
                    if (firstFile) {
                      const { url } = await uploadToS3(firstFile);
                      onImageSelect(url);
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
              <TextField autoFocus placeholder='Paste the image link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
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
    </PopperPopup>
  );
}
