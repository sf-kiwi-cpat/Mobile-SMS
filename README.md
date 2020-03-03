# Mobile-SMS
A Salesforce package that enables 1:1 SMS between Salesforce users and their customers, from both the Desktop and Mobile experience

This component is configured to be used on the Contact Record Home page - it will go and retrieve all related objects of type 'Messaging_Message__c' for that contact - this is a new Custom Object that needs to be created for this component to function.

An alternative is to pull in the 'Conversation Entry' objects, which can be found through the 'Messaging Sesssion's that are related to the contact - these changes would need to be made in the Apex Controller (method already exists in the controller for reference). However the 'Conversation Entry' object doesn't contain who sent the outbound messages, when they are sent by a flow or process builder.

See this Quip doc for more information on the related setup steps required for this implementation:
https://salesforce.quip.com/UBGzArPASqil
