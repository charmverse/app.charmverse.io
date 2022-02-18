import { LocalStorageBountyService } from './BountyServiceLocalStorage';
import { PrismaBountyService } from './BountyServicePrisma';

// Provide a singleton export
export const BountyService = new LocalStorageBountyService();

export default BountyService;
