const knex = require("./../configs/db");

const registerUser = async (chatId, name) => {
    const isUserExist = await knex("users").where({ chat_id: chatId }).first();

    if (!isUserExist) await knex("users").insert({ chat_id: chatId, name });
};

const incRequestFree = async (chatId) => {
    const user = await knex("users").where({ chat_id: chatId }).first();

    if (user)
        await knex("users")
            .update({ request_free: ++user.request_free })
            .where({ chat_id: chatId });
};

const getRequestFree = async (chatId) => {
    const user = await knex("users").where({ chat_id: chatId }).first();

    return user?.request_free;
};

module.exports = { registerUser, incRequestFree, getRequestFree };
