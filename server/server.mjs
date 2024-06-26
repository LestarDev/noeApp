import { createServer } from 'node:http';
import jsonData from "./../assets/testparktyki-cbfe153e13e9.json" with { type: "json" };
import { google } from 'googleapis';
import readline from "readline";
import fs from "fs";
import jsonRefreshToken from "./../assets/token.json" with { type: "json" };
import pkg from 'xlsx';
import { argv } from 'node:process'
const { readFile, utils } = pkg;

const hostname = '127.0.0.1';
const port = 5174;

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const tokenPath = "assets/token.json";

const XLS_FILE_PATH = 'assets/Overview Raport_2024-04-01_2024-04-30.xls';

const SPREAD_LINK = argv[2] ?? ""
const SPREAD_SHEET = (argv[2] ?? "0").split('#gid=')[1] ?? "0"

// argv.forEach((val, index)=>{
//   console.log(index, val)
// })

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

  SPREAD_LINK=="" 
  ? rl.question("Type sheet link: ",(link)=>{
    const startsWithID = link.substring(39);
    updatedSpreedSheet(startsWithID.split('/')[0], readFileXLS(XLS_FILE_PATH));
  })
  : updatedSpreedSheet(SPREAD_LINK.substring(39).split('/')[0], readFileXLS(XLS_FILE_PATH));

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

  let countEls = 1;

  xlData.forEach(el=>{
    countEls++;
    const tabToPush = Object.values(el);
      if(Object.keys(el).length<32){
        // console.log(Object.keys(el))
        let j=0;
        let iloscDodanych=0;
        for(let i=0; i<32; i++){
          if(Object.keys(el)[j]!=preperData[0][i]){
            //Array.splice(start_position, 0, new_element...);
            tabToPush.splice((j+iloscDodanych),0,"");
            iloscDodanych++;
            // console.log("Tab to push:",tabToPush);
            // console.log(preperData[0][i])
          }else{
            j++;
          }
        }

      }

      tabToPush.splice(3, 1, `=TEXT(${tabToPush[3]},"DD-MM-YYYY")`);

      tabToPush.splice(32, 5, 
        `=FILTER('team-assignments-log'!$D$1:$D$299, 'team-assignments-log'!$A$1:$A$299 = F${countEls}, 'team-assignments-log'!$B$1:$B$299 <= D${countEls}, 'team-assignments-log'!$C$1:$C$299 >= D${countEls})`,
        `=FILTER('contracts-log'!$M$1:$M$300, 'contracts-log'!$A$1:$A$300 = F${countEls}, 'contracts-log'!$B$1:$B$300 <= D${countEls}, 'contracts-log'!$C$1:$C$300 >= D${countEls})`,
        `=IF(REGEXMATCH(I${countEls}, "Services -"),FILTER('role-assignments-log'!$F$1:$F$301, 'role-assignments-log'!$A$1:$A$301 = F${countEls},'role-assignments-log'!$E$1:$E$301 = I${countEls}, 'role-assignments-log'!$B$1:$B$301 <= D${countEls}, 'role-assignments-log'!$C$1:$C$301 >= D${countEls}), "-")`,
        `=IF(AI${countEls}="-",0,FILTER('rates-log'!$F$1:$F$300, ('rates-log'!$E$1:$E$300 = AI${countEls}) + ('rates-log'!$E$1:$E$300 = "ANY"),'rates-log'!$A$1:$A$300 = I${countEls}, 'rates-log'!$B$1:$B$300 <= D${countEls}, 'rates-log'!$C$1:$C$300 >= D${countEls}))`,
        `=IF(AI${countEls}="-",0,FILTER('rates-log'!$G$1:$G$300, ('rates-log'!$E$1:$E$300 = AI${countEls}) + ('rates-log'!$E$1:$E$300 = "ANY"),'rates-log'!$A$1:$A$300 = I${countEls}, 'rates-log'!$B$1:$B$300 <= D${countEls}, 'rates-log'!$C$1:$C$300 >= D${countEls}))`,
        `=IF(AI${countEls}="-",0,FILTER('exchange-rates-log'!$C$1:$C$300, 'exchange-rates-log'!$B$1:$B$300 = AK${countEls}, MONTH('exchange-rates-log'!$A$1:$A$300) = MONTH(D${countEls}), YEAR('exchange-rates-log'!$A$1:$A$300) = YEAR(D${countEls})))`,
        `=C${countEls}*AH${countEls}`,
        `=AA${countEls}*AJ${countEls}*AL${countEls}`,
        `=AN${countEls}-AM${countEls}`)

      // console.log(Object.values(el));
    preperData.push(tabToPush);
  })

  preperData[0].push(
    "Team",
    "Hourly Cost",
    "Role (for the Account)",
    "Hourly Rate",
    "Hourly Rate Currency",
    "Currency To PLN",
    "Net Cost",
    "Net Revenue",
    "Net Income/Loss"
  );

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
      console.log("Token has been saved, refresh app");
      updatedSpreedSheet(SPREAD_LINK.substring(39).split('/')[0], readFileXLS(XLS_FILE_PATH));
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

const updatedSpreedSheet = async (SPREADSHEET_ID, SHEET_DATA) => {
    // console.log("SPREADSHEET_ID:",SPREADSHEET_ID);
 
    console.log( SHEET_DATA)

     await refreshAccessToken().then( async (token)=>{
      if(!token) return;
      console.log("Wprowadzanie danych...")
      const response =  await fetch(
        SPREAD_SHEET=="0" ? 
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:AX?valueInputOption=USER_ENTERED`
        : `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/sheets/${SPREAD_SHEET}/values/A1:AX?valueInputOption=USER_ENTERED`,
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
        console.log("Everything was put succesfully");
      }else{
        console.log("ERROR!",response)
      }
     });
     
  

  // console.log(SHEET_DATA);

  

}