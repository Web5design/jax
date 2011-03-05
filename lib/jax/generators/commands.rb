require 'thor'
require 'thor/group'

module Jax
  module Generators
    autoload :App,        File.join(File.dirname(__FILE__), "app/app_generator")
    autoload :Controller, File.join(File.dirname(__FILE__), "controller/controller_generator")
    autoload :Model,      File.join(File.dirname(__FILE__), "model/model_generator")
  end
end
