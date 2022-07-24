const http = require("http");
const db = require("./dbtools");

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 80;

const RequestType = {
	GetClassement: "classement",

	GetUserAuth: "auth",
	GetUserPerm: "permissions",
	GetUser: "user",
	GetAllUser: "getall_user",
	CreateUser: "create_user",
	DeleteUser: "delete_user",

	GetDefi: "defis",
	CreateDefi: "create_defi",
	DeleteDefi: "delete_defi",
	ValidateDefi: "validate_defi",
};

//Redis stuff
const redis = require("redis");
const { Console } = require("console");
const client = redis.createClient({ url: process.env.REDIS_URL });

client.on("error", (err) => console.log("Redis Client Error", err));

async function initRedis() {
	console.log("Initiating redis");
	await client.connect();
}

initRedis();

const server = http.createServer(function (request, response) {
	console.dir(request.param);

	//On request from client
	if (request.method == "POST") {
		console.log("POST");

		//Data
		var body = "";

		request.on("data", function (data) {
			body += data;
		});

		request.on("end", async function () {
			console.log("Parsing: " + body);

			//Parse data
			body = JSON.parse(body);

			var answer = {};

			if (body.type) {
				switch (body.type) {
					case RequestType.GetUserAuth:
						var auth = await db.authUser(
							client,
							body.username,
							body.password
						);

						answer = { auth: auth };
						break;
					case RequestType.GetUserPerm:
						var user = await db.getUser(
							client,
							body.username
						);

						answer = { perms: user.perms };
						break;
					case RequestType.GetUser:
						var user = await db.getUser(
							client,
							body.username
						);

						answer = { user: user };
						break;
					case RequestType.GetAllUser:
						var users = await db.getAllUser(
							client
						);

						answer = { users: users };
						break;
					case RequestType.CreateUser:
						var result = await db.createUser(
							client,
							body.username,
							body.password,
							body.usernamename,
							body.data.nickname,
							body.data.perms,
							body.passwordword
						);

						answer = { result: result };
						break;
					case RequestType.DeleteUser:
						var result = await db.deleteUser(
							client,
							body.username,
							body.password,
							body.usernamename
						);

						answer = { result: result };
						break;
					case RequestType.GetDefi:
						var defis = await db.listDefi(client);
						answer = defis;
						break;
					case RequestType.CreateDefi:
						var result = await db.createDefi(
							client,
							body.username,
							body.password,
							body.data.name,
							body.data.id,
							body.data.description,
							body.data.points
						);

						answer = { result: result };
						break;
					case RequestType.DeleteDefi:
						var result = await db.deleteDefi(
							client,
							body.username,
							body.password,
							body.data.id
						);

						answer = { result: result };
						break;
					case RequestType.ValidateDefi:
						break;
					default:
						break;
				}
			}

			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(answer));
		});
	}
});

server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);
