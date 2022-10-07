import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

import { PimpedButton } from '../Button';

import ImageSelectorGallery from './ImageSelectorGallery';

interface ImageSelectorProps {
  autoOpen?: boolean;
  onImageSelect: (imageSrc: string) => void;
  children: ReactNode;
  galleryImages?: { [category: string]: string[] };
}

export default function ImageSelector ({ autoOpen = false, children, galleryImages, onImageSelect }: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const tabs: [string, ReactNode][] = [];
  const [isUploading, setIsUploading] = useState(false);

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
    <PopperPopup
      autoOpen={autoOpen}
      popupContent={(
        <Box sx={{
          width: 750
        }}
        >
          <MultiTabs
            disabled={isUploading}
            tabs={[
              ...tabs,
              [
                'Upload',
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}
                >
                  <PimpedButton loading={isUploading} loadingMessage='Uploading image' disabled={isUploading} component='label' variant='contained'>
                    Choose an image
                    <input
                      type='file'
                      hidden
                      accept='image/*'
                      onChange={async (e) => {
                        setIsUploading(true);
                        const firstFile = e.target.files?.[0];
                        if (firstFile) {
                          const { url } = await uploadToS3(firstFile);
                          onImageSelect(url);
                        }
                        setIsUploading(false);
                      }}
                    />
                  </PimpedButton>
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
