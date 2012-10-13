class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter do
    return render('index') if request.get? and request.headers["REQUEST_PATH"] != "/"
    @response = { counters: {posts: rand(300), online: rand(100)} }
  end

  def index
  end

  def get_tags
    @response[:tags] = Tag.all.to_json 
    respond!
  end

  protected
  def respond!
    return render(json: @response.to_json)
  end
end
