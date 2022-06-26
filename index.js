const http = require("http");
const redis_tools = require("./redis_tools");

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "127.0.0.1";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 80;

const RequestType = {
	GetClassement: "classement",

	GetUserAuth: "auth",
	GetUserPerm: "permissions",
	GetUser: "user",
	CreateUser: "create_user",
	DeleteUser: "delete_user",

	GetDefi: "defis",
	CreateDefi: "create_defi",
	DeleteDefi: "delete_defi",
	ValidateDefi: "validate_defi",
};

const Perm = {
	all: "all",
	manager: "manager",
	player: "player",
	none: "none",
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
						var auth = await redis_tools.authUser(
							client,
							bodyJson.data.username,
							bodyJson.data.password
						);

						answer = { auth: auth };
						break;
					case RequestType.GetUserPerm:
						var user = await redis_tools.getUser(
							client,
							bodyJson.data.username,
							bodyJson.data.password
						);

						answer = { perms: user.perms };
						break;
					case RequestType.GetUser:
						var user = await redis_tools.getUser(
							client,
							bodyJson.data.username,
							bodyJson.data.password
						);

						answer = { user: user };
						break;
					case RequestType.CreateUser:
						await redis_tools.createUser(
							client,
							bodyJson.data.username,
							bodyJson.data.nickname,
							bodyJson.data.perms,
							bodyJson.data.password
						);
						break;
					case RequestType.DeleteUser:
						await redis_tools.deleteUser(
							client,
							bodyJson.data.username
						);
						break;
					case RequestType.GetDefi:
						var defi = await redis_tools.listDefi(client);
						console.log(defi);
						answer = defi;
						break;
					case RequestType.CreateDefi:
						await redis_tools.createDefi(
							client,
							bodyJson.data.username,
							bodyJson.data.password,
							bodyJson.data.name,
							bodyJson.data.description,
							bodyJson.data.points
						);
						break;
					case RequestType.DeleteDefi:
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

