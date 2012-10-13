class Moder < ActiveRecord::Base
  validates_presence_of     :hashed_password, :level
  validates_uniqueness_of   :hashed_password

  attr_accessor   :password

  def password=(pass)
    @password = pass
    self.hashed_password = Moder.encrypt_password(@password)
  end

  def self.encrypt_password(password)
    return Digest::SHA1.hexdigest(password + SALT)
  end

  def self.authorize(password)
    return Moder.where(hashed_password: Moder.encrypt_password(password).first)
  end
end
