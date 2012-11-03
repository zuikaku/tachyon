var BottomMenuView = Backbone.View.extend({
    tagName:    'div',
    id:         'bottom_menu',

    events: {
        "click #qr_button": 'callReplyForm',
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
        return false;
    }
})