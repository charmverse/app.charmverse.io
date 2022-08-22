// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { FC } from 'react';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { Block } from '../../blocks/block';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import IconButton from '../../widgets/buttons/iconButton';
import DeleteIcon from '../../widgets/icons/delete';
import OptionsIcon from '../../widgets/icons/options';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import Tooltip from '../../widgets/tooltip';
import { Contributor } from 'models';

type Props = {
  comment: Block;
  contributor?: Pick<Contributor, 'username' | 'avatar' | 'hasNftAvatar'>;
  readonly: boolean;
}

const Comment: FC<Props> = (props: Props) => {
  const { comment, contributor } = props;
  const intl = useIntl();
  const html = comment.title && Utils.htmlFromMarkdown(comment.title);
  const date = new Date(comment.createdAt);

  return (
    <div
      key={comment.id}
      className='Comment comment'
    >
      <div className='comment-header'>
        <Avatar size='xSmall' name={contributor?.username} avatar={contributor?.avatar} isNft={contributor?.hasNftAvatar} />
        <div className='comment-username'>{contributor?.username}</div>
        <Tooltip title={Utils.displayDateTime(date, intl)}>
          <div className='comment-date'>
            {Utils.relativeDisplayDateTime(date, intl)}
          </div>
        </Tooltip>

        {!props.readonly && (
          <MenuWrapper>
            <IconButton icon={<OptionsIcon />} />
            <Menu position='left'>
              <Menu.Text
                icon={<DeleteIcon />}
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
          <InlineCharmEditor
            content={comment.fields.content}
            readOnly
            style={{ fontSize: '14px' }}
          />
        ) : (
          // support old model until we completely migrate to new model
          <Typography
            sx={{ fontSize: '14px', pl: 1 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </Box>
    </div>
  );
};

export default Comment;
