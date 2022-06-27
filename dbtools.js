const user_db = 0;
const defis_db = 1;

//Users are in db 1 in a basic set. User set, exists and del
//Challenges are stored in db 2, under hash defis. use hSet, hVals, hDel

const Perm = {
	all: 3,
	manager: 2,
	player: 1,
	none: 0,
};

const redis = require("redis");

async function createUser(
	client,
	user,
	pass,
	username,
	nickname,
	perms,
	password
) {
	console.log("Creating user...");
	try {
		if (await client.exists("admin")) {
			//The user must be connected
			const isAuth = await authUser(client, user, pass);
			if (!isAuth) return false;

			//Get the perms. It must be greater than Perm.manager
			const userperms = await getPermsUser(client, user);
			if (userperms < Perm.manager || userperms < perms) return false;
		}

		//Select the db
		await client.select(user_db);

		//If user already exists, leave
		if (await client.exists(username)) return false;

		//Try creating
		return await client.set(
			username,
			JSON.stringify({
				nickname: nickname,
				perms: perms,
				password: password,
				points: 0,
			})
		);
	} catch (error) {
		console.log(error);
	}
}

async function deleteUser(client, user, pass, usernametodel) {
	console.log("Deleting user...");

	try {
		//Lol
		if (usernametodel == "admin") return false;

		//The user must be connected
		const isAuth = await authUser(client, user, pass);
		if (!isAuth) return false;

		//Check permissions
		const userperms = await getPermsUser(client, user);
		const minperms = await getPermsUser(client, usernametodel);
		if (userperms < Perm.manager && userperms <= minperms) return false;

		//Select the db
		await client.select(user_db);

		return await client.del(usernametodel);
	} catch (error) {
		console.log(error);
	}
}

async function authUser(client, username, password) {
	console.log("Auth user...");

	try {
		//Select db
		await client.select(user_db);

		//Get user data
		var user = JSON.parse(await client.get(username));

		//If it doesn't exists, return not auth
		if (!user) return false;

		//If password doesn't match, no auth. Else it worked
		if (user.password != password) return false;
		else return true;
	} catch (error) {
		console.log(error);
	}
}

async function getPermsUser(client, username) {
	console.log("Checking user perms...");

	try {
		//Select db
		await client.select(user_db);

		//Get user data
		const user = JSON.parse(await client.get(username));

		//Return perms if it exists, else return no
		if (user.perms) return user.perms;
		else return Perm.none;
	} catch (error) {
		console.log(error);
	}
}

async function getUser(client, username) {
	console.log("Get user...");

	try {
		//Select the db
		await client.select(user_db);

		//Retrieve user data
		var user = JSON.parse(await client.get(username));

		//Blank out password
		if (user.password) delete user.password;

		return user;
	} catch (error) {
		console.log(error);
	}
}

async function getAllUser(client) {
	console.log("Get all user...");

	try {
		//Select the db
		await client.select(user_db);

		//Retrieve all keys
		const keys = await client.keys("*");

		if (!keys) return [];

		try {
			//Convert keys to users
			var users = await Promise.all(
				keys.map(async (key) => {
					const d = await client.get(key);
					return d;
				})
			);
			
			//Convert to json and delete all passwords
			return users.map((x) => {
				var json = JSON.parse(x);

				//Blank out password
				if (json.password) delete json.password;

				return json;
			});
		} catch (error) {
			console.log(error);
		}

		return [];
	} catch (error) {
		console.log(error);
	}
}

async function createDefi(client, user, pass, name, id, description, points) {
	console.log("Creating defi...");

	try {
		//The user must be connected
		const isAuth = await authUser(client, user, pass);
		if (!isAuth) return false;

		//Get the perms. It must be greater than Perm.player
		const perms = await getPermsUser(client, user);
		if (perms < Perm.manager) return false;

		//Select the db
		await client.select(defis_db);

		//Create the challenge. Returns false if not created (error or whatever)
		return await client.set(
			id,
			JSON.stringify({
				name: name,
				id: id,
				description: description,
				points: points,
			})
		);
	} catch (error) {
		console.log(error);
	}
}

async function deleteDefi(client, user, pass, id) {
	console.log("Deleting defi...");

	try {
		//The user must be connected
		const isAuth = await authUser(client, user, pass);
		if (!isAuth) return false;

		//Get the perms. It must be greater than Perm.player
		const perms = await getPermsUser(client, user);
		if (perms < Perm.manager) return false;

		//Select the db
		await client.select(defis_db);

		//Delete
		return await client.del(id);
	} catch (error) {
		console.log(error);
	}
}

async function listDefi(client) {
	console.log("Listing defi...");

	try {
		//Select defi db
		await client.select(defis_db);

		//Retrieve all keys
		const keys = await client.keys("*");

		if (!keys) return [];

		try {
			//Convert keys to defis
			var defis = await Promise.all(
				keys.map(async (key) => {
					const d = await client.get(key);
					return d;
				})
			);
			return defis.map((x) => JSON.parse(x));
		} catch (error) {
			console.log(error);
		}

		return [];
	} catch (error) {
		console.log(error);
	}
}

module.exports = {
	createUser,
	deleteUser,
	authUser,
	getUser,
	getAllUser,
	createDefi,
	deleteDefi,
	listDefi,
	user_db,
	defis_db,
	Perm,
};
