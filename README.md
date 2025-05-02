# _xiaoxun_chat_jianghu

## 配置

1. npm install
2. 复制 `config.local.example.js` 为 `config.local.js`
3. 并且修改数据库配置为自己的数据库, 例如：
   ```
   host: '127.0.0.1',
   port: 3306,
   user: 'root',
   password: '123456',
   database: 'ragflow_xiaoxun'
   ```
4. 启动 npm run dev
   
## 数据库

```sql
# 数据库初始化
create database `ragflow_xiaoxun` default character set utf8mb4 collate utf8mb4_bin;
use ragflow_xiaoxun;
# 运行 sql/init.sql 文件
```

## 测试账号 & 测试环境

- admin/123456

## 页面

1. 应用协议: frontendDemo.html
   * 增删改查（select，insert，softUpdate，softDelete）

## FAQ

- egg-jianghu mysql view
```sql
DROP VIEW IF EXISTS `_view01_user`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `_view01_user` AS select * from `_user`;
```




        md_document_ids = kwargs.get("md_document_ids")
        logging.info("检索组件：检索完成，获得chunks数量: {}".format(len(kbinfos.get("chunks", []))))
        logging.error("检索组件：md_document_ids: {}".format(md_document_ids))