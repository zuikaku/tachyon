# coding: utf-8

module Verbose
  def self.seconds(amount)
    result = "#{amount} секунд"
    amount_mod = amount %  10
    if (2..4).include?(amount_mod) and not (12..14).include?(amount % 100)
      result + 'ы.' 
    elsif amount_mod != 1 or amount == 11
      result + '.'
    else
      result + 'у.'
    end
  end
end