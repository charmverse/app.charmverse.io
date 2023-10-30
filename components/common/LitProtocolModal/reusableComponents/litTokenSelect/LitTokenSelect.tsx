import styled from '@emotion/styled';
import { MenuItem, Autocomplete, ListItemIcon, ListItemText, TextField } from '@mui/material';
import { createContext, useEffect, useRef, forwardRef, useContext } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { VariableSizeList } from 'react-window';

import { ShareModalContext } from '../../shareModal/createShareContext';

type TokenOption = {
  label: string;
  symbol: string;
  value: string;
  logo: string;
};

type Props = {
  label: string;
  setSelectedToken: (token: TokenOption) => void;
  selectedToken: TokenOption;
  allowEthereum?: boolean;
};

// based on https://mui.com/material-ui/react-autocomplete/
const OuterElementContext = createContext({});

const OuterElementType = forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: number) {
  const ref = useRef<VariableSizeList>(null);
  useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}
const LISTBOX_PADDING = 8;

type ItemData = [React.HTMLAttributes<HTMLLIElement>, TokenOption];
// Adapter for react-window
const ListboxComponent = forwardRef<HTMLDivElement, { children: ItemData[] }>((props, ref) => {
  const { children, ...other } = props;
  const itemData: ItemData[] = [];
  children.forEach((item) => {
    itemData.push(item);
  });

  const itemCount = itemData.length;
  const itemSize = 54;

  const gridRef = useResetCache(itemCount);

  const getHeight = () => {
    if (itemCount > LISTBOX_PADDING) {
      return LISTBOX_PADDING * itemSize;
    }
    return itemData.reduce((a, b) => a + itemSize, 0);
  };

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
          itemSize={() => itemSize}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const IconImage = styled.img`
  max-width: 20px;
  height: auto;
`;

function renderRow(props: ListChildComponentProps) {
  // { data: ItemData[]; index: number; style: React.CSSProperties }) {
  const { data, index, style } = props;
  const [itemProps, option] = data[index] as ItemData;
  const inlineStyle = {
    ...style,
    top: Number(style.top) + LISTBOX_PADDING
  };

  return (
    <MenuItem dense {...itemProps} style={inlineStyle}>
      <ListItemIcon>
        <IconImage src={option.logo} />
      </ListItemIcon>
      <ListItemText secondary={option.symbol}>{option.label}</ListItemText>
    </MenuItem>
  );
}

function LitTokenSelect({ setSelectedToken }: Props) {
  const { tokenList } = useContext(ShareModalContext);

  const tokenSelectRows = tokenList.map((t) => ({
    label: t.name,
    value: t.address,
    standard: t.standard,
    logo: t.logoURI,
    symbol: t.symbol
  }));

  return (
    <Autocomplete
      ListboxComponent={ListboxComponent as any}
      options={tokenSelectRows}
      getOptionLabel={(option) => option.label}
      onChange={(e, value) => value && setSelectedToken(value)}
      renderInput={(params) => <TextField {...params} placeholder='Search for a token or NFT' variant='outlined' />}
      renderOption={(props, option, state) => [props, option, state.index] as React.ReactNode}
    />
  );
}

export default LitTokenSelect;
