//* Requirements
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const redis = require("redis");
const client = redis.createClient();
const botActions = require("./actions/bots.actions");
require("dotenv").config();

//* Configs
const tones = ["balanced", "creative", "precise"];

//* Telegraf
const bot = new Telegraf(process.env.telegramToken);

bot.start((ctx) => {
    ctx.reply(
        `Hello There ${ctx.chat.username}, Welcome To GPT Chat Bot`,
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

bot.action("gpt4", (ctx) => botActions.gpt4oAction(ctx));

bot.action("copilot", (ctx) => {
    client.set(`user:${ctx.chat.id}:action`, "copilot");

    //? Conditions

    ctx.editMessageText(
        "Now Select Your Desired Mode",
        Markup.inlineKeyboard([
            [Markup.button.callback("Balanced", "balanced")],
            [
                Markup.button.callback("Precise", "precise"),
                Markup.button.callback("Creative", "creative"),
            ],
        ])
    );
});

bot.on("callback_query", (query) => {
    const tone = query.update.callback_query.data;

    if (tones.includes(tone)) {
        botActions.saveTone(tone, query);
    }
});

bot.launch(async () => {
    await client.connect();
    console.log("Bot Launched Successfully :))");
});
