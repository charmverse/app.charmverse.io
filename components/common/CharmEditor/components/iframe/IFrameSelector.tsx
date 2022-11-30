import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import type { LinkType } from 'lib/embed/extractEmbedLink';

export interface IFrameSelectorProps {
  autoOpen?: boolean;
  onIFrameSelect: (url: string) => void;
  children: ReactNode;
  tabs?: [string, ReactNode][];
  type: LinkType;
}

export default function IFrameSelector(props: IFrameSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
  const { type, tabs = [], children, onIFrameSelect } = props;

  return (
    <PopperPopup
      autoOpen={props.autoOpen}
      popupContent={
        <Box
          sx={{
            width: 750
          }}
        >
          <MultiTabs
            tabs={[
              ...tabs,
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
                    {(() => {
                      switch (type) {
                        case 'embed':
                          return 'Embed Link';
                        case 'figma':
                          return 'Insert Figma';

                        default:
                          return null;
                      }
                    })()}
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
