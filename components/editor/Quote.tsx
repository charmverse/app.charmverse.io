import { blockquote } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { getSuggestTooltipKey } from './@bangle.dev/react-emoji-suggest/emoji-suggest';
import { emojiSuggestKey } from './EmojiSuggest';

const StyledBlockQuote = styled.div`
  border-left: 4px solid ${({ theme }) => theme.palette.text.primary};
  font-size: 20px;
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1.2)};
  padding-bottom: ${({ theme }) => theme.spacing(1.2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function quoteSpec () {
  const spec = blockquote.spec() as BaseRawNodeSpec;
  spec.name = 'quote';
  return spec;
}

export function Quote ({ children, node, updateAttrs, view, getPos }: NodeViewProps & { children: ReactNode }) {
  return (
    <StyledBlockQuote>
      {children}
    </StyledBlockQuote>
  );
}
