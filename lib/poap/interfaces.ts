import { ProfileItem } from '@prisma/client';
import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: ExtendedPoap[];
    hiddenPoaps: ExtendedPoap[];
}

export interface UpdatePoapsRequest {
    newShownPoaps: ProfileItem[];
    newHiddenPoaps: ProfileItem[];
}
