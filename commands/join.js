if(ex[0] == 'JOIN'){
  var chan = ex[1];
  if(chan.substring(0,1) != '#'){
    send(client,':toxicirc.com 403 ' + chan + ' :User/Channel doesn\'t exist');
  }else{
    if(!channelExists(chan)){
      createChannel(chan,clients[cid]['nickname']);
    }else{
      var user = createChannelUser(clients[cid]['nickname'],'v');
      var channel = getChannelID(getChannelByName(chan));
      chans[channel]['users'].push(user);
    }
    sendAllRaw(null,chan,':' + clients[cid]['hostmask'] + ' JOIN :' + chan);
    var list = '';
    for(i=0;i<getChannelByName(chan)['users'].length;i++){
      var channel = getChannelByName(chan);
      list += createVisualModes(channel['users'][i]['modes']) + channel['users'][i]['nick'] + ' ';
    }
    send(client,':toxicirc.com 353 ' + clients[cid]['nickname'] + ' = ' + chan + ' :' + list);
    send(client,':toxicirc.com 366 ' + clients[cid]['nickname'] + ' ' + chan + ' :End of /NAMES list.');
    send(client,':toxicirc.com 332 ' + clients[cid]['nickname'] + ' ' + chan + ' :' + getChannelByName(chan)['topic']);
    sendAllRaw(client,chan,':toxicirc.com MODE ' + chan + ' :+v ' + clients[cid]['nickname']);
  }
}