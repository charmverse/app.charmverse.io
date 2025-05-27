import { useTheme } from '@emotion/react';
import { styled } from '@mui/material';
import { ListItemButton, Typography, Box } from '@mui/material';
import { randomIntFromInterval } from '@packages/utils/random';
import { memo } from 'react';

import ImageSelector from 'components/common/ImageSelector/ImageSelector';

const StyledPageBanner = styled(({ focalBoard, ...props }: any) => <div {...props} />)<{ focalBoard?: boolean }>`
  display: flex;
  align-items: center;
  height: 200px;
  justify-content: center;
  position: relative;
  width: 100%;

  img {
    width: 100%;
    object-fit: cover;
    height: 100%;
  }

  .page-cover-controls {
    visibility: hidden;
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: var(--z-index-tooltip);
  }
  ${({ theme }) => theme.breakpoints.up('sm')} {
    .page-cover-controls {
      right: ${({ focalBoard }) => (focalBoard ? '10px' : '200px')};
    }
  }

  &:hover .page-cover-controls {
    visibility: inherit;
  }
`;

const bannerImageGroups = {
  'Color & Gradient': [
    '/images/patterns/notion/gradients_2.png',
    '/images/patterns/notion/gradients_3.png',
    '/images/patterns/notion/gradients_4.png',
    '/images/patterns/notion/gradients_5.png',
    '/images/patterns/notion/gradients_8.png',
    '/images/patterns/notion/gradients_10.jpg',
    '/images/patterns/notion/gradients_11.jpg',
    '/images/patterns/notion/solid_beige.png',
    '/images/patterns/notion/solid_blue.png',
    '/images/patterns/notion/solid_red.png',
    '/images/patterns/notion/solid_yellow.png'
  ]
};

export function randomBannerImage() {
  return bannerImageGroups['Color & Gradient'][
    randomIntFromInterval(0, bannerImageGroups['Color & Gradient'].length - 1)
  ];
}

interface PageBannerProps {
  focalBoard?: boolean;
  headerImage: string;
  readOnly?: boolean;
  setPage: (page: { headerImage: string | null }) => void;
}

function PageBanner({ focalBoard, headerImage, readOnly, setPage }: PageBannerProps) {
  const theme = useTheme();

  function setImage(_headerImage: string | null) {
    setPage({ headerImage: _headerImage });
  }

  return (
    <StyledPageBanner focalBoard={focalBoard}>
      {/* eslint-disable-next-line */}
      <img src={headerImage} />
      {!readOnly && (
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
            galleryImages={bannerImageGroups}
            onImageSelect={setImage}
            uploadDisclaimer='We recommend using an image at least 1500px wide, or a ratio of 1500px by 220px.'
          >
            <ListItemButton
              disableRipple
              sx={{
                background: theme.palette.background.dark,
                borderTopLeftRadius: theme.spacing(0.5),
                borderBottomLeftRadius: theme.spacing(0.5),
                padding: theme.spacing(0.5, 1.5)
              }}
            >
              <Typography variant='subtitle1' whiteSpace='nowrap'>
                Change Cover
              </Typography>
            </ListItemButton>
          </ImageSelector>
          <ListItemButton
            disableRipple
            sx={{
              background: theme.palette.background.dark,
              borderTopRightRadius: theme.spacing(0.5),
              borderBottomRightRadius: theme.spacing(0.5),
              padding: theme.spacing(0.5, 1.5)
            }}
          >
            <Typography variant='subtitle1' onClick={() => setImage(null)}>
              Remove
            </Typography>
          </ListItemButton>
        </Box>
      )}
    </StyledPageBanner>
  );
}

export default memo(PageBanner);
