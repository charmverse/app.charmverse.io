// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { FC } from 'react';
import { useIntl } from 'react-intl';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Block } from '../../blocks/block';
import mutator from '../../mutator';
import { useAppSelector } from '../../store/hooks';
import { getUser } from '../../store/users';
import { Utils } from '../../utils';
import IconButton from '../../widgets/buttons/iconButton';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import Tooltip from '../../widgets/tooltip';

type Props = {
    comment: Block
    userId: string
    userImageUrl: string
    readonly: boolean
}

const Comment: FC<Props> = (props: Props) => {
  const { comment, userId, userImageUrl } = props;
  const intl = useIntl();
  const html = Utils.htmlFromMarkdown(comment.title);
  const user = useAppSelector(getUser(userId));
  const date = new Date(comment.createdAt);

  return (
    <div
      key={comment.id}
      className='Comment comment'
    >
      <div className='comment-header'>
        <img
          className='comment-avatar'
          src={userImageUrl}
        />
        <div className='comment-username'>{user?.username}</div>
        <Tooltip title={Utils.displayDateTime(date, intl)}>
          <div className='comment-date'>
            {Utils.relativeDisplayDateTime(date, intl)}
          </div>
        </Tooltip>

        {!props.readonly && (
        <MenuWrapper>
          <IconButton icon={<MoreHorizIcon fontSize='small' />} />
          <Menu position='left'>
            <Menu.Text
              icon={<DeleteOutlineIcon fontSize='small' />}
              id='delete'
              name={intl.formatMessage({ id: 'Comment.delete', defaultMessage: 'Delete' })}
              onClick={() => mutator.deleteBlock(comment)}
            />
          </Menu>
        </MenuWrapper>
        )}
      </div>
      <div
        className='comment-text'
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default Comment;
