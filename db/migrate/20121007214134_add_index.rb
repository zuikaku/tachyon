class AddIndex < ActiveRecord::Migration
  def change
    add_index  :defence_tokens, :hash, unique: true
  end
end
