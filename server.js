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
    send(client,':toxicirc.com 002 ' + clients[cid]['nickname'] + ' :Your host is toxicirc.com, running version NodeIRC v1.5');
    send(client,':toxicirc.com 004 ' + clients[cid]['nickname'] + ' :toxicirc.com NodeIRC-1.5 abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ vo');
    return true;
  }
  return false;
}

var sock = net.createServer(function(client){
  console.log('Connection received.');
  clients.push(client);
  
  client.on('data',function(data){
    var cid = getClientID(client);
    var clnt = clients[cid];
    data = data.toString();
    var lines = data.split('\n');
    lines.forEach(function(line){
      line = line.trim();
      if(line.length > 0){
        console.log('[<-] ' + line);
        var ex = line.split(' ');
        if(ex[0] == 'PING'){
          send(client,'PONG ' + ex[1]);
        }
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
      }
    });
  });
});
sock.listen(config.port, config.host);