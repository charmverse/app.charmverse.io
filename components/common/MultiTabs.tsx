import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import * as React from 'react';

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value: React.ReactNode;
  index: number;
}

function TabPanel (props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component='div'>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

interface MultiTabsProps {
  tabs: [string, React.ReactNode][];
  disabled?: boolean;
}

export default function MultiTabs (props: MultiTabsProps) {
  const [value, setValue] = React.useState(0);
  const { tabs, disabled = false } = props;
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
      {
        tabs.map(([_, tabComponent], tabIndex) => (
          /* eslint-disable-next-line */
          <TabPanel value={value} index={tabIndex} key={tabIndex}>
            {tabComponent}
          </TabPanel>
        ))
      }
    </Box>
  );
}
