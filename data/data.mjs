import { createServer } from 'node:http';
import jsonData from "./assets/testparktyki-cbfe153e13e9.json" with { type: "json" };
import { google } from 'googleapis'
import readline from "readline"
import fs from "fs"
import jsonRefreshToken from "./assets/token.json" with { type: "json" }
import config from "./config.json" with { type: "json" }
import pkg from 'xlsx';
import { argv } from 'node:process'
const { readFile, utils } = pkg;

const hostname = '127.0.0.1';
const port = 5174;

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const tokenPath = "server/assets/token.json";

const XLS_FILE_PATH = 'server/assets/Overview Raport_2024-04-01_2024-04-30.xls';

const SPREAD_LINK = argv[2] ?? ""
const SPREAD_SHEET = argv[2].split('#gid=')[1] ?? "0"

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  // console.log(req);

  res.end(req.url.substring(7).split('&')[0] ?? "");
  
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  // const authClient = generateAuthCode();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try{
    readFileXLS(XLS_FILE_PATH);
  }catch(e){
    console.log("Wrong path to XLS file in assets");
    return;
  }

  updatedSpreedSheet(PREAD_LINK.substring(39).split('/')[0])

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
      console.log("Token has been saved, refresh app");
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
  // console.log("error:",data);
  if(data.error_description== 'Token has been expired or revoked.'){
    return generateAuthCode();
  }
  // fs.writeFileSync(tokenPath,JSON.stringify({}));
  return data.access_token;
}

const updatedSpreedSheet = async (SPREADSHEET_ID, SHEET_DATA) => {

 
     await refreshAccessToken().then( async (token)=>{
      console.log("Wprowadzanie danych...")
      const response =  await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/sheets/${SPREAD_SHEET}/values/A1:AX?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // body: SHEET_DATA
          body: JSON.stringify({values: SHEET_DATA})
        }
      )
    
      if(response.statusText=='OK'){
        console.log("Wszystko przebieglo pomyslnie");
      }else{
        console.log("ERROR!",response)
      }
     });
     
  

  // console.log(SHEET_DATA);

  

}