var PreviewsView = Backbone.View.extend({
    tagName:    'div',
    id:         'previews',
    current:    null,

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
        this.cache = new PostsCollection;
    },

    showPreview: function(event, fromPostId) {
        var link = $(event.currentTarget);
        var father = link.parent();
        if (father.is('blockquote') || father.hasClass('replies_rids') 
            || link.hasClass('context_link')) {
            this.current = link;
        } else {
            return false;
        }
        var offset = function(element, xy) {
            var c = 0;
            while (element) {
                c += element[xy];
                element = element.offsetParent;
            }
            return c;
        }
        link = link.find('a')[0];
        var postRid = link.hash.match(/\d+/);
        var screenWidth = document.body.clientWidth;
        var screenHeight = window.innerHeight;
        var previewX = offset(link, 'offsetLeft') + link.offsetWidth / 2;
        var previewY = offset(link, 'offsetTop');
        if (event.clientY < (screenHeight * 0.75)) {
            previewY += link.offsetHeight;
        }
        var preview = new Preview;
        var style = 'position:absolute; z-index:300;';
        if (previewX < screenWidth / 2) {
            style += 'left:' + previewX + 'px; ';
        } else {
            style += 'right:' + parseInt(screenWidth - previewX + 2)  + 'px; ';
        }
        if (event.clientY < screenHeight * 0.75) {
            style += 'top:' + previewY + 'px; ';
        } else {
            style += 'bottom:' + parseInt(screenHeight - previewY - 4) + 'px; '
        }
        preview.$el.attr('style', style);
        preview.postRid = fromPostId;
        this.$el.append(preview.$el);
        var leftSibling = preview.$el.prev();
        if (leftSibling.html() != undefined) {
            if (leftSibling.data('view').postRid == fromPostId) {
                this.removePreview(leftSibling);
            }
        }
        preview.timeout = setTimeout(function() {
            previews.getPost(postRid, preview);
        }, 500);
        return false;
    },


    previewLinkOut: function(event) {
        var link = $(event.currentTarget);
        var father = link.parentsUntil('.thread, .post_container').last().parent().parent();
        if (father.hasClass('preview')) {
            previews.current = father;
            setTimeout(function() {
                previews.removePreview(father, true)
            }, 300);
        } else {
            previews.current = null;
            setTimeout(function() {
                if (previews.current == null) {
                    previews.removePreview('all');
                }
            }, 300);
        }
        return false;
    },

    previewOver: function(event) {
        previews.current = $(event.currentTarget);
        return false;
    },

    previewOut: function(event) {
        previews.current = null;
        setTimeout(function() {
            if (previews.current == null) {
                previews.removePreview('all');
            } else {
                previews.removePreview(previews.current, true);
            }
            return false;
        }, 300);
        return false;
    },

    getPost: function(postRid, preview) {
        postRid = parseInt(postRid);
        var post = null;
        threadsCollection.each(function(thread) {
            if (post != null) {
                return true;
            }
            post = previews.cache.where({rid: postRid});
            if (post.length > 0) {
                post = post[0].clone();
            } else {
                post = thread.posts.where({rid: postRid});
                if (post.length > 0) {
                    post = post[0].clone();
                } else {
                    post = null;
                }
            }
        });
        if (post != null) {
            this.showPost(post, preview);
        } else {
            $.ajax({
                url: '/utility/get_post',
                type: 'post',
                async: true,
                data: {rid: postRid},
                success: function(response) {
                    if (response.post == null) {
                        preview.notFound();
                    } else {
                        post = new PostModel(response.post);
                        if (previews.cache.where({rid: post.get('rid')}).length == 0) {
                            previews.cache.add(post);
                        }
                        if (previews.cache.size() > 10)  {
                            var deleting = previews.cache.last();
                            previews.cache.remove(deleting);
                            delete deleting.preview;
                            delete deleting.view;
                            delete deleting;
                        }
                        previews.showPost(post, preview);
                    }
                },
                error: function(response) {
                    preview.error();
                    return false;
                }
            });
        } 
        return false;
    },

    showPost: function(post, preview) {
        post.view = new PostView({id: 'i' + post.get('rid')}, post);
        var element = post.view.render().$el;
        post.preview = preview;
        preview.render(element);
        preview.$el.css('opacity', 0)
        preview.$el.animate({opacity: 1}, 400);
        return false;
    },

    removePreview: function(preview, rightSiblings) {
        if (preview == 'all') {
            $.each($('#previews .preview'), function(index, preview) {
                previews.removePreview($(preview));
            });
        } else {
            if (rightSiblings == true) {
                var procceed = true;
                if (previews.current != null) {
                    if (!previews.current.hasClass('preview')) {
                        return false;
                    }
                } else {
                    return false;
                }
                while (procceed == true) {
                    var sibling = previews.current.next();
                    if (sibling.html() != undefined) {
                        previews.removePreview(sibling);
                    } else {
                        procceed = false;
                    }
                }
            } else {
                clearTimeout(preview.timeout);
                delete preview.data('view');
                preview.remove();
            }
        }
        return false;
    },
});


var Preview = Backbone.View.extend({
    tagName:    'div',
    className:  'preview',
    timeout:    null,

    events: {
        "mouseenter": "over",
        "mouseleave": "out",
    },

    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
        return this;
    },

    render: function(element) {
        if (element == undefined) {
            this.el.innerHTML = "<p>Загружаем...</p>";
        } else {
            this.$el.html(element);
        }
        this.$el.data('view', this);
        return this;
    },

    over: function(event) {
        return previews.previewOver(event);
    },

    out: function(event) {
        return previews.previewOut(event);
    },

    notFound: function() {
        this.$el.html("<p>Пост не найден. Наверное, его удалили.</p>");
        return this;
    },

    error: function() {
        this.$el.html("<p>Ошибка</p>");
        return this;
    }
});