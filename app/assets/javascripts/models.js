var ThreadModel = Backbone.Model.extend({
    initialize: function(json, full) {
        json_posts = json.posts;
        json.posts = null;
        Backbone.Model.prototype.set.call(this, json);
        this.full = full;
        var posts = [];
        if (json_posts != undefined) {
            for (var i=0; i < json_posts.length; i++) {
                posts[i] = new PostModel(json_posts[i])
            }
        }
        this.posts = new PostsCollection(posts);
        return this;
    },
});

var PostModel = ThreadModel.extend({
    initialize: function(json) {
        Backbone.Model.prototype.set.call(this, json);
        return this;
    }
});


var ThreadsCollection = Backbone.Collection.extend({
    model: ThreadModel,
});

var PostsCollection = Backbone.Collection.extend({
    model: PostModel,
})