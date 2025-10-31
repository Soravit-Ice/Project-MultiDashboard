import natural from 'natural';
import compromise from 'compromise';

// English spell checker using natural - Extended dictionary
const spellcheck = new natural.Spellcheck([
  // Articles & Pronouns
  'the', 'a', 'an', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  
  // Common Verbs
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'done',
  'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came', 'coming',
  'make', 'makes', 'made', 'making', 'take', 'takes', 'took', 'taken', 'taking',
  'get', 'gets', 'got', 'gotten', 'getting', 'give', 'gives', 'gave', 'given', 'giving',
  'see', 'sees', 'saw', 'seen', 'seeing', 'know', 'knows', 'knew', 'known', 'knowing',
  'think', 'thinks', 'thought', 'thinking', 'say', 'says', 'said', 'saying',
  'tell', 'tells', 'told', 'telling', 'ask', 'asks', 'asked', 'asking',
  'work', 'works', 'worked', 'working', 'play', 'plays', 'played', 'playing',
  'want', 'wants', 'wanted', 'wanting', 'need', 'needs', 'needed', 'needing',
  'like', 'likes', 'liked', 'liking', 'love', 'loves', 'loved', 'loving',
  'use', 'uses', 'used', 'using', 'find', 'finds', 'found', 'finding',
  'try', 'tries', 'tried', 'trying', 'call', 'calls', 'called', 'calling',
  'feel', 'feels', 'felt', 'feeling', 'become', 'becomes', 'became', 'becoming',
  'leave', 'leaves', 'left', 'leaving', 'put', 'puts', 'putting',
  'mean', 'means', 'meant', 'meaning', 'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting', 'begin', 'begins', 'began', 'begun', 'beginning',
  'seem', 'seems', 'seemed', 'seeming', 'help', 'helps', 'helped', 'helping',
  'show', 'shows', 'showed', 'shown', 'showing', 'hear', 'hears', 'heard', 'hearing',
  'run', 'runs', 'ran', 'running', 'move', 'moves', 'moved', 'moving',
  'live', 'lives', 'lived', 'living', 'believe', 'believes', 'believed', 'believing',
  'bring', 'brings', 'brought', 'bringing', 'happen', 'happens', 'happened', 'happening',
  'write', 'writes', 'wrote', 'written', 'writing', 'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing',
  'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting',
  'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing',
  'set', 'sets', 'setting', 'learn', 'learns', 'learned', 'learning',
  'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading',
  'understand', 'understands', 'understood', 'understanding', 'watch', 'watches', 'watched', 'watching',
  'follow', 'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping',
  'create', 'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'spoken', 'speaking',
  'read', 'reads', 'reading', 'allow', 'allows', 'allowed', 'allowing',
  'add', 'adds', 'added', 'adding', 'spend', 'spends', 'spent', 'spending',
  'grow', 'grows', 'grew', 'grown', 'growing', 'open', 'opens', 'opened', 'opening',
  'walk', 'walks', 'walked', 'walking', 'win', 'wins', 'won', 'winning',
  'offer', 'offers', 'offered', 'offering', 'remember', 'remembers', 'remembered', 'remembering',
  'consider', 'considers', 'considered', 'considering', 'appear', 'appears', 'appeared', 'appearing',
  'buy', 'buys', 'bought', 'buying', 'wait', 'waits', 'waited', 'waiting',
  'serve', 'serves', 'served', 'serving', 'die', 'dies', 'died', 'dying',
  'send', 'sends', 'sent', 'sending', 'expect', 'expects', 'expected', 'expecting',
  'build', 'builds', 'built', 'building', 'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'fallen', 'falling', 'cut', 'cuts', 'cutting',
  'reach', 'reaches', 'reached', 'reaching', 'kill', 'kills', 'killed', 'killing',
  'remain', 'remains', 'remained', 'remaining', 'suggest', 'suggests', 'suggested', 'suggesting',
  'raise', 'raises', 'raised', 'raising', 'pass', 'passes', 'passed', 'passing',
  'sell', 'sells', 'sold', 'selling', 'require', 'requires', 'required', 'requiring',
  'report', 'reports', 'reported', 'reporting', 'decide', 'decides', 'decided', 'deciding',
  'pull', 'pulls', 'pulled', 'pulling',
  
  // Prepositions & Conjunctions
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'since',
  'without', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'than',
  'so', 'though', 'although', 'whether', 'nor', 'yet',
  
  // Adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
  'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young',
  'important', 'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'sure',
  'clear', 'major', 'likely', 'dead', 'difficult', 'ready', 'simple', 'left', 'late',
  'hard', 'real', 'top', 'whole', 'alone', 'certain', 'recent', 'available', 'free',
  'happy', 'sorry', 'glad', 'nice', 'fine', 'beautiful', 'wonderful', 'terrible',
  'easy', 'hard', 'fast', 'slow', 'quick', 'hot', 'cold', 'warm', 'cool',
  'clean', 'dirty', 'full', 'empty', 'strong', 'weak', 'heavy', 'light',
  'dark', 'bright', 'loud', 'quiet', 'soft', 'hard', 'smooth', 'rough',
  'safe', 'dangerous', 'rich', 'poor', 'cheap', 'expensive', 'correct', 'wrong',
  
  // Adverbs
  'not', 'now', 'just', 'very', 'too', 'also', 'well', 'only', 'even', 'back',
  'there', 'down', 'still', 'out', 'then', 'more', 'so', 'much', 'any', 'most',
  'again', 'really', 'always', 'never', 'often', 'sometimes', 'usually', 'already',
  'almost', 'quite', 'perhaps', 'maybe', 'probably', 'certainly', 'definitely',
  'quickly', 'slowly', 'carefully', 'easily', 'hardly', 'nearly', 'finally',
  
  // Nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'thing', 'woman', 'life', 'child',
  'world', 'school', 'state', 'family', 'student', 'group', 'country', 'problem',
  'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question',
  'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother',
  'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye',
  'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
  'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body',
  'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door',
  'health', 'person', 'art', 'war', 'history', 'party', 'result', 'change', 'morning',
  'reason', 'research', 'girl', 'guy', 'moment', 'air', 'teacher', 'force', 'education',
  'food', 'phone', 'computer', 'internet', 'email', 'message', 'text', 'data',
  'hello', 'world', 'test', 'example', 'code', 'function', 'variable', 'string',
  'array', 'object', 'class', 'method', 'return', 'value', 'type', 'error',
  
  // Common words
  'yes', 'no', 'ok', 'okay', 'please', 'thanks', 'thank', 'sorry', 'excuse',
  'hello', 'hi', 'hey', 'bye', 'goodbye', 'welcome', 'congratulations',
  'today', 'tomorrow', 'yesterday', 'tonight', 'morning', 'afternoon', 'evening',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  
  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
  'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
  'ninth', 'tenth',
]);

// Thai common words dictionary - Extended
const thaiCommonWords = new Set([
  // คำทักทาย และคำสุภาพ
  'สวัสดี', 'ขอบคุณ', 'ครับ', 'ค่ะ', 'ขอโทษ', 'ยินดี', 'โปรด', 'กรุณา', 'เชิญ',
  
  // สรรพนาม
  'คุณ', 'ฉัน', 'ผม', 'ดิฉัน', 'เขา', 'เธอ', 'พวกเรา', 'พวกเขา', 'ท่าน', 'เรา', 'มัน',
  'ใคร', 'อะไร', 'ไหน', 'นี้', 'นั้น', 'นี่', 'นั่น', 'โน้น',
  
  // คำถาม
  'อะไร', 'ทำไม', 'อย่างไร', 'เมื่อไร', 'ที่ไหน', 'ใคร', 'เท่าไร', 'กี่', 'ไหม',
  
  // คำตอบ
  'ใช่', 'ไม่', 'ได้', 'ไม่ได้', 'เอา', 'ไม่เอา', 'ดี', 'ไม่ดี', 'โอเค', 'ตกลง',
  
  // กริยา (Verbs)
  'เป็น', 'มี', 'ไป', 'มา', 'ทำ', 'กิน', 'ดื่ม', 'นอน', 'ตื่น', 'นั่ง', 'ยืน', 'เดิน', 'วิ่ง',
  'พูด', 'คุย', 'บอก', 'ถาม', 'ตอบ', 'เล่า', 'อ่าน', 'เขียน', 'ฟัง', 'ดู', 'มอง', 'เห็น',
  'รู้', 'เข้าใจ', 'คิด', 'จำ', 'ลืม', 'เรียน', 'สอน', 'ทำงาน', 'เล่น', 'พัก', 'หยุด',
  'เริ่ม', 'จบ', 'ซื้อ', 'ขาย', 'ให้', 'รับ', 'เอา', 'ส่ง', 'ถือ', 'วาง', 'เปิด', 'ปิด',
  'ใช้', 'ช่วย', 'ทำให้', 'เปลี่ยน', 'แก้', 'สร้าง', 'ทำลาย', 'ล้าง', 'ทำความสะอาด',
  'ขับ', 'ขี่', 'บิน', 'ว่าย', 'โทร', 'ส่ง', 'รอ', 'หา', 'เจอ', 'พบ', 'เลือก', 'ตัดสินใจ',
  
  // คำคุณศัพท์ (Adjectives)
  'รัก', 'ชอบ', 'เกลียด', 'ดี', 'เลว', 'สวย', 'หล่อ', 'น่ารัก', 'น่าเกลียด', 'งาม', 'สวยงาม',
  'ใหญ่', 'เล็ก', 'สูง', 'เตี้ย', 'อ้วน', 'ผอม', 'ยาว', 'สั้น', 'กว้าง', 'แคบ', 'หนา', 'บาง',
  'หนัก', 'เบา', 'ร้อน', 'หนาว', 'เย็น', 'อุ่น', 'เปียก', 'แห้ง', 'สะอาด', 'สกปรก',
  'ใหม่', 'เก่า', 'เร็ว', 'ช้า', 'ง่าย', 'ยาก', 'ถูก', 'แพง', 'ฟรี', 'แพร่', 'หายาก',
  'มาก', 'น้อย', 'เยอะ', 'นิด', 'นิดหน่อย', 'เต็ม', 'ว่าง', 'ว่างเปล่า', 'ครบ', 'พอ',
  'ดัง', 'เงียบ', 'สว่าง', 'มืด', 'สดใส', 'หม่น', 'แจ่ม', 'ชัด', 'เลือน', 'คม', 'ทื่อ',
  'แข็ง', 'อ่อน', 'นุ่ม', 'กระด้าง', 'เหนียว', 'กรอบ', 'เปรี้ยว', 'หวาน', 'เค็ม', 'ขม', 'เผ็ด',
  'อร่อย', 'เลว', 'เน่า', 'สด', 'ใหม่', 'เก่า', 'ดิบ', 'สุก', 'ไหม้', 'จืด', 'มัน',
  'สำคัญ', 'จำเป็น', 'ควร', 'ต้อง', 'เด็ดขาด', 'แน่นอน', 'อาจ', 'คง', 'น่าจะ', 'ประมาณ',
  'ถูกต้อง', 'ผิด', 'จริง', 'เท็จ', 'ปลอม', 'แท้', 'ของแท้', 'ของปลอม',
  'ปลอดภัย', 'อันตราย', 'เสี่ยง', 'มั่นคง', 'แน่นอน', 'ไม่แน่นอน',
  'สุข', 'ทุกข์', 'เศร้า', 'ร่าเริง', 'เบิกบาน', 'หดหู่', 'เครียด', 'สบาย', 'ไม่สบาย',
  
  // คำนาม (Nouns)
  'คน', 'ผู้', 'ชาย', 'หญิง', 'เด็ก', 'ผู้ใหญ่', 'คนแก่', 'ทารก', 'เยาวชน', 'วัยรุ่น',
  'พ่อ', 'แม่', 'ลูก', 'พี่', 'น้อง', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'ลุง', 'ป้า', 'น้า', 'อา',
  'สามี', 'ภรรยา', 'แฟน', 'เพื่อน', 'คนรู้จัก', 'เพื่อนบ้าน', 'คนแปลกหน้า',
  'ครู', 'อาจารย์', 'นักเรียน', 'นักศึกษา', 'ศิษย์', 'หมอ', 'พยาบาล', 'ตำรวจ', 'ทหาร',
  'พนักงาน', 'ลูกจ้าง', 'นายจ้าง', 'เจ้านาย', 'หัวหน้า', 'ผู้จัดการ', 'ผู้อำนวยการ',
  
  // สถานที่
  'บ้าน', 'ที่', 'ที่นี่', 'ที่นั่น', 'ที่โน่น', 'ที่ไหน', 'ทุกที่', 'ไหนๆ',
  'โรงเรียน', 'มหาวิทยาลัย', 'วิทยาลัย', 'สถาบัน', 'ห้องเรียน', 'ห้องสมุด',
  'ที่ทำงาน', 'สำนักงาน', 'บริษัท', 'โรงงาน', 'ร้าน', 'ร้านค้า', 'ร้านอาหาร', 'ภัตตาคาร',
  'โรงพยาบาล', 'คลินิก', 'ศูนย์สุขภาพ', 'ร้านขายยา', 'เภสัชกร',
  'ตลาด', 'ห้างสรรพสินค้า', 'ห้าง', 'ซูเปอร์มาร์เก็ต', 'เซเว่น', 'มินิมาร์ท',
  'สนามบิน', 'สถานี', 'ท่าเรือ', 'ป้ายรถเมล์', 'ที่จอดรถ', 'ลานจอดรถ',
  'โรงแรม', 'รีสอร์ท', 'บังกะโล', 'ที่พัก', 'หอพัก', 'คอนโด', 'อพาร์ทเมนท์',
  'วัด', 'โบสถ์', 'มัสยิด', 'ศาลเจ้า', 'ศาลา', 'ศาล', 'ศาลากลาง',
  'สวน', 'สวนสาธารณะ', 'สวนสัตว์', 'สวนสนุก', 'สวนน้ำ', 'ชายหาด', 'ทะเล', 'ภูเขา',
  'ประเทศ', 'เมือง', 'จังหวัด', 'อำเภอ', 'ตำบล', 'หมู่บ้าน', 'ชุมชน', 'ย่าน', 'ซอย', 'ถนน',
  
  // เวลา
  'วัน', 'คืน', 'เช้า', 'สาย', 'เที่ยง', 'บ่าย', 'เย็น', 'ค่ำ', 'ดึก', 'เที่ยงคืน', 'รุ่งเช้า',
  'เดือน', 'ปี', 'ศตวรรษ', 'ทศวรรษ', 'ยุค', 'สมัย', 'ช่วง', 'ระยะ', 'ครั้ง', 'คราว',
  'เวลา', 'ชั่วโมง', 'นาที', 'วินาที', 'พักหนึ่ง', 'ครู่', 'ขณะ', 'ชั่วขณะ', 'ชั่วคราว',
  'วันนี้', 'เมื่อวาน', 'พรุ่งนี้', 'มะรืน', 'เดี๋ยวนี้', 'ตอนนี้', 'ขณะนี้', 'ปัจจุบัน',
  'อดีต', 'อนาคต', 'ก่อน', 'หลัง', 'ก่อนหน้า', 'ต่อไป', 'ถัดไป', 'ต่อมา',
  'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์',
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  
  // สัตว์
  'สัตว์', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'นก', 'ปลา', 'ช้าง', 'ม้า', 'วัว', 'ควาย', 'หมู',
  'ไก่', 'เป็ด', 'ห่าน', 'กระต่าย', 'หนู', 'งู', 'จระเข้', 'เต่า', 'กบ', 'คางคก',
  'ลิง', 'เสือ', 'สิงโต', 'หมี', 'กวาง', 'กระรอก', 'ค้างคาว', 'แมลง', 'ผีเสื้อ', 'ผึ้ง',
  
  // พืช
  'พืช', 'ต้นไม้', 'ไม้', 'ดอกไม้', 'ใบไม้', 'ผล', 'ผลไม้', 'ผัก', 'หญ้า', 'ป่า', 'ดง',
  
  // อาหาร
  'อาหาร', 'น้ำ', 'ข้าว', 'ผัก', 'ผลไม้', 'เนื้อ', 'ปลา', 'ไข่', 'นม', 'ขนม', 'ของหวาน',
  'ก๋วยเตี๋ยว', 'ข้าวผัด', 'ส้มตำ', 'ต้มยำ', 'แกง', 'ยำ', 'ลาบ', 'น้ำพริก', 'พริก',
  'น้ำตาล', 'เกลือ', 'น้ำปลา', 'ซีอิ๊ว', 'น้ำมัน', 'เนย', 'เนยแข็ง', 'โยเกิร์ต',
  'กาแฟ', 'ชา', 'น้ำผลไม้', 'น้ำอัดลม', 'เบียร์', 'ไวน์', 'เหล้า', 'สุรา',
  
  // ตัวเลข
  'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ',
  'สิบเอ็ด', 'ยี่สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน', 'สิบล้าน', 'ร้อยล้าน', 'พันล้าน',
  'ครึ่ง', 'หนึ่งในสอง', 'หนึ่งในสาม', 'หนึ่งในสี่', 'สามในสี่',
  'ที่หนึ่ง', 'ที่สอง', 'ที่สาม', 'ที่สี่', 'ที่ห้า', 'แรก', 'สุดท้าย',
  
  // คำเชื่อม และคำบุพบท
  'และ', 'กับ', 'หรือ', 'แต่', 'แต่ว่า', 'ถ้า', 'ถ้าหาก', 'หาก', 'เพราะ', 'เพราะว่า',
  'เนื่องจาก', 'เพื่อ', 'เพื่อที่', 'เพื่อว่า', 'เพื่อให้', 'ให้', 'ที่', 'ซึ่ง', 'อัน',
  'ใน', 'นอก', 'บน', 'ล่าง', 'ข้าง', 'หน้า', 'หลัง', 'ข้างหน้า', 'ข้างหลัง', 'ข้างบน', 'ข้างล่าง',
  'ระหว่าง', 'ท่ามกลาง', 'ตรงกลาง', 'กลาง', 'ตรง', 'ตรงข้าม', 'ใกล้', 'ไกล', 'ติด', 'ห่าง',
  'จาก', 'ถึง', 'ไปถึง', 'มาถึง', 'ตั้งแต่', 'จนถึง', 'จนกระทั่ง', 'จน', 'กระทั่ง',
  'ด้วย', 'โดย', 'โดยที่', 'โดยการ', 'ตาม', 'ตามที่', 'ตามด้วย', 'ตามหลัง', 'ตามมา',
  'เกี่ยวกับ', 'เกี่ยวกับ', 'เกี่ยวข้อง', 'เกี่ยวกับ', 'เรื่อง', 'เรื่องของ', 'เรื่องที่',
  'แล้ว', 'จะ', 'กำลัง', 'อยู่', 'อยาก', 'ต้อง', 'ควร', 'น่าจะ', 'คง', 'อาจ', 'อาจจะ',
  'เคย', 'ไม่เคย', 'เคยเป็น', 'เคยมี', 'เคยไป', 'เคยมา', 'เคยทำ',
  'ยัง', 'ยังไม่', 'ยังคง', 'ยังไง', 'ยังงั้น', 'ยังงี้', 'อย่างนั้น', 'อย่างนี้', 'อย่างไร',
  'ทุก', 'ทุกๆ', 'ทั้ง', 'ทั้งหมด', 'ทั้งสิ้น', 'ทั้งปวง', 'ทั้งนั้น', 'ทั้งนี้',
  'บาง', 'บางคน', 'บางที', 'บางครั้ง', 'บางอย่าง', 'บางส่วน', 'บางแห่ง',
  'เท่านั้น', 'เท่านี้', 'เท่านั้นเอง', 'เพียง', 'เพียงแค่', 'เพียงแต่', 'เพียงพอ',
  'มาก', 'มากมาย', 'มากที่สุด', 'น้อย', 'น้อยมาก', 'น้อยที่สุด', 'เกินไป', 'เกิน', 'พอดี',
  'ประมาณ', 'ราว', 'ราวๆ', 'ประมาณว่า', 'ประมาณการ', 'คาดว่า', 'คาดการณ์',
  'จริง', 'จริงๆ', 'แท้', 'แท้จริง', 'จริงจัง', 'จริงใจ', 'จริงแท้',
  'เท็จ', 'ปลอม', 'หลอก', 'หลอกลวง', 'โกหก', 'พูดโกหก',
  'ใหม่', 'ใหม่ๆ', 'ใหม่เอี่ยม', 'ใหม่ล่าสุด', 'ล่าสุด', 'ล่าสุดนี้', 'เมื่อเร็วๆนี้',
  'เก่า', 'เก่าแก่', 'โบราณ', 'โบราณกาล', 'สมัยก่อน', 'สมัยโบราณ',
  'ปกติ', 'ธรรมดา', 'ทั่วไป', 'ทั่วๆไป', 'โดยทั่วไป', 'โดยปกติ', 'โดยธรรมดา',
  'พิเศษ', 'เฉพาะ', 'เฉพาะเจาะจง', 'เฉพาะตัว', 'เฉพาะกิจ', 'เฉพาะกาล',
  'ทั้งหมด', 'ทั้งสิ้น', 'ทั้งปวง', 'ทั้งมวล', 'ทั้งนั้น', 'ทั้งนี้', 'ทั้งสอง',
  'อื่น', 'อื่นๆ', 'อีก', 'อีกครั้ง', 'อีกที', 'อีกแล้ว', 'อีกหน', 'อีกนาน',
  'เดียว', 'เดียวกัน', 'เดียวกับ', 'เดียวนี้', 'เดี๋ยว', 'เดี๋ยวนี้', 'เดี๋ยวนั้น',
  'เอง', 'เองก็', 'เองนั้น', 'เองนี้', 'เองเท่านั้น', 'เองทั้งนั้น',
  'กัน', 'กันเอง', 'กันและกัน', 'ด้วยกัน', 'พร้อมกัน', 'ร่วมกัน', 'ช่วยกัน',
  'ได้', 'ไม่ได้', 'ได้แล้ว', 'ได้แก่', 'ได้ยิน', 'ได้กลิ่น', 'ได้รับ',
  'ให้', 'ให้แล้ว', 'ให้ได้', 'ให้เสร็จ', 'ให้ดี', 'ให้ถูก', 'ให้ถูกต้อง',
  'มา', 'มาแล้ว', 'มาได้', 'มาถึง', 'มาจาก', 'มาด้วย', 'มาเอง', 'มาก่อน',
  'ไป', 'ไปแล้ว', 'ไปได้', 'ไปถึง', 'ไปที่', 'ไปด้วย', 'ไปเอง', 'ไปก่อน',
]);

// Thai typo patterns (common mistakes)
const thaiTypoPatterns = {
  'สวัสดี': ['สวัสดิ', 'สวัสดีี', 'สวัดดี'],
  'ขอบคุณ': ['ขอบคุน', 'ขอปคุณ', 'ขอบคุนน'],
  'ครับ': ['คับ', 'ครัป', 'คัรบ'],
  'ค่ะ': ['คะ', 'ค่า', 'คา'],
  'ไม่': ['ไมม', 'ไม', 'ไมม่'],
  'ได้': ['ได', 'ไดด', 'ไดี้'],
  'เป็น': ['เปน', 'เป็ม', 'เปนน'],
  'ทำ': ['ทำำ', 'ทำ', 'ทาม'],
  'อะไร': ['อไร', 'อะไรร', 'อะไล'],
  'ที่': ['ทีี', 'ทื่', 'ทื'],
};

// Build reverse lookup for Thai corrections
const thaiTypoCorrections = {};
Object.entries(thaiTypoPatterns).forEach(([correct, typos]) => {
  typos.forEach(typo => {
    thaiTypoCorrections[typo] = correct;
  });
});

/**
 * Check if text contains Thai characters
 */
function containsThai(text) {
  return /[\u0E00-\u0E7F]/.test(text);
}

/**
 * Check if text contains English characters
 */
function containsEnglish(text) {
  return /[a-zA-Z]/.test(text);
}

/**
 * Tokenize Thai text (simple word boundary detection)
 */
function tokenizeThai(text) {
  // Simple Thai tokenization - split by spaces and punctuation
  return text.match(/[\u0E00-\u0E7F]+|[^\u0E00-\u0E7F\s]+/g) || [];
}

/**
 * Check if word is gibberish (random typing)
 * Detects patterns like: asdfasdf, qwerqwer, ฟหกดฟำดหำด
 */
function isGibberish(word) {
  if (!word || word.length < 4) return false;
  
  // Check for repeated patterns (e.g., asdfasdf, 123123)
  const halfLength = Math.floor(word.length / 2);
  if (halfLength >= 2) {
    const firstHalf = word.substring(0, halfLength);
    const secondHalf = word.substring(halfLength, halfLength * 2);
    if (firstHalf === secondHalf) {
      return true;
    }
  }
  
  // Check for keyboard patterns (English)
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'tgbyhn', 'yhnujm', 'ujmik',
    '1234567890', '0987654321', 'abcdefg', 'zyxwvu'
  ];
  
  const lowerWord = word.toLowerCase();
  for (const pattern of keyboardPatterns) {
    if (lowerWord.includes(pattern) && lowerWord.length <= pattern.length + 2) {
      return true;
    }
  }
  
  // Check for Thai keyboard patterns
  const thaiKeyboardPatterns = [
    'ๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ',
    'ฟหกดเ้่าสวง', 'ผปแอิืทม', 'ๅภถุึคตจขช',
    'ๆไำพะัีรนยบล', 'ฃฟหกดเ้่าสวงผปแอิืทมใฝ'
  ];
  
  for (const pattern of thaiKeyboardPatterns) {
    let matchCount = 0;
    for (let i = 0; i < word.length - 1; i++) {
      const char = word[i];
      const nextChar = word[i + 1];
      const charIndex = pattern.indexOf(char);
      const nextCharIndex = pattern.indexOf(nextChar);
      
      if (charIndex !== -1 && nextCharIndex !== -1 && 
          Math.abs(charIndex - nextCharIndex) <= 2) {
        matchCount++;
      }
    }
    
    // If most consecutive characters are from keyboard pattern
    if (matchCount >= word.length * 0.6) {
      return true;
    }
  }
  
  // Check for repeated characters (e.g., aaaa, 1111, กกกก)
  const repeatedChar = /(.)\1{3,}/;
  if (repeatedChar.test(word)) {
    return true;
  }
  
  // Check for alternating characters (e.g., ababab, 121212)
  if (word.length >= 6) {
    let alternatingCount = 0;
    for (let i = 0; i < word.length - 2; i++) {
      if (word[i] === word[i + 2]) {
        alternatingCount++;
      }
    }
    if (alternatingCount >= word.length * 0.5) {
      return true;
    }
  }
  
  // Check for very low vowel ratio in English words
  if (containsEnglish(word) && word.length >= 5) {
    const vowels = word.match(/[aeiou]/gi);
    const vowelRatio = vowels ? vowels.length / word.length : 0;
    if (vowelRatio < 0.15) {
      return true;
    }
  }
  
  // Check for Thai words with unusual consonant/vowel patterns
  if (containsThai(word) && word.length >= 5) {
    const thaiVowels = word.match(/[ะัาำิีึืุูเแโใไ]/g);
    const vowelRatio = thaiVowels ? thaiVowels.length / word.length : 0;
    if (vowelRatio < 0.1 || vowelRatio > 0.8) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check Thai spelling
 */
function checkThaiSpelling(word) {
  // Check for gibberish first
  if (isGibberish(word)) {
    return {
      isCorrect: false,
      suggestions: ['(คำที่พิมพ์มั่ว)']
    };
  }

  // Check if word is in common words dictionary
  if (thaiCommonWords.has(word)) {
    return { isCorrect: true, suggestions: [] };
  }

  // Check if it's a known typo
  if (thaiTypoCorrections[word]) {
    return {
      isCorrect: false,
      suggestions: [thaiTypoCorrections[word]]
    };
  }

  // Find similar words using simple edit distance
  const suggestions = [];
  for (const correctWord of thaiCommonWords) {
    if (Math.abs(correctWord.length - word.length) <= 2) {
      const distance = natural.LevenshteinDistance(word, correctWord);
      if (distance <= 2) {
        suggestions.push(correctWord);
      }
    }
  }

  return {
    isCorrect: suggestions.length === 0,
    suggestions: suggestions.slice(0, 5)
  };
}

/**
 * Check English spelling
 */
function checkEnglishSpelling(word) {
  // Check for gibberish first
  if (isGibberish(word)) {
    return {
      isCorrect: false,
      suggestions: ['(random typing)']
    };
  }

  const lowerWord = word.toLowerCase();
  
  // Use compromise for better word recognition
  const doc = compromise(word);
  const isKnownWord = doc.has('#Noun') || doc.has('#Verb') || 
                      doc.has('#Adjective') || doc.has('#Adverb') ||
                      doc.has('#Pronoun') || doc.has('#Preposition');

  if (isKnownWord) {
    return { isCorrect: true, suggestions: [] };
  }

  // Get spelling suggestions
  const corrections = spellcheck.getCorrections(lowerWord, 5);
  
  return {
    isCorrect: corrections.length === 0,
    suggestions: corrections
  };
}

/**
 * Main spell check function
 */
export function checkSpelling(text) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid input text'
    };
  }

  const results = {
    originalText: text,
    errors: [],
    suggestions: {},
    statistics: {
      totalWords: 0,
      errorsFound: 0,
      thaiWords: 0,
      englishWords: 0
    }
  };

  // Split text into words
  const words = text.match(/[\u0E00-\u0E7F]+|[a-zA-Z]+/g) || [];
  results.statistics.totalWords = words.length;

  words.forEach((word, index) => {
    let checkResult;
    
    if (containsThai(word)) {
      results.statistics.thaiWords++;
      checkResult = checkThaiSpelling(word);
    } else if (containsEnglish(word)) {
      results.statistics.englishWords++;
      checkResult = checkEnglishSpelling(word);
    } else {
      return; // Skip non-text characters
    }

    if (!checkResult.isCorrect && checkResult.suggestions.length > 0) {
      results.errors.push({
        word,
        position: index,
        language: containsThai(word) ? 'thai' : 'english'
      });
      results.suggestions[word] = checkResult.suggestions;
      results.statistics.errorsFound++;
    }
  });

  return {
    success: true,
    data: results
  };
}

/**
 * Auto-correct text based on suggestions
 */
export function autoCorrect(text, corrections = {}) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid input text'
    };
  }

  let correctedText = text;
  
  // Apply corrections
  Object.entries(corrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(wrong, 'g');
    correctedText = correctedText.replace(regex, correct);
  });

  return {
    success: true,
    data: {
      originalText: text,
      correctedText,
      changesApplied: Object.keys(corrections).length
    }
  };
}
