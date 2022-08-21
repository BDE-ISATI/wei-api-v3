const http = require("http");
const db = require("./dbtools");
const encryption = require("./encryption.js");
const nodemailer = require('nodemailer');

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 80;

const server_url = process.env.SERVER_URL;

//
//
//Redis stuff
const redis = require("redis");
const client = redis.createClient({ url: process.env.REDIS_URL });

client.on("error", (err) => console.log("Redis Client Error", err));

//We need the await, otherwise the server will start before redis is ready
async function initRedis() {
	console.log("Initiating redis");
	await client.connect();
}

//Run the init
initRedis();

//
//
// MAIL AUTH
//We need to send emails to the verification team
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.MAIL_LOGIN,
		pass: process.env.MAIL_PASSWORD
	}
});

const mailOptions = {
	from: process.env.MAIL_LOGIN,
	to: process.env.MAIL_ADMIN,
	subject: '',
	text: ''
};


//
//
// SERVER
const server = http.createServer(function (request, response) {
	console.dir(request.param);

	//On request from client
	if (request.method == "POST") {
		//Data
		var body = "";

		//Retrieve data
		request.on("data", function (data) {
			body += data;
		});

		request.on("end", async function () {
			//Parse data
			body = JSON.parse(body);
			//console.log(body);

			var answer = {};
			try {
				//Should not happen
				if (body.type) {

					//Change depending on what the client is requesting
					switch (body.type) {
						case RequestType.getAllPlayers:
							answer = await db.getAllPlayers(client);
							break;
						case RequestType.createPlayer:
							answer = await db.createPlayer(client, body.data.createdUserId, body.data.createdUserUsername);
							break;
						case RequestType.deletePlayer:
							answer = await db.deletePlayer(client, body.data.deletedUserId);
							break;
						case RequestType.validateChallenge:
							var validationId = makeId(5) + ":" + body.data.validatedUserId + ":" + body.data.validatedChallengeId;

							var mo = mailOptions;
							mo.subject = "Défi à valider pour " + body.data.validatedUserId;
							mo.text = "Défi à valider: " + body.data.validatedChallengeId + " pour " + body.data.validatedUserId + "\n"
								+ "Valider le défi: " + server_url + "/" + validationId;
							transporter.sendMail(mailOptions, function (error, info) {
								if (error) {
									console.log(error);
								} else {
									console.log('Email sent: ' + info.response);
								}
							});
							break;
						case RequestType.getAllDefi:
							answer = await db.getAllDefi(client);
							break;
						case RequestType.createDefi:
							answer = await db.createDefi(client, body.data.createdDefiId, body.data.createdDefiName, body.data.createdDefiDescription, body.data.createdDefiPoints);
							break;
						case RequestType.deleteDefi:
							answer = await db.deleteDefi(client, body.data.deletedDefiId);
							break;
						case RequestType.generateEncryptionKey:
							answer = await encryption.generateKeyPairs();
							break;
						default:
							break;
					}
				}
			} catch (error) {
				console.log(error);
			}

			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(answer));
		});
	}

	if (request.method == "GET") {
		console.log(request.url);

		var answer = "";

		var validationId = request.url.replace("/", "");
		if (validationId != "") { 			
			const validationRequests = await db.tryValidation(validationId);
			
			//On extrait du validationId l'utilisateur et le défi à valider
			const parts = validationId.split(":");

			if (validationRequests) {
				const res = await db.validateChallenge(client, parts[1], parts[2]);

				answer = res ? "Défi validé" : "Défi non validé (déjà validé?)";
			}
		}


		await response.writeHead(200, { "Content-Type": "application/json" });
		await response.end(JSON.stringify(validationRequests));
	}
});

server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);

function isAuth(password, key) {
	const password_decrypted = encryption.decrypt(password, key);

	return password_decrypted.message == process.env.ADMIN_PASSWORD;
}



//
//
// Utils
function makeId(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
			charactersLength));
	}
	return result;
}


const RequestType = {
	getAllPlayers: "getAllPlayers",
	createPlayer: "createPlayer",
	deletePlayer: "deletePlayer",
	validateChallenge: "validateChallenge",
	getAllDefi: "getAllDefi",
	createDefi: "createDefi",
	deleteDefi: "deleteDefi",
	generateEncryptionKey: "generateEncryptionKey",
};