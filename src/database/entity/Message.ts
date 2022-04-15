import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

export enum MessageStatus {
  NEW = "new",
  OPEN = "open",
  COMPLETE = "complete",
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column()
  teamId: string;
  @Column()
  userId: string;
  @Column()
  channelId: string;
  @Column({type: "enum", enum: MessageStatus, default: MessageStatus.NEW})
  status: MessageStatus;
  @Column()
  content: string;

  static fromRequest = (rawRequest: any): Message => {
    return {
      teamId: rawRequest.event.team,
      userId: rawRequest.event.user,
      channelId: rawRequest.event.channel,
      content: rawRequest.event.text,
    } as Message
  }
}
