import { Stack, TextField } from '@mui/material';
import { useState } from 'react';

import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import Button from 'components/common/Button';
import { ImageUploadButton } from 'components/common/ImageSelector/ImageUploadButton';
import MultiTabs from 'components/common/MultiTabs';

export function PageHeaderIcon({ updatePageIcon }: { updatePageIcon: (icon: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageLink, setImageLink] = useState('');
  return (
    <MultiTabs
      disabled={isUploading}
      tabs={[
        [
          'Emojis',
          <EmojiPicker
            key='upload'
            onSelect={(emoji) => {
              updatePageIcon(emoji);
            }}
          />
        ],
        [
          'Custom',
          <Stack key='custom' spacing={1}>
            <Stack flexDirection='row' gap={1}>
              <TextField
                value={imageLink}
                onChange={(e) => {
                  setImageLink(e.target.value);
                }}
                disabled={isUploading}
                placeholder='Paste link to an image ...'
              />
              <Button
                onClick={() => {
                  updatePageIcon(imageLink);
                }}
                disabled={isUploading || imageLink.length === 0}
              >
                Submit
              </Button>
            </Stack>
            <ImageUploadButton
              sx={{
                width: '100%'
              }}
              uploadDisclaimer='Recommended size is 280 × 280 pixels'
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              setImage={updatePageIcon}
            />
          </Stack>
        ]
      ]}
    />
  );
}
