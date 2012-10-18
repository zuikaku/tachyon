//= require jquery
//= require jquery_ujs
//= require underscore
//= require backbone
//= require faye

//= require models
//= require views/form
//= require views/head
//= require views/paginator
//= require views/taglist
//= require views/thread_and_post



var VERSION = 0.1;



$(document).ready(function() {

var threadsCollection, section, controller, action,
mouseOverElement, loadingTimeout, previousPath, cometClient,
cometSubscription = null;

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
        header.$el.find(".active").removeClass('active');
        tagList.$el.find(".selected").removeClass('selected');
        if (response.status == 'not found') {
            this.notFound();
            return false;
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
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                result = router.showThread(response.thread, true)
                section.append(result[0]);
                threadsCollection = new ThreadsCollection([result[1]]);
                backLink = $("<a href='/~/' class='back_link'>Назад</a>");
                if (previousPath != null) {
                    backLink.attr('href', previousPath);
                }
                section.append(backLink);
                checkHash();
                if (cometSubscription != null) {
                    cometSubscription.cancel();
                }
                cometSubscription = cometClient.subscribe('/thread/' + rid, function(message) {
                    var post = new PostModel(message);
                    threadsCollection.first().posts.add(new PostModel(message));
                    var newPostView = new PostView({id: 'i' + post.get('rid')}, post, form);
                    post.view = newPostView;
                    $('#thread_container').append(newPostView.render(true).el);
                    return false;
                });
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
                if (tag == '~') {
                    tag_selector = "overview_tag";
                } else {
                    tag_selector = tag;
                }
                tagList.$el.find("#" + tag_selector).addClass('selected');
                header.$el.find("#tags_link").addClass('active');
                var threads = [];
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                for (var i=0; i < response.threads.length; i++) {
                    var result = router.showThread(response.threads[i], false);
                    section.append(result[0]);
                    threads[i] = result[1];
                }
                threadsCollection = new ThreadsCollection(threads);
                section.append(paginator.render(response.pages, page, tag).el);
                return false;
            },
            error: router.showError,
        });
        return false;
    },

    showThread: function(thread_json, full) {
        var thread = new ThreadModel(thread_json);
        var attrs = {id: 'i' + thread.get('rid')};
        var view = new ThreadView(attrs, thread, full, form);
        if (full == true) {
            var container = $("<div id='thread_container'></div>");
        } else {
            var container = $("<div class='thread_container'></div>");
        }
        container.append(view.render().el);
        thread.posts.each(function(post) {
            var viewPost = new PostView({id: 'i' + post.get('rid')}, post, form);
            post.view = viewPost;
            container.append(viewPost.render().el);
        });
        return [container, thread];
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
    mainContainer.append(header.el)
    mainContainer.append(tagList.el);
    mainContainer.append(form.el);
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
            previousPath = document.location + document.location.hash;
            router.navigate(href, {trigger: true});
        }
    });
    
    $(document).on('click', 'a[href="#"]', function() {
        form.show();
    })
    if (production == true) {
        var cometLink = 'http://freeport7.org/comet';
    } else {
        var cometLink = 'localhost:3000/comet';
    }
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
var mainContainer = $('#main_container');
var loadingIndicator = $("#loading");
var router = new MainRouter;
var form = new FormView;
var paginator = new PaginatorView;

initializeInterface();
});
