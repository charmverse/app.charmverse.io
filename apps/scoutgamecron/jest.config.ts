import { createDefaultEsmPreset, pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

export default {
  ...createDefaultEsmPreset()
};
