import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { Box, Button, ListItem, TextField, Typography } from '@mui/material';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { HTMLAttributes, useState } from 'react';

const StyledImageContainer = styled.div<{ align?: string }>`
  display: flex;
  justify-content: ${props => props.align};
  &:hover .controls {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 250ms ease-in-out;
`;

const StyledEmptyImageContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyImageContainer (props: HTMLAttributes<HTMLDivElement>) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5)
      }}
      {...props}
    >
      <StyledEmptyImageContainer>
        <ImageIcon fontSize='small' />
        <Typography>
          Add an image
        </Typography>
      </StyledEmptyImageContainer>
    </ListItem>
  );
}

const StyledImage = styled.img`
  object-fit: contain;
  width: 100%;
  user-select: none;
  &:hover {
    cursor: initial;
  }
`;

export function Image ({ node, updateAttrs }: NodeViewProps) {
  const [align, setAlign] = useState('center');
  const theme = useTheme();
  const [embedLink, setEmbedLink] = useState('');
  const [imageWidth, setImageWidth] = useState(500);
  const [_, setClientX] = useState<null | number>(null);

  if (!node.attrs.src) {
    return (
      <PopperPopup popupContent={(
        <Box>
          <MultiTabs tabs={[
            [
              'Upload',
              <div>
                <Button component='label' variant='contained'>
                  Choose an image
                  <input
                    type='file'
                    hidden
                    onChange={(e) => {
                      const firstFile = e.target.files?.[0];
                      if (firstFile) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const { result } = reader;
                          updateAttrs({
                            src: result
                          });
                        };
                        reader.readAsDataURL(firstFile);
                      }
                    }}
                  />
                </Button>
              </div>
            ],
            [
              'Link',
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
              >
                <TextField placeholder='Paste the image link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
                <Button onClick={() => {
                  updateAttrs({
                    src: embedLink
                  });
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
      )}
      >
        <EmptyImageContainer />
      </PopperPopup>
    );
  }
  return (
    <StyledImageContainer
      align={align}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className='content' style={{ position: 'relative' }}>
        { /* eslint-disable-next-line */}
        <Box 
          draggable
          onDrag={(e) => {
            setClientX((clientX) => {
              setImageWidth(imageWidth + (e.clientX - (clientX ?? e.clientX)));
              return e.clientX;
            });
          }}
          sx={{
            position: 'relative',
            cursor: 'col-resize',
            padding: theme.spacing(0, 0.5),
            width: imageWidth
          }}
        >
          <Box sx={{
            '&:hover': {
              borderLeft: '7.5px solid rgba(0,0,0, 0.25)',
              borderRight: '7.5px solid rgba(0,0,0, 0.25)'
            },
            position: 'absolute',
            // precise width and height measurement to keep the resize handler same dimension as that of image
            width: 'calc(100% + 5px)',
            height: 'calc(100% - 8.25px)',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          />
          <StyledImage
            draggable={false}
            src={node.attrs.src}
            alt={node.attrs.alt}
          />
        </Box>
        <Controls className='controls'>
          {[
            [
              'start', <AlignHorizontalLeftIcon sx={{
                fontSize: 14
              }}
              />
            ], [
              'center', <AlignHorizontalCenterIcon sx={{
                fontSize: 14
              }}
              />
            ], [
              'end', <AlignHorizontalRightIcon
                sx={{
                  fontSize: 14
                }}
              />
            ]
          ].map(([alignLabel, alignIcon]) => (
            <ListItem
              key={alignLabel as string}
              sx={{
                padding: theme.spacing(1),
                backgroundColor: align === alignLabel ? theme.palette.background.dark : 'inherit'
              }}
              button
              disableRipple
              onClick={() => {
                setAlign(alignLabel as string);
              }}
            >
              {alignIcon}
            </ListItem>
          ))}
          <ListItem
            button
            disableRipple
            onClick={() => {
              updateAttrs({
                src: null
              });
            }}
            sx={{
              padding: theme.spacing(1),
              backgroundColor: 'inherit'
            }}
          >
            <DeleteIcon sx={{
              fontSize: 14
            }}
            />
          </ListItem>
        </Controls>
      </div>
    </StyledImageContainer>
  );
}
