# Load the rails application
require File.expand_path('../application', __FILE__)

RANDOM = 'RANDOM()' if Rails.env.development?
RANDOM = 'RAND()' if Rails.env.production?

Haml::Template.options[:format]     = :html5

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

# Initialize the rails application
Tachyon::Application.initialize!
Rails.cache.clear
