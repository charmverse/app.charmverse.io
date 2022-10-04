/* eslint-disable max-len */
import styled from '@emotion/styled';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import dynamic from 'next/dynamic';
import type { KeyboardEvent } from 'react';
import React, { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import type { Page, PageContent } from 'models';

import { BlockIcons } from '../blockIcons';
import type { Board } from '../blocks/board';
import mutator from '../mutator';
import Button from '../widgets/buttons/button';
import Editable from '../widgets/editable';

import BlockIconSelector from './blockIconSelector';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

const StyledEditable = styled(Editable)`
  font-size: 22px !important;
`;

type Props = {
  board: Board;
  readOnly: boolean;
  setPage: (page: Partial<Page>) => void;
}

function ViewTitle (props: Props) {
  const { board } = props;

  const [title, setTitle] = useState(board.title);
  const onEditTitleSave = useCallback(() => {
    mutator.changeTitle(board.id, board.title, title);
    props.setPage({ title });
  }, [board.id, board.title, title]);
  const onEditTitleCancel = useCallback(() => {
    setTitle(board.title);
    props.setPage({ title: board.title });
  }, [board.title]);
  const onDescriptionChange = useCallback((text: PageContent) => mutator.changeDescription(board.id, board.fields.description, text), [board.id, board.fields.description]);
  const onAddRandomIcon = useCallback(() => {
    const newIcon = BlockIcons.shared.randomIcon();
    mutator.changeIcon(board.id, board.fields.icon, newIcon);
    return newIcon;
  }, [board.id, board.fields.icon]);
  const setRandomHeaderImage = useCallback((headerImage?: string | null) => {
    const newHeaderImage = headerImage ?? randomBannerImage();
    // Null is passed if we want to remove the image
    mutator.changeHeaderImage(board.id, board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
  }, [board.id, board.fields.headerImage]);
  const onShowDescription = useCallback(() => mutator.showDescription(board.id, Boolean(board.fields.showDescription), true), [board.id, board.fields.showDescription]);
  const onHideDescription = useCallback(() => mutator.showDescription(board.id, Boolean(board.fields.showDescription), false), [board.id, board.fields.showDescription]);

  const intl = useIntl();

  return (
    <div className='ViewTitle'>
      <div className='add-buttons add-visible'>
        {!props.readOnly && !board.fields.headerImage
          && (
            <div className='add-buttons'>
              <Button
                onClick={() => setRandomHeaderImage()}
                icon={(
                  <ImageIcon
                    fontSize='small'
                    sx={{ marginRight: 1 }}
                  />
                )}
              >
                <FormattedMessage
                  id='CardDetail.add-cover'
                  defaultMessage='Add cover'
                />
              </Button>
            </div>
          )}
        {!props.readOnly && !board.fields.icon
          && (
            <Button
              onClick={() => {
                props.setPage({ icon: onAddRandomIcon() });
              }}
              icon={(
                <EmojiEmotionsOutlinedIcon
                  fontSize='small'
                  sx={{
                    mr: 1
                  }}
                />
              )}
            >
              <FormattedMessage
                id='TableComponent.add-icon'
                defaultMessage='Add icon'
              />
            </Button>
          )}
        {!props.readOnly && board.fields.showDescription
          && (
            <Button
              onClick={onHideDescription}
              icon={(
                <VisibilityOffOutlinedIcon sx={{
                  mr: 1
                }}
                />
              )}
            >
              <FormattedMessage
                id='ViewTitle.hide-description'
                defaultMessage='hide description'
              />
            </Button>
          )}
        {!props.readOnly && !board.fields.showDescription
          && (
            <Button
              onClick={onShowDescription}
              icon={(
                <VisibilityOutlinedIcon sx={{
                  mr: 1
                }}
                />
              )}
            >
              <FormattedMessage
                id='ViewTitle.show-description'
                defaultMessage='show description'
              />
            </Button>
          )}
      </div>

      <div className='title' data-test='board-title'>
        <BlockIconSelector readOnly={props.readOnly} block={board} setPage={props.setPage} />
        <Editable
          className='title'
          value={title}
          placeholderText={intl.formatMessage({ id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board' })}
          onChange={(newTitle) => setTitle(newTitle)}
          saveOnEsc={true}
          onSave={onEditTitleSave}
          onCancel={onEditTitleCancel}
          readOnly={props.readOnly}
          spellCheck={true}
        />
      </div>

      {board.fields.showDescription
        && (
          <div className='description'>
            <CharmEditor
              disablePageSpecificFeatures
              content={board.fields.description}
              onContentChange={(content: ICharmEditorOutput) => {
                onDescriptionChange(content.doc);
              }}
              pageId={board.id}
            />
          </div>
        )}
    </div>
  );
}

export function InlineViewTitle (props: Props) {

  const { board } = props;

  const [title, setTitle] = useState(board.title);
  const onEditTitleSave = useCallback(() => {
    mutator.changeTitle(board.id, board.title, title);
    props.setPage({ title });
  }, [board.id, board.title, title]);

  // cancel key events, such as "Delete" or "Backspace" so that prosemiror doesnt pick them up on inline dbs
  function cancelEvent (e: KeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  return (
    <div onKeyDown={cancelEvent}>
      <StyledEditable
        className='title'
        value={title}
        placeholderText='Untitled'
        onChange={(newTitle) => setTitle(newTitle)}
        saveOnEsc={true}
        onSave={onEditTitleSave}
        readOnly={props.readOnly}
        spellCheck={true}
      />
    </div>
  );
}

export default React.memo(ViewTitle);
