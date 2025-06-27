import { getCurrentEvaluation } from '../utils';

describe('getCurrentEvaluation()', () => {
  it('should return the current evaluation that does not yet have a result', () => {
    const result = getCurrentEvaluation([
      { index: 0, result: 'pass' },
      { index: 1, result: 'pass' },
      { index: 2, result: null },
      { index: 3, result: null }
    ]);

    expect(result?.index).toBe(2);
  });

  it('should stop at an evaluation which is marked as failed and not a final step', () => {
    const result = getCurrentEvaluation([
      { index: 0, result: 'pass' },
      { index: 1, result: 'pass' },
      { index: 2, result: 'fail' },
      { index: 3, result: null }
    ]);

    expect(result?.index).toBe(2);
  });

  it('should stop at an intermediate final step evaluation if its marked as passed', () => {
    const result = getCurrentEvaluation([
      { index: 0, result: 'pass' },
      { index: 1, result: 'pass', finalStep: true },
      { index: 3, result: null },
      { index: 2, result: null }
    ]);

    expect(result?.index).toBe(1);
  });

  it('should return the final evaluation if all evaluations passed', () => {
    const result = getCurrentEvaluation([
      { index: 0, result: 'pass' },
      { index: 1, result: 'pass' },
      { index: 2, result: 'pass' },
      { index: 3, result: 'pass' }
    ]);

    expect(result?.index).toBe(3);
  });

  it('should return the step which has been appealed and it has result', () => {
    const result = getCurrentEvaluation([
      { index: 0, result: 'pass', appealedAt: new Date() },
      { index: 1, result: 'pass' },
      { index: 2, result: 'fail' },
      { index: 3, result: null }
    ]);

    expect(result?.index).toBe(0);
  });
});
