var 功能=require('./functions.js');
var 配置=require('./config.js');
var schema = require('./schema.js');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var tests = function() {
    功能.学生登陆(配置.学生用户名,配置.密码).after(function(err,res){
        var sToken = 配置.getToken(res);
        功能.学生信息(sToken).afterJSON(function(sInfo) {
            功能.老是登录(配置.老师用户名, 配置.密码).after(function (err, res) {
                var tToken = 配置.getToken(res);
                功能.老师信息(tToken).afterJSON(function(tInfo) {
                    //这个老师是这个学生的课程老师
                    expect(tInfo.results[0].teacherID === sInfo.results[0].tclass.teacherID).toBeTruthy();
                    功能.老师获取书籍(tToken).afterJSON(function (json) {
                        //随机获取一个单元
                        var book = json.results[getRandomInt(0, json.results.length)];
                        var units = JSON.parse(book.units);
                        var unit = units[getRandomInt(0, units.length)];
                        功能.获取单元句子内容(tToken, book.bookID, unit.name, null).after(function () {
                            功能.登出(tToken).toss();
                            功能.登出(sToken).toss();
                        }).toss();
                    }).toss();
                }).toss();
            }).toss();
        }).toss();
    }).toss();
}

exports.tests = tests;