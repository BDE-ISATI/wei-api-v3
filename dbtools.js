/*
players:
id {
	name,
	id,
	points,
	challenges_done
}

challenges:
id {
	name,
	id,
	description,
	points
}

*/

const playerHashName = "players";
const defiHashName = "defis";
const teamHashName = "teams";
const validationSetName = "toValidate";

//Users are in db 1 in a basic set. User set, exists and del
//Challenges are stored in db 2, under hash defis. use hSet, hVals, hDel

const redis = require("redis");

//Our redis client
var client;


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
async function getAllPlayers() {
	console.log("Getting players");
	const players_vals = await client.hVals(playerHashName);

	const players = await players_vals.map(player => JSON.parse(player));

	return players;
}

async function createPlayer(id, name, teamId, profilePictureUrl, isTeam) {
	console.log("Creating player");
	//Avoid overwriting player
	if (await client.hGet(playerHashName, id) != null) return false;

	const player = await client.hSet(playerHashName, id, JSON.stringify({
		name: name,
		id: id,
		points: 0,
		teamId: teamId,
		challenges_done: [],
		profilePictureUrl: profilePictureUrl,
		isTeam: isTeam
	}))

	return player >= 1;
}

async function getPlayer(id) {
	console.log("Getting player");
	const player_val = await client.hGet(playerHashName, id);
	const player = await JSON.parse(player_val);

	return player;
}

async function deletePlayer(id) {
	console.log("Deleting player");
	const player = await client.hDel(playerHashName, id);

	return player >= 1;
}

async function validateChallenge(id, defiId) {
	console.log("Validating challenge");
	const defi = await getDefi(defiId);
	const player = await getPlayer(id);

	if (defi == null && player == null) return false;

	var count = 0;
	player.challenges_done.forEach(challenge => {
		if (challenge == id) count++;
	});

	if (count >= defi.faisableXFois || defi.teamOnly != player.isTeam) {
		return false;
	} else {
		player.challenges_done.push(defiId);
		player.points = player.points + defi.points;

		const res = await client.hSet(playerHashName, id, JSON.stringify(player));

		return res == 0
	}
}

async function getAllDefi() {
	console.log("Loading challenges");
	const defis_keys = await client.hVals(defiHashName);

	const defis = await defis_keys.map(defi => JSON.parse(defi));

	return defis;
}

async function createDefi(defiId, defiName, defiDescription, defiPoints, defiImageUrl, defiTeamOnly, faisableXFois, actif) {
	console.log("Creating challenge");
	const defi = await client.hSet(defiHashName, defiId, JSON.stringify({
		name: defiName,
		id: defiId,
		description: defiDescription,
		points: defiPoints,
		image: defiImageUrl,
		teamOnly: defiTeamOnly,
		faisableXFois: faisableXFois,
		actif: actif
	}))

	return defi >= 1;
}

async function deleteDefi(defiId) {
	const defi = await client.hDel(defiHashName, defiId);

	return defi >= 1;
}

async function clearDefis() {
	const res = client.del(defiHashName);

	return res >= 1;
}

async function getDefi(defiId) {
	return await JSON.parse(await client.hGet(defiHashName, defiId));
}

async function addPendingValidation(validationId) {
	const res = await client.sAdd(validationSetName, validationId);

	return res >= 1;
}

async function tryValidation(validationId) {
	const res = await client.sRem(validationSetName, validationId);

	return res >= 1;
}

async function createTeam(teamId, teamName, teamLeaderMail, teamImageUrl) {
	const res = await client.hSet(teamHashName, teamId, JSON.stringify({
		teamId: teamId,
		teamName: teamName,
		teamLeaderMail: teamLeaderMail,
		teamImageUrl: teamImageUrl
	}))

	return res >= 1;
}

async function getTeam(teamId) {
	const res = await client.hGet(teamHashName, teamId);
	if (res == null) {
		console.log("Cette équipe n'existe plus");
		return null;
	}
	const team = await JSON.parse(res);

	const players = await getAllPlayers();
	const teamPlayers = await players.filter(player => player.teamId == teamId);
	const points = await teamPlayers.reduce((previous, current) => previous + current.points, 0);

	team.points = points;


	return team;
}

async function getAllTeams() {
	const teams_keys = await client.hKeys(teamHashName);

	const teams = await Promise.all(teams_keys.map(async (team) => await getTeam(team)));

	return teams;
}

async function clearTeams() {
	const res = client.del(teamHashName);

	return res >= 1;
}



module.exports = {
	initRedis,
	getAllPlayers,
	createPlayer,
	getPlayer,
	deletePlayer,
	validateChallenge,
	getAllDefi,
	createDefi,
	deleteDefi,
	clearDefis,
	getDefi,
	addPendingValidation,
	tryValidation,
	createTeam,
	getTeam,
	getAllTeams,
	clearTeams
};
