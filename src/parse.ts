import { Parameter } from '@aws-sdk/client-cloudformation';

/**
 * Parse a comma-separated list of key=value pairs into CloudFormation Parameters.
 * @param input - "key=value,key2=value2"
 * @throws {Error} if the input is mis-formatted
 */
export function parseParameters(input: string): Parameter[] {
  const params: Parameter[] = [];
  if (input.trim() === '') {
    return params;
  }

  const items = input.split(',');
  for (const pair of items) {
    const kv = pair.split('=');
    if (kv.length !== 2) {
      throw new Error(
        'Parameters are mis-formatted, expecting parameters in format "key=value,key2=value2"'
      );
    }
    params.push({
      ParameterKey: kv[0].trim(),
      ParameterValue: kv[1].trim()
    });
  }

  return params;
}
