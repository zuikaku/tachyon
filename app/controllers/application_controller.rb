class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter do
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
    set_captcha
    respond!
  end

  protected
  def respond!
    unless (posts = Rails.cache.read("post_count"))
      posts = RPost.where(created_at: Time.now.at_midnight..Time.now).count
      posts += RThread.where(created_at: Time.now.at_midnight..Time.now).count
      Rails.cache.write("post_count", posts)
    end
    @response[:counters] = {
      online: Ip.where(updated_at: (Time.now - 7.minutes)..Time.now).count,
      posts: posts,
    }
    return render(json: @response.to_json)
  end

  def not_found
    @response[:status] = 'not found'
    respond!
  end

  def set_captcha
    @response[:captcha] = Captcha.get_key(false)
  end
end
