import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { requiredWhenSiblingSet, textControl } from "./mcpFieldRules";

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const ACCESS_KEY_PATH = ["credentials", "aws_access_key_id"] as const;
const SECRET_KEY_PATH = ["credentials", "aws_secret_access_key"] as const;

const AwsSigV4Fields: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <p className="text-sm text-muted-foreground mb-2">
        {t("mcpTools.mcpServerEdit.awsSigv4Desc", {
          defaultValue: "For MCP servers hosted on AWS Bedrock AgentCore.",
        })}{" "}
        <a
          href="https://docs.litellm.ai/docs/mcp_aws_sigv4"
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80"
        >
          {t("mcpTools.mcpServerEdit.awsSigv4ViewDocs", { defaultValue: "View docs" })} &rarr;
        </a>
      </p>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsRegionLabel", { defaultValue: "AWS Region" })}
            tooltip={t("mcpTools.createMcpServer.awsRegionTooltip", {
              defaultValue: "AWS region for SigV4 signing (e.g., us-east-1)",
            })}
          />
        }
        name={["credentials", "aws_region_name"]}
        required
        rules={{
          validate: {
            required: requiredRule(
              t("mcpTools.createMcpServer.awsRegionRequired", {
                defaultValue: "AWS region is required for SigV4 auth",
              }),
            ),
          },
        }}
      >
        {(control) => <Input {...textControl(control)} placeholder="us-east-1" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsServiceNameLabel", { defaultValue: "AWS Service Name" })}
            tooltip={t("mcpTools.createMcpServer.awsServiceNameTooltip", {
              defaultValue: "AWS service name for SigV4 signing. Defaults to 'bedrock-agentcore'.",
            })}
          />
        }
        name={["credentials", "aws_service_name"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="bedrock-agentcore" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsAccessKeyIdLabel", { defaultValue: "AWS Access Key ID" })}
            tooltip={t("mcpTools.createMcpServer.awsAccessKeyIdTooltip", {
              defaultValue:
                "Optional. If not provided, falls back to the boto3 credential chain (IAM role, env vars, etc.).",
            })}
          />
        }
        name={ACCESS_KEY_PATH}
        rules={{
          deps: ["credentials.aws_secret_access_key"],
          validate: {
            pairedWithSecret: requiredWhenSiblingSet(
              SECRET_KEY_PATH,
              t("mcpTools.createMcpServer.awsAccessKeyIdRequired", {
                defaultValue: "Access Key ID is required when Secret Access Key is provided",
              }),
            ),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("mcpTools.createMcpServer.awsAccessKeyIdPlaceholder", {
              defaultValue: "AKIA... (optional — uses IAM role if blank)",
            })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsSecretKeyLabel", { defaultValue: "AWS Secret Access Key" })}
            tooltip={t("mcpTools.createMcpServer.awsSecretKeyTooltip", {
              defaultValue: "Optional. Required if AWS Access Key ID is provided.",
            })}
          />
        }
        name={SECRET_KEY_PATH}
        rules={{
          deps: ["credentials.aws_access_key_id"],
          validate: {
            pairedWithAccessKey: requiredWhenSiblingSet(
              ACCESS_KEY_PATH,
              t("mcpTools.createMcpServer.awsSecretKeyRequired", {
                defaultValue: "Secret Access Key is required when Access Key ID is provided",
              }),
            ),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("mcpTools.createMcpServer.awsSecretKeyPlaceholder", {
              defaultValue: "Enter secret key (optional — uses IAM role if blank)",
            })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsSessionTokenLabel", { defaultValue: "AWS Session Token" })}
            tooltip={t("mcpTools.createMcpServer.awsSessionTokenTooltip", {
              defaultValue: "Optional. Only needed for temporary STS credentials.",
            })}
          />
        }
        name={["credentials", "aws_session_token"]}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={t("mcpTools.createMcpServer.awsSessionTokenPlaceholder", {
              defaultValue: "Enter session token (optional)",
            })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsRoleArnLabel", { defaultValue: "AWS Role ARN" })}
            tooltip={t("mcpTools.createMcpServer.awsRoleArnTooltip", {
              defaultValue:
                "Optional. IAM role ARN to assume via STS before signing. If set, LiteLLM calls sts:AssumeRole to get temporary credentials. Uses ambient credentials (IAM role, env vars) as the source identity unless explicit keys are also provided.",
            })}
          />
        }
        name={["credentials", "aws_role_name"]}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder={t("mcpTools.createMcpServer.awsRoleArnPlaceholder", {
              defaultValue: "arn:aws:iam::123456789012:role/MyRole (optional)",
            })}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.createMcpServer.awsSessionNameLabel", { defaultValue: "AWS Session Name" })}
            tooltip={t("mcpTools.createMcpServer.awsSessionNameTooltip", {
              defaultValue:
                "Optional. Session name for the AssumeRole call — appears in CloudTrail logs. Auto-generated if omitted.",
            })}
          />
        }
        name={["credentials", "aws_session_name"]}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder={t("mcpTools.createMcpServer.awsSessionNamePlaceholder", {
              defaultValue: "litellm-prod (optional, auto-generated if blank)",
            })}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
    </>
  );
};

export default AwsSigV4Fields;
