// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import Avatar from 'components/common/Avatar';
import { CommentBlock, createCommentBlock } from '../../blocks/commentBlock';
import mutator from '../../mutator';
import { useAppSelector } from '../../store/hooks';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';

import { MarkdownEditor } from '../markdownEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { PageContent } from 'models';

import { IUser } from '../../user';
import { getMe } from '../../store/users';

import Comment from './comment';

type Props = {
    comments: readonly CommentBlock[]
    rootId: string
    cardId: string
    readonly: boolean
}

const CommentsList = React.memo((props: Props) => {
  const [newComment, setNewComment] = useState<CommentBlock['fields'] | null>(null);
  // a value to allow us to reset CharmEditor state
  const [newCommentKey, setNewCommentKey] = useState<number>(1);
  const [currentUser] = useUser();
  const [contributors] = useContributors();

  const onSendClicked = () => {
    if (newComment) {
      const { rootId, cardId } = props;
      Utils.log(`Send comment: ${newComment.contentText}`);
      Utils.assertValue(cardId);

      const comment = createCommentBlock();
      comment.parentId = cardId;
      comment.rootId = rootId;
      comment.title = newComment.contentText || '';
      comment.fields = { ...newComment}
      mutator.insertBlock(comment, 'add comment');
      setNewComment(null);
      setNewCommentKey(newCommentKey + 1);
    }
  };

  const { comments } = props;
  const intl = useIntl();

  const newCommentComponent = (
    <div className='CommentsList__new'>
      <Avatar size='xSmall' name={currentUser?.username} avatar={currentUser?.avatar} />
      <InlineCharmEditor
        key={newCommentKey}
        onContentChange={({ doc, rawText }) => {
          setNewComment({ content: doc, contentText: rawText });
        }}
        placeholderText={intl.formatMessage({ id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...' })}
        style={{ fontSize: '14px' }}
      />

      {newComment
        && (
        <Button
          filled={true}
          onClick={onSendClicked}
        >
          <FormattedMessage
            id='CommentsList.send'
            defaultMessage='Send'
          />
        </Button>
      )}
    </div>
  );

  return (
    <div className='CommentsList'>
      {/* New comment */}
      {!props.readonly && newCommentComponent}

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

export default CommentsList;
