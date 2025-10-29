import {
    CloudFormationClient,
    CreateChangeSetCommand, CreateChangeSetCommandInput, DeleteChangeSetCommand,
    DescribeChangeSetCommand,
    DescribeChangeSetCommandOutput,
    Parameter,
    waitUntilChangeSetCreateComplete
} from "@aws-sdk/client-cloudformation";
import * as fs from "fs";

export type Configuration = {
    region: string;
    stackName: string;
    changeSetName: string;
    template: string;
    parameters: Parameter[];
}

export async function getChangeSet(config: Configuration): Promise<DescribeChangeSetCommandOutput> {
    const client = new CloudFormationClient({region: config.region});
    const describeCommandInput = {
        StackName: config.stackName,
        ChangeSetName: config.changeSetName
    };

    await client.send(new CreateChangeSetCommand(getCommandInput(config)));
    
    await waitUntilChangeSetCreateComplete({
        client,
        maxWaitTime: 120
    }, describeCommandInput);

    const describeResponse = await client.send(new DescribeChangeSetCommand(describeCommandInput));
    
    await client.send(new DeleteChangeSetCommand(describeCommandInput));

    return describeResponse;
}

function getCommandInput(config: Configuration): CreateChangeSetCommandInput {
    const input: CreateChangeSetCommandInput = {
        StackName: config.stackName,
        ChangeSetName: config.changeSetName,
        ChangeSetType: 'UPDATE',
        Parameters: config.parameters,
    }
    if (config.template.startsWith('http')) {
        input.TemplateURL = config.template;
    } else {
        input.TemplateBody = fs.readFileSync(config.template, "utf-8");
    }
    return input;
}
