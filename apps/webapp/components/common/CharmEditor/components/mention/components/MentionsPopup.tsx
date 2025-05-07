import { MoreHoriz } from '@mui/icons-material';
import { Divider, ListItemIcon, MenuItem, Typography, Box } from '@mui/material';
import { sanitizeForRegex } from '@packages/utils/strings';
import type { PluginKey } from 'prosemirror-state';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { PagesList } from 'components/common/PagesList';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import { useRootPages } from 'hooks/useRootPages';
import { useSearchPages } from 'hooks/useSearchPages';
import type { Member } from '@packages/lib/members/interfaces';
import { safeScrollIntoViewIfNeeded } from '@packages/lib/utils/browser';

import { useEditorViewContext, usePluginState } from '../../@bangle.dev/react/hooks';
import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggestTooltipPlugin';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggestTooltipSpec';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { MentionPluginState } from '../mention.interfaces';
import { selectMention } from '../mention.utils';

function _MentionsPopup({ pluginKey, pageId }: { pluginKey: PluginKey<MentionPluginState>; pageId?: string }) {
  const { suggestTooltipKey } = usePluginState(pluginKey) as MentionPluginState;
  const { show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  if (isVisible) {
    return <MentionsMenu pageId={pageId} pluginKey={pluginKey} />;
  }
  return null;
}

const DEFAULT_ITEM_LIMIT = 5;

function MentionsMenu({ pluginKey, pageId }: { pluginKey: PluginKey; pageId?: string }) {
  const { members } = useMembers();
  const { rootPages } = useRootPages();
  const { roles = [] } = useRoles();
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey);
  const { show: isVisible, triggerText, counter } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
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
  const searchText = useMemo(() => {
    return sanitizeForRegex(triggerText).trim().toLowerCase();
  }, [triggerText]);
  const { results: searchResult } = useSearchPages({ search: searchText, limit: 50 });
  const filteredMembers = useMemo(
    () =>
      searchText.length !== 0
        ? members.filter((member) => filterByUsername(member, searchText) || filterByDiscordName(member, searchText))
        : members,
    [members, searchText]
  );

  const pageOptions = useMemo(() => {
    if (triggerText) {
      // exclude this page from results
      return searchResult.filter((r) => r.id !== pageId);
    }
    return rootPages;
  }, [triggerText, searchResult, rootPages]);

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
  const visibleFilteredPages = showAllPages ? pageOptions : pageOptions.slice(0, DEFAULT_ITEM_LIMIT);
  const visibleFilteredRoles = showAllRoles ? filteredRoles : filteredRoles.slice(0, DEFAULT_ITEM_LIMIT);
  const totalItems = filteredRoles.length + filteredMembers.length + pageOptions.length;
  const roundedCounter = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;
  const selectedGroup =
    roundedCounter < filteredMembers.length
      ? 'members'
      : roundedCounter < filteredMembers.length + pageOptions.length
        ? 'pages'
        : 'roles';

  const activeItemIndex =
    selectedGroup === 'members'
      ? roundedCounter
      : selectedGroup === 'pages'
        ? roundedCounter - filteredMembers.length
        : roundedCounter - filteredMembers.length - pageOptions.length;

  function showAllMembersToggle() {
    setShowAllMembers(true);
  }

  function showAllPagesToggle() {
    setShowAllPages(true);
  }

  function showAllRolesToggle() {
    setShowAllRoles(true);
  }

  const hiddenPagesCount = pageOptions.length - DEFAULT_ITEM_LIMIT;
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
          onSelectPage={(_pageId) => onSelectMention(_pageId, 'page')}
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
