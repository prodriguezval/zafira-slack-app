import {ViewsPublishArguments, WebClient} from "@slack/web-api";
import crypto from "crypto";
import tsscmp from "tsscmp";
import {UserModel} from "repository/model/UserModel";
import {HomeView} from "@slack/types";
import {logger} from "LoggerConfig";

export class SlackRepository {
  constructor(private client: WebClient) {
  }

  refreshAppHome = async (userId: string, view: HomeView) => {
    const args = {
      user_id: userId,
      view,
    } as ViewsPublishArguments;
    const result = await this.client.views.publish(args);
    logger().info(`result of publishing home ${result.ok}`);
  };

  findUser = async (id: string): Promise<UserModel> => {
    const result = await this.client.users.info({user: id});
    const {user} = result;
    if (!result.ok || !user) {
      throw new Error(`User ${id} not found`)
    }

    return {
      email: user.profile?.email,
      name: user.name,
      imageUrl: user.profile?.image_32
    } as UserModel;
  };

  /**
   * Verifies if the comes from slack, avoiding malicious requests
   * credit to: https://fireship.io/snippets/verify-slack-api-signing-signature-node/
   * @param requestSignature
   * @param requestTimestamp
   * @param reqBody
   */
  isLegitSlackRequest = (
    requestSignature: string,
    requestTimestamp: string,
    reqBody: string
  ): boolean => {
    const slackSigningSecret = Buffer.from(
      process.env.SLACK_SIGNING_SECRET ?? "",
      "utf-8"
    );

    // Create the HMAC
    const hmac = crypto.createHmac("sha256", slackSigningSecret);

    // Update it with the Slack Request
    const [version, hash] = requestSignature.split("=");
    const base = `${version}:${requestTimestamp}:${reqBody}`;
    hmac.update(base);

    // Returns true if it matches
    return tsscmp(hash, hmac.digest("hex"));
  };
}
