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
	to: "",
	subject: '',
	text: ''
};


//
//
// SERVER
const server = http.createServer(async function (request, response) {
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
							var validationId = "user:" + makeId(5) + ":" + encodeURI(body.data.createdUserId) + ":" + encodeURI(body.data.createdUserUsername);

							var res = await db.addPendingValidation(client, validationId);

							if (res) {
								var mo = mailOptions;
								mo.subject = "Joueur à créer: " + body.data.createdUserId;
								mo.text = "Joueur à créer: " + body.data.createdUserUsername + ", id: " + body.data.createdUserId + "\n"
									+ "Créer le joueur: " + server_url + "/" + validationId;

								const admins = process.env.MAIL_ADMIN.split(";");
								admins.forEach(mail => {
									mo.to = mail;
									transporter.sendMail(mailOptions, function (error, info) {
										if (error) {
											console.log(error);
											answer = false;
										} else {
											console.log('Email sent: ' + info.response);
											answer = true;
										}
									});
								});
							}
							break;
						case RequestType.deletePlayer:
							answer = await db.deletePlayer(client, body.data.deletedUserId);
							break;
						case RequestType.validateChallenge:
							var validationId = "defi:" + makeId(5) + ":" + encodeURI(body.data.validatedUserId) + ":" + encodeURI(body.data.validatedChallengeId);

							var res = await db.addPendingValidation(client, validationId);

							if (res) {
								var mo = mailOptions;
								mo.subject = "Défi à valider pour " + body.data.validatedUserId;
								mo.text = "Défi à valider: " + body.data.validatedChallengeId + " pour " + body.data.validatedUserId + "\n"
									+ "Valider le défi: " + server_url + "/" + validationId;
								transporter.sendMail(mailOptions, function (error, info) {
									if (error) {
										console.log(error);
										answer = false;
									} else {
										console.log('Email sent: ' + info.response);
										answer = true;
									}
								});
							}
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
		var answer = "";

		var validationId = decodeURI(request.url.replace("/", ""));

		console.log("received validationId: " + request.url.replace("/", "") + "(decoded: " + validationId + ")");

		//On extrait les parties de l'id qui sont nécessaires au opérations
		const parts = await validationId.split(":");

		//Demande de validation de défi
		if (validationId.startsWith("defi:")) {
			const validationRequests = await db.tryValidation(client, validationId);


			if (validationRequests) {
				const res = await db.validateChallenge(client, parts[2], parts[3]);

				answer = await res ? "Défi validé" : "Défi non validé (déjà validé?)";
			}

		} 
		//Demande de validation de joueur
		else if (validationId.startsWith("user:")) {
			const validationRequests = await db.tryValidation(client, validationId);

			if (validationRequests) {
				const res = await db.createPlayer(client, parts[2], parts[3]);

				answer = await res ? "Joueur créé" : "Joueur non créé (déjà créé?)";
			}
		}


		await response.writeHead(200, { "Content-Type": "application/json" });
		await response.end(JSON.stringify(answer));
	}
});





//
//
// Server start
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