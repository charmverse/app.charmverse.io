import type { PageMeta } from '@charmverse/core/pages';
import { MoreHoriz } from '@mui/icons-material';
import { Divider, ListItemIcon, MenuItem, Typography, Box } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { PagesList } from 'components/common/PagesList';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import { safeScrollIntoViewIfNeeded } from 'lib/utils/browser';
import { sanitizeForRegex } from 'lib/utils/strings';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { MentionPluginState } from '../mention.interfaces';
import { selectMention } from '../mention.utils';

export function _MentionsPopup({ pluginKey }: { pluginKey: PluginKey<MentionPluginState> }) {
  const { suggestTooltipKey } = usePluginState(pluginKey) as MentionPluginState;
  const { show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  if (isVisible) {
    return <MentionsMenu pluginKey={pluginKey} />;
  }
  return null;
}

const DEFAULT_ITEM_LIMIT = 5;

function MentionsMenu({ pluginKey }: { pluginKey: PluginKey }) {
  const { members } = useMembers();
  const { roles = [] } = useRoles();
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey);
  const { show: isVisible, triggerText, counter } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  const { pages } = usePages();
  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(pluginKey, value, type)(view.state, view.dispatch, view);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    },
    [view, pluginKey]
  );

  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const searchText = sanitizeForRegex(triggerText).toLowerCase();
  const filteredMembers = useMemo(
    () =>
      searchText.length !== 0
        ? members.filter((member) => filterByUsername(member, searchText) || filterByDiscordName(member, searchText))
        : members,
    [members, searchText, searchText]
  );

  const filteredPages = useMemo<PageMeta[]>(
    () =>
      Object.values(pages).filter(
        (page) => page && !page.deletedAt && (!triggerText || page.title?.toLowerCase().startsWith(searchText))
      ) as PageMeta[],
    [pages, searchText]
  );

  const filteredRoles = useMemo<{ name: string; id: string }[]>(
    () =>
      [
        {
          name: 'Admin',
          id: 'admin'
        },
        {
          name: 'Everyone',
          id: 'everyone'
        },
        ...(roles ?? [])
      ].filter((role) => role.name.toLowerCase().startsWith(searchText)) ?? [],
    [roles, searchText]
  );

  const visibleFilteredMembers = showAllMembers ? filteredMembers : filteredMembers.slice(0, DEFAULT_ITEM_LIMIT);
  const visibleFilteredPages = showAllPages ? filteredPages : filteredPages.slice(0, DEFAULT_ITEM_LIMIT);
  const visibleFilteredRoles = showAllRoles ? filteredRoles : filteredRoles.slice(0, DEFAULT_ITEM_LIMIT);
  const totalItems = filteredRoles.length + filteredMembers.length + filteredPages.length;
  const roundedCounter = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;
  const selectedGroup =
    roundedCounter < filteredMembers.length
      ? 'members'
      : roundedCounter < filteredMembers.length + filteredPages.length
      ? 'pages'
      : 'roles';

  const activeItemIndex =
    selectedGroup === 'members'
      ? roundedCounter
      : selectedGroup === 'pages'
      ? roundedCounter - filteredMembers.length
      : roundedCounter - filteredMembers.length - filteredPages.length;

  function showAllMembersToggle() {
    setShowAllMembers(true);
  }

  function showAllPagesToggle() {
    setShowAllPages(true);
  }

  function showAllRolesToggle() {
    setShowAllRoles(true);
  }

  const hiddenPagesCount = filteredPages.length - DEFAULT_ITEM_LIMIT;
  const hiddenMembersCount = filteredMembers.length - DEFAULT_ITEM_LIMIT;
  const hiddenRolesCount = filteredRoles.length - DEFAULT_ITEM_LIMIT;

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);

  return (
    <PopoverMenu
      container={tooltipContentDOM}
      maxHeight='300px'
      isOpen={isVisible}
      onClose={() => {
        hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
      }}
      width={350}
    >
      <Box
        sx={{
          py: 1
        }}
      >
        <GroupLabel>Members</GroupLabel>
        {filteredMembers.length === 0 ? (
          <Typography sx={{ ml: 2 }} variant='subtitle2' color='secondary'>
            No members found
          </Typography>
        ) : (
          <div>
            {visibleFilteredMembers.map((member, memberIndex) => {
              const isSelected = selectedGroup === 'members' ? activeItemIndex === memberIndex : false;
              return (
                <MenuItem
                  component='div'
                  onClick={() => onSelectMention(member.id, 'user')}
                  key={member.id}
                  selected={isSelected}
                  data-value={member.id}
                  data-type='user'
                  className={isSelected ? 'mention-selected' : ''}
                >
                  <UserDisplay fontSize={14} userId={member.id} avatarSize='small' />
                </MenuItem>
              );
            })}
            {!showAllMembers && hiddenMembersCount > 0 && (
              <ShowMoreMenuItem onClick={showAllMembersToggle}>{hiddenMembersCount} more results</ShowMoreMenuItem>
            )}
          </div>
        )}
        <Divider
          sx={{
            my: 1
          }}
        />
        <GroupLabel>Link to page</GroupLabel>
        <PagesList
          activeItemIndex={selectedGroup === 'pages' ? activeItemIndex : -1}
          pages={visibleFilteredPages}
          onSelectPage={(pageId) => onSelectMention(pageId, 'page')}
        />

        {!showAllPages && hiddenPagesCount > 0 && (
          <ShowMoreMenuItem onClick={showAllPagesToggle}>{hiddenPagesCount} more results</ShowMoreMenuItem>
        )}
        <Divider
          sx={{
            my: 1
          }}
        />
        <GroupLabel>Roles</GroupLabel>
        {filteredRoles.length === 0 ? (
          <Typography sx={{ ml: 2 }} variant='subtitle2' color='secondary'>
            No roles found
          </Typography>
        ) : (
          <div>
            {visibleFilteredRoles.map((role, roleIndex) => {
              const isSelected = selectedGroup === 'roles' ? activeItemIndex === roleIndex : false;
              return (
                <MenuItem
                  component='div'
                  key={role.id}
                  selected={isSelected}
                  data-value={role.id}
                  data-type='role'
                  onClick={() => onSelectMention(role.id, 'role')}
                  className={isSelected ? 'mention-selected' : ''}
                >
                  <Typography fontSize={14}>{role.name}</Typography>
                </MenuItem>
              );
            })}
            {!showAllRoles && hiddenRolesCount > 0 && (
              <ShowMoreMenuItem onClick={showAllRolesToggle}>{hiddenRolesCount} more results</ShowMoreMenuItem>
            )}
          </div>
        )}
      </Box>
    </PopoverMenu>
  );
}

function ShowMoreMenuItem({ onClick, children }: { onClick: VoidFunction; children: React.ReactNode }) {
  return (
    <MenuItem component='div' onClick={onClick}>
      <ListItemIcon>
        <MoreHoriz color='secondary' />
      </ListItemIcon>
      <Typography color='secondary'>{children}</Typography>
    </MenuItem>
  );
}

function filterByDiscordName(member: Member, searchText: string) {
  return (member.profile?.social as Record<string, string>)?.discordUsername
    ?.toString()
    .toLowerCase()
    .match(searchText);
}

function filterByUsername(member: Member, searchText: string) {
  return member.username.toLowerCase().match(searchText);
}

export const MentionsPopup = memo(_MentionsPopup);
