import {Column, Entity, PrimaryColumn} from "typeorm";


export enum EventType {
  MESSAGE_RECEIVED = "message",
  HOME_OPENED = "app_home_opened",
}

@Entity()
export class Event {

  @PrimaryColumn()
  id: string;

  @Column({type: "enum", enum: EventType, default: EventType.MESSAGE_RECEIVED})
  type: EventType;

  @Column()
  time: number;

  @Column()
  user: string;

  @Column()
  channel: string;

  @Column()
  rawData: string;

  static fromRequest = (rawEvent: any): Event => {
    return {
      id: rawEvent.event_id,
      type: rawEvent.event.type,
      time: rawEvent.event_time,
      user: rawEvent.event.user,
      channel: rawEvent.event.channel,
      rawData: JSON.stringify(rawEvent.event)
    } as Event
  }
}
