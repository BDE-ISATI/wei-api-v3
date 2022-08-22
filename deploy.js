/*
	This file deploys all the data we need in order for the server to work.
	IE: The admin account

	/!\ WARNING /!\
	/!\ WARNING /!\
	/!\ WARNING /!\
	DATABASE WILL BE CLEARED AFTER THIS
	/!\ WARNING /!\
	/!\ WARNING /!\
	/!\ WARNING /!\
	
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

	await db.createDefi(client, "iroquoise", "Iroquoise", "Faire une iroquoise pendant un Lundi Isatien", 10);
	await db.createDefi(client, "rouge", "Coloration rouge",  "Faire une coloration rouge", 10);

    await client.disconnect();
}