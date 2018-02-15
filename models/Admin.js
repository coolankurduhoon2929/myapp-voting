const {mongoose}=require('./../db/mongoose');

var Admin=mongoose.model('Admin',{
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
    minlength:4
  },
  access:{type:String},
  token:{type:String}
});

module.exports={Admin};
