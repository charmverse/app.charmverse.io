
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { Theme } from '@mui/material';
import {
  SxProps,
  // @ts-ignore
  getPath
} from '@mui/system';

import styled from '@emotion/styled';

const hoverStyle: { [key: string]: string } = {
  blue: 'color: #111;',
  white: 'color: #ccc;',
  primary: 'opacity: 0.8;'
}

const StyledMuiLink = styled(MuiLink)`
  ${props => props.color ? `color: ${getPath(props.theme, 'palette.' + props.color + '.main')};` : ''}
  &:hover {
    ${props => typeof props.color ==='string' ? hoverStyle[props.color] : `${getPath(props.theme, 'palette.' + props.color + '.main')};`}
  }
`;



const Link: React.FC<{ className?: string, color?: string, sx?: SxProps<Theme>, href: string, external?: boolean, target?: string }> = ({ href, children, sx, className, color = 'blue', external, target }) => (
  external ? (
    <StyledMuiLink className={className} color={color} href={href} sx={sx} target={target} underline='none'>
      {children}
    </StyledMuiLink>
  ) : (
    <NextLink href={href} passHref>
      <StyledMuiLink className={className} color={color} sx={sx} target={target} underline='none'>
        {children}
      </StyledMuiLink>
    </NextLink>
  )
);

export default Link;