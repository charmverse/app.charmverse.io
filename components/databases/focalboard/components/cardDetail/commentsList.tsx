// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {CommentBlock, createCommentBlock} from '../../blocks/commentBlock'
import mutator from '../../mutator'
import {useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'

import {MarkdownEditor} from '../markdownEditor'

import {IUser} from '../../user'
import {getMe} from '../../store/users'

import Comment from './comment'
import './commentsList.scss'

type Props = {
    comments: readonly CommentBlock[]
    rootId: string
    cardId: string
    readonly: boolean
}

const CommentsList = React.memo((props: Props) => {
    const [newComment, setNewComment] = useState('')
    const me = useAppSelector<IUser|null>(getMe)

    const onSendClicked = () => {
        const commentText = newComment
        if (commentText) {
            const {rootId, cardId} = props
            Utils.log(`Send comment: ${commentText}`)
            Utils.assertValue(cardId)

            const comment = createCommentBlock()
            comment.parentId = cardId
            comment.rootId = rootId
            comment.title = commentText
            mutator.insertBlock(comment, 'add comment')
            setNewComment('')
        }
    }

    const {comments} = props
    const intl = useIntl()

    const newCommentComponent = (
        <div className='CommentsList__new'>
            <img
                className='comment-avatar'
                src={Utils.getProfilePicture(me?.id)}
            />
            <MarkdownEditor
                className='newcomment'
                text={newComment}
                placeholderText={intl.formatMessage({id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...'})}
                onChange={(value: string) => {
                    if (newComment !== value) {
                        setNewComment(value)
                    }
                }}
            />

            {newComment &&
            <Button
                filled={true}
                onClick={onSendClicked}
            >
                <FormattedMessage
                    id='CommentsList.send'
                    defaultMessage='Send'
                />
            </Button>
            }
        </div>
    )

    return (
        <div className='CommentsList'>
            {/* New comment */}
            {!props.readonly && newCommentComponent}

            {comments.slice(0).reverse().map((comment) => (
                <Comment
                    key={comment.id}
                    comment={comment}
                    userImageUrl={Utils.getProfilePicture(comment.modifiedBy)}
                    userId={comment.modifiedBy}
                    readonly={props.readonly}
                />
            ))}

            {/* horizontal divider below comments */}
            {!(comments.length === 0 && props.readonly) && <hr className='CommentsList__divider'/>}
        </div>
    )
})

export default CommentsList
