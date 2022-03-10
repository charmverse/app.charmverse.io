import { PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { selectEmoji } from 'components/editor/@bangle.dev/react-emoji-suggest/emoji-suggest';
import GroupLabel from 'components/editor/GroupLabel';
import { useCallback, useMemo } from 'react';

const StyledEmojiSuggest = styled(Box)`
  height: 350px;
  overflow: hidden;
  width: fit-content;
  background-color: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)}
`;

export function EmojiSuggest({
  emojiSuggestKey,
}: {
  emojiSuggestKey: PluginKey;
}) {
  const view = useEditorViewContext();
  
  const {
    getEmojiGroups,
    maxItems,
    suggestTooltipKey,
  } = usePluginState(emojiSuggestKey);

  const {
    triggerText,
    show: isVisible,
  } = usePluginState(suggestTooltipKey);

  const emojiGroups = useMemo<Array<{name: string, emojis: string[]}>>(
    () => getEmojiGroups(triggerText),
    [getEmojiGroups, triggerText],
  );
  const theme = useTheme();
  
  function closeTooltip () {
    if (view.dispatch!) {
      view.dispatch(
        // Chain transactions together
        view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
      );
    }
  }

  const onSelectEmoji = useCallback(
    (emojiAlias: string) => {
      selectEmoji(emojiSuggestKey, emojiAlias)(view.state, view.dispatch, view);
      closeTooltip()
    },
    [view, emojiSuggestKey],
  );

  return isVisible && (
    <div
      className="bangle-emoji-suggest-container"
      style={{
        width: "100%"
      }}
    >
      <ClickAwayListener onClickAway={closeTooltip}>
        <Box sx={{height: 400, overflowX: "hidden"}}>
          {emojiGroups.map(({ name: groupName, emojis }, i) => {
            return (
              <Box p={1} className="bangle-emoji-suggest-group" key={groupName || i}>
                <GroupLabel sx={{
                  margin: 1
                }} label={groupName} />
                <Box sx={{
                  marginBottom: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                  {emojis.slice(0, maxItems).map(([emojiAlias, emoji]) => (
                    <Box
                      key={emojiAlias}
                      className={`bangle-emoji-square`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectEmoji(emojiAlias);
                      }}
                    >
                      <span>
                        {emoji}
                      </span>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </ClickAwayListener>
    </div>
  )
}