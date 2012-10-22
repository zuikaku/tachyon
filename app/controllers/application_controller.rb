# coding: utf-8

class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter do
    return render(text: 'pisya', status: 403) unless verified_request?
    unless params[:controller] == 'captcha'
      return render('index') if request.get? and request.headers["REQUEST_PATH"] != "/"
      @ip = Ip.get(request.remote_ip.to_s)
      @response = Hash.new
    end
  end

  after_filter do 
    if @ip
      @ip.updated_at = Time.now if @ip.updated_at < (Time.now - 40)
      @ip.save if @ip.changed?
    end
  end

  def index
  end

  def get_tags
    @response[:tags] = Tag.all.to_json 
    @response[:counters] = get_counters
    # set_captcha
    respond!
  end

  protected
  def respond!
    return render(json: @response.to_json)
  end

  def not_found
    @response[:status] = 'not found'
    respond!
  end

  def get_counters
    unless (posts = Rails.cache.read("post_count"))
      posts = RPost.where(created_at: Time.now.at_midnight..Time.now).count
      posts += RThread.where(created_at: Time.now.at_midnight..Time.now).count 
      Rails.cache.write("post_count", posts)
    end
    return {
      online: Ip.where(updated_at: (Time.now - 7.minutes)..Time.now).count,
      posts: posts,
    }
  end

  def set_captcha
    @response[:captcha] = Captcha.get_key(false)
  end

  def parse(text)
    def bold(text)
      "<b>#{text}</b>"
    end

    def italic(text)
      "<i>#{text}</i>"
    end

    def strike(text)
      " <s>#{text}</s> "
    end

    def underline(text)
      "<u>#{text}</u>"
    end

    def spoiler(text)
      "<span class='spoiler'>#{text}</span>"
    end

    def quote(text)
      "<span class='quote'>&gt; #{text.strip}</span>"
    end

    def aquo(text)
      "&laquo;#{text}&raquo;"
    end

    def link(href, text)
      anon = ''
      unless href.include?('freeport7.org')
        anon = "http://anonym.to/?"
      end
      "<a href='#{anon + href}' target='_blank'>#{text}</a>"
    end

    # это пиздец, мне надо руки оторвать
    text.strip!
    text.gsub!('&', '&amp;')
    text.gsub!(/<<(.+?)>>/,     aquo('\1'))
    text.gsub!('<', '&lt;')
    text.gsub!('>', '&gt;')
    text.gsub!('\'', '&#39;')
    text.gsub!(/\*\*(.+?)\*\*/, bold('\1'))
    text.gsub!(/\*(.+?)\*/,     italic('\1'))
    text.gsub!(/__(.+?)__/,     underline('\1'))
    text.gsub!(/(\s|^|\A)_(.+?)_(\s|$|\z)/,       strike('\2'))
    text.gsub!(/%%(.+?)%%/,     spoiler('\1'))
    text.gsub!('--',            '&mdash;')
    text.gsub!(/\[((http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(\/\S*)?) \|\| (.+?)\]/, link('\1', '\4'))
    text.gsub!(/( |^)(http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(\/\S*)?/) do |href|
      anon = ''
      href.strip!
      unless href.include?('freeport7.org')
        anon = "http://anonym.to/?"
      end
      " <a href='#{anon + href}' target='_blank'>#{href}</a> "
    end
    @id_counter = 0
    @new_references = []
    text.gsub! /&gt;&gt;(\d+)/ do |id|
      if @id_counter < @settings.max_references_per_post
        @id_counter += 1
        id = id[8..id.length].to_i
        if @thread and id == @thread.rid
          post = @thread
        else
          post = RPost.get_by_rid(id)
          post = RThread.get_by_rid(id) if not post
        end
        if post
          hash = {thread: @post.rid, post: @post.rid}
          hash[:thread] = @thread.rid if @post.kind_of?(RPost)
          post.replies_rids << hash unless post.replies_rids.include?(hash)
          post.save #unless (@thread and post == @thread)
          id = post.rid if post.kind_of?(RThread)
          id = post.r_thread.rid if post.kind_of?(RPost)
          url = url_for(controller: 'threads', action: 'show',
                        rid: id,  anchor: "i#{post.rid}")
          "<div class='post_link'><a href='#{url}'>&gt;&gt;#{post.rid}</a></div>"
        else
          "&gt;&gt;#{id}"
        end
      else
        "&gt;&gt;#{id}"
      end
    end
    @id_counter = 0
    text.gsub! /##(\d+)/ do |id|
      result = "#{id}"
      if @id_counter < @settings.max_references_per_post
        @id_counter += 1
        id = id[2..id.length].to_i
        post = RPost.get_by_rid(id)
        post = RThread.get_by_rid(id) if not post
        if post
          if post.password == @post.password
            id = post.rid if post.kind_of?(RThread)
            id = post.r_thread.rid if post.kind_of?(RPost)
            url = url_for(controller: 'threads', action:     'show',
                          rid:        id,        anchor:     "i#{post.rid}")
            result = "<div class='proofmark'><a href='#{url}'>###{post.rid}</a></div>"
          end
        end
      end
      result
    end
    if @post.kind_of?(RPost)
      text.gsub! /##(OP)|##(ОП)|##(op)|##(оп)/ do |op| # оппан гангнам стайл
        if @post.password == @thread.password
          url = url_for(action: 'show', rid: @thread.rid, anchor: "i#{@thread.rid}")      
          "<div class='proofmark'><a href='#{url}'>#{op}</a></div>"
        else
          "###{op}"
        end
      end
    end
    # if moder?
    #   text.gsub!("##ADMIN", "<span class='admin_proofmark'>Edison Trent</span>") if @moder.level == 3
    # end
    text.gsub!(/^&gt;(.+)$/,  quote('\1'))
    text.gsub!(/\r*\n(\r*\n)+/, '<br /><br />')
    text.gsub!(/\r*\n/,        '<br />')
    text.strip!
    return text
  end
end
