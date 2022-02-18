import { ReactNode, createContext, useContext, useEffect, useState, useMemo, Dispatch, SetStateAction } from 'react';
import { Block } from 'components/databases/focalboard/src/blocks/block';
import charmClient from 'charmClient';

type IContext = {
  blocks: Block[],
  setBlocks: Dispatch<SetStateAction<Block[]>>
};

export const DatabaseBlocksContext = createContext<Readonly<IContext>>({
  blocks: [],
  setBlocks: () => undefined
});

export function DatabaseBlocksProvider ({ children }: { children: ReactNode }) {

  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    charmClient.getAllBlocks()
      .then(_blocks => {
        setBlocks(_blocks);
      })
      .catch(err => {});
  }, []);

  const value = useMemo(() => ({ blocks, setBlocks }), [blocks]);

  return (
    <DatabaseBlocksContext.Provider value={value}>
      {children}
    </DatabaseBlocksContext.Provider>
  );
}

export const useDatabaseBlocks = () => useContext(DatabaseBlocksContext);
