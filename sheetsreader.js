const { GoogleSpreadsheet } = require('google-spreadsheet');
const db = require("./dbtools.js")

// The document we will reader from
var doc;


/**
 * initializes the sheet reader
 */
async function initSheetReader() {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    doc.useApiKey(process.env.GOOGLE_API_KEY);
}

/**
 * Loads all challenges from the specified google sheet 
 * @returns `true` if all challenges were loaded, `false` if not
 */
async function reloadChallenges() {
    console.log("Reloading challenges");

    try {
        //Get all doc data
        await doc.loadInfo();
        const sheet = await doc.sheetsByIndex[0];
        await sheet.loadHeaderRow(1);
        const rows = await sheet.getRows({ limt: 100 });

        //Clears the old list
        await db.clearDefis();

        //add all new challenges
        rows.forEach(row => {

            if (row.identifiant != "" && row.nom != "" && row.description != "" && row.points != "" && row.image != "") {
                console.log(`Id: ${row.identifiant}, nom: ${row.nom}, description: ${row.description}, points: ${row.points}, image: ${row.image}`);
                db.createDefi(row.identifiant, row.nom, row.description, parseInt(row.points), row.image);
            }
        });

        console.log("Challenges loaded!");
        return true;
    } catch (error) {
        console.log("Error while reloading challenges!");
        console.log(error);
        return false;
    }
}


/**
 * Loads all challenges from the specified google sheet 
 * @returns `true` if all challenges were loaded, `false` if not
 */
async function reloadTeams() {
    console.log("Reloading teams");

    try {
        //Get all doc data
        await doc.loadInfo();
        const sheet = await doc.sheetsByIndex[1];
        await sheet.loadHeaderRow(1);
        const rows = await sheet.getRows({ limt: 100 });

        //Clears the old list
        await db.clearTeams();

        //add all new challenges
        rows.forEach(row => {

            if (row.identifiant != "" && row.nom != "" && row.mail) {
                console.log(`Id: ${row.identifiant}, nom: ${row.nom}, mail: ${row.mail}, image ${row.image}`);
                db.createTeam(row.identifiant, row.nom, row.mail, row.image);
            }
        });

        console.log("Teams loaded!");
        return true;
    } catch (error) {
        console.log("Error while reloading teams!");
        console.log(error);
        return false;
    }
}

module.exports = {
    initSheetReader,
    reloadChallenges,
    reloadTeams
}