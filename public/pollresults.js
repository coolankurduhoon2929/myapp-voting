google.charts.load("current", {packages:["corechart"]});
google.charts.setOnLoadCallback(function(){

  //making ajax request to get poll data
  $.get('/getpolldata',(data1,status)=>{

    data1.sort(function(a,b){
      return (b.total_votes-a.total_votes);
    });
    $("#ajax-loader").hide();
    // for(var z=0;z<10;z++){
    for(var i=0;i<data1.length;i++){
      $('#main-container').append("<div class='col-lg-4 col-md-6 col-sm-12 col-xs-12 img-thumbnail'  style='margin-bottom:30px'></div>");

      var tempa=[];
      tempa.push(['option','no. of votes']);
      for(var j=0;j<data1[i].options.length;j++){
        var kk=[];
        kk.push(data1[i].options[j].option);
        kk.push(parseInt(data1[i].options[j].no_of_votes));
        //console.log(kk);
        tempa.push(kk);
      }
      //console.log(tempa);
    var data = google.visualization.arrayToDataTable(tempa);

    var options = {
      'title': data1[i].question+"  ( "+data1[i].category+" )",
      'height':300,
      'width':300,
      is3D: true
    };
    var containers=$('#main-container div').last();
    var chart = new google.visualization.PieChart(containers[0]);
    chart.draw(data, options);
    }
  // }
  if($("#main-container div.img-thumbnail")===0){
    $('#main-container').append("<p style='text-align:center;'>No Data</p>");
  }

  });
});

$('#bs-example-navbar-collapse-2 ul li').click(function(){
  $('#bs-example-navbar-collapse-2 ul li.active').removeClass('active');
  $(this).addClass('active');
  $('#main-container').html('');
  $('#main-container').append("<img src='/photos/ajax-loader.gif' id='ajax-loader'></img>");
  var categ=$(this).text();
  google.charts.setOnLoadCallback(function(){

    //making ajax request to get poll data
    $.get('/getpolldata',(data1,status)=>{

      data1.sort(function(a,b){
        return (b.total_votes-a.total_votes);
      });
      $("#ajax-loader").hide();
      // for(var z=0;z<10;z++){
      for(var i=0;i<data1.length;i++){
        if(data1[i].category===categ || categ==="All"){
        $('#main-container').append("<div class='col-lg-4 col-sm-6 col-xs-12 img-thumbnail'  style='margin-bottom:30px'></div>");

        var tempa=[];
        tempa.push(['option','no. of votes']);
        for(var j=0;j<data1[i].options.length;j++){
          var kk=[];
          kk.push(data1[i].options[j].option);
          kk.push(parseInt(data1[i].options[j].no_of_votes));
          //console.log(kk);
          tempa.push(kk);
        }
        //console.log(tempa);
      var data = google.visualization.arrayToDataTable(tempa);

      var options = {
        'title': data1[i].question+"  ( "+data1[i].category+" )",
        'height':300,
        'width':300,
        is3D: true
      };
      var containers=$('#main-container div').last();
      var chart = new google.visualization.PieChart(containers[0]);
      chart.draw(data, options);
        }
      }
    // }

    if($("#main-container div.img-thumbnail").length===0){
      console.log("length=0");
      $('#main-container').append("<p style='text-align:center;padding:150px;'>No Data</p>");
    }


    });
  });

});
