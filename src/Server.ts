import "dotenv/config";
import express, {Request, Response} from "express";
import {logger} from "LoggerConfig";
import {WebClient} from "@slack/web-api";
import {SlackRepository} from "repository/SlackRepository";
import {myDataSource} from "app-data-source";
import {Event, EventType} from "database/entity/Event";
import {EventRepository} from "repository/EventRepository";
import {RegisterMessageUseCase} from "usecase/RegisterMessageUseCase";
import {Message} from "database/entity/Message";
import {MessageRepository} from "repository/MessageRepository";
import {GetHomeMessagesUseCase} from "usecase/GetHomeMessagesUseCase";
import {UpdateMessageStatus} from "usecase/UpdateMessageStatus";

const app = express();
const port = process.env.PORT || 3001;
const slackClient = new WebClient(process.env.SLACK_TOKEN);
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

const getHomeMessages = new GetHomeMessagesUseCase(
  eventRepository,
  messageRepository,
  slackRepository
);

const updateMessageStatus = new UpdateMessageStatus(messageRepository);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const slackVerification = (req: Request, res: Response) => {
  logger().info("Slack challenge request body: " + JSON.stringify(req.body));
  const {challenge} = req.body;
  res.contentType("text/plain");
  res.status(200);
  res.send(challenge);
};

const eventHandler = async (req: Request, res: Response) => {
  const eventType = req.body.event.type as EventType;
  logger().info(
    `Slack event type ${eventType} detected! with body ${JSON.stringify(
      req.body
    )}`
  );
  switch (eventType) {
    case EventType.HOME_OPENED: {
      const {user} = req.body.event
      await getHomeMessages.execute(user);
      res.status(200);
      break;
    }
    case EventType.MESSAGE_RECEIVED: {
      await registerMessageUseCase.execute(req.body);
      res.status(200);
      break;
    }
  }
};

app.post("/slack/event", async (req: Request, res: Response) => {
  if (req.body.type === "url_verification") {
    slackVerification(req, res);
    return;
  }

  const requestSignature = req.headers["x-slack-signature"] as string;
  const requestTimestamp = req.headers["x-slack-request-timestamp"] as string;

  if (
    !slackRepository.isLegitSlackRequest(
      requestSignature,
      requestTimestamp,
      JSON.stringify(req.body)
    )
  ) {
    logger().error("Invalid slack request!");
    res.status(403).send("Invalid request!");
  }
  await eventHandler(req, res);
});

app.post("/slack/interactions", async (req: Request, res: Response) => {
  const {user, actions} = JSON.parse(req.body.payload);
  const action = actions[0];
  logger().info(`action received with body: ${JSON.stringify(actions)}`);

  if (action.action_id === "change_message_status") {
    const [status, id] = action.selected_option.value.split("*");
    await updateMessageStatus.execute(id, status);
    getHomeMessages.execute(user.id)
  }
  res.status(200).send();
});

app.listen(port, () => {
  logger().info(`Zafira bot app listening on port ${port}`);
});
