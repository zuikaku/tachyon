//= require jquery
//= require jquery_ujs
//= require underscore
//= require backbone
//= require fayer
//= require fields
//= require caret
//= require scrollto

//= require models
//= require views/bottom_menu
//= require views/form
//= require views/head
//= require views/paginator
//= require views/previews
//= require views/settings
//= require views/taglist
//= require views/thread_and_post



var VERSION = 0.3;
var NAME = 'Tachyon';

$(document).ready(function() {


cometSubscription   = null;
previousPath        = null;
waitToHighlight     = null;
section             = null;
header              = null;
bottomMenu          = null;
loadingTimeout      = null;
threadsCollection   = null;
livePostsCollection = null;
currentTag          = null;

var MainRouter = Backbone.Router.extend({
    routes: {
        '':                     'toRoot',
        'live/':                'live',
        'live':                 'trailingSlash',
        'thread/:rid':          'show',
        ':rid.html':            'showOldHack',
        ':tag/':                'index',
        ':tag':                 'trailingSlash',
        ':tag/page/:page':      'showPage',
        '*path':                'notFound'
    }, 

    setTitle: function(title) {
        var set = NAME;
        if (title != undefined) {
            set += " - " + title;
        }
        document.title = set;
        return false;
    },

    before: function(response) {
        controller = null;
        action = null;
        form.hide();
        form.setTag('');
        header.$el.find(".active").removeClass('active');
        tagList.$el.find(".selected").removeClass('selected');
        if (response.status == 'not found') {
            this.notFound();
            return false;
        } else if (response.status == 'fail') {
            this.showError(response);
            return false;
        }
        if (cometSubscription != null) {
            cometSubscription.cancel();
            cometSubscription = null;
        }   
        return true;
    },

    trailingSlash: function() {
        this.navigate(document.location.pathname + "/", {trigger: true});
    },

    toRoot: function() {
        this.navigate("/~/", {trigger: true});
        return false;
    },

    index: function(tag) {
        this.showPage(tag, 1);
        return false;
    },

    showOldHack: function(rid) {
        hash = document.location.hash;
        this.navigate("/thread/" + rid + hash, {trigger: true});
        hideLoadingIndicator();
        return false;
    },

    live: function() {
        showLoadingIndicator();
        $.ajax({
            type:       'post',
            url:        document.location,
            success:    function(response) {
                if (router.before(response) == false) {
                    return false;
                }
                router.setTitle('LIVE!');
                controller = 'threads'; action = 'live';
                form.targetOn('create');
                var liveContainer = $("<div id='live_container'></div>");
                section.html(liveContainer);
                hideLoadingIndicator();
                header.$el.find('#live_link').addClass('active');
                window.scrollTo(0, 0);
                livePostsCollection = new PostsCollection;
                threadsCollection = new ThreadsCollection;
                var handleMessage = function(message) {
                    if (message.tags == undefined) {
                        router.addPost(message);
                    } else {
                        var thread = router.buildThread(message, false);
                        liveContainer.prepend(thread.container);
                        threadsCollection.add(thread.model);
                    }
                }
                response.messages.forEach(handleMessage);
                cometSubscription = cometClient.subscribe('/live', handleMessage);
                adjustFooter();
                return false;
            },
            error: router.showError, 
        });
        return false;
    },

    show: function(rid) {
        showLoadingIndicator();
        $.ajax({
            type:       'post',
            url:        document.location,
            success:    function(response) {
                if (router.before(response) == false) {
                    return false;
                }
                if (response.thread.title.length > 0) {
                    var title = response.thread.title;
                } else {
                    var title = "тред №" + response.thread.rid;
                }
                title += " (";
                for (var i=0; i < response.thread.tags.length; i++) {
                    title += response.thread.tags[i].name;
                    if (i != response.thread.tags.length-1) {
                        title += ", ";
                    }
                }
                router.setTitle(title + ")");
                controller = 'threads'; action = 'show';
                form.targetOn('reply', rid);
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                var thread = router.buildThread(response.thread, true);
                section.append(thread.container);
                threadsCollection = new ThreadsCollection([thread.model]);
                var buttons = "<div class='thread_buttons'><a href='/~/' class='back_link'>← Назад</a>" 
                + "<a href='#' class='show_all_pictures_button'>Развернуть картинки</a></div>";
                thread.container.before(buttons);
                thread.container.after(buttons);
                $('.show_all_pictures_button').unbind().click(function(event) {
                    event.preventDefault();
                    var threadToShowPictures = threadsCollection.first().view;
                    threadToShowPictures.showAllPictures();
                    return false;
                });
                if (previousPath != null) {
                    $('.back_link').attr('href', previousPath);
                }
                checkHash();
                cometSubscription = cometClient.subscribe('/thread/' + rid, router.addPost);
                adjustFooter();
                return false;
            },
            error: router.showError,
        });
        return false;
    },

    showPage: function(tag, page) {
        showLoadingIndicator();
        page = parseInt(page);
        var link = '/' + tag;
        if (page != 1) {
            link += '/page/' + page;
        }
        var data = {amount: settings.get('threads_per_page')};
        if (tag == 'favorites') {
            data.rids = settings.get('favorites');
        }
        if (settings.get('strict_hiding') == true) {
            data.hidden_posts = settings.get('hidden_posts');
            data.hidden_tags  = settings.get('hidden_tags' );
        }
        $.ajax({
            type: 'post',
            url:  document.location,
            data: data,
            success: function(response) {
                if (router.before(response) == false) {
                    return false;
                }
                controller = 'threads'; action = 'index';
                form.targetOn('create');
                form.setTag('');
                header.$el.find("#tags_link").addClass('active');
                if (tag == '~') {
                    tagList.$el.find("#overview_tag").addClass('selected');
                    router.setTitle('Обзор');
                } else if (tag == 'favorites') {
                    header.$el.find(".active").removeClass('active');
                    header.$el.find("#favorites_link").addClass('active');
                    router.setTitle('Избранное');
                } else {
                    var tagElement = tagList.$el.find("#" + tag);
                    tagElement.addClass('selected');
                    form.setTag(tag);
                    router.setTitle(tagElement.html());
                }
                currentTag = tag;
                var threads = [];
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                for (var i=0; i < response.threads.length; i++) {
                    var thread = router.buildThread(response.threads[i], false);
                    section.append(thread.container);
                    threads[i] = thread.model;
                    if (i != response.threads.length-1) {
                        section.append("<hr />");
                    }
                }
                threadsCollection = new ThreadsCollection(threads);
                if (threadsCollection.length == 0) {
                    section.prepend('<div class="emptiness">Тут пусто, нет ничего вообще.</div>')   
                }
                if (response.pages != undefined) {
                    section.append(paginator.render(response.pages, page, tag).el);
                }
                adjustFooter();
                return false;
            },
            error: router.showError,
        });
        return false;
    },

    buildThread: function(thread_json, full) {
        var thread = new ThreadModel(thread_json);
        thread.view = new ThreadView({id: 'i' + thread.get('rid')}, thread, full);
        if (full == true) {
            var container = $("<div id='thread_container'></div>");
        } else {
            var container = $("<div class='thread_container'></div>");
        }
        container.append(thread.view.render().el);
        if (thread.view.hidden == false) {
            thread.posts.each(function(post) {
                post.view = new PostView({id: 'i' + post.get('rid')}, post);
                container.append(post.view.render().el);
            });
        }
        return { container: container, model: thread }
    },

    addPost: function(post_json, scroll) {
        var post = new PostModel(post_json);
        if (action == 'live') {
            post.view = new PostView({id: 'i' + post.get('rid')}, post);
            livePostsCollection.add(post);
            $('#live_container').prepend(post.view.render(true).el);
        } else {
            var thread = threadsCollection.where({rid: post.get('thread_rid')})[0];
            thread.posts.add(post);
            post.view = new PostView({id: 'i' + post.get('rid')}, post);
            thread.view.$el.parent().append(post.view.render(true).el);
        }
        if (scroll == true) {
            post.view.highlight();
            if (settings.get('scroll_to_post') == true) {
                post.view.scrollTo();
            }
        }
        setTimeout(function() {
            if (waitToHighlight != null) {
                if (post.get('rid') == waitToHighlight) {
                    if (settings.get('scroll_to_post') == true) {
                        post.view.scrollTo().highlight();
                        if (action != 'live') {
                            document.location.hash = 'i' + waitToHighlight;
                        }
                    }
                    waitToHighlight = null;
                }
            }
        }, 100);
        adjustFooter();
        return false;
    },

    notFound: function() {
        var t = "<div class='not_found'><h1>404</h1>";
        t += "<span>По этой ссылке ничего нет. Совсем.</span></div>";
        section.html(t);
        bottomMenu.vanish();
        hideLoadingIndicator();
        adjustFooter();
        return this;
    },

    showError: function(response) {
        bottomMenu.vanish();
        hideLoadingIndicator();
        if (response.errors != undefined) {
            response.errors.forEach(function(error) {
                section.html('<h1>Ошибка:</h1>')
                section.append('<br />' + error); 
            });
        } else {
            section.html(response.responseText);
        }
        adjustFooter();
        return this;
    },
});


/////////////////////////////////////////////////////////////////////


function showTagList() {
    mouseOverElement = $(this);
    tagList.$el.animate({top: 0}, 300);
    return false;
}


function hideTagList() {
    mouseOverElement = null;
    setTimeout(function() {
        if (mouseOverElement == null) {
            tagList.$el.animate({top: -(tagList.$el.height() + 50)}, 300);
        }
    }, 300);
    return false;
}

function setMouseOver() {
    mouseOverElement = $(this);
    return false;
}

function showLoadingIndicator() {
    loadingTimeout = setTimeout(function () {
        loadingIndicator.css('display', 'block');
    }, 450);
}

function hideLoadingIndicator() {
    if (loadingTimeout != null) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
    loadingIndicator.css('display', 'none');
    return false;
}

function adjustAbsoluteElements() {
    tagList.adjust();
    settings.adjust();
    adjustFooter();
}

function adjustFooter () {
    if (mainContainer.height() < (window.innerHeight - 100)) {
        $('footer').css({position: 'absolute', bottom: 0});
    } else {
        $('footer').css({position: 'static', bottom: 'none'});
    }
    return false;
}

function checkHash() {
    if (document.location.hash != '') {
        var post = threadsCollection.first().posts.where({
            rid: parseInt(document.location.hash.substring(2)),
        })[0];
        if (post != undefined) {
            post.view.highlight().scrollTo();
        }
    }
}

/////////////////////////////////////////////////////////////////////

function initializeInterface() {
    mainContainer.append(tagList.el);
    mainContainer.append(header.el);
    mainContainer.append(bottomMenu.el);
    mainContainer.append(form.el);
    mainContainer.append(previews.el);
    mainContainer.append(settings.el);
    section = $("<section id='container'></section>");
    mainContainer.append(section).append('<footer>Tachyon ' + VERSION + '</footer>');
    header.setFixed(settings.get('fixed_header'));
    adjustAbsoluteElements();
    $(window).resize(adjustAbsoluteElements);
    header.$el.find("#tags_link").hover(showTagList, hideTagList);
    tagList.$el.hover(setMouseOver, hideTagList);
    header.setCounters(tagList.counters);

    Backbone.history.start({pushState: true});

    $(document).on('click', "a[href^='/']", function(event) {
        var href = $(event.currentTarget).attr('href');
        var click = (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey);
        click = click && (href.substring(0, 6) != '/files');
        if (click == true) {
            event.preventDefault();
            previousPath = document.location.pathname + document.location.hash;
            router.navigate(href, {trigger: true});
        }
    });
    cometClient = new Faye.Client('/comet', {
        timeout: 120,
        retry: 2
    });
    cometClient.disable('websoket');
    cometClient.disable('autodisconnect');
    var countersSubscription = cometClient.subscribe('/counters', function(message) {
        header.setCounters(message);
        return false;
    });

    setInterval(function() {
        $.ajax({url: '/utility/ping', type: 'post'});
    }, 60000)
}

settings = new SettingsView;
header = new HeaderView;
tagList = new TagListView;
if (tagList.gotTags == true) {
    settings.renderTags(tagList.renderTagTable(5, true));
    mainContainer = $('#main_container');
    loadingIndicator = $("#loading");
    router = new MainRouter;
    form = new FormView;
    bottomMenu = new BottomMenuView;
    paginator = new PaginatorView;
    previews = new PreviewsView;
    initializeInterface();
    return false;
}
});
