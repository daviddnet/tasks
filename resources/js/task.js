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
            restrictions : {
                minimumTasksRequired : 1  
            },
            permissions : {
                allowAddTasks : true,
                allowEditAllTasks : false    
            },            
            resources : {
                "tasks.x1" : "Data 1",
                "tasks.x2" : "Data 2"
            }
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
                console.log("Unable to initialize tasks component.");
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
            var s = plugin.settings;
            var r = s.restrictions;
            var m = s.model;
            
            if (m.length >= r.minimumTasksRequired) {
                return true;
            } else {
                clearMessages();
                addMessage("Debes agregar al menos una tarea",messageType.error);
                return false;
            }
        }
        
        plugin.getLastTaskDueDate = function() {
            var lastDate = null;
            var s = plugin.settings;
            var m = s.model;
            
            //TODO: a este método le faltan pruebas, no está ordenando bien
            if (m && m.length > 0) {
                // sort tasks by dueDate
                var sortedTasks = m.slice();
                sortedTasks.sort(function(a, b) {
                    return parseFloat(utils.getDateAsInt(b.dueDate)) - 
                    parseFloat(utils.getDateAsInt(a.dueDate));        
                });
                
                lastDate = new Date(sortedTasks[0].dueDate);  
                
                //console.dir(sortedTasks); 
            }
            
            return lastDate;
        } 
        
        var messageType = {
            info : "info",
            warning : "warning",
            error : "error"
        }
        
        var addMessage = function(message, type) {
            if (!type) { type = "";}
            
            var output = '<div class="task-message ' + type + '">' + message + '</div>';
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
                
                var getNoDeletedTasks = function() {
                    var output = [];
                    $.each(s.model, function(index, value) {
                        if (value.taskState != "deleted") {
                            output.push(value);
                        }
                    });
                    
                    return output;
                }
                
                console.log("loading tasks");
                var tasks = getNoDeletedTasks();
                var outputTemplate = s.templates.listTemplate(tasks);
                
                $(el).empty();
                $(el).append(outputTemplate);   
                
                clearMessages();
                if (s.model.length == 0) {
                    addMessage("No hay tareas creadas.", messageType.info);
                } 
                
                // is addTask button enabled?
                if (!p.allowAddTasks) {
                    $(el).find(".task-add-btn").addClass("hide");
                    addMessage("No tiene permitido agregar nuevas tareas.", messageType.warning);                
                } 
                
                registerTaskListEvents();                
            }            
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
        
        var deleteTask = function(taskId) {
            var s = plugin.settings;
            
            var task = $.grep(s.model, function(e){  return (e.taskId == taskId) })[0];
            
            if (task && task.taskState === "added") {
                // delete task (filtering list model)
                s.model = $.grep(s.model, function(e){  return (e.taskId != taskId) });
            }
            else {
                // flagged for deletion server side
                task.taskState = "deleted";
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
            taskDetailModule.init(task, formFields, function(type) {
                // finishing event handler
                
                var s = plugin.settings;
                var m = s.taskModal;
                
                console.log("event result");
                //console.log(task);
                
                if (type === "saving") {
                    if (task.taskState === "new") {
                        addTask(task);    
                    }
                    else {
                        listTasks();
                    }
                }
                else if (type === "deleting") {
                    deleteTask(task.taskId);
                    listTasks();
                }
                
                // hides Modal
                $(m.detailContainerID).modal("hide");
            });    
            
            // show Modal   
            $(m.detailContainerID).modal(m.options);
        }
        
        var getDefaultTaskValues = function() {
            return {
                taskId : "",
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
            var _finishingCallBack = null;
            
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
            
            var init = function(taskModel, formFields, finishingCallBack) {
                console.log("Initializing task Detail Module");
                _taskModel = taskModel;
                _formFields = formFields;
                _finishingCallBack = finishingCallBack;
                
                // console.log(_taskModel);
                // console.log(_formFields);
                
                formDomManipulation.init(_taskModel, _formFields, savingActionEvent, deletingActionEvent);
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
                       
                var validated = validate();
                if (validated) {
                    // it's new Task
                    if (_taskModel.taskState === "new" || _taskModel.taskState === "added") {
                        _taskModel.fullDescription = descriptionField.getValue();
                        _taskModel.miniDescription = descriptionField.getText(255);
                        _taskModel.assignedTo.displayName = assignedToField.getValue();
                        _taskModel.assignedTo.loginName = assignedToField.getValue();         
                        _taskModel.dueDate = dueDateField.getValue();     
                        _taskModel.body = bodyField.getValue();
                        
                        if (utils.dateIsExpired(_taskModel.dueDate)) {
                            _taskModel.taskStatus = "Vencida";
                        } else {
                            if (bodyField.isEmpty()) {
                                _taskModel.taskStatus = "Abierta";
                            }
                            else {
                                _taskModel.taskStatus = "En progreso";
                            }              
                        }
                    }    
                    
                    console.log(_taskModel); 
                    
                    if (_finishingCallBack) {
                        _finishingCallBack("saving");    
                    }
                    
                } 
                else {
                    _finishingCallBack("");
                }
            }
            
            var deletingActionEvent = function() {
                console.log("Deleting data");
                
                if (_finishingCallBack) {
                    _finishingCallBack("deleting");    
                }
            }       
            
            
            var formDomManipulation = (function() {
                
                var init = function(taskModel, formFields, saveActionCallBack, deleteActionCallBack) {
                    console.log("Initializing Form");
                    
                    // initialize datePicker control
                    $(formFields).find('.bootstrap-date').datepicker({
                        language: "es",
                        autoclose: true,
                        orientation : "auto top",
                        format: 'dd/mm/yyyy'
                    });
                    
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
                            if (deleteActionCallBack) {
                                deleteActionCallBack();
                                //deleteTask(taskModel.taskId);    
                            }
                            
                            
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
                    init : init,    
                    getField : getField
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
                init :  init
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
            
            Handlebars.registerHelper("getLastTask", function(value, options)
            {
                var lastDate = plugin.getLastTaskDueDate();
                var output = "";
                
                if (lastDate) {
                    var lastDateStr = utils.convertDate(lastDate.toISOString(), false, true);
                    if (utils.dateIsExpired(lastDate.toISOString())) {
                        output = new Handlebars.SafeString("La última tarea finalizaba el <strong>" + lastDateStr + "</strong>");    
                    } else {
                        output = new Handlebars.SafeString("La última tarea finaliza el <strong>" + lastDateStr + "</strong>");
                    }
                    
                    
                }
                  
                 
                return output;
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