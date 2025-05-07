export type TrackType = 'block_change' | 'format_change' | 'deletion' | 'insertion';

export interface TrackAttribute {
  user: string;
  username: string;
  date: string;
  type: TrackType;
  before?: { type: string; attrs: any } | string[];
  after?: { type: string; attrs: any } | string[];
}
