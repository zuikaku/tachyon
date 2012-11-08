# coding: utf-8

class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter do
    return render(text: 'unverified request', status: 403) unless verified_request?
    @host = request.headers['HTTP_HOST']
    @host = request.headers['HTTP_SERVER_NAME'] if Rails.env.production?
    @response = Hash.new
    @start_time = Time.now.usec
    utility = %w( mobile_off garbage_collection ).include?(params[:action])
    check_mobile unless utility
    if @mobile == false and utility == false
      return render('application/index') if request.get?
    else 
      if @mobile
        address = request.remote_ip.to_s
        address = request.headers['HTTP_REAL_IP'] if Rails.env.production?
        @ip = Ip.get(address)
        set_captcha if @ip.post_captcha_needed
        @counters = get_counters
      end
    end
  end

  after_filter do 
    if @ip
      @ip.updated_at = Time.now if @ip.updated_at < (Time.now - 1.minute)
      @ip.save if @ip.changed?
    end
  end

  def index
    if @mobile == true
      return redirect_to("http://#{@host}/~/")
    end
  end

  def ping 
    address = request.remote_ip.to_s
    address = request.headers['HTTP_REAL_IP'] if Rails.env.production?
    @ip = Ip.get(address)
    return render(text: 'pong')
  end

  def get_tags
    address = request.remote_ip.to_s
    address = request.headers['HTTP_REAL_IP'] if Rails.env.production?
    @ip = Ip.get(address)
    @response[:tags] = Tag.all.to_json
    @response[:counters] = get_counters
    set_captcha if @ip.post_captcha_needed
    check_defence_token
    set_defence_token if @token == nil
    respond!
  end

  def mobile_off
    if @host[0..1] == 'm.'
      path = @host.gsub('m.', '')
      return redirect_to("http://#{path}/utility/mobile-off")
    else
      session[:dont_force_mobile] = true
      return redirect_to :root
    end
  end

  def garbage_collection
    return not_found unless request.local?
    date = (Time.now - 3.days).at_midnight
    parameters = { ip_id: nil, defence_token_id: nil }
    RPost.where("created_at <= ?", date).update_all(parameters)
    RThread.where("created_at <= ?", date).update_all(parameters)
    DefenceToken.where("updated_at < ?", date).destroy_all
    return render(text: 'cleanup successfull')
  end

  protected
  def respond!
    if @mobile == false
      @response[:time] = (Time.now.usec - @start_time).abs / 1000000.0
      return render(json: @response)
    else
      if @response.has_key?(:errors)
        return render('/errors') unless @response[:errors].empty?
      end
      if params[:action] == "reply"
        url = url_for(controller: 'threads', action: 'show', rid: @thread.rid,
          anchor: "i#{@post.rid}")
        return redirect_to("#{url}")
      elsif params[:action] == "create"
        url = url_for(controller: 'threads', action: 'show', rid: @response[:thread_rid])
        return redirect_to("#{url}")
      end
    end
  end

  def check_mobile
    @mobile = (@host[0..1] == 'm.')
    if (request.user_agent.to_s.downcase =~ MOBILE_USER_AGENTS) != nil
      unless @mobile
        unless session[:dont_force_mobile] == true
          @mobile = true
          return redirect_to("http://m.#{@host}#{request.headers['REQUEST_PATH']}")
        end
      end
    end
  end

  def not_found
    render('application/not_found') if @mobile == true
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

  def set_captcha(defensive=false)
    if (test = Captcha.where(key: session[:captcha]).first)
      if test.defensive == defensive
        if (Time.now - test.created_at) < 20.minutes
          @response[:captcha] = session[:captcha]
          return
        end
      end        
    end
    @response[:captcha] = Captcha.get_key(defensive) 
    logger.info "\n\napplication: #{defensive}\n\n"
    session[:captcha] = @response[:captcha]
  end

  def validate_captcha
    @captcha = nil
    return unless params.has_key?(:captcha)
    if session[:captcha] == params[:captcha][:challenge].to_i
      session[:captcha] == nil
      @captcha = Captcha.validate(params[:captcha])
    end
  end

  def set_defence_token
    @token = DefenceToken.create
    @response[:defence_token] = @token.hashname
  end

  def check_defence_token
    @token = nil
    if params.has_key?(:defence_token)
      @token = DefenceToken.where(hashname: params[:defence_token]).first
    end
  end

  def parse(text)
    # это пиздец, мне надо руки оторвать
    text.strip!
    text.gsub!('&', '&amp;')
    text.gsub!(/<<(.+?)>>/,     '&laquo;\1&raquo;')
    text.gsub!('<', '&lt;')
    text.gsub!('>', '&gt;')
    text.gsub!('\'', '&#39;')
    text.gsub!(/\*\*(.+?)\*\*/, '<b>\1</b>')
    text.gsub!(/\*(.+?)\*/,     '<i>\1</i>')
    text.gsub!(/__(.+?)__/,     '<u>\1</u>')
    text.gsub!(/(\s|^|\A)_(.+?)_(\s|$|\z)/,       ' <s>\2</s> ')
    text.gsub!(/%%(.+?)%%/,     '<span class="spoiler">\1</span>')
    text.gsub!('--',            '&mdash;')
    text.gsub!(/\[((http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}(\/\S*)?) \|\| (.+?)\]/) do |href|
      anon = ''
      array = href.split('||')
      href = array[0].gsub!('[', '').strip!
      name = array[1].gsub!(']', '').strip!
      anon = 'http://anonym.to/?' unless href.include?('freeport7.org')
      " <a href='#{anon + href}' target='_blank'>#{name}</a> "
    end
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
      if @id_counter < 10
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
      if @id_counter < 10
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
      text.gsub! /##(OP)|##(ОП)|##(op)|##(оп)/ do |op| # oppan gangnam style
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
    text.gsub!(/^&gt;(.+)$/) do |text| 
      "<span class='quote'>#{text.strip}</span>"
    end
    text.gsub!(/\r*\n(\r*\n)+/, '<br /><br />')
    text.gsub!(/\r*\n/,        '<br />')
    text.strip!
    return text
  end
end
