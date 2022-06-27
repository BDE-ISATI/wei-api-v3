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

	if (request.method == "POST") {
		console.log("POST");

		var body = "";

		request.on("data", function (data) {
			body += data;
		});

		request.on("end", async function () {
			console.log("Parsing: " + body);

			var bodyJson = JSON.parse(body);

			var answer = {};

			if (bodyJson.type) {
				switch (bodyJson.type) {
					case RequestType.GetUserAuth:
						var auth = await db.authUser(
							client,
							bodyJson.data.user,
							bodyJson.data.pass
						);

						answer = { auth: auth };
						break;
					case RequestType.GetUserPerm:
						var user = await db.getUser(
							client,
							bodyJson.data.user,
							bodyJson.data.pass
						);

						answer = { perms: user.perms };
						break;
					case RequestType.GetUser:
						var user = await db.getUser(
							client,
							bodyJson.data.user,
							bodyJson.data.pass
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
							bodyJson.data.user,
							bodyJson.data.pass,
							bodyJson.data.username,
							bodyJson.data.nickname,
							bodyJson.data.perms,
							bodyJson.data.password
						);

						answer = { result: result };
						break;
					case RequestType.DeleteUser:
						var result = await db.deleteUser(
							client,
							bodyJson.data.user,
							bodyJson.data.pass,
							bodyJson.data.username
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
							bodyJson.data.user,
							bodyJson.data.pass,
							bodyJson.data.name,
							bodyJson.data.id,
							bodyJson.data.description,
							bodyJson.data.points
						);

						answer = { result: result };
						break;
					case RequestType.DeleteDefi:
						var result = await db.deleteDefi(
							client,
							bodyJson.data.user,
							bodyJson.data.pass,
							bodyJson.data.id
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
