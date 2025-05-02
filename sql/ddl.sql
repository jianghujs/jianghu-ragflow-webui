-- 笔记表
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL comment '标题',
    content longtext NOT NULL comment '内容',
    userId VARCHAR(255) NOT NULL comment '用户id',
    userName VARCHAR(255) NOT NULL comment '用户名',
    createTime VARCHAR(255) NOT NULL comment '创建时间',

    `operation` varchar(255) DEFAULT 'insert' COMMENT '操作; insert, update, jhInsert, jhUpdate, jhDelete jhRestore',
    `operationByUserId` varchar(255) DEFAULT NULL COMMENT '操作者userId',
    `operationByUser` varchar(255) DEFAULT NULL COMMENT '操作者用户名',
    `operationAt` varchar(255) DEFAULT NULL COMMENT '操作时间; E.g: 2021-05-28T10:24:54+08:00 '
);