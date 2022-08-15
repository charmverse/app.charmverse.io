import { useEditorViewContext } from '@bangle.dev/react';
import { Commit, getChangeSummary } from '@manuscripts/track-changes';

function smoosh<T> (
  commit: Commit,
  selector: (commit: Commit) => T | Array<T>
): Array<T> {
  const getFromSelector = () => {
    const result = selector(commit);
    return Array.isArray(result) ? result : [result];
  };
  if (commit.prev) {
    return smoosh(commit.prev, selector).concat(getFromSelector());
  }
  return getFromSelector();
}

export default function SuggestionsSidebar ({ suggestion }: {suggestion: Commit}) {
  const { state } = useEditorViewContext();

  const list = suggestion ? smoosh(suggestion, (c) => ({ _id: c._id, changeID: c.changeID })) : [];

  return (
    <div>
      <strong>Edit suggestions:</strong>
      {list.map(({ _id, changeID }) => {
        return (
          <div className='commit' key={_id}>
            <div>
              {changeID} | {_id}
            </div>
          </div>
        );
      })}
    </div>
  );
}
