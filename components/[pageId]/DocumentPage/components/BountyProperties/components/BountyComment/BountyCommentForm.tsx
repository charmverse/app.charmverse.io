import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { isTruthy } from 'lib/utilities/types';

interface NewCommentProps {
  initialValue?: ICharmEditorOutput | null;
  $key?: string | number;
  username?: string;
  avatar?: string | null;
  onSubmit: (editorOutput: ICharmEditorOutput) => void;
}

export function BountyCommentForm({ initialValue, $key, username, avatar, onSubmit }: NewCommentProps) {
  const [newComment, setNewComment] = useState<ICharmEditorOutput | null | undefined>(initialValue);

  return (
    <div className='CommentsList__new'>
      <Avatar size='xSmall' name={username} avatar={avatar} />
      <InlineCharmEditor
        content={newComment?.doc}
        key={$key} // use the size of comments so it resets when the new one is added
        onContentChange={({ doc, rawText }) => {
          setNewComment({ doc, rawText });
        }}
        placeholderText='Add a comment...'
        style={{ fontSize: '14px' }}
        focusOnInit={false}
      />

      <Button
        disabled={!isTruthy(newComment) && checkIsContentEmpty(newComment)}
        filled={true}
        onClick={() => newComment && onSubmit(newComment)}
      >
        <FormattedMessage id='CommentsList.send' defaultMessage='Send' />
      </Button>
    </div>
  );
}
