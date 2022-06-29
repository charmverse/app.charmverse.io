
import { DatabaseContext } from './Database.context';

export default function Database (props: DatabaseContext) {

  return (
    <DatabaseContext.Provider value={props}>
      <span>hello!</span>
    </DatabaseContext.Provider>
  );
}
