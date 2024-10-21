import { stringUtils } from '@charmverse/core/utilities';
import type { Guild } from '@guildxyz/types';
import { Avatar, Box, ListItem, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { VariableSizeList } from 'react-window';

import { guild as guildSDK } from 'lib/guild-xyz/client';

const LISTBOX_PADDING = 8;

type ItemData = [React.HTMLAttributes<HTMLLIElement>, Guild];

function GuildRow(props: { data: ItemData[]; index: number; style: React.CSSProperties }) {
  const { data, index, style } = props;
  const [itemProps, guild] = data[index];
  const [roles, setRoles] = useState<number[] | null>(null);
  const inlineStyle = {
    ...style,
    top: Number(style.top) + LISTBOX_PADDING
  };

  useEffect(() => {
    async function main() {
      const result = await guildSDK.role.getAll(guild.id);
      setRoles(result.map((r) => r.id));
    }
    main();
  }, []);

  return (
    <ListItem
      {...itemProps}
      style={inlineStyle}
      sx={{
        display: 'flex'
      }}
    >
      {/** This div is required to remove the weird hover style for menu item */}
      <Box width='100%'>
        <MenuItem
          component='div'
          sx={{
            '&:hover': {
              background: 'inherit'
            },
            display: 'flex',
            justifyContent: 'space-around'
          }}
        >
          <Box display='flex' flexGrow={1} gap={1} alignItems='center'>
            <ListItemIcon>
              <Avatar
                alt={guild.name}
                sx={{ width: 32, height: 32 }}
                src={
                  guild.imageUrl?.startsWith('/') ? `https://guild.xyz${guild.imageUrl}` : (guild.imageUrl ?? undefined)
                }
              />
            </ListItemIcon>
            <ListItemText
              secondary={guild.urlName}
              sx={{
                '& .MuiTypography-root': {
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'row'
                }
              }}
            >
              {guild.name}
            </ListItemText>
          </Box>
          <Box display='flex' gap={1}>
            {roles && (
              <Typography variant='subtitle2' color='secondary'>
                {roles.length} {stringUtils.conditionalPlural({ count: roles.length, word: 'Role' })}
              </Typography>
            )}
          </Box>
        </MenuItem>
      </Box>
    </ListItem>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: number) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef<HTMLDivElement, { children: ItemData[] }>((props, ref) => {
  const { children, ...other } = props;
  const itemData: ItemData[] = [];
  children.forEach((item) => {
    itemData.push(item);
  });

  const itemCount = itemData.length;
  const itemSize = 54;

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList<ItemData[]>
          itemData={itemData}
          height={
            (itemCount > 8 ? LISTBOX_PADDING * itemSize : itemData.reduce((prev) => prev + itemSize, 0)) +
            2 * LISTBOX_PADDING
          }
          width='100%'
          ref={gridRef}
          outerElementType={OuterElementType}
          itemSize={() => itemSize}
          overscanCount={5}
          itemCount={itemCount}
        >
          {(_props) => <GuildRow {..._props} />}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

export default function GuildsAutocomplete({
  disabled,
  selectedGuildIds,
  onChange,
  guilds
}: {
  disabled: boolean;
  onChange: (guildIds: number[]) => void;
  selectedGuildIds: number[];
  guilds: Guild[];
}) {
  const guildRecord = React.useMemo(() => {
    return guilds.reduce<Record<string, Guild>>(
      (record, guild) => ({
        ...record,
        [guild.name]: guild,
        [guild.id]: guild
      }),
      {}
    );
  }, [guilds]);

  return (
    <Autocomplete
      disabled={disabled}
      multiple
      disableListWrap
      getOptionLabel={(guild) => guild}
      ListboxComponent={ListboxComponent as any}
      options={guilds.map((guild) => guild.name)}
      filterSelectedOptions
      value={selectedGuildIds.map((selectedGuildId) => guildRecord[selectedGuildId].name)}
      onChange={(_, guildNames) => {
        onChange(guildNames.map((guildName) => guildRecord[guildName].id));
      }}
      renderInput={(params) => (
        <TextField
          variant='outlined'
          {...params}
          sx={{
            '& .MuiInputLabel-root': {
              position: 'relative',
              top: 5
            }
          }}
          placeholder='Type Guild name...'
        />
      )}
      // @ts-ignore follows the example on MUI's site for virtualized autocomplete
      renderOption={(props, guildName) => [props, guildRecord[guildName]]}
    />
  );
}
