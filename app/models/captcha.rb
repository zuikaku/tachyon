# coding: utf-8

class Captcha < ActiveRecord::Base
  validates_presence_of     :key, :word
  validates_uniqueness_of   :key, :word

  before_create do 
    old_captcha.destroy if (old_captcha = Captcha.where(word: self.word).first)
    old_captcha.destroy if (old_captcha = Captcha.where(key: self.key).first)
  end

  def self.get_word(cancer=false)
    if cancer
      words = [
        ['ху',     %w( йня ета ец ёк ита ищще ево евый й якс йнул )],
        ['пост',   %w( ы им  ил )],
        ['тред',   ['ы', '']],
        ['борд',   %w( ы а )],
        ['бан',    %w( ы ил  им или )],
        ['вин',    %w( ы ный ищще отА рар же )],
        ['фейл',   %w( ил  овый ишь ю им ед )],
        ['анон',   %w( ы  чик чики им имы имус имусы )],
        ['сосн',   %w( у увшим ешь ули ул улей ицкий и )],
        ['двач',   %w( ер  еры и ру ую уем евал евать )],
        ['бамп',   %w( ы  аю аем ну нул нем нут нутый )],
        ['быдл',   %w( а о обыдло ина ан ецо )],
        ['говн',   %w( ы а о ина ецо апоешь )],
        ['нульч',  %w( ер  еры ую ан )],
        ['педал',  %w( и ик ьный ьчан )],
        ['петуш',  %w( ок ки ня ила )],
        ['школ',   %w( ьник ьники ота отень яр яры )],
        ['слоу',   %w( пок  бро кинг )],
        ['ра',     %w( к ки чки чок ковый )],
        ['суп',    %w( ец б )],
        ['форс',   %w( ед  едмем ил или им ят ер )],
        ['са',     %w( жа гАю жАскрыл ге гануть жица )],
        ['вайп',   %w( ер  алка ы ну нуть нули нутый ают али нут )],
        ['ло',     %w( ли л лд ло ик лоло )],
        ['лигион', %w( ер еры   )],
        ['набе',   %w( г ги гаем жали )],
        ['лепр',   %w( а оеб )],
        ['илит',   %w( а ка ный )],
        ['ньюфа',  %w( г ги жек жина жный )],
        ['олдфа',  %w( г ги жек жина жный )],
        ['шлю',    %w( ха хи шка шки хиненужны )],
        ['пизд',   %w( а ец ецовый атый ато уй )],
        ['кукло',  %w( еб ебы бляди )],
        ['',       %w( опхуй десу ормт кококо пошелвон кинцо новэй груша цэпэ )],
        ['',       %w( безногим анома номад пистон атятя зой викентий вакаба )],
        ['',       %w( омикрон фрипорт мудрец капча сейдж ололо пахом параша )],
        ['',       %w( номадница игортонет игорнет ногаемс ноугеймс форчан )],
        ['',       %w( бугурт бомбануло баттхерт бутхурт багет пека йоба схб )],
        ['',       %w( инвайт вечервхату сгущенка пригорело пукан пердак пердачелло )],
        ['',       %w( рулетка деанон дионон кулстори хлебушек блогистан тыхуй )],
        ['',       %w( омск гитлер хохлы анимеговно двощ двощер двощи петух )],
        ['',       %w( шишка братишка поехавший лишнийствол удафком подтирач )],
        ['',       %w( хачи трубашатал ненависть рейдж алсо посаны ролл сладкийхлеб )],
        ['',       %w( малаца батя зделоли графон дрейкфейс короли джаббер писечка )],
        ['',       %w( номадница пативэн свиборг корован трент фрилансер кровь кишки )],
        ['',       %w( всесоснули сосач макака абу моча уебывай съеби трололо колчан )],
        ['',       %w( пекацефал мыльцо тян тня розенмейден октокот хикка )]
      ]
      word = words[rand(0..words.length-1)]
      word = word[0] + word[1][rand(0..word[1].length-1)]
    else
      letters = %w( ё й ц у к е н г ш щ з х ъ ф ы в а п р о л д ж э )
      letters += %w( я ч с м и т ь б ю )
      word = String.new
      while word.length < rand(5..8)
        word += letters[rand(0..letters.length) - 1]
      end
    end
    return word
  end

  def self.get_key(defence)
    if (record = Captcha.first(order: RANDOM))
      if record.defensive == defence
        time_passed = Time.now - record.created_at
        if time_passed > 3.minutes and time_passed < 6.minutes
          return record.key
        elsif time_passed > 6.minutes
          Captcha.where("created_at < ?", (Time.now - 6.minutes)).destroy_all
        end
      end
    end
    if defence
      # ololo
      word = String.new
      word += Captcha.get_word
      word += Captcha.get_word
      word += Captcha.get_word
      word += Captcha.get_word + "\n"
      word += Captcha.get_word
      word += Captcha.get_word
      word += Captcha.get_word
      word += Captcha.get_word + "\n"
    else
      word = Captcha.get_word(cancer: true)
    end
    key  = rand(89999999)
    return key if Captcha.create(word: word, key: key, defensive: defence)
  end
end
