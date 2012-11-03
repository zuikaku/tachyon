class ChangeHashname < ActiveRecord::Migration
  def change
    remove_column :defence_tokens, :hash
    add_column    :defence_tokens, :hashname, :string, unique: true  
  end
end
