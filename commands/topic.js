if(ex[0] == 'TOPIC'){
  if(ex[2] != undefined){
	try{
	  var target = ex[1];
	  var chan = target;
	  if(getChannelByName(target)){
		var chanid = getChannelID(getChannelByName(target));
		var topic = '';
		for(i=2;i<ex.length;i++){
		  topic += ' ' + ex[i];
		}
		topic = topic.trim().substring(1);

		chans[chanid]['topic'] = topic;
		sendAllRaw(null,chan,':toxicirc.com 332 ' + clients[cid]['nickname'] + ' ' + chan + ' :' + getChannelByName(chan)['topic']);
	  }else{
		send(client,':toxicirc.com 403 ' + chan + ' :User/Channel doesn\'t exist');
	  }
	}catch(e){
	}
  }else{
	var chan = ex[1];
	if(!getChannelByName(chan)){
	  send(client,':toxicirc.com 403 ' + chan + ' :User/Channel doesn\'t exist');
	}else{
	  send(client,':toxicirc.com 332 ' + clients[cid]['nickname'] + ' ' + chan + ' :' + getChannelByName(chan)['topic']);
	}
  }
}