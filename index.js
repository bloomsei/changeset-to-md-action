import {
    CloudFormationClient,
    CreateChangeSetCommand, DeleteChangeSetCommand,
    DescribeChangeSetCommand,
    waitUntilChangeSetCreateComplete
} from "@aws-sdk/client-cloudformation";
import * as fs from "fs";
import * as core from "@actions/core";
import {isUrl, parseParams} from "./util.js";


async function run() {
    const region = core.getInput('region');
    const template = core.getInput('template');
    const params = parseParams(core.getInput('parameters'));
    const stackName = core.getInput('stack');
    const csName = core.getInput('change-set');

    const client = new CloudFormationClient({region: region})

    const id = await client.send(createChangeSet(template, params, csName, stackName));
    core.warning(id.Id)
    const describeCommand = new DescribeChangeSetCommand({
        ChangeSetName: csName,
        StackName: stackName
    });
    await waitUntilChangeSetCreateComplete({
        client: client,
        maxWaitTime: 120
    }, describeCommand.input).catch(_ => core.debug("Failed creating a change set"));

    const response = await client.send(describeCommand);

    await client.send(new DeleteChangeSetCommand({
        StackName: stackName,
        ChangeSetName: csName
    }))
    return getMessage(response);
}

function createChangeSet(template, params, name, stack) {
    if (isUrl(template)) {
        return new CreateChangeSetCommand({
            ChangeSetName: name,
            StackName: stack,
            TemplateURL: template,
            Parameters: params
        });
    }
    return new CreateChangeSetCommand({
        ChangeSetName: name,
        StackName: stack,
        TemplateBody: fs.readFileSync(template),
        Parameters: params
    });
}

/**
 * @param {import('@aws/sdk-cloudformation')/DescribeChangeSetCommandOutput} describe
 */
function getMessage(describe) {
    const header = `## Created change set for stack: \`${describe.StackName}\`\n`
    if (describe.Status === 'FAILED') {
        if (describe.ExecutionStatus === 'UNAVAILABLE') {
            return header + '🔵 **NO CHANGES**';
        }
        return header + `🔴 **FAILURE**: ${describe.StatusReason}`;
    }
    let response = `${header}🟢 **SUCCESS**: ${describe.Status}\n`
    for (const change of describe.Changes) {
        if (change.ResourceChange) {
            response += getChange(change.ResourceChange);
        }
    }
    return response;
}

/**
 * @param {ResourceChange} change
 * @returns {string}
 */
function getChange(change) {
    let replaceTag = change.Action === 'Modify' && change.Replacement !== 'False' ? ' - Replacement' : '';
    if (replaceTag && change.Replacement === 'Conditional') replaceTag += ' (Conditional)';
    return ` - ${getIcon(change.Action)} ${change.Action}${replaceTag}: ` +
        `**${change.LogicalResourceId}** (${change.ResourceType})\n`
}

function getIcon(action) {
    switch (action) {
        case 'Add':
            return '✳️';
        case 'Dynamic':
            return '*️⃣';
        case 'Import':
            return '⏩';
        case 'Modify':
            return '🔄';
        case 'Remove':
            return '⛔️';
    }
    return '';
}

run()
    .then(message => core.setOutput('change-set', message))
    .catch(e => core.setFailed(e));
