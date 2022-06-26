const http = require("http");
const redis = require("redis");
const client = redis.createClient({url: process.env.REDIS_URL});


const RequestType = {
	GetDefi: "defis",
	GetClassement: "classement",
	GetUserPerm: "permissions",
};

const server = http.createServer(function (request, response) {
	console.dir(request.param);

	if (request.method == "POST") {
		console.log("POST");

		var body = "";

		request.on("data", function (data) {
			body += data;
		});

		request.on("end", function () {
            console.log("Parsing: " + body);

            var bodyJson = JSON.parse(body);
    
            var answer = {};
    
            if (bodyJson.type) {
                switch (bodyJson.type) {
                    case RequestType.GetDefi:
                        console.log("Requested defis");
                        answer = [
                            { name: "Iroquoise", description: "Faire une iroquoise pendant un LI", points: -1 },
                            {
                                name: "Pro musical",
                                description:
                                    "Aller faire un solo au club de musique",
                                points: 10,
                            },
                            {
                                name: "Smooth",
                                description: "Faire un rasage intégral",
                                points: -1,
                            },
                            {
                                name: "Couisine",
                                description:
                                    "Participer au concours de cuisine (le jury choisis les points)",
                                points: -1,
                            },
                            {
                                name: "Before Sleep",
                                description: "Participer au 1er afterwork",
                                points: 69,
                            },
                            {
                                name: "Patriote",
                                description:
                                    "Faire un drapeau pour son équipe et l'afficher dans le hall",
                                points: -1,
                            },
                        ];
                        break;
                    default:
                        break;
                }
            }
    
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(answer));
        });
	} else if (request.method == "GET") {
		console.log("GET");

		var body = "";

		request.on("data", function (data) {
			body += data;
		});

		request.on("end", function () {});
		response.writeHead(200, { "Content-Type": "application/json" });
		response.end();
	}
});

const port = 3100;
const host = "127.0.0.1";
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);
