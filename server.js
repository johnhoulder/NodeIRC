var fs = require('fs');
    net = require('net');

var config = JSON.parse(fs.readFileSync('config.json','utf-8'));

var chans = [];
var clients = [];

function getClientID(client){
  for (var i = 0; i < clients.length; i++) {
    if (clients[i] == client) return i;
  }
  return false;
}

function channelExists(chan){
  for(var i=0;i<chans.length;i++){
    if(chans[i]['name'] == chan) return true;
  }
  return false;
}

function getClientByNickname(nick){
  for (var i = 0; i < clients.length; i++) {
    if (clients[i]['nickname'] == nick) return clients[i];
  }
  return false;
}

function getChannelByName(channel){
  for (var i = 0; i < chans.length; i++) {
    if (chans[i]['name'] == channel) return chans[i];
  }
  return false;
}

function getChannelID(channel){
  for (var i = 0; i < chans.length; i++) {
    if(chans[i] == channel) return i;
  }
  return false;
}

function checkNickname(client,nick){
  for (var i = 0; i < clients.length; i++) {
    if (clients[i]['nickname'] == nick && clients[i] != client) return true;
  }
  return false;
}

function createVisualModes(modes){
  return modes.replace('o','@').replace('v','+');
}

function send(sock,data){
  console.log('[->] ' + data);
  sock.write(data + '\r\n');
}

function sendAll(sender,channel,msg){
  var chan = getChannelByName(channel);
  console.log(chan);
  for(i=0;i<chan['users'].length;i++){
    var client = getClientByNickname(chan['users'][i]['nick']);
    if(client != sender){
      var data = ':' + sender['hostmask'] + ' PRIVMSG ' + channel + ' :' + msg;
      send(client,data);
    }
  }
}

function sendAllRaw(sender,channel,data){
  var chan = getChannelByName(channel);
  console.log(chan);
  for(i=0;i<chan['users'].length;i++){
    var client = getClientByNickname(chan['users'][i]['nick']);
    if(client != sender){
      send(client,data);
    }
  }
}

function createChannel(cname,nick){
  var chan = [];
  chan['name'] = cname;
  chan['users'] = [];
  chan['users'].push(createChannelUser(nick,'o'));
  chan['modes'] = '';
  chan['topic'] = 'Free Toxic-Productions NodeIRC channel';
  chans.push(chan);
}

function createChannelUser(nick,modes){
  var user = [];
  user['modes'] = modes;
  user['nick'] = nick;
  return user;
}

function sendWelcome(client){
  var cid = getClientID(client);
  if(clients[cid]['nickset'] == true && clients[cid]['userset'] == true){
    send(client,':toxicirc.com 001 ' + clients[cid]['nickname'] + ' :Welcome to the Internet Relay Network, ' + clients[cid]['hostmask']);
    send(client,':toxicirc.com 002 ' + clients[cid]['nickname'] + ' :Your host is toxicirc.com, running version NodeIRC v1.8');
    send(client,':toxicirc.com 004 ' + clients[cid]['nickname'] + ' :toxicirc.com NodeIRC-1.5 abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ vo');
    return true;
  }
  return false;
}

var sock = net.createServer(function(client){
  console.log('Connection received.');
  clients.push(client);
  
  client.on('data',function(data){
    eval(fs.readFileSync('handler.js','utf-8'));
  });
});
sock.listen(config.port, config.host);