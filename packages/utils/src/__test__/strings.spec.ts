import { humanizeKey } from '../strings';

describe('humanizeKey', () => {
  test('should humanize camelCase keys', () => {
    expect(humanizeKey('rubricAnswers')).toBe('Rubric Answers');
    expect(humanizeKey('exampleKey')).toBe('Example Key');
  });

  test('should humanize PascalCase keys', () => {
    expect(humanizeKey('RubricAnswers')).toBe('Rubric Answers');
    expect(humanizeKey('ExampleKey')).toBe('Example Key');
  });

  test('should humanize snake_case keys', () => {
    expect(humanizeKey('rubric_answers')).toBe('Rubric Answers');
    expect(humanizeKey('example_key')).toBe('Example Key');
  });

  test('should humanize kebab-case keys', () => {
    expect(humanizeKey('rubric-answers')).toBe('Rubric Answers');
    expect(humanizeKey('example-key')).toBe('Example Key');
  });

  test('should handle mixed case keys', () => {
    expect(humanizeKey('Rubric_Answers')).toBe('Rubric Answers');
    expect(humanizeKey('Example-Key')).toBe('Example Key');
  });

  test('should handle single word keys', () => {
    expect(humanizeKey('rubric')).toBe('Rubric');
    expect(humanizeKey('Rubric')).toBe('Rubric');
  });

  test('should handle empty strings', () => {
    expect(humanizeKey('')).toBe('');
  });

  test('should handle special characters', () => {
    expect(humanizeKey('rubric@answers')).toBe('Rubric@answers');
    expect(humanizeKey('rubric!answers')).toBe('Rubric!answers');
  });
});
