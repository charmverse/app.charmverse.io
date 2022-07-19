import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { ReactNode } from 'react';
import InlineActionCounter from './InlineActionCounter';
import { InlineCommentPluginState } from './inlineComment';
import { InlineVotePluginState } from './inlineVote';

interface ParagraphProps extends NodeViewProps{
  children: ReactNode,
  calculateActions?: boolean,
  inlineCommentPluginKey: PluginKey<InlineCommentPluginState>,
  inlineVotePluginKey: PluginKey<InlineVotePluginState>
}

export default function Paragraph (
  { node, children, calculateActions = true, inlineCommentPluginKey, inlineVotePluginKey }: ParagraphProps
) {
  return (
    <>
      {children}
      {/* <InlineActionCounter
        inlineCommentPluginKey={inlineCommentPluginKey}
        inlineVotePluginKey={inlineVotePluginKey}
        calculateActions={calculateActions}
        node={node}
      /> */}
    </>
  );
}
