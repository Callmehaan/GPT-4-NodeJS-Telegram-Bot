//* Requirements
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const redis = require("redis");
const client = redis.createClient();
const botActions = require("./actions/bots.actions");
require("dotenv").config();

//* Configs
const tones = ["balanced", "creative", "precise"];
const apiUrl = `https://one-api.ir/chatgpt/?token=${process.env.apiToken}`;

//* Telegraf
const bot = new Telegraf(process.env.telegramToken);

bot.start((ctx) => {
    ctx.reply(
        `Hello There ${ctx.chat.username}😇, Welcome To GPT Chat Bot🤭`,
        Markup.inlineKeyboard([
            [
                Markup.button.callback("GPT-3.5-Turbo", "gpt3.5"),
                Markup.button.callback("GPT-4-o", "gpt4o"),
            ],
            [Markup.button.callback("Microsoft Copilot", "copilot")],
        ])
    );
});

bot.action("gpt3.5", (ctx) => botActions.gpt3TurboAction(ctx));

bot.action("gpt4o", (ctx) => botActions.gpt4oAction(ctx));

bot.action("copilot", (ctx) => botActions.copilotAction(ctx));

bot.on("callback_query", (query) => {
    const tone = query.update.callback_query.data;

    if (tones.includes(tone)) {
        botActions.saveTone(tone, query);
    }
});

bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.text;
    const userAction = await client.get(`user:${chatId}:action`);

    if (userAction == "copilot") {
        const userTone = await client.get(`user:${chatId}:tone`);

        const response = await axios.get(
            `${apiUrl}&action=${userAction}&q=${userText}&tones=${userTone}`
        );

        ctx.reply(`${response.data.result[0].message}`);
    } else if (userAction == "gpt3.5-turbo" || userAction == "gpt4o") {
        const response = await axios.get(
            `${apiUrl}&action=${userAction}&q=${userText}`
        );

        ctx.reply(response.data.result[0]);
    }
});

bot.launch(async () => {
    await client.connect();
    console.log("Bot Launched Successfully :))");
});
