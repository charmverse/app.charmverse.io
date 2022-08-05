// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import Avatar from 'components/common/Avatar';
import { CommentBlock, createCommentBlock } from '../../blocks/commentBlock';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';

import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';

import Comment from './comment';
import { PageContent } from 'models';
import { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';

type Props = {
    comments: readonly CommentBlock[]
    rootId: string
    cardId: string
    readonly: boolean
}

const CommentsList = React.memo((props: Props) => {
  const [currentUser] = useUser();
  const [contributors] = useContributors();
  const [newComment, setNewComment] = useState<{content: PageContent, contentText: string} | null>(null);
  const { cardId, rootId } = props;

  const onSendClicked = () => {
    if (newComment) {
      const comment = createCommentBlock();
      const { content, contentText } = newComment;
      comment.parentId = cardId;
      comment.rootId = rootId;
      comment.title = contentText || '';
      comment.fields = { content };
      mutator.insertBlock(comment, 'add comment');
      setNewComment(null);
    }
  };

  const { comments } = props;

  return (
    <div className='CommentsList'>
      {/* New comment */}
      {!props.readonly && (
        <NewCommentInput
          avatar={currentUser?.avatar}
          username={currentUser?.username}
          onSubmit={onSendClicked}
          comment={newComment?.content}
          setComment={(output) => {
            setNewComment({ content: output.doc, contentText: output.rawText });
          }}
        />
      )}

      {comments.slice(0).reverse().map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          contributor={contributors.find(_contributor => _contributor.id === comment.createdBy)}
          readonly={props.readonly}
        />
      ))}

      {/* horizontal divider below comments */}
      {!(comments.length === 0 && props.readonly) && <hr className='CommentsList__divider' />}
    </div>
  );
});

interface NewCommentProps {
  comment?: PageContent | null;
  key?: string | number;
  username?: string;
  avatar?: string | null;
  onSubmit: () => void;
  setComment?: (output: ICharmEditorOutput) => void
}

export function NewCommentInput ({ comment, setComment, key, username, avatar, onSubmit }: NewCommentProps) {
  const intl = useIntl();

  return (
    <div className='CommentsList__new'>
      <Avatar size='xSmall' name={username} avatar={avatar} />
      <InlineCharmEditor
        content={comment}
        key={key} // use the size of comments so it resets when the new one is added
        onContentChange={({ doc, rawText }) => {
          setComment?.({ doc, rawText });
        }}
        placeholderText={intl.formatMessage({ id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...' })}
        style={{ fontSize: '14px' }}
      />

      {comment
        && (
        <Button
          filled={true}
          onClick={() => onSubmit()}
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
