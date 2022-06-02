import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: Array<Partial<ExtendedPoap>>;
    hiddenPoaps: Array<Partial<ExtendedPoap>>;
}

