var BottomMenuView = Backbone.View.extend({
    tagName:    'div',
    id:         'bottom_menu',

    events: {
        "click #qr_button": 'callReplyForm',
        'click #up_button': 'goUp',
        'click #down_button': 'goDown',
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
        this.$button = this.$el.find('#qr_button').first();
        this.toggleLamerButtons(settings.get('lamer_buttons'));
    },

    render: function() {
        var t = "<span id='qr_button'>создать тред</span>";
        this.el.innerHTML = t;
        return this;
    },

    callReplyForm: function() {
        if (this.$button.html() == 'закрыть форму') {
            form.hide();
        } else {
            if (this.$button.html() == 'ответить') {
                form.show(undefined, null, 'reply'); 
            } else {
                form.show(undefined, undefined, 'create');
            }
        }
        return this;
    },

    setButtonValue: function(value) {
        if (value == 'previous') {
            this.$button.html(this.previousButtonValue);
        } else {
            if (this.$button.html() != value) {
                this.previousButtonValue = this.$button.html();
            }
            this.$button.html(value);
        }
        return this;
    },

    vanish: function() {
        this.$el.css('display', 'none');
    },

    toggleLamerButtons: function(value) {
        if (value == true) {
            this.el.innerHTML += "<span id='down_button'>вниз</span>"
            + "<span id='up_button'>вверх</span>";
        } else {
            this.$el.find("#down_button, #up_button").remove();
        }
        return false;
    },

    goUp: function() {
        $.scrollTo('0%');
        return false;
    },

    goDown: function() {
        $.scrollTo('100%');
        return false;
    },
})