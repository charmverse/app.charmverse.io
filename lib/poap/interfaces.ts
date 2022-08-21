import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: Array<ExtendedPoap>;
    hiddenPoaps: Array<ExtendedPoap>;
}

export interface UpdatePoapsRequest {
    newShownPoaps: Array<ExtendedPoap>;
    newHiddenPoaps: Array<ExtendedPoap>;
}
