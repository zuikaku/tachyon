class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string    :hashname
      t.text      :settings
      t.text      :hidden
      t.text      :seen
      t.text      :favorites

      t.timestamps
    end

    add_index :users, :hashname, unique: true
  end
end
