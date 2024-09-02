//* Requirements
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const redis = require("redis");
const client = redis.createClient();
const botActions = require("./actions/bots.actions");
require("dotenv").config();
const dbActions = require("./actions/db.actions");

//* Configs
const tones = ["balanced", "creative", "precise"];
const plans = ["plan3.5", "plan4o", "planCopilot", "planVip"];
const periodPlans = ["period7", "period15", "period30", "period90"];
const apiUrl = `https://one-api.ir/chatgpt/?token=${process.env.apiToken}`;
const knex = require("./configs/db");

//* Telegraf
const bot = new Telegraf(process.env.telegramToken);

bot.start((ctx) => botActions.startAction(ctx));

//* Plans
bot.action("subscription", (ctx) => {
    const chatId = ctx.chat.id;

    ctx.editMessageText(
        "Please Choose A Plan😇",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("Buy GPT-3.5-Turbo", "plan3.5"),
                Markup.button.callback("GPT-4-o", "plan4o"),
            ],
            [
                Markup.button.callback("Buy Copilot", "planCopilot"),
                Markup.button.callback("Buy VIP Plan", "planVip"),
            ],
        ])
    );
});

//* Bot Actions
bot.action("gpt3.5", (ctx) => botActions.gpt3TurboAction(ctx));

bot.action("gpt4o", (ctx) => botActions.gpt4oAction(ctx));

bot.action("copilot", (ctx) => botActions.copilotAction(ctx));

//* Callback Query Handler
bot.on("callback_query", async (query) => {
    const value = query.update.callback_query.data;
    const chatId = query.update.callback_query.from.id;
    const nowTimestamps = Math.floor(Date.now() / 1000);

    const user = await knex("users").where({ chat_id: chatId }).first();

    //* Save Tone
    if (tones.includes(value)) {
        botActions.saveTone(value, query);
    } else if (plans.includes(value)) {
        //* Order Plan
        const plan = value.substr(4);
        const order = await knex("orders").insert({
            user_id: user.id,
            plan,
            created_at: nowTimestamps,
        });

        //* Get Plan Prices
        const mainPlan = await knex("prices").where({ plan });

        const time7 = mainPlan.find((plan) => plan.period == 7);
        const time15 = mainPlan.find((plan) => plan.period == 15);
        const time30 = mainPlan.find((plan) => plan.period == 30);
        const time90 = mainPlan.find((plan) => plan.period == 90);

        //* Send Price List Keyboard
        query.editMessageText(
            "Great😃, Now Please Choose Your Desire Option In Below😇",
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(
                        `7 Days -> ${time7.price}T`,
                        "period7"
                    ),
                    Markup.button.callback(
                        `15 Days -> ${time15.price}T`,
                        "period15"
                    ),
                ],
                [
                    Markup.button.callback(
                        `1 Month -> ${time30.price}T`,
                        "period30"
                    ),
                    Markup.button.callback(
                        `3 Month -> ${time90.price}T`,
                        "period90"
                    ),
                ],
            ])
        );
    } else if (periodPlans.includes(value)) {
        const chatId = query.chat.id;
        const userId = user.id;

        //* Period Plan
        const periodTimeSelected = value.substr(6);

        //* Get Last Order
        const lastOrder = await knex("orders")
            .where({ user_id: userId })
            .orderBy("id", "DESC")
            .limit(1)
            .first();

        //* Get Amount From Database
        const planPrice = await knex("prices")
            .where({ plan: lastOrder.plan, period: periodTimeSelected })
            .first();

        //* Update Order
        const updateOrder = await knex("orders")
            .update({ period: periodTimeSelected, amount: planPrice.price })
            .where({ id: lastOrder.id });

        const completedOrder = await knex("orders")
            .where({ id: lastOrder.id })
            .first();

        console.log("Completed Order Is -> ", completedOrder);
    }
});

bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.text;
    const userAction = await client.get(`user:${chatId}:action`);

    if (userAction) {
        const requestFreeCount = await dbActions.getRequestFree(chatId);

        if (requestFreeCount >= 5) {
            ctx.reply("The number of your free requests has been exhausted⛔");
        } else {
            await botActions.processRequest(
                ctx,
                chatId,
                userAction,
                userText,
                apiUrl
            );

            botActions.startAction(ctx);

            //* Increase request_free
            dbActions.incRequestFree(chatId);
        }
    } else botActions.startAction(ctx);
});

bot.launch(async () => {
    await client.connect();
    console.log("Bot Launched Successfully :))");
});
