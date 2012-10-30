var FormView = Backbone.View.extend({
    tagName:    'form',
    id:         'qr_form',
    inThread:   0,
    attributes: {
        method:     'post',
        enctype:    'multipart/form-data',
        action:     '/create'
    },

    events:     {
        "click #file_span":     "toggleFileOrVideo",
        "click #video_span":    "toggleFileOrVideo",
        'submit':               'ajaxSubmit',
        'click .editbox b, i, u, s, span, a': 'markup',
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    ajaxSubmit: function(event) {
        event.preventDefault();
        this.toggleLoading('on');
        var data = new FormData();
        data.append('message[message]',  this.$el.find('textarea').first().val());
        data.append('message[title]',    this.$el.find('#form_title').first().val());
        data.append('message[password]', this.$el.find('#form_password').first().val());
        data.append('file',              this.$el.find('#file_field')[0].files[0]);
        data.append('video',             this.$el.find('#video_field').first().val());
        if (this.$el.find('#form_tags').first().css('display') == 'inline-block') {
            data.append('tags', this.$el.find('#form_tags').first().val());
        } else {
            var sage = this.$el.find('#sage input').first().attr('checked') == 'checked';
            data.append('message[sage]', sage);
        }
        if ($("#thread_container").length == 0) {
            data.append('returnpost', 'yeah sure');
        }
        var errors = form.$el.find('.errors').first();
        errors.html('');
        $.ajax({
            url: this.$el.attr('action'),
            data: data,
            type: 'post',
            cache: false,
            processData: false,
            contentType: false,
            success: function(response) {
                form.toggleLoading('off');
                if (response.status == 'success') {
                    form.clear().hide();
                    if (response.post != undefined) {
                        router.addPost(response.post, true);
                    } else if (response.thread_rid != undefined) {
                        router.navigate('/thread/' + response.thread_rid, {trigger: true});
                    }
                } else {
                    for (i=0; i < response.errors.length; i++) {
                        errors.append(response.errors[i]);
                        if (i != response.errors.length-1) {
                            errors.append('<br />');
                        }
                    }
                }
                return false;
            }, 
            error: function() {
                form.toggleLoading();
                errors.html('Неизвестная ошибка. Проверьте соединение.')
                return false;
            }
        });
        return false;
    },

    clear: function() {
        this.$el.find('#form_title, #video_field, textarea').val('');
        this.$el.find('#file_field')[0].outerHTML = "<input type='file' name='file' id='file_field'>";
        return this;
    },

    toggleLoading: function(trigger) {
        if (trigger == 'off') {
            if (this.loadingTimeout != undefined) {
                clearTimeout(this.loadingTimeout);
                this.loadingTimeout = undefined;
            }
            this.$el.find('input,  textarea').removeAttr('disabled');
            this.$el.find('#form_loading').remove();
            this.$el.find('.divider').css('opacity', 1);
        } else if (trigger == 'on') {
            this.$el.find('input, textarea').attr('disabled', 'disabled');
            var form = this;
            this.loadingTimeout = setTimeout(function() {
                var loading = $("<img src='/assets/ui/loading.gif' id='form_loading' />");
                loading.css('opacity', 0);
                form.$el.append(loading);
                loading.css('opacity', 1);
                form.$el.find('.divider').css('opacity', 0.4);
            }, 500);
        }
        return this;
    },

    show: function(postRid, threadRid, what) {
        bottomMenu.setButtonValue('закрыть форму');
        if (what != 'reply') {
            what = 'create';
        }
        if (threadRid == null) {
            threadRid = this.inThread;
        }
        this.targetOn(what, threadRid);
        var textarea = this.$el.find('textarea').first();
        textarea.focus();
        if (postRid != undefined) {
            if (textarea.val() != '') {
                textarea.val(textarea.val() + '\n');
            }
            textarea.val(textarea.val() + ">>" + postRid + "\n");
        }
        if ($.browser.chrome) {
            this.$el.animate({right: 15}, 400);
        } else {
            this.$el.animate({right: -10}, 400);
        }
        return this;
    },

    hide: function() {
        this.$el.animate({right: -(this.$el.width() + 50)}, 400);
        bottomMenu.setButtonValue('previous');
        return this;
    },

    targetOn: function(what, rid) {
        this.inThread = rid;
        if (what == 'create') {
            this.$el.attr('action', '/create');
            this.$el.find('.disclaimer').first().html('Создать новый тред');
            this.toggleTagsOrSage('tags');
            var menuValue = 'создать тред';
        } else {
            this.$el.attr('action', '/thread/' + rid + '/reply');
            this.$el.find('.disclaimer').first().html('Ответить в тред #' + rid);
            this.toggleTagsOrSage('sage');
            var menuValue = 'ответить';
        }
        if (bottomMenu.$button.html() != 'закрыть форму') {
            bottomMenu.setButtonValue(menuValue);
        }
        return this;
    },

    getPassword: function() {
        return this.$el.find('.password_field').val();
    },

    toggleFileOrVideo: function(e) {
        if ($(e.target).attr('id') == 'file_span') {
            this.$el.find("#file_span").addClass('selected');
            this.$el.find("#video_span").removeClass('selected');
            this.$el.find("#file_field").css('display', 'inline').focus();
            this.$el.find("#video_field").css('display', 'none');
        } else {
            this.$el.find("#video_span").addClass('selected');
            this.$el.find("#file_span").removeClass('selected');
            this.$el.find("#video_field").css('display', 'inline').focus();
            this.$el.find("#file_field").css('display', 'none');
        }
        return this;
    },
    
    toggleTagsOrSage: function(what) {
        if (what == 'sage') {
            this.$el.find('#sage').first().css('display', 'inline-block');
            this.$el.find('#form_tags').first().css('display', 'none');
        } else if (what == 'tags') {
            this.$el.find('#sage').first().css('display', 'none');
            this.$el.find('#form_tags').first().css('display', 'inline-block');
        }
        return this;
    },

    markup: function(event) {
        var clicked = $(event.currentTarget);
        var textarea = this.$el.find('textarea').first();
        var insertMarkup = function(start, end) {
            var initialValue = textarea.val();
            var section = textarea.getSelection();
            var left = initialValue.substring(0, section.start);
            var right = initialValue.substring(section.end, initialValue.length);
            section.text = section.text.replace(/\n/mg, end + '\n' + start);
            textarea.val(left + start + section.text + end + right);
            var caret = section.end + start.length;
            textarea.focus().caret(caret, caret);
            return false;
        }
        if (clicked.is('b')) {
            insertMarkup('**', '**');
        } else if (clicked.is('i')) {
            insertMarkup('*', '*');
        } else if (clicked.is('u')) {
            insertMarkup('__', '__');
        } else if (clicked.is('s')) {
            insertMarkup('_', '_');
        } else if (clicked.is('span')) {
            if (clicked.hasClass('spoiler')) {
                insertMarkup('%%', '%%');
            } else if (clicked.hasClass('quote')) {
                insertMarkup('>', '');
            }
        } else if (clicked.is('a')) {
            alert('hui');
        }
        return false;
    },

    render: function() {
        var t = "<div class='divider errors'></div>";
        t += "<div class='divider disclaimer'>Создать новый тред</div>";
        t += "<div class='divider'>";
            t += "<input type='text' name='message[title]' id='form_title'";
            t += " placeholder='Тема сообщения, максимум 60 символов'>";
            t += "<input type='submit' value='отправить' class='form_submit'>";
        t += "</div><div class='divider'>";
            t += "<div class='editbox'>";
                t += "<b>Bold</b>";
                t += "<i>Italic</i>";
                t += "<u>Underline</u>";
                t += "<s>Strike</s>";
                t += "<span class='quote'>&gt; Quote</span>";
                t += "<span class='spoiler'>Spoiler</span>";
                t += "<a class='link_tag'>Link</a>"
            t += "</div>"
        t += "</div>";
        t += "<div class='divider'><textarea name='message[message]' ";
        t += "placeholder='Текст сообщения, максимум 5000 символов'></textarea></div>";
        t += "<div class='divider mini'>";
            t += "<div class='left'>";
                t += "<span id='file_span' class='selected'>Файл</span>";
                t += "&nbsp;/&nbsp;";
                t += "<span id='video_span'>YouTube</span>";
                t += "<span><input type='file' name='file' id='file_field'></span>";
                t += "<input type='text' name='video' id='video_field'>";
            t += "</div><div class='right'>";
                t += "<label id='sage'>";
                    t += "sage: <input type='checkbox' name='message[sage]'>";
                t += "</label><label id='form_tags'>";
                    t += "тэги: <input type='text' id='tag_field' name='tags'>";
                t += "</label><label>";
                    t += "пароль: <input type='password' id='form_password'";
                    t += " value='huipizda' name='message[password]'>";
                t += "</label>";
            t += "</div>";
        t += "</div>";
        this.el.innerHTML = t;
        return this;
    },
});