# Slack Bot

This project is built to support these requirements:

* Build a Slack app that can be added to individual shared or Slack Connect channels
* When added, the app can read messages incoming into the channel
  * On the backend, the app identifies users who belong to the workspace (e.g, share the same domain as the workspace)
    vs external users (e.g, implied customers/guests who do not have the same email domain as the workspace)
* The Slack app's Home page displays the messages that have come from 1) channels where the app has been added and 2)
  messages where the sender is an external user
  * When messages come in, they default to a "New" status
* In the Slack app Home tab, users can see the messages that have come in, and they can use a picklist to choose 2 other
  statuses: "Open" or "Complete"
* When the message status is moved to "Complete," the messages are hidden from the Home tab view.

## Built with:

* express
* dotenv
* pino
* @slack/web-api
  * tsscmp
* typeorm
  * pg
  * reflect-metadata
