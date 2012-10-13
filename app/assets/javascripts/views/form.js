var FormView = Backbone.View.extend({
    tagName:    'form',
    id:         'qr_form',
    attributes: {
        method:     'post',
        multipart:  true,
        action:     '/create'
    },
    el:         '',
    events:     {
        "click #file_span":     "toggleFileOrVideo",
        "click #video_span":    "toggleFileOrVideo",
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    render: function() {
        var t = "<div class='divider errors'></errors>";
        t += "<div class='divider disclaimer'>Создать новый тред</div>";
        t += "<div class='divider'>";
            t += "<input type='text' name='message[title]'' class='form_title'";
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
        t += "placeholder='Текст сообщения, максимум 5000 символов'/></div>";
        t += "<div class='divider mini'>";
            t += "<div class='left'>";
                t += "<span id='file_span' class='selected'>Файл</span>";
                t += "&nbsp;/&nbsp;";
                t += "<span id='video_span'>YouTube</span>";
                t += "<span><input type='file' name='message[file]' class='file_field'></span>";
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
        this.$el.append(t);
        return this;
    },
    show: function() {
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
    toggleTagsOrSage: function() {

    }
});