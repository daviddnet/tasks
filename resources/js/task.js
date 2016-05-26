"use strict";

;(function($, console, Handlebars, utils) {

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
                dueDate : "",                    
                body : "",
                justification : ""
            }
        } 
        
        var taskDetailModule = (function() {
            var _taskModel = null; 
            var _formFields = null; 
            
            var fields = {
                'description' : 'Description',
                'assignedTo' : 'AssignedTo',
                'dueDate' : 'DueDate',
                'body' : 'Body'                                 
            }
            
            var actionControls = {
                "saveBtn" : "SaveBtn",
                "deleteBtn" : "DeleteBtn"
            }
            
            var init = function(taskModel, formFields) {
                console.log("Initializing task Detail Module");
                _taskModel = taskModel;
                _formFields = formFields
                
                console.log(_taskModel);
                console.log(_formFields);
                
                if (_taskModel.taskState === 'new') {
                    formDomManipulation.enableNewMode(_taskModel, _formFields, savingActionEvent);
                }
                else {
                    formDomManipulation.enableEditMode();
                }
            };
            
            var savingActionEvent = function() {
                console.log("Saving data");
                var descriptionField = formDomManipulation.getField(_formFields, fields.description);
                var assignedToField = formDomManipulation.getField(_formFields, fields.assignedTo);
                var dueDateField = formDomManipulation.getField(_formFields, fields.dueDate);
                var bodyField = formDomManipulation.getField(_formFields, fields.body);
                
                // console.log(descriptionField.getValue());
                // console.log(assignedToField.getValue());
                // console.log(dueDateField.getValue());
                // console.log(bodyField.getValue());       
                
                // it's new Task
                if (_taskModel.taskState === "new") {
                    _taskModel.fullDescription = descriptionField.getValue();
                    _taskModel.miniDescription = descriptionField.getText(255);
                    _taskModel.assignedTo.displayName = assignedToField.getValue();
                    _taskModel.assignedTo.loginName = assignedToField.getValue();         
                    _taskModel.dueDate = dueDateField.getValue();     
                    _taskModel.taskState = "added";      
                }             
                
                console.log(_taskModel); 
            }           
            
            
            var formDomManipulation = (function() {
                var disableEditMode = function() {
                    console.log("Unabling Edit form");
                }
                
                var init = function(formFields) {
                    // initialize datePicker control
                    $(formFields).find('.bootstrap-date').datepicker({
                        language: "es",
                        autoclose: true
                    }); 
                };
                
                var enableNewMode = function(taskModel, formFields, saveActionCallBack) {
                    console.log("New form mode");
                    
                    init(formFields);
                    
                    var justificationField = getField(formFields, "Justification");
                    var statusField = getField(formFields, "Status");
                    var deleteBtnAction = getAction(formFields, "deleteBtn");
                    var saveBtnAction = getAction(formFields, "saveBtn");
                    
                    justificationField.hide();   
                    statusField.hide();
                    deleteBtnAction.hide();        
                    
                    saveBtnAction.getControl().on('click', function() {
                        if (saveActionCallBack) {
                            saveActionCallBack();    
                        }                        
                    });                   
                    
                    // var statusValues = [{key : "k1", value : "0"}];
                    // var statusField = formFields.find("div[data-taskfield='Status'] select");
                    // $.each(statusValues, function(key, value) {   
                    //     $(statusField)
                    //         .append($("<option></option>")
                    //                     .attr("value",key)
                    //                     .text(value)); 
                    // });                                                
                }             
                
                var getField = function(formFields, fieldName) {
                    var fieldContainer = formFields.find("div[data-taskfield='" + fieldName + "']");
                    var fieldControl = null;     
                    
                    var richTextFieldOutput = function(fieldControl) {
                        return {                            
                            getValue : function() {
                                return utils.htmlEscape(fieldControl.html());
                            },
                            getText : function(maxLength) {
                                var text = fieldControl.text();
                                
                                if (maxLength && text.length > maxLength) {
                                    text = text.substring(0, maxLength);
                                }
                                
                                return text;                                
                            },
                            setValue : function(val) {
                                fieldControl.html(val);
                            },
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            }                            
                        }
                    }; 
                    
                    var peopleFieldOutput = function(fieldControl) {
                        return {                            
                            getValue : function() {
                                return fieldControl.val();
                            },
                            setValue : function(val) {
                                fieldControl.val(val);
                            },
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            }                            
                        }
                    };  
                    
                    var textFieldOutput = function(fieldControl) {
                        return {                            
                            getValue : function() {
                                return fieldControl.val();
                            },
                            setValue : function(val) {
                                fieldControl.val(val);
                            },
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            }                            
                        }
                    };   
                    
                    var dateFieldOutput = function(fieldControl) {
                        return {                            
                            getValue : function() {
                                return fieldControl.datepicker('getDate').toISOString();
                            },
                            setValue : function(val) {
                                fieldControl.datepicker('setDate', val);
                            },
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            }                            
                        }
                    };     
                    
                    var selectFieldOutput = function(fieldControl) {
                        return {
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            }                            
                        }
                    }   
                    
                    
                    
                    if (fieldName === "Description") {
                        fieldControl = fieldContainer.find('.custom-editable');
                        
                        return richTextFieldOutput(fieldControl); 
                    }    
                    if (fieldName === "AssignedTo") {
                        fieldControl = fieldContainer.find('input[type="text"]');
                        
                        return peopleFieldOutput(fieldControl);
                    }
                    
                    if (fieldName === "Status") {
                        fieldControl = fieldContainer.find('select');
                        
                        return selectFieldOutput(fieldControl);
                    }
                    
                    if (fieldName === "DueDate") {
                        fieldControl = fieldContainer.find('input[type="text"]');
                        
                        return dateFieldOutput(fieldControl);
                    }
                    
                    if (fieldName === "Body") {
                        fieldControl = fieldContainer.find('.custom-editable');
                        
                        return richTextFieldOutput(fieldControl); 
                    } 
                    
                    if (fieldName === "Justification") {
                        fieldControl = fieldContainer.find('.custom-editable');
                        
                        return richTextFieldOutput(fieldControl); 
                    }                                      
                } 
                
                var getAction = function(formFields, actionName) {
                    var fieldControl = null;
                    
                    var buttonActionOutput = function(fieldControl) {
                        return {
                            getControl : function () {
                                return fieldControl;
                            },
                            hide : function() {
                                $(fieldControl).addClass("hide");                    
                            }
                        } 
                    } 
                    
                    if (actionName === "deleteBtn") {
                        fieldControl = $("#btnDeleteTask");
                        
                        return buttonActionOutput(fieldControl);
                    }
                    
                    if (actionName === "saveBtn") {
                        fieldControl = $("#btnSaveTask");
                        
                        return buttonActionOutput(fieldControl);
                    } 
                }  
                
                var enableEditMode = function() {
                    console.log("Edit form mode");
                }
                
                return {
                    enableNewMode : enableNewMode,    
                    getField : getField,                
                    disableEditMode : disableEditMode,                    
                    enableEditMode : enableEditMode
                }
            })();
            
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
            
            Handlebars.registerHelper("showDate", function(value, options)
            {
                return utils.convertDate(value, false, true);
            });
            
            Handlebars.registerHelper("showDateRemainingDays", function(value, options)
            {
                return 30;
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
            // $(m.detailContainerID).find("#btnSaveTask").on("click", function() {
            //     if (taskDetailModule.validate()) {
            //         console.log("Saving data");    
            //     } else {
            //         console.log("Invalid data");
            //     }                 
            // });
            
            // $(m.detailContainerID).find("#btnDeleteTask").on("click", function() {
            //      console.log("Deleting data");
            // });
            
            // initialize datePicker control
            // $(m.detailContainerID).find('.bootstrap-date').datepicker({
            //     language: "es",
            //     autoclose: true
            // }); 
                
        }

        init();

    }

})(jQuery, console, Handlebars, binnacle.utils);