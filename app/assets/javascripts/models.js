var ThreadModel = Backbone.Model.extend({
    initialize: function(json) {
        this.title = json.title;
        this.message = json.message;
    },
    testing: function() {
      alert('tis')
    }
});

var ThreadsCollection = Backbone.Collection.extend({
    model: ThreadModel,
});