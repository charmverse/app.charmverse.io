import type { SpaceDataExport } from './exportSpaceData';

export type ImportParams = {
  targetSpaceIdOrDomain: string;
  exportData?: SpaceDataExport;
  exportName?: string;
};
