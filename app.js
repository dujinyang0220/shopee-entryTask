const http = require('http')

let items = {}

http.createServer((req, res) => {
	let data 
	switch (req.method) {
	case 'GET':
		data = JSON.stringify(items)
		res.write(data)
		res.end()
		break
    
	case 'POST':
		req.on('data', chunk => {
			items = []
			chunk = JSON.parse(chunk)
			chunk.request && chunk.request.forEach(v => {
				let item = {
					status: 200,
					response: `date for ${v.url}`
				}
				items.push(item)
			})
		})
		req.on('end', () => {
			// 存入
			// 返回到客户端
			data = JSON.stringify(items)
			res.write(data)
			res.end()
		})
		break
	}
}).listen(8888, '127.0.0.1')

console.log('Server Start...')