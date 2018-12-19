const fs = require('fs')
const Record = require('./record.js')

// 表文件
const modelPath = genModelPath('model')
// 缓存文件
const cachePath = genModelPath('cache')

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
     * 根据条件查询一组记录并缓存
     * @param {string} type 
     * @param {object} params 
     */
    find (type, params) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')
        if(!params || typeof params !== 'object') 
            throw new Error('请传入正确的查询条件~')
        
        return new Promise((resolve, reject) => {
            fs.readFile(cachePath, 'utf8', async (err, fd) => {
                if (err) {
                    if(err.code === 'ENOENT')
                        createFile(cachePath)
                    else 
                        throw err
                }
                
                let condition = {
                    type, params
                }

                // 缓存为空，查询数据库
                if(fd === '') {
                    let record = await this.query(type, params)
                    resolve(record)

                    // 写入缓存
                    addCache(condition, record)
                }
                else {
                    let list = fd ? JSON.parse(fd) : []
                    let result = list.find(v => JSON.stringify(v.condition) === JSON.stringify(condition))

                    // 缓存未命中，查询数据库
                    if(result === undefined) {
                        let record = await this.query(type, params)
                        resolve(record)
    
                        // 写入缓存
                        addCache(condition, record)
                    }
                    else {
                        let recordList = result.result
        
                        resolve(recordList)

                        console.log('Get from cache...')
                    }
                }
            })
        })
    }

    /**
     * 查询一条记录并缓存
     * @param {string} type 
     * @param {number} id 
     */
    findRecord (type, id) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')
        if(typeof id !== 'number' || id < 0) 
            throw new Error('请传入正确的id~')
        
        return new Promise((resolve, reject) => {
            fs.readFile(cachePath, 'utf8', (err, fd) => {
                if (err) {
                    if(err.code === 'ENOENT')
                        createFile(cachePath)
                    else 
                        throw err
                }
                
                let condition = {
                    type, id
                }

                // 缓存为空，查询数据库
                if(fd === '') {
                    this.queryRecord(type, id).then(myRecord => {
                        resolve(myRecord)

                        // 写入缓存
                        addCache(condition, myRecord)
                    }).catch(e => {
                        console.log(e)
                    })
                }
                else {
                    let list = fd ? JSON.parse(fd) : []
                    let result = list.find(v => JSON.stringify(v.condition) === JSON.stringify(condition))

                    // 缓存未命中，查询数据库
                    if(result === undefined) {
                        this.queryRecord(type, id).then(myRecord => {
                            resolve(myRecord)
    
                            // 写入缓存
                            addCache(condition, myRecord)
                        }).catch(e => {
                            console.log(e)
                        })
                    }
                    else {
                        let record = new Record(result.result, condition)
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

                        console.log('Get from cache...')
                    }
                }
            })
        })
    }

    /**
     * 根据条件查询一组记录（不缓存）
     * @param {string} type 
     * @param {object} params 
     */
    query (type, params) {
        if(!type || typeof type !== 'string') 
            throw new Error('请传入正确的表名~')
        if(!params || typeof params !== 'object') 
            throw new Error('请传入正确的查询条件~')

        const path = genModelPath(type)

        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, fd) => {
                if (err) 
                    throw err
                
                let list = fd ? JSON.parse(fd) : reject('没有查询到数据~')
                let recordList = list.filter(v => {
                    let flag = true

                    Object.keys(params).forEach(k => {
                        v[k] !== params[k] && (flag = false)
                    })

                    return flag
                })

                resolve(recordList)
            })
        })
    }

    /**
     * 查询一条记录（不缓存）
     * @param {string} type 
     * @param {number} id 
     */
    queryRecord (type, id) {
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
                if(result === undefined) reject('没有查询到数据~')
                else{
                    let record = new Record(result, params)
                    let originId = record.id

                    Object.defineProperty(record, 'id', {
                        enumerable: true,
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
                }
            })
        })
    }

    /**
     * 清空所有已缓存的记录
     */
    unloadAll () {
        const path = genModelPath('cache')
        
        fs.unlink(path, err => {
            if (err.code !== 'ENOENT') throw err
            
            console.log(`成功删除 ${path}`)

            createFile(path)
        })
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
        if (err) throw err

        fs.close(fd, err => {
            if (err) throw err
            
            console.log(`创建 '${path}' 成功`)
        })
    })
}

/**
 * 查询结果写入缓存
 * @param {object} condition 
 * @param {object} result 
 */
function addCache (condition, result) {
    return new Promise((resolve, reject) => {
        fs.readFile(cachePath, 'utf8', async (err, fd) => {
            if (err) {
                if(err.code === 'ENOENT')
                    await createFile(cachePath)
                else 
                    throw err
            }
            
            let list = fd ? JSON.parse(fd) : []
            let cache = {
                condition, result
            }
            list.push(cache)
            let newContent = JSON.stringify(list, undefined, 4)

            fs.writeFile(cachePath, newContent, 'utf8', err => {
                if (err) 
                    throw err
                
                console.log(`Add cache success...`)
                resolve()
            })
        })
    })
}