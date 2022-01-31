import { blockquote } from "@bangle.dev/base-components";
import { BaseRawNodeSpec } from "@bangle.dev/core";
import { Node } from "@bangle.dev/pm";
import styled from "@emotion/styled";
import { ReactNode } from "react";

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
    background-color: ${({ theme }) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04);"};
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
`

export function blockQuoteSpec() {
  const blockQuoteSpec = blockquote.spec() as BaseRawNodeSpec;
  blockQuoteSpec.schema.attrs = {
    emoji: { default: '😃' },
  }
  return blockQuoteSpec;
}

export function BlockQuote({ children, node }: { node: Node, children: ReactNode }) {
  return <StyledBlockQuote>
    <BlockQuoteEmoji>
      <span>
        {node.attrs.emoji}
      </span>
    </BlockQuoteEmoji>
    {children}
  </StyledBlockQuote>
}