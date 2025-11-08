import {
  ChangeAction,
  ChangeSetStatus,
  DescribeChangeSetCommandOutput
} from '@aws-sdk/client-cloudformation';
import { jest } from '@jest/globals';
import { Configuration } from '../src/changeset.js';

// Mock @actions/core
const mockGetInput =
  jest.fn<(name: string, options?: { required?: boolean }) => string>();
const mockSetOutput = jest.fn<(name: string, value: string) => void>();
const mockSetFailed = jest.fn<(message: string) => void>();

jest.unstable_mockModule('@actions/core', () => ({
  getInput: mockGetInput,
  setOutput: mockSetOutput,
  setFailed: mockSetFailed
}));

// Mock the changeset module
const mockGetChangeSet =
  jest.fn<(config: Configuration) => Promise<DescribeChangeSetCommandOutput>>();
jest.unstable_mockModule('../src/changeset.js', () => ({
  getChangeSet: mockGetChangeSet
}));

// Import after mocking
const { run } = await import('../src/main.js');

describe('run', () => {
  beforeEach(() => {
    mockGetInput.mockClear();
    mockSetOutput.mockClear();
    mockSetFailed.mockClear();
    mockGetChangeSet.mockClear();
  });

  test('reads inputs, calls getChangeSet, and sets output', async () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        region: 'us-east-1',
        stack: 'my-stack',
        'change-set': 'my-changeset',
        template: './template.yaml',
        parameters: 'Env=prod,InstanceType=t3.medium'
      };
      return inputs[name] || '';
    });

    const mockResponse: DescribeChangeSetCommandOutput = {
      $metadata: {},
      StackName: 'my-stack',
      Status: ChangeSetStatus.CREATE_COMPLETE,
      Changes: [
        {
          ResourceChange: {
            Action: ChangeAction.Add,
            LogicalResourceId: 'MyBucket',
            ResourceType: 'AWS::S3::Bucket'
          }
        }
      ]
    };

    mockGetChangeSet.mockResolvedValue(mockResponse);

    await run();

    // Verify inputs were read
    expect(mockGetInput).toHaveBeenCalledWith('region');
    expect(mockGetInput).toHaveBeenCalledWith('stack', { required: true });
    expect(mockGetInput).toHaveBeenCalledWith('change-set');
    expect(mockGetInput).toHaveBeenCalledWith('template', { required: true });
    expect(mockGetInput).toHaveBeenCalledWith('parameters');

    // Verify getChangeSet was called with correct config
    expect(mockGetChangeSet).toHaveBeenCalledWith({
      region: 'us-east-1',
      stackName: 'my-stack',
      changeSetName: 'my-changeset',
      template: './template.yaml',
      parameters: [
        { ParameterKey: 'Env', ParameterValue: 'prod' },
        { ParameterKey: 'InstanceType', ParameterValue: 't3.medium' }
      ]
    });

    // Verify output was set
    expect(mockSetOutput).toHaveBeenCalledWith('markdown', expect.any(String));
    expect(mockSetFailed).not.toHaveBeenCalled();
  });

  test('handles errors by calling setFailed', async () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        region: 'us-east-1',
        stack: 'my-stack',
        'change-set': 'my-changeset',
        template: './template.yaml',
        parameters: ''
      };
      return inputs[name] || '';
    });

    const errorMessage = 'Failed to create changeset';
    mockGetChangeSet.mockRejectedValue(new Error(errorMessage));

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(errorMessage);
    expect(mockSetOutput).not.toHaveBeenCalled();
  });
});
