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
/**
 * Initialization of redis
 */
async function initRedis() {
	console.log("Initiating redis");
	await client.connect();
	await client.select(0);
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

	//On request from client (these will always be post requests)
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

							//We get the pseudo
							var pseudo = body.data.createdUserUsername;
							//Generate id server side
							var id = pseudo.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
							//Image in base64
							var imageBase64 = body.data.createdUserProfilePicture;

							//Uploads the image to imgur
							var imageUrl = (await uploadImage(imageBase64)).replace(/https:\/\/i.imgur.com\//g, "");

							if (!imageUrl) break;

							//Generate validationId used on the url to verify creation
							var validationId = "user:" + makeId(5) + ":" + encodeURI(id) + ":" + encodeURI(pseudo) + ":" + encodeURI(imageUrl);

							//Add the current validation to the db so that it's not lost when server shuts down
							var res = await db.addPendingValidation(client, validationId);

							//If the creation was successful, send the mail to the admins
							if (res) {
								var mo = mailOptions;
								mo.subject = "Joueur à créer: " + pseudo;
								mo.text = "Joueur à créer: " + pseudo + ", id: " + id + "\n"
									+ "Image: " + "https://i.imgur.com/" + imageUrl + "\n"
									+ "Créer le joueur: " + server_url + "/" + validationId;

								sendMail(mo);

								answer = true;
							}

							break;
						case RequestType.deletePlayer:
							answer = await db.deletePlayer(client, body.data.deletedUserId);
							break;
						case RequestType.validateChallenge:
							//Get the ids
							var userId = body.data.validatedUserId;
							var challengeId = body.data.validatedChallengeId;
							//Image in base64
							var imageBase64 = body.data.validatedChallengeImage;

							//Uploads the image to imgur
							var imageUrl = await uploadImage(imageBase64);

							if (!imageUrl) break;

							//Generate validationId used on the url to verify validation
							var validationId = "defi:" + makeId(5) + ":" + encodeURI(userId) + ":" + encodeURI(challengeId);

							//Add the current validation to the db so that it's not lost when server shuts down
							var res = await db.addPendingValidation(client, validationId);

							//If the creation was successful, send the mail to the admins
							if (res) {
								var mo = mailOptions;
								mo.subject = "Défi à valider pour " + userId;
								mo.text = "Défi à valider: " + challengeId + " pour " + userId + "\n"
									+ "Preuve photo: " + imageUrl + "\n"
									+ "Valider le défi: " + server_url + "/" + validationId;

								sendMail(mo);

								answer = true;
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



	//Validation only (when accessings validation urls from the mail)
	if (request.method == "GET") {
		var answer = "";

		var validationId = request.url.replace("/", "");

		//On extrait les parties de l'id qui sont nécessaires au opérations
		//On utilise decodeURI pour récupérer les charactères spéciaux du pseudo
		const parts = await decodeURI(validationId).split(":");

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
				const res = await db.createPlayer(client, parts[2], parts[3], "https://i.imgur.com/" + parts[4]);

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


//
//
// Utils
/**
 * 
 * @param {int} length 
 * @returns a string of `length` random characters
 */
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

/**
 * Sends an email to all admins
 * @param {*} mailOptions mail options (see https://nodemailer.com/message/)
 */
function sendMail(mailOptions) {
	const admins = process.env.MAIL_ADMIN.split(";");
	admins.forEach(mail => {
		mailOptions.to = mail;
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


/**
 * Uploads image to imgur
 * @param {string} imageBase64 a string representing a base64 image
 */
async function uploadImage(imageBase64) {
	const headers = new Headers();
	headers.append("Authorization", "Client-ID 0cab4834935cf6b");

	const formdata = new FormData();
	formdata.append("image", imageBase64);
	formdata.append("title", makeId(10));
	formdata.append("description", "A challenge someone made during the WEI!");

	const requestOptions = {
		method: 'POST',
		headers: headers,
		body: formdata,
		redirect: 'follow',
		origin: "https://wei.isati.org",
		referer: "https://wei.isati.org/"
	};

	// @ts-ignore
	const res = await fetch("https://api.imgur.com/3/image", requestOptions)
		.then(response => response.text())
		.then(result => { return result })

	console.log(res);

	try {
		const json = await JSON.parse(res);
		if (json.data.link) {
			return json.data.link;
		} else {
			return false;
		}
	} catch (error) {
		return "https://i.imgur.com/AJ3InNO.png";
	}

}

/**
 * Find the correct decoding key from `key` and uses it to decode then auth
 * @param {string} password the encoded password
 * @param {string} key the key used to encode
 * @returns returns true if the decoded password is equal to `process.env.ADMIN_PASSWORD`
 */
function isAuth(password, key) {
	const password_decrypted = encryption.decrypt(password, key);

	return password_decrypted.message == process.env.ADMIN_PASSWORD;
}


//
//
// Enums

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