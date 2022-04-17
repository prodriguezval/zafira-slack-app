import {ViewsPublishArguments, WebClient} from "@slack/web-api";
import crypto from "crypto";
import tsscmp from "tsscmp";
import {UserModel} from "repository/model/UserModel";
import {HomeView} from "@slack/types";
import {logger} from "LoggerConfig";
import {User} from "@slack/web-api/dist/response/UsersInfoResponse";

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
    const user = await this.getUser(id);

    return {
      email: user.profile?.email,
      name: user.name,
      imageUrl: user.profile?.image_32
    } as UserModel;
  };

  isBotChannelMember = async (channelId: string): Promise<boolean> => {
    const botId = process.env.BOT_ID || "";
    const {members} = await this.client.conversations.members({channel: channelId});
    return members?.includes(botId) as boolean
  }
  isUserExternal = async (id: string): Promise<boolean> => {
    const user = await this.getUser(id);
    return !user.is_admin;
  }
  private getUser = async (id: string): Promise<User> => {
    const result = await this.client.users.info({user: id});
    const {user} = result;
    if (user === undefined) {
      throw Error(`User ${id} not found`);
    }
    return user;
  }

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
