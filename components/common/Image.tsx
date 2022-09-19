
import type { ComponentProps } from 'react';
import Box from '@mui/material/Box';
import styled from '@emotion/styled';
import NextImage from 'next/image';

type Props = ComponentProps<typeof Box> & Pick<ComponentProps<typeof NextImage>, 'src'>;

const ImageWrapper = styled(Box)`
  ${({ theme }) => theme.palette.mode === 'dark' && 'filter: invert(100%);'}
`;

export default function Image ({ src, ...props }: Props) {

  return (
    <ImageWrapper {...props}>
      <NextImage src={src} />
    </ImageWrapper>
  );
}
