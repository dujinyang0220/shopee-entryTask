const fs = require('fs')
const Record = require('./record.js')

const modelPath = genModelPath('model')

module.exports = class Store {
    constructor () {

    }

    /**
     * 定义一个记录模型
     * @param {string} type 记录类型名称
     * @param {object} attrs 记录包含的字段及默认值
     */
    defineModel (type, attrs) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')
        if(!attrs || typeof attrs !== 'object' || JSON.stringify(attrs) === '{}') 
            throw new Error('请传入正确的表结构~')

        return new Promise((resolve, reject) => {
            fs.readFile(modelPath, 'utf8', (err, fd) => {
                if (err) {
                    if(err.code === 'ENOENT')
                        createFile(modelPath)
                    else 
                        throw err
                }
                
                let list = fd ? JSON.parse(fd) : {}
                list[type] = attrs
                let newContent = JSON.stringify(list, undefined, 4)

                fs.writeFile(modelPath, newContent, 'utf8', err => {
                    if (err) 
                        throw err
                    
                    console.log(`Build model '${type}' success...`)
                    resolve()
                })
            })
        })
    }

    /**
     * 创建一个制定类型的 Record
     * @param {string} type 
     * @param {object} attrs 
     */
    createRecord (type, attrs) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')

        const path = genModelPath(type)

        return new Promise((resolve, reject) => {
            fs.readFile(modelPath, 'utf8', (err, fd) => {
                if (err) 
                    throw err
                
                let list = fd && JSON.parse(fd)
                let record = list[type]
    
                fs.readFile(path, 'utf8', (err, fd) => {
                    if (err) {
                        if(err.code === 'ENOENT')
                            createFile(path)
                        else 
                            throw err
                    }
                  
                    let list = fd ? JSON.parse(fd) : []
                    let time = new Date().getTime()
                    Object.keys(record).forEach(k => {
                        attrs[k] !== undefined && (record[k] = attrs[k])
                    })
                    record.id = time
                    record.create_time = time
                    list.push(record)
                    let newContent = JSON.stringify(list, null, 4)
        
                    fs.writeFile(path, newContent, 'utf8', err => {
                        if (err) throw err
    
                        console.log(`Add model '${type}' record success...`)
                        resolve(record)
                    })
                })
            })
        })
    }

    /**
     * 
     * @param {string} type 
     * @param {object} params 
     */
    find (type, params) {
        return recordList
    }

    /**
     * 
     * @param {string} type 
     * @param {number} id 
     */
    findRecord (type, id) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')
        if(typeof id !== 'number' || id < 0) 
            throw new Error('请传入正确的id~')

        const path = genModelPath(type)

        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, fd) => {
                if (err) 
                    throw err
                
                let params = {
                    type, id
                }
                let list = fd ? JSON.parse(fd) : reject('没有查询到数据~')
                let result = list.find(v => v.id === id)
                let record = new Record(result, params)
                let originId = record.id

                Object.defineProperty(record, 'id', {
                    enumerable: false,
                    configurable: true,
                    set (newVal) {
                        if(originId !== newVal)
                            throw new Error('id 不可修改')
                    },
                    get () {
                        return originId
                    }
                })
                resolve(record)
            })
        })
    }

    /**
     * 
     * @param {string} type 
     * @param {object} params 
     */
    query (type, params) {
        return recordList
    }

    /**
     * 
     * @param {string} type 
     * @param {number} id 
     */
    queryRecord (type, id) {
        return record
    }

    /**
     * 
     */
    unloadAll () {

    }
}

/**
 * 生成表文件路径
 * @param {string} name 
 */
function genModelPath (name) {
    if(!name || typeof name !== 'string')  throw new Error('请传入正确的表名~')

    return `./data/${name}.json`
}

/**
 * 创建文件
 * @param {string} path 
 */
function createFile (path) {
    fs.open(path, 'w+', (err, fd) => {
        if (err) 
            throw err

        fs.close(fd, err => {
            if (err) 
                throw err
        })
    })
}