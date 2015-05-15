exports.书籍={
    信息:{
        id:'book/info',
        properties: {
            bookID: {type: "integer"},
            bookName: {type: "string"},
            grade:{type:"number"},
            units:{type:"string"}
        },
        required:['bookID','bookName','grade','units']
    },
    单元:{
        单词:{
            信息: {
                id:'book/unit/word/info',
                properties:{
                    wordID:{type:'integer'},
                    bookID:{type:'integer'},
                    index:{type:'integer'},
                    meta1:{type:'string',minLength:1},
                    content:{type:'string',minLength:5}
                },
                required:['wordID','bookID','index','meta1','content']
            },
            值:{
                id:'book/unit/word/value',
                properties:{
                    pronounce:{
                        type:'array',
                        items:{type:'string',minLength:1}
                    },
                    voice:{type:'string',minLength:1},
                    word:{type:'string',minLength:1},
                    mean:{
                        type:'array',
                        items:{
                            properties:{
                                part:{type:'string'},
                                mean:{type:'string', minLength:1}
                            },
                            required:['mean']
                        }
                    }
                },
                required:['word','voice']
            }
        },
        句子:{
            信息: {
                id: 'book/unit/content/info',
                properties: {
                    contentID: {type: "integer"},
                    bookID: {type: "integer"},
                    content: {type: "string"},
                    index: {type: "string",pattern:'\[[0-9,]\]'},
                    meta1: {type: "string"},
                    type: {type: "integer",minimum:0,maximum:2}
                },
                required: ['contentID', 'bookID', 'content', 'index', 'meta1', 'type']
            },
            值:{
                对话:{
                    id:'book/unit/content/dialog/values',
                    properties:{
                        text:{type:"array",item:{type:"string"}},
                        voice:{type:"array",item:{type:"string"}},
                        mean:{type:"array",item:{type:"string"}}
                    },
                    required:['text','voice']
                },
                非对话: {
                    id: 'book/unit/content/notdialog/values',
                    properties: {
                        text: {type: "string", minLength: 1},
                        voice: {type: "string", minLength: 5},
                        description: {type: "array"},
                        mean: {type: "string"}
                    },
                    required: ['text', 'voice']
                }
            }
        },
        信息: {
            id: 'book/info/unitInfo',
            properties: {
                name: {type: "string", minLength: 1},
                title: {type: "string"}
            },
            required: ['name', 'title']
        }
    },
    句子类型:{
        对话:0,
        段落:1,
        NotesText:2
    }
}
exports.作业={
    类型:{
        单词朗读:{值:"单词朗读"},//word
        句子朗读:{值:"句子朗读",//0,1,2
            filter:function(s){return true}},
        短文朗读:{值:"短文朗读",//1
            filter:function(s){return s.type == 1}},
        听选词义:{值:"听选词义"},//word
        听写句子:{值:"听写句子",//0,1,2
            filter:function(s){return true}},
        对话朗读:{值:"对话朗读",//0
            filter:function(s){return s.type == 0}}
    },
    状态:{
        失效:-1,
        未完成:0,
        已完成:1,
        进行中:2
    },
    学生作业信息:{
        id:'homework/student/list/items',
        properties:{
            status:{type:'integer'},
            hDoneID:{type:'number'},
            homework:{
                type:'object',
                properties:{
                    homeworkID:{type:'integer'},
                    type:{type:'string',pattern:'[单词句子短文朗读听写对话选词义]+'},
                    message:{type:'string'}
                },
                required:['homeworkID']
            }
        },
        required:['hDoneID','status']
    }
}
exports.用户={
    老师:{
        信息:{
            id:'user/teacher/info',
            properties: {
                username: {type: "string"},
                teacherID: {type: "string"},
                schoolID:{type:"string"},
                age:{type:"integer"},
                nickname: {type: "string"},
                school:{
                    type:"object",
                    properties:{
                        schoolID:{type:"string"},
                        schoolname:{type:"string"}
                    },
                    required:['schoolID','schoolname']
                },
                tclassList:{
                    type:"array",
                    items:{
                        properties: {
                            classID: {type: "string"},
                            className: {type: "string"},
                            bookID: {type: "integer"},
                            gradeNum: {type: "string",pattern:"[0-9]+"},
                            createName: {type: "string"}
                        },
                        required:['classID','className','bookID','gradeNum','createName']
                    }
                }
            },
            required:["teacherID","schoolID",'school','tclassList']
        }
    },
    学生:{
        信息:{
            id:'user/student/info',
            properties: {
                studentID: {type: "string",minLength:1},
                age:{type:"integer"},
                username: {type: "string",minLength:1},
                school:{
                    type:'object',
                    properties:{
                        schoolID:{type:"string",minLength:1},
                        schoolname:{type:'string',minLength:1}
                    },
                    required:['schoolID','schoolname']
                },
                tclass:{
                    type:'object',
                    properties:{
                        classID:{type:'string',minLength:1},
                        className:{type:'string',minLength:1},
                        bookID:{type:'integer'},
                        teacherID:{type:'string',minLength:1},
                        gradeNum:{type:'string',pattern:'[0-9]+'},
                        classNum:{type:'integer'}
                    },
                    required:['classID','bookID','teacherID','gradeNum','classNum']
                }
            },
            required:["studentID","nickname","school",'tclass']
        }
    }
};
