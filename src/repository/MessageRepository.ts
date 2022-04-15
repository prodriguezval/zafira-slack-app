import {Repository} from "typeorm";
import {Message, MessageStatus} from "database/entity/Message";
import {logger} from "LoggerConfig";

export class MessageRepository {
  constructor(private messageDaoRepository: Repository<Message>) {
  }

  getAll = async (): Promise<Message[]> => {
    logger().info("Getting the complete message list");
    return await this.messageDaoRepository.find();
  };
  save = async (message: Message) => {
    logger().info(
      `saving a new message with values ${JSON.stringify(message)}`
    );
    await this.messageDaoRepository.save(message);
  };

  updateStatus = async (id: string, status: MessageStatus) => {
    logger().info(`Updating message with ${id} to status: ${status}`)
    const message = await this.messageDaoRepository.findOneBy({id})
    if (message === null) {
      throw new Error(`Message not found ${id}`)
    }
    message.status = status;
    await this.messageDaoRepository.update({id}, message)
  }
}
