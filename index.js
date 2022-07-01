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
    const stackName = core.getInput('stackName');
    const csName = core.getInput('changeSetName');

    const client = new CloudFormationClient({region: region})

    await client.send(createChangeSet(template, params, csName, stackName));
    const describeCommand = new DescribeChangeSetCommand({
        ChangeSetName: csName,
        StackName: stackName
    });
    await waitUntilChangeSetCreateComplete({
        client: client,
        maxWaitTime: 120
    }, describeCommand.input);

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
    if (describe.Status === 'FAILED') {
        if (describe.ExecutionStatus === 'UNAVAILABLE') {
            return '🔵 **NO CHANGES**';
        }
        return `🔴 **FAILED**: ${describe.StatusReason}`;
    }
    let response = `🟢 **SUCCESS**: ${describe.Status}\n`
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
    return `${getIcon(change.Action)}${change.Action}${replaceTag}: ` +
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
    .then(message => core.setOutput('changeSet', message))
    .catch(e => core.setFailed(e));
