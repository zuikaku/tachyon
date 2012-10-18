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
      not_found
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

  def reply
    process_post
  end

  private
  def build_thread(rid)
    minimal = (params[:action] != 'show')
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
    @response[:status] = 'success'
    @response[:threads] = Array.new
    offset = (page_number * 10) - 10
    if @tag == '~'
      thread_rids = RThread.find(:all, select: 'rid', order: 'bump DESC', limit: 10, offset: offset)
      pages = RThread.count
    else
      thread_rids = RThread.connection.select_all("SELECT r_threads.rid FROM r_threads
        INNER JOIN r_threads_tags ON r_threads_tags.r_thread_id = r_threads.id 
        INNER JOIN tags ON tags.id = r_threads_tags.tag_id WHERE tags.alias = '#{@tag.alias}'
        ORDER BY bump DESC LIMIT 10 OFFSET #{offset}")
      pages = RThread.joins(:tags).where("tags.alias = ?", @tag.alias).count
    end
    return not_found if page_number > pages
    thread_rids.each do |hash|
      data = Rails.cache.read("t/#{hash['rid']}/m")
      data = build_thread(hash['rid']) unless data
      @response[:threads] << data
    end
    plus = 0
    plus = 1 if (pages % 10) > 0
    @response[:pages] = (pages / 10) + plus
    @response[:status] == 'success'
    respond!
  end

  def get_tag
    if params[:tag] == '~'
      @tag = '~'
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
      unless @post.valid? # TODO: дописать валидации в модель
        @post.errors.to_hash.each_value do |array|
          array.each { |error| @response[:errors] << error }
        end
      end
      if @response[:errors].empty?
        @tags = Array.new
        params[:tags].split(' ').each do |al|
          if (tag = Tag.where(alias: al).first) 
            @tags << tag unless (tag.alias == 'trash' or @tags.include?(tag))
          else
            @response[:errors] << t('errors.tags_invalid')
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
        end
      end
      return @response[:errors].empty?
    end

    def validate_permission
      if @ip.banned?
        @response[:errors] << t('errors.banned')
        @response[:ban] = @ip.ban.jsonify
        return false
      end
      if processing_thread?
        checking = @ip.last_thread
        limit = @settings.thread_posting_speed
      else
        checking = @ip.last_post
        limit = @settings.reply_posting_speed
        if (@thread = RThread.get_by_rid(params[:rid].to_i))
          @post.r_thread_id = @thread.id
        else
          return not_found
        end
      end
      delta = Time.now - checking
      @response[:errors] << t('errors.posting_too_fast') if delta.to_i < limit
      return @response[:errors].empty?
    end

    @response[:errors] = Array.new
    @settings = SettingsRecord.get
    @post = RThread.new(params[:message]) if params[:action] == 'create'
    @post = RPost.new(params[:message]) if params[:action] == 'reply'
    sleep 0.5
    validate_content if validate_permission
    if @response[:errors].empty?
      @post.rid = IdCounter.get_next_rid(processing_thread?)
      @post.ip_id = @ip.id
      if processing_thread?
        @tags.each { |tag| @post.tags << tag }
      else
        Rails.cache.delete("t/#{@thread.rid}/f") 
        Rails.cache.delete("t/#{@thread.rid}/m") 
        RThread.order('bump DESC').last.destroy if RThread.count > @settings.max_threads
      end
      @post.message = parse(@post.message)
      @post.save
      if (post_count = Rails.cache.read('post_count'))
        Rails.cache.write('post_count', post_count + 1)
      end
      CometController.publish('/counters', get_counters)
      unless processing_thread?
        post_json = @post.jsonify([@file], @thread.rid)
        CometController.publish('/live', post_json)
        CometController.publish("/thread/#{@thread.rid}", post_json)
      else
        post_json = @post.jsonify([@file])
        CometController.publish('/live', post_json)
        @response[:thread] = post_json
      end
      @response[:status] = 'success'
      @ip.update_last(@post)
    end
    @response[:status] = 'fail' unless @response[:errors].empty?
    respond!
  end
end
