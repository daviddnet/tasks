"use strict";

;(function($, console, Handlebars) {

    $.binnacleTasks = function(el, options) {
        var _allowInit = false;

        var defaults = {            
            model : [],
            templates : {
                listTemplateID : '#task-list-template',                
                listTemplate : null,
                detailTemplateID : '#task-detail-template',
                detailTemplate : null
            },
            currentUserId : 0,     
            taskModal : {                
                detailContainerID: '#binnacle-task-detail',                
                options : {                
                    keyboard: false
                },    
            },
            permissions : {
                allowAddTasks : true,
                allowEditAllTasks : false    
            },            
            resources : {
                "tasks.x1" : "Data 1",
                "tasks.x2" : "Data 2"
            }           
            
            //onSomeEvent: function() {}
        }

        var plugin = this;
        plugin.settings = {}

        var init = function() {
            plugin.settings = $.extend({}, defaults, options);
            plugin.el = el; 
            var s = plugin.settings;     
            
            // Extracting Handlebars Templates
            var t = s.templates;
            var sourceTaskList   = $(t.listTemplateID).html();
            t.listTemplate = Handlebars.compile(sourceTaskList);
            
            var sourceTaskDetail = $(t.detailTemplateID).html();
            
            t.detailTemplate = Handlebars.compile(sourceTaskDetail);
            
            // validations                  
            if (s.model) {
                _allowInit = true;
            } else {
                console.log("Unable to initialize tasks component");
            }
            
            // Register handleBars Helpers
            registerHandleBarHelpers();            
        }

        plugin.listTasks = function() {
            listTasks();
        }

        plugin.addTask = function() {
            addTask();                     
        }
        
        plugin.editTask = function(taskId) {
            editTask(taskId);         
        }      
        
        plugin.validate = function() {
            //TODO: Validates businessRules
            return true;    
        } 
        

        var listTasks = function() {
            if (_allowInit) {
                var el = plugin.el;
                var s = plugin.settings;
                
                console.log("loading tasks");
                var outputTemplate = s.templates.listTemplate(s.model);
                
                $(el).empty();
                $(el).append(outputTemplate);    
                
                registerTaskListEvents();                
            }            
        }
        
        var addTask = function() {
            if (_allowInit) {            
                console.log("Adding task");   
                showTaskDialog(null);
            }
        }
        
        var editTask = function(taskId) {
            if (_allowInit) {
                console.log("Editing task: " + taskId);   
                showTaskDialog(taskId);
            }            
        }
        
        var showTaskDialog = function(taskId) {
            var s = plugin.settings;
            var t = s.templates;
            var m = s.taskModal;            
            var task = {};
            
            if (taskId) {                
                task = $.grep(s.model, function(e){ return e.taskId == taskId; })[0];
            }
            else {
                // new task
                task = new getDefaultTaskValues;
            }
            
            // getting template
            var outputTemplate = t.detailTemplate(task);
            var detail = $(m.detailContainerID).empty();
            detail.append(outputTemplate);
            registerTaskDetailEvents();      
                        
            // opens up Modal Dialog      
            var formFields = detail.find(".task-detail").first();
            taskDetailModule.init(task, formFields);       
            $(m.detailContainerID).modal(m.options);
        }
        
        var getDefaultTaskValues = function() {
            return {
                taskId : "n",
                taskState : "new",
                taskStatus : "Abierta",
                fullDescription : "",
                miniDescription : "",
                assignedTo : {
                    displayName : "",
                    loginName : ""                        
                },
                dueDate : {
                    displayDate : '',
                    value : '',
                    remainingDays : 0,
                },                    
                body : "",
                justification : ""
            }
        } 
        
        var taskDetailModule = (function() {
            var _taskModel = null; 
            var _formFields = null; 
            
            var init = function(taskModel, formFields) {
                console.log("Initializing task Detail Module");
                _taskModel = taskModel;
                _formFields = formFields
                
                console.log(_taskModel);
                console.log(_formFields);
                
                
            };
            
            var getField = function(fieldName, isContainer) {
                var container = $( "div[data-taskfield=" + fieldName + "]" );
                
                if (isContainer === false) {
                    
                }
                else {
                    return container;
                }
            };
            
            var getFieldValue = function(field) {
                return 0;
            } 
            
            var validate = function() {                
                var isValid = false;
                if (_taskModel) {
                    console.log("validating detail model");
                    isValid = true;
                }
                
                return isValid;
            };
            
            
            return {
                init :  init,
                validate : validate    
            }
        })();
        
        var registerHandleBarHelpers = function(params) {
            // Increment Index
            Handlebars.registerHelper("inc", function(value, options)
            {
                return parseInt(value) + 1;
            });
            
            // Select option
            Handlebars.registerHelper('select', function( value, options ){
                var $el = $('<select />').html( options.fn(this) );
                $el.find('[value="' + value + '"]').attr({'selected':'selected'});
                return $el.html();
            });           
            
        }
        
        var registerTaskListEvents = function() {
            // binding list Events
            $(el).find(".task-add-btn").on("click", function() {
                 addTask();
            });
            
            $(el).find(".task-item").on("click", function() {
                var taskId = $(this).data("taskid");
                editTask(taskId);
            });           
                
        }
        
        var registerTaskDetailEvents = function() {
            var s = plugin.settings;            
            var m = s.taskModal;
            
            // binding list Events
            $(m.detailContainerID).find("#btnSaveTask").on("click", function() {
                if (taskDetailModule.validate()) {
                    console.log("Saving data");    
                } else {
                    console.log("Invalid data");
                }                 
            });
            
            $(m.detailContainerID).find("#btnDeleteTask").on("click", function() {
                 console.log("Deleting data");
            });
            
            // initialize datePicker control
            $(m.detailContainerID).find('.bootstrap-date').datepicker({
                language: "es",
                autoclose: true
            }); 
                
        }

        init();

    }

})(jQuery, console, Handlebars);