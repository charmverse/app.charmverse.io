import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useIntl } from 'react-intl';

import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { Block } from 'lib/focalboard/block';
import type { Member } from 'lib/members/interfaces';

import mutator from '../../mutator';
import { Utils } from '../../utils';
import IconButton from '../../widgets/buttons/iconButton';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';

type Props = {
  comment: Block;
  member?: Pick<Member, 'username' | 'avatar' | 'hasNftAvatar'>;
  readOnly: boolean;
};

function Comment(props: Props) {
  const { comment, member } = props;
  const intl = useIntl();
  const html = comment.title && Utils.htmlFromMarkdown(comment.title);
  const date = new Date(comment.createdAt);
  const { formatDateTime } = useDateFormatter();

  return (
    <div key={comment.id} className='Comment comment'>
      <div className='comment-header'>
        <Avatar size='xSmall' name={member?.username} avatar={member?.avatar} isNft={member?.hasNftAvatar} />
        <div className='comment-username'>{member?.username}</div>
        <Tooltip title={formatDateTime(date)}>
          <div className='comment-date'>{Utils.relativeDisplayDateTime(date, intl)}</div>
        </Tooltip>
        {!props.readOnly && (
          <MenuWrapper>
            <IconButton icon={<MoreHorizIcon />} />
            <Menu position='left'>
              <Menu.Text
                icon={<DeleteOutlineIcon />}
                id='delete'
                name={intl.formatMessage({ id: 'Comment.delete', defaultMessage: 'Delete' })}
                onClick={() => mutator.deleteBlock(comment)}
              />
            </Menu>
          </MenuWrapper>
        )}
      </div>
      <Box ml={3}>
        {comment.fields.content ? (
          <InlineCharmEditor content={comment.fields.content} readOnly style={{ fontSize: '14px' }} />
        ) : (
          // support old model until we completely migrate to new model
          <Typography sx={{ fontSize: '14px', pl: 1 }} dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </Box>
    </div>
  );
}

export default Comment;
