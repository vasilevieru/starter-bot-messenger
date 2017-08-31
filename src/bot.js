import {replyMessage} from './facebook.js'
import config from './../config.js'
var recast = require('recastai')
var fetch = require('node-fetch')

var client = new recast.Client(config.recastToken)
var origin="", destination="", transport="";

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

function handleMessage(message) {
    var data = JSON.parse(message);
    var senderID = data.senderId
    console.log(senderID)
    var messageText = data.message.attachment.content
    console.log(messageText)
    var messageAttachments = data.message.attachment
    console.log(messageAttachments)
    var googleAPI = "https://maps.googleapis.com/maps/api/directions/json?language=fr&origin=";

    if (messageText) {
        client.textConverse(messageText, {conversationToken: senderID}).then((res) => {
            const reply = res.reply()
            const replies = res.replies
            const action = res.action
            var slug;
            if(action !== null){
                slug = res.action.slug
                console.log(action)
                console.log(slug)
            }

            if (!reply) {
                replyMessage(senderID, "Pardonne?");
            } else {
                if (action && action.done === true) {
                    console.log('action is done')
                }
                let promise = Promise.resolve()
                replies.forEach(rep => {
                    promise = promise.then(() => replyMessage(senderID, rep))
                })

                function getDestination(data,entity){
                    var dest = JSON.parse(JSON.stringify(data.entities[entity]));
                    console.log(dest)
                    var l = dest.raw.split(" ");
                    console.log(l);
                    if(l.length > 1) {
                        for (var j = 0; j < l.length-1; j++) {
                            destination += l[j] + "+"
                        }
                        destination += l[l.length - 1]
                    }else {
                        destination = dest.raw;
                    }
                    console.log(destination)
                }

                if (slug === 'travel-city') {
                   getDestination(res,2)
                }else if(slug === 'city'){
                    getDestination(res,0)
                }else if(slug === 'route'){
                    getDestination(res,1)
                }

                if (slug === 'have-transport-car' || slug === 'have-transport-bike' || slug === 'public-transport' || slug === 'avion' || slug === 'on-foot') {
                    var transp = res.source
                    var k = transp.split(" ")
                    transport = k[k.length - 1]
                    console.log(transport);
                    if (transport === 'voiture') {
                        transport = 'driving'
                    } else if (transport === 'pied') {
                        transport = 'walking'
                    } else if (transport === 'commun') {
                        transport = 'transit'
                    } else if (transport === 'bicyclette') {
                        transport = 'bicycling'
                    }
                }

                if (slug === 'address') {
                    var n = res.source.split(" ");
                    origin = "";
                    for (var i = 0; i < n.length - 1; i++) {
                        origin += n[i] + "+"
                    }
                    origin += n[n.length - 1]
                    console.log(origin);
                    console.log(destination);
                    console.log(transport);
                }

                if (origin && transport && destination) {
                    googleAPI += origin + '&destination=' + destination + '&mode=' + transport + '&key=AIzaSyBVN5wEdR5givti2-eQvSKced2Cm7Z1va8';
                    console.log(googleAPI);

                    fetch(googleAPI)
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (json) {
                            var data = JSON.stringify(json.routes);
                            var leg = JSON.parse(data)
                            var direct = leg[0].legs[0].distance.text;
                            var duration = leg[0].legs[0].duration.text;
                           // var steps = leg[0].legs[0].steps;

                            var mess = "Alors, jusqu\'a " + destination + " c\'est " + direct + " et ca vous prendra " + duration;
                            var link = "Voici un lien pour plus d'informations :) \n"+"https://www.google.com/maps/dir/?api=1&origin=+"+origin+"&destination="+destination+"&travelmode="+transport;
                            replyMessage(senderID, mess);
                            sleep(5000);
                            replyMessage(senderID,link);
                            destination = ""
                            origin = ""
                            transport = ""
                        });
                }

                promise.then(() => {
                    console.log('ok')
                }).catch(err => {
                    console.log(err)
                })
            }
        }).catch(err => {
            console.log(err)
        })
    } else if (messageAttachments) {
        replyMessage(senderID, 'Message with attachment received')
    }
}
module.exports = {
    handleMessage,
}
