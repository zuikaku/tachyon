class RPost < ActiveRecord::Base
  belongs_to  :r_thread
  belongs_to  :r_file
  belongs_to  :ip

  serialize :replies_rids, Array

  validates_length_of :message,     maximum: 5000
  validates_length_of :title,       maximum: 60
  validates_length_of :password,    maximum: 50

  before_create do
    self.replies_rids = Array.new
    self.r_thread.replies_count += 1
    self.r_thread.bump = self.created_at unless self.sage
    self.r_thread.save
  end

  before_destroy do
    if (thread = self.r_thread)
      previous = thread.r_posts.offset(thread.replies_count-2).limit(1).first
      thread.bump = previous.created_at
      thread.replies_count -= 1
      thread.save
    end
    self.r_file.destroy if self.has_file?
    regexp = /<div class='post_link'><a href='.{3,25}\/(\d+).html#i(\d+)'>&gt;&gt;(\d+)<\/a><\/div>/
    self.message.scan(regexp).each do |link|
      post = RPost.where(rid: link[1].to_i).first
      post = RThread.where(rid: link[1].to_i).first unless post
      if post
        post.replies_rids.each do |hash|
          post.replies_rids.delete(hash) if hash[:post] == self.rid
        end
        post.save
      end
    end
  end

  def self.get_by_rid(rid)
    return self.where(rid: rid).first
  end

  def has_file?
    return (self.r_file_id != nil)
  end

  def jsonify(files, thread_rid)
    data = {
        rid:            self.rid,
        message:        self.message,
        title:          self.title,
        replies_rids:   self.replies_rids,
        sage:           self.sage,
        thread_rid:     thread_rid,
        created_at:     self.created_at,
        file:           nil,
      }
    if self.has_file?
      files.each do |file|
        if file.id == self.r_file_id
          data[:file] = file.jsonify
          break
        end
      end
    end
    return data
  end
end
