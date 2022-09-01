
import React from 'react';

import { useIntl } from 'react-intl';

import CardIcon from '../../widgets/icons/card';
import Menu from '../../widgets/menu';

import MenuWrapper from '../../widgets/menuWrapper';
import OptionsIcon from '../../widgets/icons/options';
import IconButton from '../../widgets/buttons/iconButton';
import CheckIcon from '../../widgets/icons/check';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import mutator from '../../mutator';
import { BoardView } from '../../blocks/boardView';
import { usePages } from 'hooks/usePages';
import { Board } from '../../blocks/board';
import { Page } from '@prisma/client';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

type Props = {
  deleteTemplate: (pageId: string) => void
  addPageFromTemplate: (pageId: string) => void
  showPage: (showPage: string) => void
  pageId: string
  isDefaultTemplate?: boolean
}

export const TemplatePageMenuItemWithActions = React.memo(({addPageFromTemplate, deleteTemplate, pageId, showPage, isDefaultTemplate}: Props) => {

  const {pages} = usePages(); 

  return (
    <Menu.Text
      icon={<DescriptionOutlinedIcon />}
      id={`page-template-${pageId}`}
      name={pages[pageId]?.title || 'Untitled'}
      onClick={() => {
        addPageFromTemplate(pageId);
      }}
      css={{
        fontWeight: isDefaultTemplate ? 'bold' : 'normal'
      }}
      rightIcon={(
        <MenuWrapper stopPropagationOnToggle={true}>
          <IconButton icon={<OptionsIcon />} />
          <Menu position='left'>

            <Menu.Text
              /* TODO - Fix display of this icon, which is currently */
              icon={<ModeEditOutlineOutlinedIcon sx={{hidden: null}} />}
              id='default'
              name='Edit'
              onClick={() => {
                showPage(pageId)
              }}
            />

          </Menu>
        </MenuWrapper>
      )}
    />
  );
})