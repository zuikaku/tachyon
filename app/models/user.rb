class User < ActiveRecord::Base
  serialize :hidden, Array
  serialize :settings, Hash
  serialize :seen, Hash
  serialize :favorites, Array

  before_create do 
    while true
      self.hashname = Digest::MD5::hexdigest(rand(99999999).to_s)
      break if (User.where(hashname: self.hashname).first) == nil
    end
  end
end
