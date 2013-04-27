var cid = getClientID(client);
data = data.toString();
var lines = data.split('\n');
lines.forEach(function(line){
  line = line.trim();
  if(line.length > 0){
    console.log('[<-] ' + line);
    var ex = line.split(' ');
    var cmd = ex[0].toLowerCase();
    if(fs.existsSync('./commands/' + cmd + '.js')){
      if(fs.statSync('./commands/' + cmd + '.js').isFile()){
        try{
          console.log('Loading ' + cmd + '.js');
          eval(fs.readFileSync('./commands/' + cmd + '.js','utf-8'));
        }catch(e){
          console.log(e);
        }
      }else{
        //Command doesn't exist
      }
    }else{
      //Command doesn't exist
    }
  }
});