import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import { ListItemText, MenuItem } from '@mui/material';

import { PropertyMenu } from './PropertyMenu';

export function ArchiveProposals({ onChange }: { onChange: (value: boolean) => void }) {
  return (
    <PropertyMenu
      lastChild={false}
      // add fontSize to icon to override MUI styles
      propertyTemplate={{ icon: <InventoryIcon sx={{ fontSize: '16px !important' }} />, name: 'Archive' }}
    >
      <MenuItem onClick={() => onChange(true)}>
        <ListItemText primary='Archive' />
      </MenuItem>
      <MenuItem onClick={() => onChange(false)}>
        <ListItemText primary='Unarchive' />
      </MenuItem>
    </PropertyMenu>
  );
}
