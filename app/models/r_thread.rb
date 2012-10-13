class RThread < ActiveRecord::Base
  has_and_belongs_to_many :tags
  has_many                :r_posts
  has_many                :last_posts, class_name: RPost, order: "id DESC", limit: 5
  belongs_to              :r_file
  belongs_to              :ip

  serialize :replies_rids, Array

  validates_length_of   :message,   maximum: 5000
  validates_length_of   :title,     maximum: 60
  validates_length_of   :password,  maximum: 50

  before_create do
    self.bump = Time.now
    self.replies_rids = Array.new
  end

  before_destroy do
    self.r_posts.destroy_all
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

  def self.random
    uncached do
      return self.first(order: RANDOM)
    end
  end

  def has_file?
    return (self.r_file_id != nil)
  end

  def tags_aliases
    result = Array.new
    self.tags.each do |tag|
      result << tag.alias
    end
    return result
  end

  def tags_names
    result = Array.new
    self.tags.each do |tag|
      result << tag.name
    end
    return result
  end

  def jsonify(files)
    data = {
        rid:            self.rid,
        message:        self.message,
        title:          self.title,
        replies_rids:   self.replies_rids,
        replies_count:  self.replies_count,
        created_at:     self.created_at,
        posts:          Array.new,
        file:           nil,
        tags:           self.tags_jsonify,
      }
    if self.has_file?
      files.each do |file|
        if file.id == self.r_file_id
          data[:file] = {
            filename:   file.filename,
            size:       file.size,
            extension:  file.extension,
            url_full:   file.url_full,
            url_small:  file.url_small,
            is_picture: file.picture?,
            columns:    file.columns,
            rows:       file.rows,
            thumb_rows: file.thumb_rows,
            thumb_columns: file.thumb_columns,
            video_duration: file.video_duration,
            video_title: file.video_title
          }
          break
        end
      end
    end
    return data
  end

  def tags_jsonify 
    result = Array.new
    self.tags.each do |tag|
      result << {alias: tag.alias, name: tag.name}
    end
    return result
  end

  def last_replies(number)
    self.r_posts.order('created_at DESC').limit(number).to_a.reverse
  end
end
