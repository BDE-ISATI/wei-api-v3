const http = require('http');

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 80;
//Server url so that we can generate validation urls
const server_url = process.env.SERVER_URL;

/*

INITIALISATION
*/
async function init() {

}

init();

//
//
// SERVER
const server = http.createServer(async function (request, response) {

	//Lors d'une requète d'un client (Toujours des requètes POST pour avoir les joueurs, etc)
	if (request.method == 'POST') {

	}



	//Validation seulement (les URLs que l'on envoie au admins sont traitées ici). Toujours des GET
	if (request.method == 'GET') {

	}
});





//
//
// Server start
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);

