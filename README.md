# 项目目录结构

```
.
├── app.js              // 建立一个http服务响应请求，node app.js 启动
├── data
│   ├── cache.json      // 用来缓存store.find()，store.findRecord()的查询记录
│   ├── event.json      // 用户自定义的表，文件名由store.defineModel()确定
│   └── model.json      // 存储用户自定义的表结构
├── record.js           // Class Record 定义
├── server.js           // 执行文件，node app.js 后执行 node server.js 运行
└── store.js            // Class Store 定义
```