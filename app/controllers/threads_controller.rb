class ThreadsController < ApplicationController
  before_filter do 
    get_tag if ['index', 'page'].include?(params[:action])
  end

  def index
    show_page(1)
  end

  def show 
    rid = params[:rid].to_i
    return not_found if rid == 0
    thread_rid = RThread.connection.select_all("SELECT r_threads.rid 
        FROM r_threads WHERE r_threads.rid = #{rid} LIMIT 1")
    if thread_rid.empty?
      return not_found
    else
      data = Rails.cache.read("t/#{rid}/f")
      data = build_thread(rid) unless data
      @response[:thread] = data
    end
    @response[:status] == 'success'
    respond!
  end

  def show_old 
    redirect_to(action: show, rid: params[:rid])
  end

  def page 
    page_number = params[:page].to_i
    page_number = 1 if page_number < 1
    show_page(page_number)
  end

  def create
    process_post 
  end

  def reply
    sleep 3
    process_post
  end

  def expand
    if (thread = RThread.get_by_rid(params[:rid].to_i))
      data = Rails.cache.read("t/#{thread.rid}/f")
      data = build_thread(thread.rid) unless data
      @response[:posts] = data[:posts]
    else
      @response[:status] = 'fail'
      @response[:errors] = ['thread not found']
    end
    respond!
  end

  def get_post
    post = RPost.get_by_rid(params[:rid])
    post = RThread.get_by_rid(params[:rid]) unless post
    @response[:post] = post.jsonify if post 
    respond!
  end

  def live 
    @response[:messages] = Array.new
    threads = RThread.order('created_at DESC').limit(10).to_a
    posts = RPost.order('created_at DESC').limit(10).to_a
    messages = posts + threads
    messages.sort! { |x, y| y.rid <=> x.rid }
    messages = messages[0..14].reverse
    files_ids = Array.new
    messages.each do |message|
      files_ids << message.r_file_id if message.has_file?
    end
    files = RFile.where("r_files.id IN (?)", files_ids).to_a
    messages.each do |message|
      @response[:messages] << message.jsonify(files)
    end
    respond!
  end

  ###############################################################

  private
  def build_thread(rid)
    minimal = ! ['show', 'expand'].include?(params[:action])
    thread = RThread.get_by_rid(rid)
    if minimal
      posts = thread.last_posts.reverse
      token = 'm' # is for mini
    else
      posts = thread.r_posts
      token = 'f' # is for full
    end
    files_ids = Array.new
    files_ids << thread.r_file_id if thread.has_file?
    posts.each { |post| files_ids << post.r_file_id if post.has_file? }
    files = RFile.where("r_files.id IN (?)", files_ids).to_a
    data = thread.jsonify(files)
    posts.each { |post| data[:posts] << post.jsonify(files, rid) }
    Rails.cache.write("t/#{rid}/#{token}", data)
    return data
  end

  def show_page(page_number) 
    amount = params[:amount].to_i
    params[:rids] = Array.new unless params.has_key?(:rids)
    if amount < 5 or amount > 20
      @response[:errors] = ['invalid request']
      @response[:status] = 'fail'
      return respond!
    end
    @response[:status] = 'success'
    @response[:threads] = Array.new
    offset = (page_number * amount) - amount
    if @tag == '~'
      if params.has_key?(:hidden_tags) or params.has_key?(:hidden_posts)
        hidden_rids = [31337] + params[:hidden_posts].to_a
        hidden_tags = ['otsos'] + params[:hidden_tags].to_a
        Tag.all.each do |tag|
          hidden_rids += tag.r_threads.pluck('r_threads.rid') if hidden_tags.include?(tag.alias)
        end
        # костыли и велосипеды
        thread_rids = RThread.find(:all, select: 'rid', order: 'bump DESC', 
          conditions: ['rid NOT IN (?)', hidden_rids], limit: amount, offset: offset)
        total = RThread.where('rid NOT IN (?)', hidden_rids).count
      else 
        thread_rids = RThread.find(:all, select: 'rid', order: 'bump DESC', limit: amount, offset: offset)
        total = RThread.count
      end
    elsif @tag == 'favorites'
      thread_rids = RThread.connection.select_all("SELECT r_threads.rid FROM r_threads
        WHERE r_threads.rid IN (#{params[:rids].join(',')})
        ORDER BY bump DESC LIMIT #{amount} OFFSET #{offset}")
      total = params[:rids].size
    else
      if params.has_key?(:hidden_tags) or params.has_key?(:hidden_posts)
        conditions = ["r_threads.rid NOT IN (?) AND tags.id = ?", [1], @tag.id]
        rids = RThread.order('bump DESC').joins(:tags).where(conditions).pluck('r_threads.rid')
        thread_rids = Array.new
        rids.each { |rid| thread_rids << {'rid' => rid} }
        total = RThread.joins(:tags).where(conditions).count
      else
        thread_rids = RThread.connection.select_all("SELECT r_threads.rid FROM r_threads
          INNER JOIN r_threads_tags ON r_threads_tags.r_thread_id = r_threads.id 
          INNER JOIN tags ON tags.id = r_threads_tags.tag_id WHERE tags.id = '#{@tag.id}'
          ORDER BY bump DESC LIMIT #{amount} OFFSET #{offset}")
        total = RThread.order('bump DESC').joins(:tags).where("tags.id = ?", @tag.id).count
      end
    end
    thread_rids.each do |hash|
      data = Rails.cache.read("t/#{hash['rid']}/m")
      data = build_thread(hash['rid']) unless data
      @response[:threads] << data
    end
    unless @response[:threads].empty?
      plus = 0
      plus = 1 if (total % amount) > 0
      @response[:pages] = (total / amount) + plus 
    end
    @response[:status] == 'success'
    respond!
  end

  def get_tag
    if ['~', 'favorites'].include?(params[:tag])
      @tag = params[:tag]
    else
      unless (@tag = Tag.where(alias: params[:tag]).first)
        @response[:status] = 'not found'
        return respond!
      end
    end
  end

  def process_post
    def get_password
      if params[:message].has_key?(:password)
        return params[:message][:password] unless params[:message][:password].empty?
      end
      return (100000000 + rand(1..899999999)).to_s
    end

    def processing_thread?
      @post.kind_of?(RThread)
    end

    def validate_content
      @post.r_file_id = 0 unless params[:file].kind_of?(String) and params[:video].empty?
      if @post.invalid? 
        @post.errors.to_hash.each_value do |array|
          array.each { |error| @response[:errors] << error }
        end
      end
      if @response[:errors].empty? and processing_thread?
        @tags = Array.new
        params[:tags].split(' ').each do |al|
          if (tag = Tag.where(alias: al).first) 
            @tags << tag unless (tag.alias == 'trash' or @tags.include?(tag))
          else
            @response[:errors] << t('errors.content.tags')
            break
          end
        end
        @tags << Tag.where(alias: 'b').first if @tags.empty?
      end
      if @response[:errors].empty?
        file_result = RFile.validate(params)
        if file_result.kind_of?(RFile)
          @post.r_file_id = file_result.id
          @file = file_result
        elsif file_result.kind_of?(Array)
          @response[:errors] += file_result
        else
          @post.r_file_id = nil
        end
      end
      return @response[:errors].empty?
    end

    def validate_permission
      check_defence_token
      case @settings.defence[:dyson]
      when :tau
        if processing_thread?
          if (captcha = Captcha.where(key: session[:captcha]).first)
            unless captcha.defensive == true
              @response[:errors] << t('errors.dyson.tau') 
              set_captcha(true)
              @tau = true
            end
          end
        end
      when :sigma
        @response[:errors] << t('errors.dyson.sigma') if processing_thread?
      when :omicron
        @response[:errors] << t('errors.dyson.omicron') if @token == nil
      end
      return false unless @response[:errors].empty?
      set_defence_token if @token == nil
      if @ip.banned?
        @response[:errors] << t('errors.banned')
        @response[:ban] = @ip.ban.jsonify
        return false
      end
      if @ip.post_captcha_needed or @settings.defence[:dyson] != nil
        validate_captcha
        @response[:errors] << t('errors.captcha.old') if @captcha == nil
        @response[:errors] << t('errors.captcha.invalid') if @captcha == false
        @ip.post_captcha_needed = false if @captcha == true
      end
      if processing_thread?
        @checking = @ip.last_thread
        limit = @settings.defence[:speed_limits][:ip][:thread]
      else
        @checking = @ip.last_post
        limit = @settings.defence[:speed_limits][:ip][:post]
        if (@thread = RThread.get_by_rid(params[:rid].to_i))
          @post.r_thread_id = @thread.id
        else
          return not_found
        end
      end
      delta = (Time.now - @checking).to_i
      if delta < limit
        @response[:errors] << t('errors.speed_limit.ip') + Verbose::seconds(limit - delta)
      end
      return @response[:errors].empty?
    end

    @ip = Ip.get(request.remote_ip.to_s)
    @response[:errors] = Array.new
    @settings = SettingsRecord.get
    @post = RThread.new(params[:message]) if params[:action] == 'create'
    @post = RPost.new(params[:message]) if params[:action] == 'reply'
    logger.info @post.inspect
    validate_content if validate_permission
    if @response[:errors].empty?
      @post.rid = IdCounter.get_next_rid(processing_thread?)
      @post.ip_id = @ip.id
      @post.message = parse(@post.message)
      @post.defence_token_id = @token.id
      @post.save
      if @token.updated_at < (Time.now - 1.day)
        @token.updated_at = @post.created_at
        @token.save
      end
      @tags.each { |tag| @post.tags << tag } if processing_thread?
      CometController.publish('/counters', get_counters)
      if processing_thread?
        limit = @settings.defence[:speed_limits][:captcha][:thread]
        post_json = @post.jsonify([@file])
        Rails.cache.write("t/#{@post.rid}/f", post_json)
        Rails.cache.write("t/#{@post.rid}/m", post_json)
        @response[:thread_rid] = @post.rid
        now = Time.now
        start_of_hour = Time.new(now.year, now.month, now.day, now.hour)
        threads_per_hour = RThread.where(created_at: start_of_hour..now).count
        if threads_per_hour > @settings.defence[:speed_limits][:tau]
          @settings.defence[:dyson] = :tau
          @settings.save
        end
      else
        limit = @settings.defence[:speed_limits][:captcha][:post]
        post_json = @post.jsonify([@file], @thread.rid)
        CometController.publish("/thread/#{@thread.rid}", post_json)
        if params.has_key?(:returnpost) 
          @response[:post] = post_json 
        else
          @response[:post_rid] = @post.rid
        end
      end
      delta = Time.now - @checking
      @ip.post_captcha_needed = true if delta.to_i < limit
      CometController.publish('/live', post_json)
      @response[:status] = 'success'
      @ip.update_last(@post)
    end
    @response[:status] = 'fail' unless @response[:errors].empty?
    @ip.post_captcha_needed = true unless @settings.defence[:dyson] == nil
    set_captcha if @ip.post_captcha_needed and not @tau
    respond!
  end
end
