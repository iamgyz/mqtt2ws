# mqtt2ws
The A relay bridge between MQTT and WebSocket, you do not need the broker to support websocket.  
Via mqtt2ws, you can easily subscribe and publish data in your web browser.

## Install  
`npm install -g mqtt2ws`  


## Usage  
`mqtt2ws 8080`  

## Design principle  
Use restful-like url, say if you want to subscribe topic `gyzlab` on `iot.eclipse.org`  
The websocket url would look like this  
`ws://127.0.0.1:8080?host=iot.eclipse.org&topic=gyzlab&qos=0`

## Example in client-side  
```javascript  
//set up related parameter
var host = 'iot.eclipse.org';
var port = '1883';
var topic = 'mqtt2ws'
var qos = 0;
var clientID = 'mqtt2ws'+Math.floor(Math.random()*1000);
//generate url
var url = 'ws://127.0.0.1:8080?host='+host+'&port='+port+'&topic='+topic+'&clientID='+clientID+'&qos='+qos;
//start WebSocket
var ws = new WebSocket(url);
//onopen event
ws.onopen = function()
{
    console.log('WebSocket opened!');
};
//onmessage event. This will behalf as "MQTT's message arriving when subscribing"
ws.onmessage = function (evt) 
{              
    var data = evt.data;        
    console.log(data);  
};
//onclose event
ws.onclose = function(err)
{ 
    console.log('WebSocket closed');
};
//send message. This will behalf as "MQTT's publish message"
ws.send('This message will publish to MQTT broker with topic '+topic);
```
