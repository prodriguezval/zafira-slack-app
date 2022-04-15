import {EventRepository} from "repository/EventRepository";
import {Event} from "database/entity/Event";
import {logger} from "LoggerConfig";
import {MessageRepository} from "repository/MessageRepository";
import {Message} from "database/entity/Message";
import {HomeView} from "@slack/types";

export class GetHomeMessagesUseCase {
  constructor(
    private eventRepository: EventRepository,
    private messageRepository: MessageRepository,
  ) {
  }

  execute = async (eventRequest: any): Promise<HomeView> => {
    const event = Event.fromRequest(eventRequest);
    try {
      await this.saveEvent(event);
    } catch (e: any) {
      logger().info(
        `GetHomeMessages event of type ${event.type} register cancelled with message ${e.message}.`
      );
    }
    // await this.messageRepository.getAll()
    return this.createHome([] as Message[]);
  };

  private saveEvent = async (event: Event) => {
    const exists = await this.eventRepository.exists(event);
    if (exists) {
      throw new Error(`event id: ${event.id} already exists.`);
    }

    await this.eventRepository.save(event);
  };

  private createHome = (messages: Message[]): HomeView => {
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":wave: *Welcome!* \nThis is list of the messages for the workspace",
        },
      },
      {
        type: "divider",
      },
    ];
    logger().info(`Checking messages ${messages.length}`)
    if (messages.length === 0) {
      logger().info(`Rendering without messages`)
      const noMessagesBlock = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":red_circle: *There's no messages available*",
          },
        },
      ];
      blocks.concat(noMessagesBlock);
      logger().info(`Rendering without messages ${blocks}`)
      return {
        type: "home",
        blocks,
      };
    }
    const messagesBlock = messages.map((message) => {
      return [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message.content,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: message.userId,
            },
          ],
        },
        {
          type: "divider",
        },
      ];
    });
    // blocks.concat(messagesBlock)
    return {
      type: "home",
      blocks,
    }
  };
}
