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
                readOnlyTasks : false,
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
            // if (s.model) {
            //     _allowInit = true;
            // } else {
            //     console.log("Unable to initialize tasks component.");
            // }
            
            _allowInit = true;
            if (!s.model) { s.model = []; }
            
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
            
            //TODO: a este método le faltan pruebas, no está ordenando bien
            var tasks = getTasks();
            if (tasks && tasks.length > 0) {
                // sort tasks by dueDate
                tasks.sort(function(a, b) {
                    return parseFloat(utils.getDateAsInt(b.dueDate)) - 
                    parseFloat(utils.getDateAsInt(a.dueDate));        
                });
                
                lastDate = new Date(tasks[0].dueDate);  
                
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
                
                console.log("loading tasks");
                var tasks = getTasks();
                var outputTemplate = s.templates.listTemplate(tasks);
                
                $(el).empty();
                $(el).append(outputTemplate);   
                
                clearMessages();
                if (!tasks || tasks.length == 0) {
                    addMessage("No hay tareas creadas.", messageType.info);
                } 
                
                // is addTask button enabled?
                if (!p.allowAddTasks) {
                    $(el).find(".task-add-btn").addClass("hide");
                    addMessage("No tiene permitido agregar nuevas tareas.", messageType.warning);                
                }
                
                if(p.readOnlyTasks != null && p.readOnlyTasks === true) {
                    $(el).find(".task-add-btn").addClass("hide");
                    addMessage("Ya no puedes modificar las tareas.", messageType.info);
                } 
                
                registerTaskListEvents();                
            }            
        }
        
        var getTasks = function() {
            var s = plugin.settings;
            
            var output = [];
            $.each(s.model, function(index, value) {
                if (value.taskState != "deleted") {
                    output.push(value);
                }
            });
            
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
            taskDetailModule.init(task, s.permissions, formFields, function(type) {
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
            var _permissions = null;
            var _formFields = null;
            var _finishingCallBack = null;
            var _justificationIsRequired = false;
            
            var fields = {
                'description' : 'Description',
                'assignedTo' : 'AssignedTo',
                'dueDate' : 'DueDate',
                'body' : 'Body',
                "status" : "Status",
                "justification" : "Justification"                                 
            }
            
            var actionControls = {
                "saveBtn" : "saveBtn",
                "deleteBtn" : "deleteBtn",
                "changeDueDateBtn" : "changeDueDateBtn",
                "outDueDateBtn" : "outDueDateBtn"
            }
            
            var init = function(taskModel, permissions, formFields, finishingCallBack) {
                console.log("Initializing task Detail Module");
                _taskModel = taskModel;
                _permissions = permissions;
                _formFields = formFields;
                _finishingCallBack = finishingCallBack;
                _justificationIsRequired = false;
                
                // console.log(_taskModel);
                // console.log(_formFields);
                
                formDomManipulation.init(_taskModel, _formFields, savingActionEvent, deletingActionEvent, 
                    changeDueDateActionEvent, outDueDateActionEvent);
                
                var descriptionField = formDomManipulation.getField(formFields, fields.description);
                var assignedToField = formDomManipulation.getField(formFields, fields.assignedTo);
                var justificationField = formDomManipulation.getField(formFields, fields.justification);
                var statusField = formDomManipulation.getField(formFields, fields.status);
                var bodyField = formDomManipulation.getField(formFields, fields.body);
                var dueDateField = formDomManipulation.getField(formFields, fields.dueDate);
                var deleteBtnAction = formDomManipulation.getAction(formFields, actionControls.deleteBtn);
                var saveBtnAction = formDomManipulation.getAction(formFields, actionControls.saveBtn);
                var changeDueDateBtnAction = formDomManipulation.getAction(formFields, actionControls.changeDueDateBtn);
                var outDueDateBtnAction = formDomManipulation.getAction(formFields, actionControls.outDueDateBtn);
                
                changeDueDateBtnAction.hide();
                outDueDateBtnAction.hide();
                
                if (taskModel.taskState === "new") {
                    justificationField.hide();   
                    statusField.hide();
                    deleteBtnAction.hide();      
                }                      
                else if (taskModel.taskState === "added") {
                    justificationField.hide();   
                    statusField.hide();
                }
                else if (taskModel.taskState === "created" || taskModel.taskState === "modified" ) {
                    var statusOptions = ["Abierta","En progreso", "Cumplida","No cumplida"];
                    var readOnlyMode = function(hideDeleteBtn) {
                        descriptionField.readOnly();
                        assignedToField.readOnly();
                        statusField.readOnly();
                        bodyField.readOnly();
                        saveBtnAction.hide();
                        
                        if (hideDeleteBtn === true) {
                            deleteBtnAction.hide();
                        }
                        
                        statusOptions = [taskModel.taskStatus];
                    };
                    
                    if (!taskModel.justification) {
                        justificationField.hide();    
                    }
                    else {
                        justificationField.setValue(taskModel.justification);
                    }
                    
                    if (_permissions.readOnlyTasks == null || _permissions.readOnlyTasks === false) {
                        dueDateField.readOnly();
                        
                        if (taskModel.taskState === "created") {
                            if (taskModel.taskStatus === "Cumplida" || taskModel.taskStatus === "No cumplida" || taskModel.taskStatus === "Extemporanea") {
                                readOnlyMode();
                            }
                            else if (taskModel.taskStatus === "Vencida") {
                                statusOptions = [taskModel.taskStatus];
                                outDueDateBtnAction.show();
                            }
                        }
                        else if (taskModel.taskState === "modified") {
                            if (taskModel.taskStatus === "Extemporanea") {
                                statusOptions = [taskModel.taskStatus];
                            }
                        }
                        
                        
                        if (taskModel.taskStatus === "Abierta" || taskModel.taskStatus === "En progreso") {
                            changeDueDateBtnAction.show();
                        }
                    } else {
                        readOnlyMode(true);
                    }
                    
                    statusField.setItems(statusOptions, taskModel.taskStatus);
                }
                
            };
            
            var savingActionEvent = function() {
                console.log("Saving data");
                var descriptionField = formDomManipulation.getField(_formFields, fields.description);
                var assignedToField = formDomManipulation.getField(_formFields, fields.assignedTo);
                var dueDateField = formDomManipulation.getField(_formFields, fields.dueDate);
                var bodyField = formDomManipulation.getField(_formFields, fields.body);
                var justificationField = formDomManipulation.getField(_formFields, fields.justification);
                var statusField = formDomManipulation.getField(_formFields, fields.status);
                
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
                    else if(_taskModel.taskState === "created" || _taskModel.taskState === "modified") {
                        _taskModel.fullDescription = descriptionField.getValue();
                        _taskModel.miniDescription = descriptionField.getText(255);
                        _taskModel.assignedTo.displayName = assignedToField.getValue();
                        _taskModel.assignedTo.loginName = assignedToField.getValue();
                        _taskModel.body = bodyField.getValue();
                        _taskModel.taskState = "modified";
                        _taskModel.taskStatus = statusField.getValue();
                        
                        if (_justificationIsRequired) { 
                            _taskModel.dueDate = dueDateField.getValue();
                            _taskModel.justification = justificationField.getValue();
                        }
                        
                        if (_taskModel.taskStatus === "Abierta" || _taskModel.taskStatus === "En progreso") {
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
            
            var changeDueDateActionEvent = function() {
                var justificationField = formDomManipulation.getField(_formFields, fields.justification);
                var dueDateField = formDomManipulation.getField(_formFields, fields.dueDate);
                
                justificationField.show();
                dueDateField.allowEdit();
                _justificationIsRequired = true;
            }      
            
            var outDueDateActionEvent = function() {
                var statusField = formDomManipulation.getField(_formFields, fields.status);
                var justificationField = formDomManipulation.getField(_formFields, fields.justification);
                justificationField.show();
                
                var status = "Extemporanea";
                var statusOptions = [status]; 
                statusField.setItems(statusOptions, status);
                _justificationIsRequired = true;
            }
            
            
            var formDomManipulation = (function() {
                
                var init = function(taskModel, formFields, saveActionCallBack, deleteActionCallBack, changeDueDateCallBack, outDueDateCallBack) {
                    console.log("Initializing Form");
                    
                    var deleteBtnAction = getAction(formFields, "deleteBtn");
                    var saveBtnAction = getAction(formFields, "saveBtn");
                    var changeDueDateBtnAction = getAction(formFields, "changeDueDateBtn");
                    var outDueDateBtnAction = getAction(formFields, "outDueDateBtn");
                
                    // initialize datePicker control
                    $(formFields).find('.bootstrap-date').datepicker({
                        language: "es",
                        autoclose: true,
                        orientation : "auto top",
                        format: 'dd/mm/yyyy'
                    });
                    
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
                    
                    changeDueDateBtnAction.getControl().on('click', function() {
                        if (changeDueDateCallBack) {
                            changeDueDateCallBack();    
                        }                        
                    });
                    
                    outDueDateBtnAction.getControl().on('click', function() {
                        if (outDueDateCallBack) {
                            outDueDateCallBack();    
                        }                        
                    });
                                                             
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
                            show : function() {
                                fieldContainer.removeClass("hide");    
                                fieldControl.focus();                
                            },
                            isEmpty : function() {
                                var text = fieldControl.text().trim();
                                return (text == "" ? true : false);
                            },
                            readOnly : function() {
                                fieldControl.attr("contenteditable", false);
                            },
                            allowEdit : function() {
                                fieldControl.attr("contenteditable", true);
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
                            },
                            show : function() {
                                fieldContainer.removeClass("hide");         
                                fieldControl.focus();
                            },
                            readOnly : function() {
                                fieldControl.attr('readonly', true);
                            },
                            allowEdit : function() {
                                fieldControl.attr('readonly', false);
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
                            },
                            show : function() {
                                fieldContainer.removeClass("hide");     
                                fieldControl.focus();               
                            },
                            readOnly : function() {
                                fieldControl.attr('readonly', true);
                            },
                            allowEdit : function() {
                                fieldControl.attr('readonly', false);
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
                            hide : function() {
                                fieldContainer.addClass("hide");
                            },
                            show : function() {
                                fieldContainer.removeClass("hide");    
                                fieldControl.focus();                
                            },
                            readOnly : function() {
                                fieldControl.attr('readonly', true);
                                fieldControl.prop('disabled', true);
                            },
                            allowEdit : function() {
                                fieldControl.attr('readonly', false);
                                fieldControl.prop('disabled', false);
                            }                            
                        }
                    };     
                    
                    var selectFieldOutput = function(fieldControl) {
                        return {
                            getValue : function() {
                                return fieldControl.val();
                            },
                            setItems : function(items, selectedValue) {
                                $.each(items, function(i, value) {
                                    if (value === selectedValue) {
                                        fieldControl.append($('<option selected>').text(value).attr('value', value));
                                    } else {
                                        fieldControl.append($('<option>').text(value).attr('value', value));    
                                    }
                                });
                            },
                            hide : function(params) {
                                fieldContainer.addClass("hide");
                            },
                            show : function() {
                                fieldControl.removeClass("hide");                    
                            },
                            readOnly : function() {
                                fieldControl.attr('readonly', true);
                            },
                            allowEdit : function() {
                                fieldControl.attr('readonly', false);
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
                            },
                            show : function() {
                                $(fieldControl).removeClass("hide");                    
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
                    
                    if (actionName === "changeDueDateBtn") {
                        fieldControl = $("#btnChangeDueDate");
                        
                        return buttonActionOutput(fieldControl);
                    }
                    
                    if (actionName === "outDueDateBtn") {
                        fieldControl = $("#btnOutDueDate");
                        
                        return buttonActionOutput(fieldControl);
                    }
                  
                }
                
                return {
                    init : init,    
                    getField : getField,
                    getAction : getAction
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