import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Page } from 'models';
import ImageSelector from '../ImageSelector';
import { ImageSelectorGallery } from '../ImageSelectorGallery';

const StyledPageBanner = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  position: relative;

  img {
    width: 100%;
    object-fit: cover;
    height: 100%;
  }

  .page-cover-controls {
    visibility: hidden;
    position: absolute;
    bottom: 0px;
    right: 25px
  }

  &:hover .page-cover-controls {
    visibility: inherit;
  }
`;

const PageCoverGalleryImageGroups = {
  'Color & Gradient': [
    'patterns/notion/gradients_2.png',
    'patterns/notion/gradients_3.png',
    'patterns/notion/gradients_4.png',
    'patterns/notion/gradients_5.png',
    'patterns/notion/gradients_8.png',
    'patterns/notion/gradients_10.jpg',
    'patterns/notion/gradients_11.jpg',
    'patterns/notion/solid_beige.png',
    'patterns/notion/solid_blue.png',
    'patterns/notion/solid_red.png',
    'patterns/notion/solid_yellow.png'
  ]
};

export default function PageBanner ({ page, setPage }: { page: Page, setPage: (p: Page) => void }) {
  const theme = useTheme();

  return (
    <StyledPageBanner>
      {page.headerImage
    && (
    <>
      {/* eslint-disable-next-line */}
      <img src={page.headerImage} alt='Page Banner' />
      <Box
        sx={{
          background: theme.palette.background.light,
          borderRadius: theme.spacing(0.5),
          display: 'flex',
          gap: theme.spacing(0.25),
          boxShadow: theme.shadows[2]
        }}
        className='page-cover-controls'
      >
        <ImageSelector
          tabs={[[
            'Gallery',
            <ImageSelectorGallery
              onImageClick={(imageSrc) => {
                setPage({ ...page, headerImage: `/images/${imageSrc}` });
              }}
              items={PageCoverGalleryImageGroups}
            />
          ]]}
          onImageSelect={(imageSrc) => {
            setPage({ ...page, headerImage: imageSrc });
          }}
        >
          <ListItem
            button
            disableRipple
            sx={{
              background: theme.palette.background.dark,
              borderTopLeftRadius: theme.spacing(0.5),
              borderBottomLeftRadius: theme.spacing(0.5),
              padding: theme.spacing(0.5, 1.5)
            }}
          >
            <Typography variant='subtitle1'>
              Change Cover
            </Typography>
          </ListItem>
        </ImageSelector>
        <ListItem
          button
          disableRipple
          sx={{
            background: theme.palette.background.dark,
            borderTopRightRadius: theme.spacing(0.5),
            borderBottomRightRadius: theme.spacing(0.5),
            padding: theme.spacing(0.5, 1.5)
          }}
        >
          <Typography
            variant='subtitle1'
            onClick={() => {
              setPage({ ...page, headerImage: undefined });
            }}
          >
            Remove
          </Typography>
        </ListItem>
      </Box>
    </>
    )}
    </StyledPageBanner>
  );
}
