const express=require('express');
const hbs=require('hbs');
const bodyParser=require('body-parser');
var urlencodedParser=bodyParser.urlencoded({extended:true});
const jwt=require('jsonwebtoken');
const _=require('lodash');
var cookieParser=require('cookie-parser');

const {mongoose}=require('./db/mongoose');
const {User}=require('./models/Users');

var app=express();
app.set('view engine','hbs');
app.use(urlencodedParser);
app.use(cookieParser());
hbs.registerPartials(__dirname+'/views/partials');

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
  res.render('login_page');
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

app.get('/me',authenticate,(req,res)=>{
  //console.log(req.user);
  res.render('profile',{username:req.user.username,age:req.user.age,gender:req.user.gender});
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



app.listen(3000,()=>{
  console.log('Server up on port 3000');
});
