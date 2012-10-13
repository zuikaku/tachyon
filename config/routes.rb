Tachyon::Application.routes.draw do
  root to: 'application#index'

  scope "utility" do 
    match 'get_tags' => 'application#get_tags', via: 'post'
  end

  match ':tag' => 'threads#index'
  match 'thread/:rid' => 'threads#show', constraints: { rid: /\d+/ }
end
