var frisby = require("frisby");
var config = require('./config.js');
var schema = require('./schema.js');
var JSONSchemaValidator = require('jsonschema').Validator;
var qs = require('qs');
//var Buffer = require('buffer');

var formData = function(obj){
    var str = qs.stringify(obj, { arrayFormat: 'brackets' });
    return new Buffer(str.toString('binary'),'binary');
}

var schemaJsonString = function(path, str, schema){
    var jsVal = new JSONSchemaValidator();
    var json =JSON.parse(str);
    var res = jsVal.validate(json, schema);
    if(res.valid) {
        expect(res.valid).toBeTruthy();
    }else{
        throw new Error("JSONSchema validation failed with the following errors: \n\t> " +
                res.errors.map(function(err, field) { return err.stack.replace('instance', path); }).join("\n\t> ")
        );
    }
}

var 登出=function(token){
    return frisby.create("登出")
        .post(config.SERVER + 'logout',{},{
            headers:{
                "Content-Type": "application/json",
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '登出成功'}
            },
            required:['code','msg']
        })
};
var 登录=function(url, name, password){
    return frisby.create('登录')
        .post(config.SERVER + url, {username: name, password: config.md5(password)})//,{json:true})
        .inspectJSON();
}

var 老是登录=function(name,password) {
    return 登录('teacher/login', name, password)
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '登录成功'}
            },
            required: ['code', 'msg']
        });
};
var 学生登陆=function(name,password) {
        return 登录('student/login', name, password)
            .expectJSONSchema({
                properties: {
                    code: {type: "integer", maximum: 200, minimum: 200},
                    msg: {type: "string", pattern: '登录成功'}
                },
                required: ['code', 'msg']
            });
};

var getWordOfUnit = function(token,bookID,unit){
    var p ={bookID:bookID,meta1:unit};
    return frisby.create('get unit words')
        .get(config.SERVER + 'word/list?' + qs.stringify(p), {
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            code: {type: "integer", maximum: 200, minimum: 200},
            msg: {type: "string", pattern: 'success'},
            results: {type: 'array', items: schema.书籍.单元.单词.信息}
        })
        .afterJSON(function(body){
            for(var i = 0; i < body.results.length; i++){
                //console.log('to schema:' + body.results[i].content);
                var json =JSON.parse(body.results[i].content);
                schemaJsonString('results[' + i + '].content', body.results[i].content, schema.书籍.单元.单词.值);
            }
        })
}

var getSentenceContentOfUnit = function(token, bookID, unit, type){
    var p = { bookID:bookID, meta1:unit};
    type && (p.type = type);
    return frisby.create('get unit sentences')
        .get(config.SERVER + 'content/list?'+qs.stringify(p),{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: 'success'},
                results: {type: 'array', items: schema.书籍.单元.句子.信息}
            },
            required: ['code', 'msg','results']
        }).afterJSON(function(body){
            for(var i = 0; i < body.results.length; i++){
                //console.log('to schema:' + body.results[i].content);
                var json =JSON.parse(body.results[i].content);
                schemaJsonString('results[' + i + '].content', body.results[i].content, {
                    type: "array",
                    items: body.results[i].type == schema.书籍.句子类型.对话 ? schema.书籍.单元.句子.值.对话 :schema.书籍.单元.句子.值.非对话
                });
            }
        });
}

var 老师获取书籍 = function(token){
    return frisby.create("teacher get books")
        .get(config.SERVER + 'book/teacherBook',{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '操作成功'},
                results: {type: 'array', items: schema.书籍.信息}
            },
            required: ['code', 'msg','results']
        })
        .afterJSON(function(body){
            for(var i = 0; i < body.results.length; i++){
                var json =JSON.parse(body.results[i].units);
                schemaJsonString('results['+ i +'].units', body.results[i].units, {
                    type:"array",
                    items:schema.书籍.单元.信息
                });
            }
        });
}

var teacherInfo = function(token){
    return frisby.create('get teacher info')
        .get(config.SERVER + 'personalinfo',{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '获取成功'},
                results: {type: 'array', items: [schema.用户.老师.信息]}
            },
            required: ['code', 'msg','results']
        })
}

var addHomework = function(token, unit, title, message, start, deadline, words, sentences, classes,type){
    var p={meta1:unit,title:title,message:message,limitStart:start,limitEnd:deadline,wordID:words,contentID:sentences,classID:classes,homeworkType:type};
    //console.log('add homework:' + JSON.stringify(p));
    return frisby.create('add homework type ' + type)
        .post(config.SERVER+'homework/assign', formData(p),{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSON({
            code:200,
            msg:'布置作业成功'
        });
}

var studentGetHomeworkList = function(token, status, pageIndex, pageSize){
    var p = {status:status,page:pageIndex,pageSize:pageSize};
    return frisby.create('get homework list')
        .get(config.SERVER + 'homework/student?' + qs.stringify(p),{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        //.inspectJSON()
        .expectJSONSchema({
            properties:{
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '成功'},
                results:{
                    type:'object',
                    properties:{
                        last:{type:'boolean'},
                        content:{
                            type:'array',
                            items:schema.作业.学生作业信息
                        }
                    },
                    required:['content','last']
                }
            },
            required:['code', 'msg','results']
        });
}

var studentInfo = function(token){
    return frisby.create('get student info')
        .get(config.SERVER + 'personalinfo',{
            headers:{
                "Cookie": token
            }
        })
        .expectStatus(200)
        .inspectJSON()
        .expectJSONSchema({
            properties: {
                code: {type: "integer", maximum: 200, minimum: 200},
                msg: {type: "string", pattern: '获取成功'},
                results: {type: 'array', items: [schema.用户.学生.信息]}
            },
            required: ['code', 'msg','results']
        });
}

exports.老师信息=teacherInfo;
exports.学生信息=studentInfo;
exports.登录=登录;
exports.老是登录 = 老是登录;
exports.学生登陆 = 学生登陆;
exports.登出 = 登出;
exports.老师获取书籍 = 老师获取书籍;
exports.获取单元句子内容=getSentenceContentOfUnit;
exports.获取单元单词内容=getWordOfUnit;
exports.布置作业=addHomework;
exports.formData = formData;
exports.学生获取作业列表=studentGetHomeworkList;