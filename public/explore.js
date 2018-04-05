
//Serach related work...

function searchfun(){
  if($('#search-input').val().trim()===""){
    $('#search-result').html("");
      $('#search-result').append("<p style='text-align:center;margin-top:30vh;'>Start finding people you want to follow...</p>");
  }else{
    $.get('/searchPeople',{value:$('#search-input').val()},function(users){
      $('#search-result').html("");
      if(users.length===0){
        $('#search-result').append(`<p style='text-align:center;margin-top:30vh'>No result found ...</p>`);
      }else{
        $('#search-result').append(`<p style='text-align:center;margin-bottom:30px'>Showing ${users.length} result(s) ...</p>`);
      }
      users.forEach(function(data){
        var template=$('#result-template').html();
        var img1=data.imgsrc;
        console.log(img1);
        if(data.imgsrc===undefined || data.imgsrc===null || data.imgsrc==="NotProvided"){
          img1="https://www.iconexperience.com/_img/o_collection_png/green_dark_grey/512x512/plain/user.png";
        }
        var html=Mustache.render(template,{
          username:data.firstname.trim()+" "+data.lastname.trim(),
          imgsrc:img1,
          username1:data.username
        });
        $('#search-result').append(html);
      });
    });
  }
}

$('#search-button').on('click',searchfun);
$('#search-input').on('keyup',searchfun);
