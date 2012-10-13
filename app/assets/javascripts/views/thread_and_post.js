var ThreadView = Backbone.View.extend({
    tagName:    'div',
    attributes: {
        class: 'thread_container'
    },
    el:         '',

    events:     {
        "mouseover .thread .file_container": "showFileInfo",
        "mouseout  .thread .file_container": "hideFileInfo",
    },

    showFileInfo: function() {
        var selector = '.file_info';
        if (this.$el.hasClass('thread_container')) {
            selector = ".thread " + selector;
        }
        this.$el.find(selector).css('display', 'block');
        return this;
    },

    hideFileInfo: function() {
        var selector = '.file_info';
        if (this.$el.hasClass('thread_container')) {
            selector = ".thread " + selector;
        }
        this.$el.find(selector).css('display', 'none');
        return this;
    },

    renderFileContainer: function(file) {
        t = "<div class='file_container'>";
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
            }
            t += "/>";
        t += "</a>";
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

    render: function(params) {
        var t = "<div class='thread'>";
        t += "<div class='thread_body'>";
            if (params.file != null) {
                t += this.renderFileContainer(params.file);
            }
            t += "<a href='/thread/" + params.rid + "' class='title'>";
                if (params.title == '') {
                    t += "Тред №" + params.rid;
                } else {
                    t += params.title;
                }
            t += "</a><a href='/#" + params.rid + "/toggle_fav' title='Добавить в избранное' class='fav_button'>";
                t += "<img src='/";
                if (production == false) { t += "assets/"; }
                t += "ui/star_black.png' />";

            t += "</a>";
            t += "</a><a href='/#" + params.rid + "/toggle_hide' title='Скрыть' class='hide_button'>";
                t += "<img src='/";
                if (production == false) { t += "assets/"; }
                t += "ui/hide.png' />";
            t += "</a>";
            t += "</a><a href='#' title='Быстрый ответ' class='qr_link'>";
                t += "<img src='/";
                if (production == false) { t += "assets/"; }
                t += "ui/reply.png' />";
            t += "</a>";
            t += "<span class='thread_info'>";
                t += params.created_at + ', ';
                t += "<span class='taglist'>тэги: ";
                    for (var i=0; i < params.tags.length; i++) {
                        t += "<a href='/" + params.tags[i].alias + "/' ";
                        t += "title='" + params.tags[i].alias + "'>" + params.tags[i].name + "</a>";
                        if (i != (params.tags.length - 1)) {
                            t += ",";
                        }
                        t += " ";
                    }
                t += "</span>";
            t += "</span>";
            t += "<blockquote>" + params.message + "</blockquote>";
            if (params.replies_rids.length > 0) {
                t += this.renderRepliesRids(params.replies_rids);
            }
        t += "</div>";
        if (params.replies_count > 5) {
            t += "<div class='omitted'>" + (params.replies_count - 5);
            t += " постов спустя:</div>";
        }
        t += "</div>"; 
        this.$el.append(t);
        if (params.posts != undefined) {
            for (var i=0; i < params.posts.length; i++) {
                this.$el.append((new PostView).render(params.posts[i]).el);
            }
        }
        return this;
    }
});




var PostView = ThreadView.extend({
    tagName:    'div',
    attributes: {
        class: 'post_container'
    },
    el:         '',

    events:     {
        "mouseover .post .file_container": "showFileInfo",
        "mouseout  .post .file_container": "hideFileInfo",
    },

    render: function(params) {
        var url = "/" + params.thread_rid + "#i" + params.rid;
        var t = "<div class='post'>";
        t += "<div class='post_header'>";
            t += "<span><a href='" + url + "' class='post_link'>";
            t += "#" + params.rid + "</a></span>";
            t += "<span class='title'>" + params.title + "</span>";
            t += "<span>" + params.created_at + "</span>";
            if (params.sage == true) {
                t += "<span class='sage'>sage</span>";
            }
        t += "</div>";
        t += "<div class='post_body'>";
            if (params.file != null) {
                t += this.renderFileContainer(params.file);
            }
            t += "<blockquote>" + params.message + "</blockquote>";
            if (params.replies_rids.length > 0) {
                t += this.renderRepliesRids(params.replies_rids);
            }
        t += "</div></div>";
        this.$el.append(t);
        return this;
    }
});