const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const multer=require('multer');
const path=require('path');
var urlencodedParser=bodyParser.urlencoded({extended:true});
const jwt=require('jsonwebtoken');
const _=require('lodash');
var cookieParser=require('cookie-parser');

const {mongoose}=require('./db/mongoose');
const {User}=require('./models/Users');
const {Question}=require('./models/questions');
const port=process.env.PORT || 3000;

var app=express();
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(urlencodedParser);
app.use(cookieParser());

//set storage engine with multer
const storage=multer.diskStorage({
  destination:'./public/uploads/',
  filename:function(req,file,cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

//init upload
var upload=multer({
  storage:storage,
  limits:{fileSize:1000000},
  fileFilter:function(req,file,cb){
    checkFileType(file,cb);
  }
}).single('image');

//Function check file type
function checkFileType(file,cb){
  //Allowed extensions
  const fileTypes=/jpeg|jpg|png/;
  //check ext
  const extname=fileTypes.test(path.extname(file.originalname).toLowerCase());
  //check mime
  const mimeType=fileTypes.test(file.mimetype);
  if(mimeType && extname){
    return cb(null,true);
  }  else{
    cb('Error:Images Only');
  }
}

//custom middleware
var authenticate=(req,res,next)=>{
  var token=req.cookies.authx;
  if(!token){
    return res.redirect('/');
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am don');
  }catch(e){
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
    res.redirect('/');
  });
};


var deauthenticate=(req,res,next)=>{
  var token=req.cookies.authx;
  console.log("token",token);
  if(!token){
    return next();
  }
  var decoded;
  try{
    decoded=jwt.verify(token,'i am don');
  }catch(e){
    return next();
  }
  console.log("decoded",decoded);
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
    res.redirect('/me');
  }).catch((err)=>{
    next();
  });
};


//Home
app.get('/',deauthenticate,(req,res)=>{
  res.render('homepage');
});

//signin pageshow
app.get('/signin',deauthenticate,(req,res)=>{
  res.render('login_page')
});

//Signup page
app.get('/signup',deauthenticate,(req,res)=>{
  res.render('signup_page');
});

//Me
app.post('/me',(req,res)=>{
  User.findOne({username:req.body.usernameProvided}).then((doc)=>{
    if(!doc){
      return Promise.reject('No doc found');
    }
    if(doc.password===req.body.passwordProvided){
        var token=jwt.sign(_.pick(doc,['username','password']),'i am don');
        //deleting all previous generated tokens
        var arr1=[];
        arr1.push({
           access:'auth',
           token:token
        });
        //console.log(arr1);
        //console.log(doc.tokens);
        User.findOneAndUpdate({username:doc.username},{$set:{tokens:arr1}}).then((doc)=>{
          //console.log('Done');
        });
        res.cookie('authx',token,{maxAge:600000}).redirect('/me');
    }
    else{
      return Promise.reject('Password Unmatched');
    }
  }).catch((err)=>{
    console.log(err);
    res.redirect('back');
  });
});

//userhome
app.get('/me',authenticate,(req,res)=>{
  Question.find({usersID:{$nin:[req.user._id]}}).then((doc)=>{
    //console.log(doc);
    res.render('userhome',{questions:doc,username:req.user.username});
  }).catch((error)=>{
    console.log(error);
    res.send('userhome');
  });
});
//userprofile
app.get('/profile',authenticate,(req,res)=>{
  res.render('userprofile',{user:req.user});
});

//After signup request
app.post('/onsignupdata',(req,res)=>{
  var user=new User({
    username:req.body.usernameProvided,
    password:req.body.passwordProvided,
    age:req.body.ageProvided,
    gender:req.body.genderProvided
  });
  user.save().then((doc)=>{
    res.render('signupsuccessful');
  }).catch((e)=>{
    res.redirect('back');
  })
});


//Logout request
app.get('/logout',authenticate,(req,res)=>{
  User.findOneAndUpdate({username:req.user.username},{$set:{tokens:[]}}).then((doc)=>{
    //console.log(doc);
    //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.clearCookie('authx').redirect('/');
  }).catch((err)=>{
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
    res.render('userpastactivity',{questions:doc.questions,username:req.user.username});
  }).catch((err)=>{
    console.log(err);
    res.status(400).send();
  });
});

app.get('/pollresults',authenticate,(req,res)=>{
  res.render('pollresults',{username:req.user.username});
});

//sending full poll information
app.get('/getpolldata',authenticate,(req,res)=>{
  Question.find({}).then((doc)=>{
    res.send(doc);
  });
});

//Admin page
app.get('/myadmin',(req,res)=>{
  res.render('adminhome');
});

//Admin page
app.get('/myadminform1',(req,res)=>{
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
    category:req.body.category
  });
  q.save().then((doc)=>{
    res.redirect('/myadmin');
    //console.log(doc);
  }).catch((err)=>{
    res.redirect('back');
    console.log('Some Error');
  })
});

//settings pages
app.get('/setting',authenticate,(req,res)=>{
  res.render('settings',{user:req.user});
});

app.post('/onsettingchange',authenticate,(req,res)=>{
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
    res.redirect('/profile');
  }).catch((err)=>{
    console.log(err);
    res.redirect('/setting');
  });
});




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




app.listen(port,()=>{
  console.log(`Server up on port ${port}`);
});
