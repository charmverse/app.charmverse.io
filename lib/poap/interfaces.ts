import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: ExtendedPoap[];
    hiddenPoaps: ExtendedPoap[];
}
