const Store = require('./store.js')

// 创建一个全局 Store
const store = new Store()

run()

/**
 * 运行程序
 */
async function run () { 
    // await addModel()
    // await addRecord()
    // await findRecord()
    store.find('event', {
        name: 'test1'
    })
        .then(myRecords => {
            console.log(myRecords)
        })
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
}

// 查询并缓存 ID 为 1 的活动记录
// 未命中缓存则发起请求 GET /event/1
// store.findRecord('event', 1).then((myRecord) => {
//   console.log(myRecord.id) // 返回 1
//   console.log(myRecord.name) // 返回 'Hello World'
//   myRecord.id = 2 // 抛出异常，id 不允许修改

//   // 将活动名称更改为 'Bye World'，此时尚未保存在服务端
//   myRecord.name = 'Bye World'

//   // 放弃所有更改，此时 name 变回 'Hello World'
//   myRecord.rollback()
//   myRecord.name = 'Apple'

//   // 将最新的结果保存到服务器
//   // 对于已存在的记录（ID不为空） 发出 PUT /event/1
//   // 对于新记录 发出 POST /event 请求
//   return myRecord.save()
// }).then(() => {

//   // 因为已经缓存这条记录，所以不会发出 HTTP 请求
//   return store.findRecord('event', 1)
// }).then((myRecord) => {

//   // 在服务器端删除这条记录，发送 DELETE /event/1/
//   return myRecord.destroyRecord()
// })