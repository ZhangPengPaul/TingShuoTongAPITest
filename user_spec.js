var 功能=require('./functions.js');
var 配置=require('./config.js');

var tests = function() {
    功能.老师登录(配置.老师用户名, 配置.密码).after(function (err, res) {
        var token = 配置.getToken(res);
        功能.老师信息(token).after(function(){
            功能.登出(token).toss()
        }).toss()
    }).toss();



    功能.学生登陆(配置.学生用户名, 配置.密码).after(
        function (err, res) {
            var token = 配置.getToken(res);
            功能.学生信息(token).after(function () {
                功能.登出(token).toss()
            }).toss()
        }
    ).toss();

    功能.登录('student/login', "", "mima")
        .expectJSON({
            code: 402
        }).toss();

    功能.登录('teacher/login', 配置.老师用户名, "mima")
        .expectJSON({
            code: 400
        }).toss();
};

exports.tests = tests;