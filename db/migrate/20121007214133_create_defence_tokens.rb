class CreateDefenceTokens < ActiveRecord::Migration
  def change
    create_table :defence_tokens do |t|
      t.string :hash
      t.timestamps
    end

    remove_column :settings_records, :spamtxt
    remove_column :settings_records, :thread_posting_speed
    remove_column :settings_records, :reply_posting_speed
    remove_column :settings_records, :defence_mode
    remove_column :settings_records, :spamtxt_enabled
    remove_column :settings_records, :new_threads_to_trash
    remove_column :settings_records, :cookie_barrier

    add_column :r_threads, :defence_token_id, :integer
    add_index  :r_threads, :defence_token_id
    add_column :r_posts,   :defence_token_id, :integer
    add_index  :r_posts,   :defence_token_id

    add_column :settings_records, :defence, :text
  end
end
