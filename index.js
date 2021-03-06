/*
RESTFul services by NodeJS
Author: toy2437@EDMTDev
Update : 09/22/19
*/

var crypto = require('crypto');
var uuid = require('uuid');
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var multer = require('multer');
var path = require('path');
var newDate = require('date-utils');



//MySQL연결
var con = mysql.createConnection({
    // connectionLimit :  100 ,
    // waitForConnections :  true ,
    // queueLimit : 0 ,
    host:'dbinstance.cezo5hq4m8rx.ap-northeast-2.rds.amazonaws.com',
    user: 'toy5404',
    password:'rlafodnjs10',
    database: 'bolle',
    // debug    :  true,
    // wait_timeout :  28800 ,
    // connect_timeout : 10
    
});




//비밀번호 유틸리티
var genRandomString = function(length){
return crypto.randomBytes(Math.ceil(length/2))
.toString('hex') /* 헥사형식으로 변화 */
.slice(0,length);  /*필요한 문자를 반환*/
};

var sha512 = function(password,salt){
    var hash = crypto.createHmac('sha512',salt); /* SHA512 사용*/
    hash.update(password);
    var value = hash.digest('hex');
    return{
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userPassword){
    var salt = genRandomString(16); /* 16개의 랜덤문자열로 표시*/
    var passwordData = sha512(userPassword,salt);
    return passwordData;
}

function checkHashPassword(userPassword,salt)
{
    var passwordData = sha512(userPassword,salt);
    return passwordData;
}



var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb (null , new Date().valueOf() + path.extname(file.originalname));

    }
});



var app=express();


var upload = multer({ storage: storage });



app.post('/picturedata',upload.array('files'),(req,res,next) => {
    
    let file1 = "empty";
    let file2 = "empty";
    let file3 = "empty";
    for(var i = 0; i<req.files.length; i++){
        switch(i){
            case 0:
                file1 ="http://10.0.2.2:3000/"+req.files[0].filename;
                break;
            case 1:
                file2 = "http://10.0.2.2:3000/"+req.files[1].filename;
                break;
            case 2:
                file3 = "http://10.0.2.2:3000/"+req.files[2].filename;
                break;
        }
    }

    let pictitle = req.body.pictitle;
    let piccontents = req.body.piccontents;

    var sql = 'INSERT INTO multiphoto(pictitle,photo1,photo2,photo3,piccontents) VALUES(?,?,?,?,?)';

    con.query(sql,[pictitle,file1,file2,file3,piccontents],function (error,result,fields){
        if(error){
            console.log("error ocurred", error);
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
         }
         else{
             console.log('The solution is:', result);
             res.send({
                "code": 200,
                "success" : "업로드 성공"
            })
         }
     })
});




app.get("/videodata",(req,res,next)=>{
    con.query('SELECT * FROM testvideo',function(error,result,fields){
        con.on('error',function(err){
            console.log('[MY SQL ERROR]',err);
        });
        if(result && result.length){
            res.end(JSON.stringify(result));
            console.log(result);
        } else {
            res.end(JSON.stringify("no video"));
            console.log("비디오가 없습니다.");
        }
    })
});

app.get("/photodata",(req,res,next)=>{
    con.query('SELECT * FROM multiphoto',function(error,result,fields){
        con.on('error',function(err){
            console.log('[MY SQL ERROR]',err);
        });
        if(result && result.length){
            res.end(JSON.stringify(result));
            console.log(result);
        } else {
            res.end(JSON.stringify("no photo"));
            console.log("사진이 없습니다.");
        }
    })
});




app.post('/profile',upload.array('file',2),function(req, res){
    var file = req.file;
    var title = req.body.title;
    var contents = req.body.contents;
    
         var sql = 'INSERT INTO testvideo(title,urivideo,contents,uriimage) VALUES(?,?,?,?)';
      
         con.query(sql,[title,"http://10.0.2.2:3000/"+req.files[1].filename,contents,"http://10.0.2.2:3000/"+req.files[0].filename],function (error,result,fields){
             if(error){
                console.log("error ocurred", error);
                res.send({
                    "code": 400,
                    "failed": "error ocurred"
                })
             }
             else{
                 console.log('The solution is:', result);
                 res.send({
                    "code": 200,
                })
             }
         })
    });

  

   


app.use(bodyParser.json()); /*JSON 매개 변수 허용*/ 
app.use(bodyParser.urlencoded({extended: true})); /*url로 인코딩된 매개 변수 허용*/
app.use(express.static('uploads'));










app.post('/register/', (req, res, next) => {
    var post_data = req.body; // Get POST params

    var uid = uuid.v4(); // 
    var plaint_password = post_data.password; // Get password from post params
    var hash_data = saltHashPassword(plaint_password);
    var password = hash_data.passwordHash; // Get hash value
    var salt = hash_data.salt; // Get salt
    var today = new Date();
    var name = post_data.name;
    var email = post_data.email;
    var user = {
        "unique_id": uid,
        "name": name,
        "email": email,
        "encrypted_password": password,
        "salt": salt,
        "created_at": today,
        "updated_at": today
    }
    con.query('SELECT * FROM user where email=?', [email], function (err, result, fields) {

        con.on('error', function (err) {
            console.log('[MySQL ERROR]', err);
        });

        if (result && result.length)
            res.json('User already exists!!! , 유저가 존재합니다.');
        else {
            con.query('INSERT INTO user SET ?', user, function (error, result, fields) {
                if (error) {
                    console.log("error ocurred", error);
                    res.send({
                        "code": 400,
                        "failed": "error ocurred",
                        "users": user
                    })
                } else {
                    console.log('The solution is: ', result);
                    res.send({
                        "code": 200,
                        "success": "user registered successfully , 유저 회원가입 성공하였습니다.",
                        "users": user
                    })
                }
            })
        }
    });

})

app.post('/change_password/', (req, res, next) => {
    var post_data = req.body;

    //Extract email and password from request
    var user_id = post_data.email;
    // var uid = uuid.v4(); // Get UUID v4 like '110abacsasas-af0x-90333-casasjkajksk
    var plaint_password = post_data.password; // Get password from post params
    var hash_data = saltHashPassword(plaint_password);
    var password = hash_data.passwordHash; // Get hash value
    var salt = hash_data.salt; // Get salt
    

    con.query('SELECT * FROM user where email=?', [user_id], function (err, result, fields) {

        con.on('error', function (err) {
            console.log('[MySQL ERROR]', err);
        });

        if (result && result.length) {
            var user = {
                "unique_id": result[0].unique_id,
                "name": result[0].name,
                "email": result[0].email,
                "encrypted_password": password,
                "salt": salt,
                "created_at": result[0].created_at,
                "updated_at": result[0].updated_at,
                "email": result[0].email
            }
            var sql = 'UPDATE user SET unique_id=?,name=?,email=?,encrypted_password=?,salt=?,created_at=?,updated_at=? WHERE email=?';
            con.query(sql,[result[0].unique_id,result[0].name,result[0].email,password,salt,result[0].created_at,result[0].updated_at,result[0].email] , function (err, result, fields) {
            if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error,비밀번호 변경에 실패하였습니다.');
            } else {
                res.end(JSON.stringify('비밀번호 변경이 완료되었습니다.'));
        }
    });    
        }  
    });
})

app.post('/modify_myInfo/', (req, res, next) => {
    var post_data = req.body;
    var id = post_data.id;
    var unique_id = post_data.unique_id;
    var name = post_data.name;
    var email = post_data.email;
    var encrypted_password = post_data.encrypted_password;
    var salt = post_data.salt;
    var created_at = post_data.created_at;
    var updated_at = post_data.updated_at;

    var sql = 'UPDATE user SET unique_id=?,name=?,email=?,encrypted_password=?,salt=?,created_at=?,updated_at=? WHERE id=?';
    con.query(sql,[unique_id,name,email,encrypted_password,salt,created_at,updated_at,id] , function (err, result, fields) {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error,이름 변경에 실패하였습니다.');
        } else {
            res.end(JSON.stringify('이름 변경이 완료되었습니다.'));
        }
    });    
});

app.post('/delete_user/',(req,res,next) => {

    var id = req.body.id;
    var email = req.body.email;
   
     
     var sql = 'DELETE FROM user where id=? AND email=?';
     con.query(sql,[id,email], function (error, result, fields) {
         if (error) {
             console.log("error ocurred", error);
             res.send({
                 "code": 400,
                 "failed": "error ocurred"
             })
         } else {
             console.log('The solution is: ', result);
             res.send({
                 "code": 200,
                 "success": "회원을 탈퇴하였습니다.",
             })
             
         }
     })
 });





app.post('/deletephoto/', (req, res, next) => {
    var post_data = req.body; // Get POST params
    var id = post_data.id;

         var sql = 'DELETE FROM multiphoto where id = ?';
     con.query(sql,[id], function (error, result, fields) {
         if (error) {
             console.log("error ocurred", error);
             res.send({
                 "code": 400,
                 "failed": "error ocurred"
             })
         } else {
             console.log('The solution is: ', result);
             res.send({
                 "code": 200,
                 "success": "삭제하였습니다.",
             })
             
         }
     })
})


app.post('/deletevideo/', (req, res, next) => {
    var post_data = req.body; // Get POST params
    var id = post_data.id;

         var sql = 'DELETE FROM testvideo where id = ?';
     con.query(sql,[id], function (error, result, fields) {
         if (error) {
             console.log("error ocurred", error);
             res.send({
                 "code": 400,
                 "failed": "error ocurred"
             })
         } else {
             console.log('The solution is: ', result);
             res.send({
                 "code": 200,
                 "success": "삭제하였습니다.",
             })
             
         }
     })
})



app.post('/editvideo/',upload.array('file',2),function(req, res){
    var post_data = req.body;
    var id = post_data.id;
    var edittitle = post_data.title;
    var editimage = req.files[1].filename;
    var editvideo = req.files[0].filename;
    var editcontents = post_data.contents;

    var sql = 'UPDATE testvideo SET title = ? ,uriimage = ?, contents = ?, urivideo = ? WHERE id = ?';

    con.query(sql,[edittitle,"http://10.0.2.2:3000/"+req.files[0].filename,editcontents,"http://10.0.2.2:3000/"+req.files[1].filename,id],function(error,result,fileds){
        if (error) {
            console.log("error ocurred", error);
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
        } else {
            console.log('The solution is: ', result);
            res.send({
                "code": 200,
                "success": "수정하였습니다.",
            })
        }
    })
})

app.post('/editpicturedata/',upload.array('files'),(req,res,next) => {
    var post_data = req.body;
    let file1 = "empty";
    let file2 = "empty";
    let file3 = "empty";
    for(var i = 0; i<req.files.length; i++){
        switch(i){
            case 0:
                file1 ="http://10.0.2.2:3000/"+req.files[0].filename;
                break;
            case 1:
                file2 = "http://10.0.2.2:3000/"+req.files[1].filename;
                break;
            case 2:
                file3 = "http://10.0.2.2:3000/"+req.files[2].filename;
                break;
        }   
    }
    let id = post_data.id;
    let editpictitle = post_data.pictitle;
    let editpiccontents = post_data.piccontents;

    var sql = 'UPDATE multiphoto SET pictitle = ? , photo1 = ?, photo2 = ?, photo3 = ?, piccontents = ?  WHERE id = ?';


    con.query(sql,[editpictitle,"http://10.0.2.2:3000/"+req.files[0].filename,"http://10.0.2.2:3000/"+req.files[1].filename,"http://10.0.2.2:3000/"+req.files[2].filename,editpiccontents,id],function (error,result,fields){
        if(error){
            console.log("error ocurred", error);
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
         }
         else{
             console.log('The solution is:', result);
             res.send({
                "code": 200,
                "success" : "업로드 성공"
            })
         }
     })
});

app.post('/user/', (req,res,next) => {  
    var post_data = req.body; // Get POST BODY
    var email = post_data.email;  // GET field 'id' from post data

   
    con.query('SELECT * FROM user where email=?', [email], function (err, result, fields) {

        con.on('error', function (err) {
            console.log('[MySQL ERROR]', err);
        });

        if (result && result.length) {

                res.end(JSON.stringify(result[0])) // If password is true , return all info of user
            
        }
        else {
            res.json('User not exists!!! , 유저가 존재하지 않습니다.')
        }
    });
});

app.post('/Comment/',(req,res,next) =>{
    var post_data=req.body;
    var Comment = post_data.Comment
 
    let newDate = new Date();
    var week = new Array('일','월','화','수','목','금','토');
    let comment_time = newDate.toFormat('YYYY-MM-DD ')+ week[newDate.getDay()] + '요일 '+ newDate.toFormat('HH:MI:SS');

    var sql = 'INSERT INTO comment(id,Comment,email,name,date) VALUES(?,?,?,?,?)';
 
    con.query(sql,[post_data.id,Comment,post_data.email,post_data.name,comment_time],function (error,result,fields){
        if(error){
           console.log("error ocurred", error);
           res.send({
               "code": 400,
               "failed": "error ocurred"
           })
        }
        else{
            console.log('The solution is:', result);
            res.send({
               "code": 200,
           })
        }
    })
});

app.post('/gallerycomment/',(req,res,next) =>{
    var post_data=req.body;
    var Comment = post_data.Comment
 
    let newDate = new Date();
    var week = new Array('일','월','화','수','목','금','토');
    let comment_time = newDate.toFormat('YYYY-MM-DD ')+ week[newDate.getDay()] + '요일 '+ newDate.toFormat('HH:MI:SS');

    var sql = 'INSERT INTO gallerycomment(id,Comment,email,name,date) VALUES(?,?,?,?,?)';
 
    con.query(sql,[post_data.id,Comment,post_data.email,post_data.name,comment_time],function (error,result,fields){
        if(error){
           console.log("error ocurred", error);
           res.send({
               "code": 400,
               "failed": "error ocurred"
           })
        }
        else{
            console.log('The solution is:', result);
            res.send({
               "code": 200,
           })
        }
    })
});



app.get("/commentdata/:id",(req,res,next)=>{
    con.query('SELECT * FROM comment where id=?',[req.params.id],function(error,result,fields){
        con.on('error',function(err){
            console.log('[MY SQL ERROR]',err);
        });

        if(result && result.length){
            res.end(JSON.stringify(result));
            // console.log(result);
        } else {
            res.end(JSON.stringify(result));
        }
    })
});

app.get("/gallerycommentdata/:id",(req,res,next)=>{
    con.query('SELECT * FROM gallerycomment where id=?',[req.params.id],function(error,result,fields){
        con.on('error',function(err){
            console.log('[MY SQL ERROR]',err);
        });

        if(result && result.length){
            res.end(JSON.stringify(result));
            // console.log(result);
        } else {
            res.end(JSON.stringify(result));
        }
    })
});



app.post('/editcomment/',(req, res,next)=>{
    var post_data = req.body;
    var idxx = post_data.idxx;
    var id = post_data.id;
    var editComment = post_data.Comment
    var editemail = post_data.email
    var editname = post_data.name
    let edit_comment_time = post_data.date


    var sql = 'UPDATE comment SET id=?, Comment=?, email=?, name=? , date=? WHERE idxx = ?';

    con.query(sql,[id,editComment,editemail,editname,edit_comment_time,idxx],function(error,result,fileds){
        if (error) {
            console.log("error ocurred", error);
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
        } else {
            console.log('The solution is: ', result);
            res.send({
                "code": 200,
                "success": "수정하였습니다.",
            })
        }
    })
})

app.post('/deletecomment/',(req,res,next) => {

    var idxx = req.body.idxx;
   
     
     var sql = 'DELETE FROM comment where idxx=?';
     con.query(sql,[idxx], function (error, result, fields) {
         if (error) {
             console.log("error ocurred", error);
             res.send({
                 "code": 400,
                 "failed": "error ocurred"
             })
         } else {
             console.log('The solution is: ', result);
             res.send({
                 "code": 200,
                 "success": "댓글을 삭제하였습니다.",
             
             })
             
         }
     })
 });

 app.post('/gallerydeletecomment/',(req,res,next) => {

    var idxx = req.body.idxx;
   
     
     var sql = 'DELETE FROM gallerycomment where idxx=?';
     con.query(sql,[idxx], function (error, result, fields) {
         if (error) {
             console.log("error ocurred", error);
             res.send({
                 "code": 400,
                 "failed": "error ocurred"
             })
         } else {
             console.log('The solution is: ', result);
             res.send({
                 "code": 200,
                 "success": "댓글을 삭제하였습니다.",
             })
             
         }
     })
 });


 app.post('/login/',(req,res,next)=>{

    var post_data = req.body;
   
       //이메일과 비밀번호 를 추출
   var user_password = post_data.password;
   var email = post_data.email;
   
   con.query('SELECT * FROM user where email=?',[email],function(err,result,fields){
       con.on('error',function(err){
           console.log('[MySQL ERROR]',err); 
       });
      
       if(result && result.length)
   {
       var salt = result[0].salt  //계정이 존재하면 salt를 갖는다.
       var encrypted_password = result[0].encrypted_password;
       //데이터베이스에서 salt를 사용하여 해시비밀번호를 사용해 로그인요청을한다.
       var hashed_password = checkHashPassword(user_password,salt).passwordHash;
       if(encrypted_password == hashed_password){
       res.end(JSON.stringify(result[0]))  //만약 비밀번호가 맞으면, 유저의 모든 정보를 반환
       }else{ 
       res.end(JSON.stringify('비밀번호가 틀리다'));
       }
   }
   else
   {
       res.json('아이디가 없습니다. 다시 입력해주세요');
   }
   });
   
   })





//서비스 시작
app.listen(3000, ()=>{
    console.log('3000포트 실행');
})


// application/x-www-form-urlencoded