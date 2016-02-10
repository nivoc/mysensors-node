//const gwType						= 'Ethernet';
//const gwAddress						= '10.0.1.99';
//const gwPort						= 9999;

const gwType = 'Serial';
//const gwPort = 'COM4';
const gwPort = '/dev/ttyAMA0';
const gwBaud = 115200;

const dbAddress						= '127.0.0.1';
const dbPort						= 27017;
const dbName						= 'MySensorsDb';

const fwSketches					= [ ];
const fwDefaultType 				= 0xFFFF; // index of hex file from array above (0xFFFF

const FIRMWARE_BLOCK_SIZE			= 16;
const BROADCAST_ADDRESS				= 255;
const NODE_SENSOR_ID				= 255;

const C_PRESENTATION				= 0;
const C_SET							= 1;
const C_REQ							= 2;
const C_INTERNAL					= 3;
const C_STREAM						= 4;

const V_TEMP						= 0;
const V_HUM						= 1;
const V_LIGHT						= 2;
const V_DIMMER						= 3;
const V_PRESSURE					= 4;
const V_FORECAST					= 5;
const V_RAIN						= 6;
const V_RAINRATE					= 7;
const V_WIND						= 8;
const V_GUST						= 9;
const V_DIRECTION					= 10;
const V_UV							= 11;
const V_WEIGHT						= 12;
const V_DISTANCE					= 13;
const V_IMPEDANCE					= 14;
const V_ARMED						= 15;
const V_TRIPPED						= 16;
const V_WATT						= 17;
const V_KWH							= 18;
const V_SCENE_ON					= 19;
const V_SCENE_OFF					= 20;
const V_HEATER						= 21;
const V_HEATER_SW					= 22;
const V_LIGHT_LEVEL					= 23;
const V_VAR1						= 24;
const V_VAR2						= 25;
const V_VAR3						= 26;
const V_VAR4						= 27;
const V_VAR5						= 28;
const V_UP							= 29;
const V_DOWN						= 30;
const V_STOP						= 31;
const V_IR_SEND						= 32;
const V_IR_RECEIVE					= 33;
const V_FLOW						= 34;
const V_VOLUME						= 35;
const V_LOCK_STATUS					= 36;

const I_BATTERY_LEVEL				= 0;
const I_TIME						= 1;
const I_VERSION						= 2;
const I_ID_REQUEST					= 3;
const I_ID_RESPONSE					= 4;
const I_INCLUSION_MODE				= 5;
const I_CONFIG						= 6;
const I_PING						= 7;
const I_PING_ACK					= 8;
const I_LOG_MESSAGE					= 9;
const I_CHILDREN					= 10;
const I_SKETCH_NAME					= 11;
const I_SKETCH_VERSION				= 12;
const I_REBOOT						= 13;

const S_DOOR						= 0;
const S_MOTION						= 1;
const S_SMOKE						= 2;
const S_LIGHT						= 3;
const S_DIMMER						= 4;
const S_COVER						= 5;
const S_TEMP						= 6;
const S_HUM							= 7;
const S_BARO						= 8;
const S_WIND						= 9;
const S_RAIN						= 10;
const S_UV							= 11;
const S_WEIGHT						= 12;
const S_POWER						= 13;
const S_HEATER						= 14;
const S_DISTANCE					= 15;
const S_LIGHT_LEVEL					= 16;
const S_ARDUINO_NODE				= 17;
const S_ARDUINO_REPEATER_NODE		= 18;
const  S_LOCK						= 19;
const  S_IR							= 20;
const  S_WATER						= 21;
const  S_AIR_QUALITY				= 22;

const ST_FIRMWARE_CONFIG_REQUEST	= 0;
const ST_FIRMWARE_CONFIG_RESPONSE	= 1;
const ST_FIRMWARE_REQUEST			= 2;
const ST_FIRMWARE_RESPONSE			= 3;
const ST_SOUND						= 4;
const ST_IMAGE						= 5;

const P_STRING						= 0;
const P_BYTE						= 1;
const P_INT16						= 2;
const P_UINT16						= 3;
const P_LONG32						= 4;
const P_ULONG32						= 5;
const P_CUSTOM						= 6;

var fs = require('fs');
var path = require('path');
var requestify = require('requestify');
var appendedString="";

function crcUpdate(old, value) {
	var c = old ^ value;
	for (var i = 0; i < 8; ++i) {
		if ((c & 1) > 0)
			c = ((c >> 1) ^ 0xA001);
		else
			c = (c >> 1);
	}
	return c;
}

function pullWord(arr, pos) {
	return arr[pos] + 256 * arr[pos + 1];
}
 
function pushWord(arr, val) {
	arr.push(val & 0x00FF);
	arr.push((val  >> 8) & 0x00FF);
}

function pushDWord(arr, val) {
	arr.push(val & 0x000000FF);
	arr.push((val  >> 8) & 0x000000FF);
	arr.push((val  >> 16) & 0x000000FF);
	arr.push((val  >> 24) & 0x000000FF);
}


/*
function decode(msg) {
	var msgs = msg.toString().split(";");
	rsender = +msgs[0];
	rsensor = +msgs[1];
	rcommand = +msgs[2];
	rtype = +msgs[3];
	var pl = msgs[4].trim();
	rpayload = [];
	for (var i = 0; i < pl.length; i+=2) {
		var b = parseInt(pl.substring(i, i + 2), 16);
		rpayload.push(b);
	}
}
*/

function encode(destination, sensor, command, acknowledge, type, payload) {
	var msg = destination.toString(10) + ";" + sensor.toString(10) + ";" + command.toString(10) + ";" + acknowledge.toString(10) + ";" + type.toString(10) + ";";
	if (command == 4) {
		for (var i = 0; i < payload.length; i++) {
			if (payload[i] < 16)
				msg += "0";
			msg += payload[i].toString(16);
		}
	} else {
		msg += payload;
	}
	msg += '\n';
	return msg.toString();
}


var lastTmp = 0;
var lastHum = 0;
function sendValueToDisplay(sender, sensor, type, payload, gw) { 

   if (sender != 104) {
     return 
   } 
   var ts = new Date().toLocaleTimeString("de-de", {hour: "2-digit", minute: "2-digit"});
   sendMessage(50, 50, gw, "OUTSIDE "+payload+" "+ts);
}
function saveValue(sender, sensor, type, payload) {
	var cn = "Value-" + sender.toString() + "-" + sensor.toString();
/*
		{
			'timestamp': new Date().getTime(),
			'type': type,
			'value': payload
		}
*/
        var gauge = "UNKNOWN";
        if (sender === 103 || sender === 101 || sender == 104) {
		  gauge = "TEMP";
        } 
        if (sender === 110) {
		  gauge = "SENSBENDER";
        } 

        if (sender === 101 && sensor == 0) {
          source = "home.bath.tub.tube";
        } else if (sender === 101 && sensor == 1) {
          source = "home.bath.tub.bottom";
        } else if (sender === 101 && sensor == 2) {
          source = "home.bath.tub.middle";
        } else if (sender === 101 && sensor == 3) {
          source = "home.bath.tub.top";
        } else if (sender === 104 && sensor == 0) {
          source = "home.outside.back";
        } else if (sender === 103 && sensor == 0) {
	  gauge = "HUM";
          source = "home.bath.hum";

        } else if (sender === 110 && sensor == 1) {
	  gauge = "TEMP";
          source = "sensbender";
        } else if (sender === 110 && sensor == 2) {
	  gauge = "HUM";
          source = "sensbender";
        } else if (sender === 110 && sensor == 111) {
	  gauge = "BATT";
          source = "sensbender";

        } else if (sender === 120 && sensor == 1) {
	  gauge = "TEMP";
          source = "sensbender.big";
        } else if (sender === 120 && sensor == 2) {
	  gauge = "HUM";
          source = "sensbender.big";
        } else if (sender === 120 && sensor == 121) {
	  gauge = "BATT";
          source = "sensbender.big";

        } else if (sender === 122 && sensor == 1) {
	  gauge = "TEMP";
          source = "sensbender.2016";
        } else if (sender === 122 && sensor == 2) {
	  gauge = "HUM";
          source = "sensbender.2016";
        } else if (sender === 123 && sensor == 121) {
	  gauge = "BATT";
          source = "sensbender.2016";
        } else if (sender === 103 && sensor == 1) {
          source = "home.bath.back";
        } else if (sender === 133 && sensor == 0) {
	  gauge = "TEMP";
          source = "pro.133";

        } else if (sender >= 200 && sensor == 1) {
	  gauge = "TEMP";
          source = "sensbender.no"+sender;
        } else if (sender >= 200 && sensor == 2) {
	  gauge = "HUM";
          source = "sensbender.no"+sender;
        } else if (sender >= 200 && sensor == 50) {
	  gauge = "BATT";
          source = "sensbender.no"+sender;
        } else {
	  source = sender + "-" + sensor;
          gauge = "UNKNOWN";
	}

        sendToLibrato(gauge, source, payload);
        sendKibana   (gauge, source, payload);
        //sendDockerKibana   (gauge, source, payload);
}

function saveBatteryLevel(sender, payload) {
/*
	var cn = "BatteryLevel-" + sender.toString();
		{ 'timestamp': new Date().getTime(),
	          'value': payload }
*/
}

function saveSketchName(sender, payload) {
/* 
		c.update({ 'id': sender }, 
                { $set: { 'sketchName': payload } }
*/
}

function saveSketchVersion(sender, payload) {
/*
		c.update({ 'id': sender }, {
	        $set: { 'sketchVersion': payload }
*/
}

function sendTime(destination, sensor, gw) {
	var payload = new Date().getTime()/1000;
	var command = C_INTERNAL;
	var acknowledge = 0; // no ack
	var type = I_TIME;
	var td = encode(destination, sensor, command, acknowledge, type, payload);
	console.log('-> ' + td.toString());
	gw.write(td);
}

function sendConfig(destination, gw) {
	var payload = "M";
	var sensor = NODE_SENSOR_ID;
	var command = C_INTERNAL;
	var acknowledge = 0; // no ack
	var type = I_CONFIG;
	var td = encode(destination, sensor, command, acknowledge, type, payload);
	console.log('-> ' + td.toString());
	gw.write(td);
}


function appendData(str, gw) {
    pos=0;
    while (str.charAt(pos) != '\n' && pos < str.length) {
        appendedString=appendedString+str.charAt(pos);
        pos++;
    }
    if (str.charAt(pos) == '\n') {
        rfReceived(appendedString.trim(), gw);
        appendedString="";
    }
    if (pos < str.length) {
        appendData(str.substr(pos+1,str.length-pos-1), gw);
    }
}

function rfReceived(data, gw) {
	if ((data != null) && (data != "")) {
		console.log('<-(in) ' + data);
		// decoding message
		var datas = data.toString().split(";");
		var sender = +datas[0];
		var sensor = +datas[1];
		var command = +datas[2];
		var ack = +datas[3];
		var type = +datas[4];
                var rawpayload="";
                if (datas[5]) {
                	rawpayload = datas[5].trim();
		}
		var payload;
		if (command == C_STREAM) {
			payload = [];
			for (var i = 0; i < rawpayload.length; i+=2)
				payload.push(parseInt(rawpayload.substring(i, i + 2), 16));
		} else {
			payload = rawpayload;
		}
		// decision on appropriate response
		switch (command) {
		case C_PRESENTATION:
			if (sensor == NODE_SENSOR_ID) {
			//	saveProtocol(sender, payload, d_b);
                        }
			//saveSensor(sender, sensor, type, d_b);
			break;
		case C_SET:
			saveValue(sender, sensor, type, payload);
			sendValueToDisplay(sender, sensor, type, payload, gw);
			break;
		case C_REQ:
			break;
		case C_INTERNAL:
			switch (type) {
			case I_BATTERY_LEVEL:
				saveBatteryLevel(sender, payload);
				break;
			case I_TIME:
				sendTime(sender, sensor, gw);
				break;
			case I_VERSION:
				break;
			case I_ID_REQUEST:
				// sendNextAvailableSensorId(d_b, gw);
				break;
			case I_ID_RESPONSE:
				break;
			case I_INCLUSION_MODE:
				break;
			case I_CONFIG:
				sendConfig(sender, gw);
				break;
			case I_PING:
				break;
			case I_PING_ACK:
				break;
			case I_LOG_MESSAGE:
				break;
			case I_CHILDREN:
				break;
			case I_SKETCH_NAME:
				// saveSketchName(sender, payload, d_b);
				break;
			case I_SKETCH_VERSION:
				// saveSketchVersion(sender, payload, d_b);
				break;
			case I_REBOOT:
				break;
			}
			break;
		case C_STREAM:
			break;
		}
		// checkRebootRequest(sender, d_b, gw);
	}
}


	var gw;
	if (gwType == 'Ethernet') {
		gw = require('net').Socket();
		gw.connect(gwPort, gwAddress);
		gw.setEncoding('ascii');
		gw.on('connect', function() {
			console.log('connected to ethernet gateway at ' + gwAddress + ":" + gwPort);
		}).on('data', function(rd) {
			appendData(rd.toString(), gw);
		}).on('end', function() {
			console.log('disconnected from gateway');
		}).on('error', function() {
			console.log('connection error - trying to reconnect');
			gw.connect(gwPort, gwAddress);
			gw.setEncoding('ascii');
		});
	} else if (gwType == 'Serial') {
		var SerialPort = require('serialport').SerialPort;
		gw = new SerialPort(gwPort, { baudrate: gwBaud });
		gw.open();
		gw.on('open', function() {
			console.log('connected to serial gateway at ' + gwPort);
		}).on('data', function(rd) {
			appendData(rd.toString(), gw);
		}).on('end', function() {
			console.log('disconnected from gateway');
		}).on('error', function() {
			console.log('connection error - trying to reconnect');
			gw.open();
		});
	} else {
		throw new Error('unknown Gateway type');
	}
	setInterval(function() {
		sendTime(BROADCAST_ADDRESS, NODE_SENSOR_ID, gw);
	}, 5*60*1000);
var cnt = 0;
function sendMessage(destination, sensor, gw, payload) {
        var command = C_SET;
        var acknowledge = 0; // no ack
        var type = S_LIGHT;
        var td = encode(destination, sensor, command, acknowledge, type, payload);
        console.log('-> ' + td.toString());
        gw.write(td);
	
}



var https = require('https');


var options = {
  hostname: 'metrics-api.librato.com',
  port: 443,
  path: '/v1/metrics',
  method: 'POST',
  auth: 'kuehnle@online.de:6479d806083602920739cca57c2656891f90c38c15e0e49650ac91293820985c',
  headers: {
    'Content-Type': 'application/json'
  }
};
var dockerKibanaOptions = {
  hostname: 'pure.ipc-media.net',
  port: 4444,
  path: '/gauge/sensors',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic a2liYW5hOmNvbm5lY3RtZQ=='
  },
  rejectUnauthorized: false
};
var kibanaOptions = {
  hostname: 'search-sensors-c6myy6rha6siynoaynpy3rgqcu.us-east-1.es.amazonaws.com',
  port: 443,
  path: '/gauge/sensors',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};
function sendDockerKibana(type, source, value) {
	var req = https.request(dockerKibanaOptions, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	  res.on('end', function() {
	    console.log('No more data in response.')
	  })
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
        
        var json = {"sensorID":source, "type":type, "value":Number(value), "timestamp": new Date().toISOString()}

	// write data to request body
	console.log(JSON.stringify(json));
	req.write(JSON.stringify(json));

	req.end();


}

function sendKibana(type, source, value) {
	var req = https.request(kibanaOptions, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	  res.on('end', function() {
	    console.log('No more data in response.')
	  })
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
        
        var json = {"sensorID":source, "type":type, "value":Number(value), "timestamp": new Date().toISOString()}

	// write data to request body
	console.log(JSON.stringify(json));
	req.write(JSON.stringify(json));

	req.end();


}

function sendToLibrato(type, source, value) {
	var req = https.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	  res.on('end', function() {
	    console.log('No more data in response.')
	  })
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
        
	var json = {"gauges":{}};
        json['gauges'][type] = {
                "value": value,
                "source": source
        }

	// write data to request body
	console.log(JSON.stringify(json));
	req.write(JSON.stringify(json));

	req.end();

}
