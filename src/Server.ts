import 'dotenv/config'
import express, { Request, Response } from "express";
import { logger } from "LoggerConfig";

const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  logger().info(`Example app listening on port ${port}`);
});
