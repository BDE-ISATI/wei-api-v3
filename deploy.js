/*

This file is used to first init the server

We add the main user, then create some test challenges.

*/


const db = require("./dbtools");

const redis = require("redis");
const client = redis.createClient({ url: process.env.REDIS_URL });

client.on("error", (err) => console.log("Redis Client Error", err));

//Data
initRedis()

async function initRedis() {
	await client.connect();

    await client.flushAll();

    await db.createUser(client, "", "", "admin", "Théo", db.Perm.all, "test");
    await db.createUser(client, "admin", "test", "joueurtest", "Bertrand", db.Perm.player, "test");

	/*await client.set("defis", "");

	const value = await client.get("key");

    console.log(value);

    await client.del("key");*/

    //await redis_tools.createDefi(client, "admin", "test", "Iroquoise", "iro", "Faire une iroquoise pendant un LI", 10);

    const defis = await db.listDefi(client);

    console.log(defis);

    await client.disconnect();
}