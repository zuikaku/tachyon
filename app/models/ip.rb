class Ip < ActiveRecord::Base
  has_many  :r_threads
  has_many  :r_posts
  has_many  :r_files
  has_one   :ban

  def self.get(address)
    unless (ip = Ip.where(address: address).first)
      ip = Ip.create({
        address:     address,
        last_thread: Time.now - 10.minutes,
        last_post:   Time.now - 10.minutes, 
      })
    end
    return ip
  end

  def get_ban
    if (ban = self.ban)
      if Time.now > ban.expires
        ban.destroy
        return nil
      end
    end
    return ban
  end

  def ban_ip(reason, expiration_date, moder_id)
    Ban.create({
      reason:   reason,
      expires:  expiration_date, 
      ip_id:    self.id,
      level:    1,
      moder_id: moder_id
    })
  end
end
