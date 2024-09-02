const redis = require("redis");
const { Markup } = require("telegraf");
const client = redis.createClient();
client.connect();
const dbActions = require("./db.actions");
const axios = require("axios");

//* Start Action
const startAction = (ctx) => {
    const chatId = ctx.chat.id;
    const name = ctx.chat.first_name;

    //* Register User
    dbActions.registerUser(chatId, name);

    //* Send Response
    ctx.reply(
        `Hello There ${ctx.chat.username}😇, Welcome To GPT Chat Bot🤭`,
        Markup.inlineKeyboard([
            [
                Markup.button.callback("GPT-3.5-Turbo", "gpt3.5"),
                Markup.button.callback("GPT-4-o", "gpt4o"),
            ],
            [Markup.button.callback("Microsoft Copilot", "copilot")],
            [Markup.button.callback("Buy Subscription🚀", "subscription")],
        ])
    );
};

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

//* Process The Request
const processRequest = async (ctx, chatId, userAction, userText, apiUrl) => {
    try {
        if (userAction == "copilot") {
            const userTone = await client.get(`user:${chatId}:tone`);

            ctx.reply("Your Request Is Being Processed, Please Wait ...");

            const response = await axios.get(
                `${apiUrl}&action=${userAction}&q=${userText}&tones=${userTone}`
            );

            ctx.reply(`${response.data.result[0].message}`);
        } else if (userAction == "gpt3.5-turbo" || userAction == "gpt4o") {
            ctx.reply("Your Request Is Being Processed, Please Wait ...");

            const response = await axios.get(
                `${apiUrl}&action=${userAction}&q=${userText}`
            );

            ctx.reply(response.data.result[0]);
        }
    } catch (err) {
        if (err) {
            console.log("______New Error______ : ", err);
        }
    }
};

//* Handling Long Response
const longTextHandler = (response) => {
    const maxLength = 4096;
    let amountSliced = Math.floor(response.length / maxLength) + 1;
    console.log("amountSliced -> ", amountSliced);
    let start = 0;
    let end = maxLength;
    let message;
    let messagesArray = [];
    console.log(response.length);

    for (let i = 0; i < amountSliced; i++) {
        message = response.slice(start, end);
        console.log("Current Loop -> ", message);
        messagesArray.push(message);
        start += maxLength;
        end += maxLength;
    }

    console.log("messageArray Length -> ", messagesArray.length);

    console.log("Final Output", messagesArray);
};

module.exports = {
    gpt3TurboAction,
    gpt4oAction,
    copilotAction,
    saveTone,
    startAction,
    processRequest,
};
