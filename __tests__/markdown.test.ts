import {
  ChangeAction,
  ChangeSetStatus,
  DescribeChangeSetCommandOutput,
  ExecutionStatus,
  Replacement
} from '@aws-sdk/client-cloudformation';
import { generateMarkdownFromChangeSet } from '../src/markdown.js';

describe('generateMarkdownFromChangeSet', () => {
  test('generates markdown for successful changeset with changes', () => {
    const changeSet: DescribeChangeSetCommandOutput = {
      $metadata: {},
      StackName: 'test-stack',
      Status: ChangeSetStatus.CREATE_COMPLETE,
      Changes: [
        {
          ResourceChange: {
            Action: ChangeAction.Add,
            LogicalResourceId: 'MyS3Bucket',
            ResourceType: 'AWS::S3::Bucket',
            Replacement: Replacement.False
          }
        },
        {
          ResourceChange: {
            LogicalResourceId: 'MyLambda',
            ResourceType: 'AWS::Lambda::Function'
          }
        },
        {
          ResourceChange: {
            Action: ChangeAction.Dynamic,
            LogicalResourceId: 'Resource3',
            ResourceType: 'AWS::Lambda::Function',
            Replacement: Replacement.Conditional
          }
        },
        {}
      ]
    };

    const result = generateMarkdownFromChangeSet(changeSet);

    expect(result).toContain('## Created change set for stack: `test-stack`');
    expect(result).toContain('🟢 **SUCCESS**: CREATE_COMPLETE');
    expect(result).toContain('| Action | Replacement | Logical ID | Type |');
    expect(result).toContain('✳️ **Add**');
    expect(result).toContain('MyS3Bucket');
    expect(result).toContain('AWS::S3::Bucket');
    expect(result).toContain('MyLambda');
    expect(result).toContain('AWS::Lambda::Function');
    expect(result).toContain(
      '| 🔄 **Dynamic** | Conditional | Resource3 | AWS::Lambda::Function |'
    );
  });

  test('generates markdown for changeset with no changes', () => {
    const changeSet: DescribeChangeSetCommandOutput = {
      $metadata: {},
      StackName: 'test-stack',
      Status: ChangeSetStatus.FAILED,
      ExecutionStatus: ExecutionStatus.UNAVAILABLE,
      StatusReason: 'No updates are to be performed.'
    };

    const result = generateMarkdownFromChangeSet(changeSet);

    expect(result).toContain('## Created change set for stack: `test-stack`');
    expect(result).toContain('🔵 **NO CHANGES**');
    expect(result).not.toContain(
      '| Action | Replacement | Logical Id | Type |'
    );
  });

  test('generates markdown for failed changeset', () => {
    const changeSet: DescribeChangeSetCommandOutput = {
      $metadata: {},
      StackName: 'test-stack',
      Status: ChangeSetStatus.FAILED,
      ExecutionStatus: ExecutionStatus.EXECUTE_FAILED,
      StatusReason:
        'Template error: instance of Fn::GetAtt references undefined resource'
    };

    const result = generateMarkdownFromChangeSet(changeSet);

    expect(result).toContain('## Created change set for stack: `test-stack`');
    expect(result).toContain('🔴 **FAILURE**');
    expect(result).toContain(
      'Template error: instance of Fn::GetAtt references undefined resource'
    );
  });

  test('gets correct icons for all action types', () => {
    const changeSet: DescribeChangeSetCommandOutput = {
      $metadata: {},
      StackName: 'test-stack',
      Status: ChangeSetStatus.CREATE_COMPLETE,
      Changes: [
        {
          ResourceChange: { Action: ChangeAction.Add }
        },
        {
          ResourceChange: { Action: ChangeAction.Modify }
        },
        {
          ResourceChange: { Action: ChangeAction.Remove }
        },
        {
          ResourceChange: { Action: ChangeAction.Dynamic }
        },
        {
          ResourceChange: { Action: ChangeAction.Import }
        }
      ]
    };

    const result = generateMarkdownFromChangeSet(changeSet);

    expect(result).toContain('✳️ **Add**');
    expect(result).toContain('🔀 **Modify**');
    expect(result).toContain('❌ **Remove**');
    expect(result).toContain('🔄 **Dynamic**');
    expect(result).toContain('⬇️ **Import**');
  });
});
