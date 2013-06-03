var server = require("socket.io").listen(6969);

// The following global variables are where information is stored (in memory)

var userPasswords;      // A user=>password dictionary
var userSockets = {};        // A user=>socket dictionary
var userContactLists;   // A user=>List of strings dictionary
var userConversations;  // A <user, dictionary<contact, list<messages>>> dictionary

// Since our XMPP dependency is FUBAR, we will mock some content on the global variables

// Note that in a deployed version of this server, passwords would NEVER
// be exposed like this, this is for simulation purposes.
userPasswords = {
                    "ruxeom": "fofo",
                    "danmazter": "profe",
                    "esumike": "mike",
                    "chrisctx": "yo"};

userContactLists = {
                    "ruxeom": ["danmazter", "esumike", "chrisctx"],
                    "danmazter": ["ruxeom", "esumike", "chrisctx"],
                    "esumike": ["ruxeom", "danmazter", "chrisctx"],
                    "chrisctx": ["ruxeom", "danmazter", "esumike"]

};

userConversations = {
                        "ruxeom": { "danmazter": ["Que onda fofo, ya viste tu calificacion?", "Deberias verla"],
                                    "esumike": ["HUEHUEHUEHUEHUE", "Mordekaiser es #1", "es never dies", "Hue"],
                                    "chrisctx": ["Dude, ya terminaste lo de TSD?"]
                        },
                        "danmazter": { "ruxeom": ["Si profe, ya la vi"],
                                       "esumike": ["Buenos dias", "querido profesor"],
                                       "chrisctx": ["Este proyecto es de 100 de calificacion verdad? Kappa"]
                        },
                        "esumike": { "ruxeom": ["Mike noob", "no farm"],
                                     "danmazter": ["..."],
                                     "chrisctx": ["mike pls", "this", "is", "spam", "spam"]
                        },
                        "chrisctx": {   "ruxeom": ["No aun no", "Wey, esta hermoso tu proyecto", "me da envidia"],
                                        "danmazter": ["Por supuesto", "tienes 100%"],
                                        "esumike": ["this kid", "kreygasm"]
                        }
                    };
// End of mock conversations

server.sockets.on("connection", function(userSocket)
{
    // Events that the server has to handle:
    // MessageFromClient, LogIn

    // Events that the server can emit to clients:
    // MessageFromServer, LoginResponse

    userSocket.on("LogIn", function(login_request)
    {
        var name = login_request.username;
        // If the user is already registered in the server
        if (name in userPasswords)
        {
            // and the password is correct
            if (login_request.password == userPasswords[name])
            {
                // We update his socket (in case he is re-logging)
                userSockets[name] = userSocket;

                // We auth him and send him his contacts and messages
                var response = {auth: true,
                                user_name: name,
                                contacts: userContactLists[name],
                                chats: userConversations[name]};

                userSockets[name].emit("LoginResponse", response);

            }

            // if the password is incorrect
            else
            {
                // We send him a negative response.
                var negative_response = {   auth: false,
                                            user_name: null,
                                            contacts: null,
                                            chats: null};

                userSocket.emit("LoginResponse", negative_response);
            }
        }
        // If the user has not registered before
        else
        {
            // We simply add him to the user variables
            userSockets[name] = userSocket.id;
            userPasswords[name] = login_request.password;

            // Contacts and Conversations would be empty
            // this can only be populated with contacts from the XMPP servers
            userContactLists[name] = [];
            userConversations[name] = {};

            // And we confirm that he can proceed
            var new_response = {auth: true,
                                user_name: name,
                                contacts: userContactLists[name],
                                chats: userConversations[name]};

            userSockets[name].emit("LoginResponse", new_response);
        }
    });

    userSocket.on("MessageFromClient", function(user_message)
    {
        var from = user_message.from;
        var to = user_message.to;

        // While normally we would sanitize the text here
        // we will leave that to jQuery's text() and val() functions
        // since they already has a very robust implementations
        // that we can't really match given our time-line.
        var text = user_message.text;

        // We append it to the conversation
        userConversations[to][from].push(text);

        // And if the destination is connected, we push the update
        if (to in userSockets)
        {
            userSockets[to].emit("MessageFromServer", userConversations[to]);
        }
    });

});