require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI.toString(), { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  originalURL: { type: String, require: true },
  shortURL: Number
});

let Url = mongoose.model('URL', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

// post url
let urlJson = {}

app.post('/api/shorturl', (req, res) => {
  let inputUrl = req.body['url'];
  let inputShortURL = 1

  urlJson['original_url'] = inputUrl;

  let regex = "^https?:\/\/"
  let urlRegex = new RegExp(regex);

  if (!inputUrl.match(urlRegex)) {
    console.log(`url is invalid ${inputUrl}`);
    res.json({ error: 'invalid url' });
  }

  Url.findOne({})
    .sort({ shortURL: 'desc' })
    .then((result) => {
      console.log(`search result: ${result}`);
      if (result != null) {
        inputShortURL = result.shortURL + 1;
      }

      Url.findOneAndUpdate({ originalURL: inputUrl },
        { originalURL: inputUrl, shortURL: inputShortURL },
        { new: true, upsert: true }
      ).then((savedUrl) => {
        urlJson['short_url'] = savedUrl.shortURL;
        res.json(urlJson);
      }).catch((err) => { console.log(`saved Url error ${err}`); });

    }).catch((err) => { console.log(`find one error ${err}`); });

});

// redirect to url
app.get('/api/shorturl/:inputShortUrl', (req, res) => {
  let convertedInputShortUrl;

  try {
    convertedInputShortUrl = parseInt(req.params.inputShortUrl, 10);
  }
  catch (err) {
    console.log(`parse short url error ${err}`);
    return;
  }

  Url.findOne({ shortURL: convertedInputShortUrl })
    .then((result) => {
      console.log(`redirect to ${result.originalURL}`);
      res.redirect(result.originalURL);
    }).catch((err) => { console.log(`can't redirect to url ${err}`) });
})