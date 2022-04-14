import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class Event {

  @Column()
  @PrimaryColumn()
  id: string;

  @Column()
  type: string;

  @Column()
  time: number;

  @Column()
  user: string;

  @Column()
  rawData: string;

  static createFromRequest = (rawEvent: any): Event => {
    return {
      id: rawEvent.event_id,
      type: rawEvent.event.type,
      time: rawEvent.event_time,
      user: rawEvent.event.user,
      rawData: JSON.stringify(rawEvent.event)
    } as Event
  }
}
