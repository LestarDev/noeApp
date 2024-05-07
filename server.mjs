import { createServer } from 'node:http';
import jsonData from "./server/assets/testparktyki-cbfe153e13e9.json" with { type: "json" };
import { google } from 'googleapis'
import readline from "readline"
import fs from "fs"
import jsonRefreshToken from "./server/assets/token.json" with { type: "json" }
import config from "./server/config.json" with { type: "json" }
import pkg from 'xlsx';
const { readFile, utils } = pkg;

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
  
  updatedSpreedSheet("1XuCS4bhdBPXXeg_IQX3K4MZR8AHbH3FKjT03F59jYIw", readFileXLS('server/assets/Overview Raport_2024-04-01_2024-04-30.xls'));
});

const readFileXLS = (FILE_NAME) => {
  const workBook = readFile(FILE_NAME);
  const sheet_name_list = workBook.SheetNames;
  const xlData = utils.sheet_to_json(workBook.Sheets[sheet_name_list[0]]);
  // console.log(Object.values(xlData));
  // return Object.values(xlData);
  // const result = Object.keys(xlData).forEach((key) => {
  //   console.log(key)
  //   // [key, Object.values(xlData[key])]
  // })
  // const result = Object.keys(xlData).map((key) => {
  //   [Object.values(xlData[key])]
  // });

  const preperData = [[
    "Issue Key",
    "Issue summary",
    "Hours",
    "Work date",
    "Username",	
    "Full name",
    "Period",
    "Account Key",
    "Account Name",
    "Account Lead",
    "Account Category",
    "Account Customer",
    "Activity Name",
    "Component",
    "All Components",
    "Version Name",
    "Issue Type",
    "Issue Status",
    "Project Key",
    "Project Name",
    "Epic",
    "Epic Link",
    "Work Description",
    "Parent Key",
    "Reporter",
    "External Hours",
    "Billed Hours",
    "Issue Original Estimate",
    "Issue Remaining Estimate",
    "Location Name",
    "CoreTime",
    "CoreTimeActivity"
  ]];

  xlData.forEach(el=>{
    console.log(Object.values(el));
    preperData.push(Object.values(el));
  })
  return preperData;
}


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

const updatedSpreedSheet = async (SPREADSHEET_ID, SHEET_DATA) => {

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

  // console.log(SHEET_DATA);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:AX?valueInputOption=USER_ENTERED`,
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

  console.log(response);

}