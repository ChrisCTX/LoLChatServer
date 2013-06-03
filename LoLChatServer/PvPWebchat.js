var server = require("socket.io").listen(6969);

// The following global variables are where information is stored (in memory)


var userPasswords;      // A user=>password dictionary
var userSockets;        // A user=>socket dictionary
var userContactLists;   // A user=>List of strings dictionary
var userConversations;  // A <user, dictionary<contact, list<messages>>> dictionary

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
                userSockets[name] = userSocket.id;

                // We auth him and send him his contacts and messages
                var response = {auth: true,
                                user_name: name,
                                contacts: userContactLists[name],
                                chats: userConversations[name]};

            }
        }
    });

    userSocket.on("MessageFromClient", function(user_message)
    {

    });

});