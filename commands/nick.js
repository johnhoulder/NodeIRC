if(ex[0] == 'NICK'){
  var nick = ex[1];
  if(!checkNickname(client,nick)){
	clients[cid]['nickset'] = true;
	clients[cid]['nickname'] = ex[1];
	sendWelcome(client);
  }else{
	send(client,':toxicirc.com 433 ' + clients[cid]['nickname'] + ' :Already a user with this nickname.');
	//client.end();
  }
}