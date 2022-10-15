import styled from '@emotion/styled';
import type { LinkProps } from '@mui/material';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';
import type { MouseEvent } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';

const hoverStyle: { [key: string]: string } = {
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

interface Props extends LinkProps {
  external?: boolean;
}

export default function Link ({ external, href, onClick, children, color = 'primary', ...restProps }: Props) {

  if (!href) {
    return <div>{children}</div>;
  }

  return (
    external ? (
      <StyledMuiLink href={href} color={color} rel='noreferrer' underline='none' {...restProps}>
        {children}
      </StyledMuiLink>
    ) : (
      <NextLink href={href} passHref>
        <StyledMuiLink onClick={onClick} color={color} {...restProps}>
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
