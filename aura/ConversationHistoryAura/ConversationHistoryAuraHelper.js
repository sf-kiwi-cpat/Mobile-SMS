({
    doInit : function (component, event, helper) {
        // Create the action        
        var getMessagesAction = component.get("c.getContactMessages");
        // Add callback behavior for when response is received for retrieving all of the messages
        getMessagesAction.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                // Add all the messages for this contact to the page
                component.set("v.messages", response.getReturnValue());
            }
            else {
                console.log("Failed with state: " + state);
            }
        });
        getMessagesAction.setParams({
            contactId : component.get("v.recordId")
        });
        // Send action off to be executed
        $A.enqueueAction(getMessagesAction);
        
        // Now we need to get all the attachments for the relevant contact
        var getAttachmentsAction = component.get("c.getContactAttachments");
        // Add callback behavior for when response is received for retrieving all of the attachments
        getAttachmentsAction.setCallback(this, function(response) {
            var state = response.getState();
            //console.log("Entered getAttachmentsAction callback: " + state);
            //console.log("Entered getAttachmentsAction response.getReturnValue(): " + JSON.stringify(response.getReturnValue()));
            if (state === "SUCCESS") {
                // Add all the attachments for this contact to the page for future use
                var resultMap = response.getReturnValue();
                var attachments = [];
                for (var key in resultMap)
                {
                    // This will get a comma separated list of all of the content document Ids
                    // that were in the Messaging Session. We need to iterate over this list
                    //console.log("resultMap[key]: " + resultMap[key]);
                    var contentIds = resultMap[key].toString().split(",");
                    for (var entry in contentIds)
                    {
                        //console.log("entry: " + contentIds[entry]);
                        //console.log("contentIds: " + contentIds);
                    	attachments.push({value:contentIds[entry], key:key})
                    }
                }
                component.set("v.attachments", attachments);
                
            }
            else {
                //console.log("Failed with state: " + state);
            }
        });
        getAttachmentsAction.setParams({
            contactId : component.get("v.recordId")
        });
        // Send action off to be executed
        $A.enqueueAction(getAttachmentsAction); 
    },  
    // Called when your custom component is initialized.
    // Registers error handler for the empApi component.
    initEventHandler : function(component, event, helper) {
		//console.log("Entered initEventHandler");
        // Register error listener for the empApi component.
        const empApi = component.find("empApi");
		//empApi.setDebugFlag(true);
        // Error handler function that prints the error to the console.
        const errorHandler = function (message) {
            console.log("Received error ", JSON.stringify(message));
        };
        // Register error listener and pass in the error handler function.
        empApi.onError(errorHandler);

        // This is the name of the event (topic)
        //var channel = "/event/NewMessagingMessage__e";
        var channel = "/topic/MessagingMessageCreated";
        
        // we want everything new
        const replayId = -1;
        
        var getMessageAttachmentsAction = component.get("c.getSessionAttachments");
        // Add callback behavior for when response is received 
        // This is called when a new message comes in to a component that is visible on the screen
        // and that new message has an attachment
        getMessageAttachmentsAction.setCallback(this, function(response) {
            //console.log("getMessageAttachmentsAction response Received: " + response);
            //console.log("getMessageAttachmentsAction response.getReturnValue() : " + response.getReturnValue());
            if (response.getState() === "SUCCESS") {
                // Iterate through the list of attachments returned
                var attachments = component.get("v.attachments");
                // This is the parameter for the call to go and get the attachments
                // We need this to add to the map that ges rendered.
                var msId = component.get("v.newMessagingSessionId");
                var listOfIds = response.getReturnValue();
                for (var key in listOfIds)
                {
                    //console.log("key: " + key);
                    //console.log("listOfIds[key]: " + listOfIds[key]);
                    var contentIds = listOfIds[key].toString().split(",");
                    for (var entry in contentIds)
                    {
                        console.log("entry: " + contentIds[entry]);
                        console.log("contentIds: " + contentIds);
                    	attachments.push({value:contentIds[entry], key:msId})
                    }
                }
                component.set("v.attachments", attachments);
            }
            else {
                //console.log("Failed with state: " + response.getState());
            }
        });
        
        var getMessageAction = component.get("c.getMessage");
        // Add callback behavior for when response is received 
        // This is called by the event handler for the /topic/MessagingMessageCreated events.
        getMessageAction.setCallback(this, function(response) {
            //console.log("response Received: " + response);
            //console.log("response Received: " + JSON.stringify(response));
            if (response.getState() === "SUCCESS") {
                // Add the new message to the page by getting the existing list and adding the new entry to it
                var conversationEntriesArray = component.get("v.messages");
                var message = response.getReturnValue();
                //console.log("message: " + message + "; message.Has_Attachment__c:" + message.Has_Attachment__c);
                if (message.Has_Attachment__c)
                {
                    // Set the ID so we can use it in the callback method
                    //console.log("message.Has_Attachment__c was true ");
                    component.set("v.newMessagingSessionId", message.Messaging_Session_Id__c);
                    //console.log("message.Messaging_Session_Id__c: " + message.Messaging_Session_Id__c);
                    getMessageAttachmentsAction.setParams({
                        messagingSessionId : message.Messaging_Session_Id__c
                    });
                    // Send action off to be executed to get the rest of the messaging information
                    //console.log("Sending off event with Messaging session ID: " + message.Messaging_Session_Id__c);
                    $A.enqueueAction(getMessageAttachmentsAction);      
                }
                conversationEntriesArray.push(message);
                component.set("v.messages", conversationEntriesArray);
                
                try {
                    var scrollVar = component.find("scrollerId");
                    if (scrollVar)
                    {
                        // Now scroll back to the bottom after adding the new item
                        scrollVar.scrollto("bottom");
                    }
                }
                catch (ex)
                {
                    // Do nothing
                }
            }
            else {
                console.log("Failed with state: " + response.getState());
            }
        });
        
        // Callback function to be passed in the subscribe call.
        // After an event from /topic/MessagingMessageCreated is received, this callback runs and adds the new message to the display
        const callback = function (message) {
           // console.log("Message Received: " + message);
            //console.log("Message Received: " + JSON.stringify(message));
            var eventObj = JSON.parse(JSON.stringify(message));
            //console.log("Event Received: " + eventObj);
            //console.log("eventObj.data.sobject.Contact__c: " + eventObj.data.sobject.Contact__c);
            //console.log("v.recordId: " + component.get("v.recordId"));
            var newMessage = eventObj.data.sobject;
            if(component.get("v.recordId") === newMessage.Contact__c) {
                getMessageAction.setParams({
                    messagingMessageId : newMessage.Id
                });
                // Send action off to be executed to get the rest of the messaging information
                //console.log("Sending off event with Messaging Message ID: " + newMessage.Id);
                $A.enqueueAction(getMessageAction);                
            } else {
                //console.log("This event is not for this record");
            }
        };
        
        // Subscribe to the channel and save the returned subscription object.
        empApi.subscribe(channel, replayId, callback).then(function(newSubscription) {
            //console.log("Subscribed to channel " + channel);
            component.set("v.subscription", newSubscription);
        });
    },
    updateScroll : function(component, event) {
        // Scrolls the Conversation History to the bottom
        try {
            var scrollVar = component.find("scrollerId");
            if (scrollVar)
            {
                scrollVar.scrollTo("bottom");
            }
        }
        catch (ex)
        {
            console.log("Error scrolling to bottom");
        }
        
    },
    unsubscribe : function(component,event) {
    	// Get the empApi component.
        var empApi = component.find("empApi");
        // Get the channel name from attribute
        var channel = "/event/NewMessagingMessage__e";
        
        // Callback function to be passed in the unsubscribe call.
        var unsubscribeCallback = function (message) {
            console.log("Unsubscribed from channel " + channel);
        }.bind(this);
        
        // Error handler function that prints the error to the console.
        var errorHandler = function (message) {
            console.log("Received error ", message);
        }.bind(this);
        
        // Object that contains subscription attributes used to
        // unsubscribe.
        if (component.get("v.subscription") && component.get("v.subscription").size() > 0)
        {
        	var subscription = {"id": component.get("v.subscription")["id"],
                            "channel": component.get("v.subscription")["channel"]};
        }
        // Register error listener and pass in the error handler function.
        empApi.onError(function (error) {
            console.log("Received error ", error);
        }.bind(this));
        
        // Unsubscribe from the channel using the sub object.
        empApi.unsubscribe(subscription, unsubscribeCallback);
    },
    forceRefresh : function (component, event, helper) {
        helper.doInit(component, event, helper);
    }
    
})