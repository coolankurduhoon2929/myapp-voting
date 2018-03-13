google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(function(){

  //making ajax request to get poll data
  $.get('/getpolldata',(data1,status)=>{
    data1.sort(function(a,b){
      return (b.total_votes-a.total_votes);
    });
    $("#ajax-loader").hide();

    for(var i=0;i<data1.length;i++){
      $('#main-container').append("<div class='col-xs-12 img-thumbnail'  style='margin-bottom:30px;width:80%;'></div>");

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
      'chartArea': {width: '50%'},
      'hAxis': {
         title: 'No. of votes',
         minValue: 0
       },
       'vAxis': {
         title: 'Options'
       }
    };
    var containers=$('#main-container div').last();
    var chart = new google.visualization.BarChart(containers[0]);
    chart.draw(data, options);
    }

  if($("#main-container div.img-thumbnail")===0){
    $('#main-container').append("<p style='text-align:center;'>No Data</p>");
  }

  });
});
