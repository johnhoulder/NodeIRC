var fs = require('fs');
net = require('net');
var crypto = require('crypto');

var config = JSON.parse(fs.readFileSync('nodeircd.cfg', 'utf-8'));
var motd = fs.readFileSync('nodeircd.motd', 'utf-8');

var chans = [];
var clients = [];
var core = [];
core['ver'] = '0.1.2';

function getClientID(client) {
	for(var i=0;i<clients.length;i++) {
		if(clients[i] == client) return i;
	}
	return false;
}

function channelExists(chan) {
	for(var i=0;i<chans.length;i++) {
		if(chans[i]['name'] == chan) return true;
	}
	return false;
}

function getClientByNickname(nick) {
	for(var i=0;i<clients.length;i++) {
		if(clients[i]['nickname'] == nick) return clients[i];
	}
	return false;
}

function getClientById(id) {
	if(!clients[i]) {
		return false;
	}else{
		return clients[i];
	}
}

function getChannelByName(channel) {
	for(var i=0;i<chans.length;i++) {
		if(chans[i]['name'] == channel) return chans[i];
	}
	return false;
}

function getChannelID(channel) {
	for(var i=0;i<chans.length;i++) {
		if(chans[i] == channel) return i;
	}
	return false;
}

function checkNickname(client,nick) {
	for(var i=0;i<clients.length;i++) {
		if(clients[i]['nickname'] == nick && clients[i] != client) return true;
	}
	return false;
}

function createVisualModes(modes) {
	return modes.replace('q', '~').replace('a', '&').replace('o', '@').replace('h', '%').replace('v', '+');
}

function send(sock,data) {
	console.log('[->] ' + data);
	sock.write(data + '\r\n');
}

function sendAll(sender,channel,msg) {
	var chan = getChannelByName(channel);
	console.log(chan);
	for(i=0;i<chan['users'].length;i++) {
		var client = chan['users'][i]['uid'];
		var client = clients[client];
		if(client != sender) {
			var data = ':' + sender['hostmask'] + ' PRIVMSG ' + channel + ' :' + msg;
			send(client,data);
		}
	}
}

function sendAllRaw(sender,channel,data) {
	var chan = getChannelByName(channel);
	console.log(chan);
	for(i=0;i<chan['users'].length;i++) {
		var client = chan['users'][i]['uid'];
		client = clients[client];
		if(client != sender) {
			send(client,data);
		}
	}
}

function createChannel(cname,uid) {
	console.log('Creating channel ' + cname+ ' with owner ' + uid);
	var chan = [];
	chan['name'] = cname;
	chan['users'] = [];
	chan['users'].push(createChannelUser(uid,'o'));
	chan['modes'] = 'nt';
	chan['topic'] = false;
	chan['bans'] = '';
	chan['key'] = false;
	chan['max'] = false;
	chans.push(chan);
}

function createChannelUser(uid,modes) {
	// We no longer use a users nick. Now we use ID's
	var user = [];
	user['modes'] = modes;
	user['uid'] = uid;
	return user;
}

function cloakHost(ip) {
	var cloaked = null;
	var hash = crypto.createHash('md5').update(config.cloakkey+ip+config.cloakkey).digest('hex');
	cloaked = config.cloakhost+ '-' + hash.substring(0,15);
	return cloaked;
}

function getUlistID(chan,uid) {
	var channel = getChannelID(getChannelByName(chan));
	for (var i = 0; i < chans[channel]['users'].length; i++) {
		if (chans[channel]['users'][i]['uid'] == uid) return i;
	}
	return false;
}

function sendWelcome(client) {
	var cid = getClientID(client);
	if(clients[cid]['nickset'] == true && clients[cid]['userset'] == true) {
		send(client, ':' + config.server+ ' 001 ' + clients[cid]['nickname'] + ' :Welcome to the ' + config.name+ ' IRC Network, ' + clients[cid]['hostmask']);
		send(client, ':' + config.server+ ' 002 ' + clients[cid]['nickname'] + ' :Your host is ' + config.server+ ', running version NodeIRC v' + core['ver']);
		send(client, ':' + config.server+ ' 004 ' + clients[cid]['nickname'] + ' :' + config.server+ ' NodeIRCd-' + core['ver']+ ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ vo');
		sendMotd(client);
		return true;
	}
	return false;
}

function sendMotd(client) {
	var cid = getClientID(client);
	if(clients[cid]['nickset'] == true && clients[cid]['userset'] == true) {
		var lines = motd.split('\n');
		send(client, ':' + config.server + ' 375 ' + ' :- ' + config.server + ' Message of the day -');
		for(var line in lines) {
			send(client, ':' + config.server + ' 372 ' + ' :- ' + lines[line].toString().trim().substring(0, 80));
		}
		send(client, ':' + config.server + ' 376 ' + ' :End of /MOTD command');
	}
}

var sock = net.createServer(function(client) {
	console.log('Connection received.');
	clients.push(client);
	
	client.on('data',function(data) {
		var cid = getClientID(client);
		var clnt = clients[cid];
		data = data.toString();
		var lines = data.split('\n');
		lines.forEach(function(line) {
			line = line.trim();
			if(line.length > 0) {
				console.log('[<-] ' + line);
				var ex = line.split(' ');
				ex[0] = ex[0].toUpperCase();
				if(ex[0] == 'PING') {
					send(client,'PONG ' + ex[1]);
				}else if(ex[0] == 'NICK') {
					var nick = ex[1];
					if(!checkNickname(client,nick)) {
						clients[cid]['nickset'] = true;
						if(nick.substring(0,1) == ':') {
							clients[cid]['nickname'] = nick.trim().substring(1);
						}else{
							clients[cid]['nickname'] = nick;
						}
						if (!clients[cid]['userset']) {
							// They're connecting.
							send(client,':' + config.server+ ' NICK ' + nick);
							sendWelcome(client);
						}else{
							send(client,':' + clients[cid]['hostmask']+ ' NICK ' + nick);
						}
						clients[cid]['hostmask'] = clients[cid]['nickname'] + '!' + clients[cid]['user'] + '@' + clients[cid]['hostname'];
					}else{
						send(client,':' + config.server+ ' 433 ' + clients[cid]['nickname'] + ' :Already a user with this nickname.');
					}
				}else if(ex[0] == 'USER') {
					var user = ex[1];
					var real = '';
					for(i=4;i<ex.length;i++) {
						real += ' ' + ex[i];
					}
					real = real.trim();
					clients[cid]['realname'] = real;
					clients[cid]['user'] = user;
					clients[cid]['hostname'] = cloakHost(clients[cid].remoteAddress);
					clients[cid]['hostmask'] = clients[cid]['nickname'] + '!' + clients[cid]['user'] + '@' + clients[cid]['hostname'];
					clients[cid]['userset'] = true; // Client connected.
					sendWelcome(client);
				}else if(ex[0] == 'PRIVMSG' || ex[0] == 'NOTICE') {
					var target = ex[1];
					if(ex[1].substring(0,1) == '#' || ex[1].substring(0,1) == '!') {
						if(channelExists(target)) {
							msg = '';
							for(i=2;i<ex.length;i++) {
								msg += ' ' + ex[i];
							}
							msg = msg.trim().substring(1);
							console.log('clients[cid]: ' + clients[cid]+ ' target: ' + target+ ' msg: ' + msg);
							sendAll(clients[cid],target,msg);
						}
					}else if(checkNickname(client,target)) {
						var targetclient = getClientByNickname(target);
						msg = '';
						for(i=2;i<ex.length;i++) {
							msg += ' ' + ex[i];
						}
						msg = msg.trim().substring(1);
						send(targetclient,':' + clients[cid]['hostmask'] + ' ' + ex[0]+ ' ' + target + ' :' + msg);
					}else{
						send(client,':' + config.server+ ' 403 ' + target + ' :User or Channel doesn\'t exist');
					}
				}
				else if(ex[0] == 'JOIN') {
					var chan = ex[1];
					if(chan.substring(0,1) != '#') {
						send(client,':' + config.server+ ' 403 ' + chan + ' :Channel doesn\'t exist');
					}else{
						if(!channelExists(chan)) {
							//createChannel(chan,clients[cid]['nickname']);
							createChannel(chan,cid);
							console.log('Channel does not exist. Creating it.');
							var user = createChannelUser(cid,config.modesonjoin);
						}else{
							var user = createChannelUser(cid,'');
							var channel = getChannelID(getChannelByName(chan));
							chans[channel]['users'].push(user);
						}
						sendAllRaw(null,chan,':' + clients[cid]['hostmask'] + ' JOIN :' + chan);
						var list = '';
						for(i=0;i<getChannelByName(chan)['users'].length;i++) {
							var channel = getChannelByName(chan);
							var uid = channel['users'][i]['uid'];
							console.log('Getting user list for user ' + i);
							list += createVisualModes(channel['users'][i]['modes']) + clients[uid]['nickname'] + ' ';
						}
						send(client,':' + config.server+ ' 353 ' + clients[cid]['nickname'] + ' = ' + chan + ' :' + list);
						send(client,':' + config.server+ ' 366 ' + clients[cid]['nickname'] + ' ' + chan + ' :End of /NAMES list.');
						if(getChannelByName(chan)['topic'] != false) {
							send(client,':' + config.server+ ' 332 ' + clients[cid]['nickname'] + ' ' + chan + ' :' + getChannelByName(chan)['topic']);
						}
						var channel = getChannelID(getChannelByName(chan));
						send(client,':' + config.server+ ' 324 ' + clients[cid]['nickname']+ ' ' + chan+ ' ' + chans[channel]['modes']);
					}
				}else if (ex[0] == 'PART') {
						var chan = ex[1];
						var channel = getChannelID(getChannelByName(chan));
						var ulist = getUlistID(chan,cid);
						var userid = 0;
						for(uid=0;uid<chans[channel]['users'].length;uid++) {
							if (getClientById(chans[channel]['users'][uid])['nickname'] == client['nickname']) {
								isin = 1;
								userid = uid;
							}
						}
						chans[channel]['users'].splice(chans[channel]['users'].indexOf(chans[channel]['users'][userid]),1);
						
						send(client,':' + clients[cid]['hostmask']+ ' PART ' + ex[1]);
						if(!config['static-part']) {
							sendAllRaw(null,chan,':' + clients[cid]['hostmask']+ ' PART ' + ex[1]);
						}else{
							sendAllRaw(null,chan,':' + clients[cid]['hostmask']+ ' PART ' + config['static-part']);
						}
						if(chans[channel]['users'].length == 0) {
							chans.splice(chans.indexOf(chans[channel],1));
						}
				}else if(ex[0] == 'TOPIC') {
					var chan = ex[1];
					if(chan.substring(0,1) == '#') {
						var topic = '';
						for(i=2;i<ex.length;i++) {
							topic += ' ' + ex[i];
						}
						topic = topic.trim().substring(1);
						sendAllRaw(null,chan,':' + clients[cid]['hostmask']+ ' TOPIC ' + chan+ ' :' + topic);
						var channelid = getChannelID(getChannelByName(chan));
						console.log('Trying to set topic on ' + channelid+ ' which is ' + chans[channelid]['name']);
						if(topic != '') {
							chans[channelid]['topic'] = topic;
						}else{
							chans[channelid]['topic'] = false;
						}
					}
				}else if(ex[0] == 'LIST') {
					var chan = ex[0];
					for(i=0;i<chans.length;i++) {
						var channel = chans[i];
						var reply = ':' + config.server+ ' 322 ' + clients[cid]['nickname']+ ' ' + channel['name']+ ' ' + channel['users'].length+ ' :[+ ' + channel['modes']+ ']';
						if(channel['topic'] != false) {
							reply += ' ' + channel['topic'];
						}
						send(client,reply);
					}
					send(client,':' + config.server+ ' 323 ' + clients[cid]['nickname']+ ' :End of /LIST');
				}else if(ex[0] == 'QUIT') {
					for(i=0;i<chans.length;i++) {
						var chid = getChannelID(getChannelByName(i));
						var isin = 0;
						var userid = 0;
						for(uid=0;uid<chans[cid]['users'].length;uid++) {
							if (getClientById(chans[chid]['users'][uid])['nickname'] == client['nickname']) {
								isin = 1;
								userid = uid;
							}
						}
						if(isin == 1) {
							sendAllRaw(null,chans[chid]['name'],':' + clients[cid]['hostmask']+ ' QUIT :' + config['static-quit']);
							chans[chid]['users'].splice(chans[chid]['users'].indexOf(chans[chid]['users'][userid]),1);
						}
						if(chans[chid]['users'].length == 0) {
							chans.splice(chans.indexOf(chans[chid],1));
						}
					}
					clients.splice(clients.indexOf(clients[cid],1));
				}else if(ex[0] == 'WHO') {
					var chan = ex[1];
					if(chan.substring(0,1) != '#') {
						send(client,':' + config.server+ ' 403 ' + chan + ' :User/Channel doesn\'t exist');
					}else{
						for(i=0;i<getChannelByName(chan)['users'].length;i++) {
							var cuser = getChannelByName(chan)['users'][i];
							var user = cuser['uid'];
							var repl = ':' + config.server+ ' 352 ' + chan + ' ' + clients[user]['user'] + ' ' + clients[user]['hostname'] + ' ' + config['server'] + ' ' + clients[user]['nickname'] + ' G' + createVisualModes(cuser['modes']) + ' :0 ' + clients[user]['realname'];
							send(client,repl);
						}
						send(client,':' + config.server+ ' 314 ' + clients[cid]['hostmask'] + ' ' + chan + ' :End of /WHO list.');
					}
				}else if(ex[0] == 'MODE') {
					var chan = ex[1];
					if(chan !== undefined) {
						if(chan.substring(0,1) == '#') {
							if(ex[2] == '+b' && !ex[3]) {
								// Requested ban list.
								send(client,':' + config.server+ ' 368 ' + clients[cid]['nickname']+ ' ' + chan+ ' :End of Channel Ban List');
							}else{
								if(!ex[2]) {
									// Requested current modes.
									console.log('User requested modes.');
									send(client,':' + config.server+ ' MODE ' + chan + ' +' + getChannelByName(chan)['modes']);
								}else{
									// Setting a mode(s)
									console.log('User set modes ' + ex[2]);
									var modes = ex[2];
									if (ex[3]) { modes += ' ' + ex[3]; }
									sendAllRaw(client,chan,':' + clients[cid]['hostmask']+ ' MODE ' + chan+ ' ' + modes);
									send(client,':' + clients[cid]['hostmask']+ ' MODE ' + chan+ ' ' + modes);
									var channelid = getChannelID(getChannelByName(chan));
									chans[channelid]['modes'] += modes.trim().substring(1);
								}
							}
						}else{
							//Requesting/setting user modes. Currently unimplemented
						}
					}
				}else{
					send(client,':' + config.server+ ' 421 ' + clients[cid]['nickname']+ ' ' + ex[0]+ ' :Unknown command');
				}
			}
		});
	});
});
sock.listen(config.port, config.host);
console.log('NodeIRC Started');
