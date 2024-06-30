const redis = require("redis");
const { Markup } = require("telegraf");
const client = redis.createClient();
client.connect();

//* Bot Selection
const gpt3TurboAction = (ctx) => {
    client.set(`user:${ctx.chat.id}:action`, "gpt3.5-turbo");

    ctx.editMessageText("Hello, How Can I Help You ?!");
};

const gpt4oAction = (ctx) => {
    client.set(`user:${ctx.chat.id}:action`, "gpt4o");

    ctx.editMessageText("Hello, How Can I Help You ?!");
};

const copilotAction = (ctx) => {
    client.set(`user:${ctx.chat.id}:action`, "copilot");

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
};

//* Tone Selection
const saveTone = (tone, ctx) => {
    client.set(`user:${ctx.chat.id}:tone`, tone);

    ctx.editMessageText("Hello, How Can I Help You ?!");
};

module.exports = { gpt3TurboAction, gpt4oAction, copilotAction, saveTone };
