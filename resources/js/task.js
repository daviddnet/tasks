"use strict";

;(function($, console, Handlebars, utils) {

    $.binnacleTasks = function(el, options) {
        var _allowInit = false;
        var _addedTasks = 0;

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

        plugin.newTask = function() {
            newTask();                     
        }
        
        plugin.editTask = function(taskId) {
            editTask(taskId);         
        }      
        
        plugin.validate = function() {
            //TODO: Validates businessRules
            return true;    
        } 
        
        var addMessage = function(message) {
            var output = '<div class="task-message">' + message + '</div>';
            $(el).find(".task-messages").append(output);    
        }
        
        var clearMessages = function() {
            $(el).find(".task-messages").empty();
        } 
        
        var listTasks = function() {
            if (_allowInit) {
                var el = plugin.el;
                var s = plugin.settings;
                var p = s.permissions;
                
                console.log("loading tasks");
                var tasks = getNoDeletedTasks();
                var outputTemplate = s.templates.listTemplate(tasks);
                
                $(el).empty();
                $(el).append(outputTemplate);   
                
                clearMessages();
                if (s.model.length == 0) {
                    addMessage("No hay tareas creadas.");
                } 
                
                // is addTask button enabled?
                if (!p.allowAddTasks) {
                    $(el).find(".task-add-btn").addClass("hide");
                    addMessage("No tiene permitido agregar nuevas tareas.");                
                } 
                
                registerTaskListEvents();                
            }            
        }
        
        var getNoDeletedTasks = function() {
            var s = plugin.settings;
            var output = [];
            $.each(s.model, function(index, value) {
                if (value.taskState != "deleted") {
                    output.push(value);
                }
            })
            
            return output;
        }
        
        var newTask = function() {
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
        
        var deleteTask = function(taskModel) {
            var s = plugin.settings;
            
            if (taskModel.taskState === "added") {
                // delete
                //s.model
                //taskModel
            }
            else {
                // flagged for deletion server side
                
            }
        }
        
        var addTask = function(taskModel) {
            var el = plugin.el;
            var s = plugin.settings;
            
            if (taskModel && taskModel.taskState === "new") {
                _addedTasks++;
                taskModel.taskId = "a"+ _addedTasks;
                taskModel.taskState = "added";
                
                console.log("adding task");
                s.model.push(taskModel);
                listTasks();    
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
                        
            // opens up Modal Dialog      
            var formFields = detail.find(".task-detail").first();
            taskDetailModule.init(task, formFields, m.detailContainerID);       
            $(m.detailContainerID).modal(m.options);
            $(m.detailContainerID).off("hidden.bs.modal");
            $(m.detailContainerID).on("hidden.bs.modal", function () {
                var s = plugin.settings;
                var m = s.model;
                console.log("closing modal");
                
                var model = taskDetailModule.getModel();
                
                if (model.validated) {
                    var data = model.data;
                    if (data.taskState === "new") {
                        addTask(data);    
                    }
                    else {
                        listTasks();
                        //var existingModel = $.grep(m, function(t){ return t.taskId == data.taskId; });
                        //console.log(existingModel);
                    }
                        
                }
                
                console.log(model);
            });
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
            var _detailContainerID = null;
            
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
            
            var init = function(taskModel, formFields, detailContainerID) {
                console.log("Initializing task Detail Module");
                _taskModel = taskModel;
                _formFields = formFields
                _detailContainerID = detailContainerID;
                
                console.log(_taskModel);
                console.log(_formFields);
                
                formDomManipulation.enableNewMode(_taskModel, _formFields, savingActionEvent);
                // if (_taskModel.taskState === 'new') {
                //     formDomManipulation.enableNewMode(_taskModel, _formFields, savingActionEvent);
                // }
                // else {
                //     formDomManipulation.enableEditMode();
                // }
            };
            
            var closeModal = function() {
                $(_detailContainerID).modal("hide");
            }
            
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
                if (_taskModel.taskState === "new" || _taskModel.taskState === "added") {
                    _taskModel.fullDescription = descriptionField.getValue();
                    _taskModel.miniDescription = descriptionField.getText(255);
                    _taskModel.assignedTo.displayName = assignedToField.getValue();
                    _taskModel.assignedTo.loginName = assignedToField.getValue();         
                    _taskModel.dueDate = dueDateField.getValue();     
                    _taskModel.body = bodyField.getValue();
                    
                    if (bodyField.isEmpty()) {
                        _taskModel.taskStatus = "Abierta";
                    }
                    else {
                        _taskModel.taskStatus = "En progreso";
                    }                    
                    
                }    
                
                console.log(_taskModel); 
                
                closeModal();
            }           
            
            
            var formDomManipulation = (function() {
                var disableEditMode = function() {
                    console.log("Unabling Edit form");
                }
                
                var init = function(formFields) {
                    // initialize datePicker control
                    $(formFields).find('.bootstrap-date').datepicker({
                        language: "es",
                        autoclose: true,
                        orientation : "auto top"
                    }); 
                };
                
                var enableNewMode = function(taskModel, formFields, saveActionCallBack) {
                    console.log("New form mode");
                    
                    init(formFields);
                    
                    var justificationField = getField(formFields, "Justification");
                    var statusField = getField(formFields, "Status");
                    var deleteBtnAction = getAction(formFields, "deleteBtn");
                    var saveBtnAction = getAction(formFields, "saveBtn");
                    
                    if (taskModel.taskState === "new") {
                        justificationField.hide();   
                        statusField.hide();
                        deleteBtnAction.hide();      
                    }                      
                    else if (taskModel.taskState === "added") {
                        justificationField.hide();   
                        statusField.hide();
                    }
                    
                    saveBtnAction.getControl().on('click', function() {
                        if (saveActionCallBack) {
                            saveActionCallBack();    
                        }                        
                    });
                    
                    deleteBtnAction.getControl().on('click', function() {
                        var deleteAction = confirm("¿Estás seguro de querer eliminar esta tarea?");
                        if (deleteAction == true) {
                            
                        } else {
                            
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
                            },
                            isEmpty : function() {
                                var text = fieldControl.text().trim();
                                return (text == "" ? true : false);
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
                                var output = "";
                                var date = fieldControl.datepicker('getDate');
                                if (date) {
                                    output = date.toISOString();
                                }
                                return output;
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
                
                // var enableEditMode = function() {
                //     console.log("Edit form mode");
                // }
                
                return {
                    enableNewMode : enableNewMode,    
                    getField : getField,                
                    disableEditMode : disableEditMode,                    
                    // enableEditMode : enableEditMode
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
            
            var getModel = function() {
                return {
                    "validated" : true,
                    "data" : _taskModel
                }
            }           
            
            return {
                init :  init,                
                getModel : getModel    
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
                if (value) {
                    return utils.convertDate(value, false, true);    
                } else {
                    return "";
                }
                
            });
            
            Handlebars.registerHelper("showDateRemainingDays", function(value, options)
            {
                var today = new Date();
                today.setHours(0,0,0,0);
                var dueDate = new Date(value);
                dueDate.setHours(0,0,0,0);
                                
                var timeDiff = dueDate.getTime() - today.getTime();
                var isNegative = false;
                var text = "Restan";
                
                if (timeDiff < 0) {
                    isNegative = true;
                    timeDiff = Math.abs(timeDiff);                    
                }
                
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                if (isNegative) {
                    text = "Vencido hace"
                };                 
                
                return text + " " + diffDays;
            });
            
             // Select option
            Handlebars.registerHelper('select', function( value, options ){
                var $el = $('<select />').html( options.fn(this) );
                $el.find('[value="' + value + '"]').attr({'selected':'selected'});
                return $el.html();
            });    
            
            Handlebars.registerHelper("unescapeHtml", function(value, options)
            {
                var unescaped = utils.htmlUnescape(value);
                return new Handlebars.SafeString(unescaped);
                
            });
        }
        
        var registerTaskListEvents = function() {
            // binding list Events
            $(el).find(".task-add-btn").on("click", function() {
                 newTask();
            });
            
            $(el).find(".task-item").on("click", function() {
                var taskId = $(this).data("taskid");
                editTask(taskId);
            });      
        }

        init();

    }

})(jQuery, console, Handlebars, binnacle.utils);