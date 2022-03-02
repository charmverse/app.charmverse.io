import { blockquote, heading } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { getSuggestTooltipKey } from './@bangle.dev/react-emoji-suggest/emoji-suggest';
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
    background-color: ${({ theme }) => theme.palette.emoji.hoverBackground};
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
`;

export function collapsibleHeadingSpec () {
  const spec = heading.spec() as BaseRawNodeSpec;
  spec.name = 'collapsibleHeading';
  return spec;
}

export function CollapsibleHeading ({
  children, node, updateAttrs, view, getPos
}: NodeViewProps & { children: ReactNode }) {
  return (
    <StyledBlockQuote>
      <BlockQuoteEmoji>
        <span
          tabIndex={0}
          role='button'
          onClick={e => {
            e.stopPropagation();
            if (view.dispatch!) {
              const suggestTooltipKey = getSuggestTooltipKey(emojiSuggestKey)(view.state);
              const emojiSuggestState = emojiSuggestKey.getState(view.state);
              // If we are already inside a callout we need to hide the emoji palette
              if (emojiSuggestState.insideCallout) {
                view.dispatch(
                  // Chain transactions together
                  view.state.tr.setMeta(emojiSuggestKey, { type: 'OUTSIDE_CALLOUT', updateAttrs, getPos }).setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
                );
              }
              else {
                view.dispatch(
                  // Chain transactions together
                  view.state.tr.setMeta(emojiSuggestKey, { type: 'INSIDE_CALLOUT', updateAttrs, getPos }).setMeta(suggestTooltipKey, { type: 'RENDER_TOOLTIP' }).setMeta('addToHistory', false)
                );
              }
            }
          }}
        >
          {node.attrs.emoji}
        </span>
      </BlockQuoteEmoji>
      <p>COLLAPSIBLE</p>

      {children}
    </StyledBlockQuote>
  );
}
