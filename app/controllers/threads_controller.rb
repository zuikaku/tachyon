class ThreadsController < ApplicationController
  before_filter do 
    get_tag if ['index', 'page'].include?(params[:action])
  end

  def index
    show_page(1)
  end

  def show 
    thread_rid = RThread.connection.select_all("SELECT r_threads.rid 
        FROM r_threads WHERE r_threads.rid = #{params[:rid].to_i} LIMIT 1")
    if thread_rid.empty?
      @response[:status] = 'not_found'
    else
      Rails.cache.delete("t/#{thread_rid[0]['rid']}/f")
      data = Rails.cache.read("t/#{thread_rid[0]['rid']}/f")
      data = build_thread(thread_rid[0]['rid']) unless data
      @response[:thread] = data
    end
    respond!
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
    thread_rids.each do |hash|
      data = Rails.cache.read("t/#{hash['rid']}/m")
      data = build_thread(hash['rid']) unless data
      @response[:threads] << data
    end
    plus = 0
    plus = 1 if (pages % 10) > 0
    @response[:pages] = (pages / 10) + plus
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
end
