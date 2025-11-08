import {
  ChangeAction,
  ChangeSetStatus,
  CloudFormationClient,
  CreateChangeSetCommand,
  CreateChangeSetCommandInput,
  DeleteChangeSetCommand,
  DescribeChangeSetCommand,
  Replacement
} from '@aws-sdk/client-cloudformation';
import { jest } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import type { Configuration } from '../src/changeset.js';

// Mock fs module before importing the module under test
const mockReadFileSync = jest.fn<(path: string, encoding: string) => string>();
jest.unstable_mockModule('fs', () => ({
  readFileSync: mockReadFileSync
}));

// Now import the module under test (after mocking fs)
const { getChangeSet } = await import('../src/changeset.js');

const cfnMock = mockClient(CloudFormationClient);

describe('getChangeSet', () => {
  beforeEach(() => {
    cfnMock.reset();
    mockReadFileSync.mockClear();
  });

  test('creates, describes, and deletes changeset successfully', async () => {
    const config: Configuration = {
      region: 'us-east-1',
      stackName: 'test-stack',
      changeSetName: 'test-changeset',
      template: './template.yaml',
      parameters: []
    };

    const mockDescribeResponse = {
      StackName: 'test-stack',
      ChangeSetName: 'test-changeset',
      Status: ChangeSetStatus.CREATE_COMPLETE,
      Changes: [
        {
          ResourceChange: {
            Action: ChangeAction.Add,
            LogicalResourceId: 'MyS3Bucket',
            ResourceType: 'AWS::S3::Bucket',
            Replacement: Replacement.False
          }
        }
      ]
    };

    // Mock file read
    mockReadFileSync.mockReturnValue('template content');

    // Mock AWS SDK calls
    cfnMock
      .on(CreateChangeSetCommand)
      .resolves({})
      .on(DescribeChangeSetCommand)
      .resolves(mockDescribeResponse)
      .on(DeleteChangeSetCommand)
      .resolves({});

    const result = await getChangeSet(config);

    expect(result).toEqual(mockDescribeResponse);
    expect(cfnMock.commandCalls(CreateChangeSetCommand)).toHaveLength(1);
    // waitUntilChangeSetCreateComplete calls DescribeChangeSet multiple times
    expect(
      cfnMock.commandCalls(DescribeChangeSetCommand).length
    ).toBeGreaterThanOrEqual(1);
    expect(cfnMock.commandCalls(DeleteChangeSetCommand)).toHaveLength(1);

    const createCall = cfnMock.commandCalls(CreateChangeSetCommand)[0].args[0]
      .input as CreateChangeSetCommandInput;
    expect(createCall.StackName).toBe('test-stack');
    expect(createCall.ChangeSetName).toBe('test-changeset');
    expect(createCall.ChangeSetType).toBe('UPDATE');
  });
});
