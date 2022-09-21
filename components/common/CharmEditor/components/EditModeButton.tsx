import { Tooltip } from '@mui/material';
import { useEditorViewContext } from '@bangle.dev/react';
import Button from 'components/common/Button';
import { acceptAll } from '../fiduswriter/track/accept_all';
import { rejectAll } from '../fiduswriter/track/reject_all';

export default function EditModeButton ({ enabled, toggle }: { enabled: boolean, toggle: () => void }) {

  const view = useEditorViewContext();
  const suggestionMode = enabled;// view?.state?.doc?.firstChild?.attrs.tracked;

  function toggleSuggestionMode () {
    toggle();
    // const article = view.state.doc.firstChild;
    // if (article) {
    //   const attrs = { ...article.attrs };
    //   attrs.tracked = !attrs.tracked;
    //   view.dispatch(
    //     view.state.tr.setNodeMarkup(0, undefined, attrs)// .setMeta('settings', true)
    //   );
    // }
  }

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  return (
    <>
      <Tooltip title='Toggle suggestion mode'>
        <Button size='small' variant='text' color='inherit' onClick={toggleSuggestionMode}>
          {suggestionMode ? 'Suggesting' : 'Editing'}
        </Button>
      </Tooltip>
      <Button size='small' variant='text' color='success' onClick={clickAcceptAll}>
        Accept All Suggestions
      </Button>
      <Button size='small' variant='text' color='error' onClick={clickRejectAll}>
        Reject All Suggestions
      </Button>
    </>
  );
}
