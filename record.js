const fs = require('fs')

// 当前记录查找条件
let _params = {}
// 当前数据备份
const _backup = {}

module.exports = class Record {
    constructor (result, params) {
        Object.keys(result).forEach(k => {
            this[k] = result[k]
            _backup[k] = result[k]
        })
        _params = params
    }

    /**
     * 在服务器端删除当前的记录
     */
    destroyRecord () {
        const { type, id } = _params
        const path = `./data/${type}.json`

        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, fd) => {
                if (err) 
                    throw err
                
                let list = fd ? JSON.parse(fd) : reject('没有查询到数据~')
                let resultIndex = list.find(v => v.id === id)

                list.splice(resultIndex, 1)
                let newContent = JSON.stringify(list, null, 4)
        
                fs.writeFile(path, newContent, 'utf8', err => {
                    if (err) reject('删除记录失败')
                    else{
                        resolve('删除记录成功')
                        deleteCache(_params).catch(e => {
                            console.log(`删除记录同时删除缓存遇到错误：${e}`)
                        })
                    }
                })
            })
        })
    }

    /**
     * 在服务器端保存最新的更改
     */
    save () {
        const { type, id } = _params
        const path = `./data/${type}.json`

        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, fd) => {
                if (err) throw err
                
                let list = fd ? JSON.parse(fd) : reject('没有查询到数据~')
                let result = list.find(v => v.id === id)
                let resultIndex = list.find(v => v.id === id)
                
                if(result === undefined) reject('没有查询到数据~')
                else{
                    Object.keys(this).forEach(k => {
                        result[k] = this[k]
                    })
                    result.update_time = new Date().getTime()

                    list[resultIndex] = result
                    let newContent = JSON.stringify(list, null, 4)
            
                    fs.writeFile(path, newContent, 'utf8', err => {
                        if (err) reject('保存失败')

                        resolve('保存成功')
                    })
                }
            })
        })
    }

    /**
     * 放弃所有未保存的记录更改
     */
    rollback () {
        Object.keys(_backup).forEach(v => {
            this[v] = _backup[v]
        })
    }
}

/**
 * 删除记录同时删除缓存
 * @param {object} condition 
 */
function deleteCache (condition) {
    const cachePath = `./data/cache.json`

    return new Promise((resolve, reject) => {
        fs.readFile(cachePath, 'utf8', async (err, fd) => {
            if (err) throw err
            
            let list = fd ? JSON.parse(fd) : []
            let resultIndex = list.find(v => JSON.stringify(v.condition) === JSON.stringify(condition))

            list.splice(resultIndex, 1)
            let newContent = JSON.stringify(list, undefined, 4)

            fs.writeFile(cachePath, newContent, 'utf8', err => {
                if (err) 
                    throw err
                
                console.log(`Delete cache success...`)
                resolve()
            })
        })
    })
}