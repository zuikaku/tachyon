class SettingsRecord < ActiveRecord::Base
  table_name :settings_records_new
  serialize :allowed_file_types,  Array
  serialize :defence,             Hash

  before_create do 
    allowed =   %w( image/png image/jpeg image/gif application/octet-stream )
    allowed +=  %w( application/x-rar-compressed application/zip application/x-shockwave-flash )
    self.allowed_file_types = allowed
    self.defence = {
      spamtxt: {
        enabled:  false,
        words:    Array.new,
      },
      speed_limits: {
        ip:       { thread: 2.minutes,  post: 13.seconds },
        captcha:  { thread: 10.minutes, post: 30.seconds },
        global:   { thread: 1.minute,   post: 0.seconds  },
        tau:      3, # threads per hour before automatic Tau mode
      },
      dyson: nil, 
    }
  end

  def self.get
    record = SettingsRecord.create unless (record = SettingsRecord.first)
    return record
  end

  def allowed_array
    allowed = Array.new
    self.allowed_file_types.each do |type|
      allowed << type.split('/')[1].upcase
    end
    return allowed
  end
end
