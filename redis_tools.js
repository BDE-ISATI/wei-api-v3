const user_db = 0;
const defis_db = 1;

const redis = require("redis");

async function createUser(client, username, nickname, perms, encryptedpw) {
	await client.select(user_db);

	await client.set(
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
	if (username == "admin") return;

	await client.connect();

	await client.select(user_db);
	await client.del(username);
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

async function createDefi(client, username, password, name, description, points) {
    const isAuth = await authUser(client, username, password);

    if (!isAuth) return;

    const perms = await getPermsUser(client, username, password);

    if (perms == "none") return;


	await client.select(defis_db);

	await client.sAdd("defis",
		JSON.stringify({
			name: name,
			description: description,
			points: points,
		})
	);
}

async function deleteDefi(client, username, password) {
	await client.select(defis_db);
}

async function listDefi(client) {
	await client.select(defis_db);

    const defi = await client.sMembers("defis");

    return defi.map(x => JSON.parse(x));
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
