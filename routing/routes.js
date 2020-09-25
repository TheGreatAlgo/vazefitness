
path = require('path')
var bodyParser = require('body-parser')
var request = require('request');
var passwordHash = require('password-hash');
var fitbit = require('../src/fitbit.js');
var contractWriter = require('../src/ethereumContractWriter.js');
var ethereumConnection = require('../src/ethereumConnection.js');
var express = require('express')
var router = express.Router()
const  {Client}  = require('pg')
const fetch = require('node-fetch');



// Connect to Database
var connectionString = "postgres://postgres:postgres@localhost:5432/Users";
const client = new Client({
    connectionString: connectionString
});
client.connect();

router.use(bodyParser.urlencoded({
  extended: true
}));


router.get('/',function(req,res) {
  res.sendFile(path.join(__dirname , '../Screens/Homepage.html'));
});

router.get('/deployedContracts',function(req,response) {
    if (req.session.loggedin) {
        var data ='';
        query = `SELECT * FROM usercontracts WHERE userid=` + req.session.userID + `;`;
        client.query(query, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        if (typeof(res.rows[0]) == 'undefined')
        {
            response.render(path.join(__dirname , '../Screens/deployedContracts.jade'), {"contractData": data});
        }
        else {
          for (var i = 0; i < res.rows.length; i++)
          {
          data = data.concat(`['` + res.rows[i].contractaddress +  `','`+ res.rows[i].transactionhash  +  `','` + res.rows[i].blocknumber +  `','` + res.rows[i].network +  `'],`);
          }
          response.render(path.join(__dirname , '../Screens/deployedContracts.jade'), {"contractData": data});
          console.log(data);
          //return render page
        }
        });
    }
    else {
      response.sendFile(path.join(__dirname , '../Screens/requestLogin.html'));
    }
});

router.get('/register',function(req,res)
{
  res.sendFile(path.join(__dirname , '../Screens/register.html'));
});

router.get('/wallet',function(req,res)
{
  res.sendFile(path.join(__dirname , '../Screens/comingSoon.html'));
});

router.get('/login',function(req,res)
{
  res.sendFile(path.join(__dirname , '../Screens/login.html'));
});

router.get('/deploying',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/smartContractDeploying.html'));
});

router.get('/deploy',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/deploy.html'));
});
router.get('/footer',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/footer.html'));
});
router.get('/PrivacyPolicy',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/PrivacyPolicy.html'));
});
router.get('/ContactUs',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/contactMe.html'));
});
router.get('/termsofuse',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/termsofuse.html'));
});
router.get('/test',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/dashboard.html'));
});
router.get('/comingSoon',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/comingSoon.html'));
});

router.get('/aboutus',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/timeline.html'));
});

router.get('/logout',function(req,res)
{
    req.session.loggedin = false;
    res.sendFile(path.join(__dirname , '../Screens/Homepage.html'));
});

router.get('/connectEthereum',function(req,res)
{
    res.sendFile(path.join(__dirname , '../Screens/connectEthereum.html'));
});

router.get('/dashboard',function(req,response)
{
      console.log(req.session.userID);
      if (typeof(req.session.userID) =='undefined')
      {
        response.sendFile(path.join(__dirname , '../Screens/requestLogin.html'));
      }
      else
      {
          query = `SELECT * FROM usertokens WHERE userid=` + req.session.userID + `;`;
          client.query(query, (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const access_token = res.rows[0].accesstoken;
                const api_id = res.rows[0].apiid;
                console.log(api_id,access_token);
                fetch("https://api.fitbit.com/1/user/"+ api_id + "/activities/heart/date/today/30d.json",{
                  headers: {'Authorization': 'Bearer ' + access_token},
                   method: 'GET',
                   mode: 'cors',
                 })
                 .then(res => res.json())
                 .then(json => {
                    var data =[];
                    if (typeof json.errors == 'undefined')
                     {
                         for (var i = 0; i < 30; i++)
                         {
                           for (var z = 0; z < 4; z++)
                           {
                               temp = json["activities-heart"][i].value.heartRateZones[z].minutes;
                               if (typeof temp == 'undefined')
                               {
                                 json["activities-heart"][i].value.heartRateZones[z].minutes = 0;
                               }
                           }
                             data.push
                             ({
                              "Date": json["activities-heart"][i].dateTime,
                              "outOfRange": json["activities-heart"][i].value.heartRateZones[0].minutes,
                              "fatBurn": json["activities-heart"][i].value.heartRateZones[1].minutes,
                              "cardio": json["activities-heart"][i].value.heartRateZones[2].minutes,
                              "peak": json["activities-heart"][i].value.heartRateZones[3].minutes
                            })

                         };
                       response.render(path.join(__dirname , '../Screens/dashboard.jade'), {"heartData": data,"userData": req.session.userID});
                   }
                     else if (json.errors[0].errorType =='expired_token')
                     {
                       fitbit.updateUserDatabaseTokens(req.session.userID);
                     }
                });
          });
      };
});

router.get('/connectData',function(req,res)
{
    const userID = req.session.userID;
    console.log(userID)
    if (req.session.loggedin && userID == 0 || req.session.expired_token == true)
    {
      res.sendFile(path.join(__dirname , '../Screens/connectData.html'));
    }
    else if (req.session.loggedin && userID != 0)
    {
      res.redirect('/dashboard');
    }
    else
    {
      res.send('Please login to view this page!');
    }
});

router.get('/register_data_success',function(req,res)
{
  res.sendFile(path.join(__dirname , '../Screens/register_data_success.html'));
});

router.get('/fitbit-api-token',function(req,routerRes)
{
   const requestToken = req.query.code;
   const userID = req.query.updateUser;
   if (typeof userID == "undefined")
   {
        const headers = {
          'Authorization': `Basic ##############################`,
          'Content-Type': 'application/x-www-form-urlencoded',
          };
        const body = "client_id=############&grant_type=authorization_code&redirect_uri=http://########/fitbit-api-token&code="+requestToken;
        request({
            url: 'https://api.fitbit.com/oauth2/token',
            method: 'POST',
            headers,
            body,
        },function (error, response, body)
        {
           var fitbitResponse = JSON.parse(body)
           console.log(body)
           var query = `
           INSERT INTO userTokens(accessToken, refreshToken, apiID, Time, Smartwatch)
           VALUES (` + `'` + fitbitResponse.access_token + `'` + `, ` +  `'` + fitbitResponse.refresh_token + `'` +`, ` +  `'` + fitbitResponse.user_id + `'` + `, 30800, 'Fitbit')`
           ;
           console.log(query)
            client.query(query, (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Token insert successful');
            });

            var query = `
               SELECT LASTVAL();`
            ;
            console.log(query)

             client.query(query, (err, res) => {
                 if (err) {
                     console.error(err);
                     return;
                 }
                 var userID = (res.rows[0].lastval);
                 console.log(req.session.username);
                 var query = `UPDATE userAccounts SET userid =` + Number(res.rows[0].lastval) + ` WHERE username = '` + req.session.username + `';`;
                 req.session.userID = Number(res.rows[0].lastval);
                 console.log(query);
                 client.query(query, (err, res) => {
                     if (err)
                      {
                         console.error(err);
                         return;
                      }
                  });
                  // Inject Temporary Data
                  query = `INSERT INTO userData(userID, outOfRangeOneDay, outOfRangeSevenDays, outOfRangeThirtyDays, fatBurnOneDay, fatBurnSevenDays,
                  fatBurnThirtyDays, cardioOneDay, cardioSevenDays, cardioThirtyDays, peakOneDay, peakSevenDays, peakThirtyDays, lastUpdated)
                  VALUES (` + Number(userID) + `,1,1,1,1,1,1,1,1,1,1,1,1,1);`;
                  console.log(query)
                  client.query(query, (err, res) => {
                       if (err)
                       {
                           console.error(err);
                           return;
                       }
                       console.log('Token insert successful');
                   });
                  const access_token = fitbitResponse.access_token;
                  const api_id = fitbitResponse.user_id;
                  fitbit.requestAndParseAllOneDay(access_token,api_id, userID);
                  fitbit.requestAndParseAllSevenDays(access_token,api_id, userID);
                  fitbit.requestAndParseAllThirtyDays(access_token,api_id, userID);
                  routerRes.redirect('/dashboard');
             });
           });
   }
   else
   {
       console.log("Updating Refresh Token");
       query = `SELECT * FROM usertokens WHERE userid=` + userID + `;`;
       client.query(query, (err, res) => {
               if (err) {
                   console.error(err);
                   return;
               }
            const refresh_token = res.rows[0].refreshtoken;
            const headers = {
              'Authorization': `Basic ############`,
              'Content-Type': 'application/x-www-form-urlencoded',
              };
            const body = "grant_type=refresh_token&refresh_token="+refresh_token;
            request({
              url: 'https://api.fitbit.com/oauth2/token',
              method: 'POST',
              headers,
              body,
              },function (error, response, body){
                  var fitbitResponse = JSON.parse(body)
                  console.log(body)
                  var query = `UPDATE userTokens SET accessToken ='` + fitbitResponse.access_token + `', refreshToken = '`+ fitbitResponse.refresh_token + `' WHERE userid = ` + userID + `;`;
                  console.log(query);
                  client.query(query, (err, res) => {
                      if (err) {
                          console.error(err);
                          return;
                      }
                      console.log("RefreshTokenUpdated");
                      routerRes.redirect('/dashboard');
                    });
               });

        });
   }
});

router.get('/heartrate/api',function(req,response) {
    const userRequestToken = req.query.code;
    const userRequestZone = req.query.zone;
    const userRequestTimeInterval = req.query.timeInterval;
    var heartRateMinutes = 0;
    console.log(userRequestToken);
    console.log(userRequestTimeInterval);
    query = `SELECT * FROM userdata WHERE userid=` + userRequestToken + `;`;
    client.query(query, (err, res) => {
        if (err)
        {
            console.error(err);
            return;
        }
        if (userRequestTimeInterval == '1d')
        {
          switch(userRequestZone)
          {
            case "0":
              heartRateMinutes = res.rows[0].outofrangeoneday;
              break;
            case "1":
              heartRateMinutes = res.rows[0].fatburnoneday;
              break;
            case "2":
              heartRateMinutes = res.rows[0].cardiooneday;
              break;
            case "3":
              heartRateMinutes = res.rows[0].peakoneday;
              break;
          }
        }
        if (userRequestTimeInterval == '7d')
        {
          switch(userRequestZone)
          {
            case "0":
              heartRateMinutes = res.rows[0].outofrangesevendays;
              break;
            case "1":
              heartRateMinutes = res.rows[0].fatburnsevendays;
              break;
            case "2":
              heartRateMinutes = res.rows[0].cardiosevendays;
              break;
            case "3":
              heartRateMinutes = res.rows[0].peaksevendays;
              break;
          }
        }
        if (userRequestTimeInterval == '30d')
        {
          switch(userRequestZone)
          {
            case "0":
              heartRateMinutes = res.rows[0].outofrangethirtydays;
              break;
            case "1":
            console.log(res.rows[0].fatburnthirtydays);
              heartRateMinutes = res.rows[0].fatburnthirtydays;
              break;
            case "2":
              heartRateMinutes = res.rows[0].cardiothirtydays;
              break;
            case "3":
              heartRateMinutes = res.rows[0].peakthirtydays;
              break;
          }
        }
        const heartRateResponse =`{"HeartRate": ` + heartRateMinutes+"}";
        response.send(heartRateResponse);
    });
});

router.post('/register', function(req,response)
{
// SEND TO DATABASE
   var data = req.body
   var userName = data.username;
   var password = passwordHash.generate(data.password);
   var email = data.emailAddress;
   var query = `SELECT * FROM userAccounts WHERE username = '` + userName + `';`;
   console.log(query);
   client.query(query, (err, res) => {
       if (err)
        {
           console.error(err);
           return;
        }
        if (res.rows[0])
        {
          console.log("User Already Exists");
          response.sendFile(path.join(__dirname , '../Screens/register.html'));
        }
        else
        {
          var query = `
          INSERT INTO userAccounts(userid, username, password, email)
          VALUES (0,` + `'` + userName + `'` + `, ` +  `'` + password + `'` +`, ` +  `'` + email + `')`;
          console.log(query);
          client.query(query, (err, res) => {
              if (err) {
                  console.error(err);
                  return;
              }
            response.sendFile(path.join(__dirname , '../Screens/register_success.html'));
              });
          console.log("Created User");
        }
    });
});

router.post('/auth', function(request,response)
{
    var userName = request.body.username;
    var password = request.body.password;
    if (userName && password)
    {
        var query = `SELECT * FROM userAccounts WHERE username = '` + userName + `';`;
        console.log(query);
        client.query(query, (err, res) => {
            if (err) {
                console.error(err);
                return;
            }
            if (typeof res.rows[0] == 'undefined')
            {
              console.log("Invalid Login");
              response.redirect('/login');
            }
            else if (passwordHash.verify(password,res.rows[0].password))
            {
              console.log("Logged In");
              request.session.loggedin = true;
              request.session.userID = res.rows[0].userid;
              request.session.username = userName;
              response.redirect('/connectData');
            }
            else
            {
              console.log("Invalid Login");
              response.redirect('/login');
            }
       });
   };
});



router.post('/auth-ethereum', function(req,response)
 {
// SEND TO DATABASE
    const ethereumWalletAddress = req.body.ethereumWalletAddress;
    const timeFrame = req.body.timeFrame;
    const heartBeatZone = req.body.heartBeatZone;
    const contractDuration = req.body.contractDuration;
    const userID = req.session.userID;
   response.redirect('/deploying');
   contractWriter.writeContract(ethereumWalletAddress, timeFrame, heartBeatZone, userID,contractDuration);
//  ethereumConnection.getBalance();
});




module.exports = router
