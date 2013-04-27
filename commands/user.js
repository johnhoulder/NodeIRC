if(ex[0] == 'USER'){
  var user = ex[1];
  var real = '';
  for(i=4;i<ex.length;i++){
	real += ' ' + ex[i];
  }
  real = real.trim();
  clients[cid]['realname'] = real;
  clients[cid]['user'] = user;
  clients[cid]['hostname'] = 'NodeIRC-' + clients[cid].remoteAddress;
  clients[cid]['hostmask'] = clients[cid]['nickname'] + '!' + clients[cid]['user'] + '@' + clients[cid]['hostname'];
  clients[cid]['userset'] = true;
  sendWelcome(client);
}