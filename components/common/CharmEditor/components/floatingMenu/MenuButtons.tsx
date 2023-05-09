import { blockquote, bold, code, history, italic, link, strike, underline } from '@bangle.dev/base-components';
import type { Command, EditorState, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { filter, rafCommandExec } from '@bangle.dev/utils';
import { KeyboardArrowDown } from '@mui/icons-material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubbleOutline';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import { Box } from '@mui/material';
import React, { useCallback } from 'react';

import * as heading from '../heading';
import { createInlineComment } from '../inlineComment';
import paragraph from '../paragraph';
import { getCSSColor, queryActiveColor } from '../textColor/textColorUtils';

import type { SubMenu } from './floating-menu';
import { defaultKeys as floatingMenuKeys, toggleSubMenu, focusFloatingMenuInput } from './floating-menu';
import { MenuButton } from './Icon';
import {
  BoldIcon,
  CodeIcon,
  ComponentIcon,
  ItalicIcon,
  LinkIcon,
  ParagraphIcon,
  UndoIcon,
  HeadingIcon,
  TextColorIcon,
  UnderlineIcon,
  StrikeThroughIcon
} from './Icons';

const { defaultKeys: italicKeys, queryIsItalicActive, toggleItalic } = italic;
const { defaultKeys: historyKeys, undo, redo } = history;

const { defaultKeys: boldKeys, queryIsBoldActive, toggleBold } = bold;
const { defaultKeys: codeKeys, queryIsCodeActive, toggleCode } = code;
const { defaultKeys: underlineKeys, queryIsUnderlineActive, toggleUnderline } = underline;
const { defaultKeys: strikeKeys, queryIsStrikeActive, toggleStrike } = strike;
const { defaultKeys: paragraphKeys, queryIsTopLevelParagraph, convertToParagraph } = paragraph;
const { defaultKeys: headingKeys, queryIsHeadingActive, toggleHeading } = heading;

const { createLink, queryIsLinkActive } = link;
interface ButtonProps {
  hints?: string[];
  children?: React.ReactNode;
}

export function BoldButton({ hints = ['Bold', boldKeys.toggleBold], children = <BoldIcon /> }: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleBold()(view.state, view.dispatch, view)) {
        view.focus();
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!view.editable || !toggleBold()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function InlineActionButton({
  hints = [],
  children,
  menuKey,
  enable,
  subMenu,
  commandFn
}: ButtonProps & { commandFn: () => Command; subMenu: SubMenu; menuKey: PluginKey; enable: boolean }) {
  const view = useEditorViewContext();

  const onClick = useCallback(
    (e: any) => {
      e.preventDefault();
      const command = filter(
        (state: EditorState) => commandFn()(state),
        (_state, dispatch, _view) => {
          if (dispatch && _view) {
            toggleSubMenu(menuKey, subMenu)(_view.state, _view.dispatch, _view);
            rafCommandExec(_view, focusFloatingMenuInput(menuKey));
          }
          return true;
        }
      );
      if (command(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view, menuKey]
  );

  return (
    <MenuButton
      onClick={onClick}
      hints={hints}
      // Figure out when the button will be disabled
      isDisabled={!enable}
    >
      {children}
    </MenuButton>
  );
}

export function InlineCommentButton({
  hints = ['Comment'],
  children = (
    <ComponentIcon>
      <MessageOutlinedIcon sx={{ fontSize: 14 }} />
    </ComponentIcon>
  ),
  menuKey,
  enableComments
}: ButtonProps & { menuKey: PluginKey; enableComments: boolean }) {
  return (
    <InlineActionButton
      commandFn={createInlineComment}
      enable={enableComments}
      menuKey={menuKey}
      hints={hints}
      subMenu='inlineCommentSubMenu'
    >
      {children}
    </InlineActionButton>
  );
}

export function StrikeButton({
  hints = ['Strike', strikeKeys.toggleStrike],
  children = <StrikeThroughIcon />
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleStrike()(view.state, view.dispatch, view)) {
        view.focus();
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsStrikeActive()(view.state)}
      isDisabled={!view.editable || !toggleStrike()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function UnderlineButton({
  hints = ['Underline', underlineKeys.toggleUnderline],
  children = <UnderlineIcon />
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleUnderline()(view.state, view.dispatch, view)) {
        view.focus();
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsUnderlineActive()(view.state)}
      isDisabled={!view.editable || !toggleUnderline()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function CalloutButton({
  hints = ['Callout', blockquote.defaultKeys.wrapIn],
  children = (
    <ComponentIcon>
      <ChatBubbleIcon sx={{ fontSize: 14, marginTop: '2px' }} />
    </ComponentIcon>
  )
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (blockquote.commands.wrapInBlockquote()(view.state, view.dispatch, view)) {
        view.focus();
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={blockquote.commands.queryIsBlockquoteActive()(view.state)}
      isDisabled={!view.editable || !blockquote.commands.wrapInBlockquote()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function ItalicButton({ hints = ['Italic', italicKeys.toggleItalic], children = <ItalicIcon /> }: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleItalic()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!view.editable || !toggleItalic()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function UndoButton({ hints = ['Undo', historyKeys.undo], children = <UndoIcon /> }: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (undo()(view.state, view.dispatch)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view]
  );
  return (
    <MenuButton onClick={onSelect} hints={hints} isDisabled={!view.editable || !undo()(view.state)}>
      {children}
    </MenuButton>
  );
}

export function CodeButton({
  hints = ['Code', codeKeys.toggleCode],
  children = <CodeIcon fontSize={{ xs: 20, md: 16 }} />
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleCode()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsCodeActive()(view.state)}
      isDisabled={!view.editable || !toggleCode()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function HeadingButton({
  level,
  hints = [`Heading ${level}`, headingKeys[`toH${level}`] ?? '1'],
  children = <HeadingIcon level={level} />
}: ButtonProps & { level: number }) {
  const view = useEditorViewContext();

  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (toggleHeading(level)(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view, level]
  );
  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsHeadingActive(level)(view.state)}
      isDisabled={!view.editable || !toggleHeading(level)(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function ParagraphButton({
  hints = ['Paragraph', paragraphKeys.convertToParagraph],
  children = <ParagraphIcon />
}: ButtonProps) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e: any) => {
      e.preventDefault();
      if (convertToParagraph()(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view]
  );

  return (
    <MenuButton
      onClick={onSelect}
      hints={hints}
      isActive={queryIsTopLevelParagraph()(view.state)}
      isDisabled={!view.editable || !convertToParagraph()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function FloatingLinkButton({
  hints = ['Create a link', floatingMenuKeys.toggleLink],
  children = <LinkIcon />,
  menuKey
}: ButtonProps & { menuKey: PluginKey }) {
  const view = useEditorViewContext();

  const onClick = useCallback(
    (e: any) => {
      e.preventDefault();
      const command = filter(
        (state: EditorState) => createLink('')(state),
        (_state, dispatch, _view) => {
          if (dispatch && _view) {
            toggleSubMenu(menuKey, 'linkSubMenu')(_view.state, _view.dispatch, _view);
            rafCommandExec(_view, focusFloatingMenuInput(menuKey));
          }
          return true;
        }
      );
      if (command(view.state, view.dispatch, view)) {
        if (view.dispatch as any) {
          view.focus();
        }
      }
    },
    [view, menuKey]
  );

  return (
    <MenuButton
      onClick={onClick}
      hints={hints}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!view.editable || !createLink('')(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function TextColorButton({ hints = ['Text color'], children }: ButtonProps) {
  const view = useEditorViewContext();
  const activeColor = queryActiveColor()(view.state);
  let sx = {};
  if (activeColor?.color) {
    sx = { color: getCSSColor('text', activeColor.color) };
  } else if (activeColor?.bgColor) {
    sx = { backgroundColor: getCSSColor('bg', activeColor.bgColor), borderRadius: 1 };
  }
  return (
    <MenuButton hints={hints} isDisabled={!view.editable}>
      <Box sx={sx}>
        <TextColorIcon />
      </Box>
      <KeyboardArrowDown sx={{ fontSize: 16 }} />
    </MenuButton>
  );
}
