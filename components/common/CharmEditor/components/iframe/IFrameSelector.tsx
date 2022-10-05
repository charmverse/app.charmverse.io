import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';

interface IFrameSelectorProps {
  onIFrameSelect: (videoSrc: string) => void;
  children: ReactNode;
  tabs?: [string, ReactNode][];
  type: 'embed' | 'video';
}

export default function IFrameSelector (props: IFrameSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const { type, tabs = [], children, onIFrameSelect } = props;

  return (
    <PopperPopup
      autoOpen
      popupContent={(
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
                <TextField
                  autoFocus
                  placeholder={`Paste the ${type} link...`}
                  value={embedLink}
                  onChange={(e) => setEmbedLink(e.target.value)}
                />
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
    </PopperPopup>
  );
}
