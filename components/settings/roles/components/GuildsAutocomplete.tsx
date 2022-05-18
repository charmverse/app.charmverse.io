import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';
import { Avatar, Box, ListItem, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { GetGuildsResponse } from '@guildxyz/sdk';

const LISTBOX_PADDING = 20; // px

type ItemData = [React.HTMLAttributes<HTMLLIElement>, GetGuildsResponse[0]];

function renderRow (props: {data: ItemData[], index: number, style: React.CSSProperties}) {
  const { data, index, style } = props;
  const [itemProps, guild] = data[index];
  const inlineStyle = {
    ...style,
    top: Number(style.top) + LISTBOX_PADDING
  };

  return (
    <ListItem
      {...itemProps}
      style={inlineStyle}
      sx={{
        display: 'flex'
      }}
    >
      <Box sx={{
        width: '100%'
      }}
      >
        <MenuItem
          component='div'
        >
          <ListItemIcon sx={{ mr: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }} src={guild.imageUrl?.startsWith('/') ? `https://guild.xyz${guild.imageUrl}` : guild.imageUrl} />
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
            <Box display='flex' gap={1}>
              <Typography variant='subtitle2' color='secondary'>
                {guild.memberCount} Members(s)
              </Typography>
              <Typography variant='subtitle2' color='secondary'>
                {guild.roles.length} Role(s)
              </Typography>
            </Box>
          </ListItemText>
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

function useResetCache (data: number) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef<HTMLDivElement, {children: ItemData[]}>((props, ref) => {
  const { children, ...other } = props;
  const itemData: ItemData[] = [];
  children.forEach((item) => {
    itemData.push(item);
  });

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true
  });

  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = () => {
    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList<ItemData[]>
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width='100%'
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType='ul'
          itemSize={() => getChildSize()}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

export default function GuildsAutocomplete ({ options }:{options: GetGuildsResponse}) {
  const guildNameRecord: Record<string, GetGuildsResponse[0]> = {};
  options.forEach(option => {
    guildNameRecord[option.name] = option;
  });

  return (
    <Autocomplete
      id='virtualize-demo'
      sx={{ width: 300 }}
      disableListWrap
      ListboxComponent={ListboxComponent as any}
      options={options.map(option => option.name)}
      renderInput={(params) => <TextField {...params} label='10,000 options' />}
      renderOption={(props, option) => [props, guildNameRecord[option]]}
    />
  );
}
