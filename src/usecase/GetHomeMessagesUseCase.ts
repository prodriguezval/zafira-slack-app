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
import {UserModel} from "repository/model/UserModel";

export class GetHomeMessagesUseCase {
  constructor(
    private eventRepository: EventRepository,
    private messageRepository: MessageRepository,
    private slackRepository: SlackRepository
  ) {
  }

  execute = async (userId: string) => {
    const messages = await this.messageRepository.getAll();
    const isExternalUser = await this.slackRepository.isUserExternal(userId)
    const homeView = await this.createHome(messages, isExternalUser);
    await this.slackRepository.refreshAppHome(userId, homeView);
  };

  private createHome = async (messages: Message[], isExternalUser: boolean): Promise<HomeView> => {
    if (isExternalUser) {
      logger().info(`Home for external user`);
      const blocks = [
        ...this.renderHeader(),
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":building_construction: *We are building this section*",
          },
        },
      ];
      return {
        type: "home",
        blocks,
      } as HomeView;
    }
    return await this.createHomeForInternalUser(messages)
  };

  private createHomeForInternalUser = async (messages: Message[]) => {
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
      const messageBlock = this.renderMessage(user, message)
      messagesBlock.push(...messageBlock);
    }

    return {
      type: "home",
      blocks: [...this.renderHeader(), ...messagesBlock],
    } as HomeView;
  }

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

  private renderMessage = (user: UserModel, message: Message): KnownBlock[] => {
    return [
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
            text: `Posted by: <@${message.userId}>`,
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
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Channel: <#${message.channelId}>`,
          } as MrkdwnElement,
        ] as MrkdwnElement[],
      } as ContextBlock,
      {
        type: "divider",
      } as DividerBlock,
    ] as KnownBlock[];
  }
}
