import type { Application } from '@charmverse/core/prisma-client';

import type { ApplicationWithOnlyStatus } from '../countRemainingSubmissionSlots';
import {
  submissionIsComplete,
  countCompleteSubmissions,
  countRemainingSubmissionSlots
} from '../countRemainingSubmissionSlots';

describe('submissionIsComplete', () => {
  it('should return true if the application status is "complete"', () => {
    const result = submissionIsComplete({ application: { status: 'complete' } });
    expect(result).toBe(true);
  });

  it('should return true if the application status is "paid"', () => {
    const result = submissionIsComplete({ application: { status: 'paid' } });
    expect(result).toBe(true);
  });

  it('should return true if the application status is "processing"', () => {
    const result = submissionIsComplete({ application: { status: 'processing' } });
    expect(result).toBe(true);
  });

  it('should return false for any other application status', () => {
    const result = submissionIsComplete({ application: { status: 'otherStatus' as Application['status'] } });
    expect(result).toBe(false);
  });
});

describe('countCompleteSubmissions', () => {
  it('should correctly count the number of completed applications based on their status', () => {
    const applications: ApplicationWithOnlyStatus[] = [
      { status: 'complete' },
      { status: 'complete' },
      { status: 'paid' },
      { status: 'paid' },
      { status: 'paid' },
      { status: 'processing' },
      { status: 'processing' },
      { status: 'inProgress' },
      { status: 'applied' },
      { status: 'review' }
    ];

    const count = countCompleteSubmissions({ applications });
    expect(count).toBe(7);
  });
});

describe('countRemainingSubmissionSlots', () => {
  const applications: ApplicationWithOnlyStatus[] = [
    // 7 applications counting as complete
    { status: 'complete' },
    { status: 'complete' },
    { status: 'paid' },
    { status: 'paid' },
    { status: 'paid' },
    { status: 'processing' },
    { status: 'processing' },
    // Applications still in the pipeline
    { status: 'inProgress' },
    { status: 'applied' },
    { status: 'review' }
  ];
  it('should return the remaining submission slots correctly based on the limit and valid applications', () => {
    let remaining = countRemainingSubmissionSlots({ applications, limit: 5 });
    expect(remaining).toBe(0);

    remaining = countRemainingSubmissionSlots({ applications, limit: 10 });
    expect(remaining).toBe(3);
  });

  it('should return null if no limit is provided', () => {
    const remaining = countRemainingSubmissionSlots({ applications });
    expect(remaining).toBeNull();
  });

  it('should return 0 if there are no remaining submission slots', () => {
    const remaining = countRemainingSubmissionSlots({ applications, limit: 3 });
    expect(remaining).toBe(0);
  });
});
