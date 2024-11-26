import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { SiteNavigation } from 'components/common/SiteNavigation';

const StickyContainer = styled('div')`
  position: sticky;
  bottom: 0;
  z-index: 1000;
  width: 100%;
  // add some padding for the bottom nav on mobile ios
  // https://stackoverflow.com/questions/31541998/ios-mobile-safari-the-bottom-bar-covers-my-footer
  @media screen and (max-width: 767px) {
    _::-webkit-full-page-media,
    _:future,
    :root .safari_only {
      padding-bottom: 20px;
    }
  }
`;

export function StickyFooter() {
  return (
    <StickyContainer>
      <SiteNavigation />
    </StickyContainer>
  );
}
