import { ReactNode, createContext, useContext, useMemo, Dispatch, SetStateAction } from 'react';
import { Page } from 'models';
import { blocks as blocksSeed } from 'seedData';
import { Block } from 'components/databases/focalboard/src/blocks/block';
import { useLocalStorage, getStorageValue } from './useLocalStorage';

type IContext = {
  blocks: Block[],
  setBlocks: Dispatch<SetStateAction<Block[]>>
};

export const DatabaseBlocksContext = createContext<Readonly<IContext>>({
  blocks: [],
  setBlocks: () => undefined
});

// temporary method until we use a real API
export function getDatabaseBlocks (): Block[] {
  return getStorageValue('database-blocks', blocksSeed);
}

export function DatabaseBlocksProvider ({ children }: { children: ReactNode }) {

  const [blocks, setBlocks] = useLocalStorage<Block[]>('database-blocks', blocksSeed);

  const value = useMemo(() => ({ blocks, setBlocks }), [blocks]);

  return (
    <DatabaseBlocksContext.Provider value={value}>
      {children}
    </DatabaseBlocksContext.Provider>
  );
}

export const useDatabaseBlocks = () => useContext(DatabaseBlocksContext);
