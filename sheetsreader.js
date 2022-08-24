const { GoogleSpreadsheet } = require('google-spreadsheet');
const db = require("./dbtools.js")

// Initialize the sheet - doc ID is the long id in the sheets URL
var doc;



async function initSheetReader() {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    doc.useApiKey(process.env.GOOGLE_API_KEY);
}


async function getChallenges() {

    try {
        //Get all doc data
        await doc.loadInfo();
        const sheet = await doc.sheetsByIndex[0];
        await sheet.loadHeaderRow(1);
        const rows = await sheet.getRows({limt: 100});
    
        //Clears the old list
        await db.clearDefis();
    
        //add all new challenges
        rows.forEach(row => {
            console.log(`Loading challenge \n
                                Id: ${row.identifiant}, nom: ${row.nom}, description: ${row.description}, points: ${row.points}`);
    
            db.createDefi(row.identifiant, row.nom, row.description, row.points);
        });
        
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    initSheetReader,
    getChallenges
}