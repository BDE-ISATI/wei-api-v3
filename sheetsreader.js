const { GoogleSpreadsheet } = require('google-spreadsheet');


// Initialize the sheet - doc ID is the long id in the sheets URL
var doc;



async function initSheetReader() {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    doc.useApiKey(process.env.GOOGLE_API_KEY);
}


async function getChallenges() {
    await doc.loadInfo();
    //const sheet = await doc.sheetsByIndex[0];
    //await sheet.loadHeaderRow(0);
    //const rows = await sheet.getRows({limt: 100});
    //rows.forEach(row => {
    //    console.log(`Id: ${row.identifiant}, nom: ${row.nom}, description: ${row.description}, points: ${row.points}`);
    //});
}

module.exports = {
    initSheetReader,
    getChallenges
}