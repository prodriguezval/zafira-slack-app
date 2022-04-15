import {MessageRepository} from "repository/MessageRepository";
import {MessageStatus} from "database/entity/Message";

export class UpdateMessageStatus {
  constructor(private messageRepository: MessageRepository) {
  }

  execute = async (messageId: string, status: string) => {
    await this.messageRepository.updateStatus(messageId, status as MessageStatus)
  }
}
