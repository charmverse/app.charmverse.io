import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { Box } from '@mui/system';
import Button from 'components/common/Button';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { useState } from 'react';
import { v4 } from 'uuid';
import InlineCharmEditor from '../../InlineCharmEditor';
import { checkForEmpty } from '../../utils';
import { updateInlineVote } from './inlineVote.utils';

export function InlineVoteSubMenu ({ pluginKey }: {pluginKey: PluginKey}) {
  const view = useEditorViewContext();
  const [voteDescription, setVoteDescription] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const { currentPageId } = usePages();
  const isEmpty = checkForEmpty(voteDescription);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;
      e.preventDefault();
      updateInlineVote(v4())(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
      view.dispatch(tr);
      view.focus();
    }
  };

  return (
    <Box display='flex' width='400px'>
      <Box flexGrow={1}>
        <InlineCharmEditor
          content={voteDescription}
          style={{
            fontSize: '14px'
          }}
          onContentChange={({ doc }) => {
            setVoteDescription(doc);
          }}
        />
      </Box>
      <Button
        size='small'
        onClick={handleSubmit}
        sx={{
          alignSelf: 'flex-end',
          marginBottom: '4px',
          marginRight: '8px'
        }}
        disabled={isEmpty}
      >
        Start
      </Button>
    </Box>
  );
}
