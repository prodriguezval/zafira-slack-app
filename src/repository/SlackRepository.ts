import {WebClient} from "@slack/web-api";
import crypto from "crypto";
import tsscmp from "tsscmp";
import {UserModel} from "repository/model/UserModel";
import {Repository} from "typeorm";
import {Event} from "database/entity/Event";
import {logger} from "LoggerConfig";

export class SlackRepository {
  constructor(private client: WebClient, private eventRepository: Repository<Event>) {
  }

  findUser = (id: string): UserModel => {
    return {} as UserModel;
  };

  saveEvent = async (requestEvent: Event) => {
    const event = await this.eventRepository.findOneBy({id: requestEvent.id})
    if (event !== null) {
      logger().info(`Event ${event.id} is already registered, skipping`)
      return
    }
    logger().info(`Saving Event ${requestEvent.id} in the database`)
    await this.eventRepository.save(requestEvent);
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
