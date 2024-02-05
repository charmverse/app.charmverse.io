import type { DOMOutputSpec } from '@bangle.dev/pm';

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

  return <div>Farcaster frame</div>;
}
