import {EventRepository} from "repository/EventRepository";
import {logger} from "LoggerConfig";
import {MessageRepository} from "repository/MessageRepository";
import {Message, MessageStatus} from "database/entity/Message";
import {HomeView, SectionBlock} from "@slack/types";
import {
  ContextBlock,
  DividerBlock,
  ImageBlock,
  KnownBlock,
  MrkdwnElement,
  PlainTextOption,
  Select,
} from "@slack/web-api";
import {SlackRepository} from "repository/SlackRepository";

export class GetHomeMessagesUseCase {
  constructor(
    private eventRepository: EventRepository,
    private messageRepository: MessageRepository,
    private slackRepository: SlackRepository
  ) {
  }

  execute = async (userId: string) => {
    const messages = await this.messageRepository.getAll();
    const homeView = await this.createHome(messages);
    await this.slackRepository.refreshAppHome(userId, homeView);
  };

  private createHome = async (messages: Message[]): Promise<HomeView> => {
    logger().info(`Checking messages ${messages.length}`);
    if (messages.length === 0) {
      const blocks = [
        ...this.renderHeader(),
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":red_circle: *There's no messages available*",
          },
        },
      ];
      return {
        type: "home",
        blocks,
      } as HomeView;
    }
    const messagesBlock = [] as KnownBlock[];
    for (const message of messages) {
      const user = await this.slackRepository.findUser(message.userId);
      logger().info(`User info: ${JSON.stringify(user)}`);
      const messageBlock = [
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: user.imageUrl,
              alt_text: `User ${user.name} picture`,
            } as ImageBlock,
            {
              type: "mrkdwn",
              text: user.name,
            } as MrkdwnElement,
          ] as MrkdwnElement[],
        } as ContextBlock,
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message.content,
          } as MrkdwnElement,
          accessory: {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select an message status",
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: `*${MessageStatus.OPEN}*`,
                },
                value: `${MessageStatus.OPEN}*${message.id}`,
              },
              {
                text: {
                  type: "plain_text",
                  text: `*${MessageStatus.COMPLETE}*`,
                },
                value: `${MessageStatus.COMPLETE}*${message.id}`,
              },
            ] as PlainTextOption[],
            action_id: "change_message_status",
          } as Select,
        } as SectionBlock,
        {
          type: "divider",
        } as DividerBlock,
      ];
      messagesBlock.push(...messageBlock);
    }

    return {
      type: "home",
      blocks: [...this.renderHeader(), ...messagesBlock],
    };
  };

  private renderHeader = () => {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":wave: *Welcome!* \nThis is list of the messages for the workspace",
        } as MrkdwnElement,
      } as SectionBlock,
      {
        type: "divider",
      } as DividerBlock,
    ] as KnownBlock[];
  };
}
