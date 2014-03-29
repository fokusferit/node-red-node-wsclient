/**
 * Copyright 2013 IBM Maxime Journaux
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// If you use this as a template, replace IBM Corp. with your own name.

// Sample Node-RED node file

// Require main module
var RED = require ( process.env.NODE_RED_HOME + "/red/red" );
var ws = require ( "ws" );

function WebSocketClientNode ( n ) {
    // Create a RED node
    RED.nodes.createNode ( this, n );

    var node = this;

    // Store local copies of node configuration (as defined in the .html)
    node.path = n.path;
    
    node._inputNodes = [];    // collection of nodes that want to receive events

    var path = "ws://" + node.path;

    // create a WebSocket Client
    node.wsclient = new ws ( path );

    node.wsclient.on ( "error", function ( err ) {
        node.error ( path + " - " + err );
    } );

    node.wsclient.on ( "open", function ( ) {
        node.wsclient.on ( "message", function ( data, flags ) {
            node.handleMessage ( data, flags );
        } );
    } );

    node.on ( "close", function ( ) {
        node.wsclient.close ( );
    } );
}
RED.nodes.registerType ( "websocket-client", WebSocketClientNode );

WebSocketClientNode.prototype.registerInputNode = function ( /*Node*/ handler ) {
    this._inputNodes.push ( handler );
}

WebSocketClientNode.prototype.send  = function ( /*String*/ data ) {
    this.wsclient.send ( data );
}

WebSocketClientNode.prototype.handleMessage = function ( data, flags ) {
    var msg = { payload: data };

    for ( var i in this._inputNodes )
        this._inputNodes[i].send ( msg );
}

function WebSocketClientReceiveNode ( n ) {
    RED.nodes.createNode ( this, n );
    var node = this;

    this.server = n.server;
    this.serverConfig = RED.nodes.getNode ( this.server );
    if ( this.serverConfig )
        this.serverConfig.registerInputNode ( this );
    else
        this.error ( "Missing server configuration" );
}
RED.nodes.registerType ( "ws-client in", WebSocketClientReceiveNode );

function WebSocketClientSendNode ( n ) {
    RED.nodes.createNode ( this, n );
    var node = this;

    this.server = n.server;
    this.serverConfig = RED.nodes.getNode ( this.server );
    if ( !this.serverConfig )
        this.error ( "Missing server configuration" );

    this.on ( "input", function ( msg ) {
        var payload = msg.payload;
        if ( Buffer.isBuffer ( payload ) ) {
            payload = payload.toString ( );
        } else if ( typeof payload == "object" ) {
            payload = JSON.stringify ( payload );
        } else if ( typeof payload !== "string" ) {
            payload = "" + payload;
        }
        node.serverConfig.send ( payload );
    } );
}
RED.nodes.registerType ( "ws-client out", WebSocketClientSendNode );
