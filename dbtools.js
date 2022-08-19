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
const global_db = 0;
const defis_db = 0;
const playerHashName = "players";
const defiHashName = "defis";

//Users are in db 1 in a basic set. User set, exists and del
//Challenges are stored in db 2, under hash defis. use hSet, hVals, hDel

const Perm = {
	all: 3,
	manager: 2,
	player: 1,
	none: 0,
};

const redis = require("redis");

//Example function
/*
MUST RETURN TRUE/FALSE
async function name(client) {

}

*/

async function getAllPlayers(client) {
	await client.select(global_db);

	const players = await client.hVals(playerHashName);

	return players;
}

async function createPlayer(client, authToken, id, name) {
	await client.select(global_db);

	const player = await client.hSet(playerHashName, id, JSON.stringify({
		name: name,
		id: id,
		points: 0,
		challenges_done: []
	}))

	return player == 1;
}

async function deletePlayer(client, authToken, id) {
	await client.select(global_db);

	const player = await client.hDel(playerHashName, id);

	return player == 1;
}

async function validateChallenge(client, authToken, id, defiId) {
	const defi = await getDefi(client, defiId);
	await client.select(global_db);

	const player = await client.hGet(playerHashName, id);
	const json = await JSON.parse(player);

	if (json.challenges_done.includes(defi.id)) {
		return false;
	} else {
		json.challenges_done.push(defi.id);
		json.points = json.points + defi.points;

		const res = await client.hSet(playerHashName, id, JSON.stringify(json));

		return res == 1
	}
}

async function getAllDefi(client) { 
	await client.select(defi_db);

	const defis_keys = await client.hGetAll(defiHashName);

	const defis = defis_keys.map(x => await JSON.parse(await getDefi(client, x)));

	return defis;
}

async function createDefi(client, authToken, defiId, defiName, defiDescription, defiPoints) {
	await client.select(defi_db);

	const defi = await client.hSet(defiHashName, defiId, JSON.stringify({
		name: defiName,
		id: defiId,
		description: defiDescription,
		points: defiPoints
	}))

	return defi == 1;
}

async function deleteDefi(client, authToken, defiId) {
	await client.select(defi_db);

	const defi = await client.hDel(defiHashName, defiId);

	return defi == 1;

}

async function getDefi(client, defiId) {
	await client.select(defi_db);

	return await JSON.parse(await client.hGet(defiHashName, defiId));
}




module.exports = {
	getAllPlayers,
	createPlayer,
	deletePlayer,
	validateChallenge,
	getAllDefi,
	createDefi,
	deleteDefi,
	getDefi,
	user_db,
	defis_db,
	Perm,
};
