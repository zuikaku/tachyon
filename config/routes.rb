Tachyon::Application.routes.draw do
  root to: 'application#index'

  faye_server '/comet', timeout: 180 

  scope "utility" do 
    match 'get_tags'    => 'application#get_tags', via: 'post'
  end

  match 'thread/:rid' => 'threads#show', constraints: { rid: /\d+/ }
  match 'thread/:rid/reply' => 'threads#reply', constraints: { rid: /\d+/ }
  match 'create' => 'threads#create'
  match ':tag' => 'threads#index'
  match ':tag/page/:page' => 'threads#page', constraints: { page: /\d+/ }
  match '*path' => 'application#index';
end
