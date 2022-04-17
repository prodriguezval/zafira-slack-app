import {SlackRepository} from "repository/SlackRepository";
import {Event} from "database/entity/Event";
import {EventRepository} from "repository/EventRepository";
import {MessageRepository} from "repository/MessageRepository";
import {Message} from "database/entity/Message";
import {logger} from "LoggerConfig";

export class RegisterMessageUseCase {
  constructor(
    private slackRepository: SlackRepository,
    private eventRepository: EventRepository,
    private messageRepository: MessageRepository
  ) {
  }

  execute = async (eventRequest: any) => {
    try {
      const event = Event.fromRequest(eventRequest);
      await this.validate(event);
      await this.eventRepository.save(event);
      const message = Message.fromRequest(eventRequest);
      await this.messageRepository.save(message);
    } catch (e) {
      logger().info(`Message registration cancelled for: ${e}`);
    }
  };

  private validate = async (event: Event) => {
    const botIsInChannel = await this.slackRepository.isBotChannelMember(event.channel);
    if (!botIsInChannel) {
      throw Error(
        `Event ${event.id} produced in a channel  ${event.channel} without the bot`
      );
    }
    const isExternal = await this.slackRepository.isUserExternal(event.user);
    if (!isExternal) {
      throw Error(
        `Event ${event.id} produced by an internal user ${event.user}`
      );
    }
    const eventExists = await this.eventRepository.exists(event);
    if (eventExists) {
      throw Error(`Event ${event.id} is already registered.`);
    }
  };
}
