var ThreadView = Backbone.View.extend({
    tagName:    'div',
    className:  'thread',

    events:     {
        "mouseover .file_container":    "showFileInfo",
        "mouseout  .file_container":    "hideFileInfo",
        "click .qr_link":               "callReplyForm",
        "click .post_header .post_link": "callReplyForm",
        "click .file_container img":           "showPicture",
    },

    initialize: function(attributes, model, full, formLink) {
        this.model = model;
        this.formLink = formLink,
        this.full = full;
        return this;
    },

    showPicture: function(event) {
        var file = this.model.get('file');
        var img = this.$el.find(".file_container img").first();
        alert(file.url_full);
        img.attr('src', file.url_full);
    },

    scrollTo: function() {
        window.scrollTo(0, this.$el.offset().top - 150);
        // window.scrollTo(200, 0);
        return this;   
    },

    callReplyForm: function(event) {
        event.preventDefault();
        var parentID = this.model.get('thread_rid');
        if (parentID == undefined) {
            parentID = this.model.get('rid');
        }
        this.formLink.show(this.model.get('rid'), parentID, 'reply');
        return false;
    },

    showFileInfo: function(event) {
        $(event.currentTarget).find('.file_info').css('display', 'block');
    },

    hideFileInfo: function(event) {
        $(event.currentTarget).find('.file_info').css('display', 'none');
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

    renderFileContainer: function(file) {
        t = "<div class='file_container'>";
        // t += "<a target='_blank' href='" + file.url_full + "' ";
        //     if (file.extension == 'video') {
        //         t += "class='video_url' id='" + file.filename + "'>";
        //     } else {
        //         if (file.is_picture == true) {
        //             t += "class='pic_url'>";
        //         } else {
        //             t += "class='non_pic_url'>";
        //         }
        //     }
            t += "<img src='" + file.url_small + "' ";
            if (file.thumb_rows != null) {
                t += "width=" + file.thumb_columns;
                t += " height=" + file.thumb_rows;
            } else if (file.extension == 'video') {
                t += "width=" + 320;
                t += " height=" + 240;
            }
            t += "/>";
        // t += "</a>";
        t += "<span class='file_info'>";
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
        t += "</span></div>";
        return t;
    },

    renderRepliesRids: function(rids) {
        t = "<div class='replies_rids'>";
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

    render: function() {
        var t = "<div class='thread_body'>";
            if (this.model.get('file') != null) {
                t += this.renderFileContainer(this.model.get('file'));
            }
            t += "<a href='/thread/" + this.model.get('rid') + "' class='title'>";
                if (this.model.get('title') == '') {
                    t += "Тред №" + this.model.get('rid');
                } else {
                    t += this.model.get('title');
                }
            t += "</a><a href='#' title='Добавить в избранное' class='fav_button'>";
                t += "<img src='/assets/ui/star_black.png' />";
            t += "</a>";
            t += "</a><a href='#' title='Скрыть' class='hide_button'>";
                t += "<img src='/assets/ui/hide.png' />";
            t += "</a>";
            t += "</a><a href='#' title='Быстрый ответ' class='qr_link'>";
                t += "<img src='/assets/ui/reply.png' />";
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
                t += "<div class='omitted'>" + (this.model.get('replies_count') - 6);
                t += " постов спустя:</div>";
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

    initialize: function(attributes, model, formLink) {
        this.model = model;
        this.formLink = formLink;
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
        var url = "/" + this.model.get('thread_rid') + "#i" + this.model.get('rid');
        var t = "<div class='post'>";
        t += "<div class='post_header'>";
            t += "<span><a href='" + url + "' class='post_link'>";
            t += "#" + this.model.get('rid') + "</a></span>";
            t += "<span class='title'>" + this.model.get('title') + "</span>";
            t += "<span class='date'>" + this.renderDateTime(this.model.get('created_at')) + "</span>";
            if (this.model.get('sage') == true) {
                t += "<span class='sage'>sage</span>";
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