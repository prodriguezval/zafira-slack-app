import {Repository} from "typeorm";
import {Message} from "database/entity/Message";
import {logger} from "LoggerConfig";

export class MessageRepository {
  constructor(private messageDaoRepository: Repository<Message>) {
  }

  save = async (message: Message) => {
    logger().info(`saving a new message with values ${JSON.stringify(message)}`);
    await this.messageDaoRepository.save(message);
  };
}
