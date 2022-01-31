import { blockquote } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import { getSuggestTooltipKey } from '@bangle.dev/react-emoji-suggest/emoji-suggest';
import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { emojiSuggestKey } from './EmojiSuggest';

const StyledBlockQuote = styled.div`
  background-color: ${({ theme }) => theme.palette.background.light};
  font-size: 20px;
  padding: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const BlockQuoteEmoji = styled.div`
  cursor: pointer;
  display: flex;
  align-items: flex-start;

  /* Duplicate. Make sure to reuse from StyledEmojiSquare */
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  & span {
    padding: ${({ theme }) => theme.spacing(0.5)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    font-size: 16px;
  }

  & span:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04);'};
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
`;

export function blockQuoteSpec () {
  const spec = blockquote.spec() as BaseRawNodeSpec;
  spec.schema.attrs = {
    emoji: { default: '😃' }
  };
  return spec;
}

export function BlockQuote ({ children, node, updateAttrs, view }: NodeViewProps & { children: ReactNode }) {
  return (
    <StyledBlockQuote>
      <BlockQuoteEmoji>
        <span
          role='button'
          tabIndex={0}
          onClick={() => {
            if (view.dispatch!) {
              const suggestTooltipKey = getSuggestTooltipKey(emojiSuggestKey)(view.state);
              view.dispatch(
                view.state.tr
                  .setMeta(suggestTooltipKey, { type: 'RENDER_TOOLTIP' })
                  .setMeta('addToHistory', false)
              );
            }
          }}
        >
          {node.attrs.emoji}
        </span>
      </BlockQuoteEmoji>
      {children}
    </StyledBlockQuote>
  );
}
