import "dotenv/config";
import express, {Request, Response} from "express";
import {logger} from "LoggerConfig";
import {WebClient} from "@slack/web-api";
import {SlackRepository} from "repository/SlackRepository";
import {myDataSource} from "app-data-source";
import {Event} from "database/entity/Event";
import {EventRepository} from "repository/EventRepository";
import {RegisterMessageUseCase} from "usecase/RegisterMessageUseCase";
import {Message} from "database/entity/Message";
import {MessageRepository} from "repository/MessageRepository";

const app = express();
const port = process.env.PORT || 3001;
const slackClient = new WebClient(process.env.SLACK_ACCESS_TOKEN);
myDataSource.initialize().catch((err) => {
  logger().error(`Error during Data Source initialization: ${err}`);
});
const eventDaoRepository = myDataSource.getRepository(Event);
const messageDaoRepository = myDataSource.getRepository(Message);
const eventRepository = new EventRepository(eventDaoRepository);
const messageRepository = new MessageRepository(messageDaoRepository);
const slackRepository = new SlackRepository(slackClient);
const registerMessageUseCase = new RegisterMessageUseCase(
  slackRepository,
  eventRepository,
  messageRepository
);

app.use(express.json());

const slackVerification = (req: Request, res: Response) => {
  logger().info("Slack challenge request body: " + JSON.stringify(req.body));
  const {challenge} = req.body;
  res.contentType("text/plain");
  res.status(200);
  res.send(challenge);
};

app.post("/slack/event", async (req: Request, res: Response) => {
  // slackVerification(req, res);
  const requestSignature = req.headers["x-slack-signature"] as string;
  const requestTimestamp = req.headers["x-slack-request-timestamp"] as string;
  const reqBody = JSON.stringify(req.body);

  logger().info(`Slack event detected! ${reqBody}`);
  if (
    !slackRepository.isLegitSlackRequest(
      requestSignature,
      requestTimestamp,
      reqBody
    )
  ) {
    logger().error("Invalid slack request!");
    res.status(403).send("Invalid request!");
  }
  await registerMessageUseCase.execute(req.body);
  res.status(200);
});

app.listen(port, () => {
  logger().info(`Zafira bot app listening on port ${port}`);
});
