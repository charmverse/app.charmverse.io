import { buildSchema } from './buildSchema';
import { bulletList } from './specs/bulletList';
import { listItem } from './specs/listItem';

export const schema = buildSchema([bulletList, listItem]);
