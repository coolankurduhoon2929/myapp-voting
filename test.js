var data=['vinay','kaal'];

var value="kaal";
var ans=[];
    data.forEach((d)=>{
      var a1=d.toLowerCase().trim();
      if(value===a1){
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
	console.log("i=",i);
      }
    });

console.log(ans);
