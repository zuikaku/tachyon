Tachyon::Application.routes.draw do
  root to: 'application#index'

  faye_server '/comet', timeout: 180 

  scope "utility" do 
    match 'get_tags'    => 'application#get_tags', via: 'post'
    match 'get_post'    => 'threads#get_post', via: 'post'
    match 'ping'        => 'application#ping', via: 'post'
  end

  match 'live' => 'threads#live'
  match 'thread/:rid' => 'threads#show', constraints: { rid: /\d+/ }
  match 'thread/:rid/reply' => 'threads#reply', constraints: { rid: /\d+/ }
  match 'thread/:rid/expand' => 'threads#expand', constraints: { rid: /\d+/ }
  match 'create' => 'threads#create'
  match ':tag' => 'threads#index'
  match ':tag/page/:page' => 'threads#page', constraints: { page: /\d+/ }
  match '*path' => 'threads#index';
end
