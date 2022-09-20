import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Image from 'next/image';

import darkLogoImage from 'public/images/charmverse_logo_sm_black.png';
import whiteLogoImage from 'public/images/charmverse_logo_sm_white.png';

const HeaderBox = styled.div`
  margin: ${({ theme }) => theme.spacing(3)};
  display: flex;
  justify-content: center;
  ${props => props.theme.breakpoints.up('sm')} {
    display: block;
  }
`;

export default function Header () {
  const theme = useTheme();
  const logo = theme.palette.mode === 'dark' ? whiteLogoImage : darkLogoImage;
  return (
    <HeaderBox>
      <Image src={logo} alt='CharmVerse' />
    </HeaderBox>
  );
}
