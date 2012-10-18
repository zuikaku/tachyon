class CometController < FayeRails::Controller
  # observe RThread, :after_create do |thread|
  #   response = {
  #     thread: thread.jsonify,
  #     counters: {
  #       online: Ip.where(updated_at: (Time.now - 7.minutes)..Time.now).count,
        
  #     }
  #   }
  #   CometController.publish("/live", thread.jsonify)
  # end

  # observe RPost, :after_create do |post|
  #   post = post.jsonify
  #   rid = post[:thread_rid]
  #   post = post.to_json
  #   CometController.publish('live', post)
  #   CometController.publish("/thread/#{rid}", post)
  # end
end
