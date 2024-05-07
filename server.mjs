import { createServer } from 'node:http';
import jsonData from "./server/assets/testparktyki-cbfe153e13e9.json" with { type: "json" };
import { google } from 'googleapis'
import readline from "readline"
import fs from "fs"
import jsonRefreshToken from "./server/assets/token.json" with { type: "json" }
import config from "./server/config.json" with { type: "json" }

const hostname = '127.0.0.1';
const port = 5174;

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const tokenPath = "server/assets/token.json";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  // console.log(req);
    res.end('Hello World');
  
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  // const authClient = generateAuthCode();
  updatedSpreedSheet("1XuCS4bhdBPXXeg_IQX3K4MZR8AHbH3FKjT03F59jYIw");
});


const getNewToken = (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    acces_type: 'offline',
    scope: SCOPE
  })

  console.log('Login here:',authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question("Get code: ", (code)=>{
    rl.close();
    oAuth2Client.getToken(code, (err, token)=>{
      if(err) return console.error("Error code/token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(tokenPath,JSON.stringify(token));
      console.log("Token has been saved");
    })
  })

}

const generateAuthCode = () => {
  const oAuth2Client = new google.auth.OAuth2(jsonData.id_klienta, jsonData.tajny_klucz_klienta, 'http://localhost:5174')

  return getNewToken(oAuth2Client);
  
} 

const refreshAccessToken = async () => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: jsonData.id_klienta,
      client_secret: jsonData.tajny_klucz_klienta,
      refresh_token: jsonRefreshToken.access_token,
      grant_type: "refresh_token"
    })
  })
  const data = await response.json();
  console.log(data);
  return data.access_token;
}

const updatedSpreedSheet = async (SPREADSHEET_ID) => {
  const sheetData = [
    ['a',0],
    [0,'b']
  ]

  // console.log();

  let isNewToken = false;

  try{
    console.log(jsonRefreshToken.expiry_date.toString());
  }catch(e){
    if(e.error_description== 'Token has been expired or revoked.'){
      isNewToken=true;
    }
  }

  let token;

  if(isNewToken){
     token = generateAuthCode();
  }else{
     token = await refreshAccessToken();
  }

  console.log(token);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:E?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({values: sheetData})
    }
  )

  console.log(response);

}