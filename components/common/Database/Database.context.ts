import { createContext, useContext } from 'react';
import { Column, Row, View } from './interfaces';

export interface DatabaseContext {
  fields: Column[];
  rows: Row[];
  views: View[];
}

export const DatabaseContext = createContext<DatabaseContext>({
  fields: [],
  rows: [],
  views: []
});

export const useDatabase = () => useContext(DatabaseContext);
