const { split } = require("ffmpeg-static");

module.exports = {
  name: "ping",
  cooldown: 3,
  description: "Show the bot's average ping",
  execute(message) {
    message.reply(`📈 Average ping to API: ${Math.round(message.client.ws.ping) / 100} ms`).catch(console.error);
  }
};
