import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import Snackbar from 'components/common/Snackbar';
import useSnackbar from 'hooks/useSnackbar';
import { ReactNode, useState } from 'react';

interface VideoSelectorProps {
  onVideoSelect: (videoSrc: string) => void
  children: ReactNode
  tabs?: [string, ReactNode][]
}

export default function VideoSelector (props: VideoSelectorProps) {
  const { message, handleClose, isOpen } = useSnackbar();
  const [embedLink, setEmbedLink] = useState('');
  const { tabs = [], children, onVideoSelect } = props;
  return (
    <PopperPopup popupContent={(
      <Box sx={{
        width: 750
      }}
      >
        <MultiTabs tabs={[
          ...tabs,
          [
            'Link',
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center'
            }}
            >
              <TextField fullWidth placeholder='Paste the video link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
              <Button
                disabled={!embedLink}
                sx={{
                  width: 250
                }}
                onClick={() => {
                  onVideoSelect(embedLink);
                  setEmbedLink('');
                }}
              >
                Embed Link
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
