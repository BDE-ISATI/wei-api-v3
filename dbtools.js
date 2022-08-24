/*
Global db stores all player data in a hash, one player = one field
hash key : player

id {
	name,
	id,
	points,
	challenges_done
}

defis db stores only challenges as strings

id {
	name,
	id,
	description,
	points
}

*/
const playerHashName = "players";
const defiHashName = "defis";
const validationSetName = "toValidate";

//Users are in db 1 in a basic set. User set, exists and del
//Challenges are stored in db 2, under hash defis. use hSet, hVals, hDel

const Perm = {
	all: 3,
	manager: 2,
	player: 1,
	none: 0,
};

const redis = require("redis");

//Our redis client
var client;


//We need the await, otherwise the server will start before redis is ready
/**
 * Initialization of redis
 */
async function initRedis() {
	console.log("Initiating redis"); 
	client = redis.createClient({ url: process.env.REDIS_URL });
	client.on("error", (err) => console.log("Redis Client Error", err));
	await client.connect();
	await client.select(0);
}



/**
 * @param {*} client Redis client
 * @returns a list of all players in the db (as json objects)
 */
async function getAllPlayers(client) {
	const players_vals = await client.hVals(playerHashName);

	const players = players_vals.map(player => JSON.parse(player));

	return players;
}

async function createPlayer(id, name, profilePictureUrl) {//Avoid overwriting player
	if (await client.hGet(playerHashName, id) != null) return false;

	const player = await client.hSet(playerHashName, id, JSON.stringify({
		name: name,
		id: id,
		points: 0,
		challenges_done: [],
		profilePictureUrl: profilePictureUrl
	}))

	return player == 1;
}

async function deletePlayer(id) {
	const player = await client.hDel(playerHashName, id);

	return player == 1;
}

async function validateChallenge(id, defiId) {
	const defi = await getDefi(defiId);

	const player = await client.hGet(playerHashName, id);
	const json = JSON.parse(player);

	if (json.challenges_done.includes(defi.id)) {
		return false;
	} else {
		json.challenges_done.push(defi.id);
		json.points = json.points + defi.points;

		const res = await client.hSet(playerHashName, id, JSON.stringify(json));

		return res == 0
	}
}

async function getAllDefi(client) {
	const defis_keys = await client.hVals(defiHashName);

	const defis = defis_keys.map(defi => JSON.parse(defi));

	return defis;
}

async function createDefi(defiId, defiName, defiDescription, defiPoints) {
	const defi = await client.hSet(defiHashName, defiId, JSON.stringify({
		name: defiName,
		id: defiId,
		description: defiDescription,
		points: defiPoints
	}))

	return defi == 1;
}

async function deleteDefi(defiId) {
	const defi = await client.hDel(defiHashName, defiId);

	return defi == 1;

}

async function getDefi(defiId) {
	return JSON.parse(await client.hGet(defiHashName, defiId));
}

async function addPendingValidation(validationId) {
	const res = await client.sAdd(validationSetName, validationId);

	return res == 1;
}

async function tryValidation(validationId) {
	const res = await client.sRem(validationSetName, validationId);

	return res == 1;
}

async function addEvent(event) {
	
}




module.exports = {
	initRedis,
	getAllPlayers,
	createPlayer,
	deletePlayer,
	validateChallenge,
	getAllDefi,
	createDefi,
	deleteDefi,
	getDefi,
	addPendingValidation,
	tryValidation,
	Perm,
};
