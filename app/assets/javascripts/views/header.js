var HeaderView = Backbone.View.extend({
    tagName:    'header',
    el:         '',

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    render: function() {
        var t = "<h3><a href='/'>Freeport 7</a></h3>"
        t += "<div id='posting_info'>за сегодня сообщений: <span>0</span>"
        t += ", онлайн: <b>13</b></div>"
        t += "<menu>"
            t += "<li><a href='#' id='tags_link'>тэги ↓</a></li>"
            t += "<li><a href='/settings/'>настройки</a></li>"
            t += "<li><a href='/about/'>информация</a></li>"
            t += "<li><a href='/favorites/'>избранное</a></li>"
            t += "<li><a href='/live/'>live!</a></li>"
        t += "</menu>"
        this.$el.append(t);
        return this;
    },

    setCounters: function(counters) {
        this.$el.find("#posting_info span").html(counters.posts);
        this.$el.find("#posting_info b").html(counters.online);
    },
});
