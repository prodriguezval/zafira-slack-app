import {EventRepository} from "repository/EventRepository";
import {Event} from "database/entity/Event";
import {logger} from "LoggerConfig";
import {MessageRepository} from "repository/MessageRepository";
import {Message} from "database/entity/Message";
import {HomeView, SectionBlock} from "@slack/types";
import {ContextBlock, DividerBlock, KnownBlock, MrkdwnElement,} from "@slack/web-api";

export class GetHomeMessagesUseCase {
  constructor(
    private eventRepository: EventRepository,
    private messageRepository: MessageRepository
  ) {
  }

  execute = async (eventRequest: any): Promise<HomeView> => {
    const event = Event.fromRequest(eventRequest);
    await this.saveEvent(event);
    const messages = await this.messageRepository.getAll();
    return this.createHome(messages);
  };

  private saveEvent = async (event: Event) => {
    const exists = await this.eventRepository.exists(event);
    if (exists) {
      return;
    }

    await this.eventRepository.save(event);
  };

  private createHome = (messages: Message[]): HomeView => {
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
    messages.forEach((message) => {
      const messageBlock = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message.content,
          } as MrkdwnElement,
        } as SectionBlock,
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: message.userId,
            } as MrkdwnElement,
          ] as MrkdwnElement[],
        } as ContextBlock,
        {
          type: "divider",
        } as DividerBlock,
      ];
      messagesBlock.push(...messageBlock)
    });

    return {
      type: "home",
      blocks: [
        ...this.renderHeader(),
        ...messagesBlock
      ],
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
