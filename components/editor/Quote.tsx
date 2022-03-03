import { blockquote } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { getSuggestTooltipKey } from './@bangle.dev/react-emoji-suggest/emoji-suggest';
import { emojiSuggestKey } from './EmojiSuggest';

const StyledBlockQuote = styled.div`
  background-color: ${({ theme }) => theme.palette.red.main}: 
  border-radius-left: 5px;
  border-color: white
  font-size: 20px;
  padding: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function quoteSpec () {
  const spec = blockquote.spec() as BaseRawNodeSpec;
  spec.name = 'quote';
  spec.schema.defining = true;
  return spec;
}

export function Quote ({ children, node, updateAttrs, view, getPos }: NodeViewProps & { children: ReactNode }) {
  return (
    <StyledBlockQuote>

      {children}
    </StyledBlockQuote>
  );
}
