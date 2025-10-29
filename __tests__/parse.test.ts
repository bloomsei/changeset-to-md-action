import { parseParameters } from '../src/parse.js';

describe('parseParameters', () => {
  test('parses valid input', () => {
    const input = 'Key1=Value1,Key2=Value2';
    const result = parseParameters(input);
    expect(result).toEqual([
      { ParameterKey: 'Key1', ParameterValue: 'Value1' },
      { ParameterKey: 'Key2', ParameterValue: 'Value2' },
    ]);
  });

  test('parses correctly with whitespaces', () => {
    const input = '  Key1= Value1 , Key2   =Value2';
    const result = parseParameters(input);
    expect(result).toEqual([
      { ParameterKey: 'Key1', ParameterValue: 'Value1' },
      { ParameterKey: 'Key2', ParameterValue: 'Value2' },
    ]);
  });

  test('throws error with missing value', () => {
    const input = 'Key1=Value1,InvalidPair,Key2=Value2';
    expect(() => parseParameters(input)).toThrow();
  });

  test('throws error with missing comma', () => {
    const input = 'Key1=Value1Key2=Value2';
    expect(() => parseParameters(input)).toThrow();
  });
});
