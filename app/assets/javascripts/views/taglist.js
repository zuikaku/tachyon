var TagListView = Backbone.View.extend({
    tagName:    'div',
    id:         'taglist',
    el:         '',

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },

    render: function() {
        var t = "<a href='/~/' id ='overview_tag'>/~/ Обзор</a><table>"
        $.ajax({
            type: 'post',
            url: '/utility/get_tags',
            async: false,
            success: function(response) {
                var tags_array = JSON.parse(response.tags);
                var rows = parseInt(tags_array.length/2) + 1;
                for (var i = 0; i < rows; i++) {
                    t += "<tr>";
                    $.each([tags_array[0], tags_array[1]], function(index, test_tag) {
                        t += "<td>";
                        if (test_tag != undefined) {
                            tag = tags_array.pop();
                            link = tag.alias + "/";
                            t += "<a id='" + tag.alias + "' href='/" + link + "'>/";
                            t += link + " " + tag.name + "</a>";
                        }
                        t += "</td>";
                    })
                    t += "</tr>";
                }
                t += "</table>";
                return false;
            },
        });
        this.$el.append(t);
        return this;
    },

    adjust: function(offset) {
        this.$el.css('left', offset - this.$el.width()/2);
        this.$el.css('top', -(this.$el.height() + 50));
        return this;
    },
});


