const http = require('http'); // http server functionality
const fs = require('fs'); // file system functionality
const path = require('path'); // path functionality
const mime = require('mime'); // defining mime types
const chatServer = require('./lib/chat_server'); //chat functionality by socket.io
const port = process.env.port || 3000; //port

const cache = {}; //save contents cache files

chatServer.listen(server); //runs socket.io server by giving it http port

//creating server and send static files
const server = http.createServer((req, res) => {
    let filePath = false;
    if (req.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + req.url;
    }
    let absPath = './'+filePath;
    serverStatic(res, cache, absPath);
});

//listening server
server.listen(port, () => {console.log('server listening on port ' + port)});

//function of handling errors
const send404 = (res) => {
    res.writeHead(404, {'Content-type': 'text/plain'});
    res.write("Error 404: resource not found");
    res.end();
};

//send file content and mime type
const sendFile = (res, filePath, fileContent) => {
    res.writeHead(200, {'Content-type': mime.lookup(path.basename(filePath))});
    res.end(fileContent);
};

//add file content to cache and handle cache files
const serverStatic = (res, cache, absPath) => {
    if(cache[absPath]) {
        sendFile(res, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, (exists) => {
            if (exists) {
                fs.readFile(absPath, (err, data) => {
                    if (err) {
                        send404(res);
                    } else {
                        cache[absPath] = data;
                        send404(res, absPath, data);
                    }
                })
            } else {
                send404(res);
            }
        });
    }
};

