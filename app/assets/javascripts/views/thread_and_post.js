var ThreadView = Backbone.View.extend({
    tagName:    'div',
    className:  'thread',
    tagsHidden:  [],
    ridHidden:   false,
    hidden:      false,

    events:     {
        "mouseenter .file_container":       "showFileSearch",
        "mouseleave  .file_container":      "hideFileSearch",
        "click .post_header .post_link":    "callReplyForm",
        "click .pic_url":                   "showPicture",
        "click .omitted a":                 "expand",
        "click .fav_button":                "toggleFavorite",
        "click .hide_button":               "toggleHiding",
        "click .video_url":                 "showVideo",
        "mouseenter blockquote .post_link, .replies_rids .post_link, .proofmark, .context_link": 'showPreview',
        "mouseleave blockquote .post_link, .replies_rids .post_link, .proofmark, .context_link":  'previewLinkOut',
    },

    initialize: function(attributes, model, full) {
        this.model = model;
        this.full = full;
        return this;
    },

    showPreview: function(event) {
        return previews.showPreview(event, this.model.get('rid'));
    },

    previewLinkOut: function(event) {
        return previews.previewLinkOut(event);
    },

    showPicture: function(event) {
        var file = this.model.get('file');
        if (file == null) {
            return true;
        }
        if (file.thumb_columns == null) {
            return true;
        } else {
            if (event != undefined) {
                event.preventDefault();
            }
            var img = this.$el.find(".file_container img").first();
            if (img.attr('src') == file.url_small) {
                // img.attr('width', file.columns);
                // img.attr('height', file.rows);
                img.removeAttr('width').removeAttr('height');
                img.attr('src', file.url_full);
                var px = (document.body.clientWidth - 100) + "px";
                img.css('max-width', px);
            } else {
                img.attr('width', file.thumb_columns);
                img.attr('height', file.thumb_rows);
                img.attr('src', file.url_small);
            }
            return false;
        }
    },

    showAllPictures: function() {
        this.showPicture();
        this.model.posts.each(function(post) {
            post.view.showPicture();
        });
        return false;
    },

    toggleFavorite: function(event) {
        event.preventDefault();
        var rid = this.model.get('rid');
        var link = $(event.currentTarget);
        if (settings.isFavorite(rid) == false) {
            if (settings.toggleFavorite(rid, 'add') == true) {
                link.find('img').attr('src', '/assets/ui/star_full.png');
                link.attr('title', 'Убрать из избранного');
            }
        } else {
            settings.toggleFavorite(rid, 'remove');
            link.find('img').attr('src', '/assets/ui/star_empty.png');
            link.attr('title', 'Добавить в избранное');
        }
        return false;
    },

    toggleHiding: function(event) {
        event.preventDefault();
        var rid = this.model.get('rid');
        var container = this.$el.parent();
        if (settings.isHidden(rid) == false)  {
            settings.hide(rid);
            this.el.innerHTML = this.renderHidden();
            container.find('.post_container').remove();
        } else {
            settings.unhide(rid);
            this.render();
            this.model.posts.each(function(post) {
                post.view = new PostView({id: 'i' + post.get('rid')}, post);
                container.append(post.view.render().el);
            });
        }
        return false;
    },

    scrollTo: function() {
        $.scrollTo(this.$el, 200, {offset: {top: -200}});
        return this;   
    },

    showVideo: function(event) {
        event.preventDefault();
        var url = "https://www.youtube.com/v/" + this.model.get('file').filename + 
        "?version=3&autoplay=1";
        var t = "<object width='320' height='240' class='video'>"
        + "<param name='movie' value='" + url + "'>"
        + "</param><param name='allowScriptAccess' value='always'></param>"
        + "<embed src='" + url + "' type='application/x-shockwave-flash' "
        + "allowscriptaccess='always' width='320' height='240'></embed></object>";
        $(event.currentTarget).replaceWith($(t));
        return false;
    },

    callReplyForm: function(event) {
        event.preventDefault();
        var parentID = this.model.get('thread_rid');
        if (parentID == undefined) {
            parentID = this.model.get('rid');
        }
        form.show(this.model.get('rid'), parentID, 'reply');
        return false;
    },

    showFileSearch: function(event) {
        var video = (this.model.get('file').extension == 'video');
        if (video == true) {
            $(event.currentTarget).find('.play_button').css('opacity', 1);
        } else if (video == false && settings.get('search_buttons') == true) {
            var t = "<span class='file_search'>";
            var url = "http://freeport7.org" + this.model.get('file').url_full;
            t += "Поиск: <a href='http://iqdb.org/?url=" + url
            + "' target='_blank'>IQDB</a>";
            t += "</span>";
            $(event.currentTarget).append(t);
        }
        return false;
    },

    hideFileSearch: function(event) {
        if (settings.get('search_buttons') == true) {
            $('.file_search').remove();
        }
        $('.play_button').css('opacity', 0.7);
        return false;
    },

    renderDateTime: function(datetime) {
        datetime = datetime.split("T");
        var date = datetime[0].split('-');
        var today = new Date();
        if (date[2][0] == '0') {
            date[2] = date[2][1];
        }
        if (date[1][0] == '0') {
            date[1] = date[1][1];
        }
        date[0] = parseInt(date[0]);
        date[1] = parseInt(date[1]);
        date[2] = parseInt(date[2]);
        if (today.getDate() == date[2] && today.getMonth() == date[1]-1 
            && today.getFullYear() == date[0]) {
            var t = 'сегодня в ';
        } else if (today.getDate()-1 == date[2] && today.getMonth() == date[1]-1
            && today.getFullYear() == date[0]) {
            var t = 'вчера в ';
        } else {
            var t = date[2] + ' ';
            var monthNames = [  "января",   "февраля",  "марта",
                                "апреля",   "мая",      "июня",
                                "июля",     "августа",  "сентября",
                                "октября",  "ноября",   "декабря"  ]
            t += monthNames[date[1]-1] + ' ';
            t += date[0] + ' г. в ';
        }
        t += datetime[1].substring(0, 8);
        return t;
    },

    expand: function(event) {
        event.preventDefault();
        var thread = this;
        var container = thread.$el.parent();
        if (event.currentTarget.innerHTML == 'свернуть тред') {
            for (var i=0; i < thread.posts.length; i++) {
                if (i < thread.posts.length - 6) {
                    thread.posts.at(i).view.$el.remove();
                    delete thread.posts.at(i).view;
                    delete thread.posts.at(i);
                }
            }
            event.currentTarget.innerHTML = thread.verboseOmitted(thread.posts.length - 6);
            event.currentTarget.innerHTML += ' спустя:';
        } else {
            event.currentTarget.innerHTML = 'загружаем...';
            $.ajax({
                type: 'post',
                url: '/thread/' + this.model.get('rid') + '/expand',
                success: function(response) {
                    delete thread.posts;
                    container.find('.post_container').remove();
                    thread.posts = new PostsCollection;
                    event.currentTarget.innerHTML = 'свернуть тред';
                    for (var i=0; i < response.posts.length; i++) {
                        var post = new PostModel(response.posts[i]);
                        post.view = new PostView({id: 'i' + post.get('rid')}, post);
                        thread.posts.add(post);
                        container.append(post.view.render().el);
                    }
                    return false;
                },
                error: function() {
                    alert("Неизвестная ошибка. Проверьте соединение.")
                    return false;
                }
            })
        }
        return false;
    },

    renderFileInfo: function(file) {
        var t = "<span class='file_info'>";
        if (file.extension == 'video' && file.video_title != null) {
            t += "Видео: &laquo;<a href='" + file.url_full;
            t += "' target='_blank'>" + file.video_title + "</a>&raquo; ";
            var minutes = parseInt(file.video_duration / 60);
            var seconds = parseInt(file.video_duration - (minutes*60));
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            t += minutes + ":" + seconds;
        } else {
            t += "Файл: <a href='"  + file.url_full + "' ";
            t += "target='_blank'>" + file.extension + "</a> ";
            t += parseInt(file.size / 1024) + " kb.";
            if (file.is_picture == true) {
                t += " &mdash; " + file.columns + "×";
                t += file.rows;
            }
        }
        t += "</span>";
        return t;
    },

    renderFileContainer: function(file) {
        var t = "<div class='file_container'>";
        t += "<a target='_blank' href='" + file.url_full + "' ";
            if (file.extension == 'video') {
                t += "class='video_url'>";
            } else {
                if (file.is_picture == true) {
                    t += "class='pic_url'>";
                } else {
                    t += "class='non_pic_url'>";
                }
            }
            if (file.extension == 'video') {
                t += "<img src='/assets/ui/play.png' class='play_button' />";
            }
            t += "<img src='" + file.url_small + "' ";
            if (file.thumb_rows != null) {
                t += "width=" + file.thumb_columns;
                t += " height=" + file.thumb_rows;
            } else if (file.extension == 'video') {
                t += "width=" + 320;
                t += " height=" + 240;
            }
            t += "/>";
        t += "</a>";
        t += "</div>";
        return t;
    },

    renderRepliesRids: function(rids) {
        var t = "<div class='replies_rids'>";
            t += "Ответы: ";
            for (var i = 0; i < rids.length; i++) {
                t += "<div class='post_link'>";
                t += "<a href='/thread/" + rids[i].thread + "#i" + rids[i].post;
                t += "' >&gt;&gt;" + rids[i].post + "</a>";
                t += "&nbsp;</div>"
            }
        t += "</div>";
        return t;
    },

    verboseOmitted: function(number) {
        var result = number + ' пост';
        var mod = number % 10;
        var mod2 = number % 100;
        if ((mod >= 2 && mod <= 4) && !(mod2 >= 12 && mod2 <= 14)) {
            result += 'а';
        } else if (mod != 1 || number == 11) {
            result += 'ов';
        }
        return result;
    }, 

    renderTagList: function(tags) {
        var t = "<span class='taglist'>тэг";
        if (tags.length > 1) {
            t += "и";
        }
        t += ": ";
            for (var i=0; i < tags.length; i++) {
                t += "<a href='/" + tags[i].alias + "/' ";
                t += "title='/" + tags[i].alias + "/'>" + tags[i].name + "</a>";
                if (i != (tags.length - 1)) {
                    t += ",";
                }
                t += " ";
            }
        t += "</span>";
        return t;
    },

    renderHidden: function() {
        var t = "<div class='thread_body hidden'>Скрытый тред ";
        var url = "/thread/" + this.model.get('rid');
        t += "<a href='" + url + "'>#" + this.model.get('rid') + "</a>";
        t += " (";
        if (this.model.get('title').length > 0) {
            t += this.model.get('title');
        } else {
            t += "без названия";
        }
        t += "), ";
        t += this.renderTagList(this.model.get('tags'));
        if (this.tagsHidden.length == 0) {
            t += "<a href='#' title='Показать' class='hide_button'>";
                t += "<img src='/assets/ui/unhide.png' />";
            t += "</a>";
        } else {
            t += " (вашими настройками скрыт";
            if (this.tagsHidden.length == 1) {
                t += " тэг ";
            } else {
                t += "ы тэги ";
            }
            for (var i=0; i < this.tagsHidden.length; i++) {
                t += this.tagsHidden[i].name;
                if (i != this.tagsHidden.length-1) {
                    t += ", ";
                }
            }
            t += ")";
        }
        t += "</div>";
        return t;
    },

    render: function() {
        if (action != 'show') {
            this.ridHidden = settings.isHidden(this.model.get('rid'));
            var tagsHidden = [];
            this.model.get('tags').forEach(function(tag) {
                if (settings.isHidden(tag.alias) == true && tag.alias != currentTag) {
                    tagsHidden.push(tag);
                }
            }); 
            this.tagsHidden = tagsHidden;
            if (this.ridHidden == true || this.tagsHidden.length > 0) {
                this.hidden = true;
                this.el.innerHTML = this.renderHidden();
                return this;
            }
        }
        var t = "<div class='thread_body'>";
            if (this.model.get('file') != null) {
                t += this.renderFileInfo(this.model.get('file'));
                t += this.renderFileContainer(this.model.get('file'));
            }
            var url = '/thread/' + this.model.get('rid'); 
            t += "<a href='" + url + "' class='post_link'>#" + this.model.get('rid');
            t += "</a>";
            if (this.model.get('title') != '') {
                t += "<a href='/thread/" + this.model.get('rid') + "' class='title'>";
                t += this.model.get('title');
                t += "</a>";
            }
            t += "<a href='#' class='fav_button' ";
                if (settings.isFavorite(this.model.get('rid')) == true)  {
                    var star = "full";
                    t += "title='Убрать из избранного'>";
                } else {
                    var star = "empty";
                    t += "title='Добавить в избранное'>";
                }
                t += "<img src='/assets/ui/star_" + star + ".png' />";
            t += "</a>";
            if (action != 'show') {
                t += "<a href='#' title='Скрыть' class='hide_button'>";
                    t += "<img src='/assets/ui/hide.png' />";
                t += "</a>";
            }
            t += "<span class='thread_info'>";
                t += this.renderDateTime(this.model.get('created_at')) + ', ';
                t += this.renderTagList(this.model.get('tags'));
            t += "</span>";
            t += "<blockquote>" + this.model.get('message') + "</blockquote>";
            if (this.model.get('replies_rids').length > 0) {
                t += this.renderRepliesRids(this.model.get('replies_rids'));
            }
        t += "</div>";
        if (this.model.posts != undefined && action != 'live') {
            if (this.full != true && this.model.get('replies_count') > this.model.posts.length) {
                t += "<div class='omitted'><a href='" + url + "' title='развернуть тред'>" 
                t += this.verboseOmitted(this.model.get('replies_count') - 6);
                t += " спустя:</a></div>";
            }
        }
        this.el.innerHTML = t;
        return this;
    }
});




var PostView = ThreadView.extend({
    tagName:    'div',
    className:  'post_container',
    el:         '',

    initialize: function(attributes, model) {
        this.model = model;
        this.$previews = $('#previews').first();
        return this;
    },

    testing: function() {
        alert(this.model.get('rid'));
    },

    highlight: function() {
        $('.post.highlighted').removeClass('highlighted');
        this.$el.find('.post').first().addClass('highlighted');
        return this;
    },

    render: function(updateReferences) {
        var url = "/thread/" + this.model.get('thread_rid') + "#i" + this.model.get('rid');
        var t = "<div class='post'>";
        t += "<div class='post_header'>";
            t += "<span><a href='" + url + "' class='post_link'>";
            t += "#" + this.model.get('rid') + "</a></span>";
            t += "<span class='title'>" + this.model.get('title') + "</span>";
            t += "<span class='date'>" + this.renderDateTime(this.model.get('created_at')) + "</span>";
            if (this.model.get('sage') == true) {
                t += "<span class='sage'>sage</span>";
            }
            if (this.model.get('file') != null) {
                t += this.renderFileInfo(this.model.get('file'));  
            }
        t += "</div>";
        t += "<div class='post_body'>";
            if (this.model.get('file') != null) {
                t += this.renderFileContainer(this.model.get('file'));  
            }
            t += "<blockquote>" + this.model.get('message') + "</blockquote>";
            if (this.model.get('replies_rids').length > 0) {
                t += this.renderRepliesRids(this.model.get('replies_rids'));
            }
        t += "</div></div>";
        this.el.innerHTML = t;
        if (settings.get('shadows') == true) {
            this.el.firstChild.style.boxShadow = "0 1px 3px #d7d7d7";
            this.el.firstChild.style.margin = "3px 0px 3px 0px";
        }
        if (updateReferences == true) {
            var model = this.model
            $.each(this.$el.find('blockquote .post_link'), function(index, div) {
                var postId = $(div).find('a').first().attr('href').split('#');
                postId = parseInt(postId[postId.length - 1].substring(1));
                var target = null;
                var query = threadsCollection.where({rid: postId});
                if (query.length > 0) {
                    target = query[0];
                } else {
                    if (action == 'live') {
                        query = livePostsCollection.where({rid: postId});
                        if (query.length > 0) {
                            target = query[0];
                        }
                    } else {
                        threadsCollection.each(function(thread) {
                            query = thread.posts.where({rid: postId});
                            if (query.length > 0) {
                                target = query[0];
                            }
                        });
                    }
                }
                if (target != null) {
                    var rids = target.get('replies_rids');
                    rids.push({thread: model.get('thread_rid'), post: model.get('rid')});
                    target.set('replies_rids', rids);
                    var post = target.view.$el;
                    rids = post.find('.replies_rids').first();
                    var content = "&gt;&gt;" + model.get('rid');
                    var link = "<div class='post_link'><a href='/thread/" + model.get('thread_rid');
                    link += '#i' + model.get('rid') + "'>" + content + "</a></div>";
                    if (rids.html() == undefined) {
                        rids = $("<div class='replies_rids'>Ответы: " + link + "</div>");
                        post.find('blockquote').first().after(rids);
                    } else if (rids.html().search(content) == -1) {
                        rids.append(' ' + link);
                    }
                }
            });
        }
        return this;
    }
});