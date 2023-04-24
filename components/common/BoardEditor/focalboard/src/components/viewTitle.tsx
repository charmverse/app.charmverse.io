/* eslint-disable max-len */
import type { Page } from '@charmverse/core/dist/prisma';
import styled from '@emotion/styled';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import type { KeyboardEvent } from 'react';
import React, { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import type { Board } from 'lib/focalboard/board';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { BlockIcons } from '../blockIcons';
import mutator from '../mutator';
import Button from '../widgets/buttons/button';
import Editable from '../widgets/editable';

import BlockIconSelector from './blockIconSelector';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

const BoardTitleEditable = styled(Editable)`
  font-size: 32px;
  font-weight: 700;
  line-height: 32px;
  flex-grow: 1;
  width: 100%;
`;

const InlineBoardTitleEditable = styled(BoardTitleEditable)`
  font-size: 22px;
`;

type ViewTitleInlineProps = {
  pageTitle: string;
  readOnly: boolean;
  setPage: (page: Partial<Page>) => void;
};

type ViewTitleProps = ViewTitleInlineProps & {
  pageIcon?: string | null;
  board: Board;
};

// NOTE: This is actually the title of the board, not a particular view
function ViewTitle(props: ViewTitleProps) {
  const { board, pageTitle, pageIcon } = props;

  const [title, setTitle] = useState(pageTitle);
  const onEditTitleSave = useCallback(() => {
    props.setPage({ title });
  }, [pageTitle, title]);
  const onEditTitleCancel = useCallback(() => {
    setTitle(pageTitle);
    props.setPage({ title: pageTitle });
  }, [pageTitle]);
  const onDescriptionChange = useCallback(
    (text: PageContent) => mutator.changeDescription(board.id, board.fields.description, text),
    [board.id, board.fields.description]
  );
  const onAddRandomIcon = useCallback(() => {
    const newIcon = BlockIcons.shared.randomIcon();
    props.setPage({ icon: newIcon });
  }, []);
  const setRandomHeaderImage = useCallback(
    (headerImage?: string | null) => {
      const newHeaderImage = headerImage ?? randomBannerImage();
      // Null is passed if we want to remove the image
      mutator.changeHeaderImage(board.id, board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
    },
    [board.id, board.fields.headerImage]
  );
  const onShowDescription = useCallback(
    () => mutator.showDescription(board.id, Boolean(board.fields.showDescription), true),
    [board.id, board.fields.showDescription]
  );
  const onHideDescription = useCallback(
    () => mutator.showDescription(board.id, Boolean(board.fields.showDescription), false),
    [board.id, board.fields.showDescription]
  );

  const intl = useIntl();

  return (
    <div className='ViewTitle'>
      <div className='add-buttons add-visible'>
        {!props.readOnly && !board.fields.headerImage && (
          <div className='add-buttons'>
            <Button
              onClick={() => setRandomHeaderImage()}
              icon={<ImageIcon fontSize='small' sx={{ marginRight: 1 }} />}
            >
              <FormattedMessage id='CardDetail.add-cover' defaultMessage='Add cover' />
            </Button>
          </div>
        )}
        {!props.readOnly && !pageIcon && (
          <Button
            onClick={onAddRandomIcon}
            icon={
              <EmojiEmotionsOutlinedIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='TableComponent.add-icon' defaultMessage='Add icon' />
          </Button>
        )}
        {!props.readOnly && board.fields.showDescription && (
          <Button
            onClick={onHideDescription}
            icon={
              <VisibilityOffOutlinedIcon
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='ViewTitle.hide-description' defaultMessage='hide description' />
          </Button>
        )}
        {!props.readOnly && !board.fields.showDescription && (
          <Button
            onClick={onShowDescription}
            icon={
              <VisibilityOutlinedIcon
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='ViewTitle.show-description' defaultMessage='show description' />
          </Button>
        )}
      </div>

      <Box mb={2} data-test='board-title'>
        <BlockIconSelector readOnly={props.readOnly} pageIcon={pageIcon} setPage={props.setPage} />
        <BoardTitleEditable
          value={title}
          placeholderText={intl.formatMessage({ id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board' })}
          onChange={(newTitle) => setTitle(newTitle)}
          saveOnEsc={true}
          onSave={onEditTitleSave}
          onCancel={onEditTitleCancel}
          readOnly={props.readOnly}
          spellCheck={true}
        />
      </Box>

      {board.fields.showDescription && (
        <div className='description'>
          <CharmEditor
            disablePageSpecificFeatures
            isContentControlled={true}
            content={board.fields.description}
            onContentChange={(content: ICharmEditorOutput) => {
              onDescriptionChange(content.doc);
            }}
            pageId={board.id}
            readOnly={props.readOnly}
          />
        </div>
      )}
    </div>
  );
}

export function InlineViewTitle(props: ViewTitleInlineProps) {
  const { pageTitle } = props;

  const [title, setTitle] = useState(pageTitle);
  const onEditTitleSave = useCallback(() => {
    props.setPage({ title });
  }, [title]);

  // cancel key events, such as "Delete" or "Backspace" so that prosemiror doesnt pick them up on inline dbs
  function cancelEvent(e: KeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  return (
    <Box mb={1} onKeyDown={cancelEvent}>
      <InlineBoardTitleEditable
        value={title}
        placeholderText='Untitled'
        onChange={(newTitle) => setTitle(newTitle)}
        saveOnEsc={true}
        onSave={onEditTitleSave}
        readOnly={props.readOnly}
        spellCheck={true}
      />
    </Box>
  );
}

export default React.memo(ViewTitle);
