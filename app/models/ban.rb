class Ban < ActiveRecord::Base
  belongs_to :ip

  validates_presence_of :expires
  
  before_create do 
    old_ban.destroy if (old_ban = self.ip.ban)
  end
end
