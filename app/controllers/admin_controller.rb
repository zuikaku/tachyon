class AdminController < ApplicationController
  before_filter do 
    unless params[:action] == 'login' 
      @moder = Moder.find(session[:moder_id])
      return not_found unless @moder
    end
  end

  def login
    if (@moder = Moder.authorize(params[:password].to_s))
      session[:moder_id] = @moder.id
      @response[:status] = 'success'
    else 
      @response[:status] = 'fail'
      @response[:errors] = [t('errors.login')]
    end
    respond!
  end

  def get_settings
    @defence = SettingsRecord.get.defence
    render(layout: nil)
  end

  def set_settings
    settings = SettingsRecord.get
    defence = settings.defence
    if params[:dyson] == ""
      defence[:dyson] = nil
    else
      defence[:dyson] = params[:dyson].to_sym
    end
    defence[:speed_limits] = {
      tau: params[:speed_limits][:tau].to_i,
      ip: {
        thread: params[:speed_limits][:ip][:thread].to_i,
        post: params[:speed_limits][:ip][:post].to_i,
      },
      captcha: {
        thread: params[:speed_limits][:captcha][:thread].to_i,
        post: params[:speed_limits][:captcha][:post].to_i,
      },
      global: params[:speed_limits][:global].to_i
    }
    spamtxt_enabled = false
    if params[:spamtxt].has_key?(:enabled)
      spamtxt_enabled = true if params[:spamtxt][:enabled] == 'on'
    end
    defence[:spamtxt][:enabled] = spamtxt_enabled
    defence[:spamtxt][:words] = Array.new
    params[:spamtxt][:words].split("\n").each do |word|
      word.strip!
      defence[:spamtxt][:words] << Regexp.new(word) unless word.empty?
    end
    settings.save
    @response[:status] = 'success'
    respond!
  end
end
