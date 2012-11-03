var HeaderView = Backbone.View.extend({
    tagName:    'header',

    events: {
        'click #settings_link': 'showSettings',
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    setCounters: function(counters) {
        this.$el.find("#posting_info span").html(counters.posts);
        this.$el.find("#posting_info b").html(counters.online);
    },

    showSettings: function(event) {
        event.preventDefault();
        settings.show();
        return false;
    },

    setFixed: function(bool) {
        if (bool == true) {
            this.$el.css('position', 'fixed');
            section.css('top', '0');
        } else {
            this.$el.css('position', 'relative');
            section.css('top', '-' + (this.$el.height()+8) + 'px');
        }
    },

    render: function() {
        var t = "<h3><a href='/'>Freeport 7</a></h3>"
        t += "<div id='posting_info'>за сегодня сообщений: <span>0</span>"
        t += ", онлайн: <b>13</b></div>"
        t += "<menu>"
            t += "<li><a href='#' id='tags_link'>тэги ↓</a></li>"
            t += "<li><a href='#' id='settings_link'>настройки</a></li>"
            t += "<li><a href='/about/'>информация</a></li>"
            t += "<li><a href='/favorites/'>избранное</a></li>"
            t += "<li><a href='/live/'>live!</a></li>"
        t += "</menu>"
        this.$el.append(t);
        if ($.browser.chrome) {
            this.$el.find('menu').first().css('margin-right', '10px');
        }
        return this;
    },
});
