import {
  Change,
  ChangeAction,
  ChangeSetStatus,
  DescribeChangeSetCommandOutput,
  ExecutionStatus
} from '@aws-sdk/client-cloudformation';

export function generateMarkdownFromChangeSet(
  changeSet: DescribeChangeSetCommandOutput
): string {
  let markdown = `## Created change set for stack: \`${changeSet.StackName}\`\n`;
  markdown += getStatusMessage(changeSet);
  if (changeSet.Changes && changeSet.Changes.length > 0) {
    markdown += getChanges(changeSet.Changes);
  }
  return markdown;
}

function getStatusMessage(changeSet: DescribeChangeSetCommandOutput): string {
  if (changeSet.Status === ChangeSetStatus.FAILED) {
    if (changeSet.ExecutionStatus === ExecutionStatus.UNAVAILABLE) {
      return '🔵 **NO CHANGES**\n';
    }
    return `🔴 **FAILURE**: ${changeSet.StatusReason}\n`;
  }
  return `🟢 **SUCCESS**: ${changeSet.Status}\n`;
}

function getChanges(changes: Change[]): string {
  let markdown = '| Action | Replacement | Logical ID | Type |\n';
  markdown += '| --- | --- | --- | --- |\n';
  for (const change of changes) {
    if (change.ResourceChange) {
      markdown += `| ${getIcon(change.ResourceChange.Action)} **${change.ResourceChange.Action}** `;
      markdown += `| ${change.ResourceChange.Replacement ?? 'N/A'} `;
      markdown += `| ${change.ResourceChange.LogicalResourceId} `;
      markdown += `| ${change.ResourceChange.ResourceType} |\n`;
    }
  }
  return markdown;
}

function getIcon(action: ChangeAction | undefined): string {
  if (!action) return '';
  switch (action) {
    case ChangeAction.Add:
      return '✳️';
    case ChangeAction.Dynamic:
      return '🔄';
    case ChangeAction.Import:
      return '⬇️';
    case ChangeAction.Modify:
      return '🔀';
    case ChangeAction.Remove:
      return '❌';
  }
}
