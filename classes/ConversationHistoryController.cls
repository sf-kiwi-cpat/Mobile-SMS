global with sharing class ConversationHistoryController {
	
    @AuraEnabled
    public static List<Messaging_Message__c > getContactMessages(String contactId)
    {
        // Gets all conversations related to the passed in Contact.
        List<Messaging_Message__c > messages = [SELECT Name, Sent_By__c , Is_Inbound__c , Message_Content__c , Messaging_Session_Id__c, Sent_Date_Time__c, Has_Attachment__c, Attachment_Content_Id__c 
                                                 from Messaging_Message__c  
                                                 WHERE Contact__c = :contactId 
                                                 	AND Was_Sent__c  = true
                                                 Order by Sent_Date_Time__c ];
        return messages;
    }
    
    @AuraEnabled
    public static Messaging_Message__c getMessage(String messagingMessageId)
    {
        // Push Topics can't send large text fields, so we need to go and get the content for a new message
        List<Messaging_Message__c > messages = [SELECT Name, Sent_By__c , Is_Inbound__c , Message_Content__c , Messaging_Session_Id__c, Sent_Date_Time__c, Has_Attachment__c, Attachment_Content_Id__c 
                                                 from Messaging_Message__c
                                                 WHERE Id = :messagingMessageId];
        return messages[0]; 
    }
    
    @AuraEnabled
    public static Map<String, List<String>> getContactAttachments(String contactId)
    {
        Map<String, List<String>> sessionDocIdMap = new Map<String, List<String>>();
        // Gets all of the ContentDocumentLinks that are related to this contact
        List<ContentDocumentLink> docLinks = [SELECT ContentDocumentId, LinkedEntityId
                                                 from ContentDocumentLink
                                                 WHERE LinkedEntityId in (SELECT ID FROM MessagingSession WHERE EndUserContactId = :contactId)
                                                 Order by LinkedEntityId, SystemModstamp];
        String previousMessagingId = null;
        List<String> docIds = null;
        for (ContentDocumentLink link : docLinks)
        {
            if (link.LinkedEntityId.equals(previousMessagingId))
            {
                // Add to the list of strings (document Ids) that is within the map already
                docIds.add(link.ContentDocumentId);
            }
            else
            {
                // Create a new list (we're onto the next Messaging Session (or the first one)) with the document ID and add it to the map
                previousMessagingId = link.LinkedEntityId;
                docIds = new List<String> {link.ContentDocumentId};
                sessionDocIdMap.put(previousMessagingId, docIds);
            }
            
        }
        return sessionDocIdMap;
    }
    
    @AuraEnabled
    public static List<String> getSessionAttachments(String messagingSessionId)
    {
        // Gets all of the ContentDocumentLinks that are related to this contact
        List<ContentDocumentLink> docLinks = [SELECT ContentDocumentId, LinkedEntityId
                                                 from ContentDocumentLink
                                                 WHERE LinkedEntityId = :messagingSessionId
                                                 Order by LinkedEntityId, SystemModstamp];
        String previousMessagingId = null;
        List<String> docIds = null;
        for (ContentDocumentLink link : docLinks)
        {
            if (link.LinkedEntityId.equals(previousMessagingId))
            {
                // Add to the list of strings (document Ids) that is within the map already
                docIds.add(link.ContentDocumentId);
            }
            else
            {
                // Create a new list (we're onto the next Messaging Session (or the first one)) with the document ID and add it to the map
                previousMessagingId = link.LinkedEntityId;
                docIds = new List<String> {link.ContentDocumentId};
            }
            
        }
        return docIds;
    }
    
    @AuraEnabled
    public static List<ConversationEntry> getContactConversations(String contactId)
    {
        // Gets all conversations related to the passed in Contact.
        // Type text is important - other types are system types like 'AdminOptedIn' or 'BotEscalated'. Text will include all actual messages sent.
        List<ConversationEntry> conversations = [SELECT ActorName, ActorType, EntryTime, Message 
                                                 from ConversationEntry 
                                                 WHERE ConversationID in (SELECT ID FROM MessagingSession where EndUserContactId = :contactId) 
                                                 	AND EntryType = 'Text'
                                                 Order by EntryTime ];
        return conversations;
           
    }
    
    @AuraEnabled
    public static String getContactName(String contactId)
    {
        List<Contact> contacts = [SELECT Name FROM Contact where Id = :contactId];
        if (contacts.size() == 1)
        {
        	return contacts[0].Name;
        }
        
        return null;
    }
    
    @InvocableMethod(label='Get Attachment Information' description='Checks the messaging session for any attachments and returns the details related to any found.')
    public static List<GetAttachmentInfoResult> getAttachmentInformation(List<String> messagingSessionId)
    {
        List<GetAttachmentInfoResult> results = new List<GetAttachmentInfoResult>();
        GetAttachmentInfoResult infoResult = null;
        for (String msId : messagingSessionId)
        {
            List<ContentDocumentLink> links = [SELECT ContentDocumentId from ContentDocumentLink where LinkedEntityId = :msId];
            
            infoResult = new GetAttachmentInfoResult();
            infoResult.numAttachments = links.size();
            infoResult.hasAttachment = infoResult.numAttachments > 0;
            
            results.add(infoResult);
        }
        return results;
    }
    
    global class GetAttachmentInfoResult {
        @InvocableVariable
        global Boolean hasAttachment;

        @InvocableVariable
        global Integer numAttachments;
    }
}