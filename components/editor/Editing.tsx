import { Box } from '@mui/system';
import React, { ReactNode, useState } from 'react';

export const EditingContext = React.createContext<{
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}>({
  isEditing: true,
  setIsEditing: () => {}
});

export function Editing (props: {children: ReactNode}) {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <Box>
      <EditingContext.Provider value={{
        isEditing, setIsEditing
      }}
      >
        {props.children}
      </EditingContext.Provider>
    </Box>
  );
}
