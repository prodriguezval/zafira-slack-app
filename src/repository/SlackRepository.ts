import {WebClient} from "@slack/web-api";
import crypto from "crypto";
import tsscmp from "tsscmp";
import {UserModel} from "repository/model/UserModel";

export class SlackRepository {
  constructor(private client: WebClient) {
  }

  findUser = (id: string): UserModel => {
    return {} as UserModel;
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
