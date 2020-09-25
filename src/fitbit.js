// Connect to Database
var bodyParser = require('body-parser')
const  {Client}  = require('pg')
const fetch = require('node-fetch');
var request = require('request');



var connectionString = "postgres://postgres:postgres@localhost:5432/Users";
const client = new Client({
    connectionString: connectionString
});
client.connect();

// Build Databases if being deployed on a new ENVIRONMENT
var query = `
CREATE TABLE IF NOT EXISTS userContracts(
 userid int not null,
 contractaddress text not null,
 transactionhash text not null,
 blocknumber text not null,
 network text not null
)
`;
client.query(query, (err, res) => {
    if (err)
    {
        console.error(err);
        return;
    }
    console.log('User Deployed Contracts Table Created Successfully');
});



var query = `
CREATE TABLE IF NOT EXISTS userAccounts(
 userid int not null,
 username text not null,
 password text not null,
 email text not null
)
`;
client.query(query, (err, res) => {
    if (err)
    {
        console.error(err);
        return;
    }
    console.log('User Account Data Table Created Successfully');
});
query = `
CREATE TABLE IF NOT EXISTS userTokens(
 USERID serial not null unique,
 accessToken text not null,
 refreshToken text not null,
 apiID text not null,
 Time int not null,
 Smartwatch text not null
)
`;
client.query(query, (err, res) => {
    if (err)
    {
        console.error(err);
        return;
    }
    console.log('User Token Table Created Successfully');
});


var query = `
CREATE TABLE IF NOT EXISTS userData(
 userID int not null unique,
 outOfRangeOneDay int not null,
 outOfRangeSevenDays int not null,
 outOfRangeThirtyDays int not null,
 fatBurnOneDay int not null,
 fatBurnSevenDays int not null,
 fatBurnThirtyDays int not null,
 cardioOneDay int not null,
 cardioSevenDays int not null,
 cardioThirtyDays int not null,
 peakOneDay int not null,
 peakSevenDays int not null,
 peakThirtyDays int not null,
 lastUpdated bigint not null
)
`;
client.query(query, (err, res) => {
    if (err)
    {
        console.error(err);
        return;
    }
    console.log('User Data Table Created Successfully');
  });


setInterval(updateAllDatabaseTokens, 27800000); // update all access tokens A little before expiration so tokens never expire
setInterval(updateAllData, 86400000); // update database every day


function requestAndParseAllOneDay(access_token, api_id, user_id)
{
  var outOfRangeOneDay = 1; //Used for Catching errors
  var fatBurnOneDay = 2; //Used for Catching errors
  var cardioOneDay  = 3; //Used for Catching errors
  var peakOneDay = 4; //Used for Catching errors
  fetch("https://api.fitbit.com/1/user/"+ api_id + "/activities/heart/date/today/1d.json",{
    headers: {'Authorization': 'Bearer ' + access_token},
     method: 'GET',
     mode: 'cors',
   })
   .then(res => res.json())
   .then(json => {
       outOfRangeOneDay = parseOneDay(json,0);
       fatBurnOneDay = parseOneDay(json,1);
       cardioOneDay = parseOneDay(json,2);
       peakOneDay = parseOneDay(json,3);
       var currentTime = Date.now();
       query = `UPDATE userData SET outOfRangeOneDay = `+ outOfRangeOneDay + `, fatBurnOneDay = ` + fatBurnOneDay + `, cardioOneDay = ` + cardioOneDay +
       `,  peakOneDay = ` + peakOneDay + `, lastUpdated = ` + currentTime + ` WHERE userid = ` + user_id +`;`;
        client.query(query, (err, res) => {
            if (err)
            {
                console.error(err);
                return;
            }
            console.log('1 Day Data insert successful');
        });
    });
  return;
}

function requestAndParseAllSevenDays(access_token, api_id, user_id)
{
  var outOfRangeSevenDays = 1; //Used for Catching errors
  var fatBurnSevenDays = 2; //Used for Catching errors
  var cardioSevenDays  = 3; //Used for Catching errors
  var peakSevenDays = 4; //Used for Catching errors
  fetch("https://api.fitbit.com/1/user/"+ api_id + "/activities/heart/date/today/7d.json",{
    headers: {'Authorization': 'Bearer ' + access_token},
     method: 'GET',
     mode: 'cors',
   })
   .then(res => res.json())
   .then(json => {
       outOfRangeSevenDays = parseSevenDays(json,0);
       fatBurnSevenDays = parseSevenDays(json,1);
       cardioSevenDays = parseSevenDays(json,2);
       peakSevenDays = parseSevenDays(json,3);
      console.log("Parsing All Seven Days");
      var currentTime = Date.now();
      query = `UPDATE userData SET outOfRangeSevenDays = `+ outOfRangeSevenDays + `, fatBurnSevenDays = ` + fatBurnSevenDays + `, cardioSevenDays = ` + cardioSevenDays +
      `,  peakSevenDays = ` + peakSevenDays + `, lastUpdated = ` + currentTime + ` WHERE userid = ` + user_id +`;`;
       client.query(query, (err, res) => {
           if (err)
           {
               console.error(err);
               return;
           }
           console.log('7 Days Data insert successful');
       });
   });
  return;
}


function requestAndParseAllThirtyDays(access_token, api_id, user_id)
{
  var outOfRangeThirtyDays = 1; //Used for Catching errors
  var fatBurnThirtyDays = 2; //Used for Catching errors
  var cardioThirtyDays  = 3; //Used for Catching errors
  var peakThirtyDays = 4; //Used for Catching errors
  fetch("https://api.fitbit.com/1/user/"+ api_id + "/activities/heart/date/today/30d.json",{
    headers: {'Authorization': 'Bearer ' + access_token},
     method: 'GET',
     mode: 'cors',
   })
   .then(res => res.json())
   .then(json => {
       outOfRangeThirtyDays = parseThirtyDays(json,0);
       fatBurnThirtyDays = parseThirtyDays(json,1);
       cardioThirtyDays = parseThirtyDays(json,2);
       peakThirtyDays = parseThirtyDays(json,3);
       var currentTime = Date.now();
       query = `UPDATE userData SET outOfRangeThirtyDays = `+ outOfRangeThirtyDays + `, fatBurnThirtyDays = ` + fatBurnThirtyDays + `, cardioThirtyDays = ` + cardioThirtyDays +
       `,  peakThirtyDays = ` + peakThirtyDays + `, lastUpdated = ` + currentTime + ` WHERE userid = ` + user_id +`;`;
        client.query(query, (err, res) => {
            if (err)
            {
                console.error(err);
                return;
            }
            console.log('30 Days Data insert successful');
        });
   });
   return;
}


function parseOneDay(json,userRequestZone)
{
  var heartRateMintues = json["activities-heart"][0].value.heartRateZones[userRequestZone].minutes;
  if (typeof heartRateMinutes == 'undefined')
  {
    var heartRateMinutes = 0;
  }
  return heartRateMinutes;
}

function parseSevenDays(json,userRequestZone)
{
  var heartRateMinutes = 0;
  for (var i = 0; i < 7; i++)
  {
    temp = json["activities-heart"][i].value.heartRateZones[userRequestZone].minutes;
    if (typeof temp == 'undefined')
    {
      heartRateMinutes = heartRateMinutes + 0;
    }
    else
    {
      heartRateMinutes = heartRateMinutes + temp
    }
  }
  return heartRateMinutes;
}

function parseThirtyDays(json,userRequestZone)
{
  var heartRateMinutes = 0;
  for (var i = 0; i < 30; i++)
  {
    temp = json["activities-heart"][i].value.heartRateZones[userRequestZone].minutes;
    if (typeof temp == 'undefined')
    {
      heartRateMinutes = heartRateMinutes + 0;
    }
    else
    {
      heartRateMinutes = heartRateMinutes + temp
    }
  }
  return heartRateMinutes;
}


function updateAllDatabaseTokens()
{
  query = `SELECT * FROM usertokens;`;
  client.query(query, (err, res) => {
      if (err)
      {
          console.error(err);
          return;
      }
          var lengthofArray = res.rows.length;
      for (var i = 0; i < lengthofArray; i++)   // Increment through all userDataData Databases and update every token
      {
          var userID = res.rows[i].userid;
          console.log("USER ID =" + userID)
          request({
              url: 'http://localhost:3000/fitbit-api-token?updateUser=' + userID,
              method: 'GET',
          },function (error, response, body)
          {
            console.log(error);
          });
      };
  });
}

function updateUserDatabaseTokens(userID)
{
  query = `SELECT * FROM usertokens WHERE userid =`+ userID + `;`;
  client.query(query, (err, res) => {
        if (err)
        {
            console.error(err);
            return;
        }
      request({
          url: 'http://localhost:3000/fitbit-api-token?updateUser=' + userID,
          method: 'GET',
      },function (error, response, body)
      {
        console.log(error);
      });
  });
}

function updateAllData()
{
  query = `SELECT * FROM usertokens;`;
  client.query(query, (err, res) => {
      if (err)
      {
          console.error(err);
          return;
      }
          var lengthofArray = res.rows.length;
      for (var i = 0; i < lengthofArray; i++)   // Increment through all userDataData Databases and update every token
      {
        var user_id = res.rows[i].userid;
        var api_id = res.rows[i].apiid;
        var access_token = res.rows[i].accesstoken;
        requestAndParseAllOneDay(access_token, api_id, user_id);
        requestAndParseAllSevenDays(access_token, api_id, user_id);
        requestAndParseAllThirtyDays(access_token, api_id, user_id);
      };
  });
 }



module.exports = { parseOneDay, parseSevenDays, parseThirtyDays, requestAndParseAllOneDay, requestAndParseAllSevenDays, requestAndParseAllThirtyDays, updateUserDatabaseTokens };
