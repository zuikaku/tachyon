var FormView = Backbone.View.extend({
    tagName:    'form',
    id:         'qr_form',
    attributes: {
        method:     'post',
        multipart:  true,
        action:     '/create'
    },

    events:     {
        "click #file_span":     "toggleFileOrVideo",
        "click #video_span":    "toggleFileOrVideo",
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    render: function() {
        var t = "<div class='divider errors'></div>";
        t += "<div class='divider disclaimer'>Создать новый тред</div>";
        t += "<div class='divider'>";
            t += "<input type='text' name='message[title]' class='form_title'";
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
                t += "<span><input type='file' name='file' class='file_field'></span>";
                t += "<input type='text' name='video' class='video_field'>";
            t += "</div><div class='right'>";
                t += "<label id='sage'>";
                    t += "sage: <input type='checkbox' name='message[sage]'>";
                t += "</label><label id='form_tags'>";
                    t += "тэги: <input type='text' id='tag_field' name='tags'>";
                t += "</label><label>";
                    t += "пароль: <input type='password' class='password_field'";
                    t += " value='huipizda'>";
                t += "</label>";
            t += "</div>";
        t += "</div>";
        this.el.innerHTML = t;
        return this;
    },

    show: function(postRid, threadRid, what) {
        if (what == 'reply') {
            var action = '/' + threadRid + '/reply';
            var disclaimer = 'Ответить в тред #' + threadRid;
            this.toggleTagsOrSage('sage');
        } else {
            var action = '/create';
            this.toggleTagsOrSage('tags');
            var disclaimer = 'Создать новый тред';
        }
        this.$el.find('.disclaimer').first().html(disclaimer);
        this.$el.attr('action', action);
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
        return this;
    },

    getPassword: function() {
        return this.$el.find('.password_field').val();
    },

    toggleFileOrVideo: function(e) {
        if ($(e.target).attr('id') == 'file_span') {
            this.$el.find("#file_span").addClass('selected');
            this.$el.find("#video_span").removeClass('selected');
            this.$el.find(".file_field").css('display', 'inline').focus();
            this.$el.find(".video_field").css('display', 'none');
        } else {
            this.$el.find("#video_span").addClass('selected');
            this.$el.find("#file_span").removeClass('selected');
            this.$el.find(".video_field").css('display', 'inline').focus();
            this.$el.find(".file_field").css('display', 'none');
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
    }
});