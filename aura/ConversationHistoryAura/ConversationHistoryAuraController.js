({
	doInit: function(component, event, helper) {
        helper.doInit(component, event, helper);
        helper.initEventHandler(component, event, helper);
    },
    refresh : function (cmp, event, helper) {
        helper.doInit(cmp, event, helper);
    },
    afterRender : function(component, event, helper){
       	helper.updateScroll(component, event, helper);  
    },
    unsubscribe : function(component, event, helper){
        helper.unsubscribe(component, event, helper)
    }
})