import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';

import { PropertyMenu } from './PropertyMenu';

export function ArchiveProposals({ onChange }: { onChange: (value: boolean) => void }) {
  return (
    <PropertyMenu lastChild={false} propertyTemplate={{ name: 'Archive' }}>
      <MenuItem onClick={() => onChange(true)}>
        {/* <ListItemIcon>
          <InventoryIcon fontSize='small' />
        </ListItemIcon> */}
        <ListItemText primary='Archive' />
      </MenuItem>
      <MenuItem onClick={() => onChange(false)}>
        {/* <ListItemIcon>
          <InventoryIcon fontSize='small' />
        </ListItemIcon> */}
        <ListItemText primary='Unarchive' />
      </MenuItem>
    </PropertyMenu>
  );
}
