import type { MouseEvent, ReactNode } from 'react';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import type { Theme } from '@mui/material';
import type { SxProps } from '@mui/system';

import styled from '@emotion/styled';

const hoverStyle: { [key: string]: string; } = {
  blue: 'color: #111',
  white: 'color: #ccc',
  primary: 'opacity: 0.8',
  inherit: 'inherit'
};

const StyledMuiLink = styled(MuiLink)`
  ${props => props.color
    // @ts-ignore
    ? `color: ${props.theme.palette[props.color]?.main};` : ''}
  &:hover {
    color: ${props => typeof props.color === 'string'
    // @ts-ignore
    ? (hoverStyle[props.color] || props.theme.palette[props.color]?.main) : props.theme.palette[props.color]?.main};
  }
`;

type Props = {
  children: ReactNode;
  className?: string;
  color?: string;
  sx?: SxProps<Theme>;
  href: string;
  external?: boolean;
  target?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export default function Link ({ href, onClick, children, sx, className, color = 'primary', external, target }: Props) {

  if (!href) {
    return <div>{children}</div>;
  }

  return (
    external ? (
      <StyledMuiLink className={className} color={color} href={href} sx={sx} target={target} rel='noreferrer' underline='none'>
        {children}
      </StyledMuiLink>
    ) : (
      <NextLink href={href} passHref>
        <StyledMuiLink onClick={onClick} className={className} color={color} sx={sx} target={target} underline='none'>
          {children}
        </StyledMuiLink>
      </NextLink>
    )
  );
}

interface PageLinkProps extends Props {
  bountyId?: string;
  pageId?: string;
}

// use this link component to display a page inside a modal
export function PageLink ({ bountyId, pageId, ...props }: PageLinkProps) {

  const { showPage } = usePageDialog();

  function onClickInternalLink (e: MouseEvent<HTMLAnchorElement>) {
    if (bountyId || pageId) {
      showPage({ bountyId, pageId });
      e.preventDefault();
    }
  }

  return (
    <Link onClick={onClickInternalLink} {...props} />
  );
}
