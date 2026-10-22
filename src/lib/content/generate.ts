/**
 * Deterministic content generation for lessons that are synchronised from
 * YouTube playlists.
 *
 * The channel's videos are titled in Arabic and we do not have transcripts for
 * every lesson, so we attach:
 *   - a handful of real vocabulary items from a curated CEFR word bank, and
 *   - a short multiple-choice quiz drawn from a curated question bank,
 *
 * chosen deterministically from the lesson slug. Words are de-duplicated by the
 * database (a single shared row per English term) and only *linked* to lessons,
 * so the same word can safely appear across many lessons without duplication.
 * Editors can later replace any generated word or question through the admin
 * area — generated rows are distinguishable by `created_by IS NULL`
 * (vocabulary) and the lesson link.
 */
import type { Level } from '../types';
import type { SeedQuizQuestion, SeedVocabulary } from './seed-data';

const VOCAB_BANK: Record<Level, SeedVocabulary[]> = {
  foundation: [],
  a1: [
    { term: 'apple', translation: 'تفاحة', partOfSpeech: 'noun', phonetic: '/ˈæp.əl/', example: 'I eat an apple every day.' },
    { term: 'water', translation: 'ماء', partOfSpeech: 'noun', phonetic: '/ˈwɔː.tər/', example: 'Please drink some water.' },
    { term: 'book', translation: 'كتاب', partOfSpeech: 'noun', phonetic: '/bʊk/', example: 'This book is interesting.' },
    { term: 'family', translation: 'عائلة', partOfSpeech: 'noun', phonetic: '/ˈfæm.əl.i/', example: 'I love my family.' },
    { term: 'friend', translation: 'صديق', partOfSpeech: 'noun', phonetic: '/frend/', example: 'She is my best friend.' },
    { term: 'school', translation: 'مدرسة', partOfSpeech: 'noun', phonetic: '/skuːl/', example: 'My school is near the park.' },
    { term: 'house', translation: 'منزل', partOfSpeech: 'noun', phonetic: '/haʊs/', example: 'They live in a big house.' },
    { term: 'morning', translation: 'صباح', partOfSpeech: 'noun', phonetic: '/ˈmɔːr.nɪŋ/', example: 'Good morning, everyone.' },
    { term: 'happy', translation: 'سعيد', partOfSpeech: 'adjective', phonetic: '/ˈhæp.i/', example: 'I am very happy today.' },
    { term: 'work', translation: 'عمل', partOfSpeech: 'noun', phonetic: '/wɜːrk/', example: 'I go to work by bus.' },
    { term: 'food', translation: 'طعام', partOfSpeech: 'noun', phonetic: '/fuːd/', example: 'The food is delicious.' },
    { term: 'city', translation: 'مدينة', partOfSpeech: 'noun', phonetic: '/ˈsɪt.i/', example: 'Cairo is a big city.' },
    { term: 'money', translation: 'مال', partOfSpeech: 'noun', phonetic: '/ˈmʌn.i/', example: 'I need some money.' },
    { term: 'time', translation: 'وقت', partOfSpeech: 'noun', phonetic: '/taɪm/', example: 'What time is it?' },
    { term: 'name', translation: 'اسم', partOfSpeech: 'noun', phonetic: '/neɪm/', example: 'My name is Sara.' },
    { term: 'open', translation: 'يفتح', partOfSpeech: 'verb', phonetic: '/ˈoʊ.pən/', example: 'Please open the door.' },
    { term: 'day', translation: 'يوم', partOfSpeech: 'noun' },
    { term: 'night', translation: 'ليل', partOfSpeech: 'noun' },
    { term: 'boy', translation: 'ولد', partOfSpeech: 'noun' },
    { term: 'girl', translation: 'فتاة', partOfSpeech: 'noun' },
    { term: 'man', translation: 'رجل', partOfSpeech: 'noun' },
    { term: 'woman', translation: 'امرأة', partOfSpeech: 'noun' },
    { term: 'teacher', translation: 'معلم', partOfSpeech: 'noun' },
    { term: 'doctor', translation: 'طبيب', partOfSpeech: 'noun' },
    { term: 'car', translation: 'سيارة', partOfSpeech: 'noun' },
    { term: 'tree', translation: 'شجرة', partOfSpeech: 'noun' },
    { term: 'dog', translation: 'كلب', partOfSpeech: 'noun' },
    { term: 'cat', translation: 'قط', partOfSpeech: 'noun' },
    { term: 'red', translation: 'أحمر', partOfSpeech: 'adjective' },
    { term: 'blue', translation: 'أزرق', partOfSpeech: 'adjective' },
    { term: 'big', translation: 'كبير', partOfSpeech: 'adjective' },
    { term: 'small', translation: 'صغير', partOfSpeech: 'adjective' },
    { term: 'run', translation: 'يجري', partOfSpeech: 'verb' },
    { term: 'eat', translation: 'يأكل', partOfSpeech: 'verb' },
    { term: 'drink', translation: 'يشرب', partOfSpeech: 'verb' },
    { term: 'read', translation: 'يقرأ', partOfSpeech: 'verb' },
    { term: 'write', translation: 'يكتب', partOfSpeech: 'verb' },
    { term: 'sleep', translation: 'ينام', partOfSpeech: 'verb' },
    { term: 'table', translation: 'طاولة', partOfSpeech: 'noun' },
  ],
  a2: [
    { term: 'abroad', translation: 'بالخارج', partOfSpeech: 'adverb', phonetic: '/əˈbrɔːd/', example: 'She wants to study abroad.' },
    { term: 'afford', translation: 'يستطيع تحمّل التكلفة', partOfSpeech: 'verb', phonetic: '/əˈfɔːrd/', example: "I can't afford a new car." },
    { term: 'borrow', translation: 'يستعير', partOfSpeech: 'verb', phonetic: '/ˈbɑːr.oʊ/', example: 'Can I borrow your pen?' },
    { term: 'complain', translation: 'يشتكي', partOfSpeech: 'verb', phonetic: '/kəmˈpleɪn/', example: 'He complained about the noise.' },
    { term: 'crowded', translation: 'مزدحم', partOfSpeech: 'adjective', phonetic: '/ˈkraʊ.dɪd/', example: 'The street was crowded.' },
    { term: 'deliver', translation: 'يوصّل', partOfSpeech: 'verb', phonetic: '/dɪˈlɪv.ər/', example: 'They deliver the mail daily.' },
    { term: 'famous', translation: 'مشهور', partOfSpeech: 'adjective', phonetic: '/ˈfeɪ.məs/', example: 'It is a famous place.' },
    { term: 'generous', translation: 'كريم', partOfSpeech: 'adjective', phonetic: '/ˈdʒen.ər.əs/', example: 'Thank you for your generous help.' },
    { term: 'hobby', translation: 'هواية', partOfSpeech: 'noun', phonetic: '/ˈhɑː.bi/', example: 'Reading is my hobby.' },
    { term: 'luggage', translation: 'أمتعة', partOfSpeech: 'noun', phonetic: '/ˈlʌɡ.ɪdʒ/', example: 'Where is my luggage?' },
    { term: 'neighbor', translation: 'جار', partOfSpeech: 'noun', phonetic: '/ˈneɪ.bər/', example: 'Our neighbor is friendly.' },
    { term: 'prefer', translation: 'يفضّل', partOfSpeech: 'verb', phonetic: '/prɪˈfɜːr/', example: 'I prefer tea to coffee.' },
    { term: 'recipe', translation: 'وصفة', partOfSpeech: 'noun', phonetic: '/ˈres.ə.pi/', example: "This is my mother's recipe." },
    { term: 'schedule', translation: 'جدول', partOfSpeech: 'noun', phonetic: '/ˈskedʒ.uːl/', example: 'Check the bus schedule.' },
    { term: 'traffic', translation: 'حركة المرور', partOfSpeech: 'noun', phonetic: '/ˈtræf.ɪk/', example: 'There is heavy traffic.' },
    { term: 'weather', translation: 'الطقس', partOfSpeech: 'noun', phonetic: '/ˈweð.ər/', example: 'The weather is nice today.' },
    { term: 'journey', translation: 'رحلة', partOfSpeech: 'noun' },
    { term: 'airport', translation: 'مطار', partOfSpeech: 'noun' },
    { term: 'ticket', translation: 'تذكرة', partOfSpeech: 'noun' },
    { term: 'hotel', translation: 'فندق', partOfSpeech: 'noun' },
    { term: 'tourist', translation: 'سائح', partOfSpeech: 'noun' },
    { term: 'passenger', translation: 'مسافر', partOfSpeech: 'noun' },
    { term: 'arrive', translation: 'يصل', partOfSpeech: 'verb' },
    { term: 'depart', translation: 'يغادر', partOfSpeech: 'verb' },
    { term: 'guide', translation: 'مرشد', partOfSpeech: 'noun' },
    { term: 'souvenir', translation: 'هدية تذكارية', partOfSpeech: 'noun' },
    { term: 'scenery', translation: 'منظر طبيعي', partOfSpeech: 'noun' },
    { term: 'adventure', translation: 'مغامرة', partOfSpeech: 'noun' },
    { term: 'currency', translation: 'عملة', partOfSpeech: 'noun' },
    { term: 'customs', translation: 'الجمارك', partOfSpeech: 'noun' },
    { term: 'delay', translation: 'تأخير', partOfSpeech: 'noun' },
    { term: 'cancel', translation: 'يلغي', partOfSpeech: 'verb' },
    { term: 'recommend', translation: 'ينصح بـ', partOfSpeech: 'verb' },
    { term: 'explore', translation: 'يستكشف', partOfSpeech: 'verb' },
    { term: 'direction', translation: 'اتجاه', partOfSpeech: 'noun' },
    { term: 'receipt', translation: 'إيصال', partOfSpeech: 'noun' },
    { term: 'discount', translation: 'خصم', partOfSpeech: 'noun' },
    { term: 'appointment', translation: 'موعد', partOfSpeech: 'noun' },
    { term: 'customer', translation: 'عميل', partOfSpeech: 'noun' },
  ],
  b1: [
    { term: 'achieve', translation: 'يحقّق', partOfSpeech: 'verb', phonetic: '/əˈtʃiːv/', example: 'She achieved her goal.' },
    { term: 'advantage', translation: 'ميزة', partOfSpeech: 'noun', phonetic: '/ədˈvæn.tɪdʒ/', example: 'This plan has many advantages.' },
    { term: 'behavior', translation: 'سلوك', partOfSpeech: 'noun', phonetic: '/bɪˈheɪ.vjər/', example: 'His behavior was strange.' },
    { term: 'challenge', translation: 'تحدٍّ', partOfSpeech: 'noun', phonetic: '/ˈtʃæl.ɪndʒ/', example: 'Learning a language is a challenge.' },
    { term: 'decision', translation: 'قرار', partOfSpeech: 'noun', phonetic: '/dɪˈsɪʒ.ən/', example: 'It was a difficult decision.' },
    { term: 'describe', translation: 'يصف', partOfSpeech: 'verb', phonetic: '/dɪˈskraɪb/', example: 'Can you describe the picture?' },
    { term: 'environment', translation: 'بيئة', partOfSpeech: 'noun', phonetic: '/ɪnˈvaɪ.rən.mənt/', example: 'We must protect the environment.' },
    { term: 'experience', translation: 'خبرة', partOfSpeech: 'noun', phonetic: '/ɪkˈspɪr.i.əns/', example: 'She has a lot of experience.' },
    { term: 'improve', translation: 'يحسّن', partOfSpeech: 'verb', phonetic: '/ɪmˈpruːv/', example: 'I want to improve my English.' },
    { term: 'opportunity', translation: 'فرصة', partOfSpeech: 'noun', phonetic: '/ˌɑː.pərˈtuː.nə.t̬i/', example: "Don't miss this opportunity." },
    { term: 'relationship', translation: 'علاقة', partOfSpeech: 'noun', phonetic: '/rɪˈleɪ.ʃən.ʃɪp/', example: 'They have a good relationship.' },
    { term: 'responsible', translation: 'مسؤول', partOfSpeech: 'adjective', phonetic: '/rɪˈspɑːn.sə.bəl/', example: 'He is responsible for the project.' },
    { term: 'solution', translation: 'حل', partOfSpeech: 'noun', phonetic: '/səˈluː.ʃən/', example: 'We found a good solution.' },
    { term: 'success', translation: 'نجاح', partOfSpeech: 'noun', phonetic: '/səkˈses/', example: 'Hard work leads to success.' },
    { term: 'suggest', translation: 'يقترح', partOfSpeech: 'verb', phonetic: '/səˈdʒest/', example: 'I suggest we start early.' },
    { term: 'valuable', translation: 'قيّم', partOfSpeech: 'adjective', phonetic: '/ˈvæl.jə.bəl/', example: 'Time is very valuable.' },
    { term: 'efficient', translation: 'فعّال', partOfSpeech: 'adjective' },
    { term: 'influence', translation: 'تأثير', partOfSpeech: 'noun' },
    { term: 'maintain', translation: 'يحافظ على', partOfSpeech: 'verb' },
    { term: 'negotiate', translation: 'يتفاوض', partOfSpeech: 'verb' },
    { term: 'persuade', translation: 'يقنع', partOfSpeech: 'verb' },
    { term: 'priority', translation: 'أولوية', partOfSpeech: 'noun' },
    { term: 'reliable', translation: 'موثوق', partOfSpeech: 'adjective' },
    { term: 'resource', translation: 'مورد', partOfSpeech: 'noun' },
    { term: 'strategy', translation: 'استراتيجية', partOfSpeech: 'noun' },
    { term: 'teamwork', translation: 'العمل الجماعي', partOfSpeech: 'noun' },
    { term: 'approach', translation: 'منهج', partOfSpeech: 'noun' },
    { term: 'benefit', translation: 'فائدة', partOfSpeech: 'noun' },
    { term: 'consequence', translation: 'نتيجة', partOfSpeech: 'noun' },
    { term: 'contribute', translation: 'يساهم', partOfSpeech: 'verb' },
    { term: 'demonstrate', translation: 'يبرهن', partOfSpeech: 'verb' },
    { term: 'flexible', translation: 'مرن', partOfSpeech: 'adjective' },
    { term: 'motivate', translation: 'يحفّز', partOfSpeech: 'verb' },
    { term: 'objective', translation: 'هدف', partOfSpeech: 'noun' },
    { term: 'significant', translation: 'مهم', partOfSpeech: 'adjective' },
    { term: 'deadline', translation: 'موعد نهائي', partOfSpeech: 'noun' },
    { term: 'colleague', translation: 'زميل', partOfSpeech: 'noun' },
    { term: 'meeting', translation: 'اجتماع', partOfSpeech: 'noun' },
    { term: 'report', translation: 'تقرير', partOfSpeech: 'noun' },
  ],
  b2: [
    { term: 'ambiguous', translation: 'غامض', partOfSpeech: 'adjective', phonetic: '/æmˈbɪɡ.ju.əs/', example: 'His answer was ambiguous.' },
    { term: 'coherent', translation: 'متماسك', partOfSpeech: 'adjective', phonetic: '/koʊˈhɪr.ənt/', example: 'She gave a coherent explanation.' },
    { term: 'consensus', translation: 'توافق', partOfSpeech: 'noun', phonetic: '/kənˈsen.səs/', example: 'They reached a consensus.' },
    { term: 'deteriorate', translation: 'يتدهور', partOfSpeech: 'verb', phonetic: '/dɪˈtɪr.i.ə.reɪt/', example: 'The situation began to deteriorate.' },
    { term: 'inevitable', translation: 'حتمي', partOfSpeech: 'adjective', phonetic: '/ɪˈnev.ɪ.t̬ə.bəl/', example: 'Change is inevitable.' },
    { term: 'meticulous', translation: 'دقيق', partOfSpeech: 'adjective', phonetic: '/məˈtɪk.jə.ləs/', example: 'He is meticulous about details.' },
    { term: 'nuance', translation: 'فارق دقيق', partOfSpeech: 'noun', phonetic: '/ˈnuː.ɑːns/', example: 'She understands every nuance.' },
    { term: 'perceive', translation: 'يدرك', partOfSpeech: 'verb', phonetic: '/pərˈsiːv/', example: 'I perceive a change in his tone.' },
    { term: 'profound', translation: 'عميق', partOfSpeech: 'adjective', phonetic: '/prəˈfaʊnd/', example: 'The book had a profound effect.' },
    { term: 'reluctant', translation: 'متردد', partOfSpeech: 'adjective', phonetic: '/rɪˈlʌk.tənt/', example: 'He was reluctant to agree.' },
    { term: 'sophisticated', translation: 'متطور', partOfSpeech: 'adjective', phonetic: '/səˈfɪs.tə.keɪt̬.ɪd/', example: 'It is a sophisticated system.' },
    { term: 'substantial', translation: 'كبير', partOfSpeech: 'adjective', phonetic: '/səbˈstæn.ʃəl/', example: 'There was a substantial increase.' },
    { term: 'undermine', translation: 'يقوّض', partOfSpeech: 'verb', phonetic: '/ˌʌn.dərˈmaɪn/', example: 'Rumors can undermine trust.' },
    { term: 'versatile', translation: 'متعدد المواهب', partOfSpeech: 'adjective', phonetic: '/ˈvɜːr.sə.t̬əl/', example: 'She is a versatile artist.' },
    { term: 'compensate', translation: 'يعوّض', partOfSpeech: 'verb', phonetic: '/ˈkɑːm.pən.seɪt/', example: 'He tried to compensate for the loss.' },
    { term: 'advocate', translation: 'يدعو إلى', partOfSpeech: 'verb', phonetic: '/ˈæd.və.keɪt/', example: 'They advocate for change.' },
    { term: 'articulate', translation: 'طليق التعبير', partOfSpeech: 'adjective' },
    { term: 'compelling', translation: 'مقنع', partOfSpeech: 'adjective' },
    { term: 'contradict', translation: 'يناقض', partOfSpeech: 'verb' },
    { term: 'credibility', translation: 'مصداقية', partOfSpeech: 'noun' },
    { term: 'dilemma', translation: 'معضلة', partOfSpeech: 'noun' },
    { term: 'empirical', translation: 'تجريبي', partOfSpeech: 'adjective' },
    { term: 'explicit', translation: 'صريح', partOfSpeech: 'adjective' },
    { term: 'formulate', translation: 'يصوغ', partOfSpeech: 'verb' },
    { term: 'hypothesis', translation: 'فرضية', partOfSpeech: 'noun' },
    { term: 'inherent', translation: 'متأصل', partOfSpeech: 'adjective' },
    { term: 'integrate', translation: 'يدمج', partOfSpeech: 'verb' },
    { term: 'legitimate', translation: 'مشروع', partOfSpeech: 'adjective' },
    { term: 'paradigm', translation: 'نموذج', partOfSpeech: 'noun' },
    { term: 'plausible', translation: 'معقول', partOfSpeech: 'adjective' },
    { term: 'prevalent', translation: 'سائد', partOfSpeech: 'adjective' },
    { term: 'reinforce', translation: 'يعزّز', partOfSpeech: 'verb' },
    { term: 'rigorous', translation: 'صارم', partOfSpeech: 'adjective' },
    { term: 'sceptical', translation: 'متشكّك', partOfSpeech: 'adjective' },
    { term: 'tentative', translation: 'مؤقت', partOfSpeech: 'adjective' },
    { term: 'viable', translation: 'قابل للتطبيق', partOfSpeech: 'adjective' },
  ],
  c1: [
    { term: 'arduous', translation: 'شاقّ', partOfSpeech: 'adjective', phonetic: '/ˈɑːr.dʒu.əs/', example: 'It was an arduous journey.' },
    { term: 'candid', translation: 'صريح', partOfSpeech: 'adjective', phonetic: '/ˈkæn.dɪd/', example: 'She gave a candid opinion.' },
    { term: 'concede', translation: 'يعترف', partOfSpeech: 'verb', phonetic: '/kənˈsiːd/', example: 'He conceded that he was wrong.' },
    { term: 'contemplate', translation: 'يتأمل', partOfSpeech: 'verb', phonetic: '/ˈkɑːn.təm.pleɪt/', example: 'I contemplate moving abroad.' },
    { term: 'detrimental', translation: 'ضارّ', partOfSpeech: 'adjective', phonetic: '/ˌde.trɪˈmen.t̬əl/', example: 'Smoking is detrimental to health.' },
    { term: 'eloquent', translation: 'بليغ', partOfSpeech: 'adjective', phonetic: '/ˈel.ə.kwənt/', example: 'He is an eloquent speaker.' },
    { term: 'feasible', translation: 'قابل للتنفيذ', partOfSpeech: 'adjective', phonetic: '/ˈfiː.zə.bəl/', example: 'The plan is not feasible.' },
    { term: 'impartial', translation: 'محايد', partOfSpeech: 'adjective', phonetic: '/ɪmˈpɑːr.ʃəl/', example: 'A judge must be impartial.' },
    { term: 'intricate', translation: 'معقّد', partOfSpeech: 'adjective', phonetic: '/ˈɪn.trɪ.kət/', example: 'It is an intricate design.' },
    { term: 'lucrative', translation: 'مربح', partOfSpeech: 'adjective', phonetic: '/ˈluː.krə.t̬ɪv/', example: 'It is a lucrative business.' },
    { term: 'mitigate', translation: 'يخفّف', partOfSpeech: 'verb', phonetic: '/ˈmɪt̬.ə.ɡeɪt/', example: 'We must mitigate the risks.' },
    { term: 'paramount', translation: 'بالغ الأهمية', partOfSpeech: 'adjective', phonetic: '/ˈper.ə.maʊnt/', example: 'Safety is paramount.' },
    { term: 'pragmatic', translation: 'عملي', partOfSpeech: 'adjective', phonetic: '/præɡˈmæt̬.ɪk/', example: 'She takes a pragmatic approach.' },
    { term: 'redundant', translation: 'زائد عن الحاجة', partOfSpeech: 'adjective', phonetic: '/rɪˈdʌn.dənt/', example: 'Cut the redundant words.' },
    { term: 'scrutinize', translation: 'يتفحّص', partOfSpeech: 'verb', phonetic: '/ˈskruː.t̬ən.aɪz/', example: 'They scrutinize every detail.' },
    { term: 'tenacious', translation: 'مثابر', partOfSpeech: 'adjective', phonetic: '/təˈneɪ.ʃəs/', example: 'She is a tenacious researcher.' },
    { term: 'benevolent', translation: 'خيّر', partOfSpeech: 'adjective' },
    { term: 'capricious', translation: 'متقلّب', partOfSpeech: 'adjective' },
    { term: 'clandestine', translation: 'سري', partOfSpeech: 'adjective' },
    { term: 'discrepancy', translation: 'تناقض', partOfSpeech: 'noun' },
    { term: 'exacerbate', translation: 'يفاقم', partOfSpeech: 'verb' },
    { term: 'extrapolate', translation: 'يستنبط', partOfSpeech: 'verb' },
    { term: 'gregarious', translation: 'اجتماعي', partOfSpeech: 'adjective' },
    { term: 'idiosyncrasy', translation: 'خصوصية', partOfSpeech: 'noun' },
    { term: 'juxtapose', translation: 'يضع جنبًا إلى جنب', partOfSpeech: 'verb' },
    { term: 'magnanimous', translation: 'شهم', partOfSpeech: 'adjective' },
    { term: 'obsolete', translation: 'عتيق', partOfSpeech: 'adjective' },
    { term: 'ostensible', translation: 'ظاهري', partOfSpeech: 'adjective' },
    { term: 'pervasive', translation: 'منتشر', partOfSpeech: 'adjective' },
    { term: 'precocious', translation: 'مبكّر النبوغ', partOfSpeech: 'adjective' },
    { term: 'quintessential', translation: 'جوهري', partOfSpeech: 'adjective' },
    { term: 'reticent', translation: 'كتوم', partOfSpeech: 'adjective' },
    { term: 'surreptitious', translation: 'خفي', partOfSpeech: 'adjective' },
    { term: 'ubiquitous', translation: 'منتشر في كل مكان', partOfSpeech: 'adjective' },
    { term: 'vindicate', translation: 'يبرّئ', partOfSpeech: 'verb' },
    { term: 'zealous', translation: 'متحمّس', partOfSpeech: 'adjective' },
  ],
};

const QUESTION_BANK: Record<Level, SeedQuizQuestion[]> = {
  foundation: [],
  a1: [
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: I ___ a student.', options: ['am', 'is', 'are', 'be'], answerIndex: 0, explanation: 'With "I" we use "am".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose: She ___ two brothers.', options: ['have', 'has', 'is', 'are'], answerIndex: 1, explanation: 'With he/she/it we use "has".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is the plural of "child"?', options: ['childs', 'childes', 'children', 'child'], answerIndex: 2, explanation: '"children" is an irregular plural.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: They ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answerIndex: 0, explanation: 'With they we use the base verb "go".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct article: I saw ___ elephant.', options: ['a', 'an', 'the', '—'], answerIndex: 1, explanation: 'We use "an" before a vowel sound.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word is a color?', options: ['table', 'blue', 'run', 'city'], answerIndex: 1, explanation: '"blue" is a color.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: I like ___ football.', options: ['play', 'playing', 'played', 'plays'], answerIndex: 1, explanation: 'After "like" we use the -ing form.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the opposite of "hot".', options: ['warm', 'cold', 'big', 'fast'], answerIndex: 1, explanation: 'The opposite of "hot" is "cold".' },
    { type: 'TRUE_FALSE', prompt: 'The sentence "He is a doctor." is correct.', correctBoolean: true, explanation: 'With "he" we use "is".' },
    { type: 'TRUE_FALSE', prompt: 'We say "I has a car".', correctBoolean: false, explanation: 'We say "I have a car".' },
    { type: 'FILL_BLANK', prompt: 'Complete: She ___ a teacher. (verb "to be")', acceptedAnswers: ['is'], explanation: 'With she we use "is".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: This ___ my book.', options: ['are', 'is', 'am', 'be'], answerIndex: 1, explanation: 'With "this" we use "is".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: We ___ from Egypt.', options: ['is', 'am', 'are', 'be'], answerIndex: 2, explanation: 'With "we" we use "are".' },
  ],
  a2: [
    { type: 'MULTIPLE_CHOICE', prompt: "Choose: I've lived here ___ 2010.", options: ['for', 'since', 'from', 'in'], answerIndex: 1, explanation: 'We use "since" with a point in time.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: If it rains, I ___ stay home.', options: ['will', 'would', 'am', 'do'], answerIndex: 0, explanation: 'First conditional uses "will".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: She is good ___ math.', options: ['in', 'at', 'on', 'for'], answerIndex: 1, explanation: 'We say "good at".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is the past form of "buy"?', options: ['buyed', 'bought', 'boughten', 'buys'], answerIndex: 1, explanation: '"buy" → "bought".' },
    { type: 'MULTIPLE_CHOICE', prompt: "Choose: There isn't ___ milk.", options: ['some', 'any', 'many', 'a'], answerIndex: 1, explanation: 'We use "any" in negatives.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which is a synonym of "big"?', options: ['tiny', 'large', 'thin', 'short'], answerIndex: 1, explanation: '"large" means big.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: He has been working ___ three hours.', options: ['since', 'for', 'from', 'during'], answerIndex: 1, explanation: 'We use "for" with a duration.' },
    { type: 'MULTIPLE_CHOICE', prompt: "Choose: I'd like ___ coffee, please.", options: ['a', 'an', 'some', 'any'], answerIndex: 2, explanation: 'We use "some" for an unspecified amount.' },
    { type: 'TRUE_FALSE', prompt: '"How much is this?" is used to ask about price.', correctBoolean: true, explanation: 'We use "how much" for price.' },
    { type: 'TRUE_FALSE', prompt: 'The past of "go" is "goed".', correctBoolean: false, explanation: 'The past of "go" is "went".' },
    { type: 'FILL_BLANK', prompt: 'Complete: Go ___ ahead. (without turning)', acceptedAnswers: ['straight'], explanation: 'The phrase is "go straight ahead".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: He is interested ___ music.', options: ['on', 'in', 'at', 'for'], answerIndex: 1, explanation: 'We say "interested in".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: I ___ my homework yesterday.', options: ['do', 'did', 'done', 'doing'], answerIndex: 1, explanation: 'Past simple of "do" is "did".' },
  ],
  b1: [
    { type: 'MULTIPLE_CHOICE', prompt: "Choose: She's interested ___ learning languages.", options: ['on', 'in', 'at', 'for'], answerIndex: 1, explanation: 'We say "interested in".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Reported speech: He said he ___ tired.', options: ['is', 'was', 'be', 'been'], answerIndex: 1, explanation: 'Backshift the tense in reported speech.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose: If I ___ you, I would apologize.', options: ['am', 'was', 'were', 'be'], answerIndex: 2, explanation: 'Second conditional uses "were".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What does the phrasal verb "give up" mean?', options: ['to quit', 'to lift', 'to arrive', 'to delay'], answerIndex: 0, explanation: '"give up" means to quit.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: The report ___ by Monday.', options: ['will finish', 'will be finished', 'finishes', 'finished'], answerIndex: 1, explanation: 'Passive future: "will be finished".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word means "very important"?', options: ['trivial', 'crucial', 'minor', 'slight'], answerIndex: 1, explanation: '"crucial" means very important.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: I look forward to ___ from you.', options: ['hear', 'hearing', 'heard', 'hears'], answerIndex: 1, explanation: 'After "look forward to" we use the -ing form.' },
    { type: 'MULTIPLE_CHOICE', prompt: "Choose: He's used to ___ early.", options: ['get up', 'getting up', 'got up', 'gets up'], answerIndex: 1, explanation: 'After "used to" (accustomed) we use the -ing form.' },
    { type: 'TRUE_FALSE', prompt: '"Best regards" is a professional email closing.', correctBoolean: true, explanation: 'It is a standard professional closing.' },
    { type: 'TRUE_FALSE', prompt: 'The phrase "Please find attached" is used to mention an attachment.', correctBoolean: true, explanation: 'It introduces an attached document.' },
    { type: 'FILL_BLANK', prompt: 'Complete: She has been working here ___ 2015.', acceptedAnswers: ['since'], explanation: 'Use "since" with a starting point in time.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: He denied ___ the money.', options: ['to take', 'taking', 'take', 'took'], answerIndex: 1, explanation: '"deny" is followed by the -ing form.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which is a synonym of "difficult"?', options: ['easy', 'challenging', 'simple', 'plain'], answerIndex: 1, explanation: '"challenging" means difficult.' },
  ],
  b2: [
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose: ___ hard he tried, he failed.', options: ['However', 'Whatever', 'Whenever', 'Wherever'], answerIndex: 0, explanation: '"However + adjective + subject + verb" shows contrast.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: The new policy ___ next month.', options: ['comes into effect', 'comes into affect', 'come into effect', 'comes onto effect'], answerIndex: 0, explanation: 'The fixed phrase is "come into effect".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which is a synonym of "ambiguous"?', options: ['clear', 'vague', 'certain', 'obvious'], answerIndex: 1, explanation: '"vague" means unclear.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: Not only ___ late, but he also forgot the keys.', options: ['he was', 'was he', 'he is', 'is he'], answerIndex: 1, explanation: 'After "not only" we invert the subject and verb.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose: She denied ___ the document.', options: ['to sign', 'signing', 'sign', 'signed'], answerIndex: 1, explanation: '"deny" is followed by the -ing form.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What does "to bite the bullet" mean?', options: ['to endure something painful', 'to eat fast', 'to shoot', 'to run away'], answerIndex: 0, explanation: 'It means to endure a difficult situation.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: Had I known, I ___ differently.', options: ['would act', 'would have acted', 'will act', 'acted'], answerIndex: 1, explanation: 'Third conditional: "would have + past participle".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word means "to make something less severe"?', options: ['aggravate', 'mitigate', 'intensify', 'amplify'], answerIndex: 1, explanation: '"mitigate" means to make less severe.' },
    { type: 'TRUE_FALSE', prompt: 'In a third conditional we use "would have + past participle".', correctBoolean: true, explanation: 'That is the correct structure.' },
    { type: 'TRUE_FALSE', prompt: '"Undermine" means to strengthen something.', correctBoolean: false, explanation: '"Undermine" means to weaken.' },
    { type: 'FILL_BLANK', prompt: 'Complete: Hardly ___ I arrived when the phone rang.', acceptedAnswers: ['had'], explanation: 'Inversion after "Hardly" uses the past perfect "had".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: The evidence ___ his claim.', options: ['corroborates', 'contradicts', 'ignores', 'delays'], answerIndex: 0, explanation: '"corroborate" means to confirm or support.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word is closest to "coherent"?', options: ['confusing', 'logical', 'broken', 'random'], answerIndex: 1, explanation: '"coherent" means logical and clear.' },
  ],
  c1: [
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the most formal option.', options: ['I wanna', 'I would like to', 'I want to', 'I gotta'], answerIndex: 1, explanation: '"I would like to" is the most formal.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: Under no circumstances ___ the door be left open.', options: ['should', 'should not', 'must', 'can'], answerIndex: 0, explanation: 'Negative inversion: "Under no circumstances should…".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which is a synonym of "tenacious"?', options: ['persistent', 'fragile', 'indifferent', 'brief'], answerIndex: 0, explanation: '"persistent" matches "tenacious".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: The findings ___ our earlier hypothesis.', options: ['corroborate', 'collate', 'corporate', 'correlate'], answerIndex: 0, explanation: '"corroborate" means to confirm.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: ___ she had studied hard, she passed easily.', options: ['Because', 'Although', 'Despite', 'However'], answerIndex: 0, explanation: 'A cause/effect link needs "Because".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What does "scrutinize" mean?', options: ['examine closely', 'ignore', 'summarize', 'translate'], answerIndex: 0, explanation: '"scrutinize" means to examine closely.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word means "not showing favouritism"?', options: ['biased', 'impartial', 'partial', 'subjective'], answerIndex: 1, explanation: '"impartial" means fair and neutral.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Complete: Little ___ that he would resign.', options: ['did we know', 'we knew', 'we did know', 'know we'], answerIndex: 0, explanation: 'Inversion after "Little": "Little did we know…".' },
    { type: 'TRUE_FALSE', prompt: '"Exacerbate" means to make a problem worse.', correctBoolean: true, explanation: 'Yes, "exacerbate" means to worsen.' },
    { type: 'TRUE_FALSE', prompt: 'A "candid" answer is deliberately vague.', correctBoolean: false, explanation: '"Candid" means honest and direct.' },
    { type: 'FILL_BLANK', prompt: 'Complete: At no time ___ I doubted her honesty.', acceptedAnswers: ['did'], explanation: 'Negative inversion uses the auxiliary "did".' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which word means "existing everywhere"?', options: ['rare', 'ubiquitous', 'obsolete', 'tentative'], answerIndex: 1, explanation: '"ubiquitous" means present everywhere.' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct: The plan proved ___ after testing.', options: ['feasible', 'redundant', 'candid', 'arduous'], answerIndex: 0, explanation: '"feasible" means possible to do.' },
  ],
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rotate<T>(items: T[], seed: number, count: number): T[] {
  if (items.length === 0) return [];
  const take = Math.min(count, items.length);
  const start = seed % items.length;
  const out: T[] = [];
  for (let i = 0; i < take; i += 1) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

/** Deterministic in-place-style shuffle so correct answers are not always first. */
function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let state = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** A few real words for a lesson, chosen deterministically from its slug. */
export function generateVocabulary(level: Level, seed: string, count = 5): SeedVocabulary[] {
  return rotate(VOCAB_BANK[level] ?? [], hash(seed), count);
}

function distinctValues<T>(items: T[], read: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = read(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Build extra multiple-choice questions from the exact words attached to the
 * lesson. This roughly doubles the pool and means a retry can ask about the
 * same vocabulary from the other direction (meaning → word, word → meaning).
 */
function vocabularyQuestions(
  level: Level,
  seed: string,
  words: SeedVocabulary[],
): SeedQuizQuestion[] {
  const bank = VOCAB_BANK[level] ?? [];
  const questions: SeedQuizQuestion[] = [];

  for (const word of words) {
    const distractors = distinctValues(
      rotate(
        bank.filter(
          (candidate) =>
            candidate.term !== word.term && candidate.translation !== word.translation,
        ),
        hash(`${seed}:${word.term}:distractors`),
        6,
      ),
      (candidate) => candidate.translation,
    ).slice(0, 3);

    if (distractors.length >= 3) {
      const meaningOptions = shuffleWithSeed(
        [word.translation, ...distractors.map((candidate) => candidate.translation)],
        hash(`${seed}:${word.term}:meaning`),
      );
      questions.push({
        type: 'MULTIPLE_CHOICE',
        prompt: `What is the Arabic meaning of "${word.term}"?`,
        options: meaningOptions,
        answerIndex: meaningOptions.indexOf(word.translation),
        explanation: `"${word.term}" means "${word.translation}".`,
        points: 1,
      });

      const wordOptions = shuffleWithSeed(
        [word.term, ...distractors.map((candidate) => candidate.term)],
        hash(`${seed}:${word.term}:term`),
      );
      questions.push({
        type: 'MULTIPLE_CHOICE',
        prompt: `Which English word means "${word.translation}"?`,
        options: wordOptions,
        answerIndex: wordOptions.indexOf(word.term),
        explanation: `The word is "${word.term}".`,
        points: 1,
      });
    }

    if (word.example) {
      const gap = word.example.replace(new RegExp(`\\b${word.term}\\b`, 'i'), '_____');
      if (gap !== word.example) {
        questions.push({
          type: 'FILL_BLANK',
          prompt: `Complete the sentence: ${gap}`,
          acceptedAnswers: [word.term],
          explanation: `The complete sentence is: ${word.example}`,
          points: 1,
        });
      }
    }
  }

  return questions;
}

/**
 * A revision quiz for a lesson, chosen deterministically from its slug. The
 * pool mixes grammar questions with vocabulary questions generated from the
 * lesson's own words, giving the randomised session runner enough material to
 * renew questions on every retry.
 */
export function generateQuizQuestions(level: Level, seed: string, count = 18): SeedQuizQuestion[] {
  const seedNumber = hash(seed);
  const words = generateVocabulary(level, seed, 6);
  const combined = [
    ...vocabularyQuestions(level, seed, words),
    ...(QUESTION_BANK[level] ?? []),
  ];

  return rotate(combined, seedNumber, count).map((question, index) => {
    if (
      question.type === 'MULTIPLE_CHOICE' &&
      question.options &&
      question.options.length > 1 &&
      typeof question.answerIndex === 'number'
    ) {
      const correct = question.options[question.answerIndex];
      const shuffled = shuffleWithSeed(question.options, hash(`${seed}:${index}:${question.prompt}`));
      const answerIndex = shuffled.indexOf(correct);
      return { ...question, options: shuffled, answerIndex: answerIndex === -1 ? 0 : answerIndex, points: 1 };
    }
    return { ...question, points: 1 };
  });
}
