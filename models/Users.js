const {mongoose}=require('./../db/mongoose');

var User=mongoose.model('User',{
  username:{
    type:String,
    trim:true,
    minlength:4,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
    minlength:5
  },
  age:{
    type:Number,
    min:0,
    max:120,
    required:true
  },
  gender:{
    type:String,
    required:true
  },
  tokens:[{
    access:{
      type:String
    },
    token:{
      type:String
    }
  }]
});

module.exports={User};
