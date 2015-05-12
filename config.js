var md5 = require("MD5");

exports.SERVER = "http://192.168.6.220/";
exports.老师用户名="zidonghua";
exports.学生用户名="jiangyangdong";
exports.密码="123123";
exports.md5 = function(input){
    return md5(input)
}
exports.getToken=function(res){
    var cookie = res.headers['set-cookie'];
    return cookie;
}
