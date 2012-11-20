date = Time.now
date = "-#{date.month}-#{date.year}"
begin
  system("rm -r /srv/tachyon/backups/files/#{(Time.now - (3*86400)).day}#{date}")
  system("rm /srv/tachyon/backups/database/#{(Time.now - (3*86400)).day}#{date}.mysql2")
rescue 
  # fuck it
end
system("cp -r /srv/tachyon/engine/public/files /srv/tachyon/backups/files/#{Time.now.day}#{date}")
system("thin -C /srv/tachyon/engine/config/thin.yml stop -T0")
system("mysqldump -utrent -prosenkristall freeport7 > /srv/tachyon/backups/database/#{Timw.now.day}#{date}")
system("thin -C /srv/tachyon/engine/config/thin.yml start")