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

var tests2 = function(){
    frisby.create('test 1')
        .get('http://192.168.5.120:8080/static/3ef9f60c/images/title.png')
        .after(function(){

        }).toss();
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
                    expect(tInfo.results.teacherID === sInfo.results.tclass.teacherID).toBeTruthy();
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
                                    {type:schema.作业.类型.单词朗读.值,map:mapWordId, filter:filterAll,isWord:true},//,seed:uuid.v4()},
                                    {type:schema.作业.类型.句子朗读.值,map:mapSentencesId,filter:schema.作业.类型.句子朗读.filter,isWord:false},//,seed:uuid.v4()},
                                    {type:schema.作业.类型.听写句子.值,map:mapSentencesId,filter:schema.作业.类型.听写句子.filter,isWord:false},//,seed:uuid.v4()},
                                    {type:schema.作业.类型.听选词义.值,map:mapWordId, filter:filterAll,isWord:true},//,seed:uuid.v4()},
                                    {type:schema.作业.类型.对话朗读.值,map:mapSentencesId,filter:schema.作业.类型.对话朗读.filter,isWord:false},//,seed:uuid.v4()},
                                    {type:schema.作业.类型.短文朗读.值,map:mapSentencesId,filter:schema.作业.类型.短文朗读.filter,isWord:false}//,seed:uuid.v4()}
                                ];
                                var frisbies=[];
                                pipelineDecisions.forEach(function(d){
                                    var wordIds = d.isWord ? words.results.filter(d.filter).map(d.map) : [];
                                    var sentencesIds = d.isWord ? [] : sentences.results.filter(d.filter).map(d.map);
                                    if(wordIds.length + sentencesIds.length > 0) {
                                        d.seed = uuid.v4();
                                        frisbies.push(功能.布置作业(tToken, unit.name, '自动化测试布置作业-' + d.type + '标题', '自动化测试布置作业-' + d.type + '留言'+ d.seed, timeHour(start), timeHour(end),
                                            wordIds, sentencesIds, [sInfo.results.tclass.classID], d.type));
                                    }
                                });
                                pipelineDecisions = pipelineDecisions.filter(function(d){return d.seed});//remove non-homework decisions
                                pipeLine(frisbies).after(function(){
                                    //学生身份从作业列表中找到刚刚布置的作业的
                                    var allHomeworkGot = function(){
                                        return pipelineDecisions.filter(function(d){return d.work}).length == pipelineDecisions.length;
                                    }
                                    功能.学生获取作业列表(sToken, schema.作业.状态.未完成, 0, 300).afterJSON(function(json){
                                        var rslt = json.results;
                                        meetLast = rslt.last;
                                        for(var i = 0; i < rslt.content.length && !allHomeworkGot(); i++) {
                                            var work = rslt.content[i];
                                            var match = pipelineDecisions.filter(function (d) {
                                                return ('自动化测试布置作业-' + d.type + '留言' + d.seed) === work.homework.message
                                            });
                                            if (match.length > 0) {
                                                match[0].work = work;
                                            }
                                        }
                                        expect(allHomeworkGot()).toBeTruthy();
                                        //获取作业内容
                                        var getWorkContentsWorkers = [];
                                        pipelineDecisions.forEach(function(d) {
                                            if (d.isWord) {
                                                getWorkContentsWorkers.push(功能.获得单词作业内容(sToken, d.work.hDoneID).afterJSON(function (json) {
                                                    d.contents = json.results.list;
                                                }));
                                            }else{
                                                getWorkContentsWorkers.push(功能.获得句子作业内容(sToken, d.work.hDoneID).afterJSON(function (json) {
                                                    d.contents = json.results.list;
                                                }));
                                            }
                                        });
                                        pipeLine(getWorkContentsWorkers).after(function(){
                                            //学生提交作业
                                            var commits = [];
                                            pipelineDecisions.forEach(function(d){
                                                var scores = [];
                                                if(d.isWord){
                                                    d.contents.forEach(function(listItem){
                                                        scores.push({id:listItem.wordID, voice:[{score:getRandomInt(0,100),voice:""}]});
                                                    });
                                                }else{
                                                    d.contents.forEach(function(listItem) {
                                                        var content = JSON.parse(listItem.content);
                                                        var voices = [];
                                                        if (listItem.type == schema.书籍.句子类型.对话) {
                                                            //TODO:对话类型还没做，不知道提交的作业结果格式
                                                            content.forEach(function (dialog) {
                                                                dialog.text.forEach(function (text) {
                                                                    voices.push({score: getRandomInt(0, 100), voice: ""})
                                                                });
                                                            });
                                                        } else {
                                                            var voices = [];
                                                            content.forEach(function (text) {
                                                                voices.push({score: getRandomInt(0, 100), voice: ""});
                                                            });
                                                        }
                                                        scores.push({id: listItem.contentID, voice: voices});
                                                    });
                                                }
                                                commits.push(功能.学生提交作业(sToken, d.work.hDoneID, getRandomInt(0,100), scores));
                                            });
                                            pipeLine(commits).after(function(){
                                                //老师评分
                                                var teacherSetScore = [];
                                                pipelineDecisions.forEach(function(d){
                                                    teacherSetScore.push(功能.老师评分(tToken, d.work.hDoneID, getRandomInt(0, 100)));
                                                });
                                                pipeLine(teacherSetScore).after(function(){
                                                    //最后退出登录
                                                    功能.登出(sToken).toss();
                                                    功能.登出(tToken).toss();
                                                });
                                                teacherSetScore[0].toss();
                                            });
                                            commits[0].toss();
                                        });
                                        getWorkContentsWorkers[0].toss();
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