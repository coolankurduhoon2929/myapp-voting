const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const multer=require('multer');
const path=require('path');
var urlencodedParser=bodyParser.urlencoded({extended:true});
const jwt=require('jsonwebtoken');
const _=require('lodash');
var cookieParser=require('cookie-parser');
const dns=require('dns');

const {mongoose}=require('./db/mongoose');
const {User}=require('./models/Users');
const {Admin}=require('./models/Admin');
const {Question}=require('./models/questions');
const port=process.env.PORT || 3000;

var app=express();
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(urlencodedParser);
app.use(cookieParser());

//set storage engine with multer
// const storage=multer.diskStorage({
//   destination:'./public/uploads/',
//   filename:function(req,file,cb){
//     cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });

//init upload
// var upload=multer({
//   storage:storage,
//   limits:{fileSize:1000000},
//   fileFilter:function(req,file,cb){
//     checkFileType(file,cb);
//   }
// }).single('image');

//Function check file type
// function checkFileType(file,cb){
//   //Allowed extensions
//   const fileTypes=/jpeg|jpg|png/;
//   //check ext
//   const extname=fileTypes.test(path.extname(file.originalname).toLowerCase());
//   //check mime
//   const mimeType=fileTypes.test(file.mimetype);
//   if(mimeType && extname){
//     return cb(null,true);
//   }  else{
//     cb('Error:Images Only');
//   }
// }

//custom middleware for user login
var authenticate=(req,res,next)=>{
  var token=req.cookies.authx;
  if(!token){
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.redirect('/');
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am don');
  }catch(e){
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.redirect('/');
  }
  User.findOne({
    'username':decoded.username,
    'tokens.token':token,
    'token.access':decoded.access
  }).then((user)=>{
    if(!user){
      return Promise.reject();
    }
    req.user=user;
    req.token=token;
    next();
  }).catch((err)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.redirect('/');
  });
};


var deauthenticate=(req,res,next)=>{
  var token=req.cookies.authx;
  if(!token){
    return next();
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am don');
  }catch(e){
    return next();
  }
  User.findOne({
    'username':decoded.username,
    'tokens.token':token,
    'token.access':decoded.access
  }).then((user)=>{
    if(!user){
      return next();
    }
    req.user=user;
    req.token=token;
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.redirect('/me');
  }).catch((err)=>{
    next();
  });
};


//Home
app.get('/',deauthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('homepage');
});

//signin pageshow
app.get('/signin',deauthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  var error={error1:"",error2:""};
  if(req.cookies.signinerror){
      error=JSON.parse(req.cookies.signinerror);
  }
  res.render('login_page',error);
});

//Signup page
app.get('/signup',deauthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('signup_page');
});

//Me
app.post('/me',(req,res)=>{
  User.findOne({username:req.body.usernameProvided}).then((doc)=>{
    if(!doc){
      return Promise.reject('No such username exists');
    }
    if(doc.password===req.body.passwordProvided){
        var token=jwt.sign(_.pick(doc,['username','password']),'i am don');
        //deleting all previous generated tokens
        var arr1=[];
        arr1.push({
           access:'authx',
           token:token
        });
        //console.log(arr1);
        //console.log(doc.tokens);
        User.findOneAndUpdate({username:doc.username},{$set:{tokens:arr1}}).then((doc)=>{
          //console.log('Done');
        });
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.cookie('authx',token,{maxAge:6000000}).clearCookie('signinerror').redirect('/me');
    }
    else{
      return Promise.reject('Incorrect password');
    }
  }).catch((err)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    var error1='';
    var error2='';
    if(err==="Incorrect password"){
      error2=err;
    }else{
      error1=err;
    }
    var error={error1:error1,error2:error2};
    res.cookie('signinerror',JSON.stringify(error),{maxAge:2000}).redirect('back');
  });
});

//userhome
app.get('/me',authenticate,(req,res)=>{
  //var arr=req.user.following.push("");
  User.find({_id:{$in:req.user.following}},"username").then((doc11)=>{
    var doc12=[];
    for(var i=0;i<doc11.length;i++){
      doc12.push(doc11[i].username);
    }
    doc12.push("thisisadmin15081998");
    doc12.push(req.user.username);

    Question.find({usersID:{$nin:[req.user._id]},author:{$in:doc12}}).then((doc)=>{
      //console.log(doc);
      doc.sort(function(a,b){return a.startDate.getTime()-b.startDate.getTime()});
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.render('userhome',{questions:doc,username:req.user.username});
    }).catch((error)=>{
      console.log(error);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.send('userhome');
    });
  }).catch((err)=>{
    console.log(err);
});
});
//userprofile
app.get('/profile',authenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('userprofile',{user:req.user});
});

//checking existance of a user
app.get('/checkvalidusername',(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  var data={valid:1};
  User.findOne({username:req.query.username}).then((doc)=>{
    if(doc){
      data.valid=0;
    }
    else{
      data.valid=1;
    }
    res.send(data);
  }).catch((error)=>{

  });
});

//After signup request
app.post('/onsignupdata',(req,res)=>{
  var imsz;
  if(req.body.genderProvided==="Female"){
      imsz="https://scontent.fdel11-1.fna.fbcdn.net/v/t31.0-1/c282.0.960.960/p960x960/1402926_10150004552801901_469209496895221757_o.jpg?_nc_cat=0&oh=c5d4d511fd9e0a95f6341827e4f964b3&oe=5B5AD56A";
  }
  else{
    imsz="https://scontent.fdel11-1.fna.fbcdn.net/v/t31.0-1/c282.0.960.960/p960x960/10506738_10150004552801856_220367501106153455_o.jpg?_nc_cat=0&oh=56b54d799e7ec853e1410c6a2d271a0e&oe=5B50B912";
  }
  var user=new User({
    firstname:req.body.firstnameProvided.trim(),
    lastname:req.body.lastnameProvided.trim(),
    username:req.body.usernameProvided.trim(),
    password:req.body.passwordProvided.trim(),
    age:req.body.ageProvided,
    gender:req.body.genderProvided,
    city:"NotProvided",
    occupation:"NotProvided",
    imgsrc:imsz,
    about:"NotProvided",
    questions:[],
    followers:[],
    Following:[],
    dateJoined:new Date()
  });
  user.save().then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.render('signupsuccessful');
  }).catch((e)=>{
    console.log(e.errors);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.redirect('back');
  })
});

app.get("/signupsuccessful",(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('signupsuccessful');
});


//Logout request
app.get('/logout',authenticate,(req,res)=>{
  User.findOneAndUpdate({username:req.user.username},{$set:{tokens:[]}}).then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.clearCookie('authx').redirect('/');
  }).catch((err)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send('Oh It crashed...');
  });
});


//submitting Vote
app.post('/registervote',authenticate,(req,res)=>{
  Question.findOne({_id:req.body.question_id}).then((doc)=>{
    var obj=doc;
    obj.options[req.body.option_selected].no_of_votes=obj.options[req.body.option_selected].no_of_votes+1;
    obj.total_votes=obj.total_votes+1;
    obj.usersID.push(req.user._id);
    Question.findOneAndUpdate({_id:req.body.question_id},obj).then((doc)=>{
      //console.log(doc);
      var qqq=doc.question;
      var optionslist=doc.options;
      User.findOne({_id:req.user._id}).then((doc)=>{
        var obj=doc;
        obj.questions.push({
          qid:req.body.question_id,
          option_selected:optionslist[req.body.option_selected].option,
          pollDate:new Date,
          question:qqq
        });
        User.findOneAndUpdate({_id:req.user._id},obj).then((doc)=>{

        }).catch((err)=>{
          console.log(error);
        });
      });


    }).catch((err)=>{
      console.log('Oh it crashed',err);
    });
  });
//{$inc:{total_votes:1},$set:{options:optionArray},$addToSet:{usersID:[req.user._id]}}
});

//user past Activity
app.get('/userpastactivity',authenticate,(req,res)=>{
  User.findOne({_id:req.user._id}).then((doc)=>{
    // console.log(doc.questions.length);
    // var data=[];
    // for(var i=0;i<doc.questions.length;i++){
    //   console.log(Question.findOne({_id:doc.questions[i].qid},(data,err)=>{return data}));
    // }
    //console.log(data);
    var zzzz=doc.questions;
    var aaaa=doc.questionasked;
    for(var i=0;i<aaaa.length;i++){
      aaaa[i].option_selected="1za2za3za0za";
      zzzz.push(aaaa[i]);
    }
    //console.log(zzzz);
    zzzz.sort(function(a,b){
      return a.pollDate.getTime()-b.pollDate.getTime();
    });
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    //console.log(zzzz);
    res.render('userpastactivity',{questions:zzzz,username:req.user.username});
  }).catch((err)=>{
    console.log(err);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(400).send();
  });
});

app.get('/pollresults',authenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('pollresults',{username:req.user.username});
});

//sending full poll information
app.get('/getpolldata',authenticate,(req,res)=>{
  //var userz=req.user.following;
  //userz.push("thisisadmin15081998");
  User.find({_id:{$in:req.user.following}},"username").then((doc2)=>{
    doc3=[];
    for(var i=0;i<doc2.length;i++){
      doc3.push(doc2[i].username);
    }
    doc3.push("thisisadmin15081998");
    //console.log(doc3);
    Question.find({author:{$in:doc3}}).then((doc)=>{
      //console.log(doc);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.send(doc);
    });

  }).catch((err)=>{
    console.log(err);
  });
});
app.get('/getpolldata1',adminAuthenticate,(req,res)=>{
  Question.find({}).then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(doc);
  });
});


//settings pages
app.get('/setting',authenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('settings',{user:req.user});
});

app.post('/onsettingchange',authenticate,(req,res)=>{
  //checking availability of imgsrc...
  // dns.resolve4(req.body.imgsrc,(err,addresses)=>{
  //   if(err.code==="ENOTFOUND"){
  //     var imsz;
  //     if(req.body.gender==="Female"){
  //         imsz="https://cdn.pixabay.com/photo/2014/03/25/16/54/user-297566_960_720.png";
  //     }
  //     else{
  //       imsz="http://www.clker.com/cliparts/c/4/0/e/1197115544208915882acspike_male_user_icon.svg.med.png";
  //     }
  //     req.body.imgsrc=imsz;
  //   };

  User.findByIdAndUpdate(req.user._id, {$set:{
    firstname:req.body.firstname,
    lastname:req.body.lastname,
    password:req.body.password,
    age:req.body.age,
    occupation:req.body.occupation,
    city:req.body.city,
    about:req.body.about,
    imgsrc:req.body.imgsrc
  }}).then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.redirect('/profile');
  }).catch((err)=>{
    console.log(err);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.redirect('/setting');
  });
});
//});




//upload image page...
// app.get('/uploadimage',(req,res)=>{
//   res.render('uploadingimage');
// });

//upload post image
// app.post('/upload',(req,res)=>{
//   upload(req,res,(err)=>{
//     if(err){
//       console.log(err);
//       res.render('uploadingimage',{message:err});
//     }
//     else{
//       console.log(req.file);
//       res.send('test');
//     }
//   });
// });


//Handling admin login

app.get('/admin',adminDeauthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('adminlogin');
});

app.post('/onadminlogin',adminDeauthenticate,(req,res)=>{
  Admin.findOne({username:req.body.username}).then((doc)=>{
    if(!doc){
      return Promise.reject('Admin not found');
    }
    if(doc.password===req.body.password){
        var token=jwt.sign({username:doc.username,password:doc.password,access:"authy"},'i am kaal');
        Admin.findOneAndUpdate({username:doc.username},{$set:{token:token,access:'authy'}}).then((doc)=>{
          console.log('Done');
        });
        res.cookie('authy',token,{maxAge:6000000}).redirect('/myadmin');
    }
    else{
      return Promise.reject('Password Unmatched');
    }
  }).catch((err)=>{
    console.log(err);
    res.redirect('back');
  });
});


//Admin page
app.get('/myadmin',adminAuthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('adminhome');
});

//Admin page
app.get('/myadminform1',adminAuthenticate,(req,res)=>{
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render('adminputquestion');
});

app.post('/submitquestion',(req,res)=>{
  //console.log(req.body);
  var options=[];
  var x;
  x=req.body.option1
  if(x){
    options.push({option:x,no_of_votes:0});
  }
  x=req.body.option2
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option3
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option4
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option5
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option6
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option7
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option8
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  //console.log(options);
  var q=new Question({
    question:req.body.question,
    options:options,
    startDate:new Date(),
    endDate:new Date(req.body.endDate),
    category:req.body.category,
    author:"thisisadmin15081998",
    total_votes:0
  });
  q.save().then((doc)=>{
    res.redirect('/myadmin');
    //console.log(doc);
  }).catch((err)=>{
    res.redirect('back');
    console.log('Some Error');
  })
});

//custom middleware for user login
function adminAuthenticate(req,res,next){
  var token=req.cookies.authy;
  if(!token){
    return res.redirect('/admin');
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am kaal');
  }catch(e){
    return res.redirect('/admin');
  }
  Admin.findOne({
    username:decoded.username,
    token:token,
    access:decoded.access
  }).then((user)=>{
    if(!user){
      return Promise.reject();
    }
    req.user=user;
    req.token=token;
    next();
  }).catch((err)=>{
    res.redirect('/admin');
  });
};


function adminDeauthenticate(req,res,next){
  var token=req.cookies.authy;
  if(!token){
    return next();
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am kaal');
  }catch(e){
    return next();
  }
  console.log(decoded);
  Admin.findOne({
    username:decoded.username,
    token:token,
    access:decoded.access
  }).then((user)=>{
    if(!user){
      return next();
    }
    req.user=user;
    req.token=token;
    res.redirect('/myadmin');
  }).catch((err)=>{
    next();
  });
};


//get poll results for admin...
app.get('/adminpollresult',adminAuthenticate,(req,res)=>{
  Question.find({}).then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.render('adminpollresult',{doc:doc});
  });
});

//Logout request Admin
app.get('/adminlogout',adminAuthenticate,(req,res)=>{
  Admin.findOneAndUpdate({username:req.user.username},{$set:{token:"",access:""}}).then((doc)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.clearCookie('authy').redirect('/admin');
  }).catch((err)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send('Oh It crashed...');
  });
});

app.get('/explore',authenticate,(req,res)=>{
  doc=req.user;
  User.find({_id:{$in:req.user.followers}}).select('_id username firstname lastname imgsrc').then((doc2)=>{
    doc.followers=doc2;
    //console.log('following',doc.following);
    User.find({_id:{$in:req.user.following}}).select('_id username firstname lastname imgsrc').then((doc3)=>{
      doc.following=doc3;
      //console.log(d3);
      //console.log(doc.followers);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.render('explore',{username:req.user.username,user:doc});
    });
  }).catch((err)=>{
    console.log(err);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(400).send('Some error is there...');
  });
});

//Searching people
app.get('/searchPeople',authenticate,(req,res)=>{
  var value=req.query.value;
  value=value.trim().toLowerCase();
  User.find({},'_id username firstname lastname imgsrc').then((data)=>{
    var ans=[];
    data.forEach((d)=>{
      var a1=d.firstname.toLowerCase().trim();
      var a2=d.lastname.toLowerCase().trim();
      if(value===a1){
        ans.push(d);
      }
      else if(value===a2){
        ans.push(d);
      }
      else if(value===(a1+" "+a2)){
        ans.push(d);
      }
      else{
        var i1=0;
        var i2=0;
        var i=0;
        while(i1<value.length && i2<a1.length){
          if(value[i1]===a1[i2]){
            i=i+1;
          }
          i1=i1+1;
          i2=i2+1;
        }
        if(i/(value.length)>=.6){
          ans.push(d);
        }
      }
    });
    res.send(ans);
  });
});

//see anyone's profile...
app.get('/viewprofile/:user_id',authenticate,(req,res)=>{
  //console.log(req.params)
  User.findOne({_id:req.params.user_id}).then((doc)=>{
    //if(doc.imgsrc===undefined){doc.imgsrc="kuch bhi";}
    //dns.resolve4(doc.imgsrc,(err,addresses,family)=>{
      //dns.resolve6(doc.imgsrc,(err1,addresses,family)=>{
        //if(err.code==="ENOTFOUND" && err1.code==="ENOTFOUND"){
          //doc.imgsrc="https://cdn.pixabay.com/photo/2016/08/31/11/54/user-1633249_960_720.png";
        //};

      //console.log(err);
      //console.log(doc.imgsrc);
      User.find({_id:{$in:doc.followers}}).select('_id username firstname lastname imgsrc').then((doc2)=>{
        doc.followers=doc2;
        //console.log('following',doc.following);
        User.find({_id:{$in:doc.following}}).select('_id username firstname lastname imgsrc').then((doc3)=>{
          doc.following=doc3;
          //console.log(d3);
          //console.log(doc.followers);
          doc.checkfollow="Follow";
          for(var i=0;i<req.user.following.length;i++){
            //console.log('done');
            if(req.params.user_id.trim()===req.user.following[i].toString()){
              doc.checkfollow="Following";
            }
          }
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.render('viewprofile',{user:doc});
        });
      }).catch((err)=>{
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(400).send('Some error is there...');
      });
    //});
  }).catch((err)=>{
    console.log(err);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(400).send('No such user found');
  });
});

//update following list...
app.post('/updatefollowinglist',authenticate,(req,res)=>{
  //console.log(req.body.usernameToFollow);
  User.findOne({username:req.body.usernameToFollow}).then((data)=>{
    User.findOne({_id:req.user._id}).then((doc)=>{
      var obj=doc;
      obj.following.push(data._id);
      User.findOneAndUpdate({_id:req.user._id},obj).then((doc)=>{
        var obj2=data;
        obj2.followers.push(req.user._id);
        User.findOneAndUpdate({_id:data._id},obj2).then((doc)=>{res.send('Done');});
      });
    });
  }).catch((err)=>{
    console.log(err);
  });
});

app.get('/putupquestion',authenticate,(req,res)=>{
  res.render('putupquestion',{user:req.user});
});
app.post('/submituserquestion',authenticate,(req,res)=>{
  //console.log(req.body);
  var options=[];
  var x;
  x=req.body.option1
  if(x){
    options.push({option:x,no_of_votes:0});
  }
  x=req.body.option2
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option3
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option4
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option5
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option6
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option7
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  x=req.body.option8
  if(x){
      options.push({option:x,no_of_votes:0});
  }
  //console.log(options);
  var q=new Question({
    question:req.body.question,
    options:options,
    startDate:new Date(),
    //endDate:new Date(req.body.endDate),
    category:req.body.category,
    author:req.user.username,
    total_votes:0
  });
  q.save().then((doc)=>{
    console.log(doc);
    var qasked={question:req.body.question,qid:doc._id,pollDate:doc.startDate,option_selected:"1za2za3za0za"};
    var qaskedlist=req.user.questionasked;
    qaskedlist.push(qasked);
    User.findOneAndUpdate({_id:req.user._id},{$set:{questionasked:qaskedlist}}).then((doc11)=>{
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.render('onputupquestion',{user:req.user});
      res.render('userpastactivity',{questions:doc.questions,username:req.user.username});
    });

    //console.log(doc);
  }).catch((err)=>{
    res.redirect('back');
    console.log('Some Error',err);
  });

});

app.all('*', function(req, res) {
    res.status(400).send('This page does not exist');
})

app.listen(port,()=>{
  console.log(`Server up on port ${port}`);
});
