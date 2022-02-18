import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { AutoFocusedTextField } from 'components/common/AutoFocusedTextField';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import Snackbar from 'components/common/Snackbar';
import useSnackbar from 'hooks/useSnackbar';
import { ReactNode, useState } from 'react';

interface IFrameSelectorProps {
  onIFrameSelect: (videoSrc: string) => void
  children: ReactNode
  tabs?: [string, ReactNode][]
  type: 'embed' | 'video'
}

export default function IFrameSelector (props: IFrameSelectorProps) {
  const { message, handleClose, isOpen } = useSnackbar();
  const [embedLink, setEmbedLink] = useState('');
  const { type, tabs = [], children, onIFrameSelect } = props;

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
              <AutoFocusedTextField placeholder={`Paste the ${type} link...`} value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
              <Button
                disabled={!embedLink}
                sx={{
                  width: 250
                }}
                onClick={() => {
                  onIFrameSelect(embedLink);
                  setEmbedLink('');
                }}
              >
                {type === 'embed' ? 'Embed link' : 'Insert Video'}
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
