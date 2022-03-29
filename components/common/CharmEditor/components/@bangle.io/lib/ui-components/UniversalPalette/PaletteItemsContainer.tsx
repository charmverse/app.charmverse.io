import React, { ReactNode } from 'react';

export function PaletteItemsContainer({ children }: { children: ReactNode }) {
  return (
    <div
      className="universal-palette-items-container"
      style={{
        overflowY: 'scroll',
      }}
    >
      {children}
    </div>
  );
}
