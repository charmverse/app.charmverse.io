import { NodeViewProps, PluginKey } from '@bangle.dev/core';
import { ReactNode } from 'react';
import InlineActionCounter from './InlineActionCounter';
import { InlineCommentPluginState } from './inlineComment';
import { InlineVotePluginState } from './inlineVote';

interface HeadingProps extends NodeViewProps{
  children: ReactNode,
  calculateActions?: boolean,
  inlineCommentPluginKey: PluginKey<InlineCommentPluginState>,
  inlineVotePluginKey: PluginKey<InlineVotePluginState>
}

export default function Heading (
  { node, children, calculateActions = true, inlineCommentPluginKey, inlineVotePluginKey }: HeadingProps
) {
  const level = node.attrs.level;

  let content = null;

  if (level === 1) {
    content = (
      <h1>
        {children}
      </h1>
    );
  }
  else if (level === 2) {
    content = (
      <h2>
        {children}
      </h2>
    );
  }
  else if (level === 3) {
    content = (
      <h3>
        {children}
      </h3>
    );
  }

  return (
    <InlineActionCounter
      node={node}
      inlineCommentPluginKey={inlineCommentPluginKey}
      inlineVotePluginKey={inlineVotePluginKey}
      calculateActions={calculateActions}
    >
      {content}
    </InlineActionCounter>
  );
}
