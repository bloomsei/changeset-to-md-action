# CloudFormation ChangeSet to Markdown Action

![Linter](https://github.com/bloomsei/changeset-to-md-action/actions/workflows/linter.yml/badge.svg)
![CI](https://github.com/bloomsei/changeset-to-md-action/actions/workflows/ci.yml/badge.svg)
![Check dist/](https://github.com/bloomsei/changeset-to-md-action/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/bloomsei/changeset-to-md-action/actions/workflows/codeql-analysis.yml/badge.svg)
![Coverage](./badges/coverage.svg)

A GitHub Action that creates an AWS CloudFormation ChangeSet and converts it to
a formatted Markdown table, perfect for pull request comments and workflow
summaries.

## Features

- 🔍 Creates a CloudFormation ChangeSet to preview infrastructure changes
- 📝 Converts the ChangeSet to a readable Markdown table
- 🎨 Includes visual indicators (emojis) for different change types
- ✅ Shows success/failure status with clear messaging
- 🧹 Automatically cleans up the ChangeSet after reading
- 🔐 Supports both local templates and S3 URLs
- ⚙️ Configurable stack parameters

## Usage

### Basic Example

```yaml
name: Preview CloudFormation Changes
on: [pull_request]

jobs:
  preview:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1

      - name: Generate ChangeSet Markdown
        id: changeset
        uses: bloomsei/changeset-to-md-action@v1
        with:
          stack: my-stack-name
          template: ./cloudformation/template.yaml
          region: us-east-1

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '${{ steps.changeset.outputs.markdown }}'
            })
```

### With Parameters

```yaml
- name: Generate ChangeSet with Parameters
  uses: bloomsei/changeset-to-md-action@v1
  with:
    stack: my-stack-name
    template: ./cloudformation/template.yaml
    region: us-west-2
    parameters: Environment=production,InstanceType=t3.medium,EnableLogging=true
    change-set: preview-${{ github.run_id }}
```

### With S3 Template URL

```yaml
- name: Generate ChangeSet from S3
  uses: bloomsei/changeset-to-md-action@v1
  with:
    stack: my-stack-name
    template: https://s3.amazonaws.com/my-bucket/template.yaml
    region: eu-west-1
```

## Inputs

| Input        | Description                                           | Required | Default                      |
| ------------ | ----------------------------------------------------- | -------- | ---------------------------- |
| `template`   | CloudFormation template file path or S3 URL           | ✅ Yes   | -                            |
| `stack`      | Name of the CloudFormation stack (must already exist) | ✅ Yes   | -                            |
| `change-set` | Name for the created ChangeSet                        | No       | `github-action-<commit-sha>` |
| `region`     | AWS region where the stack is located                 | No       | `us-east-1`                  |
| `parameters` | Template parameters in format `key=value,key2=value2` | No       | `''`                         |

## Outputs

| Output     | Description                                        |
| ---------- | -------------------------------------------------- |
| `markdown` | Formatted Markdown representation of the ChangeSet |

## Output Format

The action generates Markdown in the following format:

### Success Example

```markdown
## Created change set for stack: `my-stack-name`

🟢 **SUCCESS**: CREATE_COMPLETE

| Action        | Replacement | Logical Id       | Type                    |
| ------------- | ----------- | ---------------- | ----------------------- |
| ✳️ **Add**    | N/A         | MyS3Bucket       | AWS::S3::Bucket         |
| 🔄 **Modify** | False       | MyLambdaFunction | AWS::Lambda::Function   |
| ❌ **Remove** | N/A         | OldSecurityGroup | AWS::EC2::SecurityGroup |
```

### No Changes Example

```markdown
## Created change set for stack: `my-stack-name`

🔵 **NO CHANGES**
```

### Change Type Icons

- ✳️ **Add** - New resource will be created
- 🔄 **Modify** - Existing resource will be modified
- ❌ **Remove** - Resource will be deleted
- \*️⃣ **Dynamic** - Change is conditional
- ⏩ **Import** - Resource will be imported

## Prerequisites

- The CloudFormation stack must already exist (use `CREATE_COMPLETE` or
  `UPDATE_COMPLETE` state)
- AWS credentials must be configured with appropriate permissions:
  - `cloudformation:CreateChangeSet`
  - `cloudformation:DescribeChangeSet`
  - `cloudformation:DeleteChangeSet`
- If using an S3 template URL, permissions to read from that S3 bucket

## AWS Permissions Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:DeleteChangeSet"
      ],
      "Resource": "arn:aws:cloudformation:*:*:stack/my-stack-name/*"
    }
  ]
}
```

## Development

### Setup

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Build

```bash
npm run package
```

### Local Testing

You can test the action locally using
[@github/local-action](https://github.com/github/local-action):

```bash
npx @github/local-action . src/main.ts .env
```

Create a `.env` file with:

```env
INPUT_STACK=my-stack-name
INPUT_TEMPLATE=./template.yaml
INPUT_REGION=us-east-1
INPUT_PARAMETERS=Key1=Value1,Key2=Value2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Related Actions

- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) -
  Configure AWS credentials for GitHub Actions
- [aws-actions/aws-cloudformation-github-deploy](https://github.com/aws-actions/aws-cloudformation-github-deploy) -
  Deploy CloudFormation stacks
