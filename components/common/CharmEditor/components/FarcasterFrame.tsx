import type { DOMOutputSpec } from '@bangle.dev/pm';
import { Box, Stack, TextField } from '@mui/material';
import type { Frame } from 'frames.js';
import { useEffect, useState } from 'react';

import { useGetFarcasterFrame } from 'charmClient/hooks/farcaster';
import { Button } from 'components/common/Button';
import MultiTabs from 'components/common/MultiTabs';

import type { BaseRawNodeSpec } from './@bangle.dev/core/specRegistry';
import { MediaSelectionPopup } from './common/MediaSelectionPopup';
import { MediaUrlInput } from './common/MediaUrlInput';
import type { CharmNodeViewProps } from './nodeView/nodeView';

export function farcasterFrameSpec() {
  const spec: BaseRawNodeSpec = {
    name: 'farcasterFrame',
    type: 'node',
    schema: {
      attrs: {
        src: {
          default: null
        },
        track: {
          default: []
        }
      },
      draggable: true,
      group: 'block',
      parseDOM: [{ tag: 'div.charm-farcaster-frame' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-farcaster-frame'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
  return spec;
}

export function FarcasterFrame({ selected, attrs, node, deleteNode, updateAttrs, readOnly }: CharmNodeViewProps) {
  const [farcasterFrame, setFarcasterFrame] = useState<Frame | null>(null);
  const { mutate } = useGetFarcasterFrame(attrs.src);

  useEffect(() => {
    if (attrs.src) {
      mutate(attrs.src).then((frame) => {
        setFarcasterFrame(frame ?? null);
      });
    }
  }, [attrs.src]);

  if (!attrs.src) {
    if (readOnly) {
      return <div />;
    }
    return (
      <MediaSelectionPopup
        node={node}
        icon={
          <img
            style={{
              width: 25,
              height: 25
            }}
            src='/images/logos/farcaster_logo_grayscale.png'
          />
        }
        isSelected={selected}
        buttonText='Add Farcaster Frame'
        onDelete={deleteNode}
      >
        <MultiTabs
          tabs={[
            [
              'Link',
              <MediaUrlInput
                onSubmit={(frameUrl) => {
                  updateAttrs({ src: frameUrl });
                }}
                key='link'
                placeholder='https://fc-polls.vercel.app/polls/...'
              />
            ]
          ]}
        />
      </MediaSelectionPopup>
    );
  }

  if (!farcasterFrame) {
    return null;
  }

  return (
    <Stack gap={1}>
      <img src={farcasterFrame.image} width='100%' style={{ objectFit: 'cover' }} />
      {farcasterFrame.inputText && <TextField type='text' placeholder={farcasterFrame.inputText} />}
      <Stack flexDirection='row' gap={1}>
        {farcasterFrame.buttons?.map(({ label, action }, index: number) => (
          <Button
            sx={{
              flexGrow: 1
            }}
            variant='outlined'
            color='secondary'
            key={`${index.toString()}`}
          >
            {label}
            {action === 'post_redirect' ? ` ↗` : ''}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
