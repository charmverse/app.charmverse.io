import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

import type { CommentBlock } from '../../blocks/commentBlock';
import { createCommentBlock } from '../../blocks/commentBlock';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';

import Comment from './comment';

type Props = {
    comments: readonly CommentBlock[];
    rootId: string;
    cardId: string;
    readOnly: boolean;
}

const CommentsList = React.memo((props: Props) => {
  const { user } = useUser();
  const { members } = useMembers();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents

  const onSendClicked = (newComment: CommentBlock['fields']) => {
    const { rootId, cardId } = props;
    Utils.log(`Send comment: ${newComment.contentText}`);
    Utils.assertValue(cardId);

    const comment = createCommentBlock();
    const { content, contentText } = newComment;
    comment.parentId = cardId;
    comment.rootId = rootId;
    comment.title = contentText || '';
    comment.fields = { content };
    mutator.insertBlock(comment, 'add comment');
    // clear the editor
    setEditorKey(key => key + 1);
  };

  const { comments } = props;

  return (
    <div className='CommentsList'>
      {/* New comment */}
      {!props.readOnly && (
        <NewCommentInput
          $key={editorKey}
          key={editorKey}
          avatar={user?.avatar}
          username={user?.username}
          onSubmit={onSendClicked}
        />
      )}

      {comments.slice(0).reverse().map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          member={members.find(_member => _member.id === comment.createdBy)}
          readOnly={props.readOnly}
        />
      ))}

      {/* horizontal divider below comments */}
      {!(comments.length === 0 && props.readOnly) && <hr className='CommentsList__divider' />}
    </div>
  );
});

interface NewCommentProps {
  initialValue?: any | null;
  $key?: string | number;
  username?: string;
  avatar?: string | null;
  onSubmit: (i: CommentBlock['fields']) => void;
}

export function NewCommentInput ({ initialValue = null, $key, username, avatar, onSubmit }: NewCommentProps) {

  const intl = useIntl();
  const [newComment, setNewComment] = useState<CommentBlock['fields'] | null>(initialValue);

  return (
    <div className='CommentsList__new'>
      <Avatar size='xSmall' name={username} avatar={avatar} />
      <InlineCharmEditor
        content={newComment?.content}
        key={$key} // use the size of comments so it resets when the new one is added
        onContentChange={({ doc, rawText }) => {
          setNewComment({ content: doc, contentText: rawText });
        }}
        placeholderText={intl.formatMessage({ id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...' })}
        style={{ fontSize: '14px' }}
        focusOnInit={false}
      />

      {newComment && (
        <Button
          filled={true}
          onClick={() => onSubmit(newComment)}
        >
          <FormattedMessage
            id='CommentsList.send'
            defaultMessage='Send'
          />
        </Button>
      )}
    </div>
  );
}

export default CommentsList;
