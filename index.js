const http = require("http");
const db = require("./dbtools");
const googlesheet = require("./sheetsreader.js")
const encryption = require("./encryption.js");
const nodemailer = require('nodemailer');

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 80;
//Server url so that we can generate validation urls
const server_url = process.env.SERVER_URL;




/*

INITIALISATION
*/
async function init() {
	db.initRedis();
	await googlesheet.initSheetReader();
	await googlesheet.getChallenges();

}
init();

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

//Default mail options
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

	//Lors d'une requète d'un client (Toujours des requètes POST pour avoir les joueurs, etc)
	if (request.method == "POST") {
		//Données de la demande
		var body = "";

		//Récupère la demande
		request.on("data", function (data) {
			body += data;
		});

		request.on("end", async function () {
			//On récupère les données de la demande
			body = JSON.parse(body);

			var answer = {};
			try {
				//Ne devrais pas arriver mais on sais jamais, vérification de sécurité
				if (body.type) {

					//La réponse varie selon la demande (un RequestType)
					switch (body.type) {
						case RequestType.getAllPlayers:
							answer = await db.getAllPlayers();
							break;
						case RequestType.createPlayer:

							//On récupère le pseudo
							var pseudo = body.data.createdUserUsername;
							//Génération de l'ID du joueur coté serveur pour qu'il n'y ai pas de charactère spéciaux
							var id = pseudo.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
							//Image en base64
							var imageBase64 = body.data.createdUserProfilePicture;

							//Envoi de l'image sur imgur
							var imageUrl = (await uploadImage(imageBase64)).replace(/https:\/\/i.imgur.com\//g, "");

							if (!imageUrl) break;

							//Création de l'id de validation qu'on va envoyer au admins
							var validationId = "user:" + makeId(5) + ":" + encodeURI(id) + ":" + encodeURI(pseudo) + ":" + encodeURI(imageUrl);

							//On ajoute l'id de validation a la base de donnée pour que ce ne soit pas perdu lors d'un redémarrage
							var res = await db.addPendingValidation(validationId);

							//Si tout à réussi, on envoie un mail au admins
							if (res) {
								var mo = mailOptions;
								mo.subject = "Joueur à créer: " + pseudo;
								mo.text = "Joueur à créer: " + pseudo + ", id: " + id + "\n"
									+ "Image: " + "https://i.imgur.com/" + imageUrl + "\n"
									+ "Créer le joueur: " + server_url + "/" + validationId;

								sendMail(mo);

								answer = true;
							} else answer = false;

							break;
						case RequestType.deletePlayer:
							answer = await db.deletePlayer(body.data.deletedUserId);
							break;
						case RequestType.validateChallenge:
							//Récupère les id
							var userId = body.data.validatedUserId;
							var challengeId = body.data.validatedChallengeId;
							//Image en base64
							var imageBase64 = body.data.validatedChallengeImage;

							//Envoie l'image sur imgur
							var imageUrl = await uploadImage(imageBase64);

							if (!imageUrl) break;

							//Création de l'id de validation qu'on va envoyer au admins
							var validationId = "defi:" + makeId(5) + ":" + encodeURI(userId) + ":" + encodeURI(challengeId);

							//On ajoute l'id de validation a la base de donnée pour que ce ne soit pas perdu lors d'un redémarrage
							var res = await db.addPendingValidation(validationId);

							//Si tout à réussi, on envoie un mail au admins
							if (res) {
								var mo = mailOptions;
								mo.subject = "Défi à valider pour " + userId;
								mo.text = "Défi à valider: " + challengeId + " pour " + userId + "\n"
									+ "Preuve photo: " + imageUrl + "\n"
									+ "Valider le défi: " + server_url + "/" + validationId;

								sendMail(mo);

								answer = true;
							} else answer = false;
							break;
						case RequestType.getAllDefi:
							answer = await db.getAllDefi();
							break;
						case RequestType.createDefi:
							answer = await db.createDefi(body.data.createdDefiId, body.data.createdDefiName, body.data.createdDefiDescription, body.data.createdDefiPoints);
							break;
						case RequestType.deleteDefi:
							answer = await db.deleteDefi(body.data.deletedDefiId);
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



	//Validation seulement (les URLs que l'on envoie au admins sont traitées ici). Toujours des GET
	if (request.method == "GET") {
		var answer = "";

		var validationId = request.url.replace("/", "");

		//On extrait les parties de l'id qui sont nécessaires au opérations
		//On utilise decodeURI pour récupérer les charactères spéciaux du pseudo
		const parts = decodeURI(validationId).split(":");

		//Demande de validation de défi
		if (validationId.startsWith("defi:")) {
			const validationRequests = await db.tryValidation(validationId);


			if (validationRequests) {
				const res = await db.validateChallenge(parts[2], parts[3]);

				answer = res ? "Défi validé" : "Défi non validé (déjà validé?)";
			} else {
				answer = "Défi non validé (déjà validé?)";
			}

		}
		//Demande de validation de joueur
		else if (validationId.startsWith("user:")) {
			const validationRequests = await db.tryValidation(validationId);

			if (validationRequests) {
				const res = await db.createPlayer(parts[2], parts[3], "https://i.imgur.com/" + parts[4]);

				answer = res ? "Joueur créé" : "Joueur non créé (déjà créé?)";
			} else {
				answer = "Joueur non créé (déjà créé?)";
			}
		}
		//Rechargement des défis à partir du doc excel
		else if (validationId.startsWith("reloadchallenges")) {

		}


		response.writeHead(200, { "Content-Type": "application/json" });
		response.end(JSON.stringify(answer));
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
	headers.append("Authorization", "Client-ID " + process.env.IMGUR_ID);

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