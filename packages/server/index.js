const express = require('express');
const cors = require('cors');
const winston = require('winston');
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');
const {google} = require('googleapis');

const client = require('./google/auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}", 
  expressFormat: false,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}));

app.listen(process.env.PORT || 8080, () => {
  console.info('Listening');
  init();
});

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

// todo: need to call this every 7 days
async function _watch(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  await gmail.users.stop({
    userId: 'me',
  }).catch((err) => {
    console.log(err);
  });

  const watchRes = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: 'projects/gcloud-server-v1/topics/inbox-change',
    },
  }).catch((err) => {
    console.log('The API returned an error: ' + err);
  });

  if (watchRes.data) {
    console.log('watching inbox');
    console.log(watchRes.data);
  }
  
}

function init() {
  watchGoogleInbox();
}

function watchGoogleInbox() {
  client.executeAPI(_watch);
  // call every day
  setTimeout(() => {
    watchGoogleInbox();
  }, 86400000);
}
