import type { SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import * as React from 'react';

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

type MultiTabsProps = {
  tabs: TabConfig[];
  disabled?: boolean;
  tabPanelSx?: SxProps;
};

export default function MultiTabs(props: MultiTabsProps) {
  const [value, setValue] = React.useState(0);
  const { tabs, disabled = false, tabPanelSx = {} } = props;
  const handleChange = (_: React.SyntheticEvent<Element, Event>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          indicatorColor={disabled ? 'secondary' : 'primary'}
          value={value}
          onChange={handleChange}
          aria-label='multi tabs'
        >
          {tabs.map(([tabLabel]) => (
            <Tab
              disabled={disabled}
              sx={{
                textTransform: 'initial'
              }}
              key={tabLabel}
              label={tabLabel}
            />
          ))}
        </Tabs>
      </Box>
      {tabs.map(([tabLabel, tabComponent, _props], tabIndex) => {
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
    </Box>
  );
}
