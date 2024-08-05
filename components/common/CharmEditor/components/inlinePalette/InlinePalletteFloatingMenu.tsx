import { KeyboardArrowDown } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { PluginKey } from 'prosemirror-state';
import { useState } from 'react';

import { MenuButton } from 'components/common/CharmEditor/components/floatingMenu/Icon';

import InlineCommandPalette from './components/InlineCommandPalette';

type Props = {
  pluginKey: PluginKey;
  palettePluginKey: PluginKey;
  linkedPagePluginKey?: PluginKey;
  disableNestedPage?: boolean;
  pageId?: string;
};

export function InlinePalletteFloatingMenu({
  pluginKey,
  palettePluginKey,
  linkedPagePluginKey,
  disableNestedPage,
  pageId
}: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'commands-menu' });
  const [activeItem, setActiveItem] = useState('Text');
  const handleActiveItem = (item: string) => setActiveItem(item);

  return (
    <>
      <div {...bindTrigger(popupState)}>
        <MenuButton hints={['Turn into']}>
          <Stack mx={0.5} direction='row' alignItems='center' gap={1}>
            <Typography variant='subtitle1'>{activeItem}</Typography>
            <KeyboardArrowDown sx={{ fontSize: 16 }} />
          </Stack>
        </MenuButton>
      </div>

      <InlineCommandPalette
        palettePluginKey={palettePluginKey}
        menuKey={pluginKey}
        linkedPagePluginKey={linkedPagePluginKey}
        disableNestedPage={disableNestedPage}
        externalPopupState={popupState}
        filterItem={(item) => !!item.showInFloatingMenu}
        isFloatingMenuList={true}
        handleActiveItem={handleActiveItem}
        pageId={pageId}
      />
    </>
  );
}
