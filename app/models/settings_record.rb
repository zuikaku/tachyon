class SettingsRecord < ActiveRecord::Base
  serialize :allowed_file_types, Array
  serialize :spamtxt, Array

  def self.get
    unless (record = SettingsRecord.first)
      allowed = %w( image/png image/jpeg image/gif application/octet-stream )
      allowed += %w( application/x-rar-compressed application/zip application/x-shockwave-flash )
      record = SettingsRecord.create(allowed_file_types: allowed)
    end
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
