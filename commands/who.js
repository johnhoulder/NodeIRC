if(ex[0] == 'WHO'){
  var chan = ex[1];
  if(chan.substring(0,1) != '#'){
	send(client,':toxicirc.com 403 ' + chan + ' :User/Channel doesn\'t exist');
  }else{
	for(i=0;i<getChannelByName(chan)['users'].length;i++){
	  var cuser = getChannelByName(chan)['users'][i];
	  var user = getClientByNickname(cuser['nick']);
	  var repl = ':toxicirc.com 352 ' + chan + ' ' + user['user'] + ' ' + user['hostname'] + ' toxicirc.com ' + user['nickname'] + ' G' + createVisualModes(cuser['modes']) + ' :0 ' + user['realname'];
	  send(client,repl);
	}
	send(client,':toxicirc.com 314 ' + clients[cid]['hostmask'] + ' ' + chan + ' :End of /WHO list.');
  }
}