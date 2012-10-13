//= require jquery
//= require jquery_ujs
//= require underscore
//= require backbone

//= require models
//= require views/form
//= require views/header
//= require views/paginator
//= require views/taglist
//= require views/thread_and_post



var VERSION = 0.1;



$(document).ready(function() {

var threadsCollection, section, controller, action,
mouseOverElement, loadingTimeout = null;

function notFound() {
    section.html('<h1> not found </h1>');
    hideLoadingIndicator();
    return false;
}

function showError() {
    section.html('<h1> 500 internal server error </h1>');
    hideLoadingIndicator();
    return false;
}

var MainRouter = Backbone.Router.extend({
    routes: {
        '':              "toRoot",
        "favorites/":    "toRoot",   // test
        ":tag/":         "index",
        ":tag":          "index",
    }, 

    toRoot: function() {
        this.navigate("/~/", {trigger: true});
    },

    index: function(tag) {
        showLoadingIndicator();
        $.ajax({
            type: 'post',
            url:  '/' + tag,
            success: function(response) {
                controller = 'threads';
                action = 'index';
                header.setCounters(response.counters);
                header.$el.find(".active").removeClass('active');
                tagList.$el.find(".selected").removeClass('selected');
                if (response.status == 'not found') { 
                    notFound();
                    return false;
                } 
                if (tag == '~') {
                    tag = "overview_tag";
                }
                tagList.$el.find("#" + tag).addClass('selected');
                header.$el.find("#tags_link").addClass('active');
                var threads = [];
                section.html('');
                hideLoadingIndicator();
                window.scrollTo(0, 0);
                if (response.threads.length == 0) {
                    section.html('<center>Тут пусто, нет ничего вообще.</center>');
                    return false;
                }
                for (var i = 0; i < (response.threads.length); i++) {
                    threads[i] = new ThreadModel(response.threads[i]);
                    section.append((new ThreadView).render(response.threads[i]).el);
                }
                threadsCollection = new ThreadsCollection(threads);
                section.append(paginator.render(response.pages, 1).el);
                return false;
            },
            error: showError,
        });
        return false;
    },
});

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
    Backbone.history.start({pushState: true});
    $(document).on('click', "a[href^='/']", function(event) {
        var href = $(event.currentTarget).attr('href');
        if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            // var url = href.replace(/^\//,'').replace('\#\!\/','');
            router.navigate(href, {trigger: true});
        }
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
