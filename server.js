const http = require('http')
const Store = require('./store.js')

// 创建一个全局 Store
const store = new Store()

// 入口函数
run()

/**
 * 运行程序
 */
async function run () { 
	await addModel()
	await addRecord()
	await findRecord()
	batchRequest()
}

/**
 * 定义 event 数据模型
 */
async function addModel () {
	await store.defineModel('event', {
		name: '',
		begin_time: 0,
		end_time: 0,
		description: '',
		creator: {},
		create_time: 0,
		update_time: 0
	})
	await store.defineModel('event1', {
		name: '',
		begin_time: 0,
		end_time: 0,
		description: '',
		creator: {},
		create_time: 0,
		update_time: 0
	})
}

/**
 * 新增记录
 */
async function addRecord () {
	await store.createRecord('event', {
		name: 'test1'
	})
	await store.createRecord('event', {
		name: 'test2'
	})
}

/**
 * 查询并缓存 ID 为 1 的活动记录
 */
async function findRecord () {
	await store.findRecord('event', 1)
		.then(myRecord => {
			console.log(myRecord.id) 
			console.log(myRecord.name) 

			// myRecord.id = 2
			myRecord.name = 'Bye World'
			myRecord.rollback()
			myRecord.name = 'Apple'

			return myRecord.save()
		})
		.then(res => {
			console.log(res)
			return store.findRecord('event', 1)
		})
		.then((myRecord) => {
			return myRecord.destroyRecord()
		})
		.then(res => {
			console.log(res)
		})
		.catch(e => {
			console.log(e)
		})
}

/**
 * 
 * @param {string} path api路径
 * @param {object} postData 请求数据
 */
function post (path, postData) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: '127.0.0.1',
			port: 8888,
			path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			}
		}
		const req = http.request(options, res => {
			res.on('data', data => {
				resolve(JSON.parse(data.toString()))
			})
		})
		req.on('error', e => {
			reject(`请求遇到问题: ${e.message}`)
		})
        
		// 将数据写入到请求主体。
		req.write(JSON.stringify(postData))
		req.end()
	})
}

/**
 * 同时发起多个请求
 */
function batchRequest () {
	const postData = {
		request: [
			{
				method: 'get', url: 'api/r1/3', body: null
			},
			{
				method: 'get', url: 'api/r2/5', body: null
			},
			{
				method: 'post', url: 'api/r3', body: {
					name: 'hello',
					age: 'world'
				}
			}
		]
	}

	post('/', postData).then(resList => {
		console.log(resList)
	}).catch(e => {
		console.log(e)
	})
}