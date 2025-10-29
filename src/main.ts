import * as core from '@actions/core'
import {parseParameters} from './parse.js'
import { Configuration, getChangeSet } from './changeset.js';
import { generateMarkdownFromChangeSet } from './markdown.js';

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const settings: Configuration = {
      region: core.getInput('region'),
      stackName: core.getInput('stack', {required: true}),
      changeSetName: core.getInput('change-set'),
      template: core.getInput('template', {required: true}),
      parameters: parseParameters(core.getInput('parameters'))
    }
    const changeSet =  await getChangeSet(settings);
    const markdown = generateMarkdownFromChangeSet(changeSet);
    core.setOutput('markdown', markdown);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
