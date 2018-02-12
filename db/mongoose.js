const mongoose=require('mongoose');

mongoose.Promise=global.Promise;
mongoose.connect('mongodb://kaal1:jairamjiki@ds231758.mlab.com:31758/mydatabase1');
//mongodb://localhost/mydatabase
module.exports={mongoose};
