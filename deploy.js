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

	await db.createPlayer(client, "", "theo", "Théo");
	await db.createPlayer(client, "", "bertrand", "Bertrand");
	await db.createPlayer(client, "", "axel", "Axel");

	await db.createDefi(client, "", "defi1", "Description 1", 10);
	await db.createDefi(client, "", "defi2", "Description 2", 20);
	await db.createDefi(client, "", "defi3", "Description 3", 30);

    await client.disconnect();
}