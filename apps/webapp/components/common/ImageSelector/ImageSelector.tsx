import { Box, Button, TextField } from '@mui/material';
import { ResizeType } from '@packages/utils/constants';
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
  closeOnImageSelect?: boolean;
}

export default function ImageSelector({
  autoOpen = false,
  children,
  galleryImages,
  onImageSelect,
  uploadDisclaimer,
  closeOnImageSelect
}: ImageSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const tabs: [string, ReactNode][] = [];

  const [open, setOpen] = useState(autoOpen);

  function handleImageSelect(imageSrc: string) {
    if (closeOnImageSelect) {
      setOpen(false);
    }
    onImageSelect(imageSrc);
  }

  if (galleryImages) {
    tabs.push([
      'Gallery',
      <ImageSelectorGallery key='gallery' onImageClick={handleImageSelect} items={galleryImages} />
    ]);
  }

  return (
    <PopperPopup
      autoOpen={autoOpen}
      paperSx={selectorPopupSizeConfig}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      popupContent={
        <Box>
          <MultiTabs
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
                    resizeType={ResizeType.Artwork}
                    setImage={handleImageSelect}
                    uploadDisclaimer={uploadDisclaimer}
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
                      handleImageSelect(embedLink);
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
