import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import NextImage from 'next/image';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof Box> & Pick<ComponentProps<typeof NextImage>, 'src'>;

const ImageWrapper = styled(Box)`
  ${({ theme }) => theme.palette.mode === 'dark' && 'filter: invert(100%);'}
`;

export default function Image({ src, ...props }: Props) {
  return (
    <ImageWrapper {...props}>
      <NextImage alt='' src={src} layout='responsive' />
    </ImageWrapper>
  );
}
