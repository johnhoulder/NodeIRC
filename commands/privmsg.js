if(ex[0] == 'PRIVMSG'){
  var target = ex[1];
  if(ex[1].substring(0,1) == "#" || ex[1].substring(0,1) == "!"){
    if(channelExists(target)){
      msg = '';
      for(i=2;i<ex.length;i++){
        msg += ' ' + ex[i];
      }
      msg = msg.trim().substring(1);
      sendAll(clients[cid],target,msg);
    }
  }else if(checkNickname(client,target)){
    var targetclient = getClientByNickname(target);
    msg = '';
    for(i=2;i<ex.length;i++){
      msg += ' ' + ex[i];
    }
    msg = msg.trim().substring(1);
    send(targetclient,':' + clients[cid]['hostmask'] + ' PRIVMSG ' + target + ' :' + msg);
  }else{
    send(client,':toxicirc.com 403 ' + target + ' :User/Channel doesn\'t exist');
  }
}