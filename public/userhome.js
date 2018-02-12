$('.panel-default').fadeIn(1000);

$('#main-container button').click(function(){
  var qid=$(this).parent().parent()[0].id;
  var ol=$('#'+qid).find("input");
  var option_selected=-1;
  for(var i=0;i<ol.length;i++){
    if(ol[i].checked===true){
      option_selected=i;
    }
  }
  if(option_selected!=-1){
    //console.log(qid,option_selected);
    $(this).parent().parent().fadeOut(1000,function(){
      $(this).remove();
    });
    $.post('registervote',{
      question_id:qid,
      option_selected:option_selected
    });
  }
});
