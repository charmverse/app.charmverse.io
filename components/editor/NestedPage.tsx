import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import { Box } from '@mui/material';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';

const name = 'page';

export function nestedPageSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      attrs: {
        src: {
          default: null
        }
      },
      group: 'inline',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'page' }];
      }
    }
  };
}

export function NestedPage ({ node }: NodeViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const [space] = useCurrentSpace();

  const transition = theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut
  });

  return (
    <Box
      display='flex'
      alignItems='center'
      gap={0.5}
      px={1}
      py={0.5}
      borderRadius={1}
      sx={{
        cursor: 'pointer',
        transition,
        '&:hover': {
          backgroundColor: theme.palette.background.light,
          transition
        }
      }}
      onClick={() => {
        router.push(`/${(space!).domain}/${node.attrs.src}`);
      }}
    >
      <Box>
        <svg viewBox='0 0 32 32' height='1em' width='1em' className='page' style={{ transform: 'scale(1.25)', fill: 'currentColor', flexShrink: 0, backfaceVisibility: 'hidden' }}>
          <g>
            <path d='M16,1H4v28h22V11L16,1z M16,3.828L23.172,11H16V3.828z M24,27H6V3h8v10h10V27z M8,17h14v-2H8V17z M8,21h14v-2H8V21z M8,25h14v-2H8V25z' />
          </g>
        </svg>
      </Box>
      <Box fontWeight={600} component='span'>
        Untitled
      </Box>
    </Box>
  );
}
