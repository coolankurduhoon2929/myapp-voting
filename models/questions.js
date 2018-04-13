const {mongoose}=require('./../db/mongoose');

var Question=mongoose.model('Question',{
  question:{
    type:String,
    trim:true,
    minlength:4,
    required:true
  },
  author:{
    type:String,
    required:true
  },
  options:[{option:{type:String},no_of_votes:{type:Number}}],
  total_votes:{
    type:Number
  },
  startDate:{
    type:Date
  },
  endDate:{
    type:Date
  },
  category:{
    type:String,
    required:true
  },
  usersID:{
    type:Array
  }
});

module.exports={Question};
