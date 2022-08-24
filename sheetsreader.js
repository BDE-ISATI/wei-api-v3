const { GoogleSpreadsheet } = require('google-spreadsheet');


// Initialize the sheet - doc ID is the long id in the sheets URL
var doc;



function initSheetReader() {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    doc.useApiKey(process.env.GOOGLE_API_KEY);
}


async function getChallenges() {
    const rows = await sheet.getRows();
    console.log(rows);
}

module.exports = {
    initSheetReader,
    getChallenges
}