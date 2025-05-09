import type { BoxProps, SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useEffect } from 'react';

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value: React.ReactNode;
  index: number;
  label: string;
  sx?: SxProps;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, label, sx = {}, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`tabpanel-${label}-${index}`}
      aria-labelledby={`tab-${label}-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, ...sx }}>
          <Typography component='div'>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export type TabConfig = [string, React.ReactNode, { sx?: SxProps }?];

type MultiTabsProps<T extends string> = {
  tabs: TabConfig[] | T[];
  disabled?: boolean;
  fullWidthTabs?: boolean;
  tabPanelSx?: SxProps;
  children?: (props: { index: number; value: T }) => React.ReactNode;
  // allow for controlled tab
  activeTab?: number;
  setActiveTab?: (tabIndex: number) => void;
  endAdornmentComponent?: React.ReactNode;
} & Omit<BoxProps, 'children'>;

/**
 * Note: try to use the 'children' prop when possible. It is less logic, easier to compose and customize. Example:
 * <MultiTabs tabs=['tab1', 'tab2']>
 *  {({ index, value }) => (
 *   <Box p={3}>
 *    {value === 'tab1' && <div>tab1 content</div>}
 *    {value === 'tab2' && <div>tab2 content</div>}
 *   </Box>
 * )}
 * </MultiTabs>
 */
export default function MultiTabs<T extends string>(props: MultiTabsProps<T>) {
  const [value, setValue] = React.useState<number>(0);
  const {
    tabs,
    children,
    disabled = false,
    tabPanelSx = {},
    activeTab,
    endAdornmentComponent,
    setActiveTab,
    fullWidthTabs,
    ...boxProps
  } = props;

  function handleChange(_: React.SyntheticEvent<Element, Event>, newValue: number) {
    setValue(newValue);
    setActiveTab?.(newValue);
  }

  useEffect(() => {
    if (typeof activeTab !== 'undefined') {
      setValue(activeTab);
    }
  }, [activeTab]);

  const tabsWithComponents = tabs.filter((element): element is TabConfig => typeof element !== 'string');
  // lie about the type for TabConfig to make TS happy. The type is only important when using the children prop, in which tabs is a list of strings
  const tabLabels: T[] = tabs.map((element) => (typeof element === 'string' ? element : (element[0] as T)));

  return (
    <Box sx={{ width: '100%' }} {...boxProps}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <Tabs
          indicatorColor={disabled ? 'secondary' : 'primary'}
          value={value}
          onChange={handleChange}
          variant={fullWidthTabs ? 'fullWidth' : 'standard'}
          sx={{
            // for some reason, variant='fullWidth' does not work on its own
            width: fullWidthTabs ? '100%' : 'auto'
          }}
        >
          {tabLabels.map((tabLabel) => (
            <Tab
              disabled={disabled}
              sx={{
                textTransform: 'initial'
              }}
              key={tabLabel}
              label={tabLabel}
              data-test={`${tabLabel}-tab`}
            />
          ))}
        </Tabs>
        {endAdornmentComponent}
      </Box>
      {tabsWithComponents.map(([tabLabel, tabComponent, _props], tabIndex) => {
        const sxProps = _props?.sx ?? ({} as SxProps);
        return (
          /* eslint-disable-next-line */
          <TabPanel
            value={value}
            label={tabLabel}
            sx={{ ...tabPanelSx, ...sxProps } as SxProps}
            index={tabIndex}
            // eslint-disable-next-line react/no-array-index-key
            key={tabIndex}
          >
            {tabComponent}
          </TabPanel>
        );
      })}
      {children && children({ index: value, value: tabLabels[value] })}
    </Box>
  );
}
