import { createServer } from 'node:http';
import jsonData from "./../assets/testparktyki-cbfe153e13e9.json" with { type: "json" };
import { google } from 'googleapis';
import readline from "readline";
import fs from "fs";
import jsonRefreshToken from "./../assets/token.json" with { type: "json" };
import pkg from 'xlsx';
import { argv } from 'node:process'

const hostname = '127.0.0.1';
const port = 5174;

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const tokenPath = "assets/token.json";

const SPREAD_LINK = argv[2] ?? ""
const SPREAD_SHEET = argv[3] ?? ""

argv.forEach((val, index)=>{
  console.log(index, val)
})

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

  SPREAD_LINK=="" 
  ? rl.question("Type sheet link: ",(link)=>{
    const startsWithID = link.substring(39);
    updatedSpreedSheet(startsWithID.split('/')[0]);
  })
  : updatedSpreedSheet(SPREAD_LINK.substring(39).split('/')[0]);

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
      exit();
      updatedSpreedSheet(SPREAD_LINK.substring(39).split('/')[0]);
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
  return data.access_token;
}

const updatedSpreedSheet = async (SPREADSHEET_ID) => {
    console.log("SPREADSHEET_ID:",SPREADSHEET_ID);
 
     await refreshAccessToken().then( async (token)=>{
      if(!token) return;
      console.log("Wprowadzanie danych...")

        const valuesData = [
            ["x","y", 8],
            ["y", "x", 5],
        ]

      const linkToFetch = SPREAD_SHEET=="0" ? 
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:AX?valueInputOption=USER_ENTERED`
      : `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SPREAD_SHEET!="" ? `'${SPREAD_SHEET}'!` : ""}A1:AX?valueInputOption=USER_ENTERED`;
      
      console.log("linkToFecth: ",linkToFetch)

      const response =  await fetch(
        linkToFetch,
        {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // body: SHEET_DATA
          body: JSON.stringify({values: valuesData})
        }
      )
    
      if(response.statusText=='OK'){
        console.log("Everything was put succesfully");
      }else{
        console.log("ERROR!",response)
      }
     });
     
  

  // console.log(SHEET_DATA);

  

}