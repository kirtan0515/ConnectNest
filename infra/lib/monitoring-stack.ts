import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Alarm,
  ComparisonOperator,
  Metric,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";

export interface MonitoringStackProps extends StackProps {
  distribution: IDistribution;
  httpApi: HttpApi;
  /** Name of the CLOUDFRONT-scoped WAF web ACL (see HostingStack). */
  webAclName: string;
  /** Where alarm emails go. Optional so synth works without it. */
  alertEmail?: string;
}

/**
 * MonitoringStack — CloudWatch alarms that email the owner when something
 * looks wrong: error spikes at the edge, in the API, or in Lambda, and
 * unusual volumes of requests blocked by the WAF.
 *
 * CloudFront and WAF metrics are published in us-east-1, which is where this
 * whole app lives, so the alarms sit in the same region as the resources.
 */
export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const topic = new Topic(this, "AlertsTopic", {
      displayName: "ConnectNest alerts",
    });
    if (props.alertEmail) {
      topic.addSubscription(new EmailSubscription(props.alertEmail));
    }
    const action = new SnsAction(topic);

    const add = (alarm: Alarm) => {
      alarm.addAlarmAction(action);
      alarm.addOkAction(action);
    };

    // 1. CloudFront: share of requests answered with a 5xx.
    add(
      new Alarm(this, "CdnServerErrors", {
        alarmName: "connectnest-cloudfront-5xx-rate",
        alarmDescription: "More than 5% of CloudFront responses are 5xx errors.",
        metric: new Metric({
          namespace: "AWS/CloudFront",
          metricName: "5xxErrorRate",
          dimensionsMap: {
            DistributionId: props.distribution.distributionId,
            Region: "Global",
          },
          statistic: "Average",
          period: Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
    );

    // 2. WAF: unusually many blocked requests (scanner, bot or abuse traffic).
    add(
      new Alarm(this, "WafBlockedSpike", {
        alarmName: "connectnest-waf-blocked-requests",
        alarmDescription: "The WAF blocked more than 100 requests in 5 minutes.",
        metric: new Metric({
          namespace: "AWS/WAFV2",
          metricName: "BlockedRequests",
          dimensionsMap: {
            // CLOUDFRONT-scoped ACLs publish WebACL + Rule (no Region dimension).
            WebACL: props.webAclName,
            Rule: "ALL",
          },
          statistic: "Sum",
          period: Duration.minutes(5),
        }),
        threshold: 100,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
    );

    // 3. API Gateway: server-side errors returned by the HTTP API.
    add(
      new Alarm(this, "ApiServerErrors", {
        alarmName: "connectnest-api-5xx",
        alarmDescription: "The HTTP API returned 5 or more 5xx errors in 5 minutes.",
        metric: new Metric({
          namespace: "AWS/ApiGateway",
          metricName: "5xx",
          dimensionsMap: { ApiId: props.httpApi.apiId },
          statistic: "Sum",
          period: Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
    );

    // 4. Lambda: failed invocations across all functions in the account/region.
    add(
      new Alarm(this, "LambdaErrors", {
        alarmName: "connectnest-lambda-errors",
        alarmDescription: "Lambda functions reported 5 or more errors in 5 minutes.",
        metric: new Metric({
          namespace: "AWS/Lambda",
          metricName: "Errors",
          statistic: "Sum",
          period: Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
    );

    new CfnOutput(this, "AlertsTopicArn", { value: topic.topicArn });
  }
}
