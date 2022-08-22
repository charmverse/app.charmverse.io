import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: ExtendedPoap[];
    hiddenPoaps: ExtendedPoap[];
}

export interface UpdatePoapsRequest {
    newShownPoaps: ExtendedPoap[];
    newHiddenPoaps: ExtendedPoap[];
}
