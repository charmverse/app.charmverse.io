import { Box, Button, TextField } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';

import { selectorPopupSizeConfig } from '../CharmEditor/components/common/selectorPopupSizeConfig';

import ImageSelectorGallery from './ImageSelectorGallery';
import { ImageUploadButton } from './ImageUploadButton';

interface ImageSelectorProps {
  autoOpen?: boolean;
  onImageSelect: (imageSrc: string) => void;
  children: ReactNode;
  galleryImages?: { [category: string]: string[] };
  uploadDisclaimer?: string;
}

export default function ImageSelector({
  autoOpen = false,
  children,
  galleryImages,
  onImageSelect,
  uploadDisclaimer
}: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const tabs: [string, ReactNode][] = [];
  const [isUploading, setIsUploading] = useState(false);

  if (galleryImages) {
    tabs.push(['Gallery', <ImageSelectorGallery key='gallery' onImageClick={onImageSelect} items={galleryImages} />]);
  }

  return (
    <PopperPopup
      autoOpen={autoOpen}
      paperSx={selectorPopupSizeConfig}
      popupContent={
        <Box>
          <MultiTabs
            disabled={isUploading}
            tabs={[
              ...tabs,
              [
                'Upload',
                <Box
                  key='upload'
                  sx={{
                    flexDirection: 'column',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  <ImageUploadButton
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    setImage={onImageSelect}
                    uploadDisclaimer={uploadDisclaimer}
                    variant='contained'
                  />
                </Box>
              ],
              [
                'Link',
                <Box
                  key='link'
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center'
                  }}
                >
                  <TextField
                    autoFocus
                    placeholder='Paste the image link...'
                    value={embedLink}
                    onChange={(e) => setEmbedLink(e.target.value)}
                  />
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
      }
    >
      {children}
    </PopperPopup>
  );
}
