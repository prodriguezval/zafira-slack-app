import {Repository} from "typeorm";
import {Event} from "database/entity/Event";
import {logger} from "LoggerConfig";

export class EventRepository {
  constructor(private eventDaoRepository: Repository<Event>) {
  }

  exists = async (event: Event): Promise<boolean> => {
    const result = await this.eventDaoRepository.findOneBy({id: event.id})
    return result !== null
  }
  save = async (requestEvent: Event) => {
    logger().info(`Saving Event ${requestEvent.id} in the database`)
    await this.eventDaoRepository.save(requestEvent);
  }
}
