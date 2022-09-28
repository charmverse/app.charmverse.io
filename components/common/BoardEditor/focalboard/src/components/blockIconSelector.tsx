import { Page } from '@prisma/client';
import PageIcon from 'components/common/Emoji';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { BlockIcons } from '../blockIcons';
import { Board } from '../blocks/board';
import { Card } from '../blocks/card';
import mutator from '../mutator';
import EmojiPicker from '../widgets/emojiPicker';
import DeleteIcon from '../widgets/icons/delete';
import EmojiIcon from '../widgets/icons/emoji';
import Menu from '../widgets/menu';
import MenuWrapper from '../widgets/menuWrapper';

type Props = {
    block: Board|Card
    size?: 's' | 'm' | 'l'
    readOnly?: boolean
    setPage?: (page: Partial<Page>) => void
}

const BlockIconSelector = React.memo((props: Props) => {
  const { block, size, setPage } = props;
  const intl = useIntl();

  const onSelectEmoji = useCallback((emoji: string) => {
    mutator.changeIcon(block.id, block.fields.icon, emoji);
    document.body.click();
  }, [block.id, block.fields.icon]);
  const onAddRandomIcon = useCallback(() => {
    const randomIcon = BlockIcons.shared.randomIcon();
    mutator.changeIcon(block.id, block.fields.icon, randomIcon);
    return randomIcon;
  }, [block.id, block.fields.icon]);
  const onRemoveIcon = useCallback(() => mutator.changeIcon(block.id, block.fields.icon, '', 'remove icon'), [block.id, block.fields.icon]);

  if (!block.fields.icon) {
    return null;
  }

  let className = `octo-icon size-${size || 'm'}`;
  if (props.readOnly) {
    className += ' readonly';
  }
  const iconElement = <PageIcon size='large' icon={block.fields.icon} />;

  return (
    <div className='BlockIconSelector'>
      {props.readOnly && iconElement}
      {!props.readOnly
            && (
            <MenuWrapper>
              {iconElement}
              <Menu>
                <Menu.Text
                  id='random'
                  icon={<EmojiIcon />}
                  name={intl.formatMessage({ id: 'ViewTitle.random-icon', defaultMessage: 'Random' })}
                  onClick={() => {
                    setPage && setPage({ icon: onAddRandomIcon() });
                  }}
                />
                <Menu.SubMenu
                  id='pick'
                  icon={<EmojiIcon />}
                  name={intl.formatMessage({ id: 'ViewTitle.pick-icon', defaultMessage: 'Pick icon' })}
                >
                  <EmojiPicker onSelect={(emoji) => {
                    onSelectEmoji(emoji);
                    setPage && setPage({ icon: emoji });
                  }}
                  />
                </Menu.SubMenu>
                <Menu.Text
                  id='remove'
                  icon={<DeleteIcon />}
                  name={intl.formatMessage({ id: 'ViewTitle.remove-icon', defaultMessage: 'Remove icon' })}
                  onClick={() => {
                    onRemoveIcon();
                    setPage && setPage({ icon: null });
                  }}
                />
              </Menu>
            </MenuWrapper>
            )}
    </div>
  );
});

export default BlockIconSelector;
