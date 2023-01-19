require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
let mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.use(express.urlencoded({extended: false}));
mongoose.connect(
  process.env.URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

let urlSchema = mongoose.Schema({
  url_original: {
    type: String,
    required: true
  },
  url_short: {
    type: Number,
    unique: true
  }
});

let urlModel = mongoose.model('urlModel', urlSchema);

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  let result = {"original_url": undefined, "short_url": undefined};
  let invalidUrl = { "error": 'invalid url' }; 
  let invalidHost = { "error": "invalid Hostname"};
  let inputUrl = req.body.url;
  let regex = /^(http|https):\/\/(w{3}\.)*([\w]+\.[\w]+)/;

  if (regex.test(inputUrl) == false) {return res.send(invalidUrl)};
  let dnsUrl = new URL(inputUrl).hostname;
  console.log(dnsUrl);
  dns.lookup(dnsUrl, (error, address, family) => {
    if (error) {return res.send(invalidHost);}
  });

  let urlDB = await urlModel.findOne({url_original: inputUrl});
  if (await urlDB == null) {
    let lastIndex = await urlModel.findOne({}).sort({url_short: -1});
    let entry = {
      url_original: inputUrl,
      url_short: lastIndex.url_short + 1
    };
    urlModel.create(entry, (err, data) => {
      if(err) {return console.error(err)}
      //console.log(data)
    })
    urlDB = entry;
    //console.log(urlDB)
  }
  console.log(urlDB.url_original)
  result.original_url = urlDB.url_original;
  result.short_url = urlDB.url_short;
  res.send(result)
})

app.get('/api/shorturl/:short', async (req, res) => {
  let shortParam = req.params.short;
  let urlDB = await urlModel.findOne({url_short: shortParam});
  res.redirect(urlDB.url_original);
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
