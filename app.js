let http = require('http')
let url = require('url')

http.createServer((request, response) => {
    let tmp = request.url
    console.log(tmp)
    url.parse(tmp)
    response.writeHead(200, { 'Content-Type': 'text-plain' })
    response.end('Hello World\n')
}).listen(8888)

console.log('Server Start...')