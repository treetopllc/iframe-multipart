var express = require('express')
var Busboy = require('busboy');
var app = express();

app.use(express.static('../build'));

app.get('*', function (req, res) {
  res.sendfile('./index.html');
});

app.post('*', function (req, res) {
  var busboy = new Busboy({ headers: req.headers });
  var files = [];
  var fields = [];
  
  busboy.on('file', function (fieldname, file, filename) {
    file.resume();
    files.push({
      field: fieldname,
      filename: filename
    });
  });

  busboy.on('field', function (fieldname, value) {
    fields.push({
      field: fieldname,
      value: value
    });
  });
  
  busboy.on('end', function() {
    res.type('html');
    res.send(JSON.stringify({ 
      files: files,
      fields: fields 
    }, null, ' '));
  });
  
  req.pipe(busboy);
});

app.listen(3000);