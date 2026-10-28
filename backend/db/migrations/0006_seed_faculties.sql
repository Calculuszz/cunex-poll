-- Every Chula faculty up front, so a poll can target faculties nobody has
-- logged in from yet. Code = last two digits of the student ID.
-- Names are the full official ones (CUNEX's facultyNameTH already starts
-- with "คณะ"; the UI shows them as-is). A login only adds codes missing here.
INSERT INTO faculties (code, name_th, name_en) VALUES
  ('20', 'บัณฑิตวิทยาลัย', 'Graduate School'),
  ('21', 'คณะวิศวกรรมศาสตร์', 'Faculty of Engineering'),
  ('22', 'คณะอักษรศาสตร์', 'Faculty of Arts'),
  ('23', 'คณะวิทยาศาสตร์', 'Faculty of Science'),
  ('24', 'คณะรัฐศาสตร์', 'Faculty of Political Science'),
  ('25', 'คณะสถาปัตยกรรมศาสตร์', 'Faculty of Architecture'),
  ('26', 'คณะพาณิชยศาสตร์และการบัญชี', 'Faculty of Commerce and Accountancy'),
  ('27', 'คณะครุศาสตร์', 'Faculty of Education'),
  ('28', 'คณะนิเทศศาสตร์', 'Faculty of Communication Arts'),
  ('29', 'คณะเศรษฐศาสตร์', 'Faculty of Economics'),
  ('30', 'คณะแพทยศาสตร์', 'Faculty of Medicine'),
  ('31', 'คณะสัตวแพทยศาสตร์', 'Faculty of Veterinary Science'),
  ('32', 'คณะทันตแพทยศาสตร์', 'Faculty of Dentistry'),
  ('33', 'คณะเภสัชศาสตร์', 'Faculty of Pharmaceutical Sciences'),
  ('34', 'คณะนิติศาสตร์', 'Faculty of Law'),
  ('35', 'คณะศิลปกรรมศาสตร์', 'Faculty of Fine and Applied Arts'),
  ('36', 'คณะพยาบาลศาสตร์', 'Faculty of Nursing'),
  ('37', 'คณะสหเวชศาสตร์', 'Faculty of Allied Health Sciences'),
  ('38', 'คณะจิตวิทยา', 'Faculty of Psychology'),
  ('39', 'คณะวิทยาศาสตร์การกีฬา', 'Faculty of Sports Science'),
  ('40', 'สำนักวิชาทรัพยากรการเกษตร', 'School of Agricultural Resources'),
  ('51', 'วิทยาลัยประชากรศาสตร์', 'College of Population Studies'),
  ('53', 'วิทยาลัยวิทยาศาสตร์สาธารณสุข', 'College of Public Health Sciences'),
  ('56', 'สถาบันนวัตกรรมบูรณาการ', 'School of Integrated Innovation'),
  ('58', 'สถาบันบัณฑิตบริหารธุรกิจ ศศินทร์', 'Sasin School of Management')
ON CONFLICT (code) DO UPDATE
  SET name_th = EXCLUDED.name_th, name_en = EXCLUDED.name_en, updated_at = now();
