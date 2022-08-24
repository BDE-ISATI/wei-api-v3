# wei_app_server

Bridge between the [WEI V2 Website](https://github.com/BDE-ISATI/wei_app_v2) and the database which holds player data and challenges that can be done during the ESIR 2022 WEI (Integration Week End)

# Installing

This server is meant to run on heroku, but any server will work really.

YOU NEED TO SETUP SOME ENVIRONMENT VARIABLES FIRST:
 - `GOOGLE_API_KEY`: The google key used to access the Sheet api (see [google-spreadsheet docs](https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=api-key))
 - `GOOGLE_SPREADSHEET_ID`: The ID of your spreadsheet you read from. Can be obtained from the link. NOTE: Your spreadsheet must be in public read access
 - `IMGUR_ID`: The imgur api id (see [IMGUR Api client creation](https://api.imgur.com/oauth2/addclient))
 - `MAIL_ADMIN`: The mails of the admins of the WEI, separated by `;` (ex: `bertrand@google.com;jacques@google.com`)
 - `MAIL_LOGIN`: The mail you will send emails from, usually one of the admins. MUST BE A GOOGLE MAIL
 - `MAIL_PASSWORD`: Password of said google mail
 - `REDIS_URL`: Database url in `redis:://username:password@adress` format. I used a simple free redis cloud database in this case (see [redis labs](https://app.redislabs.com/))
 - `SERVER_URL`: The adress of the server this code is running on (usually `https://APP_NAME.herokuapp.com` if you run this code on heroku)
