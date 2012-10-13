var PaginatorView = Backbone.View.extend({
  tagName:  'div',
  id:       'paginator',
  el:       '',

  render: function(total_pages, current_page) {
    var limit = 2;
    var t = "";
    var current_href = "'.'";
    var between = (1 + current_page) - 3;
    var p = 2;
    if (current_page != 1) {
      current_href = "'./page/" + current_page + "'";
      t += "<a href='./'>1</a>";
    }
    if (between > (limit + 1)) {
      t += "...";
      p = current_page - limit - 1;
    }
    for (var i = p; i < current_page; i++) {
      t += this.pageLink(i);
    }
    t += "<a href=" + current_href + " class='current'>"; 
    t += current_page + "</a>";
    if (current_page < total_pages) {
      var hui = (total_pages - current_page) - 1;
      if (hui > limit) {
        between = current_page + 2;
        for (var i = (current_page+1); i <= (between + 1); i++) {
          t += this.pageLink(i);
        }
        if ((total_pages - (current_page - limit)) > 2) {
          t += "...";
        }
      } else {
        for (var i=(current_page+1); i < (current_page + hui); i++) {
          t += this.pageLink(i);
        }
      }
    }
    if (current_page != total_pages) {
      t += this.pageLink(total_pages);
    }
    this.$el.html(t);
    return this;
  },

  pageLink: function(page_number) {
    return "<a href='./page/" + page_number + "'>" + page_number + "</a>";
  }
});