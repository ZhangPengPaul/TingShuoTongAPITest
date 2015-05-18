var md5 = require("MD5");

exports.SERVER = process.env.SERVER || "http://192.168.6.220:8080/";
exports.老师用户名=process.env.TEACHER || "zidonghua";
exports.学生用户名=process.env.STUDENT || "jiangyangdong";
exports.密码=process.env.PASSWORD || "123123";
exports.md5 = function(input){
    return md5(input)
};
exports.getToken=function(res){
    return res.headers['set-cookie'];
}
