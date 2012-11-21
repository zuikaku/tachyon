require File.expand_path('../boot', __FILE__)
require 'rails/all'

if defined?(Bundler)
  Bundler.require(*Rails.groups(:assets => %w(development test)))
end

module Tachyon
  class Application < Rails::Application
    config.i18n.default_locale = :ru
    config.encoding = "utf-8"
    config.filter_parameters += ["message[password]", "password"]
    config.assets.enabled = true
    config.assets.version = "1.07.423"
  end
end
