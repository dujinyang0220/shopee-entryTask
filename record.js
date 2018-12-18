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

    }

    /**
     * 放弃所有未保存的记录更改
     */
    rollback () {
        Object.keys(_backup).forEach(v => {
            this[v] = _backup[v]
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
                if (err) 
                    throw err
                
                let list = fd ? JSON.parse(fd) : resolve('没有查询到数据~')
                let resultIndex = list.find(v => v.id === id)

                list[resultIndex] = this
                let newContent = JSON.stringify(list, null, 4)
        
                fs.writeFile(path, newContent, 'utf8', err => {
                    if (err) reject('保存失败')

                    console.log(`Modified record success...`)
                    resolve('保存成功')
                })
            })
        })
    }
}