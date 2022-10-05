import type { BountyPermission } from '@prisma/client';
import { v4 } from 'uuid';

import { mapBountyPermissions } from '../mapBountyPermissions';

// In this test suite, we only need the permission level and assignee
describe('mapBountyPermissions', () => {
  it('should map assigned permissions to the correct key', () => {
    const permissionSet: Partial<BountyPermission>[] = [
      {
        permissionLevel: 'reviewer',
        public: true
      },
      {
        permissionLevel: 'submitter',
        roleId: v4()
      },
      {
        permissionLevel: 'submitter',
        userId: v4()
      }
    ];

    const mapped = mapBountyPermissions(permissionSet as any);

    expect(mapped.reviewer.length).toBe(1);
    expect(mapped.submitter.length).toBe(2);
    expect(mapped.creator.length).toBe(0);
  });

  it('should ingore badly shaped permissions', () => {
    const permissionSet: Partial<BountyPermission>[] = [
      {
        permissionLevel: 'reviewer',
        public: true
      },
      {
        permissionLevel: 'submitter',
        roleId: v4()
      },
      {
        permissionLevel: 'submitter',
        userId: v4()
      },
      // Wrong level
      {
        permissionLevel: 'random' as any
      }
    ];

    const mapped = mapBountyPermissions(permissionSet as any);

    expect(mapped.submitter.length).toBe(2);
    expect(mapped.creator.length).toBe(0);
    expect(mapped.reviewer.length).toBe(1);
  });
});
