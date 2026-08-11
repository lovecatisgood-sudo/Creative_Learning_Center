UPDATE "products"
SET "active" = false
WHERE "sku" NOT IN (
  'PLAYROOM_ENTRY_1H',
  'PLAYROOM_ENTRY_2H',
  'PLAYROOM_EXTRA_1H',
  'PLAYROOM_EXTRA_ADULT_1H',
  'PLAYROOM_CRAYON_ACTIVITY',
  'PLAYROOM_CLAY_SMALL',
  'PLAYROOM_CLAY_LARGE',
  'AFTERSCHOOL_ENTRY_1H',
  'AFTERSCHOOL_ENTRY_2H',
  'AFTERSCHOOL_HALF_DAY_4H',
  'MEAL_AFTERSCHOOL'
);--> statement-breakpoint
INSERT INTO "products" ("sku", "name_en", "name_th", "type", "price_thb", "grants", "active") VALUES
  ('PLAYROOM_ENTRY_1H', 'Kids Playroom — 1-Hour Entry', 'Kids Playroom — เข้าเล่น 1 ชั่วโมง', 'TIMED_ENTRY', 149, '{"hours":1}'::jsonb, true),
  ('PLAYROOM_ENTRY_2H', 'Kids Playroom — 2-Hour Entry', 'Kids Playroom — เข้าเล่น 2 ชั่วโมง', 'TIMED_ENTRY', 249, '{"hours":2}'::jsonb, true),
  ('PLAYROOM_EXTRA_1H', 'Kids Playroom — Additional Hour', 'Kids Playroom — เพิ่มเวลา 1 ชั่วโมง', 'ADDON', 80, '{"hours":1,"extendOnly":true}'::jsonb, true),
  ('PLAYROOM_EXTRA_ADULT_1H', 'Kids Playroom — Additional Adult (per hour)', 'Kids Playroom — ผู้ใหญ่เพิ่มเติม (ต่อชั่วโมง)', 'ADDON', 50, '{"receiptOnly":true}'::jsonb, true),
  ('PLAYROOM_CRAYON_ACTIVITY', 'Kids Playroom — Crayon Activity', 'Kids Playroom — กิจกรรมสีเทียน', 'ADDON', 45, '{"receiptOnly":true}'::jsonb, true),
  ('PLAYROOM_CLAY_SMALL', 'Kids Playroom — Small Soft-Clay Figure', 'Kids Playroom — ฟิกเกอร์ดินปั้นนิ่มขนาดเล็ก', 'ADDON', 69, '{"receiptOnly":true}'::jsonb, true),
  ('PLAYROOM_CLAY_LARGE', 'Kids Playroom — Large Soft-Clay Figure', 'Kids Playroom — ฟิกเกอร์ดินปั้นนิ่มขนาดใหญ่', 'ADDON', 99, '{"receiptOnly":true}'::jsonb, true),
  ('AFTERSCHOOL_ENTRY_1H', 'After School Explorer — 1 Hour', 'After School Explorer — 1 ชั่วโมง', 'TIMED_ENTRY', 199, '{"hours":1}'::jsonb, true),
  ('AFTERSCHOOL_ENTRY_2H', 'After School Explorer — 2 Hours', 'After School Explorer — 2 ชั่วโมง', 'TIMED_ENTRY', 300, '{"hours":2}'::jsonb, true),
  ('AFTERSCHOOL_HALF_DAY_4H', 'After School Explorer — 4-Hour Weekday Option', 'After School Explorer — ตัวเลือกวันธรรมดา 4 ชั่วโมง', 'TIMED_ENTRY', 599, '{"hours":4}'::jsonb, true),
  ('MEAL_AFTERSCHOOL', 'After School Meal Care Add-On', 'Meal Care หลังเลิกเรียน', 'ADDON', 299, '{"receiptOnly":true}'::jsonb, true)
ON CONFLICT ("sku") DO UPDATE SET
  "name_en" = EXCLUDED."name_en",
  "name_th" = EXCLUDED."name_th",
  "type" = EXCLUDED."type",
  "price_thb" = EXCLUDED."price_thb",
  "grants" = EXCLUDED."grants",
  "active" = true;--> statement-breakpoint
UPDATE "blog_posts"
SET
  "title_en" = '1 Hour or 2 Hours? Choosing a First Kids Playroom Visit',
  "summary_en" = 'Choose a one-hour or two-hour parent-accompanied Playroom visit based on your child''s energy, interest and the time your family has.',
  "seo_title_en" = 'First Kids Playroom Visit: 1 Hour or 2 Hours?',
  "seo_description_en" = 'Compare one-hour and two-hour Kids Playroom entry near Mega Bangna, including parent-stay rules, included coloring and creative add-ons.',
  "body_en" = $body_en$
## Start with the time your child can enjoy

A longer first visit is not automatically better. The useful question is simpler: will one hour or two hours give your child enough time to look around, choose something to do and leave while the experience still feels positive?

Kids Playroom is parent-accompanied. A parent or guardian stays on the premises and remains responsible for the child while staff guide activities. It is not a drop-off or childcare session.

## When one hour makes sense

Choose one hour when the space is new, your child is tired after another activity, or the family wants a low-commitment first look. The current price is **149 THB per child**.

An hour can include indoor play, soft play, Lego, reading or the included coloring sheet. Some children spend the first part watching before they join in. That is still useful: they are learning where things are and what feels comfortable.

## When two hours make sense

Choose two hours when your child usually settles into new spaces reasonably well or wants enough time to move between play and a creative activity. The current price is **249 THB per child**.

Two hours gives the visit room to change pace without turning it into a full-day commitment. If capacity allows, families who already bought an initial entry may ask for one additional hour at **80 THB**.

## What each child entry includes

Each one-hour or two-hour child entry includes:

- One accompanying adult
- One coloring sheet
- Playroom access for the purchased time

Each additional adult is **50 THB per hour**. The optional staff-guided crayon activity is **45 THB** and uses additional activity materials; it is separate from the included coloring sheet. Small and large soft-clay figure activities are **69 THB** and **99 THB**. Ask staff which figures and materials are currently available and whether any item may be taken home before purchase.

## A practical first-visit decision

Start with one hour if the family mainly wants to see how the room feels. Choose two hours if your child already wants time to play, pause and choose again. Bring an accompanying adult who can stay for the whole visit, and register before attending.

The useful result from a first visit is not a finished craft or the maximum number of minutes. It is knowing whether your child enjoyed the space and what they would choose next time.

[See the current Kids Playroom menu and registration details](/EN/playgroup).
$body_en$,
  "title_th" = '1 หรือ 2 ชั่วโมง? เลือกเวลา Kids Playroom ครั้งแรกให้พอดี',
  "summary_th" = 'เลือกเวลา Kids Playroom ที่มีผู้ปกครองอยู่ด้วยจากพลัง ความสนใจของเด็ก และเวลาที่ครอบครัวมีจริง',
  "seo_title_th" = 'มา Kids Playroom ครั้งแรก เลือก 1 หรือ 2 ชั่วโมง?',
  "seo_description_th" = 'เปรียบเทียบค่าเข้า Kids Playroom 1 และ 2 ชั่วโมง ใกล้ Mega Bangna พร้อมกฎผู้ปกครอง สิ่งที่รวม และกิจกรรมเสริม',
  "body_th" = $body_th$
## เริ่มจากเวลาที่เด็กสนุกได้พอดี

ครั้งแรกไม่จำเป็นต้องเลือกเวลาที่ยาวที่สุด คำถามที่มีประโยชน์กว่าคือ 1 หรือ 2 ชั่วโมงทำให้เด็กมีเวลามองรอบ ๆ เลือกสิ่งที่อยากทำ และกลับบ้านตอนที่ประสบการณ์ยังรู้สึกดีหรือไม่

Kids Playroom ต้องมีผู้ปกครองอยู่ด้วย ผู้ปกครองต้องอยู่ภายในสถานที่และยังคงรับผิดชอบดูแลเด็ก ขณะที่ทีมงานช่วยแนะนำกิจกรรม บริการนี้ไม่ใช่การฝากหรือดูแลเด็กโดยไม่มีผู้ปกครอง

## เมื่อ 1 ชั่วโมงเหมาะกว่า

เลือก 1 ชั่วโมงเมื่อพื้นที่ยังใหม่ เด็กเพิ่งผ่านกิจกรรมอื่นมา หรือครอบครัวอยากลองดูแบบไม่ผูกมัด ค่าเข้าปัจจุบันคือ **149 บาทต่อเด็ก**

หนึ่งชั่วโมงอาจมีการเล่นในร่ม ซอฟต์เพลย์ เลโก้ อ่านหนังสือ หรือใช้กระดาษระบายสีที่รวมอยู่ เด็กบางคนใช้ช่วงแรกยืนดู ก่อนจะตัดสินใจเข้าไปเล่น นั่นก็เป็นข้อมูลที่มีประโยชน์ เพราะเด็กกำลังทำความรู้จักพื้นที่และสิ่งที่ทำให้สบายใจ

## เมื่อ 2 ชั่วโมงเหมาะกว่า

เลือก 2 ชั่วโมงเมื่อเด็กปรับตัวกับพื้นที่ใหม่ได้พอสมควร หรืออยากมีเวลาสลับระหว่างการเล่นกับกิจกรรมสร้างสรรค์ ค่าเข้าปัจจุบันคือ **249 บาทต่อเด็ก**

สองชั่วโมงช่วยให้เปลี่ยนจังหวะได้โดยไม่กลายเป็นการอยู่เต็มวัน หากยังมีพื้นที่ ครอบครัวที่ซื้อค่าเข้าแล้วสามารถขอเพิ่มเวลา 1 ชั่วโมงในราคา **80 บาท**

## ค่าเข้าเด็กแต่ละคนรวมอะไร

ค่าเข้าเด็ก 1 หรือ 2 ชั่วโมงรวม:

- ผู้ใหญ่ที่มาด้วย 1 คน
- กระดาษระบายสี 1 แผ่น
- การเข้าใช้ Playroom ตามเวลาที่ซื้อ

ผู้ใหญ่เพิ่มเติมคนละ **50 บาทต่อชั่วโมง** กิจกรรมสีเทียนที่ทีมงานช่วยแนะนำราคา **45 บาท** ใช้วัสดุกิจกรรมเพิ่มเติมและแยกจากกระดาษระบายสีที่รวมอยู่ กิจกรรมฟิกเกอร์ดินปั้นนิ่มขนาดเล็กและใหญ่ราคา **69 บาท** และ **99 บาท** โปรดสอบถามแบบและวัสดุที่พร้อมให้บริการ รวมถึงยืนยันก่อนซื้อว่าสามารถนำผลงานใดกลับบ้านได้หรือไม่

## วิธีตัดสินใจแบบง่าย

เริ่ม 1 ชั่วโมงหากครอบครัวต้องการดูว่าพื้นที่เหมาะหรือไม่ เลือก 2 ชั่วโมงหากเด็กรู้แล้วว่าอยากมีเวลาเล่น พัก และเลือกกิจกรรมอีกครั้ง เตรียมผู้ปกครองที่อยู่ได้ตลอดการใช้บริการ และลงทะเบียนก่อนมา

ผลลัพธ์ที่มีประโยชน์จากครั้งแรกไม่ใช่งานประดิษฐ์ที่เสร็จหรือจำนวนนาทีที่มากที่สุด แต่คือการรู้ว่าเด็กชอบพื้นที่หรือไม่ และครั้งหน้าอยากเลือกอะไร

[ดูเมนู Kids Playroom และรายละเอียดการลงทะเบียนปัจจุบัน](/playgroup)
$body_th$,
  "updated_at" = now()
WHERE "slug" = 'first-playgroup-one-hour-two-hours-half-day';--> statement-breakpoint
UPDATE "blog_posts"
SET
  "body_en" = regexp_replace(
    "body_en",
    'Where Little Explorer fits into a Mega Bangna day(.|\n)*$',
    $section_en$Where Kids Playroom fits into a Mega Bangna day

Siamese Cat Creative Club is in Bang Kaeo near Mega Bangna. Kids Playroom is useful when a family wants a parent-accompanied place to play for one or two hours, with the option to add guided crayon or soft-clay activities.

Current entry is 149 THB for one hour or 249 THB for two hours per child. Each child entry includes one adult and one coloring sheet. An additional hour after initial entry is 80 THB, subject to capacity, and each additional adult is 50 THB per hour. The accompanying parent or guardian must remain on the premises and remains responsible for the child.

If the parent needs to leave or needs supervised care while handling errands, Kids Playroom is not the right product. Ask about the separate After School Explorer service instead, or choose another provider whose supervision terms match the day.

[See the current Kids Playroom menu and parent-stay details](/EN/playgroup).$section_en$
  ),
  "body_th" = regexp_replace(
    "body_th",
    'Little Explorer เหมาะกับวันแบบไหน(.|\n)*$',
    $section_th$Kids Playroom เหมาะกับวันแบบไหน

Siamese Cat Creative Club อยู่บางแก้ว ใกล้ Mega Bangna Kids Playroom เหมาะเมื่อครอบครัวอยากมีพื้นที่เล่นด้วยกัน 1 หรือ 2 ชั่วโมง และเลือกกิจกรรมสีเทียนหรือดินปั้นนิ่มที่ทีมงานช่วยแนะนำเพิ่มเติมได้

ค่าเข้าปัจจุบันคือ 1 ชั่วโมง 149 บาท หรือ 2 ชั่วโมง 249 บาทต่อเด็ก ค่าเข้าเด็กแต่ละคนรวมผู้ใหญ่ 1 คนและกระดาษระบายสี 1 แผ่น เพิ่มเวลา 1 ชั่วโมงหลังซื้อค่าเข้า 80 บาทเมื่อยังมีพื้นที่ และผู้ใหญ่เพิ่มเติมคนละ 50 บาทต่อชั่วโมง ผู้ปกครองต้องอยู่ภายในสถานที่และยังคงรับผิดชอบดูแลเด็ก

หากผู้ปกครองต้องออกจากสถานที่หรือต้องการบริการดูแลเด็กระหว่างไปทำธุระ Kids Playroom ไม่ใช่บริการที่ตรงกับโจทย์ ควรสอบถาม After School Explorer ซึ่งเป็นบริการแยก หรือเลือกผู้ให้บริการอื่นที่มีกติกาการดูแลตรงกับวันนั้น

[ดูเมนู Kids Playroom และกฎผู้ปกครองปัจจุบัน](/playgroup)$section_th$
  ),
  "updated_at" = now()
WHERE "slug" = 'things-to-do-kids-near-mega-bangna';--> statement-breakpoint
UPDATE "blog_posts"
SET
  "body_en" = replace(regexp_replace(
    "body_en",
    'Little Explorer Playgroup is for daytime and weekend use\.(.|\n)*?See the current Little Explorer details\.',
    $fit_en$Kids Playroom & Creative Activities is a parent-accompanied service. Current entry is one hour for 149 THB or two hours for 249 THB per child; each child entry includes one adult and one coloring sheet. The accompanying adult stays on the premises and remains responsible for the child while staff guide activities. Additional time and creative activities use the separate published menu. See the current Kids Playroom details.$fit_en$
  ), 'Compare Little Explorer and After School Explorer', 'Compare Kids Playroom and After School Explorer'),
  "body_th" = replace(regexp_replace(
    "body_th",
    'Little Explorer Playgroup เหมาะกับช่วงกลางวันและวันหยุด(.|\n)*?ดูรายละเอียด Little Explorer ปัจจุบัน',
    $fit_th$Kids Playroom และกิจกรรมสร้างสรรค์เป็นบริการที่ผู้ปกครองอยู่ด้วย ค่าเข้าปัจจุบันคือ 1 ชั่วโมง 149 บาท หรือ 2 ชั่วโมง 249 บาทต่อเด็ก โดยรวมผู้ใหญ่ 1 คนและกระดาษระบายสี 1 แผ่น ผู้ใหญ่ที่มาด้วยต้องอยู่ภายในสถานที่และยังคงรับผิดชอบดูแลเด็ก ขณะที่ทีมงานช่วยแนะนำกิจกรรม เวลาและกิจกรรมเสริมใช้ราคาตามเมนูที่ประกาศ ดูรายละเอียด Kids Playroom ปัจจุบัน$fit_th$
  ), 'เทียบ Little Explorer และ After School Explorer', 'เทียบ Kids Playroom และ After School Explorer'),
  "updated_at" = now()
WHERE "slug" = 'kids-club-playgroup-bangkok-which-fits-your-day';--> statement-breakpoint
UPDATE "blog_posts"
SET
  "body_en" = replace("body_en", 'Weekday four-hour half day: 599 THB', 'Weekday four-hour option: 599 THB'),
  "body_th" = replace("body_th", 'ครึ่งวันธรรมดา 4 ชั่วโมง: 599 บาท', 'ตัวเลือกวันธรรมดา 4 ชั่วโมง: 599 บาท'),
  "updated_at" = now()
WHERE "slug" = 'after-school-care-bangna-working-parents';
