var 功能=require('./functions.js');
var 配置=require('./config.js');
var frisby = require('frisby');
var schema = require('./schema.js');
var uuid = require('uuid');
var dateformat=require('dateformat');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function timeHour(time){
    return dateformat(time, 'yyyy-mm-dd HH');
}

function toss(f, msg){
    return function(){
        //console.log('toss ' + msg);
        f.toss();
    }
}

//frisby.after() just add a function to array and invoke them when .toss()
function pipeLine(works){
    for(var i = 0; i < works.length - 1; i++){
        works[i].after(toss(works[i+1], ''+(i+1)));
    }
    return works[works.length - 1];
}

var testsPipline = function() {
    var f1 = frisby.create('test 1')
        .get('http://192.168.5.120:8080/static/3ef9f60c/images/title.png');
    var f2 = frisby.create('test 2')
        .get('http://192.168.5.120:8080/static/3ef9f60c/images/title.png');
    var f3 = frisby.create('test 3')
        .get('http://192.168.5.120:8080/static/3ef9f60c/images/title.png');
    toss(pipeLine([f1, f2, f3]), 0)();
    toss(pipeLine([f2,f3]), 0)();
}

var tests = function() {
    //完成一个完整的作业流程
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
                        功能.获取单元句子内容(tToken, book.bookID, unit.name, null).afterJSON(function (sentences) {
                            //获取全部句子
                            功能.获取单元单词内容(tToken,book.bookID,unit.name).afterJSON(function(words) {
                                //获取全部单词
                                var start = new Date();
                                var end = new Date();
                                end.setDate(end.getDate() + 1);
                                var mapWordId = function(w){return w.wordID};
                                var mapSentencesId = function(s){return s.contentID};
                                var filterAll = function(){return true}
                                var pipelineDecisions = [
                                    {type:schema.作业.类型.单词朗读.值,map:mapWordId, filter:filterAll,isWord:true,seed:uuid.v1()},
                                    {type:schema.作业.类型.句子朗读.值,map:mapSentencesId,filter:schema.作业.类型.句子朗读.filter,isWord:false,seed:uuid.v1()},
                                    {type:schema.作业.类型.听写句子.值,map:mapSentencesId,filter:schema.作业.类型.听写句子.filter,isWord:false,seed:uuid.v1()},
                                    {type:schema.作业.类型.听选词义.值,map:mapWordId, filter:filterAll,isWord:true,seed:uuid.v1()},
                                    {type:schema.作业.类型.对话朗读.值,map:mapSentencesId,filter:schema.作业.类型.对话朗读.filter,isWord:false,seed:uuid.v1()},
                                    {type:schema.作业.类型.短文朗读.值,map:mapSentencesId,filter:schema.作业.类型.短文朗读.filter,isWord:false,seed:uuid.v1()}
                                ];
                                var frisbies=[];
                                pipelineDecisions.forEach(function(d){
                                    var wordIds = d.isWord ? words.results.filter(d.filter).map(d.map) : [];
                                    var sentencesIds = d.isWord ? [] : sentences.results.filter(d.filter).map(d.map);
                                    if(wordIds.length + sentencesIds.length > 0) {
                                        frisbies.push(功能.布置作业(tToken, unit.name, '自动化测试布置作业-' + d.type + '标题', '自动化测试布置作业-' + d.type + '留言'+ d.seed, timeHour(start), timeHour(end),
                                            wordIds, sentencesIds, [sInfo.results[0].tclass.classID], d.type));
                                    }
                                });
                                pipeLine(frisbies).after(function(){
                                    //学生身份搜索刚刚布置的作业的ID
                                    var allHomeworkGot = function(){
                                        return pipelineDecisions.filter(function(d){return d.homeworkID}).length == pipelineDecisions.length;
                                    }
                                    功能.学生获取作业列表(sToken, schema.作业.状态.未完成, 0, 300).afterJSON(function(json){
                                        var rslt = json.results;
                                        meetLast = rslt.last;
                                        rslt.content.forEach(function(work){
                                            var match = pipelineDecisions.filter(function(d){return ('自动化测试布置作业-' + d.type + '留言'+ d.seed) === work.homework.message});
                                            if(match.length > 0){
                                                match[0].homeworkID = work.homework.homeworkID;
                                            }
                                        });
                                        expect(allHomeworkGot()).toBeTruthy();
                                        功能.登出(sToken).toss();
                                        功能.登出(tToken).toss();
                                    }).toss();
                                });
                                frisbies[0].toss();
                            }).toss();
                        }).toss();
                    }).toss();
                }).toss();
            }).toss();
        }).toss();
    }).toss();
}

exports.tests = tests;