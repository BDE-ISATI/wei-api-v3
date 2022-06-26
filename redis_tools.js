const user_db = 0;
const defis_db = 1;

//Users are in db 1 in a basic set. User set, exists and del
//Challenges are stored in db 2, under hash defis. use hSet, hVals, hDel


const redis = require("redis");

async function createUser(client, username, nickname, perms, encryptedpw) {
	await client.select(user_db);

	if (await client.exists(username)) return false;

	return await client.set(
		username,
		JSON.stringify({
			nickname: nickname,
			perms: perms,
			password: encryptedpw,
			points: 0,
		})
	);
}

async function deleteUser(client, username) {
	if (username == "admin") return false;

	await client.connect();

	await client.select(user_db);
	return await client.del(username);
}

async function authUser(client, username, password) {
	await client.select(user_db);

	var user = JSON.parse(await client.get(username));

	if (!user) return false;

	if (user.password != password) return false;
	else return true;
}

async function getPermsUser(client, username, password) {
    const isAuth = await authUser(client, username, password);

    if (!isAuth) return "none";
    
	await client.select(user_db);

    const user = JSON.parse(await client.get(username));

    return user.perms;
}

async function getUser(client, username, password) {
    const isAuth = await authUser(client, username, password);

    if (!isAuth) return "none";
    
	await client.select(user_db);

    const user = JSON.parse(await client.get(username));

    return user;
}

async function createDefi(client, username, password, name, id, description, points) {
    const isAuth = await authUser(client, username, password);

    if (!isAuth) return false;

    const perms = await getPermsUser(client, username, password);

    if (perms == "none") return false;


	await client.select(defis_db);

	return await client.hSet("defis", id,
		JSON.stringify({
			name: name,
			id: id,
			description: description,
			points: points,
		})
	);
}

async function deleteDefi(client, username, password, id) {
    const isAuth = await authUser(client, username, password);

    if (!isAuth) return false;

    const perms = await getPermsUser(client, username, password);

    if (perms == "none") return false;

	await client.select(defis_db);

	return await client.hDel("defis", id);
}

async function listDefi(client) {
	await client.select(defis_db);

    const defis = await client.hVals("defis");

	return await defis.map(x => JSON.parse(x));
}

module.exports = {
	createUser,
	deleteUser,
	authUser,
	getUser,
	createDefi,
	deleteDefi,
	listDefi,
	user_db,
	defis_db,
};
