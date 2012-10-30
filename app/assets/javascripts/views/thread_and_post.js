var ThreadView = Backbone.View.extend({
    tagName:    'div',
    className:  'thread',

    events:     {
        "mouseenter .file_container":     "showFileSearch",
        "mouseleave  .file_container":     "hideFileSearch",
        "click .post_header .post_link": "callReplyForm",
        "click .pic_url":                "showPicture",
        "click .omitted a":              "expand",
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
                img.attr('width', file.columns);
                img.attr('height', file.rows);
                img.attr('src', file.url_full);
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

    scrollTo: function() {
        // window.scrollTo(0, this.$el.offset().top - 150);
        $.scrollTo(this.$el, 200, {offset: {top: -200}});
        return this;   
    },

    callReplyForm: function(event) {
        event.preventDefault();
        var paretID = this.model.get('thread_rid');
        if (parentID == undefined) {
            parentID = this.model.get('rid');
        }
        form.show(this.model.get('rid'), parentID, 'reply');
        return false;
    },

    showFileSearch: function(event) {
        var t = "<span class='file_search'>";
            t += "Поиск: гугл хуюгл";
        t += "</span>"
        $(event.currentTarget).append(t);
        return false;
    },

    hideFileSearch: function(event) {
        $('.file_search').remove();
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
            var monthNames = {
                1:  'января',   2:  'февраля',
                3:  'марта',    4:  'апреля',
                5:  'мая',      6:  'июня',
                7:  'июля',     8:  'августа',
                9:  'сентября', 10: 'октября',
                11: 'ноября',   12: 'января'
            }
            t += monthNames[date[1]] + ' ';
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
                t += "class='video_url' id='" + file.filename + "'>";
            } else {
                if (file.is_picture == true) {
                    t += "class='pic_url'>";
                } else {
                    t += "class='non_pic_url'>";
                }
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

    render: function() {
        var t = "<div class='thread_body'>";
            if (this.model.get('file') != null) {
                t += this.renderFileInfo(this.model.get('file'));
                t += this.renderFileContainer(this.model.get('file'));
            }
            var url = '/thread/' + this.model.get('rid'); 
            t += "<a href='" + url + "' class='post_link'>##" + this.model.get('rid');
            t += "</a>";
            if (this.model.get('title') != '') {
                t += "<a href='/thread/" + this.model.get('rid') + "' class='title'>";
                t += this.model.get('title');
                t += "</a>";
            }
            t += "<a href='#' title='Добавить в избранное' class='fav_button'>";
                t += "<img src='/assets/ui/star_black.png' />";
            t += "</a>";
            t += "</a><a href='#' title='Скрыть' class='hide_button'>";
                t += "<img src='/assets/ui/hide.png' />";
            t += "</a>";
            t += "<span class='thread_info'>";
                t += this.renderDateTime(this.model.get('created_at')) + ', ';
                t += "<span class='taglist'>тэги: ";
                    var tags = this.model.get('tags')
                    for (var i=0; i < tags.length; i++) {
                        t += "<a href='/" + tags[i].alias + "/' ";
                        t += "title='" + tags[i].alias + "'>" + tags[i].name + "</a>";
                        if (i != (tags.length - 1)) {
                            t += ",";
                        }
                        t += " ";
                    }
                t += "</span>";
            t += "</span>";
            t += "<blockquote>" + this.model.get('message') + "</blockquote>";
            if (this.model.get('replies_rids').length > 0) {
                t += this.renderRepliesRids(this.model.get('replies_rids'));
            }
        t += "</div>";
        if (this.model.posts != undefined) {
            if (this.full != true && this.model.get('replies_count') > this.model.posts.length) {
                t += "<div class='omitted'><a href='#' title='развернуть тред'>" 
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
        if (updateReferences == true) {
            var model = this.model
            $.each(this.$el.find('blockquote .post_link'), function(index, div) {
                var postId = $(div).find('a').first().attr('href').split('#');
                postId = postId[postId.length - 1];
                var post = $('#' + postId);
                if (post.html != undefined) {
                    var rids = post.find('.replies_rids').first();
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