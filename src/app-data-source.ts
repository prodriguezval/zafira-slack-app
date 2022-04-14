import {DataSource} from "typeorm";

export const myDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASS,
  database: "zafira-bot",
  entities: ["src/database/entity/*.ts"],
  logging: true,
  synchronize: true,
});
