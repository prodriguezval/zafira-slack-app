import pino, { BaseLogger, Logger } from "pino";

export const logger = (): Logger => {
  return pino();
};
