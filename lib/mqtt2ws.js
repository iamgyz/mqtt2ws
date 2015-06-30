/*
    Name : mqtt2ws
    Author : GYZheng
    Feature : A relay bridge between MQTT and WebSocket, you don't need the broker to support websocket,
    via mqtt2ws, you can easily subscribe and publish data in your web browser
    Update Date: 2014-06-30
    Version: 0.0.1
    Usage:
        Server-side:
            mqtt2ws [port]
            example=> mqtt2ws 8080
        Client-side:
            ws://<server>?host=<host>&port=<port>&topic=<topic>&clientID=<clientID>&qos=<qos>
            example=> ws://gyzlab.com:8080?host=iot.eclipse.org&port=1883&topic=topic&clientID=c123&qos=2
*/
var websocket = require('ws');
var mqtt    = require('mqtt');
var urlparse = require('url');
var querystring = require('querystring');
var log4js = require('log4js');

function start(){
    //set logger
    var logger = log4js.getLogger("mqtt2ws");
    
    //print motd
    logger.info(" __  __  ___ _____ _____ ______        ______");
    logger.info("|  \\/  |/ _ \\_   _|_   _|___ \\ \\      / / ___|");
    logger.info("| |\\/| | | | || |   | |   __) \\ \\ /\\ / /\\___ \\");
    logger.info("| |  | | |_| || |   | |  / __/ \\ V  V /  ___) |");
    logger.info("|_|  |_|\\__\\_\\|_|   |_| |_____| \\_/\\_/  |____/");
    logger.info("The simple bridge between MQTT and WebSocket");
    logger.info("Author : GYZheng in GYZLAB.COM");

    var port = 8080;//default port
    //checkout args
    if(process.argv.length>3){
        logger.error("Wrong arguments!");
        logger.warn("Usage:");
        logger.warn("mqtt2ws <port>");
        logger.warn("Example:");
        logger.warn("mqtt2ws 7788");
        return;
    }
    //if pass port as third arument
    if(process.argv.length==3){
        port = process.argv[2];
    }
    
    var WebSocketServer = websocket.Server;


    var wss = new WebSocketServer({ port: port },function(){
        logger.info("Running on port "+port);
        logger.info("Ready to work!");
    });

    wss.on('connection', function(ws) {
        //  ws://140.113.216.24:8080?host=iot.eclipse.org&port=1883&topic=eeg/4/128&clientID=client_1&qos=1
        var $ = ws.mqtt = {};
        var url =  urlparse.parse(ws.upgradeReq.url);
        var param = querystring.parse(url.query);
        $.host = param.host || '127.0.0.1';//default host = localhost
        $.port = param.port || 1883; //default port = 1883
        $.qos = param.qos>0 && param.qos<=2 ? param.qos : 0 ;//default qos = 0
        $.topic = param.topic;
        $.clientID = param.clientID || 'client'+Math.floor( Math.random()*1000 );
        logger.info("Get Websocket request => "+$);

        //connect to mqtt broker
        var client = $.client = mqtt.connect({host:$.host,port:$.port});
        client.on('connect',function(){
            client.subscribe($.topic,{qos:$.qos});
            logger.info("Connect to MQTT broker");
            logger.info("Subscribe! topic = "+$.topic+", qos = "+$.qos);
        });

        client.on('message',function(topic,message,packet){
            /*
                Because we just support subscribing one topic in one ws,
                We don't need to check topic, just redirect to ws
            */
            logger.debug("Get message via MQTT");
            logger.debug("Msg => "+message);
            try{
                /*
                    Why try&catch here?
                    Prevent the case that calling ws.send immediately after ws is closed
                */
                ws.send(message,{binary:false});
                logger.debug("Redirect message to WebSocket");
            }catch(ex){
                logger.error("Websocket connection is closed");
                //do nothing...
            }
        });

        client.on('error',function(err){
            logger.error("MQTT conneciton error")
            logger.log(err);
        });

        ws.on('message', function(message) {
            logger.debug("Get message via Websocket");
            logger.debug("Msg => "+message);
            //publish message to broker
            client.publish($.topic,message,{qos:$.qos});
            logger.debug("Redirect message to MQTT");
        });
        
        ws.on('close',function(){
            logger.info("Websocket connection is closed by client");
            client.unsubscribe($.topic,function(){
                client.end(true); //true=>force close
                logger.info("Close connection to MQTT broker");
            });
        });
    });
}//function start
//export module
exports.start = start;
