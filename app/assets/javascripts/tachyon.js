//= require jquery
//= require jquery_ujs
//= require underscore
//= require backbone
//= require faye
//= require fields
//= require caret
//= require scrollto

//= require models
//= require views/form
//= require views/head
//= require views/paginator
//= require views/taglist
//= require views/thread_and_post
//= require views/bottom_menu
//= require views/previews



var VERSION = 0.1;

$(document).ready(function() {

// var section, controller, action,
// mouseOverElement, loadingTimeout, previousPath, cometClient,
// cometSubscription, postPreviews, mainContainer, loadingIndicator, 
// paginator, bottomMenu = null;
cometSubscription = null;
previousPath = null;

var MainRouter = Backbone.Router.extend({
    routes: {
        '':                     'toRoot',
        'thread/:rid':          'show',
        ':rid.html':            'showOldHack',
        ':tag/':                'index',
        ':tag':                 'index',
        ':tag/page/:page':      'showPage',
        '*path':                'notFound'
    }, 

    before: function(response) {
        form.hide();
        header.$el.find(".active").removeClass('active');
        tagList.$el.find(".selected").removeClass('selected');
        if (response.status == 'not found') {
            this.notFound();
            return false;
        }
        if (cometSubscription != null) {
            cometSubscription.cancel();
            cometSubscription = null;
        }   
        return true;
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

    show: function(rid) {
        showLoadingIndicator();
        $.ajax({
            type:       'post',
            url:        document.location,
            success:    function(response) {
                controller = 'threads'; action = 'index';
                if (router.before(response) == false) {
                    return false;
                }
                form.targetOn('reply', rid);
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                var thread = router.buildThread(response.thread, true);
                section.append(thread.container);
                threadsCollection = new ThreadsCollection([thread.model]);
                thread.container.before("<a href='/~/' class='back_link'>← Назад</a>");
                thread.container.after("<a href='/~/' class='back_link'>← Назад</a>");
                if (previousPath != null) {
                    $('.back_link').attr('href', previousPath);
                }
                checkHash();
                cometSubscription = cometClient.subscribe('/thread/' + rid, router.addPost);
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
        $.ajax({
            type: 'post',
            url:  document.location,
            success: function(response) {
                controller = 'threads'; action = 'index';
                if (router.before(response) == false) {
                    return false;
                }
                form.targetOn('create');
                if (tag == '~') {
                    var tag_selector = "overview_tag";
                } else {
                    var tag_selector = tag;
                }
                tagList.$el.find("#" + tag_selector).addClass('selected');
                header.$el.find("#tags_link").addClass('active');
                var threads = [];
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                for (var i=0; i < response.threads.length; i++) {
                    var thread = router.buildThread(response.threads[i], false);
                    section.append(thread.container);
                    threads[i] = thread.model;
                }
                threadsCollection = new ThreadsCollection(threads);
                section.append(paginator.render(response.pages, page, tag).el);
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
        thread.posts.each(function(post) {
            post.view = new PostView({id: 'i' + post.get('rid')}, post);
            container.append(post.view.render().el);
        });
        return { container: container, model: thread }
    },

    addPost: function(post_json, scroll) {
        var post = new PostModel(post_json);
        var thread = threadsCollection.where({rid: post.get('thread_rid')})[0];
        thread.posts.add(post);
        post.view = new PostView({id: 'i' + post.get('rid')}, post);
        thread.view.$el.parent().append(post.view.render(true).el);
        if (scroll == true) {
            post.view.scrollTo();
        }
        return false;
    },

    notFound: function() {
        section.html('<h1> not found </h1>');
        hideLoadingIndicator();
        return this;
    },

    showError: function(response) {
        section.html(response.responseText);
        hideLoadingIndicator();
        return this;
    },

    receiveMessage: function(message) {
        alert('hju');
        return false
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
    }, 400);
}

function hideLoadingIndicator() {
    if (loadingTimeout != null) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
    loadingIndicator.css('display', 'none');
}

function adjustAbsoluteElements() {
    tagList.adjust($("#tags_link").offset().left);
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
    section = $("<section id='container'></section>");
    mainContainer.append(section).append('<footer>Tachyon ' + VERSION + '</footer>');
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
        retry: 5
    });
    var countersSubscription = cometClient.subscribe('/counters', function(message) {
        header.setCounters(message);
        return false;
    });
}

var header = new HeaderView;
var tagList = new TagListView;
if (tagList.gotTags == true) {
    mainContainer = $('#main_container');
    loadingIndicator = $("#loading");
    router = new MainRouter;
    form = new FormView;
    bottomMenu = new BottomMenuView;
    paginator = new PaginatorView;
    threadsCollection = null;
    previews = new PreviewsView;
    initializeInterface();
    return false;
}
});
