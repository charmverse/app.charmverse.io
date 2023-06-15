import styled from '@emotion/styled';
import type { LinkProps } from '@mui/material';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';
import type { MouseEvent } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSubdomainPath } from 'lib/utilities/browser';

const hoverStyle: { [key: string]: string } = {
  blue: 'color: #111',
  white: 'color: #ccc',
  primary: 'opacity: 0.8',
  inherit: 'inherit'
};

const StyledMuiLink = styled(MuiLink)`
  ${(props) =>
    props.color
      ? // @ts-ignore
        `color: ${props.theme.palette[props.color]?.main};`
      : ''}
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      color: ${(props) =>
        typeof props.color === 'string'
          ? // @ts-ignore
            hoverStyle[props.color] || props.theme.palette[props.color]?.main
          : // @ts-ignore
            props.theme.palette[props.color]?.main};
    }
  }
`;

interface Props extends Omit<LinkProps, 'href'> {
  external?: boolean;
  href?: string;
  'data-test'?: string;
}

export default function Link({ external, href, onClick, children, color = 'primary', ...restProps }: Props) {
  const { space: currentSpace } = useCurrentSpace();

  if (!href) {
    return (
      <div className={restProps.className} onClick={onClick} data-test={restProps['data-test']}>
        {children}
      </div>
    );
  }

  return external ? (
    <StyledMuiLink href={href} color={color} onClick={onClick} rel='noreferrer' underline='none' {...restProps}>
      {children}
    </StyledMuiLink>
  ) : (
    <StyledMuiLink
      href={getSubdomainPath(href, currentSpace ?? undefined)}
      // @ts-ignore
      component={NextLink}
      onClick={onClick}
      color={color}
      {...restProps}
    >
      {children}
    </StyledMuiLink>
  );
}

interface PageLinkProps extends Props {
  bountyId?: string;
  pageId?: string;
}

// use this link component to display a page inside a modal
export function PageLink({ bountyId, pageId, ...props }: PageLinkProps) {
  const { showPage } = usePageDialog();

  function onClickInternalLink(e: MouseEvent<HTMLAnchorElement>) {
    if (bountyId || pageId) {
      showPage({ bountyId, pageId });
      e.preventDefault();
    }
  }

  return <Link onClick={onClickInternalLink} {...props} />;
}
