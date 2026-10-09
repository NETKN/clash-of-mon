"use strict";
/* ================= data ================= */
const TY={
  fire:{n:"ไฟ",c:"#ff7a3d",beats:["grass","wind","metal","ice"]},
  water:{n:"น้ำ",c:"#3d9bff",beats:["fire","earth"]},
  grass:{n:"พืช",c:"#4cc26a",beats:["water","earth"]},
  elec:{n:"สายฟ้า",c:"#f7d23e",beats:["water","wind","metal"]},
  earth:{n:"ดิน",c:"#c08a4a",beats:["fire","elec"]},
  wind:{n:"ลม",c:"#8fe3d0",beats:["grass","earth"]},
  metal:{n:"โลหะ",c:"#b8c4d0",beats:["grass","shadow","ice"]},
  shadow:{n:"เงา",c:"#9a6adf",beats:["elec","water","light"]},
  ice:{n:"น้ำแข็ง",c:"#9fe6ff",beats:["grass","wind","earth"]},
  light:{n:"แสง",c:"#fff3a0",beats:["shadow","metal"]},
  norm:{n:"ปกติ",c:"#c9c5d6",beats:[]}
};
const eff1=(a,d)=>a==="norm"?1:TY[a].beats.includes(d)?1.5:(a===d||TY[d].beats.includes(a))?.6:1;
const eff=(a,ds)=>ds.reduce((m,d)=>m*eff1(a,d),1);

/* aim: how a move is pointed. line = along a direction, cone = wedge, point = a spot on the ground within rng, self = around the user */
const MOVES={
  /* basic attacks, one per monster, no cooldown to manage */
  b_pyros:{n:"ขนเพลิง",t:"fire",kind:"shot",aim:"line",pw:4,cd:.34,sp:380,r:4,cnt:2,gap:.07,life:.85,basic:1,d:"ยิงขนไฟ 2 ลูกรัว"},
  b_crusta:{n:"ก้ามหนีบ",t:"water",kind:"melee",aim:"cone",pw:10,cd:.5,rng:56,arc:2.2,kb:110,basic:1,d:"ฟาดก้ามหนัก ผลักศัตรูออกจากระยะประชิด"},
  b_mekha:{n:"ประกายเขา",t:"elec",kind:"shot",aim:"line",pw:5,cd:.3,sp:470,r:4,cnt:1,life:.75,basic:1,d:"ยิงประกายไฟเร็ว"},
  b_prikky:{n:"พ่นเมล็ด",t:"grass",kind:"shot",aim:"cone",pw:3,cd:.42,sp:360,r:4,cnt:3,fan:.32,life:.8,basic:1,d:"พ่นเมล็ด 3 ลูกเป็นพัด"},
  b_sila:{n:"หมัดศิลา",t:"earth",kind:"melee",aim:"cone",pw:12,cd:.6,rng:58,arc:2,kb:120,heavy:1,basic:1,d:"ต่อยหนักระยะประชิด ผลักถอย"},
  b_eela:{n:"พ่นน้ำ",t:"water",kind:"shot",aim:"line",pw:5,cd:.34,sp:350,r:5,cnt:1,life:.9,basic:1,d:"พ่นลูกน้ำ"},
  b_fuwa:{n:"เป่าลม",t:"wind",kind:"shot",aim:"line",pw:4,cd:.36,sp:320,r:6,cnt:1,kb:70,life:.9,basic:1,d:"เป่าลูกลม ผลักเบา ๆ"},
  b_lavarok:{n:"เขาลาวา",t:"fire",kind:"melee",aim:"cone",pw:11,cd:.56,rng:54,arc:1.8,burn:1,kb:140,heavy:1,basic:1,d:"ขวิดด้วยเขาร้อน ติดไฟและผลักถอย"},
  b_blazar:{n:"ลูกไฟรัว",t:"fire",kind:"shot",aim:"line",pw:3,cd:.44,sp:400,r:5,cnt:3,gap:.06,life:.85,basic:1,d:"พ่นลูกไฟ 3 ลูกรัวเป็นชุด"},
  b_reya:{n:"ลูกน้ำวน",t:"water",kind:"shot",aim:"line",pw:5,cd:.34,sp:340,r:6,cnt:1,life:.9,basic:1,d:"ยิงลูกน้ำหมุน"},
  b_terran:{n:"ทุบพสุธา",t:"earth",kind:"melee",aim:"cone",pw:13,cd:.66,rng:66,arc:2.3,kb:150,heavy:1,basic:1,d:"ทุบพื้นเป็นคลื่นกระแทกวงกว้าง ผลักถอย"},
  b_nivara:{n:"ขนนกน้ำแข็ง",t:"ice",kind:"shot",aim:"line",pw:4,cd:.36,sp:430,r:4,cnt:2,gap:.07,life:.8,basic:1,d:"ยิงขนนกน้ำแข็ง 2 ลูกรัว"},
  b_umbra:{n:"กรงเล็บเงา",t:"shadow",kind:"melee",aim:"cone",pw:7,cd:.32,rng:50,arc:1.7,kb:75,basic:1,d:"ข่วนเร็วต่อเนื่องและดันคู่ต่อสู้เสียจังหวะ"},
  b_aurex:{n:"หมัดเกราะสุริยะ",t:"metal",kind:"melee",aim:"cone",pw:9,cd:.36,rng:62,arc:1.65,kb:95,heavy:1,basic:1,d:"หมัดเกราะแสงระยะประชิด ต่อยเร็วและผลักเล็กน้อย"},
  /* fire */
  wheel:{n:"กงล้อเพลิง",t:"fire",kind:"dash",aim:"line",pw:17,cd:3.2,sp:470,dur:.34,burn:3,d:"พุ่งชน ทำให้ติดไฟ"},
  blaze:{n:"ทะเลเพลิง",t:"fire",kind:"zone",aim:"point",pw:5,cd:7,rad:48,delay:.45,dur:4,rng:210,d:"จุดกองไฟที่จุดเล็ง ยืนอยู่โดนต่อเนื่อง"},
  breath:{n:"ลมหายใจมังกร",t:"fire",kind:"breath",aim:"cone",pw:6,cd:4.5,rng:120,arc:.95,dur:.7,burn:2,d:"พ่นไฟเป็นกรวย โดน 4 จังหวะ เผาพุ่มไม้"},
  orbit:{n:"ลูกไฟโคจร",t:"fire",kind:"orbit",aim:"self",pw:8,cd:9,dur:5,rad:36,d:"ลูกไฟ 3 ลูกหมุนรอบตัว 5 วินาที ใครเข้าใกล้โดนเผา"},
  frain:{n:"ฝนดาวตก",t:"fire",kind:"rain",aim:"point",pw:11,cd:8,rad:72,rng:230,num:6,d:"ดาวตก 6 ลูกถล่มรอบจุดเล็ง ทิ้งกองไฟ"},
  /* water */
  bubble:{n:"ฟองน้ำกระจาย",t:"water",kind:"shot",aim:"cone",pw:5,cd:1.6,sp:230,r:7,cnt:5,fan:.7,slow:1.6,d:"ยิง 5 ลูกเป็นพัด ทำให้ช้า ดับลาวาได้"},
  jet:{n:"พุ่งวารี",t:"water",kind:"dash",aim:"line",pw:14,cd:2.5,sp:520,dur:.3,d:"พุ่งชนเร็ว คูลดาวน์สั้น"},
  geyser:{n:"น้ำพุร้อน",t:"water",kind:"strike",aim:"point",pw:22,cd:5.5,rad:46,delay:.65,kb:240,rng:220,d:"น้ำพุ่งจากพื้นที่จุดเล็ง ผลักกระเด็น"},
  bounce:{n:"ลูกน้ำเด้ง",t:"water",kind:"shot",aim:"line",pw:13,cd:3,sp:300,r:9,cnt:1,bn:4,life:3,d:"ลูกน้ำเด้งกำแพงและสิ่งกีดขวางได้ 4 ครั้ง"},
  shield:{n:"ม่านฟองน้ำ",t:"water",kind:"buff",aim:"self",pw:0,cd:9,buff:"shield",d:"ฟองน้ำรับความเสียหายแทน 32 หน่วย นาน 5 วินาที"},
  /* grass */
  leaf:{n:"พายุใบมีด",t:"grass",kind:"shot",aim:"line",pw:4,cd:1.4,sp:400,r:4,cnt:6,gap:.05,d:"ยิง 6 ลูกเร็วมากเป็นสาย"},
  hook:{n:"เถาวัลย์ดึง",t:"grass",kind:"shot",aim:"line",pw:8,cd:5,sp:430,r:8,cnt:1,hook:1,life:.75,d:"ยิงเถาวัลย์ โดนแล้วดึงคู่ต่อสู้เข้ามาหา"},
  drain:{n:"เมล็ดดูดพลัง",t:"grass",kind:"shot",aim:"line",pw:5,cd:3.2,sp:270,r:6,cnt:3,gap:.1,drain:.6,d:"ยิง 3 ลูก ฟื้นพลัง 60% ของความเสียหาย"},
  trap:{n:"กับดักสปอร์",t:"grass",kind:"trap",aim:"point",pw:12,cd:6,rad:34,rng:180,stun:1.1,d:"วางกับดักที่จุดเล็ง เหยียบแล้วระเบิดและขยับไม่ได้"},
  healz:{n:"สวนฟื้นพลัง",t:"grass",kind:"zone",aim:"self",pw:0,cd:12,rad:54,delay:.1,dur:5,heal:5,d:"สร้างสวนรอบตัว ยืนอยู่ฟื้นพลังต่อเนื่อง"},
  /* electric */
  fork:{n:"สายฟ้าสามแฉก",t:"elec",kind:"shot",aim:"cone",pw:7,cd:1.6,sp:480,r:4,cnt:3,fan:.36,pierce:1,d:"สายฟ้า 3 แฉก ทะลุสิ่งกีดขวาง ช็อตแม่น้ำได้"},
  thunder:{n:"อัสนีบาต",t:"elec",kind:"strike",aim:"point",pw:22,cd:6,rad:42,delay:.6,stun:.6,rng:230,d:"ฟ้าผ่าลงจุดเล็ง ทำให้มึน"},
  volt:{n:"วาบสายฟ้า",t:"elec",kind:"dash",aim:"line",pw:12,cd:2.4,sp:640,dur:.22,d:"พุ่งชนเร็วที่สุด"},
  homing:{n:"บอลสายฟ้าไล่ล่า",t:"elec",kind:"shot",aim:"line",pw:16,cd:5,sp:150,r:9,cnt:1,home:2.4,life:3.2,d:"ลูกบอลช้า ๆ ที่เลี้ยวตามคู่ต่อสู้"},
  blink:{n:"วาร์ปสายฟ้า",t:"elec",kind:"blink",aim:"point",pw:12,cd:5,rad:44,rng:190,d:"วาร์ปไปจุดเล็งทันที ทิ้งระเบิดสายฟ้าไว้ที่จุดเดิม"},
  /* earth */
  rock:{n:"ขว้างหินคู่",t:"earth",kind:"shot",aim:"line",pw:10,cd:1.8,sp:250,r:9,cnt:2,gap:.16,kb:150,heavy:1,d:"หิน 2 ก้อน หนัก ทำลายลังและโขดหินได้"},
  quake:{n:"แผ่นดินไหว",t:"earth",kind:"slam",aim:"self",pw:21,cd:5,rad:86,delay:.5,crater:2,terrain:26,breach:1,stun:.5,kb:220,heavy:9,d:"กระแทกพื้นรอบตัว ฉีกพื้นเป็นหลุมอันตรายและเจาะกำแพง"},
  dig:{n:"ขุดดิน",t:"earth",kind:"dig",aim:"self",pw:19,cd:6.5,d:"มุดดินหลบทุกท่า แล้วโผล่ขึ้นโจมตี"},
  wall:{n:"กำแพงหิน",t:"earth",kind:"wall",aim:"point",pw:0,cd:7,rng:110,dur:5,d:"ตั้งกำแพงหิน 3 ก้อนขวางที่จุดเล็ง บังกระสุนได้ 5 วินาที"},
  mortar:{n:"ระเบิดหินโค้ง",t:"earth",kind:"strike",aim:"point",pw:20,cd:4.5,rad:52,delay:.65,lob:1,crater:1,breach:1,kb:220,heavy:9,rng:250,d:"โยนหินข้ามสิ่งกีดขวาง ระเบิดเจาะผนังและผลักศัตรู"},
  /* wind */
  gust:{n:"ลมกรดสามสาย",t:"wind",kind:"shot",aim:"cone",pw:5,cd:1.6,sp:340,r:8,cnt:3,fan:.4,kb:200,d:"ยิง 3 ลูกเป็นพัด ผลักออกห่าง"},
  cyclone:{n:"พายุหมุน",t:"wind",kind:"shot",aim:"line",pw:15,cd:3.4,sp:170,r:15,cnt:1,pierce:1,life:2.6,d:"ลูกใหญ่ เคลื่อนช้า ทะลุสิ่งกีดขวาง"},
  tail:{n:"ลมส่งท้าย",t:"wind",kind:"buff",aim:"self",pw:0,cd:9,buff:"haste",d:"เดินเร็วขึ้น 50% นาน 4 วินาที"},
  boom:{n:"ใบมีดลมวกกลับ",t:"wind",kind:"shot",aim:"line",pw:9,cd:3.2,sp:540,r:10,cnt:1,boom:1,pierce:1,life:2,d:"ใบมีดลมพุ่งออกไปแล้ววกกลับ โดนได้ทั้งขาไปและขากลับ"},
  vac:{n:"หลุมสุญญากาศ",t:"wind",kind:"zone",aim:"point",pw:4,cd:7,rad:70,delay:.35,dur:1.5,pull:210,rng:210,d:"ดูดคู่ต่อสู้เข้าหาจุดเล็ง 1.5 วินาที"},
  /* metal */
  shrap:{n:"เศษเหล็กกระจาย",t:"metal",kind:"shot",aim:"cone",pw:5,cd:1.7,sp:380,r:5,cnt:5,fan:.6,bn:1,life:1.3,d:"เศษเหล็ก 5 ชิ้นเป็นพัด เด้งกำแพงได้ 1 ครั้ง"},
  saw:{n:"กงจักรเหล็ก",t:"metal",kind:"shot",aim:"line",pw:10,cd:3.4,sp:500,r:10,cnt:1,boom:1,pierce:1,life:2,heavy:1,d:"กงจักรพุ่งออกแล้ววกกลับ พังลังไม้ได้"},
  spike:{n:"หนามเหล็กผุด",t:"metal",kind:"strike",aim:"point",pw:20,cd:5,rad:42,delay:.5,slow:1.5,rng:220,d:"หนามเหล็กพุ่งขึ้นจากพื้นที่จุดเล็ง ทำให้ช้า"},
  ram:{n:"เกราะพุ่งชน",t:"metal",kind:"dash",aim:"line",pw:16,cd:3,sp:480,dur:.32,stun:.4,heavy:1,d:"พุ่งชนด้วยเกราะ คู่ต่อสู้มึน"},
  armor:{n:"เกราะเหล็กไหล",t:"metal",kind:"buff",aim:"self",pw:0,cd:10,buff:"armor",d:"ลดความเสียหาย 60% นาน 3 วินาที"},
  /* shadow */
  fang:{n:"เขี้ยวรัตติกาล",t:"shadow",kind:"shot",aim:"cone",pw:6,cd:1.6,sp:420,r:5,cnt:3,fan:.34,pierce:1,d:"คลื่นเงา 3 สาย ทะลุสิ่งกีดขวาง"},
  lunge:{n:"เงาพุ่งสังหาร",t:"shadow",kind:"dash",aim:"line",pw:13,cd:2.2,sp:680,dur:.2,d:"พุ่งเร็วที่สุดในเกม ทิ้งภาพติดตา"},
  wisp:{n:"ดวงไฟเงาไล่ล่า",t:"shadow",kind:"shot",aim:"line",pw:14,cd:5,sp:160,r:9,cnt:1,home:2.6,life:3.2,d:"ดวงไฟเงาช้า ๆ ที่เลี้ยวตามคู่ต่อสู้"},
  pit:{n:"บ่อเงา",t:"shadow",kind:"zone",aim:"point",pw:4,cd:7,rad:56,delay:.4,dur:3.5,slow:.8,rng:210,d:"บ่อเงาที่จุดเล็ง กัดพลังและทำให้ช้า"},
  cloak:{n:"ม่านเงา",t:"shadow",kind:"buff",aim:"self",pw:0,cd:11,buff:"cloak",d:"หายตัว 3.5 วินาทีและเดินเร็วขึ้น โจมตีแล้วจะเผยตัว"},
  /* ice */
  icelance:{n:"หอกน้ำแข็ง",t:"ice",kind:"shot",aim:"line",pw:13,cd:2.6,sp:520,r:7,cnt:1,pierce:1,slow:1,life:1,d:"หอกน้ำแข็งทะลุทุกอย่าง ทำให้ช้า"},
  frostwave:{n:"คลื่นความเย็น",t:"ice",kind:"breath",aim:"cone",pw:2,cd:9,rng:150,arc:1,dur:3.4,chill:.16,slow:.4,d:"ปล่อยคลื่นความเย็นต่อเนื่อง ถ้าศัตรูโดนครบ 3 วินาทีจะแข็งเป็นน้ำแข็ง 2 วินาที"},
  icicle:{n:"หินย้อยถล่ม",t:"ice",kind:"strike",aim:"point",pw:18,cd:4.5,rad:46,delay:.6,slow:2,rng:230,d:"แท่งน้ำแข็งยักษ์ร่วงลงที่จุดเล็ง ทำให้ช้า"},
  icewall:{n:"กำแพงน้ำแข็ง",t:"ice",kind:"wall",aim:"point",pw:0,cd:7,rng:120,dur:6,ice:1,d:"ตั้งกำแพงน้ำแข็ง 3 ก้อน บังกระสุน 6 วินาที"},
  frostarmor:{n:"เกราะเหมันต์",t:"ice",kind:"buff",aim:"self",pw:0,cd:10,buff:"armor",d:"ลดความเสียหาย 60% นาน 3 วินาที"},
  /* light */
  holyray:{n:"ลำแสงศักดิ์สิทธิ์",t:"light",kind:"beam",aim:"line",pw:28,cd:4.5,heavy:9,breach:2,recoil:115,d:"กดค้างชาร์จแล้วยิงลำแสงสีทอง เจาะฉากและผลักผู้ยิงถอย"},
  prism:{n:"ปริซึมกระจาย",t:"light",kind:"shot",aim:"cone",pw:5,cd:2,sp:440,r:5,cnt:5,fan:.8,bn:1,life:1.1,d:"แสง 5 สายเป็นพัด เด้งกำแพงได้ 1 ครั้ง"},
  sanctuary:{n:"วงแสงฟื้นพลัง",t:"light",kind:"zone",aim:"self",pw:0,heal:4,rad:66,delay:.1,dur:4,cd:12,d:"วงแสงรอบตัว ฟื้นพลัง 4 ทุกครึ่งวินาที นาน 4 วินาที"},
  halo:{n:"วงแหวนรัศมี",t:"light",kind:"ring",aim:"self",pw:14,cd:4,max:150,stun:.3,d:"วงแหวนแสงแผ่ออกรอบตัว ทำให้มึนเล็กน้อย"},
  lightdash:{n:"แสงวาบพุ่ง",t:"light",kind:"dash",aim:"line",pw:12,cd:2.4,sp:620,dur:.22,d:"พุ่งเร็วเป็นแสงวาบ"},
  /* common */
  tackle:{n:"พุ่งชน",t:"norm",kind:"dash",aim:"line",pw:12,cd:2.2,sp:440,dur:.3,stun:.45,heavy:1,d:"ชนแล้วคู่ต่อสู้มึน พังลังไม้ได้"},
  leap:{n:"กระโดดทุ่ม",t:"norm",kind:"leap",aim:"point",pw:20,cd:4.5,rad:64,rng:180,d:"กระโดดข้ามสิ่งกีดขวางไปจุดเล็ง แล้วกระแทกพื้น"},
  ring:{n:"วงแหวนพลัง",t:"self",kind:"ring",aim:"self",pw:14,cd:4,max:140,d:"วงแหวนธาตุหลักแผ่ออกรอบตัว กลิ้งหลบผ่านได้"},
  beam:{n:"ลำแสงทำลาย",t:"self",kind:"beam",aim:"line",pw:30,cd:4.5,heavy:9,breach:3,recoil:150,d:"ชาร์จลำแสงธาตุหลัก เจาะผนัง ทำลายสะพาน และถีบผู้ยิงถอย"},
  clone:{n:"แยกร่าง",t:"norm",kind:"clone",aim:"self",pw:5,cd:12,d:"เรียกร่างแยก 2 ตัว พลังชีวิตน้อย วิ่งเข้าไปช่วยโจมตี"},
  guard:{n:"ตั้งการ์ด",t:"norm",kind:"buff",aim:"self",pw:0,cd:7,buff:"guard",d:"ลดความเสียหาย 60% นาน 1.6 วินาที"},
  rest:{n:"พักฟื้น",t:"norm",kind:"buff",aim:"self",pw:0,cd:13,buff:"rest",d:"หยุดนิ่ง 1 วินาที แล้วฟื้นพลัง 26"},
  /* Aurex signature set: a fighting-game style rush, rising strike and projectile */
  aurex_rush:{n:"หมัดดาวหาง",t:"light",kind:"dash",aim:"line",pw:18,cd:4,sp:610,dur:.32,kb:360,stun:.25,heavy:9,hidden:1,d:"พุ่งหมัดทะลวงแนวตรง ชนศัตรูกระเด็นและเตะวัตถุในสนาม"},
  aurex_upper:{n:"หมัดเสยดาวรุ่ง",t:"metal",kind:"leap",aim:"point",pw:0,cd:5.2,rng:185,rad:76,land:"aurex_upperland",hidden:1,d:"กระโจนไปจุดเล็ง ก่อนเสยพื้นเป็นคลื่นกระแทกวงกว้าง"},
  aurex_wave:{n:"คลื่นหมัดสุริยะ",t:"light",kind:"shot",aim:"line",pw:15,cd:2.8,sp:500,r:13,cnt:1,pierce:1,life:1.05,kb:230,heavy:1,crescent:1,hidden:1,d:"เหวี่ยงหมัดปล่อยคลื่นแสงทะลุเป้าหมายและผลักศัตรู"},
  aurex_upperland:{t:"metal",kind:"slam",pw:22,rad:76,delay:0,crater:1,kb:470,stun:.4,heavy:9,hidden:1},
  /* Chronox: shadow/ice time hunter */
  b_chronox:{n:"เข็มกาลเยือกแข็ง",t:"ice",kind:"shot",aim:"line",pw:6,cd:.38,sp:500,r:5,cnt:1,life:.9,chill:.3,basic:1,d:"ยิงเข็มเวลาน้ำแข็ง สะสมความเย็นจนแช่แข็ง"},
  chrono_step:{n:"ย่างก้าวข้ามวินาที",t:"shadow",kind:"dash",aim:"line",pw:15,cd:3,sp:720,dur:.24,kb:180,stun:.2,hidden:1,d:"หายเข้าเงาแล้วพุ่งผ่านเป้าหมายอย่างฉับพลัน"},
  chrono_orb:{n:"ดาวค้างเวลา",t:"ice",kind:"shot",aim:"line",pw:14,cd:4.2,sp:175,r:11,cnt:1,home:2.8,life:3.4,slow:2,chill:1,hidden:1,d:"ดาวน้ำแข็งติดตามเป้าหมาย ทำให้ช้าและเร่งสถานะแช่แข็ง"},
  chrono_well:{n:"หลุมแรงโน้มถ่วงนิรันดร์",t:"shadow",kind:"zone",aim:"point",pw:5,cd:7.5,rad:78,delay:.35,dur:2.2,pull:250,rng:230,hidden:1,d:"บิดเวลาเป็นหลุมแรงโน้มถ่วง ดูดศัตรูเข้าศูนย์กลาง"},
  /* Verdara: grass/light prism guardian */
  b_verdara:{n:"เกสรปริซึม",t:"grass",kind:"shot",aim:"cone",pw:3,cd:.4,sp:410,r:4,cnt:3,fan:.28,life:.9,basic:1,d:"ยิงเกสรผลึกสามสายเป็นพัด"},
  verd_lance:{n:"เขากวางแสงทะลวง",t:"light",kind:"shot",aim:"line",pw:17,cd:3.2,sp:560,r:10,cnt:1,pierce:1,life:1.05,kb:280,heavy:1,crescent:1,hidden:1,d:"ปล่อยคมหอกแสงทะลุเป้าหมายและผลักออก"},
  verd_bloom:{n:"สวนผลึกมีชีวิต",t:"grass",kind:"zone",aim:"point",pw:4,cd:8,rad:72,delay:.3,dur:4,heal:4,rng:210,hidden:1,d:"สร้างสวนผลึกที่ทำร้ายศัตรูและฟื้นพลังผู้สร้าง"},
  verd_wall:{n:"แนวไม้ปริซึม",t:"light",kind:"wall",aim:"point",pw:0,cd:7,rng:125,dur:6,ice:1,hidden:1,d:"ปลูกกำแพงผลึกสามต้น ใช้บังทางหรือบีบพื้นที่"},
  /* helpers the player never picks */
  digout:{t:"earth",kind:"slam",pw:19,rad:58,delay:.25,crater:2,heavy:1,hidden:1},
  leapland:{t:"norm",kind:"slam",pw:20,rad:64,delay:0,crater:1,kb:200,heavy:1,hidden:1},
  blinkout:{t:"elec",kind:"slam",pw:12,rad:44,delay:.3,stun:.3,hidden:1},
  trapgo:{t:"grass",kind:"env",pw:12,rad:34,stun:1.1,hidden:1},
  meteor:{t:"fire",kind:"strike",pw:11,rad:40,burn:2,hidden:1},
  bolt:{t:"elec",kind:"strike",pw:13,rad:40,stun:.35,hidden:1},
  trailz:{t:"fire",kind:"zone",pw:5,rad:40,dur:3,hidden:1},
  /* signature ultimates: each one is a staged sequence (see u_ult.js), nothing like the normal moves */
  u_bird:{n:"วิหคเพลิงผลาญฟ้า",t:"fire",kind:"u_bird",aim:"point",rng:300,rad:46,star:1,pw:11,ult:1,d:"ทะยานขึ้นฟ้ากลายเป็นวิหคเพลิงยักษ์ โฉบกวาดผ่านจุดเล็ง 3 รอบเป็นรูปดาว แล้วจุติลงมาระเบิดพร้อมฟื้นพลัง"},
  u_shell:{n:"กระดองเพชรคลื่นคลั่ง",t:"water",kind:"u_shell",aim:"line",sp:330,dur:1.2,hr:34,pw:8,kb:340,heavy:9,ult:1,d:"หดเข้ากระดองแล้วหมุนโต้คลื่น บังคับทิศเองได้ 3 วินาที ชนซ้ำได้ เด้งกำแพง สาดเศษผลึกรอบตัว"},
  u_cloud:{n:"เมฆาพิโรธ",t:"elec",kind:"u_cloud",aim:"self",rad:125,pw:8,ult:1,d:"ลอยขึ้นร่ายเมฆพายุยักษ์ที่ลอยไล่ตามคู่ต่อสู้ ฝนทำให้ช้า ฟ้าผ่าไม่หยุด ปิดท้ายด้วยอสนีบาตยักษ์"},
  u_chili:{n:"มหาพริกนรกแตกหน่อ",t:"fire",kind:"u_chili",aim:"point",rng:260,rad:78,rad2:198,pw:16,ult:1,d:"ขว้างพริกยักษ์ลงจุดเล็ง ระเบิดแล้วแตกหน่อเป็นพริกลูกเล็กระเบิดต่อกันเป็นวงสองชั้น"},
  u_colossus:{n:"ร่างยักษ์ศิลาพันปี",t:"earth",kind:"u_colossus",aim:"self",rad:150,pw:10,ult:1,d:"ขยายร่างเป็นยักษ์หิน 7 วินาที เกราะลดความเสียหาย ไม่ติดมึน หมัดกว้างแรง ทุกก้าวแผ่นดินไหว"},
  u_dragon:{n:"มังกรอัสนีวารี",t:"elec",kind:"u_dragon",aim:"line",sp:255,dur:1.6,hr:20,pw:7,ult:1,d:"อัญเชิญมังกรสายฟ้าตัวยาวว่ายไล่ล่าคู่ต่อสู้ 5 วินาที ฟาดซ้ำได้ ช็อตแม่น้ำ แล้วระเบิดปิดท้าย"},
  u_bubble:{n:"ฟองนภากักขัง",t:"water",kind:"u_bubble",aim:"self",rad:60,pw:4,ult:1,d:"ปล่อยฟองยักษ์ 5 ลูกลอยไล่ ถ้าโดนจะถูกขังลอยกลางอากาศ ฟองที่เหลือพุ่งเข้าระเบิดซ้ำแล้วซัดกระเด็น"},
  u_volcano:{n:"มหาภูเขาไฟพิโรธ",t:"fire",kind:"u_volcano",aim:"self",rad:150,pw:4,ult:1,d:"มุดดินกลายเป็นภูเขาไฟ ลาวาแผ่ขยายรอบตัวและพ่นระเบิดลาวาใส่คู่ต่อสู้ตลอดเวลา เกราะแข็งระหว่างปะทุ"},
  u_barrage:{n:"นรกเพลิงคราม",t:"fire",kind:"u_barrage",aim:"line",sp:540,life:.95,r:12,pw:3,ult:1,d:"สูดไฟแล้วรัวลูกไฟยักษ์ 22 ลูก ยิ่งยิงยิ่งร้อนจนกลายเป็นเปลวไฟสีฟ้า หมุนทิศยิงได้ตามที่เล็ง"},
  u_flood:{n:"มหาอุทกภัย",t:"water",kind:"u_flood",aim:"self",rad:90,pw:4,ult:1,d:"น้ำท่วมทั้งสนาม 6 วินาที คู่ต่อสู้ช้าลง ไฟและลาวาดับ เกลียวน้ำ 3 ลำไล่ดูดคู่ต่อสู้ ตัวเองเร็วขึ้น"},
  u_cage:{n:"คุกศิลาพันปี",t:"earth",kind:"u_cage",aim:"point",rng:260,rad:90,pw:7,ult:1,d:"เสาหิน 13 ต้นผุดขึ้นล้อมจุดเล็งเป็นกรง หนามรากไม้ผุดในกรง 3 ระลอก ปิดท้ายด้วยหินยักษ์ถล่มลงกลางกรง"},
  u_phantom:{n:"เงาอัสนีสามภพ",t:"shadow",kind:"u_phantom",aim:"self",rad:84,pw:13,ult:1,d:"ลอยขึ้นร่ายวงเวทย์ (อมตะระหว่างร่าย) เรียกร่างเงา 3 ร่าง HP ครึ่งหนึ่ง ตีแรงเท่าร่างต้น พุ่งสายฟ้าเข้าหาศัตรู"},
  u_knight:{n:"อัศวินแสงเหมันต์",t:"light",kind:"u_knight",aim:"self",rad:70,pw:10,ult:1,d:"แปลงร่างเป็นอัศวินแสงถือดาบ 15 วินาที สกิลเปลี่ยนเป็นคลื่นดาบแสง กระโดดปักดาบ และพุ่งฟันพร้อมกำแพงน้ำแข็ง"},
  u_impact:{n:"มหาสังเวียนดาวตก",t:"light",kind:"u_impact",aim:"point",rng:290,rad:190,pw:26,ult:1,d:"ทะยานขึ้นแล้วทิ้งหมัดดาวตก เกิดแรงกระแทก 3 ชั้น ทำลายฉาก เตะวัตถุ และผลักศัตรูอย่างรุนแรง"},
  u_event:{n:"สุริยคราสหยุดกาล",t:"shadow",kind:"u_event",aim:"point",rng:300,rad:180,pw:26,ult:1,d:"หยุดเวลาในจุดเล็ง ดูดทุกสิ่งเข้าศูนย์กลาง ก่อนยุบตัวเป็นหลุมมิติที่ตกลงไปได้"},
  u_worldtree:{n:"มหาพฤกษาปริซึม",t:"grass",kind:"u_worldtree",aim:"point",rng:270,rad:170,pw:22,ult:1,d:"ปลูกมหาพฤกษาผลึก รากสามระลอกยกศัตรูและฉาก ก่อนระเบิดแสงผลักออกพร้อมฟื้นพลัง"},
  /* light knight form */
  k_slash:{n:"ฟันดาบแสง",t:"light",kind:"melee",aim:"cone",pw:11,cd:.42,rng:72,arc:2.4,kb:140,hidden:1},
  k_wave:{n:"คลื่นดาบแสง",t:"light",kind:"shot",aim:"line",pw:16,cd:1.3,sp:540,r:16,cnt:1,pierce:1,life:.9,heavy:1,crescent:1,hidden:1},
  k_plunge:{n:"ปักดาบสะเทือนพื้น",t:"light",kind:"leap",aim:"point",pw:0,cd:4,rng:200,rad:96,land:"k_plungeland",hidden:1},
  k_plungeland:{t:"light",kind:"slam",pw:20,rad:96,delay:0,crater:1,kb:460,stun:.3,heavy:9,hidden:1},
  k_dashwall:{n:"พุ่งฟันน้ำแข็ง",t:"ice",kind:"dash",aim:"line",pw:16,cd:3.5,sp:600,dur:.28,slow:1.5,wallAfter:1,hidden:1},
  /* ult parts (hidden) */
  birdpass:{t:"fire",kind:"env",pw:11,burn:2,kb:220,heavy:9,hidden:1},
  birdland:{t:"fire",kind:"strike",pw:18,rad:100,burn:3,kb:320,heavy:9,breach:1,bridge:3,crater:1,hidden:1},
  shard:{t:"water",kind:"shot",pw:3,sp:300,r:6,life:.7,hidden:1},
  shellend:{t:"water",kind:"strike",pw:10,rad:74,kb:360,slow:1.5,heavy:9,breach:1,bridge:3,hidden:1},
  cbolt:{t:"elec",kind:"strike",pw:8,rad:36,stun:.25,hidden:1},
  cmega:{t:"elec",kind:"strike",pw:18,rad:96,stun:.6,kb:280,heavy:9,breach:2,bridge:4,crater:1,hidden:1},
  chili1:{t:"fire",kind:"strike",pw:16,rad:78,burn:3,kb:280,heavy:9,breach:2,crater:2,terrain:30,hidden:1},
  chili2:{t:"fire",kind:"strike",pw:9,rad:48,burn:2,heavy:1,hidden:1},
  chili3:{t:"fire",kind:"strike",pw:7,rad:42,burn:2,heavy:1,hidden:1},
  colring:{t:"earth",kind:"ring",pw:10,max:150,stun:.5,kb:200,heavy:9,hidden:1},
  stomp:{t:"earth",kind:"strike",pw:6,rad:54,heavy:9,hidden:1},
  b_giant:{n:"หมัดยักษ์ศิลา",t:"earth",kind:"melee",aim:"cone",pw:17,cd:.62,rng:98,arc:2.3,kb:260,heavy:9,hidden:1},
  dbite:{t:"elec",kind:"env",pw:7,stun:.15,hidden:1},
  dragend:{t:"elec",kind:"strike",pw:12,rad:72,stun:.4,kb:260,heavy:9,breach:1,bridge:3,hidden:1},
  bubcatch:{t:"water",kind:"env",pw:4,hard:1.7,hidden:1},
  bubpop:{t:"water",kind:"env",pw:5,hidden:1},
  bubburst:{t:"wind",kind:"strike",pw:14,rad:60,kb:360,hidden:1},
  lavapool:{t:"fire",kind:"zone",pw:4,burn:2,rad:150,heavy:1,hidden:1},
  lavabomb:{t:"fire",kind:"strike",pw:8,rad:44,burn:2,kb:120,heavy:9,breach:1,crater:1,hidden:1},
  bfb1:{t:"fire",kind:"shot",pw:3,sp:500,r:9,life:.95,burn:1,heavy:1,hidden:1},
  bfb2:{t:"fire",kind:"shot",pw:3.5,sp:540,r:11,life:.95,burn:2,heavy:1,hidden:1},
  bfb3:{t:"fire",kind:"shot",pw:5,sp:580,r:14,life:1,burn:2,kb:120,heavy:9,hidden:1},
  spout:{t:"water",kind:"env",pw:4,hidden:1},
  spoutend:{t:"water",kind:"strike",pw:9,rad:62,kb:300,heavy:9,bridge:2,hidden:1},
  thorn:{t:"grass",kind:"strike",pw:7,rad:40,slow:1,hidden:1},
  boulder:{t:"earth",kind:"strike",pw:20,rad:94,stun:.6,kb:260,heavy:9,breach:2,crater:2,terrain:34,hidden:1},
  phclone:{t:"elec",kind:"env",pw:13,stun:.15,hidden:1},
  aurex_u1:{t:"light",kind:"slam",pw:9,rad:72,kb:220,heavy:1,crater:1,hidden:1},
  aurex_u2:{t:"metal",kind:"slam",pw:15,rad:126,kb:380,stun:.25,heavy:9,crater:1,hidden:1},
  aurex_u3:{t:"light",kind:"slam",pw:24,rad:190,kb:680,stun:.65,heavy:9,breach:3,bridge:9,crater:2,terrain:46,hidden:1},
  event_tick:{t:"shadow",kind:"zone",pw:4,rad:132,dur:2.4,pull:320,slow:1,hidden:1},
  event_end:{t:"shadow",kind:"slam",pw:28,rad:180,kb:760,stun:.75,heavy:9,breach:3,bridge:9,crater:2,terrain:54,hidden:1},
  rootburst:{t:"grass",kind:"slam",pw:9,rad:74,kb:180,stun:.25,heavy:1,hidden:1},
  treeburst:{t:"light",kind:"slam",pw:22,rad:170,kb:560,stun:.45,heavy:9,breach:2,bridge:5,crater:1,hidden:1}
};
/* thrown/kicked arena objects: an attack that touches a kickable prop launches it away from the attacker */
const KICK={barrel:{pw:10,r:11,sp:420,xpl:1},boulder:{pw:18,r:13,sp:380,stun:.4,kb:300,heavy:9},snowball:{pw:12,r:12,sp:440,slow:2},log:{pw:14,r:12,sp:400,kb:380,heavy:1},
  tumble:{pw:6,r:9,sp:520,bn:3},urn:{pw:10,r:9,sp:460},car:{pw:24,r:20,sp:360,kb:420,heavy:9},bin:{pw:8,r:9,sp:460},cone:{pw:5,r:6,sp:520,bn:2},cooler:{pw:8,r:8,sp:460}};
for(const k in KICK)MOVES["k_"+k]=Object.assign({t:"norm",kind:"shot",life:1.3,hidden:1},KICK[k]);
MOVES.pkick={t:"norm",kind:"pkick",hidden:1};
const KNIGHT=["k_wave","k_plunge","k_dashwall"];
const KIND={shot:"ยิง",dash:"พุ่งชน",slam:"รอบตัว",strike:"ลงพื้น",zone:"พื้นที่",dig:"มุดดิน",buff:"เสริม",leap:"กระโดด",ring:"วงแหวน",beam:"ชาร์จ",clone:"เรียกร่าง",melee:"ประชิด",breath:"พ่น",orbit:"โคจร",rain:"ถล่ม",trap:"กับดัก",blink:"วาร์ป",wall:"กำแพง"};
const COMMON=["tackle","leap","ring","beam","clone","guard","rest"];
const ENVMV={barrel:{t:"fire",pw:22,rad:74,kb:260,burn:2,kind:"slam"},burn:{t:"fire",pw:5,rad:36,kind:"zone"},zap:{t:"elec",pw:13,stun:.5,kind:"env"},lava:{t:"fire",pw:6,burn:2,kind:"env"},
  bog:{t:"grass",pw:4,slow:.8,kind:"env"},cactus:{t:"grass",pw:6,kb:160,kind:"env"}};
const MONS={
  pyros:{n:"ไพรอส",t:["fire","wind"],hp:130,atk:1.05,def:0.88,spd:165,basic:"b_pyros",ult:"u_bird",role:"สปีด",ds:"วิหคเพลิงหางมรกต เร็วและแรง แต่เปราะ"},
  crusta:{n:"ครัสต้า",t:["water","earth"],hp:245,atk:0.85,def:1.42,spd:92,basic:"b_crusta",ult:"u_shell",role:"แทงค์",ds:"ปูเสฉวนเปลือกหินผลึก ถึกที่สุด ตีระยะประชิด"},
  mekha:{n:"เมฆา",t:["elec","wind"],hp:150,atk:1.15,def:0.95,spd:128,basic:"b_mekha",ult:"u_cloud",role:"สมดุล · ยิงไกล",ds:"แกะขนเมฆฝน เขาสายฟ้า คุมระยะไกล"},
  prikky:{n:"พริกกี้",t:["grass","fire"],hp:180,atk:1.3,def:0.8,spd:116,basic:"b_prikky",ult:"u_chili",role:"ไฮบริด",ds:"กิ้งก่าพริกขี้หนู ยิงรัวและเผาทุกอย่าง"},
  sila:{n:"ศิลา",t:["earth","grass"],hp:240,atk:0.9,def:1.38,spd:94,basic:"b_sila",ult:"u_colossus",role:"แทงค์",ds:"โกเลมหินมีมอส ตาผลึก หมัดหนักและอึด"},
  eela:{n:"อีลล่า",t:["water","elec"],hp:160,atk:1.12,def:1.0,spd:125,basic:"b_eela",ult:"u_dragon",role:"สมดุล · คุมพื้นที่",ds:"ปลาไหลโคมไฟ ว่ายน้ำเร็ว ช็อตทั้งแม่น้ำ"},
  fuwa:{n:"ฟูวา",t:["wind","water"],hp:135,atk:1.0,def:0.9,spd:160,basic:"b_fuwa",ult:"u_bubble",role:"สปีด",ds:"แมงกะพรุนก้อนเมฆ ผลักและดูดคู่ต่อสู้"},
  blazar:{n:"เบลซาร์",t:["fire","metal"],hp:185,atk:1.28,def:0.85,spd:114,basic:"b_blazar",ult:"u_barrage",role:"ไฮบริด",ds:"มังกรจิ้งจกเกราะเหล็ก พ่นลูกไฟรัวเป็นชุด"},
  reya:{n:"เรย่า",t:["water","wind"],hp:128,atk:1.05,def:0.86,spd:168,basic:"b_reya",ult:"u_flood",role:"สปีด",ds:"กระเบนเมฆบิน สร้างพายุหมุนน้ำดูดคู่ต่อสู้"},
  terran:{n:"เทอร์รัน",t:["earth","grass"],hp:250,atk:0.86,def:1.45,spd:90,basic:"b_terran",ult:"u_cage",role:"แทงค์",ds:"ผู้พิทักษ์กระดองหิน ทุบพื้นเป็นแรงกระแทก"},
  nivara:{n:"นิวาร่า",t:["ice","light"],hp:175,atk:1.2,def:.95,spd:122,basic:"b_nivara",ult:"u_knight",role:"สมดุล · อัศวิน",ds:"นกฮูกหิมะมงกุฎผลึก ปล่อยคลื่นความเย็นแช่แข็งศัตรู แปลงร่างเป็นอัศวินแสงได้"},
  umbra:{n:"อัมบร้า",t:["elec","shadow"],hp:125,atk:1.08,def:0.85,spd:172,basic:"b_umbra",ult:"u_phantom",role:"สปีด",ds:"จิ้งจอกเงาสายฟ้า เร็วที่สุด ทิ้งภาพติดตาไว้ข้างหลัง"},
  lavarok:{n:"ลาวาร็อก",t:["fire","earth"],hp:190,atk:1.32,def:0.82,spd:110,basic:"b_lavarok",ult:"u_volcano",role:"ไฮบริด",ds:"ด้วงแรดหลังภูเขาไฟ เดินบนลาวาได้สบาย"},
  aurex:{n:"ออเร็กซ์",t:["metal","light"],hp:205,atk:1.18,def:1.08,spd:118,basic:"b_aurex",ult:"u_impact",sig:["aurex_rush","aurex_upper","aurex_wave"],role:"คอมโบ · คุมสนาม",ds:"แรดนักสู้เกราะสุริยะ ใช้หมัดพุ่ง หมัดเสย และคลื่นแสง ผลักศัตรูพร้อมกวาดวัตถุในสนาม"},
  chronox:{n:"โครน็อกซ์",t:["shadow","ice"],hp:158,atk:1.16,def:.94,spd:154,basic:"b_chronox",ult:"u_event",sig:["chrono_step","chrono_orb","chrono_well"],role:"ลอบโจมตี · ควบคุมเวลา",ds:"หมาในจักรกลผู้เฝ้านาฬิกาดารา หยุดทางหนีด้วยความเย็นและยุบสนามเป็นหลุมมิติ"},
  verdara:{n:"เวอร์ดารา",t:["grass","light"],hp:188,atk:1.08,def:1.12,spd:126,basic:"b_verdara",ult:"u_worldtree",sig:["verd_lance","verd_bloom","verd_wall"],role:"สนับสนุน · สร้างพื้นที่",ds:"กวางผลึกพฤกษา ปลูกสวนรักษา สร้างแนวปริซึม และระเบิดรากไม้เพื่อแบ่งสนาม"}
};
const OLD_KITS={
  pyros:["wheel","breath","frain"],crusta:["geyser","shield","mortar"],mekha:["fork","thunder","homing"],prikky:["leaf","trap","breath"],
  sila:["quake","wall","rock"],eela:["jet","thunder","bubble"],fuwa:["gust","vac","cyclone"],blazar:["ram","shrap","breath"],
  reya:["bounce","vac","jet"],terran:["quake","mortar","wall"],nivara:["icelance","frostwave","holyray"],umbra:["lunge","pit","wisp"],lavarok:["wheel","quake","mortar"]};
for(const k in OLD_KITS)MONS[k].kit=OLD_KITS[k];
const MONSTYLE={pyros:"wing",crusta:"tank",mekha:"caster",prikky:"wild",sila:"tank",eela:"serpent",fuwa:"float",blazar:"gunner",reya:"float",terran:"tank",nivara:"caster",umbra:"beast",lavarok:"beast",aurex:"fighter",chronox:"assassin",verdara:"caster"};
const typedMoves=t=>Object.keys(MOVES).filter(m=>{const v=MOVES[m];return!v.ult&&!v.hidden&&!v.basic&&v.t===t});
const poolOf=k=>[...(MONS[k].sig||[]),...typedMoves(MONS[k].t[0]),...typedMoves(MONS[k].t[1]),...COMMON];
const defMoves=k=>MONS[k].sig?[...MONS[k].sig]:MONS[k].kit?[...MONS[k].kit]:[typedMoves(MONS[k].t[0])[1],typedMoves(MONS[k].t[1])[2],"beam"];
const ARENAS=[
  {k:"stadium",n:"สนามประลอง",d:"ลังไม้พังได้ ถังระเบิดจะระเบิดเมื่อโดนโจมตี"},
  {k:"forest",n:"ป่าทึบ",d:"ซ่อนตัวในพุ่มไม้และใต้ต้นไม้ได้ ท่าไฟเผาให้ไหม้หายไป"},
  {k:"river",n:"แม่น้ำสายฟ้า",d:"ลงน้ำแล้วเดินช้า ท่าสายฟ้าที่โดนน้ำจะช็อตทั้งแม่น้ำ"},
  {k:"volcano",n:"ปากปล่องภูเขาไฟ",d:"บ่อลาวาเผาคนที่เหยียบ ท่าน้ำทำให้ลาวาแข็งชั่วคราว"},
  {k:"ice",n:"ทะเลสาบน้ำแข็ง",d:"พื้นน้ำแข็งลื่น หยุดไม่อยู่ ท่าไฟละลายน้ำแข็งเป็นแอ่งน้ำ"},
  {k:"desert",n:"ทะเลทรายเดือด",d:"หลุมทรายดูดทำให้ช้าและดูดเข้ากลาง กระบองเพชรตำคนที่ชน"},
  {k:"ruins",n:"ซากวิหาร",d:"กำแพงหินบังกระสุนและลำแสง มีแท่นวาร์ป 2 จุดเชื่อมถึงกัน"},
  {k:"swamp",n:"หนองพิษ",d:"บึงพิษกัดพลังและทำให้ช้า บ่อน้ำพุกลางสนามฟื้นพลังให้คนที่ยืน"},
  {k:"city",n:"มหานครยามค่ำ",d:"ถนน ตึก 2 ชั้นเข้าไปหลบได้ บันไดขึ้นลง สะพานกระจกเชื่อมตึก รถและของบนถนนเตะกระเด็นได้",big:1},
  {k:"moba",n:"สมรภูมิสามเลน",d:"แผนที่ใหญ่ที่สุด 3 เลน ป้อม ครีป ครีปป่าให้บัฟ บอสป่า ชนะด้วยการทำลายออร์บฐานศัตรู",big:1},
  {k:"skyforge",n:"โรงหลอมเวหจักร",d:"ต่อสู้สองระดับชั้น ใช้ลิฟต์ขึ้นแท่นลอยและสะพานที่เคลื่อนตลอดเวลา มีแกนแรงโน้มถ่วงเฉพาะด่าน",big:1},
  {k:"titanback",n:"หลังไททันเดินสมุทร",d:"สนามบนหลังอสูรยักษ์ที่เอียงและสั่น แผ่นเกราะเคลื่อน พื้นน้ำซัด และมีสว่านมิติเฉพาะด่าน",big:1}
];
/* ================= collectible items =================
   now: applied the moment you walk over it. use: goes into the item slot (key G / item button), hold to aim, release to use.
   w = drop weight (higher = more common). */
const ITEMS={
  potS:{n:"ยาฮีลเล็ก",d:"ฟื้นพลัง 30",kind:"now",w:10},
  potL:{n:"ยาฮีลใหญ่",d:"ฟื้นพลัง 60",kind:"now",w:4},
  fruit:{n:"ผลไม้ไม้ตาย",d:"เกจท่าไม้ตาย +40",kind:"now",w:5},
  bubble:{n:"เกราะฟอง",d:"โล่กันความเสียหาย 40 นาน 6 วินาที",kind:"now",w:5},
  boots:{n:"รองเท้าสายฟ้า",d:"เดินเร็วขึ้น 50% นาน 8 วินาที",kind:"now",w:6},
  rage:{n:"ยาเดือดพล่าน",d:"โจมตีแรงขึ้น 30% นาน 10 วินาที",kind:"now",w:5},
  helmet:{n:"หมวกเหล็ก",d:"ลดความเสียหาย 60% นาน 5 วินาที",kind:"now",w:4},
  ghost:{n:"ยาล่องหน",d:"หายตัว 6 วินาที",kind:"now",w:3},
  hourglass:{n:"นาฬิกาทราย",d:"รีเซ็ตคูลดาวน์สกิลทั้งหมดทันที",kind:"now",w:4},
  heart:{n:"หัวใจทองคำ",d:"ฟื้นพลังต่อเนื่อง 60 ใน 10 วินาที",kind:"now",w:4},
  energy:{n:"เครื่องดื่มเร่งพลัง",d:"คูลดาวน์ลดเร็วขึ้น 2 เท่า นาน 8 วินาที",kind:"now",w:4},
  mystery:{n:"กล่องสุ่ม",d:"สุ่มได้ไอเทมใดก็ได้",kind:"now",w:5},
  pistol:{n:"ปืนพก",d:"ยิงกระสุนเร็ว 10 นัด",kind:"use",uses:10,mv:"it_pistol",w:6},
  shotgun:{n:"ลูกซอง",d:"ยิงกระจาย 6 ลูก 4 ครั้ง",kind:"use",uses:4,mv:"it_shotgun",w:4},
  bazooka:{n:"บาซูก้า",d:"จรวดระเบิดวงกว้าง 2 ลูก",kind:"use",uses:2,mv:"it_bazooka",w:2},
  staffE:{n:"คทาสายฟ้า",d:"เรียกฟ้าผ่าที่จุดเล็ง ทำให้มึน 3 ครั้ง",kind:"use",uses:3,mv:"it_staffE",w:3},
  staffI:{n:"คทาน้ำแข็ง",d:"ยิงลูกน้ำแข็งแช่แข็งคู่ต่อสู้ 3 ครั้ง",kind:"use",uses:3,mv:"it_staffI",w:3},
  staffF:{n:"คทาเพลิง",d:"ลูกไฟยักษ์ทะลุสิ่งกีดขวาง 3 ครั้ง",kind:"use",uses:3,mv:"it_staffF",w:3},
  wings:{n:"ปีกเทวดา",d:"บินข้ามทุกอย่างทั่วแมพ 9 วินาที",kind:"use",uses:1,mv:"it_wings",w:2},
  car:{n:"รถซิ่ง",d:"ขับรถเร็วจัด 8 วินาที ชนคู่ต่อสู้กระเด็น",kind:"use",uses:1,mv:"it_car",w:2},
  capsule:{n:"แคปซูลอัญเชิญ",d:"ปาแล้วสุ่มเรียกบอทผู้ช่วย 1 ใน 4 ตัวออกมาสู้ 14 วินาที",kind:"use",uses:1,mv:"it_capsule",w:2},
  grenade:{n:"ระเบิดมือ",d:"โยนระเบิดข้ามสิ่งกีดขวาง 3 ลูก",kind:"use",uses:3,mv:"it_grenade",w:4},
  mine:{n:"กับระเบิด",d:"วางกับระเบิด 3 อัน",kind:"use",uses:3,mv:"it_mine",w:3},
  boomer:{n:"บูมเมอแรง",d:"ขว้างแล้ววกกลับ 5 ครั้ง",kind:"use",uses:5,mv:"it_boomer",w:3},
  totem:{n:"แท่นฮีล",d:"วางแท่นฟื้นพลังรอบตัว 8 วินาที",kind:"use",uses:1,mv:"it_totem",w:3},
  turret:{n:"ป้อมปืนพกพา",d:"วางป้อมปืนยิงคู่ต่อสู้อัตโนมัติ 14 วินาที",kind:"use",uses:1,mv:"it_turret",w:2},
  smoke:{n:"ระเบิดควัน",d:"ม่านควันซ่อนตัว 7 วินาที 2 ลูก",kind:"use",uses:2,mv:"it_smoke",w:3},
  hook:{n:"ตะขอเกี่ยว",d:"ยิงตะขอดึงคู่ต่อสู้เข้ามา 3 ครั้ง",kind:"use",uses:3,mv:"it_hook",w:3},
  meteor:{n:"ลูกไฟจากฟ้า",d:"เรียกอุกกาบาตยักษ์ลงจุดเล็ง",kind:"use",uses:1,mv:"it_meteor",w:1},
  frost:{n:"ระเบิดเยือกแข็ง",d:"ระเบิดความเย็นทำให้ช้า 3 วินาที 2 ลูก",kind:"use",uses:2,mv:"it_frost",w:3},
  gravityCore:{n:"แกนแรงโน้มถ่วง",d:"ปล่อยวงแรงโน้มถ่วงผลักทุกอย่างอย่างรุนแรง ใช้ได้ 2 ครั้ง",kind:"use",uses:2,mv:"it_gravity",w:0},
  phaseDrill:{n:"สว่านมิติ",d:"เจาะพื้นเป็นหลุมอันตรายและเปิดช่องกำแพง ใช้ได้ครั้งเดียว",kind:"use",uses:1,mv:"it_phaseDrill",w:0}};
Object.assign(MOVES,{
  it_pistol:{n:"ปืนพก",t:"norm",kind:"shot",aim:"line",pw:6,sp:720,r:4,cnt:1,life:.8,hidden:1,gun:1},
  it_shotgun:{n:"ลูกซอง",t:"norm",kind:"shot",aim:"cone",pw:4,sp:560,r:4,cnt:6,fan:.6,life:.5,kb:120,hidden:1,gun:1},
  it_bazooka:{n:"บาซูก้า",t:"fire",kind:"shot",aim:"line",pw:10,sp:420,r:9,cnt:1,life:1.4,hidden:1,rocket:1},
  it_rocketboom:{t:"fire",kind:"strike",pw:20,rad:64,kb:300,heavy:9,crater:1,hidden:1},
  it_staffE:{n:"คทาสายฟ้า",t:"elec",kind:"strike",aim:"point",pw:16,rad:44,delay:.35,stun:.5,rng:260,hidden:1},
  it_staffI:{n:"คทาน้ำแข็ง",t:"water",kind:"shot",aim:"line",pw:8,sp:420,r:8,cnt:1,stun:1,life:1.2,hidden:1},
  it_staffF:{n:"คทาเพลิง",t:"fire",kind:"shot",aim:"line",pw:14,sp:300,r:13,cnt:1,pierce:1,burn:3,life:1.8,hidden:1},
  it_wings:{n:"ปีกเทวดา",t:"wind",kind:"fly",aim:"self",hidden:1},
  it_car:{n:"รถซิ่ง",t:"metal",kind:"drive",aim:"self",hidden:1},
  it_carhit:{t:"metal",kind:"env",pw:20,kb:420,stun:.3,heavy:9,hidden:1},
  it_capsule:{n:"แคปซูลอัญเชิญ",t:"norm",kind:"capsule",aim:"point",rng:180,rad:30,hidden:1},
  it_grenade:{n:"ระเบิดมือ",t:"fire",kind:"strike",aim:"point",pw:18,rad:54,delay:.7,lob:1,crater:1,kb:220,heavy:1,rng:240,hidden:1,lobk:"i_grenade"},
  it_mine:{n:"กับระเบิด",t:"fire",kind:"trap",aim:"point",pw:0,rng:90,rad:44,hidden:1,mine:1},
  it_minego:{t:"fire",kind:"env",pw:16,stun:.6,kb:260,hidden:1},
  it_boomer:{n:"บูมเมอแรง",t:"norm",kind:"shot",aim:"line",pw:9,sp:520,r:9,cnt:1,boom:1,pierce:1,life:2,hidden:1},
  it_totem:{n:"แท่นฮีล",t:"grass",kind:"zone",aim:"self",pw:0,heal:4,rad:70,delay:.1,dur:8,hidden:1,totem:1},
  it_turret:{n:"ป้อมปืน",t:"metal",kind:"turret",aim:"point",rng:90,hidden:1},
  it_smoke:{n:"ระเบิดควัน",t:"norm",kind:"zone",aim:"point",pw:0,rad:90,delay:.3,dur:7,rng:200,hidden:1,smoke:1},
  it_hook:{n:"ตะขอเกี่ยว",t:"grass",kind:"shot",aim:"line",pw:6,sp:620,r:7,cnt:1,hook:1,life:.6,hidden:1},
  it_meteor:{n:"ลูกไฟจากฟ้า",t:"fire",kind:"strike",aim:"point",pw:30,rad:92,delay:1.1,burn:3,kb:300,heavy:9,crater:2,rng:300,hidden:1,fall:1},
  it_frost:{n:"ระเบิดเยือกแข็ง",t:"water",kind:"strike",aim:"point",pw:8,rad:70,delay:.6,lob:1,slow:3,rng:230,hidden:1,lobk:"i_frost"},
  it_gravity:{n:"แกนแรงโน้มถ่วง",t:"wind",kind:"ring",aim:"self",pw:12,max:190,kb:620,stun:.35,heavy:9,hidden:1},
  it_phaseDrill:{n:"สว่านมิติ",t:"shadow",kind:"strike",aim:"point",pw:24,rad:82,delay:.8,rng:250,kb:460,stun:.5,heavy:9,breach:4,bridge:12,crater:2,terrain:48,fall:1,hidden:1},
  /* helper-bot attacks (fired from the bot's position) */
  bt_spark:{t:"fire",kind:"shot",pw:5,sp:420,r:6,cnt:3,fan:.35,life:1,hidden:1},
  bt_dash:{t:"elec",kind:"env",pw:9,stun:.15,hidden:1},
  bt_laser:{t:"elec",kind:"beam",pw:14,heavy:1,hidden:1},
  bt_slam:{t:"grass",kind:"slam",pw:10,rad:70,delay:.25,kb:260,hidden:1},
  bt_gun:{t:"metal",kind:"shot",pw:4,sp:560,r:4,cnt:1,life:.9,hidden:1}});
/* helper bots summoned from the capsule: original robot designs */
const BUDDY={2:{n:"ไบต์บอท",d:"ยิงประกายไฟ 3 ทาง",hp:70},3:{n:"โวลต์บอท",d:"พุ่งสายฟ้าชนซ้ำ",hp:60},4:{n:"ไซเฟอร์",d:"ยิงเลเซอร์ทะลุสนาม",hp:60},5:{n:"เมก้าบล็อก",d:"คุ้มกันเจ้าของ ฟื้นพลัง กระแทกพื้น",hp:110},6:{n:"ป้อมปืน",d:"",hp:60}};
const ITEM_KEYS=Object.keys(ITEMS),ITEM_W=ITEM_KEYS.reduce((a,k)=>a+ITEMS[k].w,0);
const pickItem=r=>{let x=r*ITEM_W;for(const k of ITEM_KEYS){x-=ITEMS[k].w;if(x<=0)return k}return"potS"};
/* ================= pixel art ================= */
const OUT="#191322";
function pix(w,h,draw,arg){
  const px=new Array(w*h).fill(null);
  const P=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&x<w&&y>=0&&y<h)px[y*w+x]=c};
  const g={P,
    R(x,y,rw,rh,c){for(let j=0;j<rh;j++)for(let i=0;i<rw;i++)P(x+i,y+j,c)},
    M(x,y,rw,rh,c){for(let j=0;j<rh;j++)for(let i=0;i<rw;i++){const X=x+i,Y=y+j;if(X>=0&&X<w&&Y>=0&&Y<h&&px[Y*w+X])px[Y*w+X]=c}},
    E(cx,cy,rx,ry,c){for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){const a=(x-cx)/(rx+.5),b=(y-cy)/(ry+.5);if(a*a+b*b<=1)P(x,y,c)}},
    L(x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)P(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c)}};
  draw(g,arg);
  const src=px.slice();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(src[y*w+x])continue;const n=(X,Y)=>X>=0&&X<w&&Y>=0&&Y<h&&src[Y*w+X];
    if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1))px[y*w+x]=OUT}
  const c=document.createElement("canvas");c.width=w;c.height=h;const cx=c.getContext("2d");
  const wc=document.createElement("canvas");wc.width=w;wc.height=h;const wx=wc.getContext("2d");
  for(let i=0;i<px.length;i++)if(px[i]){cx.fillStyle=px[i];cx.fillRect(i%w,(i/w)|0,1,1);wx.fillStyle="#fff";wx.fillRect(i%w,(i/w)|0,1,1)}
  return{c,w:wc};
}
const SS=32;
const DRAW={
  pyros(g,b){const R="#e2412e",O="#ff8a2a",Y="#ffd23e",T="#2fd0b5";
    g.L(13,25,9,30,T);g.L(16,25,16,31,T);g.L(19,25,23,30,T);g.L(14,25,11,29,"#1fa38e");g.L(18,25,21,29,"#1fa38e");g.P(9,31,Y);g.P(16,31,Y);g.P(23,31,Y);
    g.E(6,15+b*2,5,3,O);g.E(26,15+b*2,5,3,O);g.E(3,12+b*2,2,3,Y);g.E(29,12+b*2,2,3,Y);g.L(2,17+b*2,9,18+b*2,R);g.L(30,17+b*2,23,18+b*2,R);
    g.E(16,18+b,6,7,R);g.E(16,20+b,4,4,"#ffb347");g.L(14,19+b,18,19+b,O);g.L(14,22+b,18,22+b,O);
    g.E(16,9+b,5,4,R);
    g.L(14,5+b,11,1+b,Y);g.L(16,5+b,16,0+b,O);g.L(18,5+b,21,1+b,Y);g.L(15,5+b,13,2+b,O);g.L(17,5+b,19,2+b,O);
    g.R(12,8+b,3,3,"#fff");g.R(18,8+b,3,3,"#fff");g.R(13,9+b,2,2,OUT);g.R(18,9+b,2,2,OUT);g.L(11,7+b,14,7+b,"#8e1f18");g.L(18,7+b,21,7+b,"#8e1f18");
    g.R(15,11+b,3,2,Y);g.P(16,13+b,O);
    g.R(13,26,2,2,Y);g.R(18,26,2,2,Y);},
  crusta(g,b){const S="#8b8f9c",D="#5f6370",C="#59c7ff",T="#2f9fb0",TD="#1f7484";
    g.R(8,27,2,3,TD);g.R(12,28,2,3,TD);g.R(19,28,2,3,TD);g.R(23,27,2,3,TD);
    g.E(17,12+b,10,9,S);g.M(8,8+b,20,1,D);g.M(7,13+b,22,1,D);g.M(9,17+b,18,1,D);g.L(17,3+b,17,8+b,D);g.E(17,11+b,3,3,D);g.E(17,11+b,1,1,S);
    g.L(22,4+b,25,0+b,C);g.L(23,4+b,26,1+b,C);g.R(24,2+b,2,3,"#bfeaff");g.L(11,4+b,9,1+b,C);g.R(9,2+b,2,3,"#bfeaff");g.P(27,8+b,C);g.P(28,7+b,C);
    g.E(15,23+b,8,4,T);g.E(15,24+b,5,2,"#7fd3df");
    g.R(11,16+b,2,5,T);g.R(18,16+b,2,5,T);g.E(11,15+b,2,2,"#fff");g.E(19,15+b,2,2,"#fff");g.R(11,15+b,1,2,OUT);g.R(19,15+b,1,2,OUT);
    g.E(4,21+b,4,4,T);g.E(4,20+b,2,1,"#7fd3df");g.L(1,22+b,5,22+b,OUT);g.P(0,23+b,T);
    g.E(27,24+b,3,3,T);g.L(26,25+b,29,25+b,OUT);
    g.L(13,25+b,17,25+b,TD);},
  mekha(g,b){const C="#5a5f7a",L="#7d83a3",F="#2a2440",Y="#ffe04a";
    g.R(10,25,3,5,F);g.R(19,25,3,5,F);g.R(10,30,3,1,Y);g.R(19,30,3,1,Y);
    g.L(26,16+b,29,14+b,Y);g.L(29,14+b,27,12+b,Y);g.L(27,12+b,30,9+b,Y);g.P(30,8+b,"#fff");
    g.E(16,15+b,10,7,C);g.E(8,11+b,4,4,C);g.E(16,8+b,5,4,C);g.E(24,11+b,4,4,C);g.E(11,7+b,3,3,C);g.E(21,7+b,3,3,C);
    g.E(9,9+b,2,1,L);g.E(16,6+b,3,1,L);g.E(23,9+b,2,1,L);g.M(6,19+b,21,1,"#444a63");
    g.E(6,18+b,4,4,Y);g.E(6,18+b,2,2,"#c99a1a");g.E(6,18+b,0,0,Y);g.E(26,18+b,4,4,Y);g.E(26,18+b,2,2,"#c99a1a");g.P(26,18+b,Y);
    g.E(16,19+b,5,5,F);g.R(12,18+b,3,2,Y);g.R(18,18+b,3,2,Y);g.P(13,18+b,"#fff");g.P(19,18+b,"#fff");g.R(15,22+b,3,1,"#4a4268");
    g.P(13,24+b,Y);g.P(12,25+b,Y);g.P(20,24+b,Y);},
  prikky(g,b){const R="#d92b2b",H="#ff6a4a",G="#3fa34d",D="#2b7a3a";
    g.L(21,24,25,27,R);g.L(22,24,26,27,R);g.L(26,27,28,25,R);g.E(29,23,2,2,"#ffb020");g.P(29,20,"#ffd84a");g.P(29,22,"#ffd84a");g.P(30,21,"#ff7a3d");
    g.R(11,27,4,3,G);g.R(18,27,4,3,G);
    g.R(6,17+b,4,2,G);g.R(23,17+b,4,2,G);g.P(5,16+b,D);g.P(27,16+b,D);g.P(5,19+b,D);g.P(27,19+b,D);
    g.E(16,18+b,7,9,R);g.E(16,12+b,8,5,R);g.L(11,10+b,11,20+b,H);g.P(12,9+b,H);g.P(12,22+b,H);
    g.E(16,7+b,7,2,G);g.L(9,8+b,11,11+b,G);g.L(23,8+b,21,11+b,G);g.L(16,8+b,16,10+b,G);g.L(13,8+b,13,10+b,D);g.L(19,8+b,19,10+b,D);
    g.L(16,6+b,17,2+b,D);g.L(17,2+b,20,1+b,D);g.R(16,3+b,2,3,D);
    g.E(12,14+b,2,2,"#fff");g.E(20,14+b,2,2,"#fff");g.R(12,14+b,2,2,OUT);g.R(19,14+b,2,2,OUT);g.L(10,11+b,14,12+b,"#7a1010");g.L(22,11+b,18,12+b,"#7a1010");
    g.L(12,19+b,20,19+b,"#7a1010");g.P(13,20+b,"#fff");g.P(19,20+b,"#fff");g.L(13,20+b,19,20+b,"#7a1010");g.P(13,20+b,"#fff");g.P(16,20+b,"#fff");g.P(19,20+b,"#fff");},
  sila(g,b){const S="#8a7a66",L="#a8987f",D="#5f5244",M="#4cae52",C="#5ff0e0";
    g.R(9,26,6,5,D);g.R(17,26,6,5,D);g.R(9,30,6,1,"#4a3f34");g.R(17,30,6,1,"#4a3f34");
    g.E(4,20+b,3,6,S);g.E(28,20+b,3,6,S);g.E(4,25+b,3,2,D);g.E(28,25+b,3,2,D);
    g.E(16,19+b,10,8,S);g.M(7,14+b,6,1,L);g.M(8,15+b,4,1,L);g.L(12,17+b,14,21+b,D);g.L(14,21+b,12,24+b,D);g.L(21,16+b,19,19+b,D);g.L(22,22+b,20,25+b,D);
    g.E(7,13+b,4,2,M);g.E(25,13+b,4,2,M);g.P(5,15+b,M);g.P(27,15+b,M);g.P(9,15+b,"#3a8a40");
    g.R(15,20+b,3,3,C);g.P(16,21+b,"#fff");g.P(16,19+b,C);g.P(16,23+b,C);
    g.R(10,5+b,13,9,L);g.R(11,4+b,11,1,L);g.M(10,13+b,13,1,S);g.L(10,5+b,10,13+b,S);g.L(22,5+b,22,13+b,D);
    g.R(10,3+b,13,2,M);g.P(11,5+b,M);g.P(14,5+b,M);g.P(20,5+b,M);g.P(22,6+b,M);
    g.E(16,9+b,3,2,OUT);g.E(16,9+b,2,1,C);g.P(16,9+b,"#fff");
    g.L(16,3+b,16,0+b,"#2b7a3a");g.E(14,0+b,1,0,"#6fd06a");g.E(18,1+b,1,0,"#6fd06a");},
  eela(g,b){const B="#2a4fa8",L="#4a78d8",Y="#ffe04a",F="#59c7ff";
    g.E(5,27,2,3,F);g.L(3,24,3,30,"#bfeaff");
    g.E(10,26,5,3,B);g.E(16,24,5,3,B);g.E(22,21+b,5,4,B);g.E(23,15+b,4,5,B);
    g.E(10,27,3,1,"#f2f0c8");g.E(16,25,3,1,"#f2f0c8");g.E(22,23+b,3,1,"#f2f0c8");
    g.P(8,24,Y);g.P(13,23,Y);g.P(18,22,Y);g.P(22,19+b,Y);g.P(25,17+b,Y);g.P(24,13+b,Y);
    g.E(18,10+b,7,5,B);g.E(17,8+b,4,2,L);
    g.L(14,5+b,10,3+b,F);g.L(16,5+b,13,2+b,F);g.L(18,5+b,17,2+b,F);g.L(11,4+b,17,4+b,F);
    g.E(14,10+b,2,2,Y);g.R(14,10+b,1,2,OUT);g.L(12,7+b,16,8+b,"#17306e");
    g.L(11,13+b,19,13+b,OUT);g.P(12,14+b,"#fff");g.P(14,14+b,"#fff");g.P(16,14+b,"#fff");g.P(18,14+b,"#fff");
    g.L(22,6+b,26,3+b,B);g.L(26,3+b,28,4+b,B);g.E(29,6+b,2,2,"#fff37a");g.P(29,6+b,"#fff");g.P(29,3+b,Y);g.P(31,8+b,Y);},
  fuwa(g,b){const W="#eaf4ff",S="#a8d8ff",T="#59c7ff",M="#8fe3d0",w=b?1:-1;
    for(const[x,c]of[[8,T],[12,M],[16,T],[20,M],[24,T]]){g.L(x,17+b,x+w,21+b,c);g.L(x+w,21+b,x-w,25+b,c);g.L(x-w,25+b,x,29+b,c)}
    g.E(16,12+b,11,7,W);g.E(7,9+b,4,4,W);g.E(16,6+b,5,4,W);g.E(25,9+b,4,4,W);g.E(11,6+b,3,3,W);g.E(21,6+b,3,3,W);
    g.M(5,17+b,23,2,S);g.M(4,15+b,2,2,S);g.M(26,15+b,2,2,S);
    g.E(9,7+b,2,1,"#fff");g.E(16,4+b,2,1,"#fff");
    g.R(11,11+b,2,4,OUT);g.R(19,11+b,2,4,OUT);g.P(11,11+b,"#fff");g.P(19,11+b,"#fff");
    g.P(9,15+b,"#ff9ab0");g.P(8,15+b,"#ff9ab0");g.P(22,15+b,"#ff9ab0");g.P(23,15+b,"#ff9ab0");
    g.L(14,15+b,15,16+b,OUT);g.L(15,16+b,17,16+b,OUT);g.P(18,15+b,OUT);
    g.L(15,8+b,17,8+b,M);g.P(17,9+b,M);g.L(15,10+b,17,10+b,M);g.P(14,9+b,M);},
  lavarok(g,b){const K="#4a3a3a",D="#32262a",L="#6a5454",O="#ff7a3d",Y="#ffd84a";
    g.R(6,26,5,5,D);g.R(21,26,5,5,D);g.R(6,30,5,1,O);g.R(21,30,5,1,O);
    g.E(16,20+b,11,7,K);
    g.R(13,9+b,6,2,L);g.R(12,11+b,8,2,L);g.R(10,13+b,12,2,L);g.R(9,15+b,14,2,K);
    g.R(14,8+b,4,1,Y);g.P(15,9+b,O);g.P(16,10+b,O);g.P(16,11+b,Y);g.P(15,12+b,O);g.P(17,13+b,O);g.P(14,14+b,O);
    g.P(14,6+b,O);g.P(17,5+b,Y);g.P(16,3+b-b*2,O);g.P(13,3+b,"#8a7a7a");g.P(19,2+b,"#8a7a7a");g.P(18,6+b,O);
    g.L(6,19+b,9,21+b,O);g.L(9,21+b,7,24+b,O);g.L(26,18+b,23,21+b,O);g.L(23,21+b,25,24+b,O);g.P(8,20+b,Y);g.P(24,20+b,Y);
    g.E(16,23+b,6,4,L);g.R(15,15+b,3,7,O);g.R(16,13+b,1,3,Y);g.P(15,15+b,Y);g.L(15,22+b,17,22+b,"#c2501a");
    g.R(11,22+b,3,2,Y);g.R(19,22+b,3,2,Y);g.P(12,22+b,OUT);g.P(20,22+b,OUT);g.L(10,20+b,14,21+b,D);g.L(22,20+b,18,21+b,D);
    g.R(14,25+b,5,1,D);}
};
/* four more monsters */
const mirG=g=>({P:(x,y,c)=>g.P(31-x,y,c),R:(x,y,w,h,c)=>g.R(32-x-w,y,w,h,c),M:(x,y,w,h,c)=>g.M(32-x-w,y,w,h,c),E:(x,y,rx,ry,c)=>g.E(31-x,y,rx,ry,c),L:(a,b,c,d,e)=>g.L(31-a,b,31-c,d,e)});
Object.assign(DRAW,{
  blazar(g,b){const R="#e2542a",O="#ff8a3a",C="#ffd9a0",S="#9aa4ae",SL="#d0d8e0",SD="#5f6872",Y="#ffd23e";
    g.L(20,24,27,26,R);g.L(20,25,27,27,R);g.L(27,26,29,22,R);g.L(28,26,30,22,O);g.E(29,19,2,3,"#ff8a2a");g.P(29,15,Y);g.P(29,19,Y);g.P(29,18,Y);g.P(30,17,"#fff3a0");
    g.R(10,26,5,4,R);g.R(18,26,5,4,R);g.R(10,29,5,1,SD);g.R(18,29,5,1,SD);g.P(10,30,"#fff");g.P(12,30,"#fff");g.P(14,30,"#fff");g.P(18,30,"#fff");g.P(20,30,"#fff");g.P(22,30,"#fff");
    g.R(6,18+b,3,5,R);g.R(23,18+b,3,5,R);g.R(5,22+b,4,2,S);g.R(23,22+b,4,2,S);g.P(5,22+b,SL);g.P(23,22+b,SL);
    g.E(16,19+b,6,7,R);g.E(16,21+b,4,4,C);g.L(14,20+b,18,20+b,"#f0b878");g.L(14,23+b,18,23+b,"#f0b878");g.P(16,18+b,Y);g.P(15,19+b,Y);g.P(17,19+b,Y);g.P(16,19+b,"#fff3a0");
    g.E(8,16+b,3,3,S);g.E(24,16+b,3,3,S);g.E(8,15+b,2,1,SL);g.E(24,15+b,2,1,SL);g.P(8,18+b,SD);g.P(24,18+b,SD);
    g.E(16,10+b,6,5,R);g.E(16,13+b,4,2,O);
    g.R(10,5+b,13,3,S);g.R(11,4+b,11,1,SL);g.R(10,7+b,13,1,SD);g.L(10,5+b,7,1+b,S);g.L(11,5+b,8,1+b,SL);g.L(22,5+b,25,1+b,S);g.L(21,5+b,24,1+b,SL);g.P(7,0+b,SD);g.P(25,0+b,SD);
    g.R(12,9+b,2,2,Y);g.R(18,9+b,2,2,Y);g.P(13,10+b,OUT);g.P(18,10+b,OUT);g.L(11,8+b,14,8+b,"#8e2a18");g.L(18,8+b,21,8+b,"#8e2a18");
    g.L(13,14+b,19,14+b,"#7a1f18");g.P(14,14+b,"#fff");g.P(18,14+b,"#fff");g.P(15,12+b,"#7a1f18");g.P(17,12+b,"#7a1f18");},
  reya(g,b){const W="#eef6ff",B="#5aa8f0",D="#2a5fc0",T="#3fd0c8",w=b?1:-1;
    g.L(14,19+b,11,25,T);g.L(11,25,12+w,31,T);g.L(18,19+b,21,25,T);g.L(21,25,20-w,31,T);g.L(16,20+b,16+w,26,D);g.L(16+w,26,16-w,30,D);g.P(12+w,31,"#bff4ff");g.P(20-w,31,"#bff4ff");
    g.E(16,13+b,14,5,B);g.E(2,11+b+b,2,3,D);g.E(29,11+b+b,2,3,D);g.E(16,14+b,12,3,"#7fc0f8");g.M(3,16+b,26,1,"#9ad4ff");g.M(6,17+b,20,1,D);
    g.E(7,20+b,3,2,"#fff");g.E(25,20+b,3,2,"#fff");g.E(11,21+b,2,1,"#fff");g.E(21,21+b,2,1,"#fff");g.P(5,22+b,"#d8f2ff");g.P(27,22+b,"#d8f2ff");
    g.E(16,13+b,6,7,W);g.E(16,8+b,4,3,W);g.L(12,7+b,9,2+b,B);g.L(13,7+b,10,2+b,W);g.L(20,7+b,23,2+b,B);g.L(19,7+b,22,2+b,W);
    g.L(16,5+b,16,9+b,B);g.P(15,10+b,B);g.P(17,10+b,B);g.L(16,11+b,16,13+b,B);
    g.R(12,12+b,2,3,OUT);g.R(19,12+b,2,3,OUT);g.P(12,12+b,"#fff");g.P(19,12+b,"#fff");g.P(10,15+b,"#ff9ab0");g.P(22,15+b,"#ff9ab0");
    g.L(14,16+b,15,17+b,D);g.L(15,17+b,17,17+b,D);g.P(18,16+b,D);g.E(16,19+b,3,1,"#d8f2ff");},
  terran(g,b){const K="#8a7458",L="#b09a78",D="#5f4e3a",M="#4cae52",MD="#2f8a3c",S="#9aa0a8",SL="#d0d6dc";
    g.R(5,25,6,5,D);g.R(21,25,6,5,D);g.R(5,29,6,1,"#3e3226");g.R(21,29,6,1,"#3e3226");g.P(5,30,SL);g.P(7,30,SL);g.P(10,30,SL);g.P(21,30,SL);g.P(24,30,SL);g.P(26,30,SL);
    g.E(16,15+b,13,9,K);g.E(9,12+b,4,3,L);g.E(22,11+b,4,3,L);g.E(16,16+b,5,3,L);g.E(6,18+b,3,2,L);g.E(26,18+b,3,2,L);
    g.L(13,9+b,12,14+b,D);g.L(19,8+b,20,13+b,D);g.L(11,17+b,8,20+b,D);g.L(21,17+b,24,20+b,D);g.L(13,19+b,19,19+b,D);
    g.E(16,7+b,7,2,M);g.E(6,13+b,3,2,M);g.E(26,14+b,3,2,M);g.P(4,15+b,MD);g.P(28,16+b,MD);g.P(12,9+b,MD);g.P(20,9+b,MD);g.P(16,9+b,M);g.P(9,7+b,M);g.P(23,7+b,M);
    g.R(15,3+b,3,5,S);g.R(16,2+b,1,2,SL);g.R(15,3+b,1,4,SL);g.R(8,7+b,2,4,S);g.P(8,6+b,SL);g.R(22,7+b,2,4,S);g.P(22,6+b,SL);
    g.L(12,6+b,11,2+b,"#2b7a3a");g.E(10,1+b,1,0,"#6fd06a");g.P(12,1+b,"#6fd06a");g.L(20,6+b,21,2+b,"#2b7a3a");g.E(22,1+b,1,0,"#6fd06a");g.P(20,1+b,"#6fd06a");
    g.E(16,24+b,7,4,L);g.R(10,20+b,5,2,S);g.R(17,20+b,5,2,S);g.P(10,20+b,SL);g.P(17,20+b,SL);g.L(9,22+b,7,20+b,S);g.L(22,22+b,24,20+b,S);
    g.R(12,22+b,3,2,"#fff");g.R(17,22+b,3,2,"#fff");g.P(13,23+b,OUT);g.P(14,23+b,OUT);g.P(17,23+b,OUT);g.P(18,23+b,OUT);g.L(11,21+b,15,22+b,D);g.L(21,21+b,17,22+b,D);
    g.P(15,25+b,D);g.P(17,25+b,D);g.L(12,27+b,20,27+b,D);g.E(10,24+b,1,1,M);},
  nivara(g,b){const W="#f4f8ff",WS="#cfdcef",B="#7fd0ff",BD="#3a8ad0",C="#e2f8ff",Y="#ffd84a",GY="#8a94a8",w=b?-1:1;
    g.L(13,28,12,31,BD);g.L(19,28,20,31,BD);g.P(11,31,C);g.P(13,31,C);g.P(19,31,C);g.P(21,31,C);
    g.L(16,26,13,30,B);g.L(16,26,19,30,B);g.P(16,29,C);
    g.E(16,19+b,8,8,W);g.E(17,21+b,5,5,C);for(let y=17;y<26;y+=3){g.P(15,y+b,B);g.P(17,y+1+b,B);g.P(19,y+b,B)}
    g.E(6,17+b+w,4,6,B);g.E(5,17+b+w,2,4,C);g.L(3,20+b+w,1,25+b,BD);g.L(5,22+b+w,4,27+b,BD);g.L(7,22+b+w,7,26+b,B);
    g.E(26,17+b+w,4,6,B);g.E(27,17+b+w,2,4,C);g.L(29,20+b+w,31,25+b,BD);g.L(27,22+b+w,28,27+b,BD);g.L(25,22+b+w,25,26+b,B);
    g.E(16,10+b,8,7,W);g.E(16,11+b,6,5,WS);g.E(12,10+b,3,3,"#ffffff");g.E(20,10+b,3,3,"#ffffff");g.E(12,10+b,2,2,Y);g.E(20,10+b,2,2,Y);g.P(12,10+b,OUT);g.P(20,10+b,OUT);g.P(11,9+b,"#ffffff");g.P(19,9+b,"#ffffff");
    g.P(16,13+b,GY);g.P(15,12+b,GY);g.P(17,12+b,GY);g.P(16,14+b,"#5a6478");
    g.L(9,5+b,8,1+b,B);g.L(10,5+b,10,2+b,C);g.L(23,5+b,24,1+b,B);g.L(22,5+b,22,2+b,C);
    g.L(16,3+b,16,0+b,C);g.L(14,4+b,13,1+b,B);g.L(18,4+b,19,1+b,B);g.E(16,4+b,1,1,Y);g.P(16,4+b,"#ffffff")},
  umbra(g0,b){const g=mirG(g0),N="#2a2456",V="#4a3a9a",C="#4ad8ff",CL="#bff4ff",Y="#ffe04a";
    g.E(26,15+b,3,5,V);g.E(27,11+b,2,4,C);g.L(27,7+b,29,3+b,C);g.P(28,8+b,CL);g.P(27,12+b,CL);g.P(25,18+b,C);g.L(24,19+b,22,20+b,N);
    g.R(8,24,3,6,N);g.R(12,25,3,5,N);g.R(18,25,3,5,N);g.R(22,24,3,6,N);g.R(8,29,3,1,C);g.R(12,29,3,1,C);g.R(18,29,3,1,C);g.R(22,29,3,1,C);
    g.E(16,20+b,8,5,N);g.E(16,22+b,5,2,V);g.P(12,18+b,C);g.P(13,19+b,C);g.P(19,21+b,C);g.P(20,20+b,C);g.P(16,18+b,C);g.L(21,17+b,23,18+b,C);
    g.E(11,15+b,4,5,V);g.L(13,11+b,15,7+b,C);g.L(12,12+b,13,8+b,CL);g.L(14,13+b,17,10+b,C);g.P(15,14+b,C);
    g.E(9,13+b,5,4,N);g.E(5,15+b,3,2,N);g.P(2,15+b,V);g.P(3,16+b,V);
    g.L(8,10+b,6,4+b,N);g.L(9,10+b,7,4+b,N);g.L(9,10+b,8,5+b,C);g.L(12,10+b,13,4+b,N);g.L(13,10+b,14,5+b,N);g.L(12,9+b,13,6+b,C);
    g.R(7,12+b,2,2,Y);g.P(7,13+b,OUT);g.L(6,11+b,9,11+b,OUT);g.P(4,17+b,"#fff");g.P(6,17+b,"#fff");g.L(4,16+b,7,16+b,V);
    g.P(21,31,Y);g.P(23,30,Y);g.P(5,31,Y);g.P(27,31,Y);g.P(15,31,C);},
  chronox(g,b){const N="#201934",V="#59428c",I="#9fe8ff",C="#e8fbff",G="#d6b85a",D="#6e5a32",bob=b?1:0;
    /* clockwork jackal: split cloak, crescent clock and frozen hour hand */
    g.R(9,25,5,6,N);g.R(19,25,5,6,N);g.R(8,30,7,1,I);g.R(18,30,7,1,I);g.E(16,20+bob,7,7,V);g.E(16,20+bob,4,5,N);
    g.L(10,18+bob,5,25+bob,N);g.L(22,18+bob,28,24+bob,N);g.P(5,25,I);g.P(28,24,I);g.E(16,10+bob,6,6,N);
    g.L(11,7+bob,8,1+bob,N);g.L(21,7+bob,24,1+bob,N);g.L(10,6+bob,9,2+bob,V);g.L(22,6+bob,23,2+bob,V);
    g.R(11,9+bob,11,3,V);g.R(12,9+bob,9,1,I);g.P(13,10+bob,C);g.P(20,10+bob,C);g.L(16,13+bob,16,16+bob,G);
    g.E(16,20+bob,3,3,D);g.E(16,20+bob,2,2,G);g.L(16,20+bob,18,18+bob,C);g.L(16,20+bob,14,22+bob,I);
    g.L(23,20+bob,29,15+bob,V);g.L(28,15+bob,31,17+bob,I);g.P(30,16+bob,C)},
  verdara(g,b){const B="#5b3a2a",L="#9a6b42",G="#56b86b",E="#baf08a",C="#d9ffff",P="#b88cff",W="#ffffff",bob=b?1:0;
    /* crystal stag: rooted hooves, leaf mantle and branching prism antlers */
    g.R(10,25,4,6,B);g.R(19,25,4,6,B);g.R(9,30,6,1,P);g.R(18,30,6,1,P);g.E(16,20+bob,7,7,L);g.E(16,19+bob,6,4,G);
    g.L(9,18+bob,5,23+bob,G);g.L(23,18+bob,27,23+bob,G);g.P(5,23,E);g.P(27,23,E);g.E(16,11+bob,6,6,B);g.E(16,12+bob,4,4,L);
    g.L(12,7+bob,8,1+bob,C);g.L(10,5+bob,6,3+bob,P);g.L(9,3+bob,5,0+bob,E);g.L(20,7+bob,24,1+bob,C);g.L(22,5+bob,27,3+bob,P);g.L(24,3+bob,29,0+bob,E);
    g.R(11,9+bob,11,3,G);g.P(12,10+bob,W);g.P(20,10+bob,W);g.P(13,10+bob,P);g.P(19,10+bob,P);g.P(16,14+bob,C);
    g.E(16,20+bob,3,4,C);g.E(16,20+bob,1,2,W);g.P(11,18+bob,E);g.P(21,18+bob,E)},
  aurex(g,b){const M="#8a94a2",MD="#4e5868",ML="#c8d2dc",G="#ffd84a",L="#fff3a0",W="#ffffff",R="#ef6a3a",bob=b?1:0;
    /* planted boxer stance and oversized meteor gauntlets */
    g.R(8,26,6,5,MD);g.R(19,26,6,5,MD);g.R(7,30,7,1,G);g.R(19,30,7,1,G);
    g.E(16,20+bob,8,7,M);g.E(16,21+bob,5,4,ML);g.R(13,18+bob,7,2,G);g.P(16,17+bob,L);
    g.E(6,20+(b?0:1),5,5,MD);g.E(26,18+(b?1:0),5,5,MD);g.E(5,19+(b?0:1),3,3,M);g.E(27,17+(b?1:0),3,3,M);
    g.R(3,18+(b?0:1),5,3,G);g.R(24,16+(b?1:0),5,3,G);g.P(3,18,L);g.P(28,16,W);
    /* rhinoceros helmet, solar horn and visor */
    g.E(16,10+bob,7,6,M);g.E(16,11+bob,5,4,ML);g.L(15,5+bob,17,0+bob,L);g.L(16,5+bob,19,1+bob,G);g.P(18,0+bob,W);
    g.L(9,8+bob,6,4+bob,MD);g.L(23,8+bob,26,4+bob,MD);g.P(6,4+bob,G);g.P(26,4+bob,G);
    g.R(10,9+bob,13,3,"#33284a");g.R(11,9+bob,11,1,R);g.P(12,10+bob,W);g.P(20,10+bob,W);
    g.R(13,14+bob,7,2,MD);g.P(14,14+bob,L);g.P(18,14+bob,L);
    /* luminous shoulder reactors */
    g.E(8,15+bob,3,3,G);g.E(24,15+bob,3,3,G);g.E(8,15+bob,1,1,W);g.E(24,15+bob,1,1,W);
    g.P(11,23+bob,G);g.P(21,23+bob,G);g.L(13,24+bob,19,24+bob,MD);}
});
const KNIGHTDRAW=(g,b)=>{const W="#f4f8ff",S="#c8d2e0",SL="#eef2f8",SD="#7a8498",Y="#ffd84a",B="#7fd0ff",BD="#3a8ad0",C="#e2f8ff";
  g.L(4,26,2,31,BD);g.R(5,18+b,6,12,B);g.R(5,18+b,2,12,C);
  g.R(12,26,3,5,SD);g.R(18,26,3,5,SD);g.R(11,30,5,1,S);g.R(17,30,5,1,S);
  g.E(16,20+b,7,7,S);g.E(15,19+b,4,4,SL);g.R(13,22+b,7,2,Y);g.P(16,18+b,Y);g.L(15,17+b,17,17+b,Y);
  g.E(9,17+b,3,3,S);g.E(23,17+b,3,3,S);g.P(8,16+b,SL);g.P(22,16+b,SL);
  g.L(25,19+b,30,2+b,"#ffffff");g.L(26,19+b,31,3+b,Y);g.L(24,19+b,29,2+b,C);g.R(22,19+b,5,2,Y);g.R(23,21+b,2,3,"#8a5a2a");
  g.E(16,10+b,7,6,S);g.E(16,9+b,5,4,SL);g.R(11,10+b,11,2,"#2a3a5a");g.P(13,10+b,Y);g.P(19,10+b,Y);g.R(15,3+b,2,4,Y);g.L(16,3+b,10,0+b,B);g.L(16,4+b,11,1+b,C);
  g.L(9,6+b,8,3+b,SD);g.L(23,6+b,24,3+b,SD);g.P(16,14+b,SD)};
const SPR={};for(const k in MONS){const a=pix(SS,SS,DRAW[k],0),b=pix(SS,SS,DRAW[k],1);SPR[k]={f:[a.c,b.c],w:[a.w,b.w]}}
const PROP={
  crate:pix(16,18,g=>{g.R(1,1,14,16,"#b8793a");g.R(1,1,14,2,"#d79a52");g.R(1,7,14,1,"#8f5a28");g.R(1,12,14,1,"#8f5a28");g.L(2,3,13,16,"#8f5a28")}).c,
  barrel:pix(14,18,g=>{g.E(7,9,5,7,"#c0392b");g.R(2,5,10,2,"#f5c542");g.R(2,11,10,2,"#f5c542");g.E(7,3,4,1,"#e85a4a");g.P(7,8,"#fff");g.P(6,9,"#fff");g.P(8,9,"#fff");g.P(7,9,"#14121f")}).c,
  rock:pix(22,18,g=>{g.E(11,10,9,6,"#6f6a70");g.E(8,7,5,3,"#8a858c");g.E(15,12,4,3,"#57525a");g.P(6,6,"#aaa5ac");g.P(7,5,"#aaa5ac")}).c,
  bush:pix(38,26,g=>{const A="#2f8f3f",B="#49b356",D="#226e30";g.E(10,16,8,7,A);g.E(27,16,8,7,A);g.E(19,12,10,9,A);g.E(13,10,5,4,B);g.E(24,9,5,4,B);g.E(19,16,6,3,D);g.P(8,13,B);g.P(30,14,B);g.P(20,6,"#7fe08a");g.P(12,18,D);g.P(28,19,D)}).c,
  canopy:pix(40,34,g=>{const A="#1f7a35",B="#35a04a",D="#17602a";g.E(12,20,10,9,A);g.E(28,20,10,9,A);g.E(20,13,13,11,A);g.E(14,11,6,5,B);g.E(26,10,6,4,B);g.E(20,22,8,4,D);g.E(9,22,3,2,D);g.P(20,5,"#7fe08a");g.P(12,8,"#7fe08a");g.P(29,8,"#7fe08a")}).c,
  trunk:pix(10,16,g=>{g.R(3,1,4,13,"#6b4424");g.R(3,1,1,13,"#8a5a2a");g.R(1,13,8,2,"#6b4424")}).c,
  stump:pix(12,8,g=>{g.E(6,4,4,2,"#2a2020");g.P(5,3,"#4a3a3a");g.P(7,4,"#ff7a3d")}).c
};

/* ================= detailed prop sprites (pixel art drawn in code) ================= */
const clp=(v,a,b)=>v<a?a:v>b?b:v;
/* shaded ellipse: light comes from the top-left; cols run light -> dark */
function shE(g,cx,cy,rx,ry,cols){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const a=(x-cx)/(rx+.5),b=(y-cy)/(ry+.5),q=a*a+b*b;if(q>1)continue;
  const l=clp(.5+a*.38+b*.5+q*.25,0,.999);g.P(x,y,cols[Math.floor(l*cols.length)])}}
function shR(g,x,y,w,h,cols){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const l=clp((i/w)*.45+(j/h)*.55,0,.999);g.P(x+i,y+j,cols[Math.floor(l*cols.length)])}}
const dither=(g,x,y,w,h,c,p)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(((x+i)*7+(y+j)*13)%p===0)g.P(x+i,y+j,c)};
Object.assign(PROP,{
  crate:pix(18,20,g=>{shR(g,1,2,16,17,["#e0a65e","#c88a46","#b07636","#8f5a28"]);g.R(1,2,16,2,"#f0c07a");g.R(1,9,16,1,"#7a4a1e");g.R(1,15,16,1,"#7a4a1e");g.R(1,2,1,17,"#f0c07a");g.R(16,2,1,17,"#6b4018");
    g.L(2,4,15,17,"#8f5a28");g.L(2,5,14,17,"#7a4a1e");for(const[x,y]of[[3,4],[14,4],[3,17],[14,17],[3,11],[14,11]])g.P(x,y,"#cfd6dc");g.R(1,19,16,1,"#4a2a10")}).c,
  barrel:pix(16,20,g=>{shE(g,8,10,6,8,["#ff6a5a","#e04030","#c0392b","#8a2016","#5a1410"]);g.R(2,4,12,2,"#c8a040");g.R(2,14,12,2,"#c8a040");g.R(3,4,4,1,"#f5d070");g.R(3,14,4,1,"#f5d070");
    g.E(8,2,5,1,"#a02a20");g.E(8,2,3,0,"#5a1410");g.R(6,7,4,5,"#f5c542");g.P(8,8,"#14121f");g.P(7,9,"#14121f");g.P(9,9,"#14121f");g.P(8,10,"#14121f");g.P(4,6,"#ffb0a0");g.P(4,7,"#ffb0a0")}).c,
  rock:pix(24,20,g=>{shE(g,12,11,10,7,["#b8b2ba","#9a949c","#7a757c","#5f5a62","#47434a"]);shE(g,8,8,5,3,["#cfc9d0","#aaa5ac","#8a858c"]);g.L(10,9,14,13,"#3f3b42");g.L(14,13,17,12,"#3f3b42");g.P(6,6,"#e8e2ea");g.P(7,5,"#e8e2ea");
    dither(g,6,12,12,4,"#4cae52",11)}).c,
  boulder:pix(22,20,g=>{shE(g,11,11,9,8,["#c2b8a8","#a89c8a","#8a7e6c","#6c6252","#4e463a"]);g.L(7,12,11,15,"#3e362c");g.L(11,15,15,13,"#3e362c");g.L(13,6,16,9,"#3e362c");shE(g,9,6,4,2,["#5cb85a","#3f8a3a"]);g.P(6,7,"#efe8dc")}).c,
  snowball:pix(20,20,g=>{shE(g,10,10,8,8,["#ffffff","#f4fbff","#e2f0fa","#c8dcef","#9fbcd8"]);g.P(6,5,"#ffffff");g.P(5,6,"#ffffff");g.R(4,17,12,1,"#9fbcd8");dither(g,5,8,10,8,"#d8e8f4",7)}).c,
  log:pix(26,16,g=>{shR(g,2,3,20,10,["#a87444","#8a5a2a","#6b4424","#4e3018"]);for(let x=4;x<21;x+=4)g.L(x,4,x+2,11,"#5a3a1c");g.R(2,3,20,1,"#c8925a");
    g.E(22,8,3,5,"#e0b878");g.E(22,8,2,3,"#c89a5a");g.E(22,8,1,1,"#a87444");g.P(22,8,"#8a5a2a");g.R(8,2,3,1,"#3f8a3a");g.P(9,1,"#5cb85a")}).c,
  tumble:pix(18,16,g=>{const c=["#b8925a","#8a6a3a","#d8b878"];
    for(let i=0;i<60;i++){const a=i*.37,r=2+(i*7)%6;g.P(9+Math.cos(a)*r*1.2,8+Math.sin(a)*r,c[i%3])}}).c,
  urn:pix(14,18,g=>{shE(g,7,11,5,6,["#e89a5a","#c8743a","#a85a2a","#7a3e1a"]);g.R(4,2,6,3,"#c8743a");g.R(3,2,8,1,"#e89a5a");g.R(3,10,8,1,"#f5d070");g.R(3,12,8,1,"#3a2a6a");for(let x=4;x<11;x+=2)g.P(x,11,"#3a2a6a")}).c,
  pillar:pix(18,34,g=>{shR(g,4,4,10,26,["#e2dccf","#c8c0b0","#a8a090","#888070"]);for(let x=6;x<13;x+=3)g.R(x,6,1,22,"#9a9282");g.R(2,1,14,4,"#d8d0c0");g.R(2,1,14,1,"#f0eadc");g.R(2,29,14,4,"#b8b0a0");g.R(2,32,14,1,"#7a7262");
    dither(g,4,18,10,10,"#5cae52",9)}).c,
  stele:pix(16,26,g=>{shR(g,2,3,12,21,["#b8a888","#9a8a6a","#7a6a4e"]);g.E(8,3,6,2,"#b8a888");for(let y=8;y<20;y+=3)g.R(5,y,6,1,"#5a4a32");g.P(8,6,"#f5c542");g.R(1,23,14,2,"#6a5a42")}).c,
  icewall:pix(18,26,g=>{const A="#bfe6ff",B="#e8f8ff",D="#7cc4ff",E="#4a9ad8";for(const [cx,top,w] of [[5,6,4],[11,2,5],[15,9,3]]){for(let y=top;y<24;y++){const hw=Math.min(w,(y-top)*.9+1);g.R(Math.round(cx-hw),y,Math.round(hw*2),1,y<top+3?B:A)}g.L(cx,top+1,cx,23,B);g.L(cx+1,top+3,cx+Math.round(w*.7),23,D)}g.R(1,23,16,2,E);g.P(10,5,"#ffffff");g.P(4,10,"#ffffff")}).c,
  /* city */
  car:pix(44,26,g=>{const B=["#ff7a6a","#e04a3a","#b8302a","#7a1a14"];shR(g,2,8,40,13,B);g.R(10,3,22,7,"#c8382a");g.R(12,4,8,5,"#9ad4ff");g.R(22,4,8,5,"#7cc4ff");g.R(12,4,8,1,"#e8f8ff");
    g.R(2,12,40,1,"#ffb0a0");g.R(40,10,2,3,"#fff3a0");g.R(2,10,2,3,"#ff3a2a");g.E(10,21,4,4,"#1e1e24");g.E(10,21,2,2,"#9a9aa8");g.E(34,21,4,4,"#1e1e24");g.E(34,21,2,2,"#9a9aa8");g.R(20,14,2,1,"#1e1e24")}).c,
  bin:pix(14,18,g=>{shR(g,2,4,10,13,["#7ad06a","#4aa04a","#2f7a3a","#1f5a2a"]);g.R(1,2,12,3,"#3f8a3a");g.R(1,2,12,1,"#8fe07a");for(let x=4;x<11;x+=3)g.R(x,6,1,9,"#1f5a2a")}).c,
  hydrant:pix(12,16,g=>{shR(g,3,4,6,10,["#ff6a5a","#e0402a","#a02016"]);g.E(6,4,3,2,"#e0402a");g.R(1,7,10,2,"#c0392b");g.R(2,14,8,2,"#7a1a14");g.P(5,3,"#ffd0c8")}).c,
  lamp:pix(14,44,g=>{g.R(6,6,2,34,"#4a4e58");g.R(6,6,1,34,"#7a7e88");g.R(3,40,8,3,"#2a2e38");g.R(2,2,10,4,"#3a3e48");g.R(3,6,8,2,"#fff3a0");g.R(4,6,6,1,"#ffffff");g.R(4,20,6,4,"#e04a3a");g.P(5,21,"#ffb0a0")}).c,
  bench:pix(26,14,g=>{g.R(1,3,24,3,"#a87444");g.R(1,3,24,1,"#c8925a");g.R(1,7,24,3,"#8a5a2a");g.R(3,10,2,3,"#3a3e48");g.R(21,10,2,3,"#3a3e48")}).c,
  vend:pix(18,28,g=>{shR(g,1,2,16,24,["#5a9aff","#3a6ad8","#2a4aa8"]);g.R(3,4,9,12,"#1a2440");for(let y=5;y<15;y+=3)for(let x=4;x<11;x+=2)g.P(x,y,["#ff6a5a","#f5c542","#5fd38a"][(x+y)%3]);
    g.R(13,5,2,6,"#c8d4e0");g.R(3,18,12,3,"#0e1220");g.R(1,2,16,1,"#9ad4ff");g.R(1,26,16,1,"#1a2a60")}).c,
  cone:pix(12,14,g=>{for(let y=1;y<12;y++){const w=1+y*.42;g.R(Math.round(6-w),y,Math.round(w*2),1,y===5||y===6?"#ffffff":"#ff8a2a")}g.R(1,12,10,2,"#d06a1a")}).c,
  desk:pix(26,16,g=>{shR(g,1,3,24,7,["#c8925a","#a87444","#8a5a2a"]);g.R(1,3,24,1,"#e0b080");g.R(2,10,2,5,"#6b4424");g.R(22,10,2,5,"#6b4424");g.R(14,0,8,4,"#2a2e38");g.R(15,1,6,2,"#7cc4ff");g.R(4,2,5,1,"#ffffff")}).c,
  shelf:pix(22,26,g=>{shR(g,1,1,20,24,["#a87444","#8a5a2a","#6b4424"]);for(let y=5;y<24;y+=6){g.R(2,y,18,1,"#4e3018");for(let x=3;x<19;x+=2)g.R(x,y-4,1,4,["#e04a3a","#3a6ad8","#f5c542","#5fd38a","#c8a0ff"][(x*3+y)%5])}}).c,
  sofa:pix(28,16,g=>{shR(g,1,2,26,8,["#a070d0","#8050b8","#603890"]);shR(g,1,8,26,6,["#9060c8","#7048a8","#503080"]);g.R(1,4,3,10,"#603890");g.R(24,4,3,10,"#603890");g.R(13,8,1,6,"#503080")}).c,
  plant:pix(14,20,g=>{g.R(4,13,6,6,"#c8743a");g.R(4,13,6,1,"#e89a5a");shE(g,7,8,5,5,["#7ad06a","#4aa04a","#2f7a3a"]);g.P(4,4,"#9fe08a");g.P(10,6,"#2f7a3a")}).c,
  cooler:pix(12,20,g=>{shR(g,2,8,8,11,["#e8eef4","#c4ced8","#98a4b0"]);shE(g,6,5,4,4,["#bfe6ff","#7cc4ff","#4a9aea"]);g.R(4,11,2,1,"#e04a3a");g.R(7,11,2,1,"#3a6ad8")}).c
,
  /* themed interiors */
  locker:pix(16,28,g=>{shR(g,1,1,14,26,["#9ab4c8","#7a94a8","#5a7488","#3e5466"]);g.R(1,1,14,1,"#c8dcea");g.R(8,2,1,24,"#2e3e4c");for(const x of [3,10])for(let y=4;y<9;y+=2)g.R(x,y,4,1,"#2e3e4c");g.R(6,13,1,3,"#e8eef4");g.R(10,13,1,3,"#e8eef4");g.R(1,26,14,2,"#26323e")}).c,
  wardrobe:pix(22,30,g=>{shR(g,1,1,20,28,["#c8925a","#a87444","#8a5a2a","#6b4424"]);g.R(1,1,20,2,"#e0b080");g.R(11,3,1,25,"#4e3018");g.R(9,13,1,4,"#f5d070");g.R(13,13,1,4,"#f5d070");g.R(3,5,6,7,"#b88050");g.R(14,5,6,7,"#b88050");g.R(1,28,20,2,"#3e2410")}).c,
  bed:pix(26,34,g=>{shR(g,1,1,24,32,["#a87444","#8a5a2a","#6b4424"]);g.R(3,3,20,28,"#e8eef4");g.R(4,4,18,7,"#ffffff");g.R(5,5,7,5,"#f0f4f8");g.R(14,5,7,5,"#f0f4f8");shR(g,3,13,20,18,["#7ab0ff","#5a8ad8","#3a6ab8"]);g.R(3,13,20,1,"#bfe0ff");g.R(1,32,24,2,"#4e3018")}).c,
  tub:pix(32,20,g=>{shR(g,1,2,30,16,["#ffffff","#e8eef4","#c4ced8"]);g.R(4,5,24,10,"#7cc4ff");g.R(4,5,24,1,"#bfe6ff");g.P(10,9,"#ffffff");g.P(20,11,"#ffffff");g.R(26,3,3,2,"#c8d0d8");g.R(1,18,30,2,"#8a96a4")}).c,
  toilet:pix(14,18,g=>{shR(g,3,1,8,6,["#ffffff","#e2e8ee","#c4ced8"]);shE(g,7,11,5,5,["#ffffff","#eef2f6","#c8d0d8"]);g.E(7,11,3,3,"#bfe6ff");g.R(4,16,6,2,"#9aa4b0")}).c,
  sink:pix(14,16,g=>{shR(g,1,3,12,10,["#ffffff","#e2e8ee","#c4ced8"]);g.E(7,8,4,3,"#9ad4ff");g.R(6,1,2,4,"#a8b0bc");g.R(3,13,8,3,"#8a96a4")}).c,
  fridge:pix(16,28,g=>{shR(g,1,1,14,26,["#f4f8fc","#dce4ec","#b8c4d0","#98a4b0"]);g.R(1,10,14,1,"#7a8694");g.R(12,4,1,4,"#7a8694");g.R(12,13,1,6,"#7a8694");g.R(3,14,3,3,"#ff6a5a");g.R(1,26,14,2,"#6a7684")}).c,
  tv:pix(22,18,g=>{g.R(1,1,20,12,"#1e1e24");g.R(2,2,18,10,"#2a3a5a");g.R(3,3,8,3,"#5a8ad8");g.R(12,7,6,3,"#7cc4ff");g.R(2,2,18,1,"#4a5a7a");g.R(9,13,4,2,"#2a2a30");g.R(5,15,12,2,"#3a3a42")}).c,
  counter:pix(26,16,g=>{shR(g,1,4,24,11,["#d8d0c4","#b8ae9e","#988e7e"]);g.R(1,2,24,3,"#eae6e0");g.R(1,2,24,1,"#ffffff");g.R(4,8,8,6,"#a89e8e");g.R(14,8,8,6,"#a89e8e");g.R(10,10,1,2,"#5a524a");g.R(15,10,1,2,"#5a524a");g.R(16,0,5,3,"#c8d0d8")}).c
});
/* ================= helpers ================= */
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const chip=t=>{const c=el("span","chip",TY[t].n);c.style.background=TY[t].c;return c};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const cleanNick=s=>String(s==null?"":s).replace(/[\u0000-\u001f]/g,"").trim().slice(0,12)||"ผู้เล่น";
function seeded(str){let h=1779033703;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
const show=id=>{for(const s of ["splash","menu","lobby","game"])$(s).hidden=s!==id;window.scrollTo(0,0)};

/* ================= sound: small synthesized effects, no audio files ================= */
const SFX={ctx:null,on:true,last:{},
  init(){try{this.ctx=this.ctx||new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==="suspended")this.ctx.resume()}catch(e){this.ctx=null}},
  tone(f,d,type,vol,to){const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type||"square";o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(Math.max(30,to),t+d);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02)},
  noise(d,vol,freq){const c=this.ctx,n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=freq||1200;s.buffer=b;g.gain.value=vol;s.connect(f).connect(g).connect(c.destination);s.start()},
  play(n,a){if(!this.on||!this.ctx)return;const now=performance.now();if(now-(this.last[n]||0)<50)return;this.last[n]=now;
    const P={fire:330,water:250,grass:400,elec:640,earth:150,wind:500,norm:300}[a]||300;
    try{switch(n){
      case"shot":this.tone(P*1.6,.09,"square",.035,P*.8);break;
      case"melee":this.noise(.09,.12,2400);this.tone(P,.08,"sawtooth",.04,P*.5);break;
      case"dash":this.noise(.18,.09,900);this.tone(P*.8,.18,"sawtooth",.03,P*1.6);break;
      case"hit":this.noise(.08,.16,1800);this.tone(170,.09,"square",.05,80);break;
      case"boom":this.noise(.4,.26,500);this.tone(110,.3,"sine",.14,40);break;
      case"beam":this.tone(P*2,.5,"sawtooth",.05,P*.6);this.noise(.5,.1,2600);break;
      case"zap":this.tone(900,.2,"square",.05,200);this.noise(.2,.1,4000);break;
      case"ult":this.tone(160,.9,"sawtooth",.07,960);this.tone(240,.9,"square",.04,1440);break;
      case"ui":this.tone(660,.06,"square",.03,880);break;
      case"ko":this.tone(440,.7,"triangle",.1,70);break;
      case"buff":this.tone(520,.2,"triangle",.06,1040);break}}catch(e){}}
};

/* ================= setup wizard ================= */
const SEL={mon:"pyros",mv:{},nick:"ผู้เล่น",ar:"random",step:1,diff:"hard"};
(function load(){const s=store.get("com.sel3",null);if(s&&MONS[s.mon])SEL.mon=s.mon;if(s&&(s.ar==="random"||ARENAS.some(a=>a.k===s.ar)))SEL.ar=s.ar;if(s&&["easy","hard","god"].includes(s.diff))SEL.diff=s.diff;
  for(const k in MONS){const pool=poolOf(k);let m=s&&s.mv&&Array.isArray(s.mv[k])?s.mv[k].filter(x=>pool.includes(x)):[];m=[...new Set(m)].slice(0,3);SEL.mv[k]=m.length===3?m:defMoves(k)}})();
const saveSel=()=>store.set("com.sel3",{mon:SEL.mon,mv:SEL.mv,ar:SEL.ar,diff:SEL.diff});
const ANIM=[];let animF=0;
function spriteCanvas(k,animate){const c=document.createElement("canvas");c.width=c.height=SS;c.getContext("2d").drawImage(SPR[k].f[0],0,0);if(animate){c.dataset.k=k;ANIM.push(c)}return c}
setInterval(()=>{animF^=1;for(let i=ANIM.length-1;i>=0;i--){const c=ANIM[i];if(!c.isConnected){ANIM.splice(i,1);continue}const g=c.getContext("2d");g.clearRect(0,0,SS,SS);g.drawImage(SPR[c.dataset.k].f[animF],0,0)}},420);
const mvTypeOf=(mv,monKey)=>mv.t==="self"?MONS[monKey].t[0]:mv.t;
function statRow(lab,v){const r=el("div","stat");r.append(el("span",null,lab));const i=el("i");const u=el("u");u.style.width=Math.round(clamp(v,0,1)*100)+"%";i.append(u);r.append(i);return r}
function renderMons(){const box=$("mons");box.textContent="";const keys=Object.keys(MONS),per=6,pages=Math.ceil(keys.length/per);
  if(SEL.page==null)SEL.page=Math.floor(keys.indexOf(SEL.mon)/per);SEL.page=clamp(SEL.page,0,pages-1);
  const pg=$("monPg");pg.textContent="";const pb=el("button","pgb","◀");pb.type="button";pb.disabled=SEL.page===0;pb.onclick=()=>{SEL.page--;SFX.play("ui");renderMons()};pg.append(pb);
  for(let i=0;i<pages;i++){const d=el("button","pgd"+(i===SEL.page?" on":""),String(i+1));d.type="button";d.onclick=()=>{SEL.page=i;SFX.play("ui");renderMons()};pg.append(d)}
  const nb=el("button","pgb","▶");nb.type="button";nb.disabled=SEL.page===pages-1;nb.onclick=()=>{SEL.page++;SFX.play("ui");renderMons()};pg.append(nb);
  for(const k of keys.slice(SEL.page*per,SEL.page*per+per)){const m=MONS[k];const b=el("button","mon");b.type="button";b.setAttribute("aria-pressed",String(SEL.mon===k));b.style.setProperty("--tc",TY[m.t[0]].c);
    b.append(spriteCanvas(k,SEL.mon===k),el("b",null,m.n));const tg=el("div","tg");m.t.forEach(t=>tg.append(chip(t)));b.append(tg,el("span","role",m.role));
    b.onclick=()=>{SEL.mon=k;saveSel();SFX.play("ui");renderMons()};box.append(b)}
  const m=MONS[SEL.mon],d=$("monDetail");d.textContent="";d.style.setProperty("--tc",TY[m.t[0]].c);
  const hero=el("div","hero");hero.append(spriteCanvas(SEL.mon,true));d.append(hero);
  const nm=el("h3",null,m.n);d.append(nm);const tg=el("div","tg");m.t.forEach(t=>tg.append(chip(t)));tg.append(el("span","role",m.role));d.append(tg,el("p","ds",m.ds));
  const sw=el("div","stats");sw.append(statRow("พลังชีวิต",(m.hp-120)/110),statRow("โจมตี",(m.atk-.8)/.55),statRow("ป้องกัน",(m.def-.7)/.65),statRow("ความเร็ว",(m.spd-80)/85));d.append(sw);
  const b=MOVES[m.basic],u=MOVES[m.ult];const k1=el("div","kit");k1.append(el("small",null,"โจมตีพื้นฐาน"),el("b",null,b.n),el("span",null,b.d));
  const k2=el("div","kit ult");k2.append(el("small",null,"ท่าไม้ตาย"),el("b",null,u.n),el("span",null,u.d));d.append(k1,k2)}
function slotCard(lab,mv,key,cls){const s=el("div","slot "+(cls||""));if(mv){const t=mvTypeOf(mv,SEL.mon);s.style.setProperty("--tc",TY[t].c);s.append(el("small",null,lab),el("b",null,mv.n),el("em",null,TY[t].n+" · "+(KIND[mv.kind]||"พิเศษ")))}else{s.classList.add("empty");s.append(el("small",null,lab),el("em",null,"เลือกท่าจากด้านล่าง"))}
  if(key)s.dataset.k=key;return s}
function renderMoves(msg){const cur=SEL.mv[SEL.mon],m=MONS[SEL.mon],lo=$("loadout"),pool=$("pool");lo.textContent="";pool.textContent="";
  lo.append(slotCard("โจมตีพื้นฐาน",MOVES[m.basic],null,"fixed"));
  for(let i=0;i<3;i++){const c=slotCard("สกิล "+(i+1),cur[i]?MOVES[cur[i]]:null,cur[i]);if(cur[i]){c.classList.add("rm");c.title="กดเพื่อถอดท่านี้";c.onclick=()=>{cur.splice(i,1);saveSel();SFX.play("ui");renderMoves()}}lo.append(c)}
  lo.append(slotCard("ท่าไม้ตาย",MOVES[m.ult],null,"fixed ult"));
  const groups=[...(m.sig?[["ท่าเฉพาะตัว",m.sig]]:[]),["ท่าธาตุ"+TY[m.t[0]].n,typedMoves(m.t[0])],["ท่าธาตุ"+TY[m.t[1]].n,typedMoves(m.t[1])],["ท่าทั่วไป",COMMON]];
  for(const [title,list] of groups){pool.append(el("h3","grp",title));const g=el("div","grid");
    for(const k of list){const mv=MOVES[k],t=mvTypeOf(mv,SEL.mon);const b=el("button","mv");b.type="button";b.style.setProperty("--tc",TY[t].c);const on=cur.includes(k);b.setAttribute("aria-pressed",String(on));
      const head=el("span","h");head.append(el("b",null,mv.n),chip(t));
      b.append(head,el("span","n",(mv.pw?"แรง "+mv.pw+(mv.cnt>1?"×"+mv.cnt:"")+" · ":"")+(KIND[mv.kind]||"")+" · "+mv.cd+"s"),el("span","d",mv.d));
      b.onclick=()=>{const i=cur.indexOf(k);if(i>=0){cur.splice(i,1);renderMoves()}else if(cur.length<3){cur.push(k);renderMoves()}else renderMoves("ครบ 3 สกิลแล้ว กดสกิลในแถบด้านบนเพื่อถอดออกก่อน");saveSel();SFX.play("ui")};
      g.append(b)}pool.append(g)}
  const h=$("mvHint");h.className="hint"+(msg||cur.length<3?" warn":"");h.textContent=msg||(cur.length<3?"เลือกอีก "+(3-cur.length)+" สกิลให้ครบก่อนไปต่อ":"ครบแล้ว กดสกิลในแถบด้านบนเพื่อถอด หรือกดถัดไป");renderNav()}
const THUMB={};
function arenaThumbSrc(key){if(THUMB[key])return THUMB[key];const A=buildArena(key),t=document.createElement("canvas");t.width=Math.ceil(W/2);t.height=Math.ceil(H/2);const g=t.getContext("2d");paintArena(A,g);
  A.walls.forEach(w=>{if(!w.nodraw)g.drawImage(wallCanvas(w,A.wallStyle),w.x/2,w.y/2-8)});
  for(const p of [...A.props].sort((a,b)=>a.y-b.y)){if(p.lv)continue;if(p.k==="tree"){g.drawImage(PROP.trunk,p.x/2-5,p.y/2-14);g.drawImage(PROP.canopy,p.x/2-20,p.y/2-39);continue}
    const im=PROP[p.k];if(im)g.drawImage(im,Math.round(p.x/2-im.width/2),Math.round(p.y/2+4-im.height))}
  if(A.thumbExtra)A.thumbExtra(g);return THUMB[key]=t}
function arenaThumb(key){const c=document.createElement("canvas");c.width=192;c.height=120;const g=c.getContext("2d");g.imageSmoothingEnabled=false;
  if(key==="random"){g.fillStyle="#29253d";g.fillRect(0,0,192,120);g.fillStyle="#f5c542";g.font='700 64px "Silkscreen",monospace';g.textAlign="center";g.fillText("?",96,84);return c}
  const t=arenaThumbSrc(key),sc=Math.max(192/t.width,120/t.height);g.drawImage(t,(192-t.width*sc)/2,(120-t.height*sc)/2,t.width*sc,t.height*sc);return c}
function renderArenas(){const box=$("arenas");box.textContent="";
  for(const a of [{k:"random",n:"สุ่มสนาม",d:"สุ่มหนึ่งในทุกสนามทุกครั้งที่เริ่ม"},...ARENAS]){const b=el("button","ar");b.type="button";b.setAttribute("aria-pressed",String(SEL.ar===a.k));
    b.append(arenaThumb(a.k),el("b",null,a.n),el("span",null,a.d));b.onclick=()=>{SEL.ar=a.k;saveSel();SFX.play("ui");renderArenas()};box.append(b)}}
function renderDiff(){const box=$("diff");if(!box)return;box.textContent="";for(const [k,n,d] of [["easy","ง่าย","บอทเล็งพลาดบ่อย ตอบสนองช้า"],["hard","ยาก","บอทมาตรฐาน หลบและใช้สกิลเป็น"],["god","เทพ","เล็งดักทาง หลบแทบทุกอย่าง แรงกว่าปกติ"]]){
    const b=el("button","dbtn"+(k==="god"?" god":""));b.type="button";b.setAttribute("aria-pressed",String(SEL.diff===k));b.append(el("b",null,n),el("span",null,d));b.onclick=()=>{SEL.diff=k;saveSel();SFX.play("ui");renderDiff()};box.append(b)}}
function renderChart(){const c=$("chart");c.textContent="";
  for(const k of ["fire","water","grass","elec","earth","wind","metal","shadow","ice","light"]){const r=el("div");r.append(chip(k),el("span","w","ชนะ"));for(const b of TY[k].beats)r.append(chip(b));c.append(r)}}
function renderNav(){const ok=SEL.mv[SEL.mon].length===3;$("bBack").hidden=SEL.step===1;$("bNext").hidden=SEL.step===3;$("bNext").disabled=SEL.step===2&&!ok;
  $("bNext").textContent=SEL.fromRoom&&NR?"กลับเข้าห้อง":SEL.step===1?"ถัดไป: จัดท่า":"ถัดไป: เลือกสนาม";if(SEL.fromRoom&&NR)$("bNext").hidden=false;$("navInfo").textContent=MONS[SEL.mon].n+(SEL.step>1?" · "+SEL.mv[SEL.mon].map(k=>MOVES[k].n).join(" / "):"");
  [...$("steps").children].forEach((li,i)=>{li.className=i+1===SEL.step?"on":i+1<SEL.step?"done":""})}
function gotoStep(n){SEL.step=n;$("menu").classList.toggle("fit1",n===1);for(const i of [1,2,3])$("st"+i).hidden=i!==n;if(n===1)renderMons();if(n===2)renderMoves();if(n===3){renderArenas();renderDiff();netButtons()}renderNav();window.scrollTo(0,0)}

/* ================= online ================= */
let ROOM=null,NR=null,CODE="",netState="off",unsubPeers=null,myReady=false,ISHOST=false;
function netButtons(){const ok=SEL.mv[SEL.mon].length===3&&!!ROOM;$("bHost").disabled=!ok;$("bJoin").disabled=!ok;$("bBot").disabled=SEL.mv[SEL.mon].length!==3||!PG}
function netHint(){$("netHint").textContent=netState==="wait"?"กำลังเชื่อมต่อระบบเล่นออนไลน์…":netState==="ok"?NETOK:NETOFF;netButtons()}
const NETOK="เล่นออนไลน์ได้เลย ไม่ต้องสมัครสมาชิก สร้างห้องแล้วส่งรหัสหรือลิงก์เชิญให้เพื่อน",NETOFF="เบราว์เซอร์นี้เชื่อมต่อผู้เล่นอื่นไม่ได้ ยังฝึกกับบอทได้ตามปกติ",INVITE=true;
/* Peer-to-peer room over WebRTC (PeerJS). Same small surface the game uses: presence / peers / onPeers / leave. */
function peerRoom(code,host){return new Promise((resolve,reject)=>{
  const ID="clashmon9-"+code;let mine={},theirs=null,conn=null,done=false,closed=false;const hs=new Set();
  const peer=host?new Peer(ID):new Peer();
  const fire=()=>hs.forEach(h=>{try{h()}catch(e){}});
  const send=()=>{if(conn&&conn.open){try{conn.send(mine)}catch(e){}}};
  const fail=c=>{if(!done){done=true;try{peer.destroy()}catch(e){}reject(c)}};
  const room={
    presence(p){mine={...mine};for(const k in p){if(p[k]===null)delete mine[k];else mine[k]=p[k]}send();return Promise.resolve()},
    peers(){const a=[{peer:peer.id||"",sameTab:true,presence:mine}];if(conn&&conn.open&&theirs)a.push({peer:conn.peer,sameTab:false,presence:theirs});return a},
    onPeers(h){hs.add(h);return()=>hs.delete(h)},
    leave(){closed=true;hs.clear();try{peer.destroy()}catch(e){}return Promise.resolve()}};
  const wire=c=>{conn=c;
    c.on("open",()=>{theirs={};send();fire();if(!host&&!done){done=true;resolve(room)}});
    c.on("data",d=>{if(d&&typeof d==="object"&&!Array.isArray(d)){theirs=d;fire()}});
    c.on("close",()=>{if(conn===c){conn=null;theirs=null;fire()}});
    c.on("error",()=>{})};
  peer.on("open",()=>{if(host){done=true;resolve(room)}else wire(peer.connect(ID,{reliable:true}))});
  peer.on("connection",c=>{if(!host||(conn&&conn.open)){c.on("open",()=>c.close());return}wire(c)});
  peer.on("disconnected",()=>{if(!closed){try{peer.reconnect()}catch(e){}}});
  peer.on("error",e=>{const t=e&&e.type;if(t==="unavailable-id")fail("taken");else if(t==="peer-unavailable")fail("nohost");else if(!done)fail("net")});
  setTimeout(()=>fail("timeout"),15000);
})}
ROOM=typeof Peer==="function"&&typeof RTCPeerConnection==="function"?{join:peerRoom}:null;netState=ROOM?"ok":"off";


const PV=9,myCard=()=>({v:PV,nick:SEL.nick,mon:SEL.mon,mv:SEL.mv[SEL.mon].slice(),ar:SEL.ar,host:ISHOST||null});
const CLR={ready:false,rt:0,ko:null,g:null,a:null,h:null,mn:null,xb:null};
async function enterRoom(code,host){if(!ROOM)return;code=code.toLowerCase();
  if(!/^[a-z0-9]{4}$/.test(code)){$("netHint").textContent="รหัสห้องต้องเป็นตัวอักษรอังกฤษหรือตัวเลข 4 ตัว";return}
  $("netHint").textContent="กำลังเข้าห้อง…";
  try{NR=await ROOM.join(code,!!host)}catch(e){if(host&&e==="taken"){$("bHost").click();return}
    $("netHint").textContent=e==="nohost"?"ไม่พบห้องรหัสนี้ ตรวจรหัสอีกครั้ง หรือให้เพื่อนสร้างห้องใหม่":e==="timeout"?"เชื่อมต่อไม่ทันเวลา เครือข่ายอาจปิดกั้นการเชื่อมต่อแบบตรง ลองเปลี่ยนเครือข่าย":"เข้าห้องไม่สำเร็จ ลองใหม่อีกครั้ง";return}
  CODE=code;myReady=false;ISHOST=!!host;NR.presence({...myCard(),...CLR}).catch(()=>{});
  $("lobCode").textContent=code.toUpperCase();$("bCopy").hidden=!INVITE;show("lobby");renderLobby();
  if(unsubPeers)unsubPeers();unsubPeers=NR.onPeers(()=>{if(!$("lobby").hidden)renderLobby()},()=>{});netHint()}
function pushCard(){if(NR)NR.presence({...myCard(),...CLR,ready:myReady,rt:myReady?Date.now():0}).catch(()=>{})}
function leaveRoom(){ISHOST=false;if(unsubPeers){unsubPeers();unsubPeers=null}if(NR){NR.leave().catch(()=>{});NR=null}CODE="";myReady=false}
function peerCard(p){const q=p.presence||{};const mon=MONS[q.mon]?q.mon:"pyros";const pool=poolOf(mon);
  let mv=Array.isArray(q.mv)?[...new Set(q.mv.filter(k=>typeof k==="string"&&pool.includes(k)))].slice(0,3):[];if(mv.length<3)mv=defMoves(mon);
  return{nick:cleanNick(q.nick),mon,mv,ready:!!q.ready,rt:Number(q.rt)||0,ar:typeof q.ar==="string"?q.ar:"random",v:q.v,host:!!q.host}}
function renderLobby(){if(!NR)return;const ps=NR.peers(),box=$("seats");box.textContent="";let old=false;
  for(const p of ps){const c=peerCard(p);if(!p.sameTab&&c.v!==PV&&c.v!=null)old=true;const s=el("div","seat"+(c.ready?" rdy":""));s.append(spriteCanvas(c.mon,true));
    const d=el("div");d.append(el("b",null,c.nick+(p.sameTab?" (คุณ)":"")),el("small",null,MONS[c.mon].n+" · "+MONS[c.mon].t.map(t=>TY[t].n).join("/")),el("small",null,c.ready?"พร้อมแล้ว":"ยังไม่พร้อม"));
    if(c.host)d.append(el("small",null,"หัวหน้าห้อง"));s.append(d);box.append(s)}
  renderLobPick(ps);
  const others=ps.filter(p=>!p.sameTab).length;
  $("lobHint").textContent=old?"คู่ต่อสู้เปิดเกมเวอร์ชันเก่าอยู่ ให้รีเฟรชหน้าเกมก่อน":others===0?"รอเพื่อนเข้าห้อง…":others>1?"ห้องนี้มีมากกว่า 2 คน สองคนแรกที่กดพร้อมจะได้ดวลกัน":myReady?"รอคู่ต่อสู้กดพร้อม…":"กดพร้อมเมื่อจัดทีมเสร็จ";
  $("bReady").textContent=myReady?"ยกเลิกพร้อม":"พร้อม";
  if(myReady&&!old){const rd=ps.filter(p=>p.presence&&p.presence.ready&&!p.presence.ko).sort((a,b)=>((Number(a.presence.rt)||0)-(Number(b.presence.rt)||0))||(a.peer<b.peer?-1:1)).slice(0,2);
    const me=rd.find(p=>p.sameTab),op=rd.find(p=>!p.sameTab);if(me&&op)startNet(me,op)}}
function initUI(){
  $("bHost").onclick=()=>{const A="abcdefghjkmnpqrstuvwxyz23456789";let c="";for(let i=0;i<4;i++)c+=A[(Math.random()*A.length)|0];enterRoom(c,true)};
  $("bJoin").onclick=()=>enterRoom($("code").value.trim(),false);
  $("code").addEventListener("keydown",e=>{if(e.key==="Enter"&&!$("bJoin").disabled)$("bJoin").click()});
  $("bReady").onclick=()=>{if(!NR)return;myReady=!myReady;SFX.play("ui");NR.presence({...myCard(),...CLR,ready:myReady,rt:myReady?Date.now():0}).catch(()=>{});renderLobby()};
  $("bCopy").onclick=async()=>{const u=location.origin+location.pathname+"#"+CODE;const b=$("bCopy");try{await navigator.clipboard.writeText(u);b.textContent="คัดลอกแล้ว"}catch(e){b.textContent=u}setTimeout(()=>{b.textContent="คัดลอกลิงก์เชิญ"},2500)};
  $("bLeave").onclick=()=>{leaveRoom();show("menu")};
  $("bLobMv").onclick=()=>{SFX.play("ui");SEL.fromRoom=true;show("menu");gotoStep(2)};
  const readHash=()=>{const h=(location.hash||"").slice(1).toLowerCase();if(/^[a-z0-9]{4}$/.test(h))$("code").value=h.toUpperCase()};readHash();addEventListener("hashchange",readHash);
  $("bNext").onclick=()=>{SFX.play("ui");if(SEL.fromRoom&&NR){SEL.fromRoom=false;if(myReady)myReady=false;pushCard();show("lobby");renderLobby();return}gotoStep(Math.min(3,SEL.step+1))};$("bBack").onclick=()=>{SFX.play("ui");gotoStep(Math.max(1,SEL.step-1))};
  [...$("steps").children].forEach((li,i)=>li.onclick=()=>{if(i+1<SEL.step||(SEL.mv[SEL.mon].length===3))gotoStep(i+1)});
  $("bBot").onclick=startBot;$("bSnd").onclick=()=>{SFX.on=!SFX.on;$("bSnd").textContent=SFX.on?"เสียง: เปิด":"เสียง: ปิด"};
  renderChart();gotoStep(1);netHint()}

/* room: change monster any time, host picks the arena for the next round */
function renderLobPick(ps){const mb=$("lobMons");if(!mb)return;mb.textContent="";
  for(const k in MONS){const m=MONS[k],b=el("button","lmon");b.type="button";b.setAttribute("aria-pressed",String(SEL.mon===k));b.style.setProperty("--tc",TY[m.t[0]].c);b.title=m.n;
    b.append(spriteCanvas(k,SEL.mon===k),el("span",null,m.n));b.onclick=()=>{SEL.mon=k;saveSel();SFX.play("ui");if(myReady)myReady=false;pushCard();renderLobby()};mb.append(b)}
  $("lobMoves").textContent=SEL.mv[SEL.mon].map(k=>MOVES[k].n).join(" · ");
  const ab=$("lobAr");ab.textContent="";const host=ps.find(p=>peerCard(p).host),hc=host?peerCard(host):null;
  if(ISHOST){$("lobArHint").textContent="คุณเป็นหัวหน้าห้อง เลือกสนามสำหรับรอบถัดไปได้";
    for(const a of [{k:"random",n:"สุ่มสนาม"},...ARENAS]){const b=el("button","lar");b.type="button";b.setAttribute("aria-pressed",String(SEL.ar===a.k));b.append(arenaThumb(a.k),el("span",null,a.n));
      b.onclick=()=>{SEL.ar=a.k;saveSel();SFX.play("ui");pushCard();renderLobby()};ab.append(b)}}
  else{const k=hc?hc.ar:"random",a=ARENAS.find(x=>x.k===k);$("lobArHint").textContent="หัวหน้าห้องเป็นคนเลือกสนาม";const b=el("div","lar on");b.append(arenaThumb(k),el("span",null,a?a.n:"สุ่มสนาม"));ab.append(b)}}
/* ================= arena layouts =================
   Classic arenas are authored on a 960x600 grid and scaled up 1.4x (1344x840).
   City and MOBA build their own, larger worlds (see c_city.js / c_moba.js). */
const ASIZE={city:[1900,1260],moba:[3000,1800],skyforge:[1700,1000],titanback:[1760,1060]};
const PDEF={crate:{r:14,hp:3},barrel:{r:11,hp:1,kick:1},rock:{r:15,hp:3},tree:{r:8,R:32,hp:1},bush:{r:0,R:30,hp:1},cactus:{r:10,hp:2},icep:{r:13,hp:2},
  boulder:{r:13,hp:4,kick:1},snowball:{r:12,hp:2,kick:1},log:{r:12,hp:3,kick:1},tumble:{r:9,hp:1,kick:1},urn:{r:9,hp:1,kick:1},
  car:{r:22,hp:6,kick:1},bin:{r:9,hp:1,kick:1},hydrant:{r:7,hp:2},lamp:{r:6,hp:3},bench:{r:12,hp:2},vend:{r:12,hp:3},cone:{r:6,hp:1,kick:1},
  desk:{r:13,hp:2},shelf:{r:12,hp:2},sofa:{r:14,hp:2},plant:{r:8,hp:1},cooler:{r:8,hp:1,kick:1},
  locker:{r:0,R:15,hp:4,hide:1},wardrobe:{r:0,R:17,hp:4,hide:1},bed:{r:16,hp:3},tub:{r:15,hp:4},toilet:{r:7,hp:2},sink:{r:7,hp:2},fridge:{r:10,hp:4},tv:{r:9,hp:1,kick:1},counter:{r:13,hp:4},
  pillar:{r:14,hp:9},stele:{r:12,hp:5}};
function newArena(key){return{key,props:[],water:[],bridges:[],lava:[],ice:[],sand:[],bog:[],walls:[],pads:[],spring:null,blds:[],sky:[],stairs:[],holes:[],platforms:[],lifts:[],units:null,lanes:null}}
function addProp(A,k,x,y,lv){const d=PDEF[k];const p={i:A.props.length,k,x,y,r:d.r,R:d.R||d.r,hp:d.hp,dead:false,kick:!!d.kick,lv:lv||0};A.props.push(p);return p}
function buildArena(key){
  if(ASIZE[key]){[W,H]=ASIZE[key];const A=newArena(key);({city:buildCity,moba:buildMoba,skyforge:buildSkyforge,titanback:buildTitanBack}[key])(A);return A}
  W=960;H=600;const A=newArena(key);
  const P=(k,pts,sym)=>{for(const[x,y]of pts){for(const q of sym===0?[[x,y]]:[[x,y],[W-x,H-y]]){if(A.props.some(p=>p.x===q[0]&&p.y===q[1]))continue;addProp(A,k,q[0],q[1])}}};
  const E=(arr,list)=>{for(const[x,y,rx,ry]of list)for(const q of (x===W/2&&y===H/2)?[[x,y]]:[[x,y],[W-x,H-y]])arr.push({x:q[0],y:q[1],rx,ry,cool:0,e:1})};
  switch(key){
    case"stadium":P("crate",[[300,180],[300,420],[480,150],[390,300],[150,250],[640,90]]);P("crate",[[480,300]],0);P("barrel",[[480,80],[190,110],[190,490],[620,250],[400,210],[90,380]]);P("pillar",[[110,90],[110,510]]);break;
    case"forest":P("tree",[[300,170],[300,430],[480,110],[150,130],[620,300],[90,520],[250,560]]);P("tree",[[480,300]],0);P("bush",[[390,300],[480,205],[220,300],[110,470],[380,90],[380,510],[230,200],[700,520],[60,300]]);
      P("log",[[400,400],[160,330],[560,210],[260,60]]);P("boulder",[[620,560]]);break;
    case"river":A.water.push({x:440,y:0,w:80,h:H});A.bridges.push({x:432,y:92,w:96,h:46},{x:432,y:277,w:96,h:46},{x:432,y:462,w:96,h:46});E(A.water,[[210,480,62,36]]);
      P("crate",[[300,300],[330,130]]);P("bush",[[250,90],[120,300],[380,400]]);P("barrel",[[480,300]],0);P("log",[[360,230],[150,190]]);P("boulder",[[390,560],[90,90]]);P("tree",[[60,420]]);break;
    case"volcano":E(A.lava,[[480,300,56,36],[290,150,40,26],[300,440,34,22],[130,300,28,20],[480,80,36,20]]);P("rock",[[390,220],[210,360],[600,480],[370,520]]);P("boulder",[[200,230],[400,380],[80,140],[560,180]]);P("barrel",[[640,300]]);break;
    case"ice":E(A.ice,[[480,300,180,110],[200,140,92,58],[220,470,74,46]]);P("icep",[[360,190],[340,400],[480,150],[120,300]]);P("rock",[[620,130]]);P("snowball",[[300,300],[90,170],[400,560],[160,560],[620,40]]);break;
    case"desert":E(A.sand,[[480,300,92,58],[250,150,62,40],[280,460,54,36]]);P("cactus",[[370,300],[180,300],[420,110],[330,220],[120,500],[560,430]]);P("rock",[[640,180]]);P("barrel",[[480,470]]);
      P("tumble",[[100,90],[400,390],[230,560],[620,300]]);P("stele",[[60,250]]);break;
    case"ruins":for(const[x,y,w,h]of[[430,120,100,24],[290,250,24,100],[160,96,24,84],[110,410,96,24],[380,440,24,70]]){A.walls.push({x,y,w,h});A.walls.push({x:W-x-w,y:H-y-h,w,h})}
      A.pads.push({x:90,y:70,cd:0},{x:W-90,y:H-70,cd:0});P("crate",[[480,300]],0);P("crate",[[240,200],[560,90]]);P("bush",[[400,300],[90,300]]);P("urn",[[200,300],[350,180],[250,520],[440,380],[60,180]]);P("pillar",[[220,420],[600,250]]);break;
    case"swamp":E(A.bog,[[300,190,92,50],[280,450,72,42],[620,90,64,34],[130,320,50,34]]);A.spring={x:480,y:300,r:36};P("bush",[[400,300],[200,320],[430,120],[110,150]]);P("tree",[[340,330],[560,520],[200,80]]);
      P("log",[[470,200],[150,520],[60,60]]);P("urn",[[390,410]]);break}
  /* scale the 960x600 layout up to the real world size */
  const k=1.4;W=Math.round(960*k);H=Math.round(600*k);
  const sp=o=>{o.x=Math.round(o.x*k);o.y=Math.round(o.y*k)};
  for(const p of A.props)sp(p);for(const arr of [A.water,A.lava,A.ice,A.sand,A.bog])for(const l of arr){sp(l);if(l.e){l.rx=Math.round(l.rx*k);l.ry=Math.round(l.ry*k)}else{l.w=Math.round(l.w*k);l.h=l.h>=600?H:Math.round(l.h*k)}}
  for(const b of A.bridges){sp(b);b.w=Math.round(b.w*k);b.h=Math.round(b.h*1.15)}
  for(const w of A.walls){sp(w);if(w.w>w.h)w.w=Math.round(w.w*k);else w.h=Math.round(w.h*k)}
  for(const p of A.pads)sp(p);if(A.spring){sp(A.spring);A.spring.r=Math.round(A.spring.r*1.2)}
  return A}

/* ================= moving multi-level arenas ================= */
function deck(A,x,y,w,h,mx,my,phase){const p={x,y,bx:x,by:y,w,h,mx:mx||0,my:my||0,phase:phase||0,lv:1};A.platforms.push(p);return p}
function deckXY(p,t){return[p.bx+Math.sin(t*.72+p.phase)*p.mx,p.by+Math.cos(t*.64+p.phase)*p.my]}
function deckAt(A,x,y,t){return A.platforms.find(p=>{const q=deckXY(p,t==null?(G?G.t:0):t);return x>=q[0]&&x<=q[0]+p.w&&y>=q[1]&&y<=q[1]+p.h})}
function movingArenaEnv(f,dt){const A=G.A,t=G.t;
  if(f.lv===1){const p=deckAt(A,f.x,f.y,t);if(p){const a=deckXY(p,t-dt),b=deckXY(p,t);f.x+=b[0]-a[0];f.y+=b[1]-a[1]}
    else{f.lv=0;f.hp=Math.max(0,f.hp-18);f.stun=Math.max(f.stun,.45);f.kx+=Math.sin(t*2)*150;f.ky+=120;pop(f.x,f.y-55,"ตกจากชั้นบน!","#ff9a8a",1);FX.boom(f.x,f.y,"wind",34);if(f===G.me)VIEW.lvT=.5}}
  if(A.tilt&&f.lv===0&&f.roll<=0){const q=Math.sin(t*.68);f.kx+=q*18*dt;if(Math.floor(t/8)!==f.tremN){f.tremN=Math.floor(t/8);f.kx+=q*120;f.ky+=Math.cos(t)*70;G.shake=Math.max(G.shake,5);pop(f.x,f.y-55,"ไททันขยับ!","#ffe066")}}
  let on=null;for(const p of A.lifts)if(Math.hypot(f.x-p.x,f.y-p.y)<24)on=p;if(!on){f.stairLock=0;return}if(f.stairLock)return;
  f.stairLock=1;if(f.lv){f.lv=0}else if(deckAt(A,f.x,f.y,t)){f.lv=1}else return;f.chg=null;f.ifr=Math.max(f.ifr,.2);FX.burst(f.x,f.y-14,"#bfe6ff",18,150,.5);SFX.play("dash");if(f===G.me)VIEW.lvT=.5}
function movingArenaFx(gG,gA,t){const A=G.A,me=G.me;for(const p of A.platforms){const q=deckXY(p,t),on=(me.lv||0)===1;gG.fillStyle(A.key==="skyforge"?0x56677b:0x8b7358,on?.92:.48).fillRoundedRect(q[0],q[1],p.w,p.h,8);gG.lineStyle(3,A.key==="skyforge"?0xffd84a:0x9fe8ff,on?1:.6).strokeRoundedRect(q[0],q[1],p.w,p.h,8);
    for(let x=q[0]+18;x<q[0]+p.w-10;x+=32)gG.fillStyle(0xffffff,.18).fillRect(x,q[1]+8,14,3);if(p.mx||p.my)for(let i=0;i<3;i++)emit("streak",q[0]+rnd(0,p.w),q[1]+p.h/2,rnd(-20,20),rnd(-30,30),.25,A.key==="skyforge"?0xffd84a:0x9fe8ff)}
  for(const p of A.lifts){gG.fillStyle(0x26354a,.9).fillCircle(p.x,p.y,24);gG.lineStyle(2,0xbfe6ff,.8).strokeCircle(p.x,p.y,20+Math.sin(t*5)*2);gA.lineStyle(1,0xffffff,.35).lineBetween(p.x,p.y-50,p.x,p.y+8)}}
function buildSkyforge(A){
  deck(A,110,90,430,270);deck(A,1160,640,430,270);deck(A,690,155,300,76,0,180,0);deck(A,710,760,280,76,0,170,3.14);
  A.lifts.push({x:210,y:205},{x:1490,y:790});A.lava.push({x:760,y:400,rx:180,ry:92,e:1,cool:0},{x:1040,y:600,rx:150,ry:76,e:1,cool:0});
  for(const q of [["crate",620,310],["barrel",850,500],["barrel",1050,480],["boulder",560,700],["pillar",850,170],["pillar",850,830]])addProp(A,q[0],q[1],q[2],0);
  for(const q of [["crate",290,190],["barrel",420,260],["crate",1320,730],["barrel",1450,820]])addProp(A,q[0],q[1],q[2],1);
  A.fixed=[["gravityCore",320,180,1],["gravityCore",1380,780,1]];A.fixRe=35;A.spawn=[[120,500],[1580,500]];A.envHook=movingArenaEnv;A.extra=movingArenaFx;A.visFn=(o,v)=>(o.lv||0)===(v.lv||0);A.noItem=(x,y,lv)=>lv===1&&!deckAt(A,x,y,G?G.t:0);A.itemSpot=R=>R()<.35?[320,180,1]:[100+R()*1500,120+R()*760,0];A.thumbExtra=g=>{g.fillStyle="#596879";for(const p of A.platforms)g.fillRect(p.bx/2,p.by/2,p.w/2,p.h/2)}}
function buildTitanBack(A){
  deck(A,160,120,460,250);deck(A,1140,690,460,250);deck(A,720,430,320,110,220,0,0);deck(A,720,610,320,100,180,0,3.14);
  A.lifts.push({x:270,y:220},{x:1490,y:810});A.water.push({x:0,y:0,w:W,h:105},{x:0,y:H-105,w:W,h:105});A.bog.push({x:880,y:530,rx:130,ry:76,e:1});
  for(const q of [["boulder",540,520],["boulder",1220,540],["log",700,300],["log",1060,760],["urn",880,250],["urn",880,840]])addProp(A,q[0],q[1],q[2],0);
  for(const q of [["pillar",320,210],["urn",490,250],["pillar",1440,800],["urn",1270,760]])addProp(A,q[0],q[1],q[2],1);
  A.fixed=[["phaseDrill",390,210,1],["phaseDrill",1370,820,1]];A.fixRe=42;A.spawn=[[130,530],[1630,530]];A.tilt=1;A.envHook=movingArenaEnv;A.extra=movingArenaFx;A.visFn=(o,v)=>(o.lv||0)===(v.lv||0);A.noItem=(x,y,lv)=>lv===1&&!deckAt(A,x,y,G?G.t:0);A.itemSpot=R=>R()<.3?[390,210,1]:[120+R()*1520,140+R()*780,0];A.thumbExtra=g=>{g.fillStyle="#8b7358";for(const p of A.platforms)g.fillRect(p.bx/2,p.by/2,p.w/2,p.h/2)}}
/* ================= terrain painter =================
   The ground is painted once per match into a half-resolution canvas (1 canvas pixel = 2 world pixels),
   pixel by pixel with value noise, then decorated with small hand-made stamps. Terrain regions (water, lava,
   ice, sand pits, bog, spring, bridges) are painted into the same canvas; the view only animates on top. */
const hx3=c=>[c>>16&255,c>>8&255,c&255];
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const shade=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const C3={};const cc=h=>C3[h]||(C3[h]=hx3(h));
function nz(x,y,s){return vnoise(x,y,s)}
const GROUND={
  stadium(x,y,s){const tx=Math.floor(x/24),ty=Math.floor(y/24),ix=x-tx*24,iy=y-ty*24;if(ix===0||iy===0)return cc(0x2a1c33);
    let c=((tx+ty)&1)?cc(0x4b2f52):cc(0x45305a);c=shade(c,.92+hsh(tx,ty,s)*.16);if(ix===1||iy===1)c=shade(c,1.18);if(ix===23||iy===23)c=shade(c,.82);
    const h=hsh(x,y,s);if(h>.93)c=shade(c,1.12);else if(h<.05)c=shade(c,.86);if(Math.abs(nz(x/9,y/9,s+3)-.5)<.012&&hsh(tx,ty,s+9)>.6)c=cc(0x2a1c33);return c},
  grass(x,y,s,a,b){const n=nz(x/34,y/34,s),m=nz(x/9,y/9,s+1);let c=mixc(cc(a),cc(b),clamp(n*1.3-.15,0,1));c=shade(c,.9+m*.2);
    const h=hsh(x,y,s);if(h>.9)c=shade(c,1.22);else if(h<.08)c=shade(c,.78);if(hsh(x>>1,y,s+7)>.97&&hsh(x,y+1,s)>.5)c=shade(c,1.3);return c},
  forest(x,y,s){const py=GROUND.pathY(x,s);if(Math.abs(y-py)<6+nz(x/10,1,s)*4){const h=hsh(x,y,s);return h>.93?cc(0xb8a07a):h<.1?cc(0x5f4a2e):shade(cc(0x8a6a3e),.9+nz(x/5,y/5,s)*.2)}
    return GROUND.grass(x,y,s,0x2a7234,0x3f9a4a)},
  pathY(x,s){return H/4+Math.sin(x/46+s)*H/9+Math.sin(x/17)*4},
  river(x,y,s){return GROUND.grass(x,y,s,0x6f9844,0x92b85a)},
  volcano(x,y,s){const n=nz(x/26,y/26,s),m=nz(x/7,y/7,s+1);let c=mixc(cc(0x2e2528),cc(0x463a3e),n);c=shade(c,.88+m*.24);
    const cr=Math.abs(nz(x/15,y/15,s+2)-.5);if(cr<.011)return cc(0xff7a2a);if(cr<.022)return cc(0x8a2a10);const h=hsh(x,y,s);if(h>.95)return cc(0x6a5e62);if(h<.02)return cc(0xd05020);return c},
  ice(x,y,s){const n=nz(x/30,y/30,s),m=nz(x/8,y/8,s+1);let c=mixc(cc(0xd2e4f2),cc(0xf4fbff),n);c=shade(c,.94+m*.08);
    if(Math.sin((x+y*.6)/7+n*6)>.96)c=cc(0xc0d8ec);const h=hsh(x,y,s);if(h>.985)return cc(0xffffff);if(h<.03)return cc(0xb4d0e6);return c},
  desert(x,y,s){const n=nz(x/40,y/40,s),d=Math.sin((x*.8+y*.35+n*60)/9);let c=mixc(cc(0xc89c56),cc(0xe6c684),.5+d*.35);c=shade(c,.95+n*.1);
    if(d>.93)c=cc(0xf0d69a);if(d<-.95)c=cc(0xb48a48);const h=hsh(x,y,s);if(h>.97)return cc(0xa87c42);if(h<.02)return cc(0xf6e2b0);return c},
  ruins(x,y,s){const ox=(Math.floor(y/14)&1)*9,tx=Math.floor((x+ox)/18),ty=Math.floor(y/14),ix=(x+ox)-tx*18,iy=y-ty*14;const moss=nz(x/22,y/22,s)>.6;
    if(ix===0||iy===0)return moss?cc(0x3f6a3a):cc(0x3e463e);let c=mixc(cc(0x626c62),cc(0x7c8878),hsh(tx,ty,s));c=shade(c,.9+nz(x/4,y/4,s+1)*.2);
    if(ix===1||iy===1)c=shade(c,1.12);if(moss&&hsh(x,y,s)>.55)c=mixc(c,cc(0x4f8a44),.6);if(Math.abs(nz(x/8,y/8,s+4)-.5)<.01&&hsh(tx,ty,s+2)>.5)c=cc(0x3e463e);return c},
  swamp(x,y,s){const n=nz(x/28,y/28,s),m=nz(x/7,y/7,s+1);let c=mixc(cc(0x2a3a30),cc(0x465a40),n);c=shade(c,.86+m*.28);
    if(nz(x/12,y/12,s+5)>.7)c=mixc(c,cc(0x223028),.6);const h=hsh(x,y,s);if(h>.94)return cc(0x5f7a44);if(h<.04)return cc(0x1e2a22);return c}};
/* region painters write into an ImageData through set(x,y,rgb); x,y are canvas pixels */
function paintRegion(set,kind,l,s){const ell=!!l.e;const x0=Math.floor((ell?l.x-l.rx:l.x)/2)-4,y0=Math.floor((ell?l.y-l.ry:l.y)/2)-4,x1=Math.ceil((ell?l.x+l.rx:l.x+l.w)/2)+4,y1=Math.ceil((ell?l.y+l.ry:l.y+l.h)/2)+4;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const wx=x*2+1,wy=y*2+1;let e;
    if(ell){const a=(wx-l.x)/l.rx,b=(wy-l.y)/l.ry,q=Math.sqrt(a*a+b*b);e=(1-q)*Math.min(l.rx,l.ry)/2}else e=Math.min(wx-l.x,l.x+l.w-wx,wy-l.y,l.y+l.h-wy)/2;
    const wob=(nz(x/6,y/6,s+11)-.5)*3;e+=wob;if(e<-4)continue;const c=REGION[kind](e,x,y,s,l);if(c)set(x,y,c)}}
const REGION={
  water(e,x,y,s){if(e<-1.5)return hsh(x,y,s)>.5?cc(0xc8b27a):cc(0xb09a62);if(e<0)return cc(0x7a6a4a);if(e<1)return cc(0xe8f8ff);
    const dep=clamp(e/14,0,1);let c=mixc(cc(0x5ab4f0),cc(0x1c56a8),dep);if(Math.sin(y*.42+nz(x/9,y/18,s)*7)>.86)c=mixc(c,cc(0x9ad4ff),.6);if(hsh(x,y,s)>.992)c=cc(0xffffff);return c},
  lava(e,x,y,s){if(e<-1)return hsh(x,y,s)>.5?cc(0x3a2a2a):cc(0x2a1a1a);if(e<1)return cc(0x6a2010);const dep=clamp(e/10,0,1),pl=nz(x/5,y/5,s+21);
    if(pl>.64&&e>2)return pl>.7?cc(0x4a1a10):cc(0xb8400e);return dep>.7?cc(0xffe070):dep>.4?cc(0xffa030):mixc(cc(0xd8400a),cc(0xff7a1a),dep*2)},
  ice(e,x,y,s){if(e<-1)return null;if(e<1)return cc(0x8fb8d8);let c=mixc(cc(0xbfe6fa),cc(0xe6f7ff),clamp(1-(x+y)%97/97,0,1)*.4+nz(x/10,y/10,s)*.4);
    const cr=Math.abs(nz(x/11,y/11,s+31)-.5);if(cr<.012)return cc(0xffffff);if(cr<.02)return cc(0x9fcbe8);if(hsh(x,y,s)>.99)return cc(0xffffff);return c},
  sand(e,x,y,s,l){if(e<-1)return null;if(e<1)return cc(0xa8824a);const q=Math.hypot((x*2-l.x)/l.rx,(y*2-l.y)/l.ry);if(q<.14)return cc(0x4a3418);if(q<.2)return cc(0x6f5228);
    return Math.sin(q*26-nz(x/5,y/5,s)*2)>.4?cc(0xb08848):cc(0xc8a05a)},
  bog(e,x,y,s){if(e<-1)return null;if(e<1.5)return cc(0x2e2440);let c=mixc(cc(0x4a3268),cc(0x63448a),nz(x/7,y/7,s+41));const al=nz(x/9,y/9,s+42);if(al>.62)c=mixc(c,cc(0x6fae5a),.7);
    if(hsh(x,y,s)>.985)return cc(0xb8a0e0);return c},
  spring(e,x,y,s){if(e<-1)return null;if(e<4){const b=((Math.atan2(y*2-0,x*2)*8)|0);return hsh(Math.floor(e),b,s)>.5?cc(0x8a8f96):cc(0x6a6f76)}
    const dep=clamp((e-4)/10,0,1);let c=mixc(cc(0x4fd8c8),cc(0x1f8a8a),dep);if(hsh(x,y,s)>.98)c=cc(0xe8fffa);return c},
  bridge(e,x,y,s,l){if(e<0)return null;const vert=l.w<l.h,u=vert?y:x;if(e<1.5)return cc(0x3b2412);const pl=Math.floor(u/5);if(u%5===0)return cc(0x5a3a1c);
    let c=hsh(pl,0,s)>.5?cc(0xa8743c):cc(0x96683a);if(hsh(x,y,s)>.9)c=shade(c,.85);if(e<3)c=shade(c,1.15);return c}};
GROUND.skyforge=(x,y,s)=>{const tx=Math.floor(x/18),ty=Math.floor(y/18),ix=x%18,iy=y%18,n=nz(x/22,y/22,s);let c=mixc(cc(0x313746),cc(0x566070),n);if(ix===0||iy===0)c=cc(0x1e2430);if(ix===1||iy===1)c=shade(c,1.28);if((tx+ty)%7===0&&ix>5&&ix<12&&iy>7&&iy<11)c=cc(0xd8a83e);return c};
GROUND.titanback=(x,y,s)=>{const n=nz(x/38,y/38,s),m=nz(x/9,y/9,s+2);let c=mixc(cc(0x665442),cc(0xa88a68),n);c=shade(c,.88+m*.2);if(Math.abs(nz(x/15,y/11,s+4)-.5)<.018)c=cc(0x3e5360);if(hsh(x,y,s)>.975)c=cc(0xc8b28e);return c};
const DECOR={
  forest:[["flower",90],["tuft",260],["mush",26],["leaf",120],["pebble",40]],river:[["flower",70],["tuft",240],["pebble",80],["reed",40]],
  stadium:[["scuff",80]],volcano:[["ember",90],["bone",8],["pebble",120]],ice:[["foot",40],["pebble",40],["spark",70]],
  desert:[["bone",14],["pebble",120],["twig",60],["crack",20]],ruins:[["tuft",120],["rubble",70],["flower",30]],swamp:[["lily",50],["tuft",160],["mush",40],["reed",60]],
  skyforge:[["spark",150],["scuff",120],["ember",55]],titanback:[["rubble",100],["crack",70],["bone",18],["spark",40]]};
const STAMP={
  flower(c,x,y,R){const col=["#ffe680","#ff9ab0","#ffffff","#c8a0ff"][(R()*4)|0];c.fillStyle="#2a6a2a";c.fillRect(x,y+1,1,2);c.fillStyle=col;c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3);c.fillStyle="#ffd23e";c.fillRect(x,y,1,1)},
  tuft(c,x,y){c.fillStyle="#1e5a26";c.fillRect(x,y,1,2);c.fillRect(x+2,y,1,2);c.fillStyle="#5cb85a";c.fillRect(x+1,y-1,1,3);c.fillRect(x-1,y+1,1,1);c.fillRect(x+3,y+1,1,1)},
  mush(c,x,y,R){const r=R()>.5;c.fillStyle="#f4ecd8";c.fillRect(x,y,1,2);c.fillStyle=r?"#d83a2a":"#c8a060";c.fillRect(x-1,y-1,3,1);c.fillRect(x-2,y,1,0);c.fillStyle="#fff";if(r)c.fillRect(x,y-1,1,1)},
  leaf(c,x,y,R){c.fillStyle=["#c8742a","#e0a030","#8a4a1a"][(R()*3)|0];c.fillRect(x,y,2,1)},
  pebble(c,x,y,R){c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x,y+1,3,1);c.fillStyle=R()>.5?"#8a858c":"#a8a2a8";c.fillRect(x,y,2,1);c.fillStyle="#c8c2c8";c.fillRect(x,y,1,1)},
  reed(c,x,y){c.fillStyle="#3f7a3a";c.fillRect(x,y-3,1,4);c.fillRect(x+2,y-2,1,3);c.fillStyle="#7a4a2a";c.fillRect(x,y-4,1,2)},
  scuff(c,x,y,R){c.fillStyle="rgba(255,255,255,.08)";c.fillRect(x,y,3+((R()*5)|0),1)},
  ember(c,x,y){c.fillStyle="#ff9a3a";c.fillRect(x,y,1,1);c.fillStyle="rgba(255,120,40,.35)";c.fillRect(x-1,y,3,1)},
  bone(c,x,y){c.fillStyle="#efe6cc";c.fillRect(x,y,5,1);c.fillRect(x-1,y-1,1,1);c.fillRect(x-1,y+1,1,1);c.fillRect(x+5,y-1,1,1);c.fillRect(x+5,y+1,1,1)},
  foot(c,x,y){c.fillStyle="rgba(120,150,190,.35)";for(let i=0;i<4;i++){c.fillRect(x+i*4,y+(i%2)*3,2,1)}},
  spark(c,x,y){c.fillStyle="#ffffff";c.fillRect(x,y,1,1);c.fillStyle="rgba(255,255,255,.5)";c.fillRect(x-1,y,3,1)},
  twig(c,x,y){c.fillStyle="#8a6a3a";c.fillRect(x,y,4,1);c.fillRect(x+2,y-1,1,1)},
  crack(c,x,y,R){c.fillStyle="rgba(90,60,30,.5)";let px=x,py=y;for(let i=0;i<8;i++){c.fillRect(px,py,1,1);px+=R()>.5?1:0;py+=R()>.3?1:-1;px++}},
  rubble(c,x,y,R){c.fillStyle="#565e56";c.fillRect(x,y,3,2);c.fillStyle="#8a948a";c.fillRect(x,y,2,1);if(R()>.5){c.fillStyle="#6a746a";c.fillRect(x+4,y+1,2,1)}},
  lily(c,x,y){c.fillStyle="#3f8a3a";c.fillRect(x-1,y,4,2);c.fillRect(x,y-1,2,1);c.fillStyle="#ff9ab0";c.fillRect(x+1,y,1,1)}};
function inAnyRegion(A,wx,wy,pad){const t=l=>l.e?inEll(l,wx,wy,pad):inRect(l,wx,wy,pad);return A.water.some(t)||A.lava.some(t)||A.ice.some(t)||A.sand.some(t)||A.bog.some(t)||A.bridges.some(t)||A.walls.some(t)}
function arenaSeed(key){let s=7;for(const ch of key)s=(s*31+ch.charCodeAt(0))%9973;return s}
function paintArena(A,c){c=c||bgx;const w=Math.ceil(W/2),h=Math.ceil(H/2);if(c.canvas.width!==w||c.canvas.height!==h){c.canvas.width=w;c.canvas.height=h}
  if(A.key==="city"&&typeof paintCity==="function")return paintCity(A,c);if(A.key==="moba"&&typeof paintMoba==="function")return paintMoba(A,c);
  const s=arenaSeed(A.key),img=c.createImageData(w,h),d=img.data,gf=GROUND[A.key]||GROUND.ruins;
  const set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)set(x,y,gf(x,y,s));
  paintRegions(A,set,s);
  /* border: darker band and a painted boundary line */
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const e=Math.min(x,y,w-1-x,h-1-y);if(e<6){const i=(y*w+x)*4,k=.55+e*.07;d[i]*=k;d[i+1]*=k;d[i+2]*=k}}
  c.putImageData(img,0,0);
  const R=seeded("decor"+A.key);for(const [k,n] of DECOR[A.key]||[])for(let i=0;i<n;i++){const x=(R()*(w-16)+8)|0,y=(R()*(h-16)+8)|0;if(inAnyRegion(A,x*2,y*2,10))continue;STAMP[k](c,x,y,R)}
  const line=A.key==="stadium"?"#d9a441":A.key==="ruins"?"#3e463e":null;
  if(line){c.fillStyle=line;const dot=(x,y)=>{if(hsh(x,y,s)>.12)c.fillRect(x|0,y|0,1,1)};for(let x=8;x<w-8;x++){dot(x,8);dot(x,h-9)}for(let y=8;y<h-8;y++){dot(8,y);dot(w-9,y)}
    if(A.key==="stadium"){for(let y=8;y<h-8;y++)dot(w/2,y);for(let a=0;a<6.283;a+=.008){dot(w/2+Math.cos(a)*62,h/2+Math.sin(a)*62);dot(w/2+Math.cos(a)*58,h/2+Math.sin(a)*58)}
      c.fillStyle="rgba(217,164,65,.18)";c.beginPath();c.arc(w/2,h/2,56,0,7);c.fill()}}}
function paintRegions(A,set,s){for(const l of A.water)paintRegion(set,"water",l,s);for(const b of A.bridges)paintRegion(set,"bridge",b,s);for(const l of A.lava)paintRegion(set,"lava",l,s);
  for(const l of A.ice)paintRegion(set,"ice",l,s);for(const l of A.sand)paintRegion(set,"sand",l,s);for(const l of A.bog)paintRegion(set,"bog",l,s);if(A.spring){const p=A.spring;paintRegion(set,"spring",{x:p.x,y:p.y,rx:p.r+8,ry:p.r+8,e:1},s)}}
/* repaint one region after it changes (ice melting into water) */
function repaintRegion(kind,l){const c=bgx,w=c.canvas.width,h=c.canvas.height,img=c.getImageData(0,0,w,h),d=img.data;
  const set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};paintRegion(set,kind,l,arenaSeed(G.A.key));
  for(const b of G.A.bridges)paintRegion(set,"bridge",b,arenaSeed(G.A.key));c.putImageData(img,0,0);BGD=true}
/* textured stone wall block, drawn at half resolution: top face, brick front, moss */
function wallCanvas(wl,style){const w=Math.ceil(wl.w/2),th=Math.ceil(wl.h/2),fh=8,c=document.createElement("canvas");c.width=w;c.height=th+fh+3;const g=c.getContext("2d");const s=wl.x*7+wl.y;
  const st=style||{top:[0x8f8a92,0x78737c],front:[0x5a565e,0x4a464e],mortar:0x3a363e,moss:0x4cae52};
  const img=g.createImageData(c.width,c.height),d=img.data,set=(x,y,col,a)=>{const i=(y*c.width+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=a==null?255:a};
  for(let y=0;y<c.height;y++)for(let x=0;x<w;x++){
    if(y>=th+fh){set(x,y,[0,0,0],y===th+fh?90:50);continue}
    if(y<th){const bx=Math.floor((x+(Math.floor(y/5)&1)*4)/8),by=Math.floor(y/5),ix=(x+(Math.floor(y/5)&1)*4)%8,iy=y%5;let col=hsh(bx,by,s)>.5?cc(st.top[0]):cc(st.top[1]);
      if(ix===0||iy===0)col=shade(col,.8);if(y===0||x===0)col=shade(col,1.2);if(x===w-1)col=shade(col,.7);if(nz(x/5,y/5,s)>.66&&hsh(x,y,s)>.35)col=cc(st.moss);set(x,y,col);continue}
    const yy=y-th,bx=Math.floor((x+(Math.floor(yy/4)&1)*5)/10),ix=(x+(Math.floor(yy/4)&1)*5)%10,iy=yy%4;let col=hsh(bx,Math.floor(yy/4),s+1)>.5?cc(st.front[0]):cc(st.front[1]);
    if(ix===0||iy===0)col=cc(st.mortar);if(yy===0)col=shade(col,1.25);if(nz(x/4,yy/3,s+3)>.7&&yy<4)col=cc(st.moss);set(x,y,col)}
  g.putImageData(img,0,0);return c}
/* ================= City arena =================
   Roads, a park, a plaza and six two-floor buildings. Every fighter has a level: 0 = street and ground floors,
   1 = upper floors and the glass skybridges. Stairs inside each building switch level. Attacks only land on
   the same level; roofs hide whoever is inside a building from people outside it. */
const CITY={T:14,DOOR:76,BRW:56};
function buildCity(A){const T=CITY.T;
  const B=[{x:50,y:50,w:430,h:262,doors:[["b",130],["r",190]],sty:0},{x:700,y:40,w:500,h:282,doors:[["b",250],["l",210],["r",210]],sty:1},{x:1420,y:50,w:430,h:262,doors:[["b",300],["l",190]],sty:2}];
  const mir=b=>({x:W-b.x-b.w,y:H-b.y-b.h,w:b.w,h:b.h,doors:b.doors.map(([s,p])=>[{t:"b",b:"t",l:"r",r:"l"}[s],(s==="t"||s==="b"?b.w:b.h)-p]),sty:b.sty+3});
  A.blds=[...B,...B.map(mir)];A.blds.forEach((b,i)=>{b.i=i;b.stair={x:b.x+(i%3===1?b.w-62:58),y:b.y+70}});
  const SK=[{x:480,y:118,w:220,h:CITY.BRW},{x:1200,y:118,w:220,h:CITY.BRW}];A.sky=[...SK,...SK.map(s=>({x:W-s.x-s.w,y:H-s.y-s.h,w:s.w,h:s.h}))];
  A.sky.forEach((s,i)=>{s.i=i;s.hp=12;s.max=12;s.dead=false});
  /* walls: outline with gaps for doors (level 0) and for bridges (level 1) */
  const seg=(lv,b,side,gaps)=>{const horiz=side==="t"||side==="b",len=horiz?b.w:b.h;let cur=0;const out=[];for(const [g0,g1] of gaps.sort((p,q)=>p[0]-q[0])){if(g0>cur)out.push([cur,g0]);cur=Math.max(cur,g1)}if(cur<len)out.push([cur,len]);
    for(const [s0,s1] of out){if(s1-s0<2)continue;if(side==="t")A.walls.push({x:b.x+s0,y:b.y,w:s1-s0,h:T,lv});else if(side==="b")A.walls.push({x:b.x+s0,y:b.y+b.h-T,w:s1-s0,h:T,lv});
      else if(side==="l")A.walls.push({x:b.x,y:b.y+s0,w:T,h:s1-s0,lv});else A.walls.push({x:b.x+b.w-T,y:b.y+s0,w:T,h:s1-s0,lv})}};
  for(const b of A.blds){for(const side of ["t","b","l","r"]){seg(0,b,side,b.doors.filter(d=>d[0]===side).map(d=>[d[1]-CITY.DOOR/2,d[1]+CITY.DOOR/2]));
      const bg=[];for(const s of A.sky){if(s.y<b.y||s.y+s.h>b.y+b.h)continue;if(side==="r"&&Math.abs(s.x-(b.x+b.w))<4)bg.push([s.y-b.y,s.y-b.y+s.h]);if(side==="l"&&Math.abs(s.x+s.w-b.x)<4)bg.push([s.y-b.y,s.y-b.y+s.h])}seg(1,b,side,bg)}}
  for(const s of A.sky){A.walls.push({x:s.x,y:s.y-6,w:s.w,h:6,lv:1,nodraw:1,sky:s},{x:s.x,y:s.y+s.h,w:s.w,h:6,lv:1,nodraw:1,sky:s})}
  for(const w of A.walls)if(!w.nodraw)w.style=w.lv?CITYWALL[1]:CITYWALL[0];
  const add=(lv,k,x,y)=>{addProp(A,k,x,y,lv);addProp(A,k,W-x,H-y,lv)};
  /* themed interiors (office / police station / house), laid out relative to each building and mirrored for fairness.
     props [lv,kind,rx,ry] · walls [lv,rx,ry,w,h,bars] · rooms (painted floors) [rx,ry,w,h,floor] · fixed items [lv,item,rx,ry] */
  const THEME=[
    {n:"OFFICE",props:[[0,"locker",196,46],[0,"locker",230,46],[0,"locker",264,46],[0,"locker",298,46],[0,"shelf",140,40],[0,"desk",220,124],[0,"desk",310,124],[0,"desk",220,182],[0,"desk",310,182],
       [0,"cooler",400,92],[0,"plant",30,244],[0,"plant",404,252],
       [1,"desk",238,140],[1,"desk",290,140],[1,"sofa",150,226],[1,"locker",330,46],[1,"locker",364,46],[1,"shelf",400,224],[1,"plant",30,244],[1,"cooler",196,46]],
     walls:[],rooms:[],fixed:[[0,"potS",380,62],[0,"energy",265,152],[1,"hourglass",264,198],[1,"fruit",388,160]]},
    {n:"POLICE",props:[[0,"bench",58,40],[0,"bench",154,40],[0,"counter",246,152],[0,"counter",298,152],[0,"shelf",262,40],[0,"vend",318,40],[0,"plant",180,252],[0,"cone",362,160],[0,"cone",362,258],
       [1,"shelf",80,44],[1,"shelf",130,44],[1,"locker",184,48],[1,"desk",262,152],[1,"desk",314,152],[1,"sofa",150,232],[1,"plant",468,254],[1,"cooler",362,46]],
     walls:[[0,104,14,8,98,1],[0,196,14,8,98,1],[0,14,104,26,8,1],[0,80,104,60,8,1],[0,180,104,24,8,1],[0,382,136,104,10]],
     rooms:[[14,14,190,98,"concrete"],[352,146,134,122,"asphalt"]],
     fixed:[[0,"mystery",58,78],[0,"ghost",154,78],[0,"car",408,206],[0,"car",458,206],[1,"pistol",104,92],[1,"shotgun",160,100]]},
    {n:"HOME",props:[[0,"tub",364,50],[0,"toilet",314,88],[0,"sink",398,88],[0,"fridge",120,44],[0,"counter",170,42],[0,"counter",222,42],[0,"tv",200,150],[0,"sofa",200,226],[0,"plant",30,246],[0,"plant",404,250],
       [1,"bed",322,84],[1,"bed",386,84],[1,"wardrobe",160,50],[1,"wardrobe",404,236],[1,"tv",120,176],[1,"sofa",120,240],[1,"plant",230,46]],
     walls:[[0,292,14,10,98],[0,292,104,38,10],[0,382,104,34,10],[1,252,128,10,120]],
     rooms:[[302,14,114,90,"tile"],[100,14,180,70,"tile2"]],
     fixed:[[0,"potS",356,90],[0,"fruit",196,84],[1,"heart",354,140],[1,"bubble",330,222]]}];
  A.fixed=[];const fx=(k,x,y,lv)=>{A.fixed.push([k,x,y,lv],[k,W-x,H-y,lv])};
  for(let i=0;i<3;i++){const b=A.blds[i],m=A.blds[i+3],th=THEME[i];b.theme=m.theme=th.n;b.rooms=[];m.rooms=[];
    for(const [lv,k,rx,ry] of th.props)add(lv,k,b.x+rx,b.y+ry);
    for(const [lv,rx,ry,w,h,bars] of th.walls){const st=lv?CITYWALL[1]:CITYWALL[2],o={x:b.x+rx,y:b.y+ry,w,h,lv,style:st,inner:1,bars:bars||0};A.walls.push(o,{x:W-o.x-w,y:H-o.y-h,w,h,lv,style:st,inner:1,bars:bars||0})}
    for(const [rx,ry,w,h,f] of th.rooms){b.rooms.push({x:b.x+rx,y:b.y+ry,w,h,f});m.rooms.push({x:m.x+m.w-rx-w,y:m.y+m.h-ry-h,w,h,f})}
    for(const [lv,k,rx,ry] of th.fixed)fx(k,b.x+rx,b.y+ry,lv)}
  const street=[["car",600,300],["car",470,410],["bin",520,330],["hydrant",690,340],["lamp",530,470],["lamp",1370,470],["bench",260,560],["bench",380,760],["bin",470,780],["vend",700,520],["cone",600,560],["cone",610,610],
    ["car",1040,445],["car",820,400],["lamp",1030,340],["bench",880,700],["tree",170,600],["tree",420,660],["bush",280,700],["bush",120,760],["car",1300,620],["hydrant",1215,500],["bin",1210,760],["cone",570,880]];
  for(const [k,x,y] of street)add(0,k,x,y);
  A.water.push({x:W/2,y:H/2,rx:70,ry:44,e:1,cool:0,fountain:1});
  A.spawn=[[300,640],[W-300,H-640]];A.wallStyle=CITYWALL[0];
  A.visFn=cityVis;A.extra=()=>cityViewUpd(A);A.envHook=cityStairs;A.itemSpot=citySpot;A.noItem=(x,y,lv)=>lv===1?!onUpper(x,y):false;A.botGoal=cityBotGoal}
const CITYWALL=[{top:[0xc8c0b4,0xb8b0a4],front:[0x9a8e80,0x8a7e70],mortar:0x6a6058,moss:0xa89c8c},{top:[0xd8d4cc,0xc8c4bc],front:[0xa8a49c,0x98948c],mortar:0x787470,moss:0xb8b4ac},
  {top:[0xeee6d6,0xe2dac8],front:[0xc8bca4,0xbcb098],mortar:0xa09480,moss:0xe2dac8}];
const bldAt=(x,y)=>G.A.blds.find(b=>x>b.x+2&&x<b.x+b.w-2&&y>b.y+2&&y<b.y+b.h-2);
const onUpper=(x,y)=>G.A.blds.some(b=>x>b.x+CITY.T&&x<b.x+b.w-CITY.T&&y>b.y+CITY.T&&y<b.y+b.h-CITY.T)||G.A.sky.some(s=>!s.dead&&x>=s.x-4&&x<=s.x+s.w+4&&y>=s.y&&y<=s.y+s.h);
/* can viewer v see thing o (fighter, minion, item, prop) */
function cityVis(o,v){const bo=bldAt(o.x,o.y),lv=o.lv||0;if(!bo)return true;if((v.lv||0)===1)return lv===1;return lv===0&&bldAt(v.x,v.y)===bo}
function cityStairs(f,dt){const A=G.A;if(f.lv&&!onUpper(f.x,f.y)){f.lv=0;f.hp=Math.max(0,f.hp-22);f.stun=Math.max(f.stun,.55);f.kx+=rnd(-90,90);f.ky+=rnd(-90,90);pop(f.x,f.y-55,"สะพานพัง!","#ff9a8a",1);FX.boom(f.x,f.y,"metal",38);G.shake=Math.max(G.shake,7);if(f===G.me)VIEW.lvT=.5}
  let on=null;for(const b of A.blds)if(Math.hypot(f.x-b.stair.x,f.y-b.stair.y)<20)on=b;
  if(!on){f.stairLock=0;return}if(f.stairLock)return;f.stairLock=1;f.lv=f.lv?0:1;f.chg=null;FX.burst(f.x,f.y-14,"#ffffff",14,120,.4);SFX.play("dash");if(f===G.me)VIEW.lvT=.5}
function citySpot(R){const r=R();if(r<.35){const b=G.A.blds[(R()*G.A.blds.length)|0];return[b.x+40+R()*(b.w-80),b.y+40+R()*(b.h-80),R()<.5?1:0]}return[FR+60+R()*(W-120),FR+60+R()*(H-120),0]}
function cityBotGoal(f,o){const A=G.A,bf=bldAt(f.x,f.y),bo=bldAt(o.x,o.y),lf=f.lv||0,lo=o.lv||0;
  const door=b=>{let best=null,bd=1e9;for(const [s,p] of b.doors){const x=s==="l"?b.x-20:s==="r"?b.x+b.w+20:b.x+p,y=s==="t"?b.y-20:s==="b"?b.y+b.h+20:b.y+p,ix=s==="l"?b.x+30:s==="r"?b.x+b.w-30:x,iy=s==="t"?b.y+30:s==="b"?b.y+b.h-30:y;
    const d=Math.hypot(x-f.x,y-f.y);if(d<bd){bd=d;best={out:[x,y],inn:[ix,iy]}}}return best};
  if(lf===1){if(lo===1)return null;const b=bf||A.blds.reduce((m,b)=>Math.hypot(b.stair.x-f.x,b.stair.y-f.y)<Math.hypot(m.stair.x-f.x,m.stair.y-f.y)?b:m);return[b.stair.x,b.stair.y]}
  if(lo===1){if(bf)return[bf.stair.x,bf.stair.y];const b=A.blds.reduce((m,b)=>Math.hypot(b.x+b.w/2-f.x,b.y+b.h/2-f.y)<Math.hypot(m.x+m.w/2-f.x,m.y+m.h/2-f.y)?b:m),d=door(b);return Math.hypot(d.out[0]-f.x,d.out[1]-f.y)<30?d.inn:d.out}
  if(bf&&bf!==bo){const d=door(bf);return Math.hypot(d.inn[0]-f.x,d.inn[1]-f.y)<30?d.out:d.inn}
  if(bo&&bf!==bo){const d=door(bo);return Math.hypot(d.out[0]-f.x,d.out[1]-f.y)<30?d.inn:d.out}return null}
/* ---------- painting ---------- */
const ROADS={h:[[360,480],[820,940]],v:[[540,660],[1240,1360]]};
function paintCity(A,c){const w=Math.ceil(W/2),h=Math.ceil(H/2),s=31,img=c.createImageData(w,h),d=img.data;
  const set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};
  const inR=(v,r)=>v>=r[0]/2&&v<r[1]/2,rd=(x,y)=>ROADS.h.some(r=>inR(y,r))||ROADS.v.some(r=>inR(x,r));
  const park=(x,y)=>(x<270&&y>250&&y<400)||(x>w-270&&y>250&&y<400),plaza=(x,y)=>x>=340&&x<610&&y>=250&&y<400;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let col;
    if(rd(x,y)){const n=nz(x/6,y/6,s);col=shade(cc(0x4a4a52),.9+n*.18);if(hsh(x,y,s)>.9)col=shade(col,1.2);
      for(const r of ROADS.h)if(inR(y,r)){const m=(r[0]+r[1])/4;if(Math.abs(y-m)<.6&&(x%14)<8&&!ROADS.v.some(q=>inR(x,q)))col=cc(0xf5d040);if(y===r[0]/2+2||y===r[1]/2-3)col=cc(0xe8e8e8)}
      for(const r of ROADS.v)if(inR(x,r)){const m=(r[0]+r[1])/4;if(Math.abs(x-m)<.6&&(y%14)<8&&!ROADS.h.some(q=>inR(y,q)))col=cc(0xf5d040);if(x===r[0]/2+2||x===r[1]/2-3)col=cc(0xe8e8e8)}
      for(const rh of ROADS.h)for(const rv of ROADS.v){const cx0=rv[0]/2,cx1=rv[1]/2,cy0=rh[0]/2,cy1=rh[1]/2;
        if(x>=cx0&&x<cx1&&((y>=cy0-12&&y<cy0-2)||(y>=cy1+2&&y<cy1+12))&&(x%6)<3)col=cc(0xf0f0f0);if(y>=cy0&&y<cy1&&((x>=cx0-12&&x<cx0-2)||(x>=cx1+2&&x<cx1+12))&&(y%6)<3)col=cc(0xf0f0f0)}}
    else if(park(x,y)){col=GROUND.grass(x,y,s,0x3a8c45,0x5aae55)}
    else if(plaza(x,y)){const tx=Math.floor(x/10),ty=Math.floor(y/10),ix=x%10,iy=y%10;col=((tx+ty)&1)?cc(0xd8c8a8):cc(0xc8b494);if(ix===0||iy===0)col=cc(0xa89474);col=shade(col,.95+hsh(tx,ty,s)*.1)}
    else{const tx=Math.floor(x/8),ty=Math.floor(y/8),ix=x%8,iy=y%8;col=shade(cc(0xa8a8b0),.92+hsh(tx,ty,s)*.12);if(ix===0||iy===0)col=cc(0x86868e);if(hsh(x,y,s)>.97)col=cc(0x7a7a82);
      const curb=ROADS.h.some(r=>y===r[0]/2-1||y===r[1]/2)||ROADS.v.some(r=>x===r[0]/2-1||x===r[1]/2);if(curb)col=cc(0xe0e0e6)}
    set(x,y,col)}
  /* ground floors */
  const FL=[[0x7a8ca8,0x6a7c98,"carpet"],[0xe8e4dc,0x2a2a32,"check"],[0xb8865a,0xa87444,"wood"]];
  for(const b of A.blds){const st=FL[b.sty%3];for(let y=Math.floor(b.y/2);y<Math.ceil((b.y+b.h)/2);y++)for(let x=Math.floor(b.x/2);x<Math.ceil((b.x+b.w)/2);x++){let col;
      if(st[2]==="wood"){const pl=Math.floor(y/3);col=hsh(pl,Math.floor((x+pl*7)/14),s)>.5?cc(st[0]):cc(st[1]);if(y%3===0)col=shade(col,.82);if((x+pl*7)%14===0)col=shade(col,.75)}
      else if(st[2]==="check"){col=((Math.floor(x/6)+Math.floor(y/6))&1)?cc(st[0]):cc(st[1]);col=shade(col,.94+hsh(x>>1,y>>1,s)*.08)}
      else{col=shade(cc(st[0]),.92+nz(x/3,y/3,s)*.14);if((x+y)%7===0)col=cc(st[1])}set(x,y,col)}
    for(const r of b.rooms||[])for(let y=Math.floor(r.y/2);y<Math.ceil((r.y+r.h)/2);y++)for(let x=Math.floor(r.x/2);x<Math.ceil((r.x+r.w)/2);x++){let col;const lx=x-Math.floor(r.x/2),ly=y-Math.floor(r.y/2);
      if(r.f==="asphalt"){col=shade(cc(0x4e4e56),.9+nz(x/5,y/5,s)*.16);if(lx%25===0&&ly<40)col=cc(0xf5d040);if(ly===0||ly===Math.ceil(r.h/2)-1)col=cc(0xf5d040)}
      else if(r.f==="concrete"){col=shade(cc(0x8a8a90),.9+nz(x/4,y/4,s)*.2);if(hsh(x,y,s)>.95)col=cc(0x6a6a70)}
      else{const t=r.f==="tile"?5:6;col=((Math.floor(lx/t)+Math.floor(ly/t))&1)?cc(r.f==="tile"?0xe8f4fa:0xf0e8d8):cc(r.f==="tile"?0xc8e0ee:0xd8c8b0);if(lx%t===0||ly%t===0)col=cc(r.f==="tile"?0xa8c4d8:0xb8a890)}
      set(x,y,col)}
    for(const [sd,p] of b.doors){const dx=sd==="l"?b.x+16:sd==="r"?b.x+b.w-36:b.x+p-24,dy=sd==="t"?b.y+16:sd==="b"?b.y+b.h-36:b.y+p-24;for(let y=0;y<10;y++)for(let x=0;x<24;x++)set(Math.floor(dx/2)+x,Math.floor(dy/2)+y,(x+y)%2?cc(0x8a3a3a):cc(0x6a2a2a))}
    paintStair(set,b.stair.x,b.stair.y,1)}
  paintRegions(A,set,s);c.putImageData(img,0,0);
  /* entrances: red carpet + yellow chevrons on the street pointing into every door */
  for(const b of A.blds)for(const [sd,p] of b.doors){const hz=sd==="t"||sd==="b",dir=sd==="b"||sd==="r"?1:-1,ox=(sd==="l"?b.x:sd==="r"?b.x+b.w:b.x+p)/2,oy=(sd==="t"?b.y:sd==="b"?b.y+b.h:b.y+p)/2;
    c.fillStyle="#9a2a2a";if(hz)c.fillRect(ox-14,dir>0?oy:oy-22,28,22);else c.fillRect(dir>0?ox:ox-22,oy-14,22,28);
    c.fillStyle="#c84a3a";if(hz)c.fillRect(ox-12,dir>0?oy:oy-22,24,22);else c.fillRect(dir>0?ox:ox-22,oy-12,22,24);
    c.fillStyle="#f5d040";for(let k=0;k<2;k++){const d=6+k*8;for(let j=-5;j<=5;j++){const a=Math.abs(j);if(hz)c.fillRect(ox+j,oy+dir*(d+a)-(dir>0?0:1),1,2);else c.fillRect(ox+dir*(d+a)-(dir>0?0:1),oy+j,2,1)}}}
  /* parking lines, manholes, planters */
  c.fillStyle="#e8e8e8";for(let i=0;i<6;i++){c.fillRect(350+i*22,520,1,30);c.fillRect(w-350-i*22,h-520-30,1,30)}
  for(const [x,y] of [[300,210],[w-300,h-210],[120,420],[w-120,h-420]]){c.fillStyle="#2a2a30";c.beginPath();c.arc(x,y,5,0,7);c.fill();c.fillStyle="#5a5a62";c.fillRect(x-3,y-1,6,1);c.fillRect(x-3,y+1,6,1)}
  const R=seeded("citydecor");for(let i=0;i<120;i++){const x=(R()*w)|0,y=(R()*h)|0;if(park(x,y))STAMP[R()>.5?"flower":"tuft"](c,x,y,R)}}
/* a big hazard-striped stairwell with an arrow (up on the ground floor, down upstairs) */
function paintStair(set,wx,wy,up){const N=30,x0=Math.floor(wx/2)-15,y0=Math.floor(wy/2)-15;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const e=Math.min(x,y,N-1-x,N-1-y);let col;
    if(e<3)col=((x+y)>>2)&1?cc(0xf5c542):cc(0x24222a);else{const step=Math.floor((y-3)/4);col=shade(cc(0xc8c0b0),(up?1.05-step*.07:.65+step*.07));if((y-3)%4===0)col=cc(0x5a524a)}
    const ax=x-15,ay=up?y-8:21-y;if(ay>=0&&ay<14&&(Math.abs(ax)<=ay*.8&&ay<8||Math.abs(ax)<=2&&ay>=8))col=cc(0xffffff);set(x0+x,y0+y,col)}}
/* ================= MOBA arena: three lanes, towers, creep waves, jungle camps, two river bosses =================
   Team 0 = left player, team 1 = right player, team 2 = neutral jungle.
   Ownership: each client simulates the units of its own team (the left client also runs the jungle).
   Damage to a unit is applied by its owner; unit attacks on things owned by the other client travel as events (ue). */
const UK={
  cm:{n:"ครีปดาบ",hp:70,dmg:7,rng:34,sp:74,cd:1,r:12},
  cr:{n:"ครีปเวทย์",hp:46,dmg:8,rng:170,sp:74,cd:1.5,r:11,proj:1},
  tw:{n:"ป้อม",hp:420,dmg:24,dmgU:16,rng:250,cd:1.1,r:22,proj:1,still:1,solid:1},
  bt:{n:"ป้อมฐาน",hp:600,dmg:28,dmgU:18,rng:260,cd:1,r:24,proj:1,still:1,solid:1},
  orb:{n:"ออร์บ",hp:900,dmg:0,rng:0,r:30,still:1,solid:1},
  wolf:{n:"หมาป่า",hp:90,dmg:5,rng:34,sp:120,cd:1,r:12,leash:230,camp:1},
  golem:{n:"โกเลมแดง",hp:190,dmg:8,rng:40,sp:82,cd:1.3,r:16,leash:250,camp:1,buff:"red"},
  spirit:{n:"วิญญาณฟ้า",hp:160,dmg:6,rng:150,sp:88,cd:1.4,r:14,leash:250,camp:1,proj:1,buff:"blue"},
  boss:{n:"มังกรหินโบราณ",hp:800,dmg:15,rng:86,sp:74,cd:2.2,r:30,leash:300,camp:1,aoe:96,buff:"boss",solid:1}};
const UKEYS=Object.keys(UK);
const BUFFS={red:{n:"บัฟแดง: โจมตีแรงขึ้น 25%",t:70,c:"#ff6a5a"},blue:{n:"บัฟฟ้า: คูลดาวน์เร็วขึ้น เกจไม้ตายขึ้นไว",t:70,c:"#7cc4ff"},boss:{n:"พลังมังกรโบราณ: แรงขึ้น 30% เกราะ 25% ฟื้นพลัง",t:90,c:"#f5c542"}};
const LANES={top:[[300,800],[300,260],[2700,260],[2700,800]],mid:[[420,900],[2580,900]],bot:[[300,1000],[300,1540],[2700,1540],[2700,1000]]};
const BASE=[[230,900],[2770,900]];
function buildMoba(A){A.spawn=[[110,900],[2890,900]];A.lanes=LANES;A.respawn=6;A.units=1;
  for(const [y0,y1] of [[0,200],[320,500],[620,840],[960,1180],[1300,1480],[1600,1800]])A.water.push({x:1440,y:y0,w:120,h:y1-y0});
  const nearLane=(x,y,pad)=>Object.values(LANES).some(p=>{for(let i=0;i<p.length-1;i++){const [ax,ay]=p[i],[bx,by]=p[i+1],l2=(bx-ax)**2+(by-ay)**2,t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/l2,0,1);if(Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<pad)return true}return false});
  const CAMPS=[["golem",950,610],["wolf",1230,700],["spirit",950,1190],["wolf",1230,1100]];A.camps=[];
  for(const [k,x,y] of CAMPS){A.camps.push({k,x,y},{k,x:W-x,y:H-y})}A.camps.push({k:"boss",x:1500,y:560},{k:"boss",x:1500,y:1240});
  const R=seeded("mobatrees"),bad=(x,y)=>nearLane(x,y,95)||Math.abs(x-1500)<110||A.camps.some(c=>Math.hypot(c.x-x,c.y-y)<120)||Math.hypot(x-BASE[0][0],y-BASE[0][1])<330||Math.hypot(x-BASE[1][0],y-BASE[1][1])<330||x<60||y<60||x>W-60||y>H-60;
  let n=0;for(let i=0;i<900&&n<95;i++){const x=Math.round(60+R()*(W/2-60)),y=Math.round(60+R()*(H-120));if(bad(x,y)||A.props.some(p=>Math.hypot(p.x-x,p.y-y)<70))continue;const k=R()<.62?"tree":"bush";addProp(A,k,x,y);addProp(A,k,W-x,H-y);n++}
  A.envHook=mobaEnv;A.noItem=(x,y)=>Math.hypot(x-BASE[0][0],y-BASE[0][1])<200||Math.hypot(x-BASE[1][0],y-BASE[1][1])<200;
  /* hand-placed jungle items, restocked 40s after pickup */
  A.fixRe=40;A.fixed=[];for(const [k,x,y] of [["potS",1010,670],["energy",1170,770],["rage",1010,1130],["potS",1170,1030],["mystery",1420,560],["fruit",800,900-260],["boots",800,900+260]])A.fixed.push([k,x,y,0],[k,W-x,H-y,0]);
  A.itemSpot=R2=>{const c=A.camps[(R2()*A.camps.length)|0];return[c.x+(R2()-.5)*200,c.y+(R2()-.5)*160,0]}}
/* ---------- ownership and teams ---------- */
const fTeam=f=>f===G.me?(G.left?0:1):(G.left?1:0);
const teamF=t=>fTeam(G.me)===t?G.me:G.op;
const owns=t=>G.mode!=="net"||(t===1?!G.left:G.left);
function mobaInit(){G.units=[];G.uev=[];G.uevSeen=new Set();G.uproj=[];G.useq=0;G.waveN=0;G.campT=new Map();
  for(const t of [0,1]){if(!owns(t))continue;const m=p=>t===0?p:[W-p[0],H-p[1]];const add=(k,p,prot)=>{const u=mkUnit(k,t,m(p)[0],m(p)[1]);u.prot=prot||null;return u};
    const orb=add("orb",[250,900]),bt=add("bt",[470,900]);orb.prot=[bt.id];
    const lanes=[["mid",[[1150,900],[720,900]]],["top",[[900,260],[300,560]]],["bot",[[900,1540],[300,1240]]]],inner=[];
    for(const [ln,[o,i]] of lanes){const ou=add("tw",o),iu=add("tw",i,[ou.id]);inner.push(iu.id)}bt.prot=inner;bt.protAny=1}
  if(owns(2))G.A.camps.forEach((c,i)=>{const u=mkUnit(c.k,2,c.x,c.y);u.camp=i})}
function mkUnit(k,team,x,y){const d=UK[k],u={id:"ULRN"[team+1]+"u"+(++G.useq),k,team,x,y,hx:x,hy:y,hp:d.hp,max:d.hp,cd:rnd(.2,.8),wp:0,own:true,hs:new Set(),ag:null,dead:false};G.units.push(u);return u}
const unitById=id=>G.units.find(u=>u.id===id);
function protectedU(u){if(!u.prot)return false;const alive=u.prot.map(unitById).filter(Boolean);return u.protAny?alive.length===u.prot.length:alive.length>0}
/* ---------- simulation (owner side) ---------- */
function updUnits(dt){if(!G.units)return;const A=G.A;coinTick(dt);if(G.mode==="bot"&&Math.random()<dt*.2)botShop(G.op);
  if(!G.over&&G.cd<=0&&G.t>=3.2+6+G.waveN*30){G.waveN++;for(const t of [0,1]){if(!owns(t))continue;for(const ln of ["top","mid","bot"]){const p=LANES[ln],s=t===0?p[0]:p[p.length-1];
        for(let i=0;i<4;i++){const u=mkUnit(i===3?"cr":"cm",t,s[0]+(t?1:-1)*i*26,s[1]+(i%2?10:-10));u.lane=ln;u.wp=t===0?1:p.length-2}}}}
  for(const [ci,tm] of G.campT){if(G.t>=tm){G.campT.delete(ci);const c=A.camps[ci];const u=mkUnit(c.k,2,c.x,c.y);u.camp=ci;FX.boom(c.x,c.y-10,"shadow",30)}}
  for(const u of G.units){if(!owns(u.team)||u.dead)continue;const d=UK[u.k];u.cd-=dt;
    if(G.tstop&&G.t<G.tstop.t&&u.team!==G.tstop.team){u.cd=Math.max(u.cd,.2);continue}
    if(d.camp&&!u.ally){if(u.ag&&(u.ag.hp<=0||Math.hypot(u.x-u.hx,u.y-u.hy)>d.leash||Math.hypot(u.ag.x-u.hx,u.ag.y-u.hy)>d.leash+80))u.ag=null;
      if(u.ag){unitFight(u,{f:u.ag},dt)}else{const e=Math.hypot(u.hx-u.x,u.hy-u.y);if(e>6){u.x+=(u.hx-u.x)/e*d.sp*1.4*dt;u.y+=(u.hy-u.y)/e*d.sp*1.4*dt}else if(u.hp<u.max)u.hp=Math.min(u.max,u.hp+u.max*.25*dt)}continue}
    if(d.still){if(!d.dmg)continue;const tg=findTarget(u,d.rng,true);if(tg&&u.cd<=0){u.cd=d.cd;unitHit(u,tg)}continue}
    const tg=findTarget(u,200,false);if(tg){unitFight(u,tg,dt);continue}
    const p=LANES[u.lane],last=u.team===0?p.length-1:0;let wx,wy;if((u.team===0&&u.wp>last)||(u.team===1&&u.wp<0)){const ob=G.units.find(q=>q.k==="orb"&&q.team!==u.team);const b=BASE[1-u.team];wx=ob?ob.x:b[0];wy=ob?ob.y:b[1]}else{wx=p[u.wp][0];wy=p[u.wp][1]}
    const e=Math.hypot(wx-u.x,wy-u.y);if(e<14)u.wp+=u.team===0?1:-1;else{u.x+=(wx-u.x)/e*d.sp*dt;u.y+=(wy-u.y)/e*d.sp*dt}}
  /* creeps of the same team spread a little so waves don't collapse into one pixel */
  for(let i=0;i<G.units.length;i++){const a=G.units[i];if(UK[a.k].still||!owns(a.team))continue;for(let j=i+1;j<G.units.length;j++){const b=G.units[j];if(b.team!==a.team||UK[b.k].still)continue;const dx=a.x-b.x,dy=a.y-b.y,e=Math.hypot(dx,dy);if(e>0&&e<20){a.x+=dx/e*(20-e)*.3;a.y+=dy/e*(20-e)*.3}}}
  for(let i=G.uproj.length-1;i>=0;i--){const p=G.uproj[i];p.t+=dt*3.2;if(p.t>=1)G.uproj.splice(i,1)}}
function unitFight(u,tg,dt){const d=UK[u.k],tx=tg.f?tg.f.x:tg.u.x,ty=tg.f?tg.f.y:tg.u.y,e=Math.hypot(tx-u.x,ty-u.y),reach=d.rng+(tg.u?UK[tg.u.k].r:12);
  if(e>reach*.92){u.x+=(tx-u.x)/e*d.sp*dt;u.y+=(ty-u.y)/e*d.sp*dt}else if(u.cd<=0){u.cd=d.cd;unitHit(u,tg)}}
function findTarget(u,rng,towerMode){let best=null,bd=1e9;const d=UK[u.k];
  for(const q of G.units){if(q.team===u.team||q.dead||(q.team===2&&u.team!==2))continue;if(q.team!==2&&u.team===2)continue;const e=Math.hypot(q.x-u.x,q.y-u.y)-UK[q.k].r;if(e<rng&&e<bd){bd=e;best={u:q}}}
  for(const t of [0,1]){if(t===u.team)continue;const f=teamF(t);if(f.hp<=0||f.inv>0||f.under>0||u.team===2)continue;const e=Math.hypot(f.x-u.x,f.y-u.y);if(e>=rng)continue;
    if(towerMode){if(!best||(f.aggroT&&f.aggroT>G.t))return{f}}else if(e<bd-30){bd=e;best={f}}}
  return best}
/* a unit attacks something: apply locally if we own the target, otherwise send an event */
function unitHit(u,tg){const d=UK[u.k],tx=tg.f?tg.f.x:tg.u.x,ty=tg.f?tg.f.y:tg.u.y,dmg=tg.f?d.dmg:(d.dmgU||d.dmg);
  const ev=[u.id+"e"+(++G.useq),u.id,tg.f?"F"+fTeam(tg.f):tg.u.id,dmg,Math.round(u.x),Math.round(u.y),d.proj?1:0,d.aoe||0];G.uev.push(ev);if(G.uev.length>40)G.uev.shift();G.uevSeen.add(ev[0]);applyUEv(ev,true)}
function applyUEv(ev,local){const [id,src,tgt,dmg,sx,sy,proj,aoe]=ev;let tx,ty,tu=null,tf=null;
  if(tgt[0]==="F"){tf=teamF(+tgt[1]);tx=tf.x;ty=tf.y}else{tu=unitById(tgt);if(!tu)return;tx=tu.x;ty=tu.y}
  if(proj)G.uproj.push({x0:sx,y0:sy-30,tx,ty:ty-14,t:0,c:src[0]});else FX.hit(tx,ty-12,"norm");
  if(aoe){FX.boom(tx,ty,"earth",aoe);G.shake=Math.min(10,G.shake+5)}
  const UA={mon:{atk:1,t:[]},env:true,owned:false,lv:0,x:sx,y:sy,unit:src};
  if(tf&&tf.owned){const dx=tx-sx,dy=ty-sy,l=Math.hypot(dx,dy)||1;applyHit(tf,UA,{t:"norm",pw:dmg,kind:"env",kb:aoe?260:0},id,[dx/l,dy/l])}
  if(tu&&owns(tu.team))hurtUnit(tu,dmg,null,src)}
function hurtUnit(u,dmg,att,srcId){if(u.dead||protectedU(u)){if(att&&Math.random()<.1)pop(u.x,u.y-50,"ป้องกันอยู่","#b8b3cc");return}
  u.hp-=dmg;if(att){u.ag=att;if(att.hp>0)att.aggroT=0}if(u.hp<=0)killUnit(u,att)}
function killUnit(u,att){u.dead=true;u.hp=0;const d=UK[u.k];const i=G.units.indexOf(u);if(i>=0)G.units.splice(i,1);
  FX.boom(u.x,u.y-12,u.k==="orb"?"shadow":u.k==="tw"||u.k==="bt"?"earth":"norm",d.r*2);if(d.still)G.shake=10;SFX.play("boom");
  if(d.camp){if(!u.ally){G.campT.set(u.camp,G.t+(u.k==="boss"?60:20));if(d.buff&&att)grantBuff(att,d.buff)}}
  if(att)giveCoins(att,SHOP.REWARD[u.k]||0,u.x,u.y);
  if(att&&att.owned)att.ult=Math.min(100,att.ult+(d.camp?10:d.still?20:3));
  if(u.k==="orb")orbDown(u.team)}
function grantBuff(f,b){if(f.owned){applyBuff(f,b);return}const ev=["b"+(++G.useq)+G.me.tag,"B",b,0,0,0,0,0];G.uev.push(ev);if(G.uev.length>40)G.uev.shift();G.uevSeen.add(ev[0])}
function applyBuff(f,b){const B=BUFFS[b];f["b_"+b]=B.t;pop(f.x,f.y-70,B.n,B.c,1);SFX.play("ult");FX.burst(f.x,f.y-20,B.c,30,200,.7)}
function orbDown(team){G.orbDown=G.orbDown||[];G.orbDown.push(team);if(!G.over){const mine=fTeam(G.me)===team;endGame(mine?"lose":"win",mine?"ออร์บฐานของคุณถูกทำลาย":"คุณทำลายออร์บฐานศัตรูได้")}}
/* fighters' attacks against units (called from hurtMinions) */
function hurtUnits(att,test,pw,key){if(!G.units||att.env)return false;const tm=fTeam(att);let any=false;
  for(const u of G.units){if(u.team===tm||u.dead)continue;const r=UK[u.k].r;if(!(test(u.x,u.y-12)||(r>16&&(test(u.x-r*.6,u.y-12)||test(u.x+r*.6,u.y-12)||test(u.x,u.y-12-r*.6)))))continue;
    any=true;if(u.hs.has(key))continue;u.hs.add(key);if(u.hs.size>60)u.hs.clear();FX.hit(u.x,u.y-14,"norm");
    if(owns(u.team))hurtUnit(u,Math.round(pw*att.mon.atk*(att.rage>0?1.3:1)*(att.b_red>0?1.25:1)*(att.b_boss>0?1.3:1)*(att.dmgMul||1)),att)}
  return any}
/* fountain heal / enemy fountain burn, respawn handled in updOwned */
function mobaEnv(f,dt){const t=fTeam(f),own=BASE[t],en=BASE[1-t],fp=[own[0]<1500?110:W-110,900];
  if(Math.hypot(f.x-fp[0],f.y-fp[1])<120&&f.hp>0&&f.hp<f.max){f.fT=(f.fT||0)-dt;if(f.fT<=0){f.fT=.5;heal(f,Math.round(f.max*.05))}}
  const efp=[en[0]<1500?110:W-110,900];if(Math.hypot(f.x-efp[0],f.y-efp[1])<150){f.efT=(f.efT||0)-dt;if(f.efT<=0){f.efT=.5;applyHit(f,ENV,{t:"norm",pw:25,kind:"env"},"fnt"+f.tag+G.t.toFixed(1),null)}}}
/* ---------- net ---------- */
const UKI=k=>UKEYS.indexOf(k);
function unitsPacket(){return G.units.filter(u=>owns(u.team)).map(u=>[u.id,UKI(u.k),u.team,Math.round(u.x),Math.round(u.y),Math.max(0,Math.round(u.hp)),u.max])}
function unitsRecv(q){if(!G.units)return;
  if(Array.isArray(q.un)){const seen=new Set();for(const r of q.un){if(!Array.isArray(r))continue;const id=String(r[0]),team=r[2]|0;if(owns(team))continue;seen.add(id);let u=unitById(id);
      if(!u){const k=UKEYS[r[1]|0]||"cm";u={id,k,team,x:+r[3],y:+r[4],hx:+r[3],hy:+r[4],hp:+r[5],max:+r[6],hs:new Set(),rm:true,tx:+r[3],ty:+r[4]};G.units.push(u)}u.tx=+r[3];u.ty=+r[4];u.hp=+r[5];u.max=+r[6]||u.max}
    for(let i=G.units.length-1;i>=0;i--){const u=G.units[i];if(u.rm&&!seen.has(u.id)){G.units.splice(i,1);FX.boom(u.x,u.y-12,"norm",UK[u.k].r*2)}}}
  if(Array.isArray(q.ue))for(const ev of q.ue){if(!Array.isArray(ev))continue;const id=String(ev[0]);if(G.uevSeen.has(id))continue;G.uevSeen.add(id);
    if(ev[1]==="B"){if(BUFFS[ev[2]])applyBuff(G.me,ev[2]);continue}
    if(ev[1]==="C"){giveCoins(G.me,clamp(+ev[2]||0,0,100),+ev[4],+ev[5]);continue}
    if(ev[1]==="V"){if(owns(2))tameUnit(String(ev[2]));continue}applyUEv([id,String(ev[1]),String(ev[2]),clamp(+ev[3]||0,0,80),+ev[4]||0,+ev[5]||0,ev[6]?1:0,+ev[7]||0],false)}
  if(Array.isArray(q.od))for(const t of q.od)if(!(G.orbDown||[]).includes(t)){G.orbDown=G.orbDown||[];G.orbDown.push(t);if(!G.over){const mine=fTeam(G.me)===t;endGame(mine?"lose":"win",mine?"ออร์บฐานของคุณถูกทำลาย":"คุณทำลายออร์บฐานศัตรูได้")}}}
function unitsLerp(dt){if(!G.units)return;const k=Math.min(1,dt*12);for(const u of G.units)if(u.rm){u.x+=(u.tx-u.x)*k;u.y+=(u.ty-u.y)*k}}
/* bot plan on the MOBA map: retreat when low, fight the player when close, otherwise push mid */
function mobaBotPlan(f){const b=f.ai,t=fTeam(f),home=f.home||BASE[t];if(f.hp<f.max*.3)b.ret=true;if(f.hp>=f.max*.95)b.ret=false;
  if(b.ret)return{goal:home,ret:true};const o=G.me;if(o.hp>0&&seenBy(o,f)&&Math.hypot(o.x-f.x,o.y-f.y)<420)return{fight:true};
  let best=null,bd=380;for(const u of G.units){if(u.team===t||u.team===2||protectedU(u))continue;const e=Math.hypot(u.x-f.x,u.y-f.y);if(e<bd){bd=e;best=u}}
  if(best){const tw=G.units.find(q=>q.team!==t&&(q.k==="tw"||q.k==="bt")&&Math.hypot(q.x-f.x,q.y-f.y)<UK[q.k].rng+20);
    const allies=G.units.filter(q=>q.team===t&&!UK[q.k].still&&Math.hypot(q.x-f.x,q.y-f.y)<300).length;if(tw&&allies<2&&best===tw)return{goal:[f.x+(t?120:-120),f.y]};return{unit:best}}
  const p=LANES.mid,tgt=G.units.filter(q=>q.team!==t&&q.team!==2&&q.x!=null).sort((a,c)=>Math.abs(a.y-900)-Math.abs(c.y-900)||(t?c.x-a.x:a.x-c.x))[0];
  return{goal:tgt?[tgt.x+(t?260:-260),tgt.y]:[t?p[0][0]:p[1][0],900]}}
/* ================= MOBA economy: coins, shop, five special items =================
   Coins are earned by the fighter who lands the killing blow (lane creeps, jungle, towers, the other player)
   plus a small trickle over time. The unit owner decides the kill; if the killer is the remote player
   the coins travel as a unit event ("C"). */
Object.assign(ITEMS,{
  tank:{n:"รถถัง",d:"ขับรถถัง 15 วินาที สกิลทั้งหมดเปลี่ยนเป็นยิงจรวดทำลายล้าง รับความเสียหายลดลง 40%",kind:"use",uses:1,mv:"it_tank",w:0,shop:1},
  jet:{n:"เครื่องบินรบ",d:"บินข้ามสิ่งกีดขวางทั้งหมด 15 วินาที สกิลเปลี่ยนเป็นทิ้งระเบิด",kind:"use",uses:1,mv:"it_jet",w:0,shop:1},
  clock:{n:"นาฬิกาหยุดเวลา",d:"หยุดเวลาคู่ต่อสู้ ป้อมและครีปฝั่งตรงข้าม 5 วินาที",kind:"use",uses:1,mv:"it_clock",w:0,shop:1},
  collar:{n:"ปลอกคอพันธมิตร",d:"ใช้ใกล้ครีปป่า (ยกเว้นบอส) ให้กลายเป็นพวกเรา เดินไปช่วยตีป้อม",kind:"use",uses:1,mv:"it_collar",w:0,shop:1},
  scroll:{n:"คัมภีร์แยกเงาพันร่าง",d:"สร้างร่างแยก 10 ร่าง เดินกระจายคนละทิศหลอกศัตรู 15 วินาที",kind:"use",uses:1,mv:"it_scroll",w:0,shop:1}});
Object.assign(MOVES,{
  it_tank:{n:"รถถัง",t:"metal",kind:"tank",aim:"self",hidden:1},
  it_jet:{n:"เครื่องบินรบ",t:"wind",kind:"jet",aim:"self",hidden:1},
  it_clock:{n:"หยุดเวลา",t:"norm",kind:"tstop",aim:"self",hidden:1},
  it_collar:{n:"ปลอกคอพันธมิตร",t:"norm",kind:"collar",aim:"self",hidden:1},
  it_scroll:{n:"แยกเงาพันร่าง",t:"shadow",kind:"clones",aim:"self",hidden:1},
  tk_mg:{n:"ปืนกลรถถัง",t:"metal",kind:"shot",aim:"line",pw:5,sp:720,r:4,cnt:1,life:.7,cd:.2,gun:1,hidden:1},
  tk_rocket:{n:"จรวดรถถัง",t:"fire",kind:"shot",aim:"line",pw:14,sp:480,r:10,cnt:1,life:1.3,cd:2.2,rocket:"tk_boom",hidden:1},
  tk_boom:{t:"fire",kind:"strike",pw:28,rad:84,kb:320,heavy:9,crater:2,hidden:1},
  jt_gun:{n:"ปืนกลอากาศ",t:"wind",kind:"shot",aim:"line",pw:5,sp:760,r:4,cnt:1,life:.6,cd:.2,gun:1,hidden:1},
  jt_bomb:{n:"ทิ้งระเบิด",t:"fire",kind:"strike",aim:"point",pw:24,rad:84,delay:.55,kb:300,heavy:9,crater:2,rng:200,cd:2,fall:1,hidden:1}});
const SHOP={special:["tank","jet","clock","collar","scroll"],sp:100,
  REWARD:{cm:5,cr:7,wolf:12,golem:25,spirit:25,boss:60,tw:50,bt:80,orb:0},KILL:40,START:30,TRICKLE:2};
const priceOf=k=>ITEMS[k].shop?SHOP.sp:Math.round((15+(11-ITEMS[k].w)*6)/5)*5;
function rollShop(){const pool=ITEM_KEYS.filter(k=>ITEMS[k].w>0&&!ITEMS[k].shop);const out=[];while(out.length<6&&pool.length)out.push(pool.splice((Math.random()*pool.length)|0,1)[0]);G.stock=out;G.stockT=G.t+60}
function shopInit(){G.me.coins=G.op.coins=SHOP.START;G.coinT=0;rollShop()}
/* give coins to a fighter: local fighters directly, the remote player through an event */
function giveCoins(f,n,x,y){if(!f||!n)return;
  if(f.owned){f.coins=(f.coins||0)+n;if(f===G.me){pop(x==null?f.x:x,(y==null?f.y:y)-56,"+"+n+" เหรียญ","#ffd23e");shopRefresh()}return}
  if(!G.units)return;const ev=["c"+(++G.useq)+G.me.tag,"C",n,0,Math.round(x||0),Math.round(y||0),0,0];G.uev.push(ev);if(G.uev.length>40)G.uev.shift();G.uevSeen.add(ev[0])}
function coinTick(dt){if(G.cd>0||G.over)return;G.coinT+=dt;if(G.coinT>=SHOP.TRICKLE){G.coinT-=SHOP.TRICKLE;for(const f of [G.me,G.op])if(f.owned)f.coins=(f.coins||0)+1;shopRefresh()}
  if(G.t>=G.stockT)rollShop()}
function buyItem(k){const f=G.me;if(!G||!G.units||f.hp<=0||G.over)return;const p=priceOf(k);if((f.coins||0)<p){pop(f.x,f.y-60,"เหรียญไม่พอ","#ff8a8a",1);return}
  f.coins-=p;if(!ITEMS[k].shop){const i=G.stock.indexOf(k);if(i>=0)G.stock.splice(i,1)}gainItem(f,k);SFX.play("buff");shopRefresh()}
/* the bot spends its coins too, preferring the specials */
function botShop(f){if(!f.owned||f===G.me||!G.units||f.item||f.hp<=0)return;if((f.coins||0)>=SHOP.sp+20){const k=SHOP.special[(Math.random()*5)|0];f.coins-=SHOP.sp;gainItem(f,k)}}
/* ---------- the specials ---------- */
const collarTarget=f=>{let best=null,bd=280;for(const u of G.units||[]){if(u.team!==2||u.dead||u.k==="boss")continue;const e=Math.hypot(u.x-f.x,u.y-f.y);if(e<bd){bd=e;best=u}}return best};
function specialUse(f,a,mv){const tm=G.units?fTeam(f):0;
  switch(mv.kind){
    case"tank":if(f.owned){f.tank=15;f.car=0;f.fly=0;f.jet=0;f.dash=null;f.cds=[0,0,0]}FX.boom(a.x,a.y,"metal",40);G.shake=Math.max(G.shake,6);SFX.play("boom");pop(a.x,a.y-70,"รถถัง!","#c8d48a",1);break;
    case"jet":if(f.owned){f.jet=15;f.fly=15;f.tank=0;f.car=0;f.dash=null;f.cds=[0,0,0]}FX.burst(a.x,a.y-20,"#ffffff",30,220,.6);SFX.play("dash");pop(a.x,a.y-70,"เครื่องบินรบ!","#9ad4ff",1);break;
    case"tstop":G.tstop={t:G.t+5,team:tm,who:f};FX.mega(a.x,a.y-20,"light",90);SFX.play("ult");pop(a.x,a.y-80,"หยุดเวลา!","#d8e8ff",1);break;
    case"collar":{if(!G.units)break;const u=collarTarget(f);pop(a.x,a.y-70,"ปลอกคอพันธมิตร!","#7dffa0",1);if(!u)break;FX.burst(u.x,u.y-20,"#7dffa0",30,200,.6);
      if(f.owned&&owns(tm)){const n=mkUnit(u.k,tm,u.x,u.y);n.ally=1;laneFor(n)}
      if(owns(2))tameUnit(u.id);else if(f.owned){const ev=["v"+(++G.useq)+G.me.tag,"V",u.id,0,0,0,0,0];G.uev.push(ev);if(G.uev.length>40)G.uev.shift();G.uevSeen.add(ev[0])}break}
    case"clones":if(f.owned){const off=Math.random()*6.283;for(let i=0;i<10;i++){const an=off+i*.628;f.minions.push({id:a.id+"~c"+i,k:7,x:f.x+Math.cos(an)*14,y:f.y+Math.sin(an)*10,hp:1,mx:1,t:15,hc:0,wk:i,an,w:rnd(.6,1.6),lv:f.lv||0})}}
      FX.boom(a.x,a.y-12,"shadow",44);SFX.play("zap");pop(a.x,a.y-70,"แยกเงาพันร่าง!","#c8a0ff",1);break}}
/* the jungle owner removes a tamed creep; its camp comes back as usual */
function tameUnit(id){const u=unitById(id);if(!u||u.team!==2)return;const i=G.units.indexOf(u);if(i>=0)G.units.splice(i,1);u.dead=true;if(u.camp!=null)G.campT.set(u.camp,G.t+20)}
/* a converted creep walks the nearest lane toward the enemy base */
function laneFor(u){let best=null,bd=1e9;for(const [ln,p] of Object.entries(LANES))for(let i=0;i<p.length-1;i++){const [ax,ay]=p[i],[bx,by]=p[i+1],l2=(bx-ax)**2+(by-ay)**2,t=clamp(((u.x-ax)*(bx-ax)+(u.y-ay)*(by-ay))/l2,0,1),e=Math.hypot(u.x-ax-t*(bx-ax),u.y-ay-t*(by-ay));
    if(e<bd){bd=e;best=[ln,i]}}u.lane=best[0];u.wp=u.team===0?best[1]+1:best[1]}
/* decoy clones: walk in their own direction, turn at walls, never attack */
function cloneAI(f,m,dt){m.w-=dt;if(m.w<=0){m.w=rnd(1,2.4);m.an+=rnd(-1.2,1.2)}if(G.tstop&&G.t<G.tstop.t&&fTeam(f)!==G.tstop.team)return;
  const sp=f.mon.spd*.9,nx=m.x+Math.cos(m.an)*sp*dt,ny=m.y+Math.sin(m.an)*sp*dt;G.wlv=m.lv||0;
  const blocked=nx<FR+10||nx>W-FR-10||ny<FR+20||ny>H-FR||wallAt(nx,ny,8)||G.A.props.some(p=>!p.dead&&p.r&&Math.hypot(p.x-nx,p.y-ny)<p.r+8)||(G.units||[]).some(u=>UK[u.k].solid&&Math.hypot(u.x-nx,u.y-ny)<UK[u.k].r+8);
  if(blocked){m.an+=Math.PI*rnd(.6,1.4);return}m.x=nx;m.y=ny}
const frozenByTime=f=>!!(G.tstop&&G.t<G.tstop.t&&G.units&&fTeam(f)!==G.tstop.team);
/* ================= arenas: see c_arena.js for layouts and c_paint.js for terrain painting ================= */
let W=960,H=600,VW=640,VH=400;const FR=14;
const bg=document.createElement("canvas");bg.width=W/2;bg.height=H/2;const bgx=bg.getContext("2d");
function crater(x,y,r,hole){BGD=true;const c=bgx;x=(x/2)|0;y=(y/2)|0;r=(r/2)|0;
  c.fillStyle="rgba(0,0,0,.28)";c.beginPath();c.ellipse(x,y,r,r*.7,0,0,7);c.fill();c.fillStyle=hole?"rgba(20,12,8,.8)":"rgba(0,0,0,.3)";c.beginPath();c.ellipse(x,y+1,r*.62,r*.42,0,0,7);c.fill();
  c.fillStyle="rgba(255,255,255,.16)";for(let i=0;i<10;i++){const a=rnd(0,6.28);c.fillRect((x+Math.cos(a)*r)|0,(y+Math.sin(a)*r*.7)|0,1,1)}}
function scorch(x,y,r){BGD=true;const c=bgx;c.fillStyle="rgba(15,10,10,.55)";c.beginPath();c.ellipse((x/2)|0,(y/2)|0,r/2,r*.35,0,0,7);c.fill()}
const inRect=(r,x,y,p)=>x>=r.x-(p||0)&&x<=r.x+r.w+(p||0)&&y>=r.y-(p||0)&&y<=r.y+r.h+(p||0);
const inEll=(l,x,y,p)=>{const a=(x-l.x)/(l.rx+(p||0)),b=(y-l.y)/(l.ry+(p||0));return a*a+b*b<1};
const inWater=(x,y)=>G.A.water.some(w=>w.e?inEll(w,x,y):inRect(w,x,y))&&!G.A.bridges.some(r=>!r.dead&&inRect(r,x,y));
const waterNear=(x,y,r)=>G.A.water.some(w=>w.e?inEll(w,x,y,r):inRect(w,x,y,r));
const ellAt=(arr,x,y,p)=>arr.find(l=>inEll(l,x,y,p));
const wallOpen=(w,x,y,r)=>w.dead||(w.sky&&w.sky.dead)||(w.breach||[]).some(q=>Math.hypot(x-q.x,y-q.y)<q.r-(r||0));
const wallAt=(x,y,r,lv)=>{const L=lv==null?(G.wlv||0):lv;return G.A.walls.find(w=>(w.lv||0)===L&&inRect(w,x,y,r)&&!wallOpen(w,x,y,r))};
function makeHole(x,y,r,lv,id){const A=G.A;if(r<18)return;const h={id:id||"h"+G.t,x:clamp(x,FR+25,W-FR-25),y:clamp(y,FR+30,H-FR-20),r:clamp(r,20,62),lv:lv||0,t:18,arm:.55};
  const old=A.holes.find(q=>(q.lv||0)===h.lv&&Math.hypot(q.x-h.x,q.y-h.y)<Math.max(q.r,h.r)*.65);if(old){old.r=Math.max(old.r,h.r);old.t=18;old.arm=Math.max(old.arm||0,.4);return old}A.holes.push(h);if(A.holes.length>10)A.holes.shift();crater(h.x,h.y,h.r*1.15,1);return h}
function damageStructures(x,y,r,mv,att){const A=G.A,lv=att&&att.lv||0,power=(mv.breach||0)+(mv.heavy>=9?2:0);if(!power&&!mv.bridge)return;
  for(const w of A.walls){if((w.lv||0)!==lv||w.dead)continue;const nx=clamp(x,w.x,w.x+w.w),ny=clamp(y,w.y,w.y+w.h);if(Math.hypot(x-nx,y-ny)>r+8)continue;if(w.sky){w.sky.hp-=mv.bridge||power*2;if(w.sky.hp<=0){w.sky.dead=true;FX.mega(w.sky.x+w.sky.w/2,w.sky.y+w.sky.h/2,"metal",70);G.shake=Math.max(G.shake,9)}continue}
    if(power){w.breach=w.breach||[];if(!w.breach.some(q=>Math.hypot(q.x-nx,q.y-ny)<18)){w.breach.push({x:nx,y:ny,r:20+power*5});part(nx,ny,"#d8c8b0",18,190,.6);G.shake=Math.max(G.shake,4)}}}
  for(const b of A.bridges){if(b.dead||!inRect(b,x,y,r))continue;b.hp=(b.hp==null?8:b.hp)-(mv.bridge||power*2);if(b.hp<=0){b.dead=true;FX.mega(b.x+b.w/2,b.y+b.h/2,"water",60);G.shake=Math.max(G.shake,8)}}
  if(lv===1)for(const s of A.sky){if(s.dead||!inRect(s,x,y,r))continue;s.hp-=mv.bridge||power*2;if(s.hp<=0){s.dead=true;FX.mega(s.x+s.w/2,s.y+s.h/2,"metal",80);G.shake=Math.max(G.shake,10)}}}
const inCover=f=>G.zones.some(z=>z.mv.smoke&&Math.hypot(z.x-f.x,z.y-f.y)<z.mv.rad)||G.A.props.some(p=>!p.dead&&((p.k==="bush"&&Math.hypot(p.x-f.x,p.y-f.y)<p.R-4)||(p.k==="tree"&&Math.hypot(p.x-f.x,p.y-14-f.y)<p.R-2)||(PDEF[p.k].hide&&(p.lv||0)===(f.lv||0)&&Math.hypot(p.x-f.x,p.y-f.y)<p.R)));
const seenBy=(o,f)=>(!G.A.visFn||G.A.visFn(o,f))&&o.under<=0&&!(o.cloak>0&&o.reveal<=0&&Math.hypot(o.x-f.x,o.y-f.y)>70)&&!(inCover(o)&&o.reveal<=0&&o.burn<=0&&Math.hypot(o.x-f.x,o.y-f.y)>90);
function meltIce(x,y,r){const A=G.A;for(let i=A.ice.length-1;i>=0;i--){const l=A.ice[i];if(inEll(l,x,y,r)){A.ice.splice(i,1);A.water.push(l);repaintRegion("water",l);FX.burst(l.x,l.y,"#e8f4ff",30,l.rx*2.4,.9);SFX.play("dash","water")}}}

/* ================= game state ================= */
let G=null;const ENV={mon:{atk:1,t:[]},owned:false,env:true,ult:0,x:0,y:0};
function mkFighter(card,x,face,owned,tag){const m=MONS[card.mon];
  return{tag,card,mon:m,key:card.mon,moves:card.mv,x,y:H/2,tx:x,ty:H/2,ax:face,ay:0,hp:m.hp,max:m.hp,owned,seq:0,ult:0,cdB:0,
    cds:[0,0,0],dodgeCd:0,stun:0,stunImm:0,slow:0,burn:0,burnTick:0,guard:0,haste:0,rest:0,under:0,roll:0,rdx:0,rdy:0,ifr:0,root:0,air:0,airT:1,jx:0,jy:0,land:null,shield:0,shieldT:0,cast:0,faceT:0,cloak:0,chill:0,chT:0,frz:0,inv:0,busy:0,bub:0,U:null,fly:0,car:0,carHc:0,rage:0,regen:0,regT:0,cdr:0,cdI:0,item:null,lv:0,
    dash:null,chg:null,chgF:0,kx:0,ky:0,ivx:0,ivy:0,hk:null,flash:0,walk:0,moving:false,reveal:0,envT:0,cacT:0,sprT:0,padCd:0,tremN:0,hitSet:new Set(),hits:[],atks:[],minions:[],ai:{t:1.2,s:1,st:1,lx:W/2,ly:H/2,hold:null}}}
function goFull(){if(!touch)return;const d=document.documentElement;try{if(!document.fullscreenElement&&d.requestFullscreen)d.requestFullscreen({navigationUI:"hide"}).then(()=>{try{screen.orientation.lock("landscape").catch(()=>{})}catch(e){}setTimeout(layout,200)}).catch(()=>{})}catch(e){}}
function spawnPt(A,left){if(A.spawn)return A.spawn[left?0:1];const bad=(x,y)=>{const t=l=>l.e?inEll(l,x,y,26):inRect(l,x,y,26);return A.water.some(t)||A.lava.some(t)||A.bog.some(t)||A.sand.some(t)||A.walls.some(t)||A.props.some(p=>!p.dead&&p.r&&Math.hypot(p.x-x,p.y-y)<p.r+30)};
  for(let r=0;r<400;r+=12)for(let a=0;a<6.28;a+=.5){const x=Math.round((left?W*.13:W*.87)+Math.cos(a)*r),y=Math.round(H/2+Math.sin(a)*r);if(x>40&&x<W-40&&y>60&&y<H-40&&!bad(x,y))return[x,y]}return[left?150:W-150,H/2]}
function newGame(mode,meCard,opCard,left,arKey,seed){
  const A=buildArena(arKey);paintArena(A);
  const sL=spawnPt(A,true),sR=spawnPt(A,false),ms=left?sL:sR,os=left?sR:sL;
  const me=mkFighter(meCard,ms[0],left?1:-1,true,"m"+((Math.random()*1e5)|0)+"-"),op=mkFighter(opCard,os[0],left?-1:1,mode==="bot","o");me.y=me.ty=ms[1];op.y=op.ty=os[1];me.home=ms;op.home=os;
  G={mode,A,me,op,shots:[],blasts:[],zones:[],rings:[],beams:[],waves:[],slashes:[],cones:[],traps:[],orbits:[],twalls:[],ults:[],items:[],itemN:0,picked:new Set(),myPicks:[],seed:String(seed||Math.random()),cd:3.2,over:null,shake:0,t:0,cut:null,stop:0,zapT:0,zapSeen:new Set(),dark:0,
    score:[0,0],rn:0,nextT:0,seenA:new Set(),seenH:new Set(),myDrain:new Map(),myKills:[],opPeer:null,gone:0,sendT:0,left};
  $("nmL").textContent="";$("nmR").textContent="";const L=left?me:op,Rr=left?op:me;
  L.mon.t.forEach(t=>$("nmL").append(chip(t)));$("nmL").append(el("span",null,L.card.nick+(L===me?" (คุณ)":"")));
  $("nmR").append(el("span",null,Rr.card.nick+(Rr===me?" (คุณ)":"")));Rr.mon.t.forEach(t=>$("nmR").append(chip(t)));
  $("arName").textContent=ARENAS.find(a=>a.k===arKey).n;
  placeFixed("fx");if(A.units){mobaInit();shopInit()}$("shopBtn").hidden=!A.units;$("shop").hidden=true;resetInput();buildButtons();$("over").hidden=true;$("res").hidden=true;$("rban").hidden=true;updScore();goFull();show("game");layout();VIEW.reset()}
/* hand-placed items (city interiors, MOBA jungle) stay until someone picks them up */
function placeFixed(pre){G.fixId=[];G.fixDue=[];G.fixGen=[];for(const [i,q] of (G.A.fixed||[]).entries()){G.fixId[i]=pre+i;G.fixGen[i]=0;if(!G.picked.has(pre+i))G.items.push({id:pre+i,k:q[0],x:q[1],y:q[2],t:1e9,b:i*.7,lv:q[3]||0,fix:1})}}
const pickArena=(pref,r)=>ARENAS.some(a=>a.k===pref)?pref:ARENAS[Math.min(ARENAS.length-1,(r*ARENAS.length)|0)].k;
function startBot(){if(!PG)return;SFX.init();const keys=Object.keys(MONS).filter(k=>k!==SEL.mon);const k=keys[(Math.random()*keys.length)|0];
  const pool=poolOf(k).filter(x=>x!=="rest"&&x!=="guard").sort(()=>Math.random()-.5);
  const lv=BOTLV[SEL.diff]||BOTLV.hard;newGame("bot",myCard(),{nick:"บอท"+lv.n+" "+MONS[k].n,mon:k,mv:pool.slice(0,3)},true,pickArena(SEL.ar,Math.random()),Math.random());
  G.op.ai.P=lv;G.op.dmgMul=lv.dmg;G.op.spdMul=lv.spd}
function startNet(meP,opP){if(G&&G.mode==="net"&&!G.over&&!$("game").hidden)return;SFX.init();
  const left=meP.peer<opP.peer,oc=peerCard(opP);const pref=ISHOST?SEL.ar:oc.host?oc.ar:left?SEL.ar:oc.ar;let s=0;for(const ch of CODE)s+=ch.charCodeAt(0);s+=((Number(meP.presence.rt)||0)%97)+((Number(opP.presence.rt)||0)%97);
  newGame("net",myCard(),oc,left,pickArena(pref,(s%ARENAS.length)/ARENAS.length),CODE+s);G.opPeer=opP.peer}
/* a match is first to 3 KOs; the MOBA map is a single game decided by the orb */
const WINS=3;
function endGame(res,why){if(!G||G.over)return;G.over=res;SFX.play("ko");
  if(!G.A.respawn){if(res==="win")G.score[0]++;else if(res==="lose")G.score[1]++;updScore();
    if(G.score[0]<WINS&&G.score[1]<WINS){koBanner(res);G.nextT=2.8;return}}
  else G.score=res==="win"?[1,0]:res==="lose"?[0,1]:[0,0];
  const fin=G.score[0]>G.score[1]?"win":G.score[1]>G.score[0]?"lose":res;showResult(fin,why);
  if(G.mode==="net"&&NR){myReady=false;NR.presence({ready:false,rt:0,ko:fin==="lose"?true:null}).catch(()=>{})}}
function updScore(){const s=G.score,L=G.left?s[0]:s[1],R=G.left?s[1]:s[0],dots=(n,l)=>{let o="";for(let i=0;i<WINS;i++)o+=(l?i<n:i>=WINS-n)?"●":"○";return o};
  $("score").textContent=G.A.respawn?"":dots(L,1)+"  "+L+" : "+R+"  "+dots(R,0)}
function koBanner(res){const b=$("rban");b.hidden=false;b.className="rban "+res;b.querySelector("b").textContent=res==="win"?"KO! คุณได้แต้ม":res==="lose"?"KO! เสียแต้ม":"KO พร้อมกัน";
  b.querySelector("span").textContent="คุณ "+G.score[0]+" : "+G.score[1]+" "+G.op.card.nick+" · ชนะครบ "+WINS+" ครั้งก่อนเป็นผู้ชนะ";clearTimeout(b.tm);b.tm=setTimeout(()=>{b.hidden=true},2600)}
function nextGame(){G.rn++;G.over=null;G.nextT=0;G.cd=2.6;G.cut=null;G.dark=0;
  for(const k of ["shots","blasts","zones","rings","beams","waves","slashes","cones","traps","orbits","twalls","ults"])G[k]=[];
  const fresh=f=>{const h=f.home,n=mkFighter(f.card,h[0],f.ax<0?-1:1,f.owned,f.tag);n.y=n.ty=h[1];n.seq=f.seq;n.home=h;n.v=f.v;n.ai=f.ai;n.ai.hold=null;n.dmgMul=f.dmgMul;n.spdMul=f.spdMul;n.ult=Math.min(60,f.ult);n.ax=h[0]<W/2?1:-1;return n};
  G.me=fresh(G.me);G.op=fresh(G.op);G.items=G.items.filter(it=>!it.fix);placeFixed("fx"+G.rn+"_");resetInput();itemBtn();relabel();FX.burst(G.me.x,G.me.y-20,"#ffffff",20,160,.5)}
function showResult(fin,why){const r=$("res"),s=G.score,me=G.me,op=G.op;r.hidden=false;r.className="res "+fin;
  const side=(f,won,mine,sc)=>{const d=el("div","rs "+(won?"won":"lost"));const cv=spriteCanvas(f.key,true);d.append(el("b","rbig",won?"WIN":"LOSE"),cv,el("strong",null,f.card.nick+(mine?" (คุณ)":"")),el("span",null,MONS[f.key].n),el("em",null,String(sc)));return d};
  const L=G.left?me:op,R=G.left?op:me,lw=(L===me)===(fin==="win"),ls=L===me?s[0]:s[1],rs=L===me?s[1]:s[0];
  const box=$("resSides");box.textContent="";box.append(side(L,fin==="draw"?false:lw,L===me,ls),side(R,fin==="draw"?false:!lw,R===me,rs));
  $("resWhy").textContent=why||(G.A.respawn?"":"ชนะครบ "+WINS+" ครั้งก่อน")}
function backFromGame(toMenu){const net=G&&G.mode==="net";G=null;$("res").hidden=true;$("rban").hidden=true;
  if(net&&NR&&!toMenu){myReady=false;NR.presence({...CLR}).catch(()=>{});show("lobby");renderLobby()}else{if(net)leaveRoom();show("menu");gotoStep(3)}}
$("bAgain").onclick=()=>{if(G&&G.mode==="bot"){$("res").hidden=true;startBot()}else backFromGame(false)};
$("rAgain").onclick=()=>$("bAgain").click();$("rMenu").onclick=()=>backFromGame(true);
$("bMenu").onclick=()=>backFromGame(true);
$("quit").onclick=()=>{if(G&&G.mode==="net"&&NR&&!G.over)NR.presence({ready:false,rt:0,ko:true}).catch(()=>{});backFromGame(true)};

/* ================= input: move with one hand, aim with the other =================
   Every attack slot is hold-to-aim, release-to-fire. A quick tap fires with auto-aim (touch) or at the cursor (mouse). */
const SLOTS=["b",0,1,2,"u","i"];
const IN={k:{},joy:{x:0,y:0},mouse:{x:.5,y:.5,on:false},slot:{},rel:[],dodge:0};
function resetInput(){IN.k={};IN.joy.x=IN.joy.y=0;IN.rel=[];IN.dodge=0;for(const s of SLOTS)IN.slot[s]={down:false,ax:0,ay:0,mag:0,manual:false}}
resetInput();
const KM={KeyQ:0,KeyE:1,KeyR:2,Digit1:0,Digit2:1,Digit3:2,KeyJ:0,KeyK:1,KeyL:2};
addEventListener("keydown",e=>{if(!G||$("game").hidden||e.repeat)return;if(e.target&&e.target.tagName==="INPUT")return;
  if(e.code in KM){const s=IN.slot[KM[e.code]];s.down=true;s.manual=false;e.preventDefault()}else if(e.code==="Space"||e.code==="ShiftLeft"){IN.dodge=1;e.preventDefault()}
  else if(e.code==="KeyG"||e.code==="KeyH"){const s=IN.slot.i;s.down=true;s.manual=false;e.preventDefault()}
  else if(e.code==="KeyB"&&G.units){shopToggle();e.preventDefault()}
  else if(e.code==="KeyF"||e.code==="KeyU"){IN.slot.u.manual=false;IN.rel.push("u");e.preventDefault()}
  else if(/^(Key[WASD]|Arrow)/.test(e.code)){IN.k[e.code]=1;e.preventDefault()}});
addEventListener("keyup",e=>{if((e.code==="KeyG"||e.code==="KeyH")&&IN.slot.i.down){IN.slot.i.down=false;IN.rel.push("i")}else if(e.code in KM){const s=IN.slot[KM[e.code]];if(s.down){s.down=false;IN.rel.push(KM[e.code])}}else if(e.code==="Space"||e.code==="ShiftLeft")IN.dodge=0;else IN.k[e.code]=0});
addEventListener("blur",()=>resetInput());
{const st=$("stage");const mm=e=>{const c=st.querySelector("canvas:not(#mini)");if(!c)return;const r=c.getBoundingClientRect();if(!r.width||!r.height)return;IN.mouse.x=clamp((e.clientX-r.left)/r.width,0,1);IN.mouse.y=clamp((e.clientY-r.top)/r.height,0,1);IN.mouse.on=true};
  /* Desktop aiming deliberately uses mouse events, independently of touch-device
     detection. Touch controls keep their existing aim-button path below. */
  addEventListener("mousemove",mm,{passive:true});st.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch"){mm(e);if(e.button===0&&G&&!G.over){IN.slot.b.down=true;IN.slot.b.manual=false}}});
  addEventListener("pointerup",e=>{if(e.pointerType!=="touch")IN.slot.b.down=false})}
{const base=$("joyBase"),knob=$("joyKnob");let pid=null;
  const mv=e=>{const r=base.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=r.width/2-8,l=Math.hypot(dx,dy);
    if(l>m){dx*=m/l;dy*=m/l}knob.style.transform=`translate(${dx}px,${dy}px)`;const nx=dx/m,ny=dy/m;const d=Math.hypot(nx,ny);IN.joy.x=d<.18?0:nx;IN.joy.y=d<.18?0:ny};
  const up=e=>{if(e.pointerId!==pid)return;pid=null;knob.style.transform="";IN.joy.x=IN.joy.y=0;base.classList.remove("live");base.style.left=base.style.top=""};
  $("joy").addEventListener("pointerdown",e=>{if(pid!=null)return;pid=e.pointerId;try{$("joy").setPointerCapture(pid)}catch(_){}
    if($("game").classList.contains("t-over")){const jr=$("joy").getBoundingClientRect();base.style.left=(e.clientX-jr.left-base.offsetWidth/2)+"px";base.style.top=(e.clientY-jr.top-base.offsetHeight/2)+"px";base.classList.add("live")}mv(e);e.preventDefault()});
  $("joy").addEventListener("pointermove",e=>{if(e.pointerId===pid)mv(e)});$("joy").addEventListener("pointerup",up);$("joy").addEventListener("pointercancel",up)}
let ABS=[],touch=false;
function aimBtn(b,key){const s=()=>IN.slot[key];let ox=0,oy=0,pid=null;const dot=el("i","aimdot");b.append(dot);
  b.addEventListener("pointerdown",e=>{if(!touch)return;pid=e.pointerId;const r=b.getBoundingClientRect();ox=r.left+r.width/2;oy=r.top+r.height/2;const q=s();q.down=true;q.manual=false;q.mag=0;try{b.setPointerCapture(pid)}catch(_){}b.classList.add("hold");e.preventDefault()});
  b.addEventListener("pointermove",e=>{if(e.pointerId!==pid)return;const dx=e.clientX-ox,dy=e.clientY-oy,l=Math.hypot(dx,dy),q=s();if(l>16){q.manual=true;q.ax=dx/l;q.ay=dy/l;q.mag=clamp((l-16)/56,0,1)}else q.manual=false;
    const m=Math.min(l,34);dot.style.transform=l>16?`translate(${dx/l*m}px,${dy/l*m}px)`:""});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;const q=s();q.down=false;b.classList.remove("hold");dot.style.transform="";if(key!=="b")IN.rel.push(key)};
  b.addEventListener("pointerup",up);b.addEventListener("pointercancel",e=>{if(e.pointerId!==pid)return;pid=null;s().down=false;b.classList.remove("hold");dot.style.transform=""})}
function buildButtons(){const box=$("pad");box.textContent="";ABS=[];const f=G.me,keys=["Q","E","R"];
  const mk=(cls,key,name,hint,type)=>{const b=el("button","ab "+cls);b.type="button";if(type)b.style.setProperty("--tc",TY[type].c);const cd=el("div","cdv");b.append(cd,el("span","nm2",name),el("span","k",hint));box.append(b);ABS.push({b,cd,key});return b};
  aimBtn(mk("pb","b",MOVES[f.mon.basic].n,"คลิกซ้าย",MOVES[f.mon.basic].t),"b");
  f.moves.forEach((k,i)=>{const m=MOVES[k];aimBtn(mk("p"+i,i,m.n,keys[i]+(m.kind==="beam"?" ค้าง":""),mvTypeOf(m,f.key)),i)});
  const d=mk("pd","d","หลบ","SPACE");d.addEventListener("pointerdown",e=>{if(!touch)return;IN.dodge=1;e.preventDefault()});for(const ev of ["pointerup","pointercancel","pointerleave"])d.addEventListener(ev,()=>{if(touch)IN.dodge=0});
  aimBtn(mk("pu","u","ท่าไม้ตาย","F",MOVES[f.mon.ult].t),"u");aimBtn(mk("pi","i","ไอเทม","G",null),"i");itemBtn()}
$("game").addEventListener("contextmenu",e=>e.preventDefault());
/* where a slot would fire right now */
function mouseWorld(){
  /* Map the normalized DOM pointer over the exact world rectangle currently
     visible through the camera. This avoids applying the 2x render zoom twice. */
  if(SCN&&SCN.cameras){const cam=SCN.cameras.main,v=cam&&cam.worldView;if(v&&v.width&&v.height)return{x:v.x+IN.mouse.x*v.width,y:v.y+IN.mouse.y*v.height}}
  return{x:VIEW.camX+IN.mouse.x*VW,y:VIEW.camY+IN.mouse.y*VH}
}
function slotAim(f,key,mv){const s=IN.slot[key],o=other(f),rng=mv.rng||200;
  if(s.manual)return{ax:s.ax,ay:s.ay,mag:s.mag,manual:true};
  if(IN.mouse.on){const p=mouseWorld(),dx=p.x-f.x,dy=p.y-(f.y-(mv.aim==="point"?0:12)),l=Math.hypot(dx,dy)||1;return{ax:dx/l,ay:dy/l,mag:clamp(l/rng,0,1)}}
  if(seenBy(o,f)){const dx=o.x-f.x,dy=o.y-f.y,l=Math.hypot(dx,dy)||1;return{ax:dx/l,ay:dy/l,mag:clamp(l/rng,0,1),auto:true}}
  return{ax:f.ax,ay:f.ay,mag:.7,auto:true}}
const knight=f=>!!(f.U&&f.U.k==="u_knight"&&f.U.t>=.8);const mkey=(f,i)=>f.tank>0?"tk_rocket":f.jet>0?"jt_bomb":knight(f)?KNIGHT[i]:f.moves[i];
const basicKey=f=>giant(f)?"b_giant":f.tank>0?"tk_mg":f.jet>0?"jt_gun":knight(f)?"k_slash":f.mon.basic;
const slotMove=(f,key)=>key==="i"?(f.item?MOVES[ITEMS[f.item.k].mv]:null):MOVES[key==="b"?basicKey(f):key==="u"?f.mon.ult:mkey(f,key)];
function myInput(){const f=G.me;let x=(IN.k.KeyD||IN.k.ArrowRight?1:0)-(IN.k.KeyA||IN.k.ArrowLeft?1:0)+IN.joy.x,y=(IN.k.KeyS||IN.k.ArrowDown?1:0)-(IN.k.KeyW||IN.k.ArrowUp?1:0)+IN.joy.y;
  const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}
  const face=IN.mouse.on?slotAim(f,"b",MOVES[f.mon.basic]):null;
  const rel=IN.rel.map(k=>({i:k,aim:slotAim(f,k,slotMove(f,k)||MOVES[f.mon.basic])}));IN.rel=[];
  return{mx:x,my:y,face,basic:IN.slot.b.down?slotAim(f,"b",MOVES[f.mon.basic]):null,sk:[0,1,2].map(i=>({held:IN.slot[i].down,aim:IN.slot[i].down?slotAim(f,i,MOVES[mkey(f,i)]):null})),rel,dodge:IN.dodge,ua:IN.slot.u.down&&IN.slot.u.manual?slotAim(f,"u",MOVES[f.mon.ult]):null}}

/* ================= layout ================= */
try{touch=matchMedia("(pointer:coarse)").matches}catch(e){}
addEventListener("touchstart",()=>{if(!touch){touch=true;layout()}},{passive:true,once:true});
function layout(){const g=$("game");if(g.hidden)return;const land=innerWidth>innerHeight*1.12;g.classList.toggle("t-over",touch&&land);g.classList.toggle("t-stack",touch&&!land);g.classList.remove("t-sides");
  const r=$("stage").getBoundingClientRect();if(r.width>40&&r.height>40){const asp=clamp(r.width/r.height,1.25,2.25),nvh=touch&&land?372:400,nvw=Math.round(nvh*asp/2)*2;
    if(nvw!==VW||nvh!==VH){VW=nvw;VH=nvh;if(PG&&PG.scale){try{PG.scale.setGameSize(VW*2,VH*2)}catch(e){try{PG.scale.resize(VW*2,VH*2)}catch(_){}}if(SCN&&SCN.cameras){const cam=SCN.cameras.main;cam.setSize(VW*2,VH*2);cam.centerOn(VW/2,VH/2);VIEW.bx=cam.scrollX;VIEW.by=cam.scrollY}}}}
  if(PG&&PG.scale){try{PG.scale.getParentBounds();PG.scale.refresh()}catch(e){}}
  $("rotHint").hidden=!(touch&&!land)}
addEventListener("resize",()=>{layout();setTimeout(layout,120)});addEventListener("orientationchange",()=>setTimeout(layout,250));

/* ================= simulation ================= */
const other=f=>f===G.me?G.op:G.me;
const mvT=(mv,f)=>mv.t==="self"?(f.mon.t[0]||"norm"):mv.t;
const vuln=v=>v.hp>0&&v.under<=0&&v.air<=0&&!(v.inv>0);
const part=(x,y,c,n,sp,life)=>FX.burst(x,y,c,n,sp,life);
const pop=(x,y,txt,c,big)=>FX.pop(x,y,txt,c,big);
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d};
const inCone=(px,py,x,y,ang,rng,arc)=>{const dx=px-x,dy=py-y,d=Math.hypot(dx,dy);return d<rng+12&&(d<14||Math.abs(angDiff(Math.atan2(dy,dx),ang))<arc/2)};
function hitFx(v,d,e,label){v.flash=.14;v.reveal=1;pop(v.x+rnd(-8,8),v.y-40,d>0?"-"+d:"0",e>1?"#ffe066":e<1?"#b8b3cc":"#fff");SFX.play("hit");
  if(e>1.2)pop(v.x,v.y-56,"ได้ผลดีเยี่ยม!","#ffe066",1);else if(e<.8)pop(v.x,v.y-56,"ไม่ค่อยได้ผล","#b8b3cc",1);
  if(label)pop(v.x,v.y-70,label,"#fff",1);G.shake=Math.min(10,G.shake+d*.25);if(d>=17)G.stop=Math.max(G.stop,.055)}
function applyHit(v,att,mv,key,dir,scale){
  if(!v.owned||v.hp<=0||v.hitSet.has(key))return false;if(!att.env&&(att.lv||0)!==(v.lv||0))return false;v.hitSet.add(key);
  const t=mvT(mv,att),e=eff(t,v.mon.t),stab=att.mon.t.includes(t)?1.25:1,grd=v.guard>0;
  let d=Math.max(1,Math.round(mv.pw*(scale||1)*att.mon.atk*(att.rage>0?1.3:1)*(att.b_red>0?1.25:1)*(att.b_boss>0?1.3:1)*(v.b_boss>0?.75:1)*(v.tank>0?.6:1)*(att.dmgMul||1)/v.mon.def*stab*e*(grd?.4:1))),label="";
  if(v.shield>0){const ab=Math.min(v.shield,d);v.shield-=ab;d-=ab;label="ฟองน้ำกัน!";if(v.shield<=0)FX.burst(v.x,v.y-14,"#9ad4ff",18,160,.5)}
  v.hp=Math.max(0,v.hp-d);if(G.units&&!att.env&&att.hp!=null)att.aggroT=G.t+2.5;
  if(!grd&&d>0){if(mv.hard){v.stun=mv.hard;v.bub=mv.hard;v.stunImm=mv.hard+1.6;v.dash=null;v.chg=null;v.kx=v.ky=0;label="ติดฟอง!"}else if(mv.stun&&v.stunImm<=0){v.stun=mv.stun;v.stunImm=mv.stun+1.6;v.dash=null;v.chg=null;label="BONK!"}
    if(mv.chill){v.chill=(v.chill||0)+mv.chill;v.chT=.5;if(v.chill>=3&&!(v.frz>0)){v.chill=0;v.frz=2;v.stun=2;v.stunImm=3.6;v.dash=null;v.chg=null;label="แข็งเป็นน้ำแข็ง!";FX.boom(v.x,v.y-14,"ice",36)}}
    if(mv.slow)v.slow=mv.slow;if(mv.burn){v.burn=mv.burn;v.burnTick=.5}if(mv.kb&&dir){v.kx+=dir[0]*mv.kb;v.ky+=dir[1]*mv.kb}
    if(mv.hook&&!att.env)v.hk={x:att.x,y:att.y,t:.34}}else if(grd)label="การ์ด!";
  if(v.rest>0)v.rest=0;
  hitFx(v,d,e,label);FX.hit(v.x,v.y-12,t);
  v.hits.push([key,d,e>1.2?2:e<.8?0:1]);if(v.hits.length>8)v.hits.shift();
  v.ult=Math.min(100,v.ult+d*.8);if(att.owned&&String(key).indexOf("~")<0)att.ult=Math.min(100,att.ult+d*1.1);
  if(mv.drain&&att.owned&&att.hp>0){const h=Math.round(d*mv.drain);att.hp=Math.min(att.max,att.hp+h);pop(att.x,att.y-40,"+"+h,"#7dffa0")}
  return true}
const victimsOf=own=>own.env?[G.me,G.op].filter(f=>f.owned):[other(own)].filter(f=>f.owned);
/* --- arena interactions --- */
function killProp(p,mine){if(p.dead)return;p.dead=true;if(mine)G.myKills.push(p.i);
  if(p.k==="barrel"){G.blasts.push({id:"envb"+p.i,own:ENV,mv:ENVMV.barrel,x:p.x,y:p.y,t:.06,full:.06});scorch(p.x,p.y,40)}
  else if(p.k==="tree"||p.k==="bush"){G.zones.push({id:"envz"+p.i,own:ENV,mv:ENVMV.burn,x:p.x,y:p.y,t:3,tk:.3,n:0});scorch(p.x,p.y,p.k==="tree"?30:34);part(p.x,p.y-10,"#ff7a3d",18,140,.6)}
  else{part(p.x,p.y-6,PCOL[p.k]||"#c79a5a",16,160,.5);if(p.k!=="icep"&&!p.lv)crater(p.x,p.y,18)}}
const PCOL={crate:"#c79a5a",rock:"#8a858c",cactus:"#49b356",icep:"#cfefff",boulder:"#a89c8a",snowball:"#ffffff",log:"#8a5a2a",tumble:"#b8925a",urn:"#c8743a",pillar:"#d8d0c0",stele:"#9a8a6a",
  car:"#e04a3a",bin:"#4aa04a",hydrant:"#e0402a",lamp:"#7a7e88",bench:"#a87444",vend:"#3a6ad8",cone:"#ff8a2a",desk:"#a87444",shelf:"#8a5a2a",sofa:"#8050b8",plant:"#4aa04a",cooler:"#c4ced8"};
function kickProp(p,att){if(p.kicked)return;p.kicked=1;let dx=p.x-att.x,dy=p.y-att.y;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
  const a={id:att.tag+(++att.seq),m:"pkick",x:p.x,y:p.y,dx:+dx.toFixed(3),dy:+dy.toFixed(3),p:0,tx:p.i,ty:0};att.atks.push(a);if(att.atks.length>8)att.atks.shift();spawnAttack(att,a)}
function propLand(s){const k=KICK[s.prop]||{};if(k.xpl){G.blasts.push({id:s.id+"x",own:s.own,mv:ENVMV.barrel,x:s.x,y:s.y+12,t:0,full:.01});scorch(s.x,s.y+12,40)}else{part(s.x,s.y,PCOL[s.prop]||"#c79a5a",18,170,.5);FX.boom(s.x,s.y,"earth",16)}SFX.play("hit")}
function hurtProp(p,att,mv,type){if(p.dead||!(att.owned||att.env))return;if((p.lv||0)!==(att.env?0:(att.lv||0)))return;const heavy=mv.heavy||0;
  if(p.kick&&!att.env&&!(p.k==="barrel"&&type==="fire")&&mv.kind!=="pkick"){kickProp(p,att);return}
  if(p.k==="tree"||p.k==="bush"){if(type==="fire")killProp(p,!att.env);return}
  if(p.k==="icep"&&type==="fire"){killProp(p,!att.env);return}
  if(p.k==="rock"){if(!(heavy&&(type==="earth"||heavy>=9||mv.kind==="beam")))return;p.hp-=heavy>=9?3:1}else p.hp-=heavy?3:1;
  part(p.x,p.y-6,"#d8c8a8",4,80,.3);if(p.hp<=0)killProp(p,!att.env)}
function hurtTwall(w,mv){w.hp-=mv.heavy?3:1;part(w.x,w.y-8,"#b08a5a",4,80,.3);if(w.hp<=0)w.t=0}
function touchEnv(x,y,r,att,mv,id){const type=mvT(mv,att);
  for(const p of G.A.props){if(p.dead)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<r+(p.k==="bush"||p.k==="tree"?p.R*.6:p.r))hurtProp(p,att,mv,type)}
  for(const w of G.twalls)if(Math.hypot(w.x-x,w.y-y)<r+w.r)hurtTwall(w,mv);
  damageStructures(x,y,r,mv,att);
  if(type==="elec"&&waterNear(x,y,r))zap(id);if(type==="fire")meltIce(x,y,r*.7);
  if(type==="water")for(const l of G.A.lava){if(Math.hypot(l.x-x,l.y-y)<r+l.rx){if(l.cool<=0)part(l.x,l.y,"#e8f4ff",16,90,.8);l.cool=6}}}
function touchEnvLite(x,y,type,id){if(type==="elec"&&inWater(x,y))zap(id);if(type==="fire")meltIce(x,y,0);if(type==="water"){const l=ellAt(G.A.lava,x,y,4);if(l){if(l.cool<=0)part(l.x,l.y,"#e8f4ff",16,90,.8);l.cool=6}}}
function zap(id){if(G.zapSeen.has(id))return;G.zapSeen.add(id);G.zapT=1;G.shake=Math.min(10,G.shake+3);SFX.play("zap");
  for(const f of [G.me,G.op])if(f.owned&&vuln(f)&&f.roll<=0&&inWater(f.x,f.y))applyHit(f,ENV,ENVMV.zap,id+":riv",null)}
const solidAt=(x,y,r)=>G.A.props.find(p=>!p.dead&&p.r>0&&(p.lv||0)===(G.wlv||0)&&Math.hypot(p.x-x,p.y-4-y)<p.r+r)||G.twalls.find(w=>Math.hypot(w.x-x,w.y-4-y)<w.r+r);
function rayLen(x,y,dx,dy,max){for(let d=10;d<max;d+=8){const px=x+dx*d,py=y+dy*d;if(px<0||px>W||py<0||py>H)return d;if(wallAt(px,py,0))return d}return max}
/* --- attacks --- */
function addShots(f,a,mv,n,base,opt){opt=opt||{};for(let i=0;i<n;i++){const ang=mv.fan?base+(n>1?(i/(n-1)-.5)*mv.fan:0):base+(opt.spread!=null?opt.spread:((i%2?1:-1)*.035*Math.ceil(i/2)));
  G.shots.push({id:a.id+":"+(opt.k0||0)+"_"+i,base:a.id,own:f,lv:f.lv||0,mv,x:a.x,y:a.y-12,vx:Math.cos(ang)*mv.sp,vy:Math.sin(ang)*mv.sp,dx:Math.cos(ang),dy:Math.sin(ang),life:mv.life||1.7,rot:0,bt:0,bn:mv.bn||0,w:(opt.w||0)+(mv.gap?i*mv.gap:0)})}}
function spawnAttack(f,a){const mv=MOVES[a.m];if(!mv)return;G.wlv=f.lv||0;
  if(mv.ult&&!a.cut&&!G.cut){G.cut={t:1.05,f,mv,a};SFX.play("ult");return}
  f.reveal=1.2;const ang=Math.atan2(a.dy,a.dx),R=seeded(a.id),type=mvT(mv,f),self=mv.aim!=="point",px=self?a.x:a.tx,py=self?a.y:a.ty;
  if(!["buff","trap","wall"].includes(mv.kind)){
    f.poseK=a.m;f.pose=mv.kind==="leap"?.52:mv.kind==="dash"?.34:mv.kind==="beam"?.46:mv.kind==="breath"?.4:.26;f.poseMax=f.pose;
    if(!mv.basic){const fx=a.x+a.dx*20,fy=a.y-14+a.dy*14;FX.burst(fx,fy,TY[type].c,8,110,.22)}}
  if(f.key==="aurex"&&["b_aurex","aurex_rush","aurex_upper","aurex_wave"].includes(a.m)){
    const fx=a.x+a.dx*22,fy=a.y-14+a.dy*16;if(a.m==="aurex_wave"){FX.burst(fx,fy,"#fff3a0",16,170,.3);G.shake=Math.max(G.shake,3)}
    else if(a.m==="aurex_upper"){FX.boom(a.x,a.y-4,"metal",28);part(a.x,a.y,"#ffd84a",12,130,.35)}
    else if(a.m==="aurex_rush"){FX.burst(fx,fy,"#ffd84a",12,150,.25);G.shake=Math.max(G.shake,2)}
    else part(fx,fy,"#fff3a0",7,90,.2)}
  switch(mv.kind){
    case"shot":addShots(f,a,mv,mv.cnt||1,ang);SFX.play("shot",type);break;
    case"melee":{G.slashes.push({own:f,mv,x:a.x,y:a.y-12,ang,t:.22,full:.22});SFX.play("melee",type);
      for(const p of G.A.props)if(!p.dead&&inCone(p.x,p.y-8,a.x,a.y-12,ang,mv.rng,mv.arc))hurtProp(p,f,mv,type);for(const w of G.twalls)if(inCone(w.x,w.y-8,a.x,a.y-12,ang,mv.rng,mv.arc))hurtTwall(w,mv);
      touchEnvLite(a.x+a.dx*mv.rng*.6,a.y+a.dy*mv.rng*.6,type,a.id);hurtMinions(f,(x,y)=>inCone(x,y,a.x,a.y-12,ang,mv.rng,mv.arc),mv.pw,a.id);
      const v=other(f);if(v.owned&&vuln(v)&&v.ifr<=0&&inCone(v.x,v.y-12,a.x,a.y-12,ang,mv.rng,mv.arc))applyHit(v,f,mv,a.id,[a.dx,a.dy]);break}
    case"breath":G.cones.push({id:a.id,own:f,mv,t:mv.dur,tk:0,n:0});if(f.owned)f.cast=mv.dur;SFX.play("beam",type);break;
    case"dash":f.dash={t:mv.dur,dx:a.dx,dy:a.dy,mv,id:a.id};part(f.x,f.y,TY[type].c,6,90,.3);SFX.play("dash",type);
      if(mv.wallAfter){const ex=a.x+a.dx*(mv.sp*mv.dur+34),ey=a.y+a.dy*(mv.sp*mv.dur+34);for(const k of [-1,0,1])G.twalls.push({id:a.id+":w"+k,own:f,x:clamp(ex-a.dy*k*29,FR+10,W-FR-10),y:clamp(ey+a.dx*k*29,FR+16,H-FR-6),r:15,hp:4,t:5,born:G.t+mv.dur,ice:1})}break;
    case"slam":G.blasts.push({id:a.id,own:f,mv,x:a.x,y:a.y,t:mv.delay,full:mv.delay||.01});if(f.owned&&mv.delay)f.root=mv.delay;break;
    case"strike":G.blasts.push({id:a.id,own:f,mv,x:px,y:py,t:mv.delay,full:mv.delay,ox:a.x,oy:a.y-14});if(mv.lob)SFX.play("dash",type);break;
    case"zone":G.blasts.push({id:a.id,own:f,mv,x:px,y:py,t:mv.delay,full:mv.delay||.01});break;
    case"rain":for(let k=0;k<mv.num;k++){const an=R()*6.283,rr=Math.sqrt(R())*mv.rad;G.blasts.push({id:a.id+":"+k,own:f,mv:MOVES.meteor,x:clamp(px+Math.cos(an)*rr,FR,W-FR),y:clamp(py+Math.sin(an)*rr,FR,H-FR),t:.45+k*.2,full:.5,fall:1,zone:k%2===0})}break;
    case"trap":{const mine=G.traps.filter(t=>t.own===f);if(mine.length>=3)mine[0].t=0;G.traps.push({id:a.id,own:f,mv,x:px,y:py,arm:.6,t:18});part(px,py,"#6fd06a",8,80,.4);break}
    case"wall":for(const k of [-1,0,1])G.twalls.push({id:a.id+":"+k,own:f,x:clamp(px-a.dy*k*29,FR+10,W-FR-10),y:clamp(py+a.dx*k*29,FR+16,H-FR-6),r:15,hp:4,t:mv.dur,born:G.t,ice:mv.ice?1:0});SFX.play("boom");G.shake=Math.min(10,G.shake+3);break;
    case"orbit":G.orbits.push({id:a.id,own:f,mv,t:mv.dur,a:0,hc:0,n:0,et:0});SFX.play("buff");break;
    case"blink":FX.boom(a.x,a.y-12,type,26);FX.boom(px,py-12,type,30);G.blasts.push({id:a.id,own:f,mv:MOVES.blinkout,x:a.x,y:a.y,t:.3,full:.3});if(f.owned){f.x=px;f.y=py;f.ifr=Math.max(f.ifr,.2);collide(f)}else{f.x=px;f.y=py}SFX.play("zap");break;
    case"dig":if(f.owned)f.under=.95;crater(a.x,a.y,26,1);part(a.x,a.y,"#8a5a2a",12,120,.5);break;
    case"buff":if(f.owned){if(mv.buff==="guard")f.guard=1.6;else if(mv.buff==="haste")f.haste=4;else if(mv.buff==="shield"){f.shield=32;f.shieldT=5}else if(mv.buff==="armor")f.guard=3;else if(mv.buff==="cloak"){f.cloak=3.5;f.haste=Math.max(f.haste,3.5)}else f.rest=1}if(mv.buff==="cloak")f.reveal=0;part(f.x,f.y-12,TY[type].c,10,80,.5);SFX.play("buff");break;
    case"leap":if(f.owned){f.air=f.airT=.5;f.jx=(a.tx-a.x)/.5;f.jy=(a.ty-a.y)/.5;f.land=mv.land||"leapland"}part(a.x,a.y,"#fff",8,90,.3);SFX.play("dash");break;
    case"ring":G.rings.push({id:a.id,own:f,mv,x:a.x,y:a.y,r:10,max:mv.max,sp:250,done:false});SFX.play("beam",type);break;
    case"beam":{const p=clamp(a.p||0,0,1);G.beams.push({id:a.id,own:f,mv,x:a.x,y:a.y-12,dx:a.dx,dy:a.dy,p,wd:8+14*p,sc:.4+.6*p,w:0,t:.26,done:false,len:rayLen(a.x,a.y,a.dx,a.dy,1200)});if(f.owned&&mv.recoil){f.kx-=a.dx*mv.recoil*(.45+.55*p);f.ky-=a.dy*mv.recoil*(.45+.55*p)}SFX.play("beam",type);break}
    case"fly":if(f.owned){f.fly=9;f.dash=null}FX.burst(a.x,a.y-20,"#ffffff",24,180,.6);SFX.play("buff");break;
    case"drive":if(f.owned){f.car=8;f.dash=null}FX.boom(a.x,a.y,"metal",34);SFX.play("dash","metal");break;
    case"capsule":G.blasts.push({id:a.id,own:f,mv,x:a.tx,y:a.ty,t:.7,full:.7,ox:a.x,oy:a.y-16,lob:"i_capsule",ls:2.2,lh:100,cap:1});SFX.play("dash");break;
    case"turret":if(f.owned)f.minions.push({id:a.id+"~t",k:6,x:a.tx,y:a.ty,hp:60,mx:60,t:14,hc:0,wk:0,w:.6,an:0});FX.boom(a.tx,a.ty,"metal",24);SFX.play("buff");break;
    case"pkick":{const pr=G.A.props[a.tx|0];if(!pr||pr.gone)break;pr.dead=true;pr.gone=1;pr.kicked=1;const km=MOVES["k_"+pr.k]||MOVES.k_urn;
      G.shots.push({id:a.id,base:a.id,own:f,mv:km,x:pr.x,y:pr.y-10,vx:a.dx*km.sp,vy:a.dy*km.sp,dx:a.dx,dy:a.dy,life:km.life,rot:0,bt:0,bn:km.bn||1,w:0,prop:pr.k,lv:pr.lv||0});part(pr.x,pr.y,"#ffffff",8,120,.3);SFX.play("dash");break}
    case"clone":if(f.owned){for(const s of [-1,1])f.minions.push({id:a.id+":"+s,x:clamp(a.x-a.dy*s*30,FR,W-FR),y:clamp(a.y+a.dx*s*30,FR+10,H-FR),hp:22,t:10,hc:.6,wk:0})}part(a.x,a.y-12,"#fff",16,140,.5);SFX.play("buff");break;
    case"tank":case"jet":case"tstop":case"collar":case"clones":specialUse(f,a,mv);break;
    default:if(ULT[mv.kind])startUlt(f,a,mv);
  }}
function record(f,m,aim,p){const mv=MOVES[m];aim=aim||{ax:f.ax,ay:f.ay,mag:.7};const rng=mv.rng||160,mg=mv.aim==="point"?Math.max(.12,aim.mag==null?.7:aim.mag):1;
  const a={id:f.tag+(++f.seq),m,x:Math.round(f.x),y:Math.round(f.y),dx:+aim.ax.toFixed(3),dy:+aim.ay.toFixed(3),p:p||0,tx:Math.round(clamp(f.x+aim.ax*rng*mg,FR+8,W-FR-8)),ty:Math.round(clamp(f.y+aim.ay*rng*mg,FR+18,H-FR))};
  if(mv.aim!=="self"){f.ax=aim.ax;f.ay=aim.ay;f.faceT=.4}
  if(mv.drain)G.myDrain.set(a.id,mv);f.atks.push(a);if(f.atks.length>12)f.atks.shift();spawnAttack(f,a);return a}
function collide(f){f.x=clamp(f.x,FR+8,W-FR-8);f.y=clamp(f.y,FR+18,H-FR);if(f.air>0||f.fly>0)return;if(G.A.collide&&G.A.collide(f))return;
  for(const w of G.A.walls){if((w.lv||0)!==(f.lv||0)||w.dead||(w.sky&&w.sky.dead))continue;const nx=clamp(f.x,w.x,w.x+w.w),ny=clamp(f.y,w.y,w.y+w.h);if(wallOpen(w,nx,ny,9))continue;let dx=f.x-nx,dy=f.y-ny;const d=Math.hypot(dx,dy),r=11;
    if(d<r){if(d<.01){const cx=w.x+w.w/2,cy=w.y+w.h/2;if(Math.abs(f.x-cx)/w.w>Math.abs(f.y-cy)/w.h)f.x=f.x<cx?w.x-r:w.x+w.w+r;else f.y=f.y<cy?w.y-r:w.y+w.h+r}else{f.x+=dx/d*(r-d);f.y+=dy/d*(r-d)}}}
  if(f.under>0)return;
  const push=(px,py,pr)=>{let dx=f.x-px,dy=f.y-py;const d=Math.hypot(dx,dy),r=pr+9;if(d<r){if(d<.01){dx=1;dy=0}f.x+=dx/(d||1)*(r-d);f.y+=dy/(d||1)*(r-d)}};
  for(const p of G.A.props)if(!p.dead&&p.r&&(p.lv||0)===(f.lv||0))push(p.x,p.y,p.r);if(G.units)for(const u of G.units)if(UK[u.k].solid)push(u.x,u.y,UK[u.k].r-4);if(!f.lv)for(const w of G.twalls)push(w.x,w.y,w.r)}
function tick(f,dt){for(const k of ["stun","stunImm","slow","guard","haste","roll","ifr","root","dodgeCd","flash","reveal","cdB","cast","faceT","padCd","shieldT","cloak","inv","busy","bub","fly","car","rage","regen","cdr","cdI","carHc","b_red","b_blue","b_boss","frz","chT","tank","jet","pose"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
  if(f.chT<=0&&f.chill>0)f.chill=Math.max(0,f.chill-dt*1.5);
  for(let i=0;i<3;i++)if(f.cds[i]>0)f.cds[i]=Math.max(0,f.cds[i]-dt*(f.cdr>0?2:1)*(f.b_blue>0?1.5:1));if(f.shieldT<=0)f.shield=0}
function envOwned(f,dt){if(G.A.envHook)G.A.envHook(f,dt);const A=G.A,gr=f.air<=0&&f.under<=0&&f.fly<=0&&f.car<=0;if(!gr)return{mul:1,ice:false};let mul=1,ice=false;
  const hole=A.holes.find(h=>(h.arm||0)<=0&&(h.lv||0)===(f.lv||0)&&Math.hypot(f.x-h.x,f.y-h.y)<h.r-7);if(hole&&f.roll<=0){if(f.lv){f.lv=0;f.hp=Math.max(0,f.hp-28);f.stun=Math.max(f.stun,.7);f.kx+=(f.x-hole.x)*8;f.ky+=(f.y-hole.y)*8;pop(f.x,f.y-55,"พื้นชั้นบนทะลุ!","#ff9a8a",1)}else{f.hp=0;f.stun=1;pop(f.x,f.y-58,"ตกลงไปในหลุม!","#ff6a6a",1)}FX.mega(hole.x,hole.y,"shadow",hole.r);G.shake=Math.max(G.shake,9);return{mul:0,ice:false}}
  const wet=inWater(f.x,f.y);if(wet){mul*=f.mon.t.includes("water")?1.25:.6;if(f.burn>0)f.burn=0}
  if(ellAt(A.ice,f.x,f.y))ice=true;
  const sd=ellAt(A.sand,f.x,f.y);if(sd){mul*=f.mon.t.includes("earth")?.85:.5;const dx=sd.x-f.x,dy=sd.y-f.y,d=Math.hypot(dx,dy)||1;if(d>4&&f.roll<=0){f.x+=dx/d*34*dt;f.y+=dy/d*34*dt}}
  const lv=ellAt(A.lava,f.x,f.y),bg2=ellAt(A.bog,f.x,f.y);if(bg2&&!f.mon.t.includes("grass"))mul*=.7;
  if(f.roll<=0&&((lv&&lv.cool<=0&&!f.mon.t.includes("fire"))||(bg2&&!f.mon.t.includes("grass")))){f.envT-=dt;if(f.envT<=0){f.envT=.65;applyHit(f,ENV,lv&&lv.cool<=0?ENVMV.lava:ENVMV.bog,"env"+f.tag+G.t.toFixed(1),null)}}else f.envT=Math.min(f.envT,.25);
  if(f.cacT>0)f.cacT-=dt;else for(const p of A.props)if(!p.dead&&p.k==="cactus"&&Math.hypot(p.x-f.x,p.y-f.y)<p.r+13){f.cacT=.8;const d=Math.hypot(f.x-p.x,f.y-p.y)||1;applyHit(f,ENV,ENVMV.cactus,"envc"+f.tag+G.t.toFixed(1),[(f.x-p.x)/d,(f.y-p.y)/d]);break}
  if(A.spring&&Math.hypot(A.spring.x-f.x,A.spring.y-f.y)<A.spring.r){f.sprT-=dt;if(f.sprT<=0){f.sprT=.6;if(f.hp<f.max){f.hp=Math.min(f.max,f.hp+3);pop(f.x+rnd(-8,8),f.y-40,"+3","#7dffe0")}}}
  if(f.padCd<=0)for(let i=0;i<A.pads.length;i++){const p=A.pads[i];if(Math.hypot(p.x-f.x,p.y-f.y)<18){const q=A.pads[1-i];FX.boom(f.x,f.y-12,"wind",26);f.x=q.x;f.y=q.y+2;f.padCd=3;f.ifr=Math.max(f.ifr,.25);FX.boom(q.x,q.y-12,"wind",30);SFX.play("zap");break}}
  return{mul,ice}}
function updOwned(f,inp,dt){const o=other(f);tick(f,dt);
  if(f.hp<=0){f.dash=null;f.chg=null;f.minions.length=0;f.item=null;
    if(G.A.respawn&&!G.over){if(f.respT==null){f.respT=G.A.respawn;f.tank=f.jet=f.fly=0;if(G.units)giveCoins(other(f),SHOP.KILL,f.x,f.y);pop(f.x,f.y-60,f===G.me?"คุณถูกกำจัด":"ศัตรูถูกกำจัด","#ff8a8a",1)}f.respT-=dt;
      if(f.respT<=0){f.respT=null;f.hp=f.max;const h=f.home||[f.x,f.y];f.x=h[0];f.y=h[1];f.inv=2;f.ifr=2;f.burn=0;f.slow=0;f.stun=0;f.bub=0;FX.burst(f.x,f.y-20,"#ffffff",30,200,.6);if(f===G.me&&typeof itemBtn==="function")itemBtn()}}
    return}
  if(frozenByTime(f)){f.stun=Math.max(f.stun,.12);f.dash=null}
  if(f.b_boss>0){f.bT=(f.bT||0)-dt;if(f.bT<=0){f.bT=1;heal(f,3)}}
  const act=G.cd<=0&&!G.over;if(act)f.ult=Math.min(100,f.ult+dt*1.6);
  const env=envOwned(f,dt);
  if(f.burn>0){f.burn-=dt;f.burnTick-=dt;if(f.burnTick<=0){f.burnTick=.5;f.hp=Math.max(0,f.hp-2);f.reveal=1;pop(f.x+rnd(-6,6),f.y-36,"-2","#ff9a4a");f.hits.push(["b"+f.seq+G.t.toFixed(1),2,1]);if(f.hits.length>8)f.hits.shift()}}
  if(f.regen>0){f.regT-=dt;if(f.regT<=0){f.regT=.5;heal(f,3)}}
  if(f.rest>0){f.rest-=dt;if(f.rest<=0){f.hp=Math.min(f.max,f.hp+26);pop(f.x,f.y-40,"+26","#7dffa0")}}
  if(f.under>0){f.under-=dt;if(f.under<=0){f.under=0;record(f,"digout");f.ifr=Math.max(f.ifr,.1)}}
  let vx=0,vy=0,um=null;const sp=(giant(f)?.9:1)*(f.tank>0?.85:1)*(f.car>0?2.3:f.fly>0?1.45:1)*(f.spdMul||1)*f.mon.spd*(f.slow>0&&f.car<=0?.55:1)*(f.haste>0?1.5:1)*(f.under>0?1.3:1)*(f.chg?.45:1)*(f.cast>0?.5:1)*env.mul;
  const free=f.stun<=0&&f.rest<=0&&f.root<=0;
  const U=f.U,UH=U&&ULT[U.k];
  if(UH&&UH.move&&(um=UH.move(U,f,inp,dt))){vx=um[0];vy=um[1]}
  else if(f.air>0){vx=f.jx;vy=f.jy;f.air-=dt;if(f.air<=0){f.air=0;collide(f);record(f,f.land||"leapland")}}
  else if(f.hk){const dx=f.hk.x-f.x,dy=f.hk.y-f.y,d=Math.hypot(dx,dy)||1;f.hk.t-=dt;if(d<48||f.hk.t<=0)f.hk=null;else{vx=dx/d*540;vy=dy/d*540}}
  else if(f.dash){vx=f.dash.dx*f.dash.mv.sp;vy=f.dash.dy*f.dash.mv.sp;f.dash.t-=dt;if(f.dash.t<=0)f.dash=null}
  else if(f.roll>0){vx=f.rdx*330;vy=f.rdy*330}
  else if(free){vx=inp.mx*sp;vy=inp.my*sp}
  if(env.ice&&!f.dash&&f.roll<=0&&!f.hk&&f.air<=0){const k=Math.min(1,dt*2.4);f.ivx+=(vx-f.ivx)*k;f.ivy+=(vy-f.ivy)*k;vx=f.ivx;vy=f.ivy}else{f.ivx=vx;f.ivy=vy}
  f.moving=Math.hypot(vx,vy)>10;const ox=f.x,oy=f.y;f.x+=(vx+f.kx)*dt;f.y+=(vy+f.ky)*dt;const k=Math.pow(.0015,dt);f.kx*=k;f.ky*=k;collide(f);
  if(um&&UH.bounce)UH.bounce(U,f,(f.x-ox)/dt,(f.y-oy)/dt,vx,vy);
  if(U&&U.steer&&f.stun<=0){const w=inp.ua||inp.face||(Math.hypot(inp.mx,inp.my)>.3?{ax:inp.mx,ay:inp.my}:null);if(w){const cur=Math.atan2(f.ay,f.ax),na=cur+clamp(angDiff(Math.atan2(w.ay,w.ax),cur),-3*dt,3*dt);f.ax=Math.cos(na);f.ay=Math.sin(na);f.faceT=.2}}
  else if(!f.dash&&f.air<=0&&f.roll<=0&&f.stun<=0){if(inp.face){f.ax=inp.face.ax;f.ay=inp.face.ay}else if(f.faceT<=0){const l=Math.hypot(inp.mx,inp.my);if(l>.3){f.ax=inp.mx/l;f.ay=inp.my/l}}}
  updMinions(f,dt);
  if(!act){f.chg=null;return}
  const can=free&&f.busy<=0&&f.car<=0&&!f.dash&&f.roll<=0&&f.under<=0&&f.air<=0&&!f.hk;
  if(f.chg){const s=inp.sk[f.chg.i];f.chg.t+=dt;f.reveal=.3;if(s.aim){f.ax=s.aim.ax;f.ay=s.aim.ay;f.chg.aim=s.aim}
    const rel=inp.rel.find(r=>r.i===f.chg.i);
    if(f.stun>0)f.chg=null;else if(rel||!s.held||f.chg.t>1.7){const t=f.chg.t,i=f.chg.i,aim=(rel&&rel.aim)||f.chg.aim||{ax:f.ax,ay:f.ay,mag:1};f.chg=null;if(t>=.18){f.cds[i]=MOVES[mkey(f,i)].cd;record(f,mkey(f,i),aim,clamp((t-.18)/.9,0,1))}}return}
  if(!can)return;
  const ur=inp.rel.find(r=>r.i==="u");
  const irl=inp.rel.find(r=>r.i==="i");if(irl&&f.item&&useItem(f,irl.aim))return;
  if(ur&&f.ult>=100){f.ult=0;f.ifr=Math.max(f.ifr,1.1);record(f,f.mon.ult,ur.aim);return}
  if(inp.dodge&&f.dodgeCd<=0){let dx=inp.mx,dy=inp.my;if(Math.hypot(dx,dy)<.2){dx=f.ax;dy=f.ay}const l=Math.hypot(dx,dy)||1;f.rdx=dx/l;f.rdy=dy/l;f.roll=.28;f.ifr=.34;f.dodgeCd=2.2;part(f.x,f.y,"#fff",5,60,.3);SFX.play("dash","wind");return}
  for(let i=0;i<3;i++){const mv=MOVES[mkey(f,i)];if(f.cds[i]>0)continue;
    if(mv.kind==="beam"){if(inp.sk[i].held){f.chg={i,t:0,aim:inp.sk[i].aim};return}continue}
    const r=inp.rel.find(q=>q.i===i);if(r){f.cds[i]=mv.cd;record(f,mkey(f,i),r.aim);return}}
  if(inp.basic&&f.cdB<=0){const bk=basicKey(f),mv=MOVES[bk];f.cdB=mv.cd;record(f,bk,inp.basic)}}
function updMinions(f,dt){const o=other(f);for(let i=f.minions.length-1;i>=0;i--){const m=f.minions[i];if(m.lv==null)m.lv=f.lv||0;G.wlv=m.lv;m.t-=dt;m.wk+=dt*8;if(m.hp<=0||m.t<=0){if(m.k===1||m.k===7){FX.boom(m.x,m.y-12,"shadow",m.k===7?20:30);if(m.k===1)SFX.play("zap")}else part(m.x,m.y-8,"#fff",8,90,.3);f.minions.splice(i,1);continue}
    if(m.k===1){phantomAI(f,o,m,dt);continue}
    if(m.k===7){cloneAI(f,m,dt);continue}
    if(m.k>=2){buddyAI(f,o,m,dt);continue}
    if(G.cd>0)continue;const hid=!seenBy(o,m);let dx=(hid?f.x:o.x)-m.x,dy=(hid?f.y:o.y)-m.y;const d=Math.hypot(dx,dy)||1;
    if(d>18){m.x+=dx/d*128*dt;m.y+=dy/d*128*dt}for(const p of G.A.props){if(p.dead||!p.r)continue;const ex=m.x-p.x,ey=m.y-p.y,e=Math.hypot(ex,ey)||1;if(e<p.r+7){m.x+=ex/e*(p.r+7-e);m.y+=ey/e*(p.r+7-e)}}
    const w=wallAt(m.x,m.y,6);if(w){const cx=w.x+w.w/2,cy=w.y+w.h/2;if(Math.abs(m.x-cx)/w.w>Math.abs(m.y-cy)/w.h)m.x=m.x<cx?w.x-7:w.x+w.w+7;else m.y=m.y<cy?w.y-7:w.y+w.h+7}}}
function minionContact(a,dt){const v=other(a);for(const m of a.minions){if(m.hc>0){m.hc-=dt;continue}
    if(m.k>=2&&m.k!==3)continue;
    if((m.lv||0)!==(v.lv||0))continue;
    if(m.k===1||m.k===3){if(m.ds===1&&v.owned&&vuln(v)&&v.ifr<=0&&Math.hypot(m.x-v.x,m.y-v.y)<28){m.hc=.5;m.n=(m.n||0)+1;applyHit(v,a,m.k===3?MOVES.bt_dash:MOVES.phclone,m.id+":c"+m.n+"_"+((G.t*10)|0),[Math.cos(m.an),Math.sin(m.an)])}continue}
    if(v.owned&&vuln(v)&&v.ifr<=0&&Math.hypot(m.x-v.x,m.y-v.y)<24){m.hc=.8;m.n=(m.n||0)+1;applyHit(v,a,MOVES.clone,m.id+":c"+m.n+"_"+((G.t*10)|0),null)}}}
function hurtMinions(att,test,pw,key){if(att.env)return false;if(G.units&&hurtUnits(att,test,pw,key))return true;const o=other(att);let any=false;for(const m of o.minions){if(m.hp<=0||!test(m.x,m.y-8))continue;any=true;m.hs=m.hs||new Set();if(m.hs.has(key))continue;m.hs.add(key);part(m.x,m.y-8,"#fff",4,70,.25);if(o.owned)m.hp-=pw}return any}
const segDist=(px,py,x,y,dx,dy,len)=>{const t=(px-x)*dx+(py-y)*dy;return t<0||t>(len||1e9)?1e9:Math.abs((px-x)*dy-(py-y)*dx)};
/* --- bot: same inputs as a player --- */
const BOTLV={easy:{n:"ง่าย",err:.55,t0:1.2,t1:2.2,dodge:.1,dmg:.65,spd:.9,grab:150,lead:0,ult:.35},hard:{n:"ยาก",err:.14,t0:.55,t1:1.25,dodge:1,dmg:1,spd:1,grab:300,lead:0,ult:1},god:{n:"เทพ",err:.03,t0:.28,t1:.65,dodge:2.6,dmg:1.15,spd:1.08,grab:420,lead:1,ult:1}};
function botInput(f,dt){let o=G.me;const b=f.ai,A=G.A,P=b.P||BOTLV.hard;let seen=seenBy(o,f),plan=null;
  if(G.units){plan=mobaBotPlan(f);if(plan.unit){const u=plan.unit;o={x:u.x,y:u.y,under:0,cloak:0,reveal:1,burn:0,hp:1,lv:0,ky:0,fake:1};seen=true}else if(plan.goal){seen=false;b.lx=plan.goal[0];b.ly=plan.goal[1]}}
  if(seen){b.lx=o.x;b.ly=o.y}
  const ovx=b.ox==null?0:(o.x-b.ox)/Math.max(dt,.001),ovy=b.oy==null?0:(o.y-b.oy)/Math.max(dt,.001);b.ox=o.x;b.oy=o.y;b.vx=(b.vx||0)*.8+ovx*.2;b.vy=(b.vy||0)*.8+ovy*.2;
  if(P.lead&&seen){const tt=Math.min(.6,Math.hypot(o.x-f.x,o.y-f.y)/520);b.lx=o.x+b.vx*tt;b.ly=o.y+b.vy*tt}
  let dx=b.lx-f.x,dy=b.ly-f.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const basic=MOVES[f.mon.basic],melee=basic.kind==="melee";
  b.st-=dt;if(b.st<=0){b.s=Math.random()<.5?-1:1;b.st=rnd(.8,2)}
  const want=o.under>0?250:!seen?30:o.fake?(melee?40:150):melee?46:190;
  if(plan&&plan.ret){const e=Math.hypot(b.lx-f.x,b.ly-f.y)||1;return{mx:(b.lx-f.x)/e,my:(b.ly-f.y)/e,face:null,basic:null,sk:[0,1,2].map(()=>({held:false,aim:null})),rel:[],dodge:0}}const fw=d>want+26?1:d<want-46?-1:0;let mx=dx*fw-dy*b.s*(melee?.35:.8),my=dy*fw+dx*b.s*(melee?.35:.8);
  const push=(x,y,r,k)=>{const ex=f.x-x,ey=f.y-y,e=Math.hypot(ex,ey)||1;if(e<r){mx+=ex/e*k*(1-e/r+.3);my+=ey/e*k*(1-e/r+.3)}};
  for(const z of G.zones)if(z.own!==f&&z.mv.pw>0)push(z.x,z.y,z.mv.rad+22,2);for(const bl of G.blasts)if(bl.own!==f)push(bl.x,bl.y,bl.mv.rad+24,2.4);for(const t of G.traps)if(t.own!==f)push(t.x,t.y,46,2);
  for(const l of A.lava)if(l.cool<=0&&!f.mon.t.includes("fire"))push(l.x,l.y,l.rx+26,2.6);for(const l of A.bog)if(!f.mon.t.includes("grass"))push(l.x,l.y,l.rx+18,1.6);for(const l of A.sand)push(l.x,l.y,l.rx+14,1.8);
  for(const p of A.props)if(!p.dead&&p.r)push(p.x,p.y,p.r+(p.k==="cactus"?30:22),p.k==="cactus"?2:1.2);for(const w of G.twalls)push(w.x,w.y,w.r+22,1.4);
  for(const w of A.walls){const nx=clamp(f.x,w.x,w.x+w.w),ny=clamp(f.y,w.y,w.y+w.h);if(Math.hypot(f.x-nx,f.y-ny)<26){push(nx,ny,26,2);mx+=-dy*b.s*.9;my+=dx*b.s*.9}}
  if(!f.mon.t.includes("water"))for(const w of A.water)if(!w.e&&f.x>w.x-26&&f.x<w.x+w.w+26){const br=A.bridges.reduce((m,r)=>Math.abs(r.y+r.h/2-f.y)<Math.abs(m.y+m.h/2-f.y)?r:m,A.bridges[0]);if(br&&Math.abs(br.y+br.h/2-f.y)>14)my+=Math.sign(br.y+br.h/2-f.y)*1.6}
  if(A.spring&&f.hp<f.max*.45)push(A.spring.x,A.spring.y,600,-1.2);
  if(f.U&&f.U.k==="u_shell"){mx=dx;my=dy}
  if(A.botGoal){const g=A.botGoal(f,o);if(g){const ex=g[0]-f.x,ey=g[1]-f.y,e=Math.hypot(ex,ey)||1;mx=ex/e;my=ey/e}}
  {const it=G.items.filter(t=>(t.lv||0)===(f.lv||0)).reduce((m,t)=>{const e=Math.hypot(t.x-f.x,t.y-f.y);return e<m.e?{t,e}:m},{t:null,e:1e9});
    if(it.t&&it.e<(P.grab||300)&&(!seen||d>140||it.e<90)){const ex=it.t.x-f.x,ey=it.t.y-f.y;mx=ex/it.e;my=ey/it.e}}
  const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
  const er=rnd(-P.err,P.err),ca=Math.cos(er),sa=Math.sin(er),aim=(rng)=>({ax:dx*ca-dy*sa,ay:dx*sa+dy*ca,mag:clamp(d/(rng||200),0,1)});
  const sk=[0,1,2].map(()=>({held:false,aim:null})),rel=[];let bas=null;
  if(G.cd<=0&&o.under<=0){
    if(seen&&(melee?d<basic.rng+18:d<300)&&b.hold==null)bas=aim();
    if(b.hold){b.hold.t-=dt;const i=b.hold.i;sk[i].aim=aim();if(b.hold.t>0)sk[i].held=true;else{rel.push({i,aim:aim()});b.hold=null}}
    else{b.t-=dt;if(b.t<=0&&(seen||Math.random()<.2)){b.t=rnd(P.t0,P.t1);
      if(f.ult>=100&&seen&&d<340&&Math.random()<P.ult)rel.push({i:"u",aim:aim(MOVES[f.mon.ult].rng)});
      else{const av=[];for(let i=0;i<3;i++){const m=MOVES[f.moves[i]];if(f.cds[i]>0)continue;
          if(m.buff==="rest"&&f.hp>f.max*.55)continue;if(m.heal&&f.hp>f.max*.7)continue;if(m.buff==="shield"&&f.shield>0)continue;if(m.kind==="slam"&&d>m.rad+10)continue;if(m.kind==="ring"&&d>m.max)continue;if(m.kind==="orbit"&&d>170)continue;
          if(m.kind==="dash"&&d>230)continue;if((m.kind==="breath")&&d>m.rng+10)continue;if(m.aim==="point"&&m.kind!=="wall"&&m.kind!=="blink"&&d>(m.rng||200)+30)continue;if(m.kind==="leap"&&d<90)continue;if(m.kind==="blink"&&d<160&&f.hp>f.max*.4)continue;av.push(i)}
        if(av.length){const i=av[(Math.random()*av.length)|0],m=MOVES[f.moves[i]];if(m.kind==="beam"){b.hold={i,t:rnd(.5,1)};sk[i].held=true;sk[i].aim=aim()}
          else if(m.kind==="blink"&&f.hp<=f.max*.4)rel.push({i,aim:{ax:-dx,ay:-dy,mag:1}});else if(m.kind==="wall")rel.push({i,aim:{ax:dx,ay:dy,mag:.5}});else rel.push({i,aim:aim(m.rng)})}}}}}
  if(f.item&&G.cd<=0&&o.under<=0&&f.cdI<=0){const ik=f.item.k,im=MOVES[ITEMS[ik].mv];if(["wings","car","totem","tank","jet","scroll"].includes(ik)?Math.random()<dt*.6:ik==="clock"?(seen&&d<420&&Math.random()<dt*2):ik==="collar"?(!!collarTarget(f)&&Math.random()<dt*2):(seen&&d<(im.rng||320)+30&&Math.random()<dt*2))rel.push({i:"i",aim:aim(im.rng)})}
  let dodge=0;for(const s of G.shots)if(s.own!==f&&s.w<=0){const ex=f.x-s.x,ey=f.y-s.y,dd=Math.hypot(ex,ey);if(dd<80+P.dodge*20&&(ex*s.vx+ey*s.vy)>0&&Math.random()<dt*3*P.dodge)dodge=1}
  for(const r of G.rings)if(r.own!==f&&Math.abs(Math.hypot(f.x-r.x,f.y-r.y)-r.r)<26&&Math.random()<dt*14*P.dodge)dodge=1;
  if(P.dodge>2)for(const bl of G.blasts)if(bl.own!==f&&bl.t<.35&&Math.hypot(f.x-bl.x,f.y-bl.y)<(bl.mv.rad||40)+12&&Math.random()<dt*20)dodge=1;
  return{mx,my,face:seen?aim():null,basic:bas,sk,rel,dodge}}
function updPuppet(f,dt){tick(f,dt);const k=Math.min(1,dt*16);const px=f.x,py=f.y;f.x+=(f.tx-f.x)*k;f.y+=(f.ty-f.y)*k;f.moving=Math.abs(f.x-px)+Math.abs(f.y-py)>.3;
  for(const t of ["burn","rest","under","air"])if(f[t]>0)f[t]-=dt;f.chgF=Math.max(0,f.chgF-dt);if(f.dash){f.dash.t-=dt;if(f.dash.t<=0)f.dash=null}
  for(const m of f.minions){m.x+=(m.tx-m.x)*k;m.y+=(m.ty-m.y)*k;m.wk+=dt*8}}
function updWorld(dt){const A=G.A;
  for(const pair of [[G.me,G.op],[G.op,G.me]]){const a=pair[0],v=pair[1];minionContact(a,dt);
    if(a.car>0&&vuln(v)&&v.owned&&v.ifr<=0&&Math.hypot(a.x-v.x,a.y-v.y)<36&&(v.carT=(v.carT||0))<=G.t){v.carT=G.t+.7;applyHit(v,a,MOVES.it_carhit,a.tag+"car"+((G.t*10)|0),[a.ax,a.ay]);G.shake=8}
    if(a.car>0)hurtMinions(a,(x,y)=>Math.hypot(a.x-x,a.y-12-y)<34,20,a.tag+"car"+((G.t*1.5)|0));
    if(a.dash){const mv=a.dash.mv,hr=mv.hr||30;touchEnv(a.x,a.y,hr*.5,a,mv,a.dash.id);hurtMinions(a,(x,y)=>Math.hypot(a.x-x,a.y-12-y)<hr,mv.pw,a.dash.id);
      if(vuln(v)&&Math.hypot(a.x-v.x,a.y-v.y)<hr){if(v.owned){if(v.ifr<=0){if(applyHit(v,a,mv,a.dash.id,[a.dash.dx||a.ax,a.dash.dy||0])&&a.owned&&!mv.ult)a.dash.t=Math.min(a.dash.t,.05)}}else if(a.owned&&!mv.ult)a.dash.t=Math.min(a.dash.t,.08)}}}
  for(let i=G.shots.length-1;i>=0;i--){const s=G.shots[i];if(s.w>0){s.w-=dt;continue}G.wlv=s.lv!=null?s.lv:(s.own.lv||0);const mv=s.mv,type=mvT(mv,s.own),v=other(s.own);s.bt+=dt;
    if(mv.boom){if(s.bt<.42){const k=1-s.bt/.45;s.vx=s.dx*mv.sp*k;s.vy=s.dy*mv.sp*k}else{if(!s.ph){s.ph=1;s.done=false}const ox=s.own.x-s.x,oy=s.own.y-12-s.y,od=Math.hypot(ox,oy)||1,k=Math.min(1,(s.bt-.42)*3);s.vx=ox/od*mv.sp*k;s.vy=oy/od*mv.sp*k;if(od<16&&s.bt>.55)s.life=0}}
    if(mv.home&&vuln(v)&&seenBy(v,s.own)){const cur=Math.atan2(s.vy,s.vx),d=angDiff(Math.atan2(v.y-12-s.y,v.x-s.x),cur),na=cur+clamp(d,-mv.home*dt,mv.home*dt);s.vx=Math.cos(na)*mv.sp;s.vy=Math.sin(na)*mv.sp}
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.rot+=dt*10;let dead=s.life<=0;const gy=s.y+12;
    if(!dead&&(s.x<FR-6||s.x>W-FR+6||gy<FR||gy>H-FR+8)){if(s.bn>0){s.bn--;if(s.x<FR-6||s.x>W-FR+6){s.vx*=-1;s.x=clamp(s.x,FR-5,W-FR+5)}else{s.vy*=-1;s.y=clamp(gy,FR+1,H-FR+7)-12}s.done=false;FX.hit(s.x,s.y,type)}else if(mv.boom)s.bt=Math.max(s.bt,.42);else dead=true}
    if(!dead){if(type==="elec"&&inWater(s.x,gy))zap(s.base);if(type==="fire"){meltIce(s.x,gy,0);for(const p of A.props)if(!p.dead&&p.k==="bush"&&Math.hypot(p.x-s.x,p.y-gy)<p.R*.7)hurtProp(p,s.own,mv,type)}
      if(type==="water"){const l=ellAt(A.lava,s.x,gy,4);if(l){if(l.cool<=0)part(l.x,l.y,"#e8f4ff",16,90,.8);l.cool=6}}
      const wl=wallAt(s.x,gy,2);
      if(wl){if(s.bn>0){s.bn--;const cx=wl.x+wl.w/2,cy=wl.y+wl.h/2;if(Math.abs(s.x-cx)/wl.w>Math.abs(gy-cy)/wl.h){s.vx*=-1;s.x+=s.vx*dt*2}else{s.vy*=-1;s.y+=s.vy*dt*2}s.done=false;FX.hit(s.x,s.y,type)}else if(mv.boom){if(!s.wh){s.wh=1;s.bt=Math.max(s.bt,.42)}}else{dead=true;part(s.x,s.y,"#8a858c",4,80,.3)}}
      else{const p=solidAt(s.x,gy,mv.r*.5);if(p){if(p.i!=null)hurtProp(p,s.own,mv,type);else hurtTwall(p,mv);
        if(s.bn>0){s.bn--;const nx=s.x-p.x,ny=gy-p.y,nl=Math.hypot(nx,ny)||1,dn=(s.vx*nx+s.vy*ny)/nl;if(dn<0){s.vx-=2*dn*nx/nl;s.vy-=2*dn*ny/nl}s.done=false;FX.hit(s.x,s.y,type)}else if(!mv.pierce){dead=true;part(s.x,s.y,"#c79a5a",4,80,.3)}}}}
    if(!dead&&hurtMinions(s.own,(x,y)=>Math.hypot(s.x-x,s.y-y)<mv.r+9,mv.pw,s.id)&&!mv.pierce&&!s.bn)dead=true;
    if(!dead&&!s.done&&vuln(v)&&Math.hypot(s.x-v.x,s.y-(v.y-12))<mv.r+13){
      if(v.owned){if(v.ifr>0)s.done=true;else{const l=Math.hypot(s.vx,s.vy)||1;applyHit(v,s.own,mv,s.id+(s.ph?"b":"")+(mv.bn?s.bn:""),[s.vx/l,s.vy/l]);if(mv.pierce||mv.boom)s.done=true;else dead=true}}
      else if(v.roll<=0){if(mv.pierce||mv.boom)s.done=true;else{dead=true;FX.hit(s.x,s.y,type)}}}
    if(dead){if(s.fb)FX.boom(s.x,s.y,s.blue?"blue":"fire",10+s.sc*9);if(s.prop)propLand(s);if(s.mv.rocket)G.blasts.push({id:s.id+"r",own:s.own,mv:MOVES[typeof s.mv.rocket==="string"?s.mv.rocket:"it_rocketboom"],x:s.x,y:s.y+12,t:0,full:.01});G.shots.splice(i,1)}}
  for(let i=G.blasts.length-1;i>=0;i--){const b=G.blasts[i];b.t-=dt;if(b.t>0)continue;G.blasts.splice(i,1);const mv=b.mv,type=mvT(mv,b.own);
    if(b.cap){FX.boom(b.x,b.y-8,"norm",40);SFX.play("buff");if(b.own.owned)spawnBuddy(b.own,b.id,b.x,b.y);continue}
    if(mv.kind==="zone"){G.zones.push({id:b.id,own:b.own,mv,x:b.x,y:b.y,t:mv.dur,tk:0,n:0,pull:mv.pull||0});FX.boom(b.x,b.y,type,mv.rad*.6);if(mv.pw>0)touchEnv(b.x,b.y,mv.rad,b.own,mv,b.id);continue}
    FX.boom(b.x,b.y,type,mv.rad);if(b.big)FX.mega(b.x,b.y,type,mv.rad);SFX.play("boom");G.shake=Math.min(10,G.shake+3);if(mv.crater)crater(b.x,b.y,mv.rad*.8,mv.crater===2);if(mv.terrain)makeHole(b.x,b.y,mv.terrain,b.own.lv||0,b.id);
    touchEnv(b.x,b.y,mv.rad,b.own,mv,b.id);hurtMinions(b.own,(x,y)=>Math.hypot(b.x-x,b.y-y)<mv.rad+8,mv.pw,b.id);
    if(b.zone)G.zones.push({id:b.id+"z",own:b.own,mv:MOVES.trailz,x:b.x,y:b.y,t:3,tk:.4,n:0,pull:0});
    for(const v of victimsOf(b.own))if(vuln(v)&&v.ifr<=0){const dx=v.x-b.x,dy=v.y-b.y,d=Math.hypot(dx,dy);if(d<mv.rad+10)applyHit(v,b.own,mv,b.id,d>1?[dx/d,dy/d]:[1,0])}}
  for(let i=G.zones.length-1;i>=0;i--){const z=G.zones[i];z.t-=dt;z.tk-=dt;if(z.t<=0){G.zones.splice(i,1);continue}const type=mvT(z.mv,z.own);
    if(z.vx||z.vy){z.x=clamp(z.x+z.vx*dt,40,W-40);z.y=clamp(z.y+z.vy*dt,40,H-40)}
    if(z.pull)for(const v of victimsOf(z.own))if(vuln(v)){const dx=z.x-v.x,dy=z.y-v.y,d=Math.hypot(dx,dy);if(d<z.mv.rad*1.7&&d>6){v.x+=dx/d*z.pull*dt;v.y+=dy/d*z.pull*dt}}
    if(z.tk<=0){z.tk=z.pull?.4:.5;z.n++;if(type==="fire")touchEnv(z.x,z.y,z.mv.rad*.8,z.own,z.mv,z.id);
      if(z.mv.heal){const o=z.own;if(o.owned&&o.hp>0&&o.hp<o.max&&Math.hypot(o.x-z.x,o.y-z.y)<z.mv.rad){o.hp=Math.min(o.max,o.hp+z.mv.heal);pop(o.x+rnd(-8,8),o.y-40,"+"+z.mv.heal,"#7dffa0")}if(!z.mv.pw)continue}
      if(!z.mv.pw)continue;hurtMinions(z.own,(x,y)=>Math.hypot(z.x-x,z.y-y)<z.mv.rad,z.mv.pw,z.id+z.n);
      for(const v of victimsOf(z.own))if(vuln(v)&&v.ifr<=0&&Math.hypot(v.x-z.x,v.y-z.y)<z.mv.rad+6)applyHit(v,z.own,z.mv,z.id+":z"+z.n,null)}}
  for(let i=G.rings.length-1;i>=0;i--){const r=G.rings[i];if(r.w>0){r.w-=dt;continue}r.r+=r.sp*dt;if(r.r>r.max){G.rings.splice(i,1);continue}const type=mvT(r.mv,r.own);
    for(const p of A.props)if(!p.dead&&Math.abs(Math.hypot(p.x-r.x,p.y-r.y)-r.r)<12)hurtProp(p,r.own,r.mv,type);
    if(type!=="earth"&&type!=="wind"&&type!=="grass")for(let k=0;k<8;k++){const a=k*.785;touchEnvLite(r.x+Math.cos(a)*r.r,r.y+Math.sin(a)*r.r,type,r.id)}
    hurtMinions(r.own,(x,y)=>Math.abs(Math.hypot(x-r.x,y+8-r.y)-r.r)<14,r.mv.pw,r.id);
    const v=other(r.own);if(!r.done&&vuln(v)){const dx=v.x-r.x,dy=v.y-r.y,d=Math.hypot(dx,dy);if(Math.abs(d-r.r)<15){if(v.owned){r.done=true;if(v.ifr<=0)applyHit(v,r.own,r.mv,r.id,d>1?[dx/d,dy/d]:[1,0])}else if(v.roll<=0)r.done=true}}}
  for(let i=G.beams.length-1;i>=0;i--){const b=G.beams[i];if(b.w>0){b.w-=dt;continue}G.wlv=b.own.lv||0;const type=mvT(b.mv,b.own);
    if(!b.done){b.done=true;G.shake=Math.min(10,G.shake+(b.big?5:3));
      for(let s=20;s<b.len;s+=18){const x=b.x+b.dx*s,y=b.y+12+b.dy*s;touchEnvLite(x,y,type,b.id);for(const p of A.props)if(!p.dead&&Math.hypot(p.x-x,p.y-y)<b.wd+(p.r||p.R*.5))hurtProp(p,b.own,b.mv,type);for(const w of G.twalls)if(Math.hypot(w.x-x,w.y-y)<b.wd+w.r)hurtTwall(w,b.mv);if((b.mv.breach||b.mv.bridge)&&s%54<18)damageStructures(x,y,b.wd+8,b.mv,b.own)}
      hurtMinions(b.own,(x,y)=>segDist(x,y,b.x,b.y,b.dx,b.dy,b.len)<b.wd+8,b.mv.pw*b.sc,b.id);
      for(const v of victimsOf(b.own))if(vuln(v)&&v.ifr<=0&&segDist(v.x,v.y-12,b.x,b.y,b.dx,b.dy,b.len+10)<b.wd+13)applyHit(v,b.own,b.mv,b.id,[b.dx,b.dy],b.sc)}
    b.t-=dt;if(b.t<=0)G.beams.splice(i,1)}
  for(let i=G.waves.length-1;i>=0;i--){const w=G.waves[i];w.d+=w.sp*dt;if(w.d>1250){G.waves.splice(i,1);continue}
    hurtMinions(w.own,(x,y)=>Math.abs((x-w.x)*w.dx+(y-w.y)*w.dy-w.d)<20,w.mv.pw,w.id);
    for(const v of victimsOf(w.own))if(vuln(v)&&v.ifr<=0&&Math.abs((v.x-w.x)*w.dx+(v.y-w.y)*w.dy-w.d)<20)applyHit(v,w.own,w.mv,w.id,[w.dx,w.dy])}
  for(let i=G.slashes.length-1;i>=0;i--){const s=G.slashes[i];s.t-=dt;if(s.t<=0)G.slashes.splice(i,1)}
  for(let i=G.cones.length-1;i>=0;i--){const c=G.cones[i],o=c.own,mv=c.mv;c.t-=dt;c.tk-=dt;if(c.t<=0||o.hp<=0||o.stun>0){G.cones.splice(i,1);continue}
    if(c.tk<=0){c.tk=.16;c.n++;const ang=Math.atan2(o.ay,o.ax),type=mvT(mv,o);for(const k of [.35,.7,1])touchEnv(o.x+o.ax*mv.rng*k,o.y+o.ay*mv.rng*k,16*k+6,o,mv,c.id);
      hurtMinions(o,(x,y)=>inCone(x,y,o.x,o.y-12,ang,mv.rng,mv.arc),mv.pw,c.id+c.n);
      const v=other(o);if(v.owned&&vuln(v)&&v.ifr<=0&&inCone(v.x,v.y-12,o.x,o.y-12,ang,mv.rng,mv.arc))applyHit(v,o,mv,c.id+":"+c.n,[o.ax,o.ay]);void type}}
  for(let i=G.orbits.length-1;i>=0;i--){const q=G.orbits[i],o=q.own;q.t-=dt;q.a+=dt*4.4;if(q.hc>0)q.hc-=dt;q.et-=dt;if(q.t<=0||o.hp<=0){G.orbits.splice(i,1);continue}
    const v=other(o);for(let k=0;k<3;k++){const ox=o.x+Math.cos(q.a+k*2.094)*q.mv.rad,oy=o.y-12+Math.sin(q.a+k*2.094)*q.mv.rad;if(q.et<=0)touchEnv(ox,oy+12,8,o,q.mv,q.id);
      hurtMinions(o,(x,y)=>Math.hypot(ox-x,oy-y)<16,q.mv.pw,q.id+((G.t*2)|0));
      if(q.hc<=0&&v.owned&&vuln(v)&&v.ifr<=0&&Math.hypot(ox-v.x,oy-(v.y-12))<19){q.hc=.5;q.n++;const d=Math.hypot(v.x-o.x,v.y-o.y)||1;applyHit(v,o,q.mv,q.id+":"+q.n+"_"+((G.t*10)|0),[(v.x-o.x)/d,(v.y-o.y)/d])}}if(q.et<=0)q.et=.3}
  for(let i=G.traps.length-1;i>=0;i--){const t=G.traps[i];t.t-=dt;if(t.arm>0)t.arm-=dt;if(t.t<=0){G.traps.splice(i,1);continue}const v=other(t.own);
    if(t.arm<=0&&v.owned&&vuln(v)&&v.roll<=0&&Math.hypot(v.x-t.x,v.y-t.y)<24){applyHit(v,t.own,t.mv.mine?MOVES.it_minego:MOVES.trapgo,t.id,null);FX.boom(t.x,t.y,t.mv.mine?"fire":"grass",t.mv.rad);SFX.play("boom");G.traps.splice(i,1)}}
  for(let i=G.twalls.length-1;i>=0;i--){const w=G.twalls[i];w.t-=dt;if(w.t<=0){part(w.x,w.y-8,"#8a6a4a",12,120,.4);G.twalls.splice(i,1)}}
  for(let i=A.holes.length-1;i>=0;i--){const h=A.holes[i];h.t-=dt;if(h.arm>0)h.arm-=dt;if(h.t<=0)A.holes.splice(i,1)}
  for(const l of A.lava)if(l.cool>0)l.cool-=dt;if(G.zapT>0)G.zapT-=dt;if(G.dark>0)G.dark-=dt;
  if(G.shake>0)G.shake=Math.max(0,G.shake-dt*24)}

/* ---- net sync (presence only: absolute state + short lists of recent attacks, hits, minions, destroyed props) ---- */
function flagsOf(f){return(f.stun>0?1:0)|(f.slow>0?2:0)|(f.burn>0?4:0)|(f.guard>0?8:0)|(f.haste>0?16:0)|(f.rest>0?32:0)|(f.under>0?64:0)|(f.roll>0?128:0)|(f.dash?256:0)|(f.air>0?512:0)|(f.chg?1024:0)|(f.cloak>0?2048:0)|(f.inv>0?4096:0)|(f.bub>0?8192:0)|(f.fly>0?16384:0)|(f.car>0?32768:0)|(f.rage>0?65536:0)|(f.b_red>0?131072:0)|(f.b_blue>0?262144:0)|(f.b_boss>0?524288:0)|(f.frz>0?1048576:0)|(f.tank>0?2097152:0)|(f.jet>0?4194304:0)}
function netSend(dt){G.sendT-=dt;if(G.sendT>0||!NR)return;G.sendT=.05;const f=G.me;
  NR.presence({g:[Math.round(f.x),Math.round(f.y),f.hp,flagsOf(f),f.dash?f.dash.id:0,f.dash?Object.keys(MOVES).find(k=>MOVES[k]===f.dash.mv)||0:0,+Math.atan2(f.ay,f.ax).toFixed(2),Math.round(f.ult),Math.round(f.shield),f.lv||0,G.rn],
    a:f.atks.slice(-12).map(a=>[a.id,a.m,a.x,a.y,a.dx,a.dy,+(a.p||0).toFixed(2),a.tx,a.ty]),h:f.hits,pk:G.myPicks,un:G.units?unitsPacket():undefined,ue:G.units?G.uev:undefined,od:G.orbDown,mn:f.minions.map(m=>[m.id,Math.round(m.x),Math.round(m.y),Math.round(m.hp),m.k||0,m.ds||0,+(m.an||0).toFixed(2),m.mx||22,m.lv||0]),xb:G.myKills}).catch(()=>{})}
function netRecv(dt){const f=G.op;const p=NR?NR.peers().find(x=>x.peer===G.opPeer):null;
  if(!p){G.gone+=dt;if(G.gone>4&&!G.over)endGame("win","คู่ต่อสู้ออกจากห้อง");return}G.gone=0;const q=p.presence||{};
  const g=q.g;if(Array.isArray(g)){f.tx=clamp(Number(g[0])||0,0,W);f.ty=clamp(Number(g[1])||0,0,H);const hp=clamp(Number(g[2])||0,0,f.max),sameR=(Number(g[10])||0)===G.rn;if(sameR&&(G.cd<=0||hp<f.hp))f.hp=hp;const fl=Number(g[3])|0;
    const an=Number(g[6])||0;f.ax=Math.cos(an);f.ay=Math.sin(an);f.ult=clamp(Number(g[7])||0,0,100);f.shield=clamp(Number(g[8])||0,0,99);f.lv=g[9]===1?1:0;f.shieldT=f.shield>0?1:0;
    f.stun=fl&1?.15:0;f.slow=fl&2?.15:0;f.burn=fl&4?.15:0;f.guard=fl&8?.15:0;f.haste=fl&16?.15:0;f.rest=fl&32?.15:0;f.under=fl&64?.15:0;f.roll=fl&128?.15:0;
    if(fl&512){if(f.air<=0)f.airT=.6;f.air=.15}else f.air=0;f.chgF=fl&1024?.15:0;f.cloak=fl&2048?.15:0;f.inv=fl&4096?.15:0;f.bub=fl&8192?.15:0;f.fly=fl&16384?.15:0;f.car=fl&32768?.15:0;f.rage=fl&65536?.15:0;f.b_red=fl&131072?.15:0;f.b_blue=fl&262144?.15:0;f.b_boss=fl&524288?.15:0;f.frz=fl&1048576?.15:0;f.tank=fl&2097152?.15:0;f.jet=fl&4194304?.15:0;if(fl&1024)f.reveal=.3;
    if(fl&256){const mv=MOVES[g[5]];if(mv&&(mv.kind==="dash"||mv.udash))f.dash={t:.15,dx:f.ax,dy:f.ay,mv,id:String(g[4])}}else if(f.dash)f.dash=null}
  if(Array.isArray(q.a))for(const r of q.a){if(!Array.isArray(r))continue;const id=String(r[0]);if(G.seenA.has(id))continue;G.seenA.add(id);
    const mv=MOVES[r[1]];if(!mv||G.cd>0)continue;const n=i=>Number(r[i])||0;let dx=clamp(n(4),-1,1),dy=clamp(n(5),-1,1);const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const a={id,m:r[1],x:clamp(n(2),0,W),y:clamp(n(3),0,H),dx,dy,p:clamp(n(6),0,1),tx:clamp(n(7),0,W),ty:clamp(n(8),0,H)};
    if(mv.kind==="dash"){f.reveal=1.2;part(f.x,f.y,TY[mvT(mv,f)].c,6,90,.3);SFX.play("dash");continue}spawnAttack(f,a)}
  if(Array.isArray(q.h))for(const r of q.h){if(!Array.isArray(r))continue;const key=String(r[0]);if(G.seenH.has(key))continue;G.seenH.add(key);if(G.cd>0)continue;
    const d=clamp(Number(r[1])||0,0,150),e=r[2]===2?1.5:r[2]===0?.6:1;hitFx(f,d,e,"");FX.hit(f.x,f.y-12,"norm");if(!/^(b|env)/.test(key)&&!/:riv$/.test(key)&&key.indexOf("~")<0)G.me.ult=Math.min(100,G.me.ult+d*1.1);
    const ti=G.traps.findIndex(t=>t.id===key);if(ti>=0){const t=G.traps[ti];FX.boom(t.x,t.y,"grass",t.mv.rad);G.traps.splice(ti,1)}
    const dm=G.myDrain.get(key.split(":")[0]);if(dm&&G.me.hp>0){const h=Math.round(d*dm.drain);G.me.hp=Math.min(G.me.max,G.me.hp+h);pop(G.me.x,G.me.y-40,"+"+h,"#7dffa0")}}
  if(Array.isArray(q.mn)){const old=new Map(f.minions.map(m=>[m.id,m]));f.minions=q.mn.slice(0,14).filter(Array.isArray).map(r=>{const id=String(r[0]),x=clamp(Number(r[1])||0,0,W),y=clamp(Number(r[2])||0,0,H);const m=old.get(id)||{id,x,y,hc:.6,wk:0,t:9};m.tx=x;m.ty=y;m.hp=Number(r[3])||0;m.k=Number(r[4])||0;m.ds=Number(r[5])||0;m.an=Number(r[6])||0;m.mx=Number(r[7])||22;m.lv=r[8]===1?1:0;return m})}
  if(Array.isArray(q.pk))for(const id of q.pk){const k=String(id);if(G.picked.has(k))continue;G.picked.add(k);const i=G.items.findIndex(t=>t.id===k);if(i>=0){const it=G.items[i];G.items.splice(i,1);FX.burst(it.x,it.y-10,"#ffe066",14,140,.4);pop(f.x,f.y-60,ITEMS[it.k].n,"#ffe066",1)}}
  if(Array.isArray(q.xb))for(const i of q.xb){const pr=G.A.props[i|0];if(pr&&!pr.dead)killProp(pr,false)}
  if(G.units)unitsRecv(q);
  if(!G.over&&!G.A.respawn&&(Number(g&&g[10])||0)===G.rn){const meKo=G.me.hp<=0,opKo=!!q.ko||(G.cd<=0&&f.hp<=0);if(meKo&&opKo)endGame("draw","หมดพลังพร้อมกัน");else if(meKo)endGame("lose");else if(opKo)endGame("win")}}
const IDLE={mx:0,my:0,face:null,basic:null,sk:[{held:false},{held:false},{held:false}],rel:[],dodge:0};
function update(dt){G.t+=dt;if(G.over&&G.nextT>0){G.nextT-=dt;if(G.nextT<=0){nextGame();return}}
  if(G.cut||G.stop>0){if(G.cut){G.cut.t-=dt;if(G.cut.t<=0){const c=G.cut;G.cut=null;c.a.cut=true;spawnAttack(c.f,c.a)}}else G.stop-=dt;
    if(G.mode==="net"){netRecv(dt);if(G)netSend(dt)}return}
  if(G.cd>0)G.cd-=dt;
  updOwned(G.me,myInput(),dt);
  if(G.mode==="bot")updOwned(G.op,G.cd>0?IDLE:botInput(G.op,dt),dt);else updPuppet(G.op,dt);
  updItems(dt);if(G.units){updUnits(dt);unitsLerp(dt)}updUlts(dt);updWorld(dt);for(const f of [G.me,G.op])if(f.moving)f.walk+=dt*7;
  if(G.mode==="net"){netRecv(dt);if(G)netSend(dt)}else if(!G.over&&!G.A.respawn){if(G.me.hp<=0)endGame("lose");else if(G.op.hp<=0)endGame("win")}}

/* ================= signature ultimates =================
   Each ultimate is a staged sequence U living in G.ults. Both clients run it from the same attack record
   (seeded RNG, same timeline); every client still only decides hits on its own fighter.
   Hit keys contain "~" so ultimate damage never refills the ultimate gauge. */
const giant=f=>!!(f.U&&f.U.k==="u_colossus"&&f.U.t>=.7&&f.U.t<7.1);
const uFoe=U=>other(U.own);
function uHit(U,mv,key,dir,sc){const v=uFoe(U);if(v.owned&&vuln(v)&&v.ifr<=0)return applyHit(v,U.own,mv,U.id+"~"+key,dir,sc);return false}
function uBlast(U,mk,x,y,t,key,ex){const b=Object.assign({id:U.id+"~"+key,own:U.own,mv:MOVES[mk],x:clamp(x,FR,W-FR),y:clamp(y,FR+6,H-FR),t,full:Math.max(.01,t)},ex||{});G.blasts.push(b);return b}
function lockOwn(f,t,inv){if(!f.owned)return;f.root=Math.max(f.root,t);f.busy=Math.max(f.busy,t);f.chg=null;f.dash=null;if(inv){f.inv=Math.max(f.inv,inv);f.ifr=Math.max(f.ifr,inv)}}
function startUlt(f,a,mv){const H0=ULT[mv.kind];if(f.U){const i=G.ults.indexOf(f.U);if(i>=0)G.ults.splice(i,1)}
  const U={id:a.id,own:f,mv,a,k:mv.kind,t:0,n:0,R:seeded(a.id+"u"),dur:H0.dur};f.U=U;G.ults.push(U);f.reveal=2;H0.start(U,f,a)}
function updUlts(dt){for(let i=G.ults.length-1;i>=0;i--){const U=G.ults[i],H0=ULT[U.k];U.t+=dt;H0.upd(U,dt);
  if(U.t>=U.dur){if(H0.end)H0.end(U);G.ults.splice(i,1);if(U.own.U===U)U.own.U=null}}}
const phPos=(U,k)=>{const an=-1.5708+k*2.0944;return[clamp(U.x+Math.cos(an)*64,FR+8,W-FR-8),clamp(U.y+Math.sin(an)*64,FR+18,H-FR)]};
const birdPos=(U,k,p)=>{const an=U.ang+k*2.0944,d=(p-.5)*1060;return[U.tx+Math.cos(an)*d,U.ty+Math.sin(an)*d,an]};
const BIRD_T=[.75,1.65,2.55],BIRD_P=.8,BIRD_L=3.7;
const ULT={
  /* Pyros: soar out of sight, three phoenix strafing runs crossing the target point, then rebirth */
  u_bird:{dur:4,start(U,f,a){U.tx=a.tx;U.ty=a.ty;U.sx=a.x;U.sy=a.y;U.ang=Math.atan2(a.ty-a.y,a.tx-a.x)||0;U.pd=[-1,-1,-1];lockOwn(f,3.8,3.85);G.dark=4;SFX.play("beam","fire")},
    upd(U,dt){const f=U.own,t=U.t,v=uFoe(U);
      if(f.owned&&t>=.5&&!U.mv0){U.mv0=1;f.x=U.tx;f.y=U.ty;collide(f)}
      for(let k=0;k<3;k++){const p=(t-BIRD_T[k])/BIRD_P;if(p<0||p>1.06)continue;const q=Math.min(1,p);
        if(U.n<=k){U.n=k+1;SFX.play("dash","fire");G.shake=Math.min(10,G.shake+5);
          for(const o of [-230,-80,80,230]){const b=birdPos(U,k,.5+o/1060);if(b[0]>FR&&b[0]<W-FR&&b[1]>FR&&b[1]<H-FR)G.zones.push({id:U.id+"~z"+k+o,own:f,mv:MOVES.trailz,x:b[0],y:b[1],t:2.6,tk:.3,n:0,pull:0})}}
        const an=U.ang+k*2.0944,cx=Math.cos(an),cy=Math.sin(an),d0=(U.pd[k]<0?q:U.pd[k]-.5)*1060,d1=(q-.5)*1060;U.pd[k]=q;
        const ex=v.x-U.tx,ey=v.y-U.ty,along=ex*cx+ey*cy,side=Math.abs(ex*cy-ey*cx);
        if(side<48&&along>Math.min(d0,d1)-48&&along<Math.max(d0,d1)+48)uHit(U,MOVES.birdpass,"p"+k,[cx,cy]);
        const b=birdPos(U,k,q);touchEnv(b[0],b[1],34,f,MOVES.birdpass,U.id+"~p"+k);hurtMinions(f,(x,y)=>Math.hypot(b[0]-x,b[1]-y)<48,11,U.id+"~p"+k)}
      if(t>=BIRD_L&&!U.fin){U.fin=1;uBlast(U,"birdland",U.tx,U.ty,0,"f",{big:1});crater(U.tx,U.ty,50,1);
        if(f.owned&&f.hp>0){const h=Math.round(f.max*.12);f.hp=Math.min(f.max,f.hp+h);pop(f.x,f.y-48,"+"+h,"#7dffa0")}}}},
  /* Crusta: spinning crystal shell surfing a wave, steerable, bounces off walls */
  u_shell:{dur:3.75,start(U,f,a){U.vx=a.dx;U.vy=a.dy;U.hc=0;U.pt=.4;lockOwn(f,.38,.42);if(f.owned){f.guard=Math.max(f.guard,3.75)}SFX.play("buff")},
    move(U,f,inp,dt){if(U.t<.38)return null;const l=Math.hypot(inp.mx,inp.my);if(l>.3){const cur=Math.atan2(U.vy,U.vx),na=cur+clamp(angDiff(Math.atan2(inp.my,inp.mx),cur),-5.5*dt,5.5*dt);U.vx=Math.cos(na);U.vy=Math.sin(na)}return[U.vx*330,U.vy*330]},
    bounce(U,f,rx,ry,vx,vy){let b=0;if(Math.abs(vx)>80&&Math.abs(rx)<Math.abs(vx)*.35){U.vx=-U.vx;b=1}if(Math.abs(vy)>80&&Math.abs(ry)<Math.abs(vy)*.35){U.vy=-U.vy;b=1}
      if(b&&U.t-(U.lb||0)>.12){U.lb=U.t;G.shake=Math.min(10,G.shake+4);FX.boom(f.x,f.y-10,"water",30);SFX.play("hit")}},
    upd(U,dt){const f=U.own,t=U.t,v=uFoe(U);if(t<.38)return;if(!U.go){U.go=1;G.shake=6;SFX.play("beam","water")}
      U.hc-=dt;touchEnv(f.x,f.y,22,f,U.mv,U.id+"~e");hurtMinions(f,(x,y)=>Math.hypot(f.x-x,f.y-12-y)<36,U.mv.pw,U.id+"~m"+((t*2)|0));
      if(U.hc<=0&&vuln(v)&&Math.hypot(f.x-v.x,f.y-v.y)<38){U.hc=.5;if(v.owned&&v.ifr<=0){U.n++;const dx=v.x-f.x,dy=v.y-f.y,d=Math.hypot(dx,dy)||1;applyHit(v,f,U.mv,U.id+"~c"+U.n,[dx/d,dy/d])}FX.boom((f.x+v.x)/2,(f.y+v.y)/2-12,"water",34)}
      U.pt-=dt;if(U.pt<=0&&t<3.6){U.pt=.42;U.m=(U.m||0)+1;const a0={id:U.id+"~s"+U.m,x:f.x,y:f.y+4};for(let i=0;i<6;i++)addShots(f,a0,MOVES.shard,1,i*1.0472+U.m*.5,{k0:i,spread:0})}},
    end(U){if(U.own.hp>0)uBlast(U,"shellend",U.own.x,U.own.y,0,"e",{big:1})}},
  /* Mekha: a storm cloud that hunts the opponent */
  u_cloud:{dur:6.7,start(U,f,a){U.cx=a.x;U.cy=a.y;U.bt=.15;lockOwn(f,.85,.9);G.dark=6.6;SFX.play("buff")},
    upd(U,dt){const t=U.t,v=uFoe(U),f=U.own,R=U.R;if(t<.85){U.cx=f.x;U.cy=f.y;return}if(!U.go){U.go=1;SFX.play("zap");G.shake=5}
      const dx=v.x-U.cx,dy=v.y-U.cy,d=Math.hypot(dx,dy)||1;if(t<5.7&&d>6){const sp=Math.min(115,d*2.6);U.cx+=dx/d*sp*dt;U.cy+=dy/d*sp*dt}
      if(v.owned&&vuln(v)&&d<118&&t<5.9)v.slow=Math.max(v.slow,.25);
      U.bt-=dt;if(U.bt<=0&&t<5.5){U.bt=.4;U.n++;const an=R()*6.283,rr=R()*(U.n%3===0?90:26);let x=v.x+Math.cos(an)*rr,y=v.y+Math.sin(an)*rr;const ex=x-U.cx,ey=y-U.cy,el=Math.hypot(ex,ey);if(el>120){x=U.cx+ex/el*120;y=U.cy+ey/el*120}
        uBlast(U,"cbolt",x,y,.42,"b"+U.n);U.flash=.12}
      if(U.flash>0)U.flash-=dt;
      if(t>=5.7&&!U.fin){U.fin=1;uBlast(U,"cmega",U.cx,U.cy,.85,"f",{big:1})}}},
  /* Prikky: a giant chili that bursts into two rings of smaller chilis */
  u_chili:{dur:2.7,start(U,f,a){const R=U.R;lockOwn(f,.45,.5);const tx=clamp(a.tx,FR+20,W-FR-20),ty=clamp(a.ty,FR+26,H-FR-10);SFX.play("dash","fire");
      uBlast(U,"chili1",tx,ty,1.05,"c",{full:.6,lob:"chili",ls:3.4,lh:170,ox:a.x,oy:a.y-18,big:1,zone:1});
      const o1=R()*6.283;for(let i=0;i<6;i++){const an=o1+i*1.0472;uBlast(U,"chili2",tx+Math.cos(an)*104,ty+Math.sin(an)*104,1.6+i*.03,"r"+i,{full:.55,lob:"chili",ls:1.7,lh:80,ox:tx,oy:ty-10,zone:i%2})}
      const o2=R()*6.283;for(let i=0;i<10;i++){const an=o2+i*.6283;uBlast(U,"chili3",tx+Math.cos(an)*196,ty+Math.sin(an)*196,2.15+i*.025,"q"+i,{full:.55,lob:"chili",ls:1.4,lh:100,ox:tx,oy:ty-10})}},
    upd(){}},
  /* Sila: grows into a stone colossus */
  u_colossus:{dur:7.5,start(U,f){lockOwn(f,.7,.75);U.st=0;SFX.play("buff");G.shake=4},
    upd(U,dt){const f=U.own,t=U.t;if(t<.7)return;
      if(!U.go){U.go=1;G.rings.push({id:U.id+"~r",own:f,mv:MOVES.colring,x:f.x,y:f.y,r:10,max:MOVES.colring.max,sp:330,done:false,big:1});crater(f.x,f.y,44,1);G.shake=10;SFX.play("boom")}
      if(t>=7.1)return;if(f.owned){f.guard=Math.max(f.guard,.15);f.slow=0;f.stun=0}
      if(f.moving){U.st-=dt;if(U.st<=0){U.st=.5;U.n++;uBlast(U,"stomp",f.x,f.y+2,0,"s"+U.n)}}},
    end(U){const f=U.own;FX.boom(f.x,f.y-20,"earth",40)}},
  /* Eela: a long lightning sea-dragon that hunts */
  u_dragon:{dur:6.1,start(U,f,a){lockOwn(f,.7,.75);U.ang=Math.atan2(a.dy,a.dx);U.hx=a.x;U.hy=a.y-12;U.pts=[];U.hc=0;G.dark=5.6;SFX.play("buff")},
    upd(U,dt){const t=U.t,v=uFoe(U),f=U.own;if(t<.7){U.hx=f.x+Math.cos(U.ang)*16;U.hy=f.y-14;return}if(!U.go){U.go=1;SFX.play("beam","elec");G.shake=6}
      if(t<5.5){const want=Math.atan2(v.y-12-U.hy,v.x-U.hx);U.ang+=clamp(angDiff(want,U.ang),-2.6*dt,2.6*dt);const a2=U.ang+Math.sin(t*6.5)*.38;
        U.hx=clamp(U.hx+Math.cos(a2)*255*dt,0,W);U.hy=clamp(U.hy+Math.sin(a2)*255*dt,0,H-10);U.ha=a2;
        const l=U.pts[0];if(!l||Math.hypot(l[0]-U.hx,l[1]-U.hy)>=6){U.pts.unshift([U.hx,U.hy]);if(U.pts.length>34)U.pts.pop()}
        U.hc-=dt;if(U.hc<=0&&vuln(v)){let hit=Math.hypot(v.x-U.hx,v.y-12-U.hy)<26;for(let i=2;!hit&&i<U.pts.length;i+=2)hit=Math.hypot(v.x-U.pts[i][0],v.y-12-U.pts[i][1])<17;
          if(hit){U.hc=.5;U.n++;uHit(U,MOVES.dbite,"d"+U.n,[Math.cos(a2),Math.sin(a2)])}}
        hurtMinions(f,(x,y)=>Math.hypot(U.hx-x,U.hy-y)<28,7,U.id+"~m"+((t*2)|0));if(inWater(U.hx,U.hy+12))zap(U.id+"~z"+((t/1.5)|0))}
      else if(!U.fin){U.fin=1;uBlast(U,"dragend",U.hx,U.hy+12,.45,"f",{big:1})}}},
  /* Fuwa: homing bubbles that trap and lift the opponent */
  u_bubble:{dur:6.8,start(U,f){lockOwn(f,.7,.75);U.bs=[];U.cap=0;SFX.play("buff")},
    upd(U,dt){const t=U.t,f=U.own,v=uFoe(U),R=U.R;if(t<.7)return;
      if(!U.go){U.go=1;for(let i=0;i<5;i++){const an=i*1.2566+R()*.4;U.bs.push({x:f.x+Math.cos(an)*30,y:f.y-14+Math.sin(an)*30,vx:Math.cos(an)*230,vy:Math.sin(an)*230,ph:R()*6.28})}SFX.play("shot","water")}
      const tx=v.x,ty=v.y-14;
      if(!U.cap&&!U.done){if(v.owned){for(let i=0;i<U.bs.length;i++){const b=U.bs[i];if(vuln(v)&&v.ifr<=0&&Math.hypot(b.x-tx,b.y-ty)<34){applyHit(v,f,MOVES.bubcatch,U.id+"~c"+i,null);U.bs.splice(i,1);FX.boom(b.x,b.y,"water",20);if(v.bub>0)U.cap=MOVES.bubcatch.hard;break}}}
        else if(v.bub>0&&U.bs.length){let bi=0,bd=1e9;U.bs.forEach((b,i)=>{const d=Math.hypot(b.x-tx,b.y-ty);if(d<bd){bd=d;bi=i}});U.bs.splice(bi,1);U.cap=1.6}}
      for(let i=U.bs.length-1;i>=0;i--){const b=U.bs[i],dx=tx-b.x,dy=ty-b.y,d=Math.hypot(dx,dy)||1,sp=U.cap?360:150+Math.min(90,(t-.7)*30),k=Math.min(1,dt*(U.cap?5:2.4));
        b.vx+=(dx/d*sp-b.vx)*k;b.vy+=(dy/d*sp-b.vy)*k;b.x+=b.vx*dt;b.y+=b.vy*dt;b.ph+=dt*4;
        if(U.cap&&d<24){U.bs.splice(i,1);U.n++;FX.boom(b.x,b.y,"water",26);SFX.play("hit");if(v.owned&&v.hp>0)applyHit(v,f,MOVES.bubpop,U.id+"~p"+U.n,null)}}
      if(U.cap){U.cap-=dt;if(U.cap<=0){U.cap=0;U.done=1;uBlast(U,"bubburst",v.x,v.y,0,"f",{big:1});for(const b of U.bs)FX.boom(b.x,b.y,"water",18);U.bs.length=0;U.dur=Math.min(U.dur,U.t+.4)}}
      if(t>6.4&&U.bs.length){for(const b of U.bs)FX.boom(b.x,b.y,"water",18);U.bs.length=0}}},
  /* Lavarok: becomes a volcano, a lava lake spreads and lava bombs rain on the opponent */
  u_volcano:{dur:5.1,start(U,f,a){U.x=a.x;U.y=a.y;U.r=0;U.zt=0;U.bt=.95;lockOwn(f,4.7,.8);G.dark=5;G.shake=6;SFX.play("dash","earth")},
    upd(U,dt){const t=U.t,f=U.own,v=uFoe(U),R=U.R;if(f.owned&&t<4.7){f.guard=Math.max(f.guard,.15);f.burn=0}
      U.r=t<.7?0:t<4.4?Math.min(150,34+(t-.7)*44):Math.max(0,150*(1-(t-4.4)/.6));
      if(t>=.7&&t<4.4){if(!U.go){U.go=1;G.shake=10;SFX.play("boom");crater(U.x,U.y,40,1);FX.mega(U.x,U.y-30,"fire",60)}
        U.zt-=dt;if(U.zt<=0){U.zt=.45;U.n++;touchEnv(U.x,U.y,U.r,f,MOVES.lavapool,U.id+"~z");hurtMinions(f,(x,y)=>Math.hypot(U.x-x,U.y-y)<U.r,4,U.id+"~z"+U.n);if(Math.hypot(v.x-U.x,v.y-U.y)<U.r+6)uHit(U,MOVES.lavapool,"z"+U.n,null)}
        U.bt-=dt;if(U.bt<=0&&t<4){U.bt=.34;U.m=(U.m||0)+1;const an=R()*6.283,rr=R()*64;uBlast(U,"lavabomb",v.x+Math.cos(an)*rr,v.y+Math.sin(an)*rr,.8,"b"+U.m,{lob:"shot_fire",ls:3,lh:150,ox:U.x,oy:U.y-58})}}}},
  /* Blazar: inhale, then a steerable stream of giant fireballs that heat up from orange to blue */
  u_barrage:{dur:3.35,start(U,f){U.ft=.55;U.steer=1;lockOwn(f,.5,.55);if(f.owned){f.busy=3.3;f.cast=3.3}SFX.play("buff")},
    upd(U,dt){const f=U.own,t=U.t;if(t<.55||U.n>=22||f.hp<=0)return;U.ft-=dt;
      while(U.ft<=0&&U.n<22){U.ft+=.12;const k=U.n++,h=k/21,mk=k>=18?"bfb3":k>=13?"bfb2":"bfb1",mv=MOVES[mk],ang=Math.atan2(f.ay,f.ax)+(U.R()-.5)*.08,cx=Math.cos(ang),cy=Math.sin(ang);
        G.shots.push({id:U.id+"~"+k,base:U.id,own:f,mv,x:f.x+cx*22,y:f.y-14+cy*16,vx:cx*mv.sp,vy:cy*mv.sp,dx:cx,dy:cy,life:mv.life,rot:0,bt:0,bn:0,w:0,fb:k<7?"fb_o":k<13?"fb_w":"fb_b",blue:k>=13,sc:1+h*1.2});
        if(f.owned){f.kx-=cx*30;f.ky-=cy*30}U.flash=.08;G.shake=Math.min(10,G.shake+1.4+h*2.2);SFX.play("shot","fire")}
      if(U.flash>0)U.flash-=dt}},
  /* Reya: floods the whole arena; three waterspouts hunt the opponent */
  u_flood:{dur:8.1,start(U,f){lockOwn(f,1,1.05);U.sp=[];SFX.play("beam","water")},
    upd(U,dt){const t=U.t,f=U.own,v=uFoe(U),R=U.R;U.lv=clamp(t<1?t:t>7.5?(8.1-t)/.6:1,0,1);if(t<1)return;
      if(!U.go){U.go=1;for(let i=0;i<3;i++){const an=i*2.0944+R()*1.2;U.sp.push({x:clamp(v.x+Math.cos(an)*220,40,W-40),y:clamp(v.y+Math.sin(an)*170,50,H-30),tk:.5+i*.13,n:0})}G.shake=8;SFX.play("boom")}
      if(t<7.5){for(const l of G.A.lava)l.cool=Math.max(l.cool,1.2);for(const z of G.zones)if(z.own!==f&&mvT(z.mv,z.own)==="fire")z.t=Math.min(z.t,.15);
        if(f.owned){f.haste=Math.max(f.haste,.2);f.burn=0}
        if(v.owned&&vuln(v)&&!v.mon.t.includes("water"))v.slow=Math.max(v.slow,.2);
        U.sp.forEach((s,i)=>{let dx=v.x-s.x,dy=v.y-s.y;const d=Math.hypot(dx,dy)||1;s.x+=dx/d*Math.min(98,d*3)*dt;s.y+=dy/d*Math.min(98,d*3)*dt;
          for(const o of U.sp)if(o!==s){const ex=s.x-o.x,ey=s.y-o.y,e=Math.hypot(ex,ey)||1;if(e<60){s.x+=ex/e*(60-e)*dt*3;s.y+=ey/e*(60-e)*dt*3}}
          if(v.owned&&vuln(v)&&d<92&&d>8){v.x-=dx/d*120*dt;v.y-=dy/d*120*dt}
          s.tk-=dt;if(s.tk<=0){s.tk=.4;s.n++;hurtMinions(f,(x,y)=>Math.hypot(s.x-x,s.y-y)<44,4,U.id+"~m"+i+s.n);if(d<46)uHit(U,MOVES.spout,"s"+i+"_"+s.n,null)}})}
      else if(!U.fin){U.fin=1;U.sp.forEach((s,i)=>uBlast(U,"spoutend",s.x,s.y,0,"e"+i))}}},
  /* Terran: a ring of stone pillars cages the target, thorns erupt inside, a boulder falls */
  u_cage:{dur:4.4,start(U,f,a){lockOwn(f,.8,.85);U.x=clamp(a.tx,FR+40,W-FR-40);U.y=clamp(a.ty,FR+50,H-FR-30);SFX.play("dash","earth")},
    upd(U,dt){const t=U.t,v=uFoe(U),R=U.R;
      if(t>=.8&&!U.go){U.go=1;for(let i=0;i<13;i++){const an=i/13*6.2832,x=U.x+Math.cos(an)*90,y=U.y+Math.sin(an)*90;if(x<FR+8||x>W-FR-8||y<FR+14||y>H-FR-4||wallAt(x,y,4))continue;G.twalls.push({id:U.id+"~w"+i,own:U.own,x,y,r:14,hp:6,t:3.35,born:G.t+i*.018,tall:1})}
        for(const f of [G.me,G.op])if(f.owned)collide(f);crater(U.x,U.y,30);G.shake=10;SFX.play("boom")}
      for(let k=0;k<3;k++){if(t<1.25+k*.72||U.n>k)continue;U.n=k+1;const ins=Math.hypot(v.x-U.x,v.y-U.y)<86;
        for(let j=0;j<3;j++){let x,y;if(j===0&&ins){x=v.x;y=v.y}else{const an=R()*6.283,r=Math.sqrt(R())*66;x=U.x+Math.cos(an)*r;y=U.y+Math.sin(an)*r}uBlast(U,"thorn",x,y,.55,"t"+k+"_"+j)}}
      if(t>=3.3&&!U.fin){U.fin=1;uBlast(U,"boulder",U.x,U.y,.85,"f",{big:1,drop:1})}}},
  /* Nivara: becomes a light knight for 15 seconds; skills switch to the sword set (KNIGHT) */
  u_knight:{dur:15.8,start(U,f){lockOwn(f,.8,.85);G.dark=1.2;SFX.play("buff")},
    upd(U){const f=U.own;if(U.t>=.8&&!U.go){U.go=1;FX.mega(f.x,f.y-14,"light",70);if(f.owned){f.cds=[0,0,0];f.cdB=0}SFX.play("ult")}},
    end(U){const f=U.own;FX.boom(f.x,f.y-14,"light",40);if(f.owned)f.cds=f.cds.map(()=>0)}},
  /* Aurex: a rising charge followed by three expanding arena-breaking impacts */
  u_impact:{dur:1.85,start(U,f,a){U.x=a.tx;U.y=a.ty;lockOwn(f,1.55,.95);G.dark=1.8;SFX.play("buff")},
    upd(U){const t=U.t,f=U.own;if(t>=.56&&!U.land){U.land=1;if(f.owned){f.x=U.x;f.y=U.y;collide(f)}G.shake=8;uBlast(U,"aurex_u1",U.x,U.y,0,"r1",{big:1});SFX.play("boom")}
      if(t>=.82&&!U.r2){U.r2=1;G.shake=9;uBlast(U,"aurex_u2",U.x,U.y,0,"r2",{big:1});SFX.play("boom")}
      if(t>=1.12&&!U.r3){U.r3=1;G.shake=10;uBlast(U,"aurex_u3",U.x,U.y,0,"r3",{big:1});SFX.play("boom");FX.mega(U.x,U.y-12,"light",120)}}},
  /* Chronox: freezes a target area, pulls it inward, then tears a lethal dimensional hole */
  u_event:{dur:3.45,start(U,f,a){U.x=a.tx;U.y=a.ty;lockOwn(f,3.1,1);G.dark=3.4;SFX.play("buff")},
    upd(U){const t=U.t;if(t>=.55&&!U.well){U.well=1;G.zones.push({id:U.id+"~well",own:U.own,mv:MOVES.event_tick,x:U.x,y:U.y,t:2.25,tk:0,n:0,pull:320});FX.mega(U.x,U.y-12,"shadow",90);SFX.play("beam","shadow")}
      if(t>=2.62&&!U.end){U.end=1;uBlast(U,"event_end",U.x,U.y,0,"end",{big:1});G.shake=10;SFX.play("boom")}}},
  /* Verdara: grows a healing crystal garden, erupts three root rings, then releases a prism shockwave */
  u_worldtree:{dur:3.5,start(U,f,a){U.x=a.tx;U.y=a.ty;lockOwn(f,1.15,1);G.dark=2.2;SFX.play("buff")},
    upd(U){const t=U.t;if(t>=.5&&!U.grow){U.grow=1;G.zones.push({id:U.id+"~garden",own:U.own,mv:MOVES.verd_bloom,x:U.x,y:U.y,t:3,tk:0,n:0,pull:0});FX.mega(U.x,U.y-20,"grass",78)}
      for(let k=0;k<3;k++)if(t>=.85+k*.48&&(!U.roots||!U.roots[k])){U.roots=U.roots||[];U.roots[k]=1;const a=k*2.094+U.R()*.35;uBlast(U,"rootburst",U.x+Math.cos(a)*(54+k*24),U.y+Math.sin(a)*(46+k*20),0,"r"+k,{big:1});SFX.play("boom")}
      if(t>=2.42&&!U.end){U.end=1;uBlast(U,"treeburst",U.x,U.y,0,"end",{big:1});if(U.own.owned)heal(U.own,28);G.shake=9;SFX.play("ult")}}},
  /* Umbra: levitates over a magic circle (invulnerable) and calls three shadow selves */
  u_phantom:{dur:1.95,start(U,f,a){U.x=a.x;U.y=a.y;lockOwn(f,1.8,1.85);G.dark=3;SFX.play("buff")},
    upd(U,dt){const t=U.t,f=U.own;
      for(let k=0;k<3;k++)if(t>=.5+k*.4&&U.n<=k){U.n=k+1;const p=phPos(U,k);FX.bolt(p[0],p[1]-6);FX.boom(p[0],p[1]-12,"shadow",24);SFX.play("zap");G.shake=Math.min(10,G.shake+4)}
      if(t>=1.8&&!U.go){U.go=1;G.shake=10;SFX.play("boom");FX.mega(U.x,U.y-12,"shadow",86);
        if(f.owned){const hp=Math.round(f.max/2);for(let k=0;k<3;k++){const p=phPos(U,k);f.minions.push({id:U.id+"~"+k,k:1,x:p[0],y:p[1],hp,mx:hp,t:7.5,hc:0,wk:0,s:0,w:.2+k*.32,ds:0,an:0})}}}}}
};
/* shadow selves: stalk, lock on (telegraphed), lightning-dash through the target */
function phantomAI(f,o,m,dt){if(G.cd>0||G.over)return;
  if(m.s===1){m.x=clamp(m.x+m.dx*660*dt,FR+6,W-FR-6);m.y=clamp(m.y+m.dy*660*dt,FR+16,H-FR);m.dt-=dt;if(m.dt<=0){m.s=0;m.ds=0;m.w=.95}return}
  const seen=seenBy(o,m),tx=seen?o.x:f.x,ty=seen?o.y:f.y,dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy)||1;m.w-=dt;
  if(m.w>.55||!seen){m.ds=0;const want=seen?170:40,mvv=d>want+20?1:d<want-40?-1:0,side=(m.id.slice(-1)|0)%2?1:-1;m.x+=(dx/d*mvv-dy/d*side*.7)*150*dt;m.y+=(dy/d*mvv+dx/d*side*.7)*150*dt;m.an=Math.atan2(dy,dx);if(!seen)m.w=Math.max(m.w,.6)}
  else{m.ds=2;if(m.w>.18)m.an=Math.atan2(dy+o.ky*.0,dx)}
  m.x=clamp(m.x,FR+6,W-FR-6);m.y=clamp(m.y,FR+16,H-FR);
  if(m.w<=0){m.s=1;m.ds=1;m.dx=Math.cos(m.an);m.dy=Math.sin(m.an);m.dt=clamp((d+60)/660,.22,.45);SFX.play("dash","elec")}}
/* ================= items: timed drops, pickups, use, helper bots =================
   Drops follow a schedule seeded per match, so both players see the same item at the same place.
   Each client decides its own pickups and tells the other side through presence (pk). */
const ITEM_CFG=k=>k==="moba"?{first:3,gap:3.2}:k==="city"||k==="skyforge"||k==="titanback"?{first:3,gap:4}:{first:3.5,gap:5};
function itemBad(x,y,lv){const A=G.A,t=l=>l.e?inEll(l,x,y,20):inRect(l,x,y,20);if(A.water.some(t)||A.lava.some(t)||A.bog.some(t)||A.walls.some(w=>(w.lv||0)===lv&&inRect(w,x,y,20)))return true;
  if(A.holes.some(h=>(h.lv||0)===lv&&Math.hypot(h.x-x,h.y-y)<h.r+20)||A.props.some(p=>!p.dead&&p.r&&Math.hypot(p.x-x,p.y-y)<p.r+22))return true;if(A.noItem&&A.noItem(x,y,lv))return true;return false}
function updItems(dt){if(G.cd>0)return;const cfg=ITEM_CFG(G.A.key);
  if(!G.over&&G.t>=3.2+cfg.first+G.itemN*cfg.gap){const n=G.itemN++,R=seeded(G.seed+":it"+n),k=pickItem(R());let pos=null,lv=0;
    for(let i=0;i<40&&!pos;i++){let x,y;if(G.A.itemSpot){const q=G.A.itemSpot(R);x=q[0];y=q[1];lv=q[2]||0}else{x=FR+50+R()*(W-2*FR-100);y=FR+70+R()*(H-2*FR-110)}if(!itemBad(x,y,lv))pos=[x,y]}
    if(pos&&!G.picked.has("it"+n)){G.items.push({id:"it"+n,k,x:pos[0]|0,y:pos[1]|0,t:50,b:R()*6,lv});FX.burst(pos[0],pos[1]-10,"#ffe066",10,80,.4)}}
  /* hand-placed items on maps that restock them (MOBA jungle) */
  if(G.A.fixRe&&G.fixId)for(let i=0;i<G.fixId.length;i++){if(!G.picked.has(G.fixId[i]))continue;if(!G.fixDue[i])G.fixDue[i]=G.t+G.A.fixRe;else if(G.t>=G.fixDue[i]){const q=G.A.fixed[i],id="fx"+i+"g"+(++G.fixGen[i]);G.fixId[i]=id;G.fixDue[i]=0;
      if(!G.picked.has(id)){G.items.push({id,k:q[0],x:q[1],y:q[2],t:1e9,b:i*.7,lv:q[3]||0,fix:1});FX.burst(q[1],q[2]-10,"#ffe066",10,80,.4)}}}
  for(let i=G.items.length-1;i>=0;i--){const it=G.items[i];it.t-=dt;if(it.t<=0||G.picked.has(it.id)){G.items.splice(i,1);continue}
    for(const f of [G.me,G.op]){if(!f.owned||f.hp<=0||f.under>0||(f.lv||0)!==it.lv||Math.hypot(f.x-it.x,f.y-it.y)>=28)continue;
      G.items.splice(i,1);G.picked.add(it.id);if(f===G.me){G.myPicks.push(it.id);if(G.myPicks.length>12)G.myPicks.shift()}gainItem(f,it.k,it);break}}}
function heal(f,n){if(f.hp<=0)return;const h=Math.min(n,f.max-f.hp);f.hp+=h;if(h>0)pop(f.x+rnd(-8,8),f.y-44,"+"+h,"#7dffa0")}
function gainItem(f,k,it){const I=ITEMS[k];
  if(k==="mystery"){const R=seeded((it?it.id:"m")+f.tag);let q;do q=pickItem(R());while(q==="mystery");pop(f.x,f.y-74,"กล่องสุ่ม!","#c8a0ff",1);return gainItem(f,q)}
  pop(f.x,f.y-60,I.n,"#ffe066",1);SFX.play("buff");FX.burst(f.x,f.y-14,"#ffe066",16,150,.5);
  if(I.kind==="use"){f.item={k,uses:I.uses};if(f===G.me&&typeof itemBtn==="function")itemBtn();return}
  switch(k){case"potS":heal(f,30);break;case"potL":heal(f,60);break;case"fruit":f.ult=Math.min(100,f.ult+40);break;case"bubble":f.shield=Math.max(f.shield,40);f.shieldT=6;break;
    case"boots":f.haste=Math.max(f.haste,8);break;case"rage":f.rage=10;break;case"helmet":f.guard=Math.max(f.guard,5);break;case"ghost":f.cloak=6;f.reveal=0;break;
    case"hourglass":f.cds=[0,0,0];f.cdB=0;break;case"heart":f.regen=10;f.regT=.5;break;case"energy":f.cdr=8;break}}
function useItem(f,aim){const it=f.item;if(!it||f.cdI>0)return false;const I=ITEMS[it.k];
  if(it.k==="collar"&&!collarTarget(f)){if(f===G.me&&!(f.nzT>G.t)){f.nzT=G.t+1;pop(f.x,f.y-60,"ไม่มีครีปป่าใกล้ๆ","#ff8a8a",1)}return false}record(f,I.mv,aim);it.uses--;f.cdI=I.mv==="it_pistol"?.16:.35;if(it.uses<=0)f.item=null;if(f===G.me&&typeof itemBtn==="function")itemBtn();return true}
/* an attack that starts from somewhere other than the fighter (helper bots) */
function recordAt(f,m,x,y,dx,dy,p){const a={id:f.tag+(++f.seq),m,x:Math.round(x),y:Math.round(y),dx:+dx.toFixed(3),dy:+dy.toFixed(3),p:p||0,tx:Math.round(clamp(x+dx*200,FR,W-FR)),ty:Math.round(clamp(y+dy*200,FR,H-FR))};
  f.atks.push(a);if(f.atks.length>12)f.atks.shift();spawnAttack(f,a);return a}
function spawnBuddy(f,id,x,y){const k=2+Math.floor(seeded(id)()*4),b=BUDDY[k];f.minions.push({id:id+"~b",k,x,y,hp:b.hp,mx:b.hp,t:14,hc:0,wk:0,w:.6,s:0,ds:0,an:0});pop(x,y-50,b.n+"!","#9ad4ff",1)}
function buddyAI(f,o,m,dt){if(G.cd>0||G.over)return;
  if(m.k===3){phantomAI(f,o,m,dt);return}
  const seen=o.hp>0&&seenBy(o,m),dx=o.x-m.x,dy=o.y-m.y,d=Math.hypot(dx,dy)||1;m.w-=dt;
  const go=(tx,ty,sp)=>{const ex=tx-m.x,ey=ty-m.y,e=Math.hypot(ex,ey);if(e>8){m.x+=ex/e*Math.min(sp,e*4)*dt;m.y+=ey/e*Math.min(sp,e*4)*dt}};
  if(m.k===2){if(seen){const s=d>190?1:d<130?-1:0,sd=(m.id.length%2?1:-1);m.x+=(dx/d*s-dy/d*.7*sd)*125*dt;m.y+=(dy/d*s+dx/d*.7*sd)*125*dt;m.an=Math.atan2(dy,dx);
      if(m.w<=0&&d<340){m.w=1.05;recordAt(f,"bt_spark",m.x,m.y,dx/d,dy/d)}}else go(f.x-30,f.y+20,150)}
  else if(m.k===4){if(seen){if(m.ds===2){if(m.w<=0){m.ds=0;m.w=2;recordAt(f,"bt_laser",m.x,m.y,Math.cos(m.an),Math.sin(m.an),1)}}
      else{const s=d>260?1:d<190?-1:0;m.x+=dx/d*s*110*dt;m.y+=dy/d*s*110*dt;m.an=Math.atan2(dy,dx);if(m.w<=0&&d<420){m.ds=2;m.w=.55}}}else{m.ds=0;go(f.x+30,f.y-30,150)}}
  else if(m.k===5){go(f.x+Math.cos(G.t)*44,f.y+Math.sin(G.t)*24,170);if(f.owned&&f.hp>0&&f.hp<f.max&&(m.ht=(m.ht||0)-dt)<=0){m.ht=.5;heal(f,1)}
    if(seen&&d<95&&m.w<=0){m.w=2.2;recordAt(f,"bt_slam",m.x,m.y,dx/d,dy/d)}}
  else if(m.k===6){m.an=Math.atan2(dy,dx);if(seen&&d<340&&m.w<=0){m.w=.55;recordAt(f,"bt_gun",m.x,m.y,dx/d,dy/d)}}
  m.x=clamp(m.x,FR+6,W-FR-6);m.y=clamp(m.y,FR+16,H-FR)}
/* ================= 2D helpers for the splash canvas ================= */
function drawSprite(c,key,frame,x,y,scale,flip,white){const s=SPR[key],img=(white?s.w:s.f)[frame];c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);c.drawImage(img,-SS/2,-SS+3);c.restore()}
function drawBolt(c,x,y,col){c.strokeStyle=col;c.lineWidth=3;c.beginPath();let px=x+rnd(-30,30),py=-10;c.moveTo(px,py);while(py<y-14){py+=rnd(18,34);px+=(x-px)*.4+rnd(-16,16);c.lineTo(px,Math.min(py,y))}c.lineTo(x,y);c.stroke()}

/* ================= logo: chunky pixel lettering, cold steel CLASH against molten MON ================= */
const GLY={C:[".#####.","#######","##...##","##.....","##.....","##.....","##...##","#######",".#####."],
  L:["##.....","##.....","##.....","##.....","##.....","##.....","##.....","#######","#######"],
  A:[".#####.","#######","##...##","##...##","#######","#######","##...##","##...##","##...##"],
  S:[".######","#######","##.....","######.",".######",".....##",".....##","#######","######."],
  H:["##...##","##...##","##...##","#######","#######","##...##","##...##","##...##","##...##"],
  O:[".#####.","#######","##...##","##...##","##...##","##...##","##...##","#######",".#####."],
  F:["#######","#######","##.....","#####..","#####..","##.....","##.....","##.....","##....."],
  M:["##...##","###.###","#######","#######","##.#.##","##...##","##...##","##...##","##...##"],
  N:["##...##","###..##","####.##","#######","##.####","##..###","##...##","##...##","##...##"]};
function makeLogo(){const LW=112,LH=66,cell=new Array(LW*LH).fill(null);
  const COLD=["#ffffff","#eaf6ff","#c4e4ff","#93caff","#5e9df0","#3a6fd6","#27489e"],HOT=["#ffffff","#fff3a0","#ffd83e","#ffab2a","#ff6a24","#e0312b","#93183c"],GOLD=["#fff6c8","#ffe27a","#f5c542","#d99a1e"];
  const word=(txt,x0,y0,sc,ramp)=>{let x=x0;for(const ch of txt){const g=GLY[ch];for(let r=0;r<9;r++)for(let q=0;q<7;q++)if(g[r][q]==="#")for(let a=0;a<sc;a++)for(let b=0;b<sc;b++){const X=x+q*sc+a,Y=y0+r*sc+b;cell[Y*LW+X]={ramp,k:(r*sc+b)/(9*sc-1)}}x+=8*sc}};
  word("CLASH",17,6,2,COLD);word("MON",31,30,3,HOT);word("OF",9,39,1,GOLD);
  const on=(x,y)=>x>=0&&x<LW&&y>=0&&y<LH&&cell[y*LW+x];
  const near=(x,y,d)=>{for(let j=-d;j<=d;j++)for(let i=-d;i<=d;i++)if(Math.abs(i)+Math.abs(j)<=d+(d>1?1:0)&&on(x+i,y+j))return true;return false};
  const c=document.createElement("canvas");c.width=LW;c.height=LH;c.className="logo";const g=c.getContext("2d");
  g.fillStyle="rgba(8,6,16,.55)";for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(near(x,y-3,2)||near(x-1,y-2,2))g.fillRect(x,y,1,1);
  for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){if(on(x,y))continue;if(near(x,y,1)){g.fillStyle="#14101f";g.fillRect(x,y,1,1)}else if(near(x,y,2)){g.fillStyle=y>30?"#ffd23e":"#bfe2ff";g.fillRect(x,y,1,1)}}
  for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){const p=cell[y*LW+x];if(!p)continue;const n=p.ramp.length;let i=Math.round(p.k*(n-2))+1;
    if(!on(x,y-1)||!on(x-1,y))i=Math.max(0,i-1-(on(x,y-1)?0:1));else if(!on(x,y+1)||!on(x+1,y))i=Math.min(n-1,i+1);
    if(p.ramp!==GOLD&&((x+y*2)%23===0||(x+y*2)%23===1)&&p.k<.7)i=Math.max(0,i-2);
    g.fillStyle=p.ramp[i];g.fillRect(x,y,1,1)}
  g.fillStyle="#fff";for(const[x,y]of[[13,4],[98,9],[27,30],[101,27],[104,57],[6,52]]){g.fillRect(x,y-1,1,3);g.fillRect(x-1,y,3,1)}
  g.fillStyle="#ffd23e";for(const[x,y]of[[8,14],[104,40],[22,60],[94,3]])g.fillRect(x,y,1,1);
  return c}
$("logoBig").append(makeLogo());$("logoSm").append(makeLogo());
/* ================= splash: a looping brawl ================= */
const SP={c:$("sp"),on:true,t:0,a:[],fx:[],pt:[],next:.2};
function spInit(){const ks=Object.keys(MONS);SP.a=ks.map((k,i)=>({k,x:60+(i%4)*170+rnd(-20,20),y:110+((i/4)|0)*170+rnd(-20,20),vx:rnd(-70,70),vy:rnd(-50,50),w:rnd(0,9),fl:0}));paintArena(buildArena("stadium"))}
function spTick(dt){const S=SP,c=S.c.getContext("2d"),r=S.c.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(devicePixelRatio||1,1.5);
  if(S.c.width!==Math.round(r.width*dpr)){S.c.width=Math.round(r.width*dpr);S.c.height=Math.round(r.height*dpr)}
  const sc=Math.max(S.c.width/640,S.c.height/400),ox=(S.c.width-640*sc)/2,oy=(S.c.height-400*sc)/2;c.setTransform(sc,0,0,sc,ox,oy);c.imageSmoothingEnabled=false;S.t+=dt;
  for(const a of S.a){a.x+=a.vx*dt;a.y+=a.vy*dt;a.w+=dt*7;if(a.fl>0)a.fl-=dt;if(a.x<60||a.x>640-60)a.vx*=-1;if(a.y<90||a.y>400-30)a.vy*=-1;a.x=clamp(a.x,60,640-60);a.y=clamp(a.y,90,400-30);if(Math.random()<dt*.6){a.vx=rnd(-110,110);a.vy=rnd(-80,80)}}
  S.next-=dt;if(S.next<=0){S.next=rnd(.12,.3);const a=S.a[(Math.random()*S.a.length)|0],b=S.a[(Math.random()*S.a.length)|0],col=TY[MONS[a.k].t[(Math.random()*2)|0]].c,k=Math.random();
    if(k<.4&&a!==b){const an=Math.atan2(b.y-a.y,b.x-a.x);for(let i=0;i<5;i++)S.fx.push({k:"s",x:a.x,y:a.y-20,vx:Math.cos(an+rnd(-.15,.15))*320,vy:Math.sin(an+rnd(-.15,.15))*320,t:1.2,w:i*.06,c:col})}
    else if(k<.58)S.fx.push({k:"r",x:a.x,y:a.y,r:8,t:.7,c:col});
    else if(k<.76&&a!==b){S.fx.push({k:"b",x:a.x,y:a.y-20,x2:b.x,y2:b.y-20,t:.3,c:col});b.fl=.15;spBoom(b.x,b.y-20,col,18)}
    else if(k<.9){const x=rnd(60,640-60),y=rnd(80,400-30);S.fx.push({k:"l",x,y,t:.2});spBoom(x,y,"#f7d23e",16)}
    else{spBoom(a.x,a.y-20,"#ff7a3d",30);spBoom(a.x,a.y-20,"#ffd84a",16);a.fl=.15}}
  c.drawImage(bg,0,0,640,400);c.fillStyle="rgba(12,10,22,.35)";c.fillRect(0,0,640,400);
  for(const a of [...S.a].sort((p,q)=>p.y-q.y)){c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(a.x,a.y+1,18,7,0,0,7);c.fill();drawSprite(c,a.k,Math.floor(a.w)%2,Math.round(a.x),Math.round(a.y),2.4,a.vx<0,a.fl>0)}
  for(let i=S.fx.length-1;i>=0;i--){const f=S.fx[i];if(f.w>0){f.w-=dt;continue}f.t-=dt;if(f.t<=0){S.fx.splice(i,1);continue}
    if(f.k==="s"){f.x+=f.vx*dt;f.y+=f.vy*dt;c.fillStyle=f.c;c.fillRect(f.x-5,f.y-5,10,10);c.fillStyle="#fff";c.fillRect(f.x-2,f.y-2,4,4);if(Math.random()<.5)S.pt.push({x:f.x,y:f.y,vx:rnd(-30,30),vy:rnd(-30,30),c:f.c,t:.3});
      for(const a of S.a)if(Math.hypot(a.x-f.x,a.y-20-f.y)<18&&f.t<1.05){a.fl=.12;spBoom(f.x,f.y,f.c,8);f.t=0;break}}
    else if(f.k==="r"){f.r+=260*dt;c.globalAlpha=Math.min(1,f.t*2);c.strokeStyle=f.c;c.lineWidth=7;c.beginPath();c.arc(f.x,f.y,f.r,0,7);c.stroke();c.strokeStyle="#fff";c.lineWidth=2;c.stroke();c.globalAlpha=1}
    else if(f.k==="b"){const an=Math.atan2(f.y2-f.y,f.x2-f.x),k=f.t/.3;c.save();c.translate(f.x,f.y);c.rotate(an);c.fillStyle=f.c;c.fillRect(0,-12*k,800,24*k);c.fillStyle="#fff";c.fillRect(0,-5*k,800,10*k);c.restore()}
    else drawBolt(c,f.x,f.y,"#fff7b0")}
  for(let i=S.pt.length-1;i>=0;i--){const p=S.pt[i];p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.t<=0){S.pt.splice(i,1);continue}c.globalAlpha=Math.min(1,p.t*3);c.fillStyle=p.c;c.fillRect(p.x,p.y,4,4)}c.globalAlpha=1;
  const g=c.createRadialGradient(640/2,400/2,60,640/2,400/2,640*.62);g.addColorStop(0,"rgba(12,10,22,.55)");g.addColorStop(1,"rgba(12,10,22,.1)");c.fillStyle=g;c.fillRect(0,0,640,400)}
function spBoom(x,y,c,n){for(let i=0;i<n;i++){const a=rnd(0,6.28),s=rnd(40,220);SP.pt.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,t:rnd(.25,.6)})}}
spInit();
$("bStart").onclick=()=>{SFX.init();SFX.play("ui");$("bStart").hidden=true;$("nameBox").hidden=false;$("splash").classList.add("naming");try{$("nick").focus()}catch(e){}};
$("nameBox").addEventListener("submit",e=>{e.preventDefault();SEL.nick=cleanNick($("nick").value);$("hello").textContent="ผู้เล่น: "+SEL.nick;SP.on=false;show("menu")});

let last=0;
function sloop(ts){if(!SP.on)return;requestAnimationFrame(sloop);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;if(!$("splash").hidden){try{spTick(dt)}catch(e){console.error(e)}}}
requestAnimationFrame(sloop);

/* ================= view: a Phaser 4 scene that draws the simulation ================= */
const hex=s=>parseInt(s.length===4?s[1]+s[1]+s[2]+s[2]+s[3]+s[3]:s.slice(1),16);
const PAL={
  fire:["#ffffff","#fff3a0","#ffd23e","#ff9a2a","#f0531a","#a3211a","#4a1a1a"],
  water:["#ffffff","#d8f2ff","#9ad4ff","#4aa3f0","#2a6fd0","#1c4a9a","#12306a"],
  grass:["#ffffff","#e6ffb0","#a8f06a","#5cc84a","#2f9a3f","#1f6e30","#144a22"],
  elec:["#ffffff","#fffbd0","#fff06a","#f7d23e","#e0a01a","#9a6a10","#5a3a0a"],
  earth:["#fff6e0","#f0d8a8","#d8a868","#b07a3e","#8a5a2a","#5f3e1e","#3a2612"],
  wind:["#ffffff","#f0fffa","#c8f5e8","#8fe3d0","#5ab8a8","#3a8a7e","#255a52"],
  metal:["#ffffff","#e8eef4","#c4ced8","#98a4b0","#6c7884","#48525c","#2a3038"],
  shadow:["#f0e0ff","#c8a0ff","#9a6adf","#6a3fb0","#43287a","#2a1850","#150c2a"],
  ice:["#ffffff","#e8fbff","#bfefff","#8fdcf8","#5ab4e8","#2f7ab8","#1c4a7a"],
  light:["#ffffff","#fffbe0","#fff3a0","#ffe070","#f5c542","#c8962a","#7a5a1a"],
  norm:["#ffffff","#f4f0ff","#d8d2ea","#b0a8c8","#8880a0","#5a5470","#34304a"]};
const PALH={};for(const k in PAL)PALH[k]=PAL[k].map(hex);
const pick=a=>a[(Math.random()*a.length)|0];
let BGD=false,PG=null,SCN=null;const CUR={vx:0,vy:0,life:300,tint:0xffffff,rot:0},EM={};
const D={GFX:10,ENT:100,CAN:5600,AIR:6000,TXT:7800,UI:8000};
function hsh(x,y,s){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967296}
function vnoise(x,y,s,px){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,w=v=>px?((v%px)+px)%px:v;
  const a=hsh(w(xi),yi,s),b=hsh(w(xi+1),yi,s),c=hsh(w(xi),yi+1,s),d=hsh(w(xi+1),yi+1,s),u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function sheet(s,key,fw,fh,n,fn){const c=document.createElement("canvas");c.width=fw*n;c.height=fh;const g=c.getContext("2d");
  for(let i=0;i<n;i++){const f=fn(i);for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const col=f(x,y);if(col){g.fillStyle=col;g.fillRect(i*fw+x,y,1,1)}}}
  const t=s.textures.addCanvas(key,c);for(let i=0;i<n;i++)t.add(i,0,i*fw,0,fw,fh);
  if(n>1)s.anims.create({key,frames:Array.from({length:n},(_,i)=>({key,frame:i})),frameRate:n>6?22:12,repeat:n>6?0:-1});return t}
const cl=(r,i)=>r[Math.max(0,Math.min(r.length-1,i|0))];
function makeTextures(s){const T=s.textures;
  for(const k in MONS)for(const i of [0,1])T.addCanvas("m_"+k+"_"+i,SPR[k].f[i]);
  for(const k in PROP)T.addCanvas("p_"+k,PROP[k]);
  let sd=1;
  for(const t in PAL){const R=PAL[t];sd+=7;const seed=sd;
    /* explosion: a ragged disc that grows, hollows out and darkens */
    sheet(s,"ex_"+t,48,48,8,i=>{const k=i/7,rad=22*(.3+.7*(1-(1-k)*(1-k))),hole=k<.35?0:(k-.35)/.65*rad*1.05;return(x,y)=>{const dx=x-23.5,dy=y-23.5,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      const n=vnoise(a*2.2+9,d*.18+i*.7,seed)*.9+vnoise(x*.35,y*.35,seed+i)*.5,dd=d+(n-.7)*rad*.45*(.4+k);if(dd>rad||dd<hole)return null;return cl(R,(dd/rad)*3.2+k*3.4)}});
    /* beam body strips, tileable along x */
    sheet(s,"bm_"+t,64,32,1,()=>(x,y)=>{const e=Math.abs(y-15.5)/16,ph=x/64*6.2832;
      if(t==="fire"){const I=(1-e)*1.25+(vnoise(x/8,y/5,seed,8)-.5)*.9+(vnoise(x/4,y/3,seed+1,16)-.5)*.4;return I<.28?null:cl(R,(1-Math.min(1,I))*6.5)}
      if(t==="water"){const lim=.86+(vnoise(x/8,3.3,seed,8)-.5)*.25;if(e>lim)return null;if(e>lim-.13&&hsh(x,y,seed)>.45)return R[0];if(vnoise(x/16,y/1.5,seed+2,4)>.7)return R[e<.4?0:1];return R[e<.35?2:e<.65?3:4]}
      if(t==="grass"){const v1=Math.abs(y-15.5-7*Math.sin(ph*2)),v2=Math.abs(y-15.5+7*Math.sin(ph*2));if(v1<1.5||v2<1.5)return R[1];if(v1<2.6||v2<2.6)return R[4];const lim=.78+(vnoise(x/8,1.7,seed,8)-.5)*.3;if(e>lim)return null;return cl(R,2+e*2.4+(vnoise(x/4,y/4,seed+3,16)-.5)*1.6)}
      if(t==="earth"){const lim=.82+(vnoise(x/8,2.1,seed,8)-.5)*.34;if(e>lim)return null;const cx=Math.floor(x/7),cy=Math.floor(y/6);if(hsh(cx,cy,seed)>.62){const ix=x%7,iy=y%6;if(ix===0||iy===0||ix===6||iy===5)return hsh(x,y,seed+5)>.5?R[5]:null;return R[ix+iy<5?1:ix+iy>8?4:2]}return hsh(x,y,seed+1)>.62?null:R[hsh(x,y,seed+2)>.5?3:4]}
      if(t==="wind"){if(Math.abs(y-15.5-11*Math.sin(ph))<1.3)return R[0];if(Math.abs(y-15.5+11*Math.sin(ph+1))<1.1)return R[3];const n=vnoise(x/16,y/2,seed,4);return n>.7&&e<.95?R[n>.84?0:n>.76?1:3]:null}
      if(t==="metal"){const row=Math.floor(y/6),ry=row*6+3,q=((x+row*17)%22),half=2.6-Math.abs(q-7)/3;if(row>0&&row<5&&q<14&&Math.abs(y-ry)<half)return R[Math.abs(y-ry)<.8?0:y<ry?1:3];return e<.2?R[2]:e<.34&&(x+y)%2?R[3]:null}
      if(t==="shadow"){const I=(1-e)*1.2+(vnoise(x/8,y/5,seed,8)-.5)*.9+(vnoise(x/4,y/3,seed+1,16)-.5)*.5;if(Math.abs(y-15.5-8*Math.sin(ph*2+1))<1.2)return R[0];if(I<.3)return null;return cl(R,6.4-Math.min(1,I)*4.6)}
      const I=(1-e)*(1-e);if(I<.12||(I<.36&&(x+y)%2))return null;return R[I>.8?0:I>.55?2:3]});
    /* projectile, 4 frames, pointing along +x */
    sheet(s,"shot_"+t,20,20,4,i=>(x,y)=>{const dx=x-9.5,dy=y-9.5,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      if(t==="fire"){const hx=x-13,hd=Math.hypot(hx,dy);if(hd<5.2)return cl(R,hd/1.6);if(x<13&&x>0){const half=4.6*Math.pow(x/13,1.2)*(1+.32*Math.sin(x*.9+i*1.6));if(Math.abs(dy)<half)return cl(R,2+(13-x)/3.4+(Math.abs(dy)>half*.55?1:0))}return null}
      if(t==="water"){const rx=6+Math.sin(i*1.57),ry=6-Math.sin(i*1.57)*.8,q=Math.hypot(dx/rx,dy/ry);if(q<1){if(dx<-1&&dx>-4&&dy<-1&&dy>-4)return R[0];return R[q>.8?4:q>.5?3:2]}if(Math.hypot(x-2-i%2,y-9.5)<1.3)return R[2];return null}
      if(t==="grass"){if(x<2||x>18)return null;const half=4.2*Math.sin(Math.PI*(x-2)/16);if(Math.abs(dy)>half)return null;if(Math.abs(dy)<.7)return R[i%2?0:1];return Math.abs(dy)>half-1?R[5]:R[dy<0?2:3]}
      if(t==="elec"){if(d<3.4)return R[d<2?0:1];if(d<9&&Math.abs(Math.sin(a*2.5+i*2.1+d*.9))>.93)return R[1];if(d<5.4&&(x+y+i)%2)return R[3];return null}
      if(t==="earth"){const lim=7*(.74+.26*vnoise(a*1.5+i*1.57+7,1,seed));if(d>lim)return null;if(d>lim-1.1)return R[6];const sl=dx*Math.cos(i*1.57)+dy*Math.sin(i*1.57)+dy;return R[sl<-3?1:sl>3?5:3]}
      if(t==="wind"){const q=Math.hypot(x-8,dy),an=Math.atan2(dy,x-8);if(Math.abs(an)<1.15-i*.05){if(q>5.6&&q<8.4-Math.abs(an)*1.2)return R[q>7?2:0];if(q>2.2&&q<3.8)return R[1]}return null}
      if(t==="metal"){const rx=Math.abs(dx*Math.cos(i*.785)+dy*Math.sin(i*.785)),ry=Math.abs(-dx*Math.sin(i*.785)+dy*Math.cos(i*.785));if(rx/8+ry/3.4>1)return null;return rx/8+ry/3.4>.78?R[5]:ry<1?R[0]:dy<0?R[1]:R[3]}
      if(t==="shadow"){if(d<3)return R[1];if(d<6.2+Math.sin(a*3+i*1.6)*1.3)return R[d<4.6?4:5];if(x<9&&Math.abs(dy+Math.sin(x*.9+i*1.5)*2)<1.4&&x>1)return R[3];if(d<8&&Math.abs(Math.sin(a*2+i*1.6))>.95)return R[2];return null}
      return d<4?R[0]:d<6?R[2]:d<7?R[4]:null})}
  sheet(s,"flame",16,24,6,i=>(x,y)=>{const h=(23-y)/23,w=6.4*Math.pow(1-h,.7)*(1+.25*Math.sin(i*1.05+h*6)),cx=7.5+Math.sin(h*5+i*1.05)*1.7*h,d=Math.abs(x-cx)/(w||.01);return d>1?null:cl(PAL.fire,d*2.2+h*3.3)});
  sheet(s,"wave",32,64,1,()=>(x,y)=>{const n=vnoise(y/8,x/6,5,8);if(x<4+n*9)return null;if(x>26-n*3)return hsh(x,y,3)>.25?"#ffffff":"#d8f2ff";if(vnoise(y/4,x/3,9,16)>.7)return "#d8f2ff";return x>18?"#9ad4ff":x>11?"#4aa3f0":"#2a6fd0"});
  sheet(s,"swirl",64,64,1,()=>(x,y)=>{const dx=x-31.5,dy=y-31.5,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);if(d>30||d<3)return null;return Math.sin(a*3+d*.36)>.35?cl(PAL.wind,d/9):null});
  sheet(s,"px",4,4,1,()=>()=>"#fff");sheet(s,"spark",8,2,1,()=>()=>"#fff");
  sheet(s,"soft",10,10,1,()=>(x,y)=>{const d=Math.hypot(x-4.5,y-4.5);return d<3?"#fff":d<5&&(x+y)%2?"#fff":null});
  sheet(s,"leaf",7,4,1,()=>(x,y)=>Math.abs(y-1.5)<=1.6*Math.sin(Math.PI*(x+.5)/7)?"#fff":null);
  sheet(s,"drop",3,5,1,()=>(x,y)=>(y===0&&x!==1)?null:"#fff");
  sheet(s,"rockbit",5,5,1,()=>(x,y)=>((x===0||x===4)&&(y===0||y===4))?null:(x+y<3?"#fff":"#bbb"));
  sheet(s,"star",5,5,1,()=>(x,y)=>x===2||y===2?"#fff":null);
  sheet(s,"orb",20,20,1,()=>(x,y)=>{const d=Math.hypot(x-9.5,y-9.5);return d<4?"#fff":d<6.5?"#ffffffcc":d<9&&(x+y)%2?"#ffffff88":null});
  sheet(s,"shadow",32,12,1,()=>(x,y)=>Math.hypot((x-15.5)/16,(y-5.5)/6)<1?"rgba(0,0,0,.34)":null);
  sheet(s,"chev",12,12,1,()=>(x,y)=>Math.abs(y-5.5)<=(x-1)*.55&&x<11?"#f5c542":null);
  sheet(s,"mound",34,18,1,()=>(x,y)=>{const a=Math.hypot((x-16.5)/16,(y-10)/8),b=Math.hypot((x-16.5)/11,(y-7)/6);return b<1?"#8a5a2a":a<1?"#6b4424":null});
  const mk=(name,tex,o)=>{EM[name]=s.add.particles(0,0,tex,Object.assign({emitting:false,speedX:{onEmit:()=>CUR.vx},speedY:{onEmit:()=>CUR.vy},lifespan:{onEmit:()=>CUR.life},tint:{onEmit:()=>CUR.tint},alpha:{start:1,end:0}},o)).setDepth(D.AIR+10)};
  mk("sq","px",{scale:{start:1,end:.2},blendMode:"ADD"});mk("sqg","px",{scale:{start:1,end:.6},gravityY:420});
  mk("soft","soft",{scale:{start:1.5,end:.3},blendMode:"ADD"});mk("smoke","soft",{scale:{start:.8,end:2.2},alpha:{start:.5,end:0}});
  mk("drop","drop",{scale:{start:1.3,end:.8},gravityY:520});mk("leaf","leaf",{scale:{start:1.3,end:.8},rotate:{start:0,end:540}});
  mk("rock","rockbit",{scale:{start:1.4,end:1},rotate:{start:0,end:360},gravityY:300});mk("streak","spark",{scale:{start:1.6,end:.4},rotate:{onEmit:()=>CUR.rot},blendMode:"ADD"})}
const emit=(n,x,y,vx,vy,life,tint,rot)=>{const e=EM[n];if(!e)return;CUR.vx=vx;CUR.vy=vy;CUR.life=life*1000;CUR.tint=tint;CUR.rot=rot||0;e.emitParticleAt(x,y,1)};
function spray(type,x,y,n,sp){const P=PALH[type]||PALH.norm;for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(.3,1)*sp,vx=Math.cos(a)*v,vy=Math.sin(a)*v;
  switch(type){case"fire":emit(i%3?"soft":"sq",x,y,vx,vy-40,rnd(.25,.5),pick(P.slice(1,5)));break;
    case"water":emit("drop",x,y,vx,vy-120,rnd(.3,.55),pick(P.slice(0,3)));break;
    case"grass":emit("leaf",x,y,vx,vy,rnd(.35,.6),pick(P.slice(2,5)));break;
    case"elec":emit("streak",x,y,vx*1.6,vy*1.6,rnd(.1,.22),pick(P.slice(0,3)),a*57.3);break;
    case"earth":emit(i%2?"rock":"smoke",x,y,vx,vy-100,rnd(.35,.6),i%2?pick(P.slice(2,5)):0x8a6a4a);break;
    case"wind":emit("streak",x,y,vx*1.3,vy*1.3,rnd(.2,.35),pick(P.slice(0,3)),a*57.3);break;
    case"metal":if(i%2)emit("rock",x,y,vx,vy-80,rnd(.3,.5),pick(P.slice(0,4)));else emit("streak",x,y,vx*1.5,vy*1.5,rnd(.1,.2),pick([0xffd23e,0xff9a2a,0xffffff]),a*57.3);break;
    case"shadow":emit(i%2?"smoke":"sq",x,y,vx*.7,vy*.7-20,rnd(.35,.6),i%2?pick([0x43287a,0x2a1850]):pick(P.slice(0,3)));break;
    case"ice":emit(i%2?"sq":"drop",x,y,vx,vy-40,rnd(.3,.55),pick(P.slice(0,4)));break;
    case"light":emit(i%2?"streak":"soft",x,y,vx*1.3,vy*1.3,rnd(.2,.4),pick(P.slice(0,4)),a*57.3);break;
    case"blue":emit(i%3?"soft":"sq",x,y,vx,vy-40,rnd(.25,.5),pick(P.slice(0,4)));break;
    default:emit("sq",x,y,vx,vy,rnd(.2,.4),0xffffff)}}}
const ADDT={fire:1,elec:1,grass:1,wind:1,norm:1,light:1,ice:1};
function boomSprite(x,y,type,sc){const o=SCN.add.sprite(x,y,"ex_"+type).setScale(sc).setDepth(D.AIR+5).setRotation(rnd(0,6.28));if(ADDT[type])o.setBlendMode("ADD");o.play("ex_"+type);o.once("animationcomplete",()=>o.destroy());return o}
function jag(g,x0,y0,x1,y1,amp,step){const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,n=Math.max(2,Math.round(L/step)),nx=-dy/L,ny=dx/L,p=[];for(let i=0;i<=n;i++){const k=i/n,o=i===0||i===n?0:rnd(-amp,amp);p.push([x0+dx*k+nx*o,y0+dy*k+ny*o])}return p}
function strokePts(g,p,w,col,al){g.lineStyle(w,col,al);g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);g.strokePath()}
function boltPts(g,p,w,P){strokePts(g,p,w*1.5,P[3],.35);strokePts(g,p,w*.7,P[2],.85);strokePts(g,p,Math.max(1.5,w*.25),0xffffff,1)}
const FX={
  burst(x,y,c,n,sp,life){if(!VIEW.ready)return;const t=hex(c);for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(.3,1)*sp;emit("sq",x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.5,1)*(life||.4),t)}},
  pop(x,y,txt,c,big){if(!VIEW.ready)return;const o=SCN.add.text(x,y,txt,{fontFamily:big?'"Chakra Petch",sans-serif':'"Silkscreen","Chakra Petch",monospace',fontSize:big?"13px":"14px",fontStyle:"bold",color:c,stroke:"#000",strokeThickness:3}).setOrigin(.5).setDepth(D.TXT).setResolution(2);
    SCN.tweens.add({targets:o,y:y-(big?26:20),alpha:{from:1,to:0},ease:"Cubic.easeIn",duration:big?1300:900,onComplete:()=>o.destroy()})},
  hit(x,y,type){if(!VIEW.ready)return;boomSprite(x,y,type,.8);spray(type,x,y,6,130)},
  boom(x,y,type,rad){if(!VIEW.ready)return;const P=PALH[type]||PALH.norm;boomSprite(x,y,type,Math.max(1,rad/19));spray(type,x,y,Math.min(40,10+rad*.35),rad*3.2);
    const r=SCN.add.circle(x,y,rad).setStrokeStyle(3,P[1],1).setDepth(D.GFX+2).setScale(.3);SCN.tweens.add({targets:r,scale:1.15,alpha:0,duration:300,onComplete:()=>r.destroy()});
    if(type==="elec")FX.bolt(x,y);
    if(type==="water")for(let i=0;i<26;i++)emit("drop",x+rnd(-rad,rad)*.4,y,rnd(-40,40),-rnd(260,520),rnd(.5,.9),pick(P.slice(0,3)));
    if(type==="fire"||type==="earth")for(let i=0;i<8;i++)emit("smoke",x+rnd(-rad,rad)*.5,y+rnd(-rad,rad)*.3,rnd(-20,20),-rnd(30,70),rnd(.6,1),type==="fire"?0x3a3038:0x8a6a4a)},
  bolt(x,y){if(!VIEW.ready)return;const g=SCN.add.graphics().setDepth(D.AIR+20).setBlendMode("ADD"),x0=x+rnd(-40,40);let nt=0;
    VIEW.fx.push({t:.2,upd(dt,k){nt-=dt;if(nt<=0){nt=.05;g.clear();boltPts(g,jag(g,x0,-10,x,y,16,26),7,PALH.elec);const b=jag(g,x0+(x-x0)*.5,y*.5,x+rnd(-60,60),y*.5+rnd(30,80),8,18);strokePts(g,b,2,0xfffbd0,.9)}g.setAlpha(Math.min(1,k*2))},kill(){g.destroy()}})}
};
function dashCircle(g,x,y,r,rot){const n=Math.max(8,Math.round(r/5));for(let i=0;i<n;i++){const a=rot+i/n*6.2832;g.beginPath();g.arc(x,y,r,a,a+6.2832/n*.55);g.strokePath()}}
function syncList(list,store,make,upd){const seen=new Set();for(const o of list){let v=store.get(o);if(!v){v=make(o);if(!v)continue;store.set(o,v)}seen.add(o);if(upd)upd(o,v)}
  for(const [o,v] of store)if(!seen.has(o)){if(Array.isArray(v))v.forEach(q=>q.destroy());else v.destroy();store.delete(o)}}
function fillTint(o,on){if(on){o.setTint(0xffffff);if(o.setTintMode)o.setTintMode(Phaser.TintModes.FILL);else if(o.setTintFill)o.setTintFill(0xffffff)}else{o.clearTint();if(o.setTintMode)o.setTintMode(Phaser.TintModes.MULTIPLY)}}
function glow(o,col,str){try{if(o.enableFilters){o.enableFilters();return o.filters.internal.addGlow(col,str,0,1,false,8,10)}if(o.postFX)return o.postFX.addGlow(col,str,0,false)}catch(e){}return null}


/* ================= ultimate visuals: extra textures, big effects, per-ultimate drawing ================= */
PAL.blue=["#ffffff","#d8f6ff","#8fe0ff","#3fa8ff","#2a62e8","#1c2f9e","#141a4a"];PALH.blue=PAL.blue.map(hex);ADDT.blue=1;
const ez=k=>1-Math.pow(1-clamp(k,0,1),3);
function relabel(){if(!G)return;const me=G.me;for(const b of ABS){if(!(b.key==="b"||b.key===0||b.key===1||b.key===2))continue;const mv=slotMove(me,b.key),t=mvT(mv,me);b.b.querySelector(".nm2").textContent=mv.n||"";b.b.style.setProperty("--tc",TY[t].c)}}
function makeUltTex(s){for(const i of [0,1])if(!s.textures.exists("m_nivaraK_"+i))s.textures.addCanvas("m_nivaraK_"+i,pix(SS,SS,KNIGHTDRAW,i).c);
  sheet(s,"crescent",20,32,1,()=>(x,y)=>{const a=Math.hypot(x-4,y-15.5)/14,b=Math.hypot(x-1,y-15.5)/12.5;if(a>1||b<1)return null;return a>.85?PAL.light[3]:a>.7?PAL.light[1]:"#ffffff"});const F=PAL.fire,Bl=PAL.blue,Wt=["#ffffff","#ffffff","#fffbe0","#fff0a0","#ffd86a","#ffb040","#d06a20"];
  const fb=(key,R)=>sheet(s,key,32,32,4,i=>(x,y)=>{const dy=y-15.5,hd=Math.hypot(x-21,dy);if(hd<8.6)return cl(R,hd/2.4+(hd>7?1:0));
    if(x<21&&x>0){const half=7.8*Math.pow(x/21,1.15)*(1+.3*Math.sin(x*.75+i*1.6));if(Math.abs(dy)<half)return cl(R,2+(21-x)/5.2+(Math.abs(dy)>half*.6?1:0))}
    if(x<17&&hsh(x,y,i+3)>.93&&Math.abs(dy)<9)return R[2];return null});
  fb("fb_o",F);fb("fb_w",Wt);fb("fb_b",Bl);
  sheet(s,"flameb",16,24,6,i=>(x,y)=>{const h=(23-y)/23,w=6.4*Math.pow(1-h,.7)*(1+.25*Math.sin(i*1.05+h*6)),cx=7.5+Math.sin(h*5+i*1.05)*1.7*h,d=Math.abs(x-cx)/(w||.01);return d>1?null:cl(Bl,d*2.2+h*3.3)});
  /* phoenix, wings up / down, flying toward +x */
  sheet(s,"phoenix",72,56,2,i=>(x,y)=>{const R=F,dy=y-27.5,u=Math.abs(dy),span=i?19:26,sw=i?1.25:.82;
    const bd=Math.hypot((x-42)/13,dy/4.6);if(bd<1)return R[bd<.5?0:1];
    if(Math.hypot(x-56,dy)<4.2)return R[x>57&&u<1.3?3:0];if(x>=59&&x<65&&u<=(65-x)*.42)return R[3];
    if(u<4&&x>=48&&x<=54&&dy<-2.5&&hsh(x,y,5)>.4)return R[2];
    if(u<span&&u>2){const le=46-u*sw,ch=(17-u*.42)*(1+.14*Math.sin(u*1.4)),te=le-ch;if(x<=le&&x>=te){const q=(le-x)/ch;return R[Math.min(5,1+((q*3.2+u/span*1.8)|0))]}}
    if(x<31&&x>1){const k=(31-x)/30;for(const sg of [-1,0,1]){const cy=sg*k*14+Math.sin(x*.5+i*2)*1.6*k;if(Math.abs(dy-cy)<1.1+(1-k)*2.4)return R[Math.min(5,2+((k*3.6)|0))]}}
    return null});
  const C=[[18,28,13],[34,20,16],[52,17,18],[70,21,15],[83,29,11],[48,29,19],[28,31,12],[66,31,14],[10,33,8]];
  sheet(s,"cloud",96,44,1,()=>(x,y)=>{if(y>41)return null;let inn=false,top=0;for(const c of C){const d=Math.hypot(x-c[0],y-c[1])/c[2];if(d<1){inn=true;top=Math.max(top,(c[1]-y)/c[2]*(1-d*.3))}}
    if(!inn)return null;const v=y/40*1.15-top*.55+(hsh(x,y,77)-.5)*.16;return v<-.05?"#c4c8e2":v<.2?"#9196bc":v<.48?"#646a92":v<.75?"#454a70":"#2c2f4c"});
  sheet(s,"chili",14,24,1,()=>(x,y)=>{if(y<5){if(y>=1&&y<3&&Math.abs(x-7-(3-y)*.8)<1.2)return "#3fa34d";if(y>=3&&Math.abs(x-7)<3.6)return y===4?"#2f8a3f":"#5cc84a";return null}
    const k=(y-5)/18,cx=7+Math.sin(k*2.4)*2.2,w=4.4*Math.pow(Math.sin(Math.PI*Math.min(1,k*.85+.15)),.8)*(1-k*.3);if(Math.abs(x-cx)>w)return null;const q=(x-cx)/Math.max(.5,w);return q<-.45?"#ff7a5a":q>.5?"#a01410":"#e8281a"});
  sheet(s,"dhead",28,22,1,()=>(x,y)=>{const dy=y-10.5,P=PAL.water,E=PAL.elec,u=Math.abs(dy);
    if(x>=1&&x<=10){const hy=6.4+(10-x)*.6;if(Math.abs(u-hy)<1.1)return E[x<4?1:2]}
    if(Math.hypot(x-15,u-4)<1.6)return x>15?"#ffffff":E[1];
    const sk=Math.hypot((x-11)/9,dy/6.6)<1,sn=x>=14&&x<=26&&u<=5.8*(1-(x-14)/15);if(!sk&&!sn)return null;
    if(sn&&x>17&&u<.7)return P[6];if(x>23&&u>2.5&&u<3.3)return "#ffffff";
    const e=sk?Math.hypot((x-11)/9,dy/6.6):u/(5.8*(1-(x-14)/15)+.01);if(e>.86)return P[5];return dy<-2?P[2]:dy>2.5?P[4]:P[3]});
  sheet(s,"volcano",64,46,1,()=>(x,y)=>{if(y<5)return null;const hw=9+(y-5)*.6+(vnoise(y/4,1,31)-.5)*3,dx=x-31.5;if(Math.abs(dx)>hw)return null;
    if(y<9&&Math.abs(dx)<7)return y<7?"#ffd23e":"#ff7a1a";
    for(const [s0,k] of [[-1,.45],[1,.3],[.15,.05]]){const lx=31.5+s0*(y-8)*k+Math.sin(y*.55+s0*3)*1.6;if(Math.abs(x-lx)<1.5-(y-8)/60&&y<44)return y<22?"#ffd23e":"#ff7a1a"}
    if(hsh(x,y,9)>.9)return "#2a2024";const sh=dx/hw;return sh<-.5?"#6a5458":sh<0?"#4f3e42":sh<.5?"#3e3034":"#2a2024"});
  sheet(s,"boulder",40,40,1,()=>(x,y)=>{const dx=x-19.5,dy=y-19.5,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),lim=18*(.8+.2*vnoise(a*1.6+5,1,41));if(d>lim)return null;const E=PAL.earth;if(d>lim-1.3)return E[6];if(vnoise(x/5,y/5,43)>.8)return E[5];const l=(dx+dy)/lim;return E[l<-.6?1:l<-.1?2:l<.5?3:4]})}
FX.mega=function(x,y,type,rad){if(!VIEW.ready)return;const s=SCN,P=PALH[type]||PALH.norm;
  for(let i=0;i<5;i++){const a=i*1.2566+rnd(0,1),r=i?rad*.5:0;s.time.delayedCall(i*50,()=>{if(VIEW.ready&&G)boomSprite(x+Math.cos(a)*r,y+Math.sin(a)*r,type,Math.max(1.2,rad/(i?30:16)))})}
  for(const [d,w,c] of [[0,6,P[1]],[80,3,0xffffff],[170,3,P[3]]]){const r=s.add.circle(x,y,rad*1.3).setStrokeStyle(w,c,1).setDepth(D.GFX+3).setScale(.12);s.tweens.add({targets:r,scale:1.15,alpha:0,delay:d,duration:460,ease:"Cubic.easeOut",onComplete:()=>r.destroy()})}
  const pl=s.add.rectangle(x,y+6,rad*.9,720,P[1]).setOrigin(.5,1).setBlendMode("ADD").setDepth(D.AIR+4).setAlpha(.8);s.tweens.add({targets:pl,scaleX:0,alpha:0,duration:380,ease:"Cubic.easeIn",onComplete:()=>pl.destroy()});
  spray(type,x,y,44,rad*4.5);for(let i=0;i<14;i++)emit("smoke",x+rnd(-rad,rad)*.6,y+rnd(-rad,rad)*.4,rnd(-30,30),-rnd(30,90),rnd(.8,1.3),type==="fire"||type==="blue"?0x3a3038:P[5]);
  G.shake=Math.max(G.shake,10);softFlash(.32,200)};
function softFlash(al,ms){if(!VIEW.ready)return;const r=SCN.add.rectangle(VIEW.camX+VW/2,VIEW.camY+VH/2,VW+60,VH+60,0xffffff).setDepth(D.UI-1).setAlpha(al);SCN.tweens.add({targets:r,alpha:0,duration:ms,onComplete:()=>r.destroy()})}
function magicCircle(g,x,y,r,rot,c1,c2,al){if(r<4||al<=0)return;g.lineStyle(3,c1,al).strokeCircle(x,y,r);g.lineStyle(1.5,c2,al).strokeCircle(x,y,r*.9);g.lineStyle(1.5,c1,al*.8).strokeCircle(x,y,r*.55);
  for(const sg of [1,-1]){g.lineStyle(2,sg>0?c2:c1,al);g.beginPath();for(let i=0;i<=3;i++){const a=rot*sg+(sg>0?0:1.0472)+i*2.0944,px=x+Math.cos(a)*r*.9,py=y+Math.sin(a)*r*.9;if(i)g.lineTo(px,py);else g.moveTo(px,py)}g.strokePath()}
  for(let i=0;i<24;i++){const a=-rot*.6+i*.2618,l=i%3===0?7:3;g.lineStyle(2,i%3===0?c2:c1,al);g.beginPath();g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.lineTo(x+Math.cos(a)*(r+l),y+Math.sin(a)*(r+l));g.strokePath()}
  for(let i=0;i<6;i++){const a=rot+i*1.0472;g.lineStyle(1.5,c1,al).strokeCircle(x+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9,r*.09)}
  for(let i=0;i<12;i++){const a=rot*1.4+i*.5236,px=x+Math.cos(a)*r*.72,py=y+Math.sin(a)*r*.72;g.fillStyle(i%2?c1:c2,al);g.fillRect(px-1.5,py-1.5,3,3);if(i%2)g.fillRect(px-.5,py-3.5,1,7)}}
function bubble(g,x,y,r,al){g.fillStyle(0x9ad4ff,.18*al).fillCircle(x,y,r);g.lineStyle(2,0xe8f8ff,.9*al).strokeCircle(x,y,r);g.lineStyle(1.5,0x7cc4ff,.6*al).strokeCircle(x,y,r-3);
  g.lineStyle(1.5,0xffb0ff,.5*al);g.beginPath();g.arc(x,y,r-1.5,.3,1.3);g.strokePath();g.lineStyle(2,0xffffff,.75*al);g.beginPath();g.arc(x,y,r-5,3.7,4.6);g.strokePath();g.fillStyle(0xffffff,.9*al).fillRect(x-r*.42,y-r*.62,3,3)}
function ghostImg(o,tint){const g=SCN.add.image(o.x,o.y,o.texture.key).setOrigin(o.originX,o.originY).setScale(o.scaleX,o.scaleY).setFlipX(o.flipX).setBlendMode("ADD").setTint(tint).setAlpha(.7).setDepth(o.depth-1);SCN.tweens.add({targets:g,alpha:0,duration:240,onComplete:()=>g.destroy()})}
const UV={
  u_bird:{make(){const s=SCN;return[s.add.sprite(0,0,"phoenix").setDepth(D.AIR+24).setVisible(false).setTint(0xff3a10).setAlpha(.45).play("phoenix"),s.add.sprite(0,0,"phoenix").setBlendMode("ADD").setDepth(D.AIR+25).setVisible(false).play("phoenix")]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,F=PALH.fire;let show=false,x=0,y=0,rot=0,sc=3;
      if(t<.62){const k=t/.62;show=k>.2;x=U.sx;y=U.sy-20-ez(k)*320;rot=-1.5708;sc=1.4+k*1.8;gA.fillStyle(F[2],.3*(1-k)).fillRect(U.sx-12,U.sy-420,24,420);
        for(let i=0;i<7;i++)emit(i%3?"soft":"sq",U.sx+rnd(-16,16),U.sy-rnd(0,40),rnd(-50,50),-rnd(240,560),rnd(.3,.6),pick(F.slice(0,5)))}
      for(let k=0;k<3;k++){const t0=BIRD_T[k],an=U.ang+k*2.0944,cx=Math.cos(an),cy=Math.sin(an),nx=-cy,ny=cx;
        if(t>t0-.55&&t<t0+BIRD_P){const L=600,hw=46,al=t<t0?.2+.18*Math.sin(t*36):.12;gG.fillStyle(F[3],al).fillPoints([{x:U.tx-cx*L+nx*hw,y:U.ty-cy*L+ny*hw},{x:U.tx+cx*L+nx*hw,y:U.ty+cy*L+ny*hw},{x:U.tx+cx*L-nx*hw,y:U.ty+cy*L-ny*hw},{x:U.tx-cx*L-nx*hw,y:U.ty-cy*L-ny*hw}],true);
          gG.lineStyle(2,F[2],.7);gG.lineBetween(U.tx-cx*L+nx*hw,U.ty-cy*L+ny*hw,U.tx+cx*L+nx*hw,U.ty+cy*L+ny*hw);gG.lineBetween(U.tx-cx*L-nx*hw,U.ty-cy*L-ny*hw,U.tx+cx*L-nx*hw,U.ty+cy*L-ny*hw);
          if(t<t0)for(let d=-L+((t*700)%90);d<L;d+=90){const px=U.tx+cx*d,py=U.ty+cy*d;gG.fillStyle(F[1],.8).fillTriangle(px+cx*12,py+cy*12,px+nx*9,py+ny*9,px-nx*9,py-ny*9)}}
        const p=(t-t0)/BIRD_P;if(p>=0&&p<=1){show=true;const b=birdPos(U,k,p);x=b[0];y=b[1]-34;rot=b[2];sc=4.2;gG.fillStyle(0,.25).fillEllipse(b[0],b[1]+4,110,30);
          for(let i=0;i<12;i++)emit(i%4?"soft":"sq",x-cx*rnd(0,60)+rnd(-26,26),y-cy*rnd(0,60)+rnd(-26,26),-cx*rnd(100,320)+rnd(-70,70),-cy*rnd(100,320)+rnd(-70,70),rnd(.3,.65),pick(F.slice(0,5)));
          for(let i=0;i<3;i++)emit("smoke",b[0]+rnd(-30,30),b[1]+rnd(-10,10),0,-rnd(20,50),.9,0x3a3038)}}
      if(t>=BIRD_L-.36&&t<BIRD_L){const k=(t-BIRD_L+.36)/.36;show=true;x=U.tx;y=U.ty-34-(1-ez(k))*340;rot=1.5708;sc=3.4-k*1.2;gG.lineStyle(2,F[2],.9);dashCircle(gG,U.tx,U.ty,100,t*3);gG.fillStyle(F[3],.25*k).fillCircle(U.tx,U.ty,100*k);
        for(let i=0;i<8;i++)emit("soft",x+rnd(-20,20),y-rnd(0,40),rnd(-40,40),-rnd(100,260),.4,pick(F.slice(0,4)))}
      for(const q of o){q.setVisible(show);if(show)q.setPosition(x,y).setRotation(rot)}if(show){o[1].setScale(sc);o[0].setScale(sc*1.25)}},
    mod(U){const t=U.t;if(t<.25)return{z:ez(t/.25)*46,sc:2.4};if(t<BIRD_L+.03)return{hide:1};return null}},
  u_shell:{make(){const s=SCN;return[s.add.image(0,0,"swirl").setBlendMode("ADD").setTint(0x7cc4ff).setVisible(false),s.add.image(0,0,"swirl").setBlendMode("ADD").setTint(0xd8f2ff).setVisible(false)]},
    upd(U,o,dt,gG){const f=U.own,t=U.t,P=PALH.water,x=f.x,y=f.y;
      if(t<.38){for(let i=0;i<5;i++){const a=rnd(0,6.283),r=rnd(30,64);emit("drop",x+Math.cos(a)*r,y-12+Math.sin(a)*r,-Math.cos(a)*r*4,-Math.sin(a)*r*4,.2,pick(P.slice(0,3)))}return}
      const on=t<3.6;o[0].setVisible(on).setPosition(x,y-10).setRotation(-t*16).setScale(1.35).setAlpha(.8).setDepth(D.ENT+y+2);o[1].setVisible(on).setPosition(x,y-10).setRotation(-t*24+1).setScale(.85).setAlpha(.9).setDepth(D.ENT+y+3);if(!on)return;
      gG.fillStyle(0xd8f2ff,.35).fillEllipse(x,y+2,76,28);gG.lineStyle(2,0xffffff,.6).strokeEllipse(x,y+2,60+Math.sin(t*20)*6,20);
      for(let i=0;i<6;i++){const a=t*16+i*1.047,r=28;emit("drop",x+Math.cos(a)*r,y-10+Math.sin(a)*r*.6,-Math.sin(a)*280+rnd(-30,30),Math.cos(a)*160-rnd(40,140),rnd(.25,.45),pick(P.slice(0,3)))}
      if(Math.random()<.6)emit("sq",x+rnd(-22,22),y-rnd(0,34),rnd(-70,70),-rnd(40,110),.45,pick([0xffffff,0xbfeaff,0xe8a0ff]));emit("smoke",x+rnd(-8,8),y+2,0,-10,.6,0xd8f2ff)},
    mod(U){const t=U.t;if(t<.38)return{sc:2-t*.9};if(t>=3.6)return null;return{rot:t*28,og:.6,sc:1.9}}},
  u_cloud:{make(){const s=SCN;return[s.add.image(0,0,"cloud").setDepth(D.AIR+30).setAlpha(0),s.add.image(0,0,"cloud").setDepth(D.AIR+31).setAlpha(0).setFlipX(true)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,E=PALH.elec,f=U.own,k=t<.85?ez(t/.85):t>6.2?clamp((6.7-t)/.5,0,1):1,cx=t<.85?f.x:U.cx,cy=t<.85?f.y:U.cy,bob=Math.sin(t*2)*3,R=125*k,fl=U.flash>0||(t>5.7&&Math.sin(t*40)>0);
      o[0].setPosition(cx,cy-118+bob).setScale(3.4*k,2.7*k).setAlpha(.8*k).setTint(fl?0xe8e8ff:0xffffff);o[1].setPosition(cx+12,cy-104-bob).setScale(2.4*k,2*k).setAlpha(.9*k).setTint(fl?0xfff8c0:0xc8cce6);
      gG.fillStyle(0x10102a,.3*k).fillCircle(cx,cy,R);gG.lineStyle(2,E[3],.6*k);dashCircle(gG,cx,cy,R,t*.8);
      if(t<.85){for(let i=0;i<3;i++){const a=rnd(0,6.283);emit("streak",f.x+Math.cos(a)*24,f.y-24+Math.sin(a)*24,Math.cos(a)*200,Math.sin(a)*200,.15,pick(E.slice(0,3)),a*57.3)}}
      for(let i=0;i<Math.round(12*k);i++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*R*.95;emit("streak",cx+Math.cos(a)*r+12,cy+Math.sin(a)*r-70,-40,430,.15,0x9ad4ff,95)}
      if(Math.random()<.6*k)emit("drop",cx+rnd(-R,R)*.7,cy+rnd(-R,R)*.7,rnd(-30,30),-rnd(60,120),.25,0xbfe6ff);
      if(Math.random()<dt*12*k){const x0=cx+rnd(-100,100),y0=cy-118+rnd(-24,24);boltPts(gA,jag(gA,x0,y0,x0+rnd(-70,70),y0+rnd(-16,16),8,12),3,E)}
      if(t>5.7&&t<6.55){gA.fillStyle(E[1],.2+.15*Math.sin(t*30)).fillCircle(cx,cy-112,70);for(let i=0;i<4;i++){const a=rnd(0,6.283),r=rnd(80,140);emit("sq",cx+Math.cos(a)*r,cy-112+Math.sin(a)*r*.6,-Math.cos(a)*r*3,-Math.sin(a)*r*2,.3,pick(E.slice(0,3)))}}},
    mod(U){const t=U.t;if(t<.85)return{z:ez(t/.85)*28+Math.sin(t*10)*2};if(t<1.1)return{z:(1-(t-.85)/.25)*28};return null}},
  u_chili:{upd(U){const t=U.t,f=U.own;if(t<.45)for(let i=0;i<3;i++){emit("leaf",f.x+rnd(-20,20),f.y-rnd(0,30),rnd(-80,80),-rnd(60,140),.4,pick(PALH.grass.slice(1,4)));emit("soft",f.x+rnd(-10,10),f.y-20,rnd(-60,60),-rnd(60,120),.35,pick(PALH.fire.slice(1,4)))}},
    mod(U){const t=U.t;if(t<.45)return{z:Math.sin(Math.PI*t/.45)*24,rot:Math.sin(t*30)*.3};return null}},
  u_colossus:{upd(U,o,dt,gG){const f=U.own,t=U.t,x=f.x,y=f.y,E=PALH.earth;
      if(t<.7){const k=t/.7;for(let i=0;i<5;i++){const a=rnd(0,6.283),r=rnd(50,110);emit("rock",x+Math.cos(a)*r,y-10+Math.sin(a)*r*.6,-Math.cos(a)*r*2.6,-Math.sin(a)*r*2.6-60,.35,pick(E.slice(1,5)))}
        gG.lineStyle(2,0x2a1a10,.85);for(let i=0;i<8;i++){const a=i*.785+.3;gG.lineBetween(x,y,x+Math.cos(a)*90*k,y+Math.sin(a)*60*k)}return}
      if(t>=7.1)return;gG.fillStyle(0x3a2612,.25).fillEllipse(x,y+2,120,40);
      if(f.moving&&Math.random()<.5)emit("smoke",x+rnd(-28,28),y+2,rnd(-30,30),-rnd(10,30),.6,0x8a6a4a);
      if(Math.random()<.3)emit("rock",x+rnd(-34,34),y-rnd(30,110),0,-rnd(40,80),.5,pick(E.slice(1,4)));if(Math.random()<.25)emit("leaf",x+rnd(-30,30),y-rnd(40,110),rnd(-20,20),rnd(10,40),.8,0x6fae5a)},
    mod(U){const t=U.t;return{sc:t<.7?2+ez(t/.7)*2.1:t<7.1?4.1+Math.sin(t*3)*.04:Math.max(2,4.1-(t-7.1)/.4*2.1),shake:t<.7?2:0}}},
  u_dragon:{make(){return[SCN.add.image(0,0,"dhead").setScale(2.2).setDepth(D.AIR+14).setVisible(false),SCN.add.graphics().setDepth(D.AIR+12)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,f=U.own,E=PALH.elec,Wa=PALH.water,h=o[0];
      if(t<.7){const k=t/.7;for(let i=0;i<4;i++){const a=t*12+i*1.57,r=44*(1-k)+10;emit(i%2?"drop":"streak",f.x+Math.cos(a)*r,f.y-16+Math.sin(a)*r*.7,-Math.sin(a)*200,Math.cos(a)*200,.2,i%2?pick(Wa.slice(0,3)):pick(E.slice(0,3)),a*57.3)}gA.fillStyle(E[2],.2+k*.3).fillCircle(U.hx,U.hy,6+k*12);h.setVisible(false);return}
      const fin=t>=5.5,al=fin?clamp(1-(t-5.5)/.45,0,1):1,pts=U.pts,n=pts.length,an=U.ha||U.ang,gb=o[1];gb.clear();
      if(n>1){for(let i=n-1;i>=0;i--){const p=pts[i],q=i/(n-1),r=(13-9*q)*(.6+.4*al);gb.fillStyle(Wa[6],al).fillCircle(p[0],p[1],r+2);gb.fillStyle(i%2?Wa[4]:Wa[3],al).fillCircle(p[0],p[1],r);gb.fillStyle(Wa[2],al).fillCircle(p[0]-r*.25,p[1]-r*.3,r*.45);if(i%4===0)gb.fillStyle(E[2],al).fillRect(p[0]-1.5,p[1]-r-2,3,4)}
        const pp=[];for(let i=0;i<n;i+=3)pp.push([pts[i][0]+rnd(-9,9),pts[i][1]+rnd(-9,9)]);if(pp.length>1){strokePts(gA,pp,2.5,E[2],.8*al);strokePts(gA,pp,1.2,0xffffff,.9*al)}
        for(let i=4;i<n;i+=6){const p=pts[i],q=pts[i-2],a=Math.atan2(p[1]-q[1],p[0]-q[0])+1.5708;for(const sg of [-1,1])strokePts(gb,[[p[0],p[1]],[p[0]+Math.cos(a)*sg*15*al-Math.cos(a-1.5708)*7,p[1]+Math.sin(a)*sg*15*al-Math.sin(a-1.5708)*7]],3,E[2],al)}
        gG.fillStyle(0,.18*al).fillEllipse(U.hx,U.hy+30,44,12)}
      h.setVisible(al>.05).setPosition(U.hx,U.hy).setRotation(an).setFlipY(Math.cos(an)<0).setAlpha(al).setScale(2.2*(fin?1+(t-5.5)*.8:1));
      for(let i=0;i<3;i++){const a=rnd(0,6.283);emit("streak",U.hx,U.hy,Math.cos(a)*240,Math.sin(a)*240,.14,pick(E.slice(0,3)),a*57.3)}emit("drop",U.hx,U.hy,rnd(-60,60),-rnd(40,120),.35,pick(Wa.slice(0,3)))},
    mod(U){const t=U.t;if(t<.7)return{z:ez(t/.7)*14};return null}},
  u_bubble:{upd(U,o,dt,gG,gO){const t=U.t,f=U.own,v=uFoe(U);
      if(t<.7){const k=t/.7;bubble(gO,f.x,f.y-30,8+k*18,.8);if(Math.random()<.6)emit("drop",f.x+rnd(-20,20),f.y-rnd(0,20),0,-rnd(60,140),.5,pick(PALH.water.slice(0,3)))}
      for(const b of U.bs||[]){bubble(gO,b.x,b.y,22+Math.sin(b.ph*2)*2,1);if(Math.random()<.2)emit("sq",b.x+rnd(-12,12),b.y+rnd(-12,12),0,-30,.4,0xd8f2ff)}
      if(U.cap>0||v.bub>0){bubble(gO,v.x,v.y-36,38+Math.sin(t*8)*2.5,1);if(Math.random()<.4)emit("drop",v.x+rnd(-20,20),v.y-rnd(10,50),rnd(-20,20),-rnd(20,60),.5,0xbfe6ff)}},
    mod(U){const t=U.t;if(t<.7)return{z:ez(t/.7)*24};if(t<.95)return{z:(1-(t-.7)/.25)*24};return null}},
  u_volcano:{make(U){return[SCN.add.image(U.x,U.y+6,"volcano").setOrigin(.5,1).setScale(2.4,0).setDepth(D.ENT+U.y+3)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,x=U.x,y=U.y,F=PALH.fire,c=o[0],r=U.r,ch=t<.7?ez(t/.7):t<4.5?1:Math.max(0,1-(t-4.5)/.5);c.setScale(2.4,2.4*ch).setPosition(x+(t<.7?rnd(-2,2):0),y+6);
      if(t<.7){for(let i=0;i<3;i++)emit("rock",x+rnd(-30,30),y,rnd(-80,80),-rnd(100,220),.5,pick(PALH.earth.slice(2,5)))}
      if(r>2){const k=.45+.12*Math.sin(t*3);gG.fillStyle(0x2a1a1a,1).fillCircle(x,y,r+5);gG.fillStyle(0xc2360a,1).fillCircle(x,y,r);gG.fillStyle(0xff7a1a,1).fillCircle(x,y,r*.8);gG.fillStyle(0xffd23e,1).fillCircle(x+Math.sin(t*1.3)*r*.2,y+Math.cos(t)*r*.1,r*.55*k*1.4);
        gG.fillStyle(0x3a2420,1);for(let i=0;i<12;i++){const a=i*.524+t*.15,rr=r*(.4+.5*((i*37)%10)/10);gG.fillRect(x+Math.cos(a)*rr-5,y+Math.sin(a)*rr-2,10,3)}
        gG.lineStyle(2,0xfff3a0,.55).strokeCircle(x,y,r*(.3+((t*.8)%1)*.7));if(Math.random()<.6)emit("soft",x+rnd(-r,r)*.7,y+rnd(-r,r)*.7,0,-rnd(30,70),.6,pick(F.slice(1,4)))}
      if(t>=.7&&t<4.4){const top=y+6-44*2.4*ch+10;for(let i=0;i<6;i++)emit(i%3?"sqg":"soft",x+rnd(-6,6),top,rnd(-130,130),-rnd(220,440),rnd(.5,.9),pick(F.slice(0,4)));
        for(let i=0;i<2;i++)emit("smoke",x+rnd(-10,10),top-12,rnd(-20,20),-rnd(60,110),rnd(1,1.6),0x2a2228);gA.fillStyle(F[2],.35+.15*Math.sin(t*20)).fillCircle(x,top+4,18)}
      c.setAlpha(t>4.6?Math.max(0,1-(t-4.6)/.5):1)},
    mod(U){const t=U.t;if(t<.35)return{sc:2-ez(t/.35)*.8};if(t<4.7)return{hide:1};return null}},
  u_barrage:{make(){const s=SCN;return[s.add.sprite(0,0,"flame").setBlendMode("ADD").setOrigin(.5,.85).play("flame").setAlpha(0),s.add.sprite(0,0,"flameb").setBlendMode("ADD").setOrigin(.5,.85).play("flameb").setAlpha(0),s.add.image(0,0,"orb").setBlendMode("ADD").setAlpha(0)]},
    upd(U,o,dt,gG){const f=U.own,t=U.t,x=f.x,y=f.y,h=clamp(U.n/21,0,1),fo=o[0],fb=o[1],orb=o[2],mx=x+f.ax*22,my=y-14+f.ay*16,B=PALH.blue,F=PALH.fire;
      if(t<.55){const k=t/.55;for(let i=0;i<5;i++){const a=rnd(0,6.283),r=rnd(40,84);emit("soft",mx+Math.cos(a)*r,my+Math.sin(a)*r,-Math.cos(a)*r*4.5,-Math.sin(a)*r*4.5,.22,k>.5?pick(B.slice(1,4)):pick(F.slice(1,4)))}
        orb.setAlpha(k).setPosition(mx,my).setScale(.4+k*1.6).setTint(k>.5?B[2]:F[2]);fo.setAlpha(k*.6);fb.setAlpha(k*.3)}
      else if(t<3.2&&f.hp>0){const fl=U.flash>0?1:0;orb.setAlpha(1).setPosition(mx,my).setScale(1.2+h*1.8+fl*.9).setTint(h<.3?F[2]:h<.6?0xfff0c0:B[1]);fo.setAlpha(Math.max(0,.75-h*1.3));fb.setAlpha(Math.min(1,.2+h*1.5));
        for(let i=0;i<3;i++)emit("soft",x+rnd(-16,16),y-rnd(0,40),rnd(-20,20),-rnd(60,150),.4,h>.5?pick(B.slice(1,4)):pick(F.slice(1,4)));
        gG.fillStyle(h>.5?B[3]:F[3],.16+fl*.12).fillCircle(x,y,40+h*34);
        if(fl)for(let i=0;i<6;i++){const a=Math.atan2(f.ay,f.ax)+rnd(-.7,.7),v=rnd(200,440);emit("streak",mx,my,Math.cos(a)*v,Math.sin(a)*v,.12,h>.5?pick(B.slice(0,3)):pick(F.slice(0,3)),a*57.3)}}
      else for(const q of o)q.setAlpha(q.alpha*.85);
      const sc=2+h*2.4;fo.setPosition(x,y+2).setScale(sc*1.1,sc).setDepth(D.ENT+y-1);fb.setPosition(x,y+2).setScale(sc*1.15,sc*1.2).setDepth(D.ENT+y-1);orb.setDepth(D.ENT+y+2)},
    mod(U){return U.t<3.2&&U.flash>0?{shake:2}:null}},
  u_flood:{make(){const s=SCN,o=[s.add.rectangle(W/2,H/2,W,H,0x1f6fd0).setDepth(D.GFX-1).setAlpha(0)];for(let i=0;i<9;i++)o.push(s.add.image(0,0,"swirl").setBlendMode("ADD").setTint(i%3===2?0xd8f2ff:0x7cc4ff).setVisible(false));return o},
    upd(U,o,dt,gG){const t=U.t,lv=U.lv||0,P=PALH.water,f=U.own;o[0].setAlpha(.42*lv);
      if(t<1)for(let i=0;i<4;i++){const a=rnd(0,6.283),r=rnd(20,54);emit("drop",f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.5,Math.cos(a)*40,-rnd(150,300),.5,pick(P.slice(0,3)))}
      if(lv>0){const cx=VIEW.camX,cy=VIEW.camY;gG.fillStyle(0x8fc8ff,.55*lv);for(let i=0;i<46;i++){const x=cx+((i*97+t*30)%(VW+40))-20,y=cy+((i*53)%VH)+Math.sin(t*2+i)*4;gG.fillRect(x,y,14+(i%3)*6,2)}
        gG.fillStyle(0xffffff,.5*lv);for(let i=0;i<20;i++){const x=cx+(((i*151-t*22)%(VW+40))+VW+40)%(VW+40)-20,y=cy+((i*89)%VH);gG.fillRect(x,y,6,1)}
        for(const q of [G.me,G.op])if(q.hp>0){const rr=(t*1.5+(q===G.me?0:.5))%1;gG.lineStyle(1.5,0xffffff,.6*(1-rr)*lv).strokeEllipse(q.x,q.y+1,20+rr*40,8+rr*14)}}
      (U.sp||[]).forEach((s,i)=>{const k=t>=7.5?0:clamp((t-1)/.4,0,1);for(let j=0;j<3;j++){o[1+i*3+j].setVisible(k>0).setPosition(s.x+Math.sin(t*5+j)*3,s.y-8-j*24).setRotation((j%2?-1:1)*t*(10+j*3)).setScale((1.3-j*.25)*k*1.4).setAlpha(.85).setDepth(D.ENT+s.y+1)}
        if(k>0){gG.fillStyle(0xd8f2ff,.4).fillEllipse(s.x,s.y,74,24);for(let j=0;j<4;j++){const a=rnd(0,6.283),r=rnd(10,40);emit("drop",s.x+Math.cos(a)*r,s.y-rnd(0,64),-Math.sin(a)*200,-rnd(60,180),.45,pick(P.slice(0,3)))}}})},
    mod(U){const t=U.t;if(t<1)return{z:ez(t)*28};if(t<1.25)return{z:(1-(t-1)/.25)*28};return null}},
  u_cage:{make(){return[SCN.add.image(0,0,"boulder").setScale(5).setDepth(D.AIR+15).setVisible(false)]},
    upd(U,o,dt,gG){const t=U.t,f=U.own,E=PALH.earth,G2=PALH.grass,x=U.x,y=U.y;
      if(t<.8){const k=t/.8,st=(t/.4)|0;if(st!==U.vst){U.vst=st;FX.boom(f.x,f.y,"earth",30)}gG.lineStyle(2,E[3],.8);dashCircle(gG,x,y,90,t*2);gG.fillStyle(E[4],.18*k).fillCircle(x,y,90*k);
        if(!U.vc){U.vc=[];const n=12;for(let i=0;i<=n;i++)U.vc.push([f.x+(x-f.x)*i/n+(i&&i<n?rnd(-8,8):0),f.y+(y-f.y)*i/n+(i&&i<n?rnd(-8,8):0)])}const m=Math.max(2,Math.ceil(U.vc.length*k));strokePts(gG,U.vc.slice(0,m),3,0x2a1a10,.9)}
      else if(t<4.15){gG.lineStyle(3,G2[3],.5).strokeCircle(x,y,90);gG.lineStyle(1.5,E[2],.6).strokeCircle(x,y,84);if(Math.random()<.4){const a=rnd(0,6.283);emit("leaf",x+Math.cos(a)*90,y+Math.sin(a)*90,0,-rnd(30,60),.6,pick(G2.slice(1,4)))}}
      const b=o[0];if(t>=3.3&&t<4.15){const k=clamp((t-3.3)/.85,0,1),hh=(1-k*k)*440;b.setVisible(true).setPosition(x,y-30-hh).setRotation(t*2);gG.fillStyle(0,.15+.35*k).fillEllipse(x,y,60+110*k,22+32*k);if(Math.random()<.8)emit("smoke",b.x+rnd(-30,30),b.y-30,0,-40,.6,0x6a4e34)}else b.setVisible(false)},
    mod(U){const t=U.t;if(t<.8){const q=(t%.4)/.4;return{z:Math.sin(Math.PI*q)*20}}return null}},
  u_knight:{make(){return[SCN.add.rectangle(0,0,46,700,0xfff3a0).setOrigin(.5,1).setBlendMode("ADD").setDepth(D.AIR-2).setAlpha(0)]},
    upd(U,o,dt,gG,gO,gA){const f=U.own,t=U.t,L=PALH.light,I=PALH.ice;
      if(t<.8){const k=t/.8;o[0].setPosition(f.x,f.y+4).setAlpha(.5*k).setScale(1+k*.6,1);magicCircle(gA,f.x,f.y,50*ez(k),t*3,L[2],I[2],.9);
        for(let i=0;i<5;i++){const a=rnd(0,6.283),r=rnd(30,70);emit(i%2?"sq":"streak",f.x+Math.cos(a)*r,f.y-20+Math.sin(a)*r*.6,-Math.cos(a)*r*3,-Math.sin(a)*r*3,.25,pick(i%2?I.slice(0,3):L.slice(0,3)),a*57.3)}}
      else{o[0].setAlpha(Math.max(0,o[0].alpha-dt*2));if(t<15.6){gA.fillStyle(L[2],.12+.06*Math.sin(t*6)).fillEllipse(f.x,f.y-24,54,70);if(Math.random()<.5)emit("sq",f.x+rnd(-16,16),f.y-rnd(10,50),0,-rnd(30,70),.6,pick([...L.slice(0,3),...I.slice(0,2)]));
        if(t>14&&Math.sin(t*20)>0)gO.lineStyle(2,0xffffff,.6).strokeEllipse(f.x,f.y-24,50,66)}}},
    mod(U){const t=U.t;if(t<.8)return{z:ez(t/.8)*18,sc:2};if(t<15.8)return{tex:"m_nivaraK",sc:2.25};return null}},
  u_impact:{make(){return[SCN.add.image(0,0,"orb").setBlendMode("ADD").setTint(0xffd84a).setAlpha(0).setDepth(D.AIR+8)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,f=U.own,x=U.x,y=U.y,L=PALH.light,M=PALH.metal,orb=o[0];
      if(t<.56){const k=ez(t/.56),h=Math.sin(k*Math.PI)*150;magicCircle(gA,f.x,f.y,34+42*k,t*5,L[2],M[1],.9);orb.setPosition(f.x,f.y-30-h).setScale(.5+k*2.5).setAlpha(k).setRotation(t*8);
        for(let i=0;i<5;i++){const a=rnd(0,6.283),r=rnd(28,72);emit(i%2?"streak":"sq",f.x+Math.cos(a)*r,f.y-24+Math.sin(a)*r*.5,-Math.cos(a)*r*4,-Math.sin(a)*r*4,.25,pick([L[0],L[1],M[1],0xffffff]),a*57.3)}}
      else{orb.setAlpha(Math.max(0,1-(t-.56)*3)).setPosition(x,y-20).setScale(3.2+(t-.56)*2);const waves=[[.56,72,L[2]],[.82,126,M[1]],[1.12,190,L[1]]];
        for(const q of waves){const k=clamp((t-q[0])/.42,0,1);if(k>0&&k<1){gA.lineStyle(8*(1-k)+2,q[2],.9*(1-k)).strokeCircle(x,y,q[1]*k);gG.fillStyle(q[2],.12*(1-k)).fillCircle(x,y,q[1]*k)}}
        if(t<1.5)for(let i=0;i<4;i++){const a=rnd(0,6.283),v=rnd(100,360);emit(i%2?"rock":"streak",x+rnd(-20,20),y-rnd(0,28),Math.cos(a)*v,Math.sin(a)*v-rnd(30,160),rnd(.3,.65),pick([L[1],M[1],0xffffff]),a*57.3)}}},
    mod(U){const t=U.t;if(t<.56)return{z:Math.sin(t/.56*Math.PI)*150,sc:2+ez(t/.56)*.45};if(t<1.25)return{shake:Math.max(0,4-(t-.56)*5),sc:2.35};return null}},
  u_event:{make(){return[SCN.add.image(0,0,"swirl").setBlendMode("ADD").setTint(0x8f6ad8).setDepth(D.AIR-4),SCN.add.image(0,0,"orb").setBlendMode("ADD").setTint(0xbfefff).setDepth(D.AIR+4)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,x=U.x,y=U.y,k=clamp(t/.55,0,1),end=clamp((t-2.45)/.7,0,1),r=24+k*108-end*74;o[0].setPosition(x,y).setScale(r/28).setRotation(-t*5).setAlpha(.35+.35*k);o[1].setPosition(x,y-18).setScale(.5+k*2.4-end*2).setRotation(t*9).setAlpha(Math.max(0,1-end));
      magicCircle(gA,x,y,r,t*2,PALH.shadow[2],PALH.ice[1],.8);for(let i=0;i<6;i++){const a=rnd(0,6.283),rr=rnd(r*.7,r*1.4),v=120+end*240;emit(i%2?"smoke":"streak",x+Math.cos(a)*rr,y+Math.sin(a)*rr,-Math.cos(a)*v,-Math.sin(a)*v,.45,pick([PALH.shadow[1],PALH.ice[1],0xffffff]),a*57.3+180)}},
    mod(U){return U.t<1?{z:Math.sin(U.t*Math.PI)*42,sc:2.15}:null}},
  u_worldtree:{make(){return[SCN.add.image(0,0,"orb").setBlendMode("ADD").setTint(0x8fff8a).setDepth(D.AIR+3)]},
    upd(U,o,dt,gG,gO,gA){const t=U.t,x=U.x,y=U.y,k=ez(clamp((t-.25)/.75,0,1)),fade=t>2.7?clamp((3.5-t)/.8,0,1):1;o[0].setPosition(x,y-30-k*62).setScale(.5+k*3.4).setAlpha(fade).setRotation(t*3);
      for(let j=0;j<7;j++){const a=-1.4+j*.46,w=18+Math.sin(j*8)*6;gA.lineStyle(5-j*.35,j%2?PALH.grass[2]:PALH.light[2],.72*fade).lineBetween(x,y,x+Math.cos(a)*w*(1+k*2.6),y-10+Math.sin(a)*w*(1+k*2.6))}magicCircle(gG,x,y,50+100*k,-t,PALH.grass[1],PALH.light[1],.75*fade);
      for(let i=0;i<5;i++){const a=rnd(0,6.283),rr=rnd(20,150*k+20);emit(i%3?"leaf":"sq",x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55,Math.cos(a)*rnd(20,80),-rnd(50,150),.65,pick([PALH.grass[1],PALH.light[1],0xffffff]))}},
    mod(U){return U.t<1.1?{z:Math.sin(U.t/1.1*Math.PI)*26,sc:2.08}:null}},
  u_phantom:{make(U){const s=SCN,o=[];o.gm=s.add.graphics().setDepth(D.GFX+2);for(let k=0;k<3;k++)o.push(s.add.image(0,0,"m_"+U.own.key+"_0").setOrigin(.5,29/32).setScale(2).setTint(0x8a5ae0).setVisible(false));o.push(s.add.rectangle(U.x,U.y,44,640,0x9a6adf).setOrigin(.5,1).setBlendMode("ADD").setDepth(D.AIR-2).setAlpha(0));o.push(o.gm);return o},
    upd(U,o,dt,gG,gO,gA){const t=U.t,f=U.own,S=PALH.shadow,E=PALH.elec,x=U.x,y=U.y,k=ez(t/.45),R=84*k,fade=t>1.8?clamp(1-(t-1.8)/.15,0,1):1;
      const gm=o[4];gm.clear();gm.fillStyle(S[6],.5*k*fade).fillCircle(x,y,R+10);magicCircle(gm,x,y,R,t*1.6,S[4],S[5],fade);magicCircle(gA,x,y,R,t*1.6,S[1],E[2],.9*fade);magicCircle(gA,x,y,R*.45,-t*2.4,E[2],S[1],.7*fade);
      gA.lineStyle(1.5,S[2],.5*fade).strokeCircle(x,y,R+14);for(let i=0;i<16;i++){const a=t*.5+i*.3927;gA.fillStyle(i%2?E[2]:S[1],.7*fade).fillRect(x+Math.cos(a)*(R+14)-1.5,y+Math.sin(a)*(R+14)-1.5,3,3)}
      o[3].setPosition(x,y).setAlpha(.28*k*fade*(.8+.2*Math.sin(t*30))).setScale(1+Math.sin(t*12)*.15,1);
      for(let i=0;i<4;i++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*R;emit("sq",x+Math.cos(a)*r,y+Math.sin(a)*r,0,-rnd(60,170),rnd(.4,.8),pick([S[0],S[1],E[2]]))}
      if(Math.random()<.7)emit("smoke",x+rnd(-R,R),y+rnd(-R,R)*.6,0,-20,.8,pick([S[4],S[5]]));
      if(fade>0&&Math.random()<dt*16){const a=rnd(0,6.283);boltPts(gA,jag(gA,x+Math.cos(a)*R,y+Math.sin(a)*R,f.x+rnd(-6,6),f.y-50,10,12),3,E)}
      for(let j=0;j<3;j++){const im=o[j],on=t>=.5+j*.4&&t<1.85,p=phPos(U,j);im.setVisible(on);if(!on)continue;const q=clamp((t-.5-j*.4)/.25,0,1);
        im.setPosition(p[0]+rnd(-1,1),p[1]).setAlpha(.55+.35*Math.sin(t*25+j)).setScale(2,2*q).setFlipX(p[0]>x).setDepth(D.ENT+p[1]);magicCircle(gA,p[0],p[1],20,-t*3,S[1],E[2],.8);strokePts(gA,jag(gA,p[0],p[1]-22,f.x,f.y-52,8,12),2,E[1],.8)}},
    mod(U){const t=U.t;if(t<1.85)return{z:ez(t/.5)*34+Math.sin(t*5)*3};return null}}
};
/* ================= item visuals: icons, helper bots, field drops, HUD item button ================= */
const ICONART={
  potS:g=>{g.R(6,1,3,2,"#c8a060");g.R(5,3,5,1,"#e8e2ea");shE(g,7,9,4,4,["#ff9aa8","#ff5a6a","#d02a3a","#8a1020"]);g.P(5,7,"#ffffff");g.R(6,8,3,1,"#ffffff");g.R(7,7,1,3,"#ffffff")},
  potL:g=>{g.R(5,0,4,2,"#c8a060");g.R(4,2,6,1,"#e8e2ea");shE(g,7,8,6,5,["#ff9aa8","#ff5a6a","#d02a3a","#8a1020"]);g.P(3,6,"#ffffff");g.R(5,8,5,1,"#ffffff");g.R(7,6,1,5,"#ffffff")},
  fruit:g=>{shE(g,7,8,5,5,["#ffe680","#f5c542","#d09a20","#8a5a10"]);g.R(7,1,1,3,"#6b4424");g.R(8,2,3,2,"#5cc84a");g.P(5,6,"#fff8d0")},
  bubble:g=>{g.E(7,7,6,6,"#9ad4ff");g.E(7,7,5,5,"#d8f2ff");g.E(7,7,4,4,"#bfe6ff");g.R(4,4,2,1,"#ffffff");g.P(4,5,"#ffffff");g.P(10,9,"#ffb0ff")},
  boots:g=>{g.R(3,2,5,7,"#3a6ad8");g.R(3,9,10,3,"#2a4aa8");g.R(3,12,10,1,"#f5c542");g.L(9,3,12,6,"#fff06a");g.L(12,6,9,7,"#fff06a");g.L(9,7,12,10,"#fff06a");g.R(3,2,5,1,"#7a9aff")},
  rage:g=>{g.R(6,1,3,2,"#c8a060");shE(g,7,8,5,5,["#ffb04a","#ff6a1a","#d0301a","#7a1010"]);g.L(5,7,7,5,"#fff3a0");g.L(7,5,9,8,"#fff3a0");g.P(6,10,"#fff3a0")},
  helmet:g=>{shE(g,7,7,6,5,["#e8eef4","#c4ced8","#98a4b0","#6c7884"]);g.R(1,9,12,3,"#6c7884");g.R(5,8,4,1,"#2a3038");g.R(6,2,2,2,"#f5c542")},
  ghost:g=>{g.R(6,1,3,2,"#c8a060");shE(g,7,8,5,5,["#e0d0ff","#b89aff","#8a6ad8","#5a3aa8"]);g.P(5,7,"#2a1850");g.P(9,7,"#2a1850");g.R(6,10,3,1,"#2a1850")},
  hourglass:g=>{g.R(3,1,9,2,"#a87444");g.R(3,12,9,2,"#a87444");for(let y=3;y<12;y++){const w=Math.abs(y-7.5)*.8+1;g.R(Math.round(7.5-w),y,Math.round(w*2),1,"#d8f2ff")}g.R(6,4,3,2,"#f5c542");g.R(5,10,5,2,"#f5c542");g.P(7,7,"#f5c542")},
  heart:g=>{g.E(5,5,3,3,"#ffd23e");g.E(10,5,3,3,"#ffd23e");for(let y=6;y<13;y++){const w=(13-y)*.9;g.R(Math.round(7.5-w),y,Math.round(w*2),1,"#ffd23e")}g.R(4,4,2,1,"#fff8d0");g.R(6,7,3,1,"#ffffff");g.R(7,6,1,3,"#ffffff")},
  energy:g=>{shR(g,4,2,7,11,["#7affc8","#3ad89a","#1f9a6a"]);g.R(4,1,7,1,"#c4ced8");g.L(8,4,6,8,"#ffffff");g.L(6,8,9,8,"#ffffff");g.L(9,8,7,12,"#ffffff")},
  mystery:g=>{shR(g,1,3,12,10,["#d8a0ff","#a070d0","#7048a8"]);g.R(1,6,12,2,"#f5c542");g.R(6,3,2,10,"#f5c542");g.R(5,4,1,2,"#ffffff");g.R(4,0,6,3,"#f5c542");g.P(7,1,"#ff6a5a")},
  pistol:g=>{g.R(1,4,11,4,"#4a4e58");g.R(1,4,11,1,"#8a8e98");g.R(3,8,4,5,"#6b4424");g.R(10,3,2,2,"#2a2e38");g.R(7,8,2,2,"#2a2e38")},
  shotgun:g=>{g.R(0,4,13,3,"#4a4e58");g.R(0,4,13,1,"#9a9ea8");g.R(5,7,6,2,"#8a5a2a");g.R(9,7,4,4,"#6b4424");g.R(2,7,3,2,"#2a2e38")},
  bazooka:g=>{g.R(0,4,13,5,"#5a7a3a");g.R(0,4,13,1,"#8aaa5a");g.R(0,3,3,7,"#3a4a2a");g.R(5,9,2,3,"#3a4a2a");g.R(12,5,2,3,"#e04a3a")},
  staffE:g=>{g.L(3,13,10,3,"#a87444");g.L(4,13,11,3,"#6b4424");g.E(11,3,2,2,"#fff06a");g.P(11,3,"#ffffff");g.L(13,0,12,2,"#fff06a");g.L(9,0,10,1,"#fff06a")},
  staffI:g=>{g.L(3,13,10,3,"#c4ced8");g.L(4,13,11,3,"#98a4b0");g.E(11,3,2,2,"#9ad4ff");g.P(11,3,"#ffffff");g.P(13,1,"#d8f2ff");g.P(9,1,"#d8f2ff")},
  staffF:g=>{g.L(3,13,10,3,"#8a3a1a");g.L(4,13,11,3,"#5a1a10");g.E(11,3,2,2,"#ffa030");g.P(11,3,"#fff3a0");g.P(11,0,"#ff6a1a");g.P(13,2,"#ff6a1a")},
  wings:g=>{for(let i=0;i<6;i++){g.L(6,6,1,1+i*2,"#ffffff");g.L(8,6,13,1+i*2,"#ffffff")}g.R(1,1,5,1,"#e8f4ff");g.R(9,1,5,1,"#e8f4ff");g.R(6,5,3,4,"#f5c542")},
  car:g=>{g.R(1,6,13,5,"#e04a3a");g.R(3,3,8,4,"#c8382a");g.R(4,4,3,2,"#9ad4ff");g.R(8,4,2,2,"#9ad4ff");g.E(4,11,2,2,"#1e1e24");g.E(11,11,2,2,"#1e1e24");g.P(13,7,"#fff3a0")},
  capsule:g=>{g.E(7,7,6,6,"#3a3e48");g.E(7,7,5,5,"#5fd38a");g.R(1,7,13,6,"#e8eef4");g.R(2,7,11,1,"#2a2e38");g.E(7,7,2,2,"#2a2e38");g.P(7,7,"#ffffff");g.R(4,3,2,1,"#c8ffd8")},
  grenade:g=>{shE(g,7,8,5,5,["#8aaa5a","#5a7a3a","#3a4a2a"]);g.R(6,1,3,3,"#9a9ea8");g.L(9,2,12,4,"#c4ced8");g.R(4,7,7,1,"#3a4a2a");g.R(7,5,1,7,"#3a4a2a")},
  mine:g=>{g.E(7,9,6,3,"#4a4e58");g.E(7,8,5,2,"#6a6e78");g.R(6,5,3,3,"#2a2e38");g.P(7,5,"#ff3a2a");g.P(3,9,"#f5c542");g.P(11,9,"#f5c542")},
  boomer:g=>{g.L(2,12,7,3,"#c8743a");g.L(7,3,12,12,"#c8743a");g.L(3,12,7,4,"#a85a2a");g.L(7,4,11,12,"#a85a2a");g.P(7,3,"#f5c542")},
  totem:g=>{shR(g,4,3,7,10,["#7ad06a","#4aa04a","#2f7a3a"]);g.R(3,12,9,2,"#6b4424");g.R(6,5,3,1,"#ffffff");g.R(7,4,1,3,"#ffffff");g.E(7,1,2,1,"#c8ffd8")},
  turret:g=>{g.R(3,9,9,4,"#4a4e58");g.R(4,5,7,5,"#6c7884");g.R(4,5,7,1,"#98a4b0");g.R(10,6,4,2,"#2a2e38");g.P(6,7,"#ff3a2a")},
  smoke:g=>{shE(g,7,9,5,5,["#c4ced8","#98a4b0","#6c7884"]);g.R(6,2,3,3,"#4a4e58");g.E(4,3,2,2,"#e8eef4");g.E(10,2,2,1,"#e8eef4")},
  hook:g=>{g.L(4,1,4,8,"#c4ced8");g.L(4,8,7,12,"#c4ced8");g.L(7,12,11,10,"#c4ced8");g.L(11,10,11,7,"#c4ced8");g.P(10,7,"#ffffff");g.L(4,1,9,1,"#a87444")},
  meteor:g=>{shE(g,9,9,4,4,["#ffe070","#ff7a1a","#c2360a","#5a1a10"]);g.L(1,1,6,6,"#ffa030");g.L(2,0,7,5,"#ff6a1a");g.L(0,2,5,7,"#ff6a1a")},
  frost:g=>{shE(g,7,8,5,5,["#ffffff","#bfe6ff","#7cc4ff","#3a7ad0"]);g.L(7,3,7,13,"#ffffff");g.L(2,8,12,8,"#ffffff");g.R(6,1,3,2,"#98a4b0")},
  gravityCore:g=>{g.E(7,7,6,6,"#31234f");g.E(7,7,4,4,"#8f6ad8");g.E(7,7,2,2,"#ffffff");for(const q of [[7,0],[14,7],[7,14],[0,7]])g.P(q[0],q[1],"#bfe6ff")},
  phaseDrill:g=>{g.L(1,13,10,4,"#6c7884");g.L(2,13,11,4,"#c4ced8");g.L(4,12,12,4,"#8f6ad8");g.E(11,3,3,3,"#2a1850");g.P(12,2,"#ffffff")}};
const BOTART={
  bot2:g=>{shE(g,10,11,8,7,["#ffb06a","#ff8a3a","#d0601a","#8a3a10"]);g.R(5,9,10,4,"#2a1a14");g.R(6,10,2,2,"#fff06a");g.R(12,10,2,2,"#fff06a");g.R(9,2,2,3,"#4a4e58");g.E(10,2,2,1,"#fff06a");g.R(3,17,4,2,"#4a4e58");g.R(13,17,4,2,"#4a4e58")},
  bot3:g=>{for(let y=3;y<17;y++){const w=(y-2)*.65;g.R(Math.round(10-w),y,Math.round(w*2),1,y<9?"#fff06a":y<13?"#f7d23e":"#c89a10")}g.R(7,10,2,2,"#2a1a00");g.R(11,10,2,2,"#2a1a00");g.L(4,17,2,19,"#fff06a");g.L(16,17,18,19,"#fff06a");g.P(10,1,"#ffffff")},
  bot4:g=>{shE(g,10,9,8,8,["#d8f2ff","#7cc4ff","#3a7ad0","#1c3a8a"]);g.E(10,9,4,4,"#ffffff");g.E(10,9,2,2,"#ff3a6a");g.P(9,8,"#ffffff");g.R(2,9,2,1,"#9ad4ff");g.R(16,9,2,1,"#9ad4ff");g.R(8,18,4,1,"#7cc4ff")},
  bot5:g=>{shR(g,2,4,16,14,["#8aec7a","#5fc84a","#3a9a3a","#226e30"]);g.R(2,4,16,2,"#c8ffb8");g.R(5,9,10,4,"#14301a");g.R(6,10,3,2,"#7dffa0");g.R(11,10,3,2,"#7dffa0");g.R(0,8,2,6,"#3a9a3a");g.R(18,8,2,6,"#3a9a3a");g.R(8,1,4,3,"#f5c542")},
  bot6:g=>{g.R(4,12,12,6,"#4a4e58");g.R(5,6,10,7,"#6c7884");g.R(5,6,10,2,"#98a4b0");g.R(13,8,7,3,"#2a2e38");g.R(8,9,3,2,"#ff3a2a");g.R(3,18,14,1,"#2a2e38")}};
function makeItemTex(s){const T=s.textures;for(const k in ICONART){if(!T.exists("i_"+k))T.addCanvas("i_"+k,pix(15,15,ICONART[k]).c)}for(const k in BOTART)if(!T.exists(k))T.addCanvas(k,pix(21,21,BOTART[k]).c);
  if(!T.exists("i_wingbig"))T.addCanvas("i_wingbig",pix(40,22,g=>{for(let i=0;i<7;i++){const y=2+i*2.6;g.L(18,14,3+i*.4,y,"#ffffff");g.L(21,14,36-i*.4,y,"#ffffff");g.L(18,15,4+i*.4,y+1,"#d8ecff");g.L(21,15,35-i*.4,y+1,"#d8ecff")}g.R(18,12,4,5,"#f5c542")}).c)}
const ICONURL={};function itemIconURL(k){if(!ICONURL[k]){const c=document.createElement("canvas");c.width=c.height=30;const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(pix(15,15,ICONART[k]).c,0,0,30,30);ICONURL[k]=c.toDataURL()}return ICONURL[k]}
/* HUD item button text/icon */
function itemBtn(){const b=ABS.find(q=>q.key==="i");if(!b||!G)return;const it=G.me.item,box=b.b.querySelector(".nm2");b.b.classList.toggle("empty",!it);
  box.textContent="";if(it){const im=document.createElement("img");im.src=itemIconURL(it.k);im.alt="";im.className="ic";box.append(im,document.createTextNode(ITEMS[it.k].n+(ITEMS[it.k].uses>1?" ×"+it.uses:"")))}else box.textContent="ไอเทม"}
/* per-frame drawing of drops, smoke, totems, flying and driving fighters */
const IV={
  drops(gG,gO,st){const s=SCN;syncList(G.items,st.items,it=>s.add.image(it.x,it.y,"i_"+it.k).setScale(2).setDepth(D.ENT+it.y),(it,o)=>{const vis=itemVisible(it),blink=it.t<4&&Math.sin(G.t*20)>0;
      o.setVisible(vis&&!blink).setPosition(it.x,it.y-14+Math.sin(G.t*3+it.b)*3).setDepth(D.ENT+it.y+(it.lv?LV1:0));if(!vis)return;
      const k=.5+.5*Math.sin(G.t*4+it.b);gG.fillStyle(0,.25).fillEllipse(it.x,it.y+2,22,8);gG.lineStyle(2,ITEMS[it.k].kind==="use"?0x7cc4ff:0xffe066,.4+.4*k).strokeEllipse(it.x,it.y+2,26+k*6,10+k*2);
      if(Math.random()<.08)emit("sq",it.x+rnd(-10,10),it.y-rnd(4,26),0,-30,.5,ITEMS[it.k].kind==="use"?0x9ad4ff:0xffe066)})},
  zones(gG){for(const z of G.zones){if(z.mv.smoke){const al=Math.min(1,z.t);for(let i=0;i<4;i++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*z.mv.rad;emit("smoke",z.x+Math.cos(a)*r,z.y+Math.sin(a)*r*.7,rnd(-14,14),-rnd(8,24),rnd(1,1.8),pick([0xd8dce4,0xb8bcc4,0xe8ecf0]))}gG.fillStyle(0xc8ccd4,.22*al).fillCircle(z.x,z.y,z.mv.rad)}
      if(z.mv.totem){if(Math.random()<.4)emit("sq",z.x+rnd(-z.mv.rad,z.mv.rad)*.7,z.y+rnd(-20,20),0,-rnd(30,60),.7,pick([0x7dffa0,0xffffff]))}}},
  totems(st){syncList(G.zones.filter(z=>z.mv.totem),st.totem,z=>SCN.add.image(z.x,z.y,"i_totem").setOrigin(.5,1).setScale(2.4).setDepth(D.ENT+z.y),(z,o)=>o.setAlpha(Math.min(1,z.t*2)))}};
function itemVisible(it){const me=G.me;if((it.lv||0)!==(me.lv||0)&&G.A.key!=="city")return false;return G.A.visFn?G.A.visFn({x:it.x,y:it.y,lv:it.lv||0},me):true}
/* wings while flying, a car while driving, aura for item buffs */
function rideFx(f,v,x,y,z,sc,gG){const s=SCN;
  if(f.fly>0&&!(f.jet>0)){if(!v.wing)v.wing=s.add.image(0,0,"i_wingbig").setOrigin(.5,.7);const fl=Math.sin(G.t*14);v.wing.setVisible(v.spr.visible).setPosition(x,y-z-30).setScale(2.2,2.2*(.75+.25*fl)).setDepth(v.spr.depth-1);
    if(Math.random()<.4)emit("sq",x+rnd(-24,24),y-z-20,rnd(-20,20),rnd(20,60),.5,0xffffff)}else if(v.wing){v.wing.destroy();v.wing=null}
  if(f.car>0){if(!v.car)v.car=s.add.image(0,0,"p_car").setOrigin(.5,1);v.car.setVisible(v.spr.visible).setPosition(x,y+6).setScale(2.4).setFlipX(f.ax<0).setDepth(v.spr.depth+1);v.spr.setScale(sc*.72).setY(y-30);
    if(f.moving&&Math.random()<.7)emit("smoke",x-f.ax*40,y,-f.ax*40,-10,.5,0x8a8e98)}else if(v.car){v.car.destroy();v.car=null}
  specialRide(f,v,x,y,z,sc);
  if(f.rage>0&&Math.random()<.5)emit("soft",x+rnd(-12,12),y-rnd(10,44),0,-rnd(40,90),.4,pick([0xff3a2a,0xff8a2a]));
  if(f.regen>0&&Math.random()<.25)emit("sq",x+rnd(-14,14),y-rnd(0,40),0,-40,.6,0x7dffa0);
  if(f.cdr>0&&Math.random()<.25)emit("streak",x+rnd(-14,14),y-rnd(0,40),0,-120,.3,0x7affc8,-90)}
function buddyFx(m,o,gG,gO,gA){if(m.k===4&&m.ds===2){const ca=Math.cos(m.an),sa=Math.sin(m.an);gA.lineStyle(2,0xff3a6a,.5+.4*Math.sin(G.t*40));gA.lineBetween(m.x,m.y-22,m.x+ca*700,m.y-22+sa*700)}
  if(m.k===5){gG.lineStyle(1.5,0x7dffa0,.5).strokeCircle(m.x,m.y,22+Math.sin(G.t*6)*2)}if(m.k===2&&Math.random()<.2)emit("soft",m.x,m.y-34,rnd(-10,10),-30,.3,0xff8a3a);
  if(m.k===3&&m.ds===1){ghostImg(o,0xfff06a);for(let i=0;i<2;i++){const a=rnd(0,6.283);emit("streak",m.x,m.y-16,Math.cos(a)*220,Math.sin(a)*220,.12,0xfff06a,a*57.3)}}
  if(m.k===3&&m.ds===2){gG.lineStyle(2,0xfff06a,.7);const ca=Math.cos(m.an),sa=Math.sin(m.an);for(let d=14;d<220;d+=16)gG.lineBetween(m.x+ca*d,m.y+sa*d,m.x+ca*(d+8),m.y+sa*(d+8))}}
/* ================= City view: roofs, upper floors, glass skybridges ================= */
const LV1=2100,UPD=2000,ROOFD=4200;
const RSTY=[{roof:0x8a8a92,par:0xb8b8c0,fac:0xa8584a,win:0x2a3a5a,lit:0xffe680},{roof:0x6a7a8a,par:0x9aaaba,fac:0x5a8ab8,win:0x1a2a4a,lit:0xbfe6ff},{roof:0x9a8a72,par:0xc8b8a0,fac:0xd8c8a0,win:0x3a3a4a,lit:0xffd080}];
function roofCanvas(b){const w=Math.ceil(b.w/2),rh=Math.ceil(b.h/2),fh=14,c=document.createElement("canvas");c.width=w;c.height=rh+fh;const g=c.getContext("2d"),st=RSTY[b.sty%3],s=b.i*13+5;
  const img=g.createImageData(w,rh+fh),d=img.data,set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=rh+fh)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};
  for(let y=0;y<rh;y++)for(let x=0;x<w;x++){const e=Math.min(x,y,w-1-x,rh-1-y);let col;if(e<3)col=shade(cc(st.par),e===0?.7:e===1?1.15:1);else{col=shade(cc(st.roof),.9+nz(x/6,y/6,s)*.16);if(hsh(x,y,s)>.93)col=shade(col,1.15);if(e===3)col=shade(col,.75)}set(x,y,col)}
  for(let y=rh;y<rh+fh;y++)for(let x=0;x<w;x++){const yy=y-rh;let col=cc(st.fac);if(yy===0)col=shade(col,.7);const wx=x%12,wy=yy;if(wx>=3&&wx<9&&wy>=3&&wy<10){col=hsh(Math.floor(x/12),b.i,s)>.55?cc(st.lit):cc(st.win);if(wx===3||wy===3)col=shade(col,1.3)}
    if(wy===12)col=shade(cc(st.fac),.7);set(x,y,col)}
  g.putImageData(img,0,0);const R=seeded("roof"+b.i);
  const box=(x,y,bw,bh)=>{g.fillStyle="rgba(0,0,0,.3)";g.fillRect(x+2,y+2,bw,bh);g.fillStyle="#c4c8d0";g.fillRect(x,y,bw,bh);g.fillStyle="#e8ecf0";g.fillRect(x,y,bw,1);g.fillStyle="#7a7e88";for(let i=2;i<bw-1;i+=2)g.fillRect(x+i,y+2,1,bh-4)};
  for(let i=0;i<3;i++)box(8+((R()*(w-30))|0),8+((R()*(rh-24))|0),12,8);
  if(b.sty%3===1){g.strokeStyle="#f5c542";g.lineWidth=2;g.beginPath();g.arc(w/2,rh/2,18,0,7);g.stroke();g.fillStyle="#f5c542";g.fillRect(w/2-8,rh/2-9,3,18);g.fillRect(w/2+5,rh/2-9,3,18);g.fillRect(w/2-5,rh/2-1,10,3)}
  else{const tx=w-26,ty=10;g.fillStyle="rgba(0,0,0,.3)";g.beginPath();g.arc(tx+2,ty+10,9,0,7);g.fill();g.fillStyle="#8a6a4a";g.beginPath();g.arc(tx,ty+8,9,0,7);g.fill();g.fillStyle="#a88a6a";g.beginPath();g.arc(tx-2,ty+6,5,0,7);g.fill();
    for(let i=0;i<3;i++){g.fillStyle="#2a4a8a";g.fillRect(14+i*16,rh-24,13,10);g.fillStyle="#5a8ad8";for(let k=0;k<13;k+=4)g.fillRect(14+i*16+k,rh-24,1,10);g.fillRect(14+i*16,rh-19,13,1)}}
  /* entrances: dark doorway + striped awning on the facade (bottom doors), awning tabs with arrows on the other sides */
  const aw=(x,y,ww,hh)=>{for(let i=0;i<ww;i++)for(let j=0;j<hh;j++){g.fillStyle=(((ww>hh?i:j)>>1)&1)?"#ffffff":"#d83a2a";g.fillRect(x+i,y+j,1,1)}g.fillStyle="rgba(0,0,0,.35)";if(ww>hh)g.fillRect(x,y+hh,ww,1);else g.fillRect(x+ww,y,1,hh)};
  for(const [sd,p] of b.doors){const half=CITY.DOOR/4;
    if(sd==="b"){const x=Math.round(p/2-half);g.fillStyle="#1a1418";g.fillRect(x+2,rh+3,half*2-4,fh-3);g.fillStyle="#f5d040";g.fillRect(x+2,rh+3,half*2-4,1);aw(x,rh-3,half*2,5);
      g.fillStyle="#f5d040";for(let j=-3;j<=3;j++)g.fillRect(x+half+j,rh-9+Math.abs(j),1,2)}
    else if(sd==="t"){const x=Math.round(p/2-half);aw(x,0,half*2,5);g.fillStyle="#f5d040";for(let j=-3;j<=3;j++)g.fillRect(x+half+j,8+3-Math.abs(j),1,2)}
    else{const y=Math.round((p+28)/2-half),x=sd==="l"?0:w-5;aw(x,y,5,half*2);g.fillStyle="#f5d040";const d=sd==="l"?1:-1;for(let j=-3;j<=3;j++)g.fillRect(x+(d>0?8:-4)+d*(3-Math.abs(j)),y+half+j,2,1)}}
  /* building sign */
  const sign=b.theme||"",col={OFFICE:["#2a4a8a","#bfe6ff"],POLICE:["#1a2a5a","#ffffff"],HOME:["#8a3a2a","#ffe6b0"]}[sign]||["#333","#fff"];
  if(sign){g.font="bold 9px monospace";const tw=Math.ceil(g.measureText(sign).width)+10,sx=Math.round(w/2-tw/2),sy=sign==="POLICE"?rh-20:Math.round(rh/2-6);
    g.fillStyle="rgba(0,0,0,.4)";g.fillRect(sx+2,sy+2,tw,13);g.fillStyle=col[0];g.fillRect(sx,sy,tw,13);g.fillStyle=col[1];g.fillRect(sx,sy,tw,1);g.textBaseline="top";g.fillText(sign,sx+5,sy+2);
    if(sign==="POLICE"){g.fillStyle="#ff3a3a";g.fillRect(sx-8,sy+3,5,7);g.fillStyle="#3a7aff";g.fillRect(sx+tw+3,sy+3,5,7)}
    if(sign==="HOME"){g.fillStyle="#6a3a2a";g.fillRect(sx+tw+4,sy-6,6,12);g.fillStyle="#9a9aa0";g.fillRect(sx+tw+5,sy-9,4,3)}}
  return c}
/* jail bars: steel posts and rails, drawn instead of a brick wall */
function barsCanvas(wl){const w=Math.ceil(wl.w/2),th=Math.ceil(wl.h/2),fh=8,c=document.createElement("canvas");c.width=w;c.height=th+fh;const g=c.getContext("2d");
  g.fillStyle="#3a3e48";g.fillRect(0,0,w,th);g.fillStyle="#8a92a0";g.fillRect(0,0,w,1);
  if(w>=th){for(let x=0;x<w;x+=3){g.fillStyle="#5a6270";g.fillRect(x,th,1,fh);g.fillStyle="#aab2c0";g.fillRect(x,th,1,1)}g.fillStyle="#4a5260";g.fillRect(0,th+fh-2,w,2)}
  else{for(let y=0;y<th;y+=3){g.fillStyle="#7a8290";g.fillRect(0,y,w,1)}g.fillStyle="#5a6270";g.fillRect(0,th,w,fh);g.fillStyle="#aab2c0";g.fillRect(0,th,w,1)}return c}
function floorCanvas(b){const w=Math.ceil(b.w/2),h=Math.ceil(b.h/2),c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d"),img=g.createImageData(w,h),d=img.data,s=b.i*7+3;
  const set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};
  const base=[0x8a5a7a,0x5a7a6a,0x7a6a9a][b.sty%3];for(let y=0;y<h;y++)for(let x=0;x<w;x++){let col=shade(cc(base),.9+nz(x/4,y/4,s)*.18);if(((x>>3)+(y>>3))%2===0)col=shade(col,1.06);if(hsh(x,y,s)>.96)col=shade(col,1.15);set(x,y,col)}
  paintStair((x,y,col)=>set(x-Math.floor(b.x/2),y-Math.floor(b.y/2),col),b.stair.x,b.stair.y);g.putImageData(img,0,0);return c}
function bridgeCanvas(sk){const w=Math.ceil(sk.w/2),h=Math.ceil(sk.h/2)+6,c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");
  g.fillStyle="rgba(170,225,255,.38)";g.fillRect(0,3,w,h-6);g.fillStyle="rgba(255,255,255,.55)";for(let x=4;x<w;x+=10)g.fillRect(x,3,1,h-6);g.fillStyle="rgba(255,255,255,.35)";for(let x=0;x<w;x+=6)g.fillRect(x,6+((x*3)%(h-12)),3,1);
  g.fillStyle="#5a6270";g.fillRect(0,0,w,3);g.fillRect(0,h-3,w,3);g.fillStyle="#9aa2b0";g.fillRect(0,0,w,1);g.fillRect(0,h-3,w,1);for(let x=0;x<w;x+=12){g.fillStyle="#3a4250";g.fillRect(x,0,2,3);g.fillRect(x,h-3,2,3)}return c}
function cityViewInit(s,A){const V=A.cv={b:[],sk:[]};const tex=(k,cv)=>{if(s.textures.exists(k))s.textures.remove(k);s.textures.addCanvas(k,cv);return k};
  for(const b of A.blds){const o={b,roof:s.add.image(b.x,b.y-28,tex("roof"+b.i,roofCanvas(b))).setOrigin(0).setScale(2).setDepth(D.ENT+ROOFD),
      up:s.add.image(b.x,b.y,tex("up"+b.i,floorCanvas(b))).setOrigin(0).setScale(2).setDepth(D.ENT+UPD).setVisible(false),walls:[]};V.b.push(o)}
  A.sky.forEach((sk,i)=>V.sk.push(s.add.image(sk.x,sk.y-6,tex("sky"+i,bridgeCanvas(sk))).setOrigin(0).setScale(2).setDepth(D.ENT+UPD+1)));
  const tx={fontFamily:'"Chakra Petch",sans-serif',fontSize:"11px",fontStyle:"bold",color:"#ffe066",stroke:"#000",strokeThickness:3};
  for(const o of V.b)o.st=s.add.text(o.b.stair.x,o.b.stair.y-40,"",tx).setOrigin(.5).setDepth(D.TXT-1).setResolution(2).setVisible(false);
  V.dim=s.add.rectangle(W/2,H/2,W+80,H+80,0x05040c).setDepth(D.ENT+UPD-5).setAlpha(0);
  V.lvTxt=s.add.text(0,0,"",{fontFamily:'"Chakra Petch",sans-serif',fontSize:"12px",fontStyle:"bold",color:"#fff",stroke:"#000",strokeThickness:3}).setOrigin(.5).setDepth(D.TXT).setResolution(2)}
function cityMode(b,me){if((me.lv||0)===1)return"upper";return bldAt(me.x,me.y)===b?"ground":"roof"}
function cityViewUpd(A){const V=A.cv,me=G.me;if(!V)return;
  for(const o of V.b){const m=cityMode(o.b,me);o.roof.setVisible(m==="roof");o.up.setVisible(m==="upper");
    const near=Math.hypot(me.x-o.b.stair.x,me.y-o.b.stair.y)<520;o.st.setVisible(m!=="roof"&&near).setText(m==="upper"?"▼ ลงชั้น 1":"▲ ขึ้นชั้น 2").setY(o.b.stair.y-38+Math.sin(G.t*4)*3)}
  V.sk.forEach((o,i)=>o.setVisible(!A.sky[i].dead).setAlpha(A.sky[i].hp<A.sky[i].max ? .55 : 1));
  for(const w of A.walls)if(w.img&&w.lv===1){const b=A.blds.find(b=>inRect(b,w.x+w.w/2,w.y+w.h/2,2));w.img.setVisible(!w.dead&&(!b||cityMode(b,me)==="upper")).setAlpha(w.breach&&w.breach.length?.42:1)}
  const k=(me.lv||0)===1?.32:0;V.dim.setAlpha(V.dim.alpha+(k-V.dim.alpha)*.2);
  if(VIEW.lvT>0){VIEW.lvT-=1/60;V.lvTxt.setVisible(true).setPosition(me.x,me.y-90).setText(me.lv?"ชั้น 2":"ชั้น 1").setAlpha(Math.min(1,VIEW.lvT*3))}else V.lvTxt.setVisible(false)}
/* ================= MOBA view: unit art, units, tower shots, minimap, terrain ================= */
const TEAMC=[{a:"#7cc4ff",b:"#3a7ad0",c:"#1c3a8a",h:0x7cc4ff},{a:"#ff9a8a",b:"#e04a3a",c:"#8a1a14",h:0xff6a5a}];
const UART={
  cm:(g,T)=>{shE(g,9,11,6,6,["#d8d0c4","#b8ae9e","#8a8070","#5a5246"]);g.R(4,4,10,5,T.b);g.R(4,4,10,1,T.a);g.R(6,6,2,2,"#fff");g.R(10,6,2,2,"#fff");g.L(14,6,17,1,"#e8eef4");g.L(15,6,18,2,"#98a4b0");g.R(5,16,3,2,"#5a5246");g.R(10,16,3,2,"#5a5246")},
  cr:(g,T)=>{shE(g,9,9,6,7,[T.a,T.b,T.c]);g.E(9,7,3,3,"#ffffff");g.P(9,7,T.c);g.L(9,1,12,4,"#f5c542");g.P(12,4,"#fff3a0");g.R(5,15,8,2,T.c)},
  tw:(g,T)=>{shR(g,6,18,14,26,["#e2dccf","#c8c0b0","#a8a090","#888070"]);for(let y=20;y<42;y+=5)g.R(6,y,14,1,"#7a7262");g.R(3,42,20,4,"#6a6252");g.R(4,14,18,4,"#b8b0a0");
    for(let y=2;y<14;y++){const w=(y-1)*.55;g.R(Math.round(13-w),y,Math.round(w*2),1,y<7?T.a:T.b)}g.P(12,4,"#fff")},
  bt:(g,T)=>{shR(g,5,18,18,28,["#e2dccf","#c8c0b0","#a8a090","#888070"]);g.R(2,44,24,4,"#6a6252");g.R(3,13,22,5,"#b8b0a0");for(let i=0;i<3;i++)g.R(4+i*8,9,4,4,"#b8b0a0");
    for(let y=0;y<12;y++){const w=y*.6+1;g.R(Math.round(14-w),y,Math.round(w*2),1,y<5?T.a:T.b)}},
  orb:(g,T)=>{g.R(4,26,26,6,"#6a6252");g.R(6,22,22,5,"#a8a090");g.R(6,22,22,1,"#d8d0c0");shE(g,17,13,10,10,["#ffffff",T.a,T.b,T.c]);g.E(14,9,3,2,"#ffffff")},
  wolf:g=>{shE(g,11,9,8,5,["#b8b2ba","#8a858c","#5f5a62"]);g.E(18,6,4,3,"#8a858c");g.P(20,5,"#ff3a2a");g.L(18,3,17,1,"#5f5a62");g.R(5,13,2,3,"#5f5a62");g.R(14,13,2,3,"#5f5a62");g.L(3,8,0,5,"#8a858c")},
  golem:g=>{shE(g,12,13,9,9,["#ff9a6a","#d05a2a","#9a3a1a","#5a1a10"]);g.R(6,9,12,4,"#2a1010");g.R(8,10,3,2,"#ffd23e");g.R(14,10,3,2,"#ffd23e");g.E(3,15,3,4,"#9a3a1a");g.E(21,15,3,4,"#9a3a1a");g.E(12,4,5,2,"#ff6a2a")},
  spirit:g=>{shE(g,10,9,7,7,["#e8f8ff","#9ad4ff","#4a9aea","#1c4a9a"]);g.R(7,8,2,2,"#14306a");g.R(12,8,2,2,"#14306a");for(let i=0;i<4;i++)g.L(5+i*3,15,4+i*3,20,"#7cc4ff")},
  boss:g=>{shE(g,26,26,18,13,["#c8c0a8","#a89c84","#7a6e5a","#4e4436"]);for(let i=0;i<5;i++)g.L(12+i*6,15,10+i*6,9,"#f5c542");shE(g,44,18,8,7,["#c8c0a8","#a89c84","#7a6e5a"]);
    g.R(46,15,3,3,"#ff3a2a");g.L(49,22,54,23,"#2a1a10");g.L(42,10,40,4,"#e8e2d0");g.L(46,11,48,5,"#e8e2d0");g.R(12,36,6,5,"#5a5040");g.R(30,36,6,5,"#5a5040");g.L(8,28,1,34,"#a89c84");g.L(9,30,2,36,"#7a6e5a")}};
const USZ={cm:[20,20],cr:[18,20],tw:[26,48],bt:[28,50],orb:[34,34],wolf:[24,18],golem:[25,24],spirit:[21,22],boss:[56,44]};
function makeUnitTex(s){for(const k in UART){const T=s.textures,[w,h]=USZ[k];if(["cm","cr","tw","bt","orb"].includes(k)){for(const t of [0,1])if(!T.exists("u_"+k+t))T.addCanvas("u_"+k+t,pix(w,h,g=>UART[k](g,TEAMC[t])).c)}else if(!T.exists("u_"+k))T.addCanvas("u_"+k,pix(w,h,UART[k]).c)}}
const MV={
  units(gG,gO,gA,st){if(!G.units)return;const s=SCN,me=G.me,myT=fTeam(me);
    syncList(G.units,st.units,u=>{const key=UK[u.k].camp?"u_"+u.k:"u_"+u.k+u.team;const o=s.add.image(u.x,u.y,key).setOrigin(.5,.95).setScale(u.k==="boss"?2.4:2);return o},
      (u,o)=>{const d=UK[u.k],bob=d.still?0:Math.abs(Math.sin(G.t*8+u.x*.1))*2,fl=(u.lhp!=null&&u.hp<u.lhp)?1:0;u.lhp=u.hp;o.setPosition(Math.round(u.x),Math.round(u.y-bob)).setDepth(D.ENT+u.y);
        if(!d.still&&u.px!=null)o.setFlipX(u.x<u.px-.2?true:u.x>u.px+.2?false:o.flipX);u.px=u.x;fillTint(o,fl&&Math.random()<.6);
        gG.fillStyle(0,.3).fillEllipse(u.x,u.y+1,d.r*2.2,d.r*.8);const tc=u.team===2?0xf5c542:TEAMC[u.team].h;if(d.still)gG.lineStyle(2,tc,.6).strokeEllipse(u.x,u.y+2,d.r*2.8,d.r*1.1);
        const bw=d.still?56:u.k==="boss"?70:d.camp?34:24,hy=u.y-(USZ[u.k][1]*(u.k==="boss"?2.4:2))-8,pc=clamp(u.hp/u.max,0,1);gO.fillStyle(0,1).fillRect(u.x-bw/2-1,hy,bw+2,d.still?6:4);
        gO.fillStyle(u.team===2?0xf5c542:u.team===myT?0x5fd38a:0xef5a5a,1).fillRect(u.x-bw/2,hy+1,Math.round(bw*pc),d.still?4:2);
        if(protectedU(u)&&d.still){gO.lineStyle(1.5,0xd8f2ff,.7).strokeCircle(u.x,u.y-30,d.r+8)}
        if((u.k==="tw"||u.k==="bt")&&u.team!==myT&&me.hp>0&&Math.hypot(me.x-u.x,me.y-u.y)<d.rng+120){gG.lineStyle(2,0xff5a5a,.45);dashCircle(gG,u.x,u.y,d.rng,G.t*.5)}
        if(u.k==="orb"&&Math.random()<.3)emit("sq",u.x+rnd(-20,20),u.y-rnd(20,60),0,-40,.6,tc);if(u.k==="boss"&&Math.random()<.15)emit("smoke",u.x+rnd(-30,30),u.y-30,0,-20,.8,0x8a7e6c)});
    for(const p of G.uproj){const x=p.x0+(p.tx-p.x0)*p.t,y=p.y0+(p.ty-p.y0)*p.t,col=p.c==="L"?0x9ad4ff:p.c==="R"?0xff9a8a:0xf5c542;gA.fillStyle(col,.9).fillCircle(x,y,5);gA.fillStyle(0xffffff,1).fillCircle(x,y,2);emit("sq",x,y,0,0,.2,col)}},
  hud(gO){const me=G.me;if(G.A.respawn&&me.hp<=0&&me.respT!=null){const cx=VIEW.camX+VW/2,cy=VIEW.camY+VH/2;gO.fillStyle(0,.5).fillRect(cx-120,cy-30,240,60);
      if(!this.rt)this.rt=SCN.add.text(0,0,"",{fontFamily:'"Chakra Petch",sans-serif',fontSize:"18px",fontStyle:"bold",color:"#fff",stroke:"#000",strokeThickness:4}).setOrigin(.5).setDepth(D.UI).setResolution(2);
      this.rt.setVisible(true).setPosition(cx,cy).setText("เกิดใหม่ใน "+Math.ceil(me.respT)+" วินาที")}else if(this.rt)this.rt.setVisible(false);
    let y=0;for(const [k,B] of Object.entries(BUFFS))if(me["b_"+k]>0){gO.fillStyle(0,.55).fillRect(VIEW.camX+8,VIEW.camY+46+y,92,12);gO.fillStyle(hex(B.c),1).fillRect(VIEW.camX+9,VIEW.camY+47+y,Math.round(90*me["b_"+k]/B.t),10);y+=15}}};
/* minimap (DOM canvas over the stage) for the big maps */
const MINI={t:0,
  upd(dt){const c=$("mini");if(!G||!ARENAS.find(a=>a.k===G.A.key)?.big){c.hidden=true;return}c.hidden=false;this.t-=dt;if(this.t>0)return;this.t=.15;
    const src=arenaThumbSrc(G.A.key),div=G.A.key==="moba"?20:14,w=c.width=Math.round(W/div),h=c.height=Math.round(H/div),g=c.getContext("2d"),sx=w/W,sy=h/H;g.imageSmoothingEnabled=true;g.drawImage(src,0,0,w,h);
    g.strokeStyle="rgba(255,255,255,.8)";g.lineWidth=1;g.strokeRect(VIEW.camX*sx,VIEW.camY*sy,VW*sx,VH*sy);
    if(G.units){const myT=fTeam(G.me);for(const u of G.units){const d=UK[u.k];g.fillStyle=u.team===2?"#f5c542":u.team===myT?"#5fd38a":"#ef5a5a";const r=d.still?3:d.camp?2:1.5;g.fillRect(u.x*sx-r,u.y*sy-r,r*2,r*2)}}
    for(const it of G.items){g.fillStyle="#ffe066";g.fillRect(it.x*sx-1,it.y*sy-1,2,2)}
    const dot=(f,col)=>{if(f.hp<=0)return;g.fillStyle="#000";g.beginPath();g.arc(f.x*sx,f.y*sy,4,0,7);g.fill();g.fillStyle=col;g.beginPath();g.arc(f.x*sx,f.y*sy,3,0,7);g.fill()};
    if(seenBy(G.op,G.me))dot(G.op,"#ff5a5a");dot(G.me,"#7cc4ff")}};
/* terrain */
function paintMoba(A,c){const w=Math.ceil(W/2),h=Math.ceil(H/2),s=77,img=c.createImageData(w,h),d=img.data;
  const set=(x,y,col)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255};
  const segs=[];for(const p of Object.values(LANES))for(let i=0;i<p.length-1;i++)segs.push([p[i][0]/2,p[i][1]/2,p[i+1][0]/2,p[i+1][1]/2]);
  const laneD=(x,y)=>{let m=1e9;for(const [ax,ay,bx,by] of segs){const l2=(bx-ax)**2+(by-ay)**2,t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/l2,0,1),e=Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay));if(e<m)m=e}return m};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let col=GROUND.grass(x,y,s,0x2a6a32,0x3f8a40);const ld=laneD(x,y)+(nz(x/7,y/7,s)-.5)*5;
    if(ld<28){const tx=Math.floor(x/9),ty=Math.floor(y/9),ix=x%9,iy=y%9;col=shade(cc(0xb8a888),.86+hsh(tx,ty,s)*.2);if(ix===0||iy===0)col=cc(0x8a7a5e);if(hsh(x,y,s)>.95)col=cc(0x6f8a4a)}
    else if(ld<31)col=cc(0x5a5040);
    for(const [bx,by,t] of [[BASE[0][0]/2,BASE[0][1]/2,0],[BASE[1][0]/2,BASE[1][1]/2,1]]){const e=Math.hypot(x-bx,y-by);if(e<150){const tc=t?0xe04a3a:0x3a7ad0;col=e>146?cc(0x4a4436):shade(cc(0xc8c0b0),.88+hsh(Math.floor(Math.atan2(y-by,x-bx)*8),Math.floor(e/12),s)*.18);
      if(Math.abs(e-110)<2||Math.abs(e-60)<1.5)col=cc(tc);if(e<6)col=cc(tc)}}
    for(const cp of A.camps){const e=Math.hypot(x-cp.x/2,y-cp.y/2)+(nz(x/5,y/5,s+9)-.5)*6,R0=cp.k==="boss"?44:30;if(e<R0){col=cp.k==="boss"?shade(cc(0x8a7e6c),.85+hsh(x>>1,y>>1,s)*.2):shade(cc(0x7a6040),.85+nz(x/3,y/3,s)*.25);if(cp.k==="boss"&&Math.abs(e-R0+3)<1.2)col=cc(0xf5c542)}else if(e<R0+2)col=cc(0x4a3a24)}
    set(x,y,col)}
  paintRegions(A,set,s);
  for(const fx of [55,w-55]){for(let y=-45;y<=45;y++)for(let x=-45;x<=45;x++){const e=Math.hypot(x,y);if(e>45)continue;set(fx+x,h/2+y,e>41?cc(0x8a8f96):mixc(cc(0x7affe0),cc(0x1f8a8a),e/41))}}
  c.putImageData(img,0,0);const R=seeded("mobadecor");for(let i=0;i<500;i++){const x=(R()*w)|0,y=(R()*h)|0;if(laneD(x,y)<34||inAnyRegion(A,x*2,y*2,10))continue;STAMP[["flower","tuft","tuft","mush","pebble"][(R()*5)|0]](c,x,y,R)}}
/* ================= MOBA shop: HUD button, panel, special-item visuals ================= */
Object.assign(ICONART,{
  tank:g=>{g.R(1,9,13,4,"#3a4a2a");for(let x=2;x<14;x+=3)g.E(x,11,1,1,"#1e2414");g.R(2,6,11,4,"#6a7a3a");g.R(2,6,11,1,"#9aaa5a");g.R(5,3,5,4,"#5a6a32");g.R(9,4,6,2,"#3a4a2a");g.P(6,4,"#c8d48a")},
  jet:g=>{g.L(1,8,13,8,"#9aa4b0");g.R(3,7,10,3,"#7a8494");g.R(12,7,2,2,"#c4ced8");for(let i=0;i<5;i++){g.R(6-i,2+i,2,1,"#6a7484");g.R(6-i,13-i,2,1,"#6a7484")}g.R(0,5,2,6,"#5a6474");g.R(10,7,2,1,"#9ad4ff");g.P(0,8,"#ff8a2a")},
  clock:g=>{g.E(7,8,6,6,"#f5c542");g.E(7,8,5,5,"#fff8e0");g.R(6,0,3,2,"#f5c542");g.R(7,4,1,5,"#2a2a32");g.R(7,8,3,1,"#2a2a32");for(const [x,y] of [[7,3],[12,8],[7,13],[2,8]])g.P(x,y,"#8a6a2a")},
  collar:g=>{g.E(7,7,6,5,"#e04a3a");g.E(7,7,4,3,"#14121f");g.R(6,11,3,3,"#f5c542");g.P(7,12,"#fff8d0");for(const x of [2,5,9,12])g.P(x,4+(x%3),"#c8d0d8")},
  scroll:g=>{g.R(2,3,11,9,"#f0e2b8");g.R(1,2,2,11,"#a87444");g.R(12,2,2,11,"#a87444");for(let y=5;y<11;y+=2)g.R(4,y,7,1,"#5a3aa8");g.E(7,7,2,2,"#c8a0ff")}});
function makeShopTex(s){const T=s.textures;for(const k of SHOP.special)if(!T.exists("i_"+k))T.addCanvas("i_"+k,pix(15,15,ICONART[k]).c);
  if(!T.exists("r_tank"))T.addCanvas("r_tank",pix(46,30,g=>{g.R(2,20,42,8,"#2a3220");for(let x=5;x<44;x+=6){g.E(x,24,2,2,"#14180e");g.P(x,23,"#4a5638")}g.R(2,20,42,1,"#4a5638");
    shR(g,4,12,38,9,["#8a9a4a","#6a7a3a","#4a5a2a"]);g.R(4,12,38,1,"#b0c070");shR(g,12,5,18,9,["#7a8a42","#5a6a32","#3e4a22"]);g.R(12,5,18,1,"#a8b868");g.R(30,8,15,3,"#3e4a22");g.R(30,8,15,1,"#6a7a3a");g.R(43,7,3,5,"#2a3220");
    g.E(20,9,3,2,"#2a3220");g.R(7,15,4,2,"#f5c542");g.R(34,15,4,2,"#f5c542")}).c);
  if(!T.exists("r_jet"))T.addCanvas("r_jet",pix(50,30,g=>{for(let i=0;i<9;i++){g.R(20-i,4+i,10,1,"#6a7484");g.R(20-i,26-i,10,1,"#6a7484")}for(let i=0;i<4;i++){g.R(4-i,8+i,5,1,"#5a6474");g.R(4-i,22-i,5,1,"#5a6474")}
    shR(g,2,12,44,7,["#c4ced8","#9aa4b0","#6a7484"]);g.R(44,13,4,5,"#9aa4b0");g.R(48,15,2,1,"#c4ced8");g.R(30,12,8,3,"#9ad4ff");g.R(30,12,8,1,"#e8f8ff");g.R(0,13,3,5,"#ff8a2a");g.R(0,14,2,3,"#fff3a0");g.R(14,15,14,1,"#e04a3a")}).c)}
/* rider visuals for the tank and the fighter jet (called from rideFx) */
function specialRide(f,v,x,y,z,sc){const s=SCN;
  if(f.tank>0){if(!v.tank)v.tank=s.add.image(0,0,"r_tank").setOrigin(.5,1);v.tank.setVisible(v.spr.visible).setPosition(x,y+8).setScale(2.3).setFlipX(f.ax<0).setDepth(v.spr.depth+1);v.spr.setScale(sc*.62).setY(y-40);
    if(f.moving&&Math.random()<.6)emit("smoke",x-f.ax*44,y,-f.ax*30,-12,.6,0x6a6e58)}else if(v.tank){v.tank.destroy();v.tank=null}
  if(f.jet>0){if(!v.jet)v.jet=s.add.image(0,0,"r_jet").setOrigin(.5,.6);v.jet.setVisible(v.spr.visible).setPosition(x,y-z-18).setScale(2.2).setFlipX(f.ax<0).setDepth(v.spr.depth+1);v.spr.setScale(sc*.55).setY(y-z-34);
    if(Math.random()<.7)emit("soft",x-f.ax*52,y-z-16,-f.ax*120,rnd(-10,10),.25,pick([0xff8a2a,0xfff3a0]))}else if(v.jet){v.jet.destroy();v.jet=null}}
/* ---------- DOM: coin button + shop panel ---------- */
let SHOPV=null;
function shopToggle(force){const p=$("shop");const open=force==null?p.hidden:force;p.hidden=!open;if(open)shopRender()}
function shopRefresh(){if(!G||!G.units)return;const c=G.me.coins||0;if(SHOPV!==c){SHOPV=c;$("coins").textContent=c;if(!$("shop").hidden)shopRender()}}
function shopRender(){const box=$("shopList"),c=G.me.coins||0;$("shopCoins").textContent=c;box.textContent="";
  const card=(k,sp)=>{const I=ITEMS[k],p=priceOf(k),b=el("button","sc"+(sp?" sp":"")+(c<p?" no":""));const im=document.createElement("img");im.src=itemIconURL(k);im.alt="";
    b.append(im,el("b",null,I.n),el("span",null,I.d),el("em",null,p+" เหรียญ"));b.onclick=()=>{buyItem(k);shopRender()};return b};
  box.append(el("h4",null,"ไอเทมพิเศษประจำด่าน"));for(const k of SHOP.special)box.append(card(k,1));
  box.append(el("h4",null,"ไอเทมทั่วไป (สุ่มใหม่ทุก 60 วิ)"));for(const k of G.stock||[])box.append(card(k,0));
  $("shopHint").textContent=G.me.item?"ถืออยู่: "+ITEMS[G.me.item.k].n+" · ซื้อไอเทมกดใช้ชิ้นใหม่จะแทนที่ของเดิม":"ซื้อแล้วกด G (หรือปุ่มไอเทม) เพื่อใช้"}
function shopWire(){const b=$("shopBtn"),x=$("shopX"),p=$("shop");if(!b)return;b.onclick=e=>{e.stopPropagation();shopToggle()};x.onclick=e=>{e.stopPropagation();shopToggle(false)};
  for(const n of [b,p])for(const ev of ["pointerdown","pointerup","touchstart"])n.addEventListener(ev,e=>e.stopPropagation(),{passive:true})}
if(document.readyState==="loading")addEventListener("DOMContentLoaded",shopWire);else shopWire();
/* ---------- per-frame: time-stop overlay ---------- */
function shopView(gA){const el2=$("tstop");if(!G.units){if(!el2.hidden)el2.hidden=true;return}const on=G.tstop&&G.t<G.tstop.t;
  if(on){const left=G.tstop.t-G.t,mine=G.tstop.team===fTeam(G.me);el2.hidden=false;el2.className=mine?"mine":"";el2.querySelector("b").textContent=(mine?"คุณหยุดเวลาศัตรู ":"เวลาถูกหยุด! ")+left.toFixed(1);
    for(const f of [G.me,G.op])if(fTeam(f)!==G.tstop.team){gA.lineStyle(2,0xd8e8ff,.85).strokeCircle(f.x,f.y-74,10);const an=G.t*-3;gA.lineBetween(f.x,f.y-74,f.x+Math.cos(an)*7,f.y-74+Math.sin(an)*7)}}
  else if(!el2.hidden)el2.hidden=true}
/* extra sprites for the new arenas and moves */
Object.assign(PROP,{
  cactus:pix(16,24,g=>{const A="#3a9a4a",B="#5cc86a",D="#256e34";g.R(6,3,5,19,A);g.R(6,3,2,19,B);g.R(1,9,4,3,A);g.R(1,6,3,4,A);g.R(12,12,3,3,A);g.R(13,8,3,5,A);g.P(8,1,"#ff9ab0");g.P(9,2,"#ff9ab0");g.P(7,2,"#ff9ab0");for(const[x,y]of[[5,6],[11,9],[5,14],[11,17],[0,7],[15,9]])g.P(x,y,"#f4f0d8");g.R(9,5,1,16,D)}).c,
  icep:pix(18,26,g=>{const A="#bfeaff",B="#eaf8ff",D="#7fbfe8";g.L(9,1,3,10,A);g.L(9,1,15,10,A);for(let y=2;y<22;y++){const w=y<10?(y-1)*.7:6;g.R(Math.round(9-w),y,Math.round(w*2),1,A)}g.R(5,6,2,14,B);g.R(11,5,2,16,D);g.P(8,3,"#fff");g.P(7,8,"#fff");g.E(9,22,6,2,D)}).c,
  twall:pix(18,26,g=>{const A="#9a8468",B="#b8a280",D="#6a5844";g.R(2,4,14,20,A);g.R(2,4,14,3,B);g.R(2,4,2,20,B);g.R(13,6,3,18,D);g.L(2,11,15,11,D);g.L(2,18,15,18,D);g.L(8,4,8,11,D);g.L(11,11,11,18,D);g.L(6,18,6,24,D);g.P(5,2,A);g.P(9,1,A);g.P(12,2,A);g.R(4,2,3,2,A);g.R(10,2,4,2,A)}).c,
  trap:pix(18,14,g=>{const A="#3fa34d",B="#a8f06a",D="#226e30";g.E(9,8,7,4,D);g.E(9,7,5,3,A);g.E(9,6,2,1,B);for(const[x,y]of[[2,5],[5,2],[9,1],[13,2],[16,5]])g.P(x,y,"#ffe04a");g.P(3,9,"#ff9ab0");g.P(15,9,"#ff9ab0")}).c
});
const VIEW={ready:false,fx:[],keep:new Set(),t:0,camX:0,camY:0,
  reset(){if(!this.ready||!G)return;const s=SCN,A=G.A;s.tweens.killAll();for(const o of s.children.list.slice())if(!this.keep.has(o))o.destroy();
    this.fx=[];this.st={shots:new Map(),zones:new Map(),waves:new Map(),met:new Map(),lob:new Map(),traps:new Map(),orb:new Map(),tw:new Map(),ults:new Map(),items:new Map(),totem:new Map(),units:new Map()};MV.rt=null;this.cutO=null;if(this.bgTex.width!==bg.width||this.bgTex.height!==bg.height){s.textures.remove("bg");this.bgTex=s.textures.addCanvas("bg",bg);this.bgImg.setTexture("bg")}else this.bgTex.refresh();BGD=false;this.dark.setPosition(W/2,H/2).setSize(W+80,H+80);
    this.camX=clamp(G.me.x-VW/2,0,W-VW);this.camY=clamp(G.me.y-VH/2,0,H-VH);
    for(const p of A.props){const v=p.v={};
      if(p.k==="tree"){v.a=s.add.image(p.x,p.y+4,"p_trunk").setOrigin(.5,1).setScale(2).setDepth(D.ENT+p.y);v.c=s.add.image(p.x,p.y-44,"p_canopy").setScale(2).setDepth(D.CAN);v.s=s.add.image(p.x,p.y-2,"p_stump").setScale(2).setDepth(D.ENT+p.y-20).setVisible(false)}
      else if(p.k==="bush")v.a=s.add.image(p.x,p.y-4,"p_bush").setScale(2).setDepth(D.ENT+p.y+8);
      else{const L=p.lv?LV1:0;v.sh=s.add.image(p.x,p.y+3,"shadow").setScale((p.r+4)/16,.9).setDepth(D.ENT+p.y-1+L);v.a=s.add.image(p.x,p.y+8,"p_"+p.k).setOrigin(.5,1).setScale(2).setDepth(D.ENT+p.y+L+(PDEF[p.k].hide?14:0))}}
    A.walls.forEach((w,i)=>{if(w.nodraw)return;const key="wall_"+i;if(s.textures.exists(key))s.textures.remove(key);s.textures.addCanvas(key,w.bars?barsCanvas(w):wallCanvas(w,w.inner?w.style:A.wallStyle));w.img=s.add.image(w.x,w.y-16,key).setOrigin(0).setScale(2).setDepth(D.ENT+w.y+w.h+(w.lv?LV1:0))});if(A.key==="city")cityViewInit(s,A);
    for(const f of [G.me,G.op]){const me=f===G.me;f.v={sh:s.add.image(f.x,f.y,"shadow"),spr:s.add.image(f.x,f.y,"m_"+f.key+"_0").setOrigin(.5,29/32).setScale(2),chev:me?s.add.image(0,0,"chev").setDepth(D.ENT+2):null,
      orb:s.add.image(0,0,"orb").setBlendMode("ADD").setDepth(D.AIR+2).setVisible(false),mound:s.add.image(0,0,"mound").setVisible(false),
      stars:[0,1,2].map(()=>s.add.image(0,0,"star").setTint(0xffd84a).setScale(1.4).setVisible(false)),zz:s.add.text(0,0,"z",{fontFamily:'"Silkscreen",monospace',fontSize:"12px",color:"#fff"}).setResolution(2).setVisible(false),mins:new Map(),gt:0,aura:null}}
    this.cdT=s.add.text(W/2,H/2,"",{fontFamily:'"Silkscreen","Chakra Petch",monospace',fontSize:"64px",fontStyle:"bold",color:"#f5c542",stroke:"#000",strokeThickness:8}).setOrigin(.5).setDepth(D.UI).setResolution(2)},
  ghost(f,tint,al){const o=SCN.add.image(f.v.spr.x,f.v.spr.y,f.v.spr.texture.key).setOrigin(.5,29/32).setScale(f.v.spr.scaleX,f.v.spr.scaleY).setFlipX(f.ax<0).setDepth(D.ENT+f.y-2).setBlendMode("ADD").setAlpha(al);o.setTint(tint);
    SCN.tweens.add({targets:o,alpha:0,duration:260,onComplete:()=>o.destroy()})},
  fighter(f,dt,gG,gO,gA){const v=f.v,me=f===G.me,x=Math.round(f.x),y=Math.round(f.y),P=PALH[f.mon.t[0]];
    syncList(f.minions,v.mins,m=>SCN.add.image(0,0,m.k>=2&&m.k!==7?"bot"+m.k:"m_"+f.key+"_0").setOrigin(.5,m.k>=2&&m.k!==7?.95:29/32).setScale(m.k===1||m.k>=2?2:1.1).setAlpha(m.k===7?1:.8),(m,o)=>{const ph=m.k===1||m.k===3||m.k===7,mx=m.mx||22;if(m.k===7)m.wk+=1/60*8;if(m.k<2||m.k===7)o.setTexture("m_"+f.key+"_"+(Math.floor(m.wk)%2));o.setPosition(Math.round(m.x),Math.round(m.y-(m.k===4?10+Math.sin(G.t*4)*3:m.k>=2&&m.k!==6&&m.k!==7?Math.abs(Math.sin(m.wk*.6))*3:0))).setFlipX(ph||m.k>=2?Math.cos(m.an)<0:f.ax<0).setDepth(D.ENT+m.y+(m.lv?LV1:0)).setVisible(!G.A.visFn||G.A.visFn(m,G.me));if(m.k>=2&&m.k!==7){o.setAlpha(1);buddyFx(m,o,gG,gO,gA)}if(m.k===7&&o.visible){const pc=f.hp/f.max;gG.fillStyle(0,.25).fillEllipse(m.x,m.y,30,9);gO.fillStyle(0,1).fillRect(m.x-23,m.y-75,46,6);gO.fillStyle(pc>.5?0x49b6ff:pc>.25?0xf5c542:0xef5a5a,1).fillRect(m.x-22,m.y-74,Math.round(44*pc),4)}
      if(m.k===1){o.setTint(0x8a5ae0).setAlpha(.6+.3*Math.sin(G.t*20+m.x));const S=PALH.shadow,E=PALH.elec;
        if(m.ds===2){const ca=Math.cos(m.an),sa=Math.sin(m.an);gG.lineStyle(2,0xfff06a,.75);for(let d=14;d<240;d+=16)gG.lineBetween(m.x+ca*d,m.y+sa*d,m.x+ca*(d+8),m.y+sa*(d+8));gG.lineStyle(2,S[1],.8).strokeCircle(m.x,m.y,14+Math.sin(G.t*30)*3);if(Math.random()<.5)emit("streak",m.x+rnd(-12,12),m.y-rnd(0,30),rnd(-80,80),-rnd(40,120),.15,pick(E.slice(0,3)),rnd(0,360))}
        if(m.ds===1){ghostImg(o,pick([0x4ad8ff,0x9a6adf,0xfff06a]));if(o.lx!=null)boltPts(gA,jag(gA,o.lx,o.ly-14,m.x,m.y-14,7,12),3,E);for(let i=0;i<3;i++){const a=rnd(0,6.283);emit("streak",m.x+rnd(-14,14),m.y-rnd(0,34),Math.cos(a)*240,Math.sin(a)*240,.14,pick([0xfff06a,0x4ad8ff,0xc8a0ff]),a*57.3)}}
        o.lx=m.x;o.ly=m.y;if(Math.random()<.3)emit("smoke",m.x+rnd(-10,10),m.y-rnd(0,30),0,-20,.5,S[4])}
      if(m.k===7)return;gG.fillStyle(0,.3).fillEllipse(m.x,m.y+1,ph?30:16,ph?10:6);const bw=ph?34:m.k>=2?28:16,hy=ph?m.y-70:m.k>=2?m.y-50:m.y-36;gO.fillStyle(0,1).fillRect(m.x-bw/2-1,hy,bw+2,4);gO.fillStyle(ph?0xb48cff:me?0x7dffa0:0xff8a8a,1).fillRect(m.x-bw/2,hy+1,Math.max(0,bw*m.hp/mx),2)});
    const hid=!me&&!seenBy(f,G.me)&&f.under<=0,und=f.under>0,vis=!hid&&!und;
    v.spr.setVisible(vis);v.sh.setVisible(vis);v.mound.setVisible(und&&!hid);v.orb.setVisible(false);v.zz.setVisible(false);for(const st of v.stars)st.setVisible(false);if(v.chev)v.chev.setVisible(vis);
    if(hid)return;
    if(und){v.mound.setPosition(x,y-2).setDepth(D.ENT+y);if(Math.random()<.4)emit("sqg",x+rnd(-10,10),y,rnd(-40,40),-rnd(60,140),.35,0x8a5a2a);return}
    const U=f.U,UVk=U&&UV[U.k],m=(UVk&&UVk.mod&&UVk.mod(U,f))||{};
    let z=(f.fly>0?24+Math.sin(G.t*5)*4:0)+(f.air>0?Math.sin(Math.PI*clamp(1-f.air/f.airT,0,1))*(f.airT>.6?120:60):0)+(m.z||0)+(f.bub>0?24+Math.sin(G.t*6)*3:0);const bird=f.dash&&f.dash.mv.kind==="u_bird",ph=f.dash&&f.dash.mv.kind==="u_phantom";
    if(m.hide){v.spr.setVisible(false);v.sh.setVisible(false);if(v.chev)v.chev.setVisible(false)}
    v.sh.setPosition(x,y+1).setScale(Math.max(.3,1-z*.004)*(m.sc||2)/2).setDepth(D.ENT+y-1+(f.lv?LV1:0));
    const fr=f.moving?(Math.floor(f.walk)%2):(Math.floor(G.t*2.2)%2),sc=m.sc||(bird?2.6:f.dash?2.15:2),hb=Math.max(0,(sc-2)*28),punch=f.cdB>0&&MOVES[f.mon.basic].kind==="melee"?Math.max(0,f.cdB-MOVES[f.mon.basic].cd+.12)*60:0;
    const ap=f.pose>0?Math.sin((1-f.pose/(f.poseMax||f.pose))*Math.PI):0,ak=ap?f.poseK:"",pm=MOVES[ak]||{},sty=MONSTYLE[f.key]||"caster",pk=pm.kind||"",poseD=pk==="dash"?13:pk==="shot"||pk==="beam"?-7:pk==="leap"?6:pk==="melee"?9:3,poseR=(sty==="wing"||sty==="float"?-f.ay*.2:sty==="assassin"?f.ay*.3:pk==="leap"?(f.ax<0?.2:-.2):pk==="dash"?f.ay*.24:0)*ap,poseSX=1+(pk==="shot"||pk==="beam"?.15:pk==="dash"?.1:.05)*ap,poseSY=1-(sty==="tank"?.14:.06)*ap;
    v.spr.setTexture((m.tex||"m_"+f.key)+"_"+fr).setOrigin(.5,m.og||29/32).setPosition(x+f.ax*(punch+poseD*ap)+(m.shake?rnd(-m.shake,m.shake):0),y-z+(f.roll>0?10:0)+f.ay*(punch+poseD*ap)-(m.og?(29/32-m.og)*32*sc:0)).setFlipX(f.ax<0).setScale(sc*poseSX,sc*poseSY).setDepth(D.ENT+y+(f.lv?LV1:0)).setAlpha(f.hp<=0?.5:f.roll>0?.55:f.cloak>0&&f.reveal<=0?.38:me&&inCover(f)?.6:1).setRotation(m.rot!=null?m.rot:f.hp<=0?1.4:f.roll>0?(.28-f.roll)*22*(f.ax<0?-1:1):poseR);
    fillTint(v.spr,f.flash>0);rideFx(f,v,x,y,z,sc,gG);if(ap>0){const PP=PALH[mvT(pm,f)]||PALH.norm,rr=24+ap*18;gA.lineStyle(2,PP[2],.35+ap*.45).strokeEllipse(x-f.ax*4,y-z-19,rr*2,rr);if(Math.random()<.55){const a=rnd(0,6.283);emit(sty==="wing"?"soft":sty==="assassin"?"smoke":sty==="tank"?"rock":"streak",x+Math.cos(a)*rr,y-z-20+Math.sin(a)*rr*.5,-Math.cos(a)*120,-Math.sin(a)*90,.28,pick(PP.slice(0,4)),a*57.3)}}
    if(f.frz>0){const hh=60*sc/2;gO.fillStyle(0xbfe6ff,.42).fillRect(x-22,y-hh-z,44,hh+4);gO.lineStyle(2,0xffffff,.85).strokeRect(x-22,y-hh-z,44,hh+4);gO.lineStyle(1.5,0xffffff,.7).lineBetween(x-14,y-hh+6-z,x-4,y-hh+16-z).lineBetween(x+6,y-24-z,x+14,y-14-z);if(Math.random()<.2)emit("sq",x+rnd(-20,20),y-rnd(0,hh),0,-20,.6,0xffffff)}
    else if(f.chill>0&&f.owned){gO.lineStyle(2,0x9fe6ff,.3+f.chill*.2).strokeEllipse(x,y-24,40,56);gO.fillStyle(0x0,.6).fillRect(x-20,y-86-z,40,4);gO.fillStyle(0x9fe6ff,1).fillRect(x-19,y-85-z,Math.round(38*Math.min(1,f.chill/3)),2)}
    if(me){gG.lineStyle(1.5,0xf5c542,.85).strokeEllipse(x,y+1,40,16);v.chev.setPosition(x+f.ax*36,y-8+f.ay*30).setRotation(Math.atan2(f.ay,f.ax))}
    v.gt-=dt;if(v.gt<=0&&(f.dash||f.roll>0||(f.haste>0&&f.moving))){v.gt=bird||ph?.016:.04;this.ghost(f,ph?pick([0x4ad8ff,0x9a6adf,0xfff06a]):f.dash?PALH[mvT(f.dash.mv,f)][2]:f.roll>0?0xffffff:0x8fe3d0,bird||ph?.85:.5)}if(ph)for(let i=0;i<4;i++){const a=rnd(0,6.283);emit("streak",x+rnd(-16,16),y-rnd(0,36),Math.cos(a)*260,Math.sin(a)*260,.16,pick([0xfff06a,0x4ad8ff,0xc8a0ff]),a*57.3)}
    if(bird){for(let i=0;i<5;i++)emit("soft",x+rnd(-24,24),y-rnd(0,44),-f.dash.dx*rnd(60,200)+rnd(-40,40),-f.dash.dy*rnd(60,200)-rnd(10,60),rnd(.3,.6),pick(PALH.fire.slice(1,5)));
      if(!v.aura)v.aura=SCN.add.sprite(x,y,"flame").setBlendMode("ADD").setOrigin(.5,.85).play("flame");v.aura.setPosition(x-f.dash.dx*8,y-18-f.dash.dy*8).setRotation(Math.atan2(f.dash.dy,f.dash.dx)-1.5708).setScale(5,4.4).setDepth(D.ENT+y+1)}
    else if(v.aura){v.aura.destroy();v.aura=null}
    if(f.chg||f.chgF>0){const k=f.chg?clamp(f.chg.t/1.08,0,1):.6,ox=x+f.ax*20,oy=y-12+f.ay*20,len=rayLen(x,y,f.ax,f.ay,1200);gO.lineStyle(1.5,P[3],.8);for(let d=26;d<len;d+=14){gO.beginPath();gO.moveTo(x+f.ax*d,y-12+f.ay*d);gO.lineTo(x+f.ax*(d+8),y-12+f.ay*(d+8));gO.strokePath()}
      v.orb.setVisible(true).setPosition(ox,oy).setTint(P[2]).setScale(.35+k*1.2+Math.sin(G.t*30)*.08);const a=rnd(0,6.283),r=18+k*14;emit("sq",ox+Math.cos(a)*r,oy+Math.sin(a)*r,-Math.cos(a)*r*5,-Math.sin(a)*r*5,.2,pick(P.slice(0,3)))}
    if(f.guard>0)gO.lineStyle(2,0xcfe8ff,1).strokeCircle(x,y-22,30);
    if(f.shield>0){gO.fillStyle(0x9ad4ff,.16).fillCircle(x,y-20,31);gO.lineStyle(2,0xd8f2ff,.9).strokeCircle(x,y-20,31+Math.sin(G.t*8));gO.fillStyle(0xffffff,.8).fillRect(x-18,y-38,5,3)}
    if(f.burn>0&&Math.random()<.6)emit("soft",x+rnd(-10,10),y-rnd(10,40),rnd(-10,10),-rnd(40,80),.35,pick(PALH.fire.slice(1,4)));
    if(f.slow>0){gO.fillStyle(0x7cc4ff,1).fillRect(x-14,y+2,5,3).fillRect(x+8,y+4,5,3)}
    if(f.stun>0)v.stars.forEach((st,i)=>{const a=G.t*6+i*2.09;st.setVisible(true).setPosition(x+Math.cos(a)*18,y-64+Math.sin(a)*5).setDepth(D.TXT)});
    if(f.rest>0)v.zz.setVisible(true).setPosition(x+14,y-66-((G.t*20)%10)).setDepth(D.TXT);
    const bw=44,pc=f.hp/f.max;gO.fillStyle(0,1).fillRect(x-bw/2-1,y-74-z-hb,bw+2,6);gO.fillStyle(pc>.5?0x49b6ff:pc>.25?0xf5c542:0xef5a5a,1).fillRect(x-bw/2,y-73-z-hb,Math.round(bw*pc),4);
    if(f.shield>0)gO.fillStyle(0xd8f2ff,1).fillRect(x-bw/2,y-76-z-hb,Math.round(bw*Math.min(1,f.shield/40)),2);
    if(f.ult>=100)gO.fillStyle(0xf5c542,1).fillRect(x-bw/2,y-67-z-hb,bw,2)},
  /* preview of where the held attack will go */
  aimGuide(gG){const f=G.me;if(f.hp<=0||G.over||G.cd>0)return;let key=null;for(const k of [0,1,2,"u"])if(IN.slot[k].down){key=k;break}
    if(key==null&&IN.slot.i.down&&f.item)key="i";if(key==null&&IN.slot.b.down&&IN.slot.b.manual)key="b";if(key==null)return;const mv=slotMove(f,key);if(!mv||mv.kind==="beam")return;if(key!=="b"&&key!=="u"&&f.cds[key]>0)return;if(key==="u"&&f.ult<100)return;
    const a=slotAim(f,key,mv),P=PALH[mvT(mv,f)],x=f.x,y=f.y,ang=Math.atan2(a.ay,a.ax),col=P[2];
    if(mv.aim==="self"){const r=mv.rad||mv.max||44;gG.fillStyle(col,.16).fillCircle(x,y,r);gG.lineStyle(2,col,.8).strokeCircle(x,y,r);return}
    if(mv.aim==="point"){const rng=mv.rng||160,m=Math.max(.12,a.mag),tx=clamp(x+a.ax*rng*m,FR+8,W-FR-8),ty=clamp(y+a.ay*rng*m,FR+18,H-FR),r=mv.rad||(mv.kind==="wall"?44:26);
      gG.lineStyle(1.5,col,.35).strokeCircle(x,y,rng);gG.lineStyle(2,col,.5).beginPath();gG.moveTo(x,y);gG.lineTo(tx,ty);gG.strokePath();gG.fillStyle(col,.25).fillCircle(tx,ty,r);gG.lineStyle(2,0xffffff,.8).strokeCircle(tx,ty,r);
      if(mv.rad2){gG.lineStyle(1.5,col,.6);dashCircle(gG,tx,ty,mv.rad2,G.t)}if(mv.star){const a0=Math.atan2(ty-y,tx-x);gG.lineStyle(2,col,.55);for(let k=0;k<3;k++){const an=a0+k*2.0944;gG.lineBetween(tx-Math.cos(an)*260,ty-Math.sin(an)*260,tx+Math.cos(an)*260,ty+Math.sin(an)*260)}}return}
    if(mv.aim==="cone"){const r=mv.rng||Math.min(300,mv.sp*(mv.life||1.7)),arc=mv.arc||(mv.fan+.24);gG.fillStyle(col,.2);gG.slice(x,y-10,r,ang-arc/2,ang+arc/2,false);gG.fillPath();gG.lineStyle(2,col,.75);gG.slice(x,y-10,r,ang-arc/2,ang+arc/2,false);gG.strokePath();return}
    const L=Math.min(mv.kind==="dash"||mv.udash?mv.sp*mv.dur:mv.sp?Math.min(440,mv.sp*(mv.life||1.7)):520,rayLen(x,y,a.ax,a.ay,1200)),hw=Math.max(5,(mv.hr||mv.r||8)+4),nx=-a.ay,ny=a.ax,y0=y-10;
    gG.fillStyle(col,.2).fillPoints([{x:x+nx*hw,y:y0+ny*hw},{x:x+a.ax*L+nx*hw,y:y0+a.ay*L+ny*hw},{x:x+a.ax*L-nx*hw,y:y0+a.ay*L-ny*hw},{x:x-nx*hw,y:y0-ny*hw}],true);
    gG.fillStyle(col,.8).fillTriangle(x+a.ax*(L+12),y0+a.ay*(L+12),x+a.ax*L+nx*(hw+4),y0+a.ay*L+ny*(hw+4),x+a.ax*L-nx*(hw+4),y0+a.ay*L-ny*(hw+4))},
  /* one beam = body strip + bright core or drawn arc + flowing particles, all different per element */
  beam(b){const s=SCN,type=mvT(b.mv,b.own),ang=Math.atan2(b.dy,b.dx),P=PALH[type]||PALH.norm,w=b.wd,end=Math.max(30,b.len||900),life=b.big?.36:.5,ex=b.dx,ey=b.dy,nx=-ey,ny=ex;
    const c=s.add.container(b.x,b.y).setRotation(ang).setDepth(D.AIR),add=!(type==="water"||type==="earth"||type==="metal"||type==="shadow");
    const body=s.add.tileSprite(6,0,end,32,"bm_"+type).setOrigin(0,.5);if(add)body.setBlendMode("ADD");c.add(body);
    let core=null,gfx=null;
    if(type==="fire"||type==="grass"||type==="water"||type==="shadow"){core=s.add.tileSprite(6,0,end,32,"bm_"+type).setOrigin(0,.5).setBlendMode("ADD");c.add(core)}
    if(type==="elec"||type==="wind"||type==="norm"){gfx=s.add.graphics().setBlendMode("ADD");c.add(gfx)}
    const orb=s.add.image(6,0,"orb").setTint(P[1]).setBlendMode("ADD");c.add(orb);
    boomSprite(b.x+ex*end,b.y+ey*end,type,1.2+w/14);
    const sp={fire:900,water:1250,grass:700,elec:500,earth:820,wind:1400,norm:800,metal:1500,shadow:650,light:1100,ice:900}[type]||900,at=d=>[b.x+ex*d,b.y+ey*d],deg=ang*57.2958,dens=clamp(end/700,.25,1.3);let nt=0;
    VIEW.fx.push({t:life,upd(dt,k){const age=life*(1-k),grow=Math.min(1,age/.06),fade=k<.45?k/.45:1,sy=w/13*grow*(.55+.45*fade)*(1+.08*Math.sin(age*60)),n=q=>{const f=q*dens*dt*(.4+.6*fade);return Math.floor(f)+(Math.random()<f%1?1:0)};
      body.tilePositionX-=sp*dt;body.setScale(1,sy).setAlpha(fade);if(core){core.tilePositionX-=sp*1.7*dt;core.setScale(1,sy*.42).setAlpha(.6*fade)}
      orb.setScale((w/7)*(1+.2*Math.sin(age*50))*fade+.2);
      const edge=()=>{const d=rnd(10,end),o=rnd(-1,1)*w*.8,p=at(d);return[p[0]+nx*o,p[1]+ny*o,o]};
      if(type==="fire"){for(let i=n(90);i--;){const q=edge(),v=rnd(120,300),sv=rnd(-70,70);emit("soft",q[0],q[1],ex*v+nx*sv,ey*v+ny*sv-rnd(20,70),rnd(.28,.5),pick(P.slice(1,5)))}
        for(let i=n(40);i--;){const q=edge(),v=rnd(300,520);emit("sq",q[0],q[1],ex*v+nx*rnd(-120,120),ey*v+ny*rnd(-120,120)-40,rnd(.2,.4),pick(P.slice(1,4)))}
        for(let i=n(14);i--;){const q=edge();emit("smoke",q[0],q[1]-6,ex*40,ey*40-rnd(30,60),rnd(.5,.9),0x3a3038)}}
      else if(type==="water"){for(let i=n(110);i--;){const q=edge(),v=rnd(200,420),sd=(q[2]<0?-1:1)*rnd(60,210);emit("drop",q[0],q[1],ex*v+nx*sd,ey*v+ny*sd-40,rnd(.28,.45),pick(P.slice(0,3)))}
        const e2=at(end);for(let i=n(60);i--;){const a=rnd(0,6.283),v=rnd(80,260);emit("drop",e2[0],e2[1],Math.cos(a)*v,Math.sin(a)*v-120,rnd(.3,.5),pick(P.slice(0,3)))}}
      else if(type==="grass"){for(let i=n(80);i--;){const q=edge(),v=rnd(350,620);emit("leaf",q[0],q[1],ex*v+nx*rnd(-70,70),ey*v+ny*rnd(-70,70),rnd(.35,.55),Math.random()<.12?0xffa0c0:pick(P.slice(1,5)))}
        for(let i=n(30);i--;){const q=edge();emit("sq",q[0],q[1],ex*200,ey*200,rnd(.2,.35),P[1])}}
      else if(type==="earth"){for(let i=n(70);i--;){const q=edge(),v=rnd(450,720);emit("rock",q[0],q[1],ex*v+nx*rnd(-60,60),ey*v+ny*rnd(-60,60)-30,rnd(.35,.55),pick(P.slice(1,5)))}
        for(let i=n(34);i--;){const q=edge();emit("smoke",q[0],q[1],ex*90+nx*rnd(-40,40),ey*90+ny*rnd(-40,40)-20,rnd(.4,.8),pick([0x8a6a4a,0xb08a5a,0x6a4e34]))}}
      else if(type==="metal"){for(let i=n(80);i--;){const q=edge(),v=rnd(600,900);emit("rock",q[0],q[1],ex*v+nx*rnd(-40,40),ey*v+ny*rnd(-40,40),rnd(.25,.4),pick(P.slice(0,4)))}
        for(let i=n(70);i--;){const q=edge(),a=rnd(0,6.283),v=rnd(160,420);emit("streak",q[0],q[1],Math.cos(a)*v,Math.sin(a)*v,rnd(.08,.18),pick([0xffd23e,0xff9a2a,0xffffff]),a*57.3)}}
      else if(type==="shadow"){for(let i=n(90);i--;){const q=edge();emit("smoke",q[0],q[1],ex*rnd(60,200)+nx*rnd(-50,50),ey*rnd(60,200)+ny*rnd(-50,50)-rnd(0,30),rnd(.4,.7),pick([0x43287a,0x2a1850,0x6a3fb0]))}
        for(let i=n(50);i--;){const q=edge(),v=rnd(300,520);emit("sq",q[0],q[1],ex*v+nx*rnd(-90,90),ey*v+ny*rnd(-90,90),rnd(.2,.4),pick(P.slice(0,3)))}}
      else if(type==="wind"){gfx.clear();for(const [ph,col,al,lw] of [[0,0xffffff,.9,2.5],[3.14,P[3],.7,2],[1.57,P[2],.45,1.5]]){gfx.lineStyle(lw,col,al*fade);gfx.beginPath();for(let x=6;x<=end;x+=8){const yy=Math.sin(x*.045-age*40+ph)*w*1.15*(.35+.65*Math.min(1,x/120))*grow;if(x===6)gfx.moveTo(x,yy);else gfx.lineTo(x,yy)}gfx.strokePath()}
        for(let i=n(70);i--;){const q=edge(),v=rnd(600,950);emit("streak",q[0],q[1],ex*v,ey*v,rnd(.15,.28),pick(P.slice(0,3)),deg)}for(let i=n(10);i--;){const q=edge();emit("leaf",q[0],q[1],ex*500+nx*rnd(-90,90),ey*500+ny*rnd(-90,90),.4,0x8fd070)}}
      else if(!gfx){for(let i=n(70);i--;){const q=edge(),v=rnd(200,520);emit(type==="ice"?"drop":"sq",q[0],q[1],ex*v+nx*rnd(-80,80),ey*v+ny*rnd(-80,80),rnd(.2,.4),pick(P.slice(0,3)))}
        for(let i=n(30);i--;){const q=edge(),a=rnd(0,6.283),v=rnd(150,380);emit("streak",q[0],q[1],Math.cos(a)*v,Math.sin(a)*v,rnd(.08,.16),0xffffff,a*57.3)}}
      else{nt-=dt;if(nt<=0){nt=.045;gfx.clear();const p=jag(gfx,6,0,end,0,w*1.1,22);boltPts(gfx,p,w*.9,P);const p2=jag(gfx,6,0,end,0,w*1.6,34);strokePts(gfx,p2,Math.max(1.5,w*.18),P[1],.7);
          for(let j=0;j<4&&p.length>2;j++){const o=p[1+((Math.random()*(p.length-2))|0)],a=rnd(.5,1.2)*(Math.random()<.5?-1:1),l=rnd(30,70);strokePts(gfx,jag(gfx,o[0],o[1],o[0]+Math.cos(a)*l,o[1]+Math.sin(a)*l,6,12),2,P[1],.9)}}
        gfx.setAlpha(fade);for(let i=n(60);i--;){const q=edge(),a=rnd(0,6.283),v=rnd(200,520);emit("streak",q[0],q[1],Math.cos(a)*v,Math.sin(a)*v,rnd(.08,.18),pick(P.slice(0,3)),a*57.3)}}
    },kill(){c.destroy()}})},
  regions(gG,gA){const A=G.A,t=G.t,cx=this.camX-40,cy=this.camY-40,cw=VW+80,ch=VH+80,vis=(x0,y0,w,h)=>x0<cx+cw&&x0+w>cx&&y0<cy+ch&&y0+h>cy;
    const shimmer=(x0,y0,w,h,test)=>{const ax=Math.max(x0,cx),ay=Math.max(y0,cy),bx=Math.min(x0+w,cx+cw),by=Math.min(y0+h,cy+ch);if(bx<=ax+8||by<=ay+8)return;const n=Math.ceil((bx-ax)*(by-ay)/2400);
      gG.fillStyle(0xbfe6ff,.45);for(let i=0;i<n;i++){const x=ax+((i*67)%(bx-ax-8)),y=ay+((i*41+t*22)%(by-ay+20))-10;if(test(x+6,y))gG.fillRect(x,y,12,2)}
      gG.fillStyle(0xffffff,.6);for(let i=0;i<n/2;i++){const x=ax+((i*131+t*14)%(bx-ax-6)),y=ay+((i*89)%(by-ay));if(Math.sin(t*4+i)>.4&&test(x,y))gG.fillRect(x,y,4,1)}
      if(G.zapT>0)for(let k=0;k<Math.ceil((by-ay)/90);k++){const xa=rnd(ax+6,bx-6),ya=rnd(ay,by-40);if(test(xa,ya))boltPts(gA,jag(gA,xa,ya,rnd(ax+6,bx-6),ya+rnd(40,90),10,14),3,PALH.elec)}};
    for(const w of A.water){const bb=w.e?[w.x-w.rx,w.y-w.ry,w.rx*2,w.ry*2]:[w.x,w.y,w.w,w.h];if(!vis(...bb))continue;shimmer(...bb,w.e?(x,y)=>inEll(w,x,y,-8):(x,y)=>!A.bridges.some(r=>inRect(r,x,y,4)));
      if(G.zapT>0){gA.fillStyle(0xfff078,.22*G.zapT);if(w.e)gA.fillEllipse(w.x,w.y,w.rx*2,w.ry*2);else gA.fillRect(w.x,w.y,w.w,w.h)}}
    for(const l of A.ice){if(!vis(l.x-l.rx,l.y-l.ry,l.rx*2,l.ry*2))continue;if(Math.random()<.25)emit("sq",l.x+rnd(-l.rx,l.rx)*.7,l.y+rnd(-l.ry,l.ry)*.7,0,-12,.5,0xffffff)}
    for(const l of A.sand){if(!vis(l.x-l.rx,l.y-l.ry,l.rx*2,l.ry*2))continue;for(let k=0;k<3;k++){const q=1-((t*.22+k*.33)%1);gG.lineStyle(2,0x7a5a2a,.12+.3*(1-q)).strokeEllipse(l.x,l.y,l.rx*2*q,l.ry*2*q)}
      if(Math.random()<.2)emit("sqg",l.x+rnd(-l.rx,l.rx)*.6,l.y+rnd(-l.ry,l.ry)*.6,0,-rnd(20,50),.5,0xd8b878)}
    for(const l of A.bog){if(!vis(l.x-l.rx,l.y-l.ry,l.rx*2,l.ry*2))continue;if(Math.random()<.16)emit("sq",l.x+rnd(-l.rx,l.rx)*.7,l.y+rnd(-l.ry,l.ry)*.6,0,-rnd(14,34),.7,pick([0x9a7ad0,0x8fe06a]));
      for(let k=0;k<2;k++){const ph=(t*.7+k*.5+l.x*.01)%1,bx=l.x+Math.sin(l.y+k*3)*l.rx*.5,by=l.y+Math.cos(l.x+k)*l.ry*.4;gG.lineStyle(1.5,0xb8a0e0,.6*(1-ph)).strokeEllipse(bx,by,4+ph*18,2+ph*8)}}
    for(const l of A.lava){if(!vis(l.x-l.rx,l.y-l.ry,l.rx*2,l.ry*2))continue;
      if(l.cool>0){const al=Math.min(1,l.cool*2);gG.fillStyle(0x3a3236,.94*al).fillEllipse(l.x,l.y,l.rx*2-4,l.ry*2-4);gG.fillStyle(0x5a5458,.9*al).fillEllipse(l.x-l.rx*.2,l.y-l.ry*.2,l.rx*.9,l.ry*.7);gG.fillStyle(0x4a4448,al).fillEllipse(l.x+l.rx*.3,l.y+l.ry*.25,l.rx*.6,l.ry*.4);
        gG.lineStyle(1.5,l.cool<1.5?0xff7a3d:0x2a2428,al).beginPath();gG.moveTo(l.x-l.rx*.6,l.y);gG.lineTo(l.x-4,l.y+4);gG.lineTo(l.x+6,l.y-5);gG.lineTo(l.x+l.rx*.6,l.y+2);gG.strokePath();if(Math.random()<.2)emit("smoke",l.x+rnd(-l.rx,l.rx)*.7,l.y,rnd(-8,8),-rnd(20,45),.9,0xe8f4ff)}
      else{const k=.5+.15*Math.sin(t*3+l.x);gA.fillStyle(0xff8a2a,.14+.06*Math.sin(t*5+l.y)).fillEllipse(l.x,l.y,l.rx*2.2,l.ry*2.2);gA.fillStyle(0xffe070,.22).fillEllipse(l.x+Math.sin(t*1.7+l.x)*l.rx*.3,l.y+Math.cos(t*1.3)*l.ry*.2,l.rx*k,l.ry*k);
        if(Math.random()<.18)emit("soft",l.x+rnd(-l.rx,l.rx)*.6,l.y+rnd(-l.ry,l.ry)*.6,rnd(-10,10),-rnd(30,70),.6,pick(PALH.fire.slice(1,4)))}}
    if(A.spring){const p=A.spring;for(let k=0;k<3;k++){const q=(t*.5+k/3)%1;gG.lineStyle(1.5,0xe8fffa,.6*(1-q)).strokeCircle(p.x,p.y,p.r*q)}
      if(Math.random()<.3)emit("sq",p.x+rnd(-p.r,p.r)*.7,p.y+rnd(-p.r,p.r)*.6,0,-rnd(30,60),.6,pick([0xb8fff0,0xffffff,0x7dffe0]))}
    for(const p of A.pads){if(!vis(p.x-30,p.y-20,60,40))continue;gG.fillStyle(0x2a1a40,1).fillEllipse(p.x,p.y,48,26);gG.lineStyle(2,0xc58cff,1).strokeEllipse(p.x,p.y,42,22);gG.lineStyle(2,0xffffff,.8);const a=t*2.4;gG.beginPath();gG.arc(p.x,p.y,13,a,a+2.2);gG.strokePath();gG.beginPath();gG.arc(p.x,p.y,8,-a,-a+2.6);gG.strokePath();
      if(Math.random()<.15)emit("sq",p.x+rnd(-16,16),p.y+rnd(-6,6),0,-rnd(40,80),.5,pick([0xc58cff,0xffffff]))}
    for(const b of A.bridges)if(b.dead){gG.fillStyle(0x101522,.94).fillRect(b.x,b.y,b.w,b.h);gG.lineStyle(3,0x78b8d8,.65).strokeRect(b.x+4,b.y+4,b.w-8,b.h-8)}
    for(const h of A.holes)if((h.lv||0)===(G.me.lv||0)&&vis(h.x-h.r,h.y-h.r,h.r*2,h.r*2)){const pulse=1+Math.sin(t*4+h.x)*.05;gG.fillStyle(0x090611,.98).fillCircle(h.x,h.y,h.r*pulse);gG.lineStyle(4,0x5b427a,.8).strokeCircle(h.x,h.y,h.r);gA.lineStyle(2,0xb88cff,.42).strokeCircle(h.x,h.y,h.r*(.72+.08*Math.sin(t*7)));if(Math.random()<.35){const a=rnd(0,6.283);emit("smoke",h.x+Math.cos(a)*h.r,h.y+Math.sin(a)*h.r,-Math.cos(a)*80,-Math.sin(a)*80,.6,0x43287a)}}
    for(const w of A.walls)for(const q of w.breach||[]){gA.fillStyle(0x08070c,.72).fillCircle(q.x,q.y,q.r);gA.lineStyle(2,0xd8c8b0,.55).strokeCircle(q.x,q.y,q.r)}
    if(A.extra)A.extra(gG,gA,t,vis)},
  sync(dt){const s=SCN,A=G.A,gG=this.gG,gO=this.gO,gA=this.gA,me=G.me,st=this.st;this.t+=dt;
    if(BGD){this.bgTex.refresh();BGD=false}
    const tcx=clamp(me.x+me.ax*26-VW/2,0,W-VW),tcy=clamp(me.y+me.ay*18-VH/2,0,H-VH),ck=Math.min(1,dt*6);this.camX+=(tcx-this.camX)*ck;this.camY+=(tcy-this.camY)*ck;
    const sh=G.shake,cx=this.camX,cy=this.camY;s.cameras.main.setScroll(this.bx+Math.round(cx)+(sh?rnd(-sh,sh)*.5:0),this.by+Math.round(cy)+(sh?rnd(-sh,sh)*.5:0));
    gG.clear();gO.clear();gA.clear();this.regions(gG,gA);
    for(const z of G.zones){const type=mvT(z.mv,z.own);if(z.pull||type==="fire"||z.mv.smoke)continue;const al=Math.min(1,z.t*2),P=PALH[type];gG.fillStyle(P[3],.18*al).fillCircle(z.x,z.y,z.mv.rad);gG.lineStyle(2,P[2],.7*al).strokeCircle(z.x,z.y,z.mv.rad);gG.lineStyle(1.5,0xffffff,.5*al).strokeCircle(z.x,z.y,z.mv.rad*((G.t*.7)%1));
      if(Math.random()<dt*22){const an=rnd(0,6.283),r=rnd(0,z.mv.rad);emit(type==="shadow"?"smoke":"leaf",z.x+Math.cos(an)*r,z.y+Math.sin(an)*r,rnd(-10,10),-rnd(30,70),.7,pick(type==="shadow"?[0x43287a,0x6a3fb0,0x2a1850]:P.slice(1,4)))}}
    for(const b of G.blasts){if(b.t>b.full)continue;const k=1-b.t/b.full,col=PALH[mvT(b.mv,b.own)][3];gG.lineStyle(2,col,1);dashCircle(gG,b.x,b.y,b.mv.rad,this.t*2);gG.fillStyle(col,.28).fillCircle(b.x,b.y,b.mv.rad*k);gG.lineStyle(1.5,0xffffff,.5).strokeCircle(b.x,b.y,b.mv.rad*k)}
    IV.drops(gG,gO,st);IV.zones(gG);IV.totems(st);this.aimGuide(gG);
    syncList(G.blasts.filter(b=>b.fall&&b.t<=b.full),st.met,()=>s.add.sprite(0,0,"shot_fire").setScale(2.6).setRotation(1.87).setBlendMode("ADD").setDepth(D.AIR).play("shot_fire"),(b,o)=>{const h=b.t*520;o.setPosition(b.x-h*.3,b.y-h-8);emit("soft",o.x,o.y,rnd(-20,20),-rnd(20,60),.3,pick(PALH.fire.slice(1,5)))});
    syncList(G.blasts.filter(b=>(b.mv.lob||b.lob)&&b.t<=b.full),st.lob,b=>{const k=b.lob||b.mv.lobk||"shot_earth",o=s.add.sprite(0,0,k).setScale(b.ls||2.4).setDepth(D.AIR);if(s.anims.exists(k))o.play(k);if(k==="shot_fire")o.setBlendMode("ADD");return o},
      (b,o)=>{const k=clamp(1-b.t/b.full,0,1),lh=b.lh||90,dx=(b.x-b.ox),dy=(b.y-b.oy)-Math.cos(k*Math.PI)*Math.PI*lh;o.setPosition(b.ox+(b.x-b.ox)*k,b.oy+(b.y-b.oy)*k-Math.sin(k*Math.PI)*lh).setRotation(b.lob==="shot_fire"?Math.atan2(dy,dx):G.t*(b.lob==="chili"?9:8));
        if(b.lob==="chili"||b.lob==="shot_fire")emit("soft",o.x+rnd(-4,4),o.y+rnd(-4,4),rnd(-20,20),-rnd(10,40),.35,pick(PALH.fire.slice(1,5)));else if(Math.random()<.5)emit("smoke",o.x,o.y,0,0,.3,0x8a6a4a)});
    for(const p of A.props){const v=p.v;if(!v)continue;if(p.k==="tree"){v.a.setVisible(!p.dead);v.c.setVisible(!p.dead);v.s.setVisible(p.dead);if(!p.dead)v.c.setAlpha(Math.hypot(p.x-me.x,p.y-14-me.y)<p.R+6?.5:.97)}
      else{const pv=!p.dead&&(!A.visFn||A.visFn(p,me));v.a.setVisible(pv);if(v.sh)v.sh.setVisible(pv);if(PDEF[p.k].hide&&!p.dead)v.a.setAlpha((p.lv||0)===(me.lv||0)&&Math.hypot(p.x-me.x,p.y-me.y)<p.R?.5:1);if(p.k==="bush"&&!p.dead)v.a.setAlpha(Math.hypot(p.x-me.x,p.y-me.y)<p.R-4?.5:1)}}
    if(A.key!=="city")for(const w of A.walls)if(w.img)w.img.setVisible(!w.dead).setAlpha(w.breach&&w.breach.length?.42:1);
    syncList(G.twalls,st.tw,w=>{const o=s.add.image(w.x,w.y+8,"p_twall").setOrigin(.5,1).setScale(2,0).setDepth(D.ENT+w.y);if(w.tall)o.setTint(0xd8d0b8);if(w.ice){o.setTexture("p_icewall").setAlpha(.92)}return o},(w,o)=>{const k=clamp((G.t-w.born)/.15,0,1);o.setScale(w.tall?2.3:2,(w.tall?3:2)*k).setAlpha(Math.min(1,w.t*2));if(w.tall&&k>0&&!o.fx){o.fx=1;FX.boom(w.x,w.y,"earth",16)}});
    syncList(G.traps,st.traps,t=>s.add.image(t.x,t.y,t.mv.mine?"i_mine":"p_trap").setScale(2).setDepth(D.GFX+5),(t,o)=>{const mine=t.own===me;o.setAlpha(t.arm>0?.5+.4*Math.sin(G.t*30):mine?.95:.42).setScale(2+(t.arm>0?0:.12*Math.sin(G.t*5)))});
    this.fighter(G.me,dt,gG,gO,gA);this.fighter(G.op,dt,gG,gO,gA);
    {const kn=knight(me)+"|"+(me.tank>0)+"|"+(me.jet>0);if(kn!==this.kn){this.kn=kn;relabel()}}shopView(gA);
    MV.units(gG,gO,gA,st);MV.hud(gO);MINI.upd(dt);
    syncList(G.ults,st.ults,U=>{const q=UV[U.k];return q&&q.make?q.make(U):[]},(U,o)=>{const q=UV[U.k];if(q&&q.upd)q.upd(U,o,dt,gG,gO,gA)});
    for(const q of G.slashes){const P=PALH[mvT(q.mv,q.own)],k=1-q.t/q.full,a0=q.ang-q.mv.arc/2,a1=a0+q.mv.arc*Math.min(1,k*1.8),r=q.mv.rng*.86;gA.lineStyle(12*(1-k)+3,P[3],.9*(1-k*.6));gA.beginPath();gA.arc(q.x,q.y,r,a0,a1);gA.strokePath();gA.lineStyle(4*(1-k)+1,0xffffff,1-k*.5);gA.beginPath();gA.arc(q.x,q.y,r+3,a0,a1);gA.strokePath();
      gA.lineStyle(3,P[2],.6*(1-k));gA.beginPath();gA.arc(q.x,q.y,r*.7,a0,a1);gA.strokePath();if(!q.seen){q.seen=1;for(let i=0;i<8;i++){const a=a0+Math.random()*q.mv.arc;spray(mvT(q.mv,q.own),q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,1,120)}}}
    for(const c of G.cones){const o=c.own,mv=c.mv,ang=Math.atan2(o.ay,o.ax),P=PALH[mvT(mv,o)];gA.fillStyle(P[3],.12);gA.slice(o.x,o.y-12,mv.rng,ang-mv.arc/2,ang+mv.arc/2,false);gA.fillPath();
      for(let i=0;i<9;i++){const a=ang+rnd(-.5,.5)*mv.arc,v=rnd(240,420);emit(i%4===0?"sq":"soft",o.x+Math.cos(ang)*16,o.y-12+Math.sin(ang)*16,Math.cos(a)*v,Math.sin(a)*v-rnd(0,30),mv.rng/v*rnd(.8,1.1),pick(P.slice(1,5)))}if(Math.random()<.5){const a=ang+rnd(-.5,.5)*mv.arc;emit("smoke",o.x+Math.cos(a)*mv.rng*.8,o.y-12+Math.sin(a)*mv.rng*.8,0,-40,.6,0x3a3038)}}
    syncList(G.orbits,st.orb,()=>[0,1,2].map(()=>s.add.sprite(0,0,"shot_fire").setScale(1.7).setBlendMode("ADD").play("shot_fire")),(q,a)=>{const o=q.own;a.forEach((sp,k)=>{const an=q.a+k*2.094,x=o.x+Math.cos(an)*q.mv.rad,y=o.y-12+Math.sin(an)*q.mv.rad;sp.setPosition(x,y).setRotation(an+1.5708).setDepth(D.ENT+y+12).setAlpha(Math.min(1,q.t*2));if(Math.random()<.5)emit("soft",x,y,rnd(-20,20),-rnd(10,40),.25,pick(PALH.fire.slice(1,5)))})});
    syncList(G.shots,st.shots,o=>{if(o.mv.crescent)return s.add.image(0,0,"crescent").setBlendMode("ADD").setDepth(D.AIR).setVisible(false);if(o.prop)return s.add.image(0,0,"p_"+o.prop).setScale(2).setDepth(D.AIR).setVisible(false);if(o.fb)return s.add.sprite(0,0,o.fb).play(o.fb).setBlendMode("ADD").setDepth(D.AIR).setVisible(false);const type=mvT(o.mv,o.own);const v=o.mv.pierce&&type==="wind"&&!o.mv.boom?s.add.image(0,0,"swirl").setBlendMode("ADD"):s.add.sprite(0,0,"shot_"+type).play("shot_"+type);if(ADDT[type]&&type!=="grass")v.setBlendMode("ADD");
        if(o.mv.hook)v.setTint(0x7ad06a);if(o.mv.drain)v.setTint(0xd8ffb0);return v.setDepth(D.AIR).setVisible(false)},
      (o,v)=>{if(o.w>0)return;if(o.mv.crescent){v.setVisible(true).setPosition(o.x,o.y).setScale(2.2).setRotation(Math.atan2(o.vy,o.vx));for(let i=0;i<3;i++)emit(i?"soft":"streak",o.x+rnd(-14,14),o.y+rnd(-14,14),-o.vx*.2,-o.vy*.2,.3,pick(PALH.light.slice(0,4)),Math.atan2(o.vy,o.vx)*57.3);return}if(o.prop){v.setVisible(true).setPosition(o.x,o.y).setRotation(o.rot*.8*(o.vx<0?-1:1));gG.fillStyle(0,.25).fillEllipse(o.x,o.y+14,22,7);if(Math.random()<.5)emit("smoke",o.x,o.y+10,0,-10,.4,0xb8a890);return}if(o.fb){v.setVisible(true).setPosition(o.x,o.y).setScale(1.3*o.sc).setRotation(Math.atan2(o.vy,o.vx));const P2=o.blue?PALH.blue:PALH.fire;for(let i=0;i<3;i++)emit(i?"soft":"sq",o.x-o.vx*.02+rnd(-6,6)*o.sc,o.y-o.vy*.02+rnd(-6,6)*o.sc,-o.vx*.15+rnd(-50,50),-o.vy*.15+rnd(-50,50),rnd(.2,.4),pick(P2.slice(0,4)));return}const mv=o.mv,type=mvT(mv,o.own),P=PALH[type],sw=mv.pierce&&type==="wind"&&!mv.boom;
        v.setVisible(true).setPosition(o.x,o.y).setScale(sw?mv.r/22:mv.home?1.9+.2*Math.sin(G.t*20):Math.max(1,mv.r/5.2)).setRotation(sw?G.t*14:mv.boom?G.t*26:type==="grass"&&!mv.hook||type==="earth"||type==="metal"?o.rot*(type==="earth"?.5:1.4):Math.atan2(o.vy,o.vx));
        if(mv.hook){const f=o.own,p=jag(gO,f.x,f.y-12,o.x,o.y,3,14);strokePts(gO,p,4,0x226e30,1);strokePts(gO,p,2,0x6fd06a,1)}
        if(mv.home&&Math.random()<.6){const a=rnd(0,6.283);emit("streak",o.x,o.y,Math.cos(a)*220,Math.sin(a)*220,.14,pick(P.slice(0,3)),a*57.3)}
        if(Math.random()<dt*46){const n=type==="water"?"drop":type==="grass"?"leaf":type==="earth"||type==="metal"?"rock":type==="shadow"?"smoke":type==="fire"?"soft":"sq";emit(n,o.x-o.vx*.02,o.y-o.vy*.02,-o.vx*.12+rnd(-30,30),-o.vy*.12+rnd(-30,30),rnd(.18,.34),pick(P.slice(1,5)))}});
    syncList(G.zones.filter(z=>z.pull||mvT(z.mv,z.own)==="fire"),st.zones,z=>{const R=seeded(z.id+"v");if(z.pull){const a=[s.add.image(z.x,z.y,"swirl").setBlendMode("ADD").setDepth(D.AIR-6),s.add.image(z.x,z.y,"swirl").setBlendMode("ADD").setDepth(D.AIR-5)];if(mvT(z.mv,z.own)==="water")a.forEach(o=>o.setTint(0x7cc4ff));return a}
        const a=[];for(let i=0,n=Math.round(z.mv.rad/3.4);i<n;i++){const an=R()*6.283,r=Math.sqrt(R())*z.mv.rad*.92,fx=z.x+Math.cos(an)*r,fy=z.y+Math.sin(an)*r*.9;const o=s.add.sprite(fx,fy,"flame").setOrigin(.5,.95).setScale(1.1+R()*1.3).setDepth(D.ENT+fy+3).setBlendMode(i%3?"NORMAL":"ADD");o.play({key:"flame",startFrame:(R()*6)|0,frameRate:9+R()*6});a.push(o)}return a},
      (z,a)=>{if(z.pull){const k=Math.min(1,z.t*2,(z.mv.dur-z.t)*4);const wt=mvT(z.mv,z.own)==="water";a[0].setPosition(z.x,z.y).setRotation(G.t*9).setScale(z.mv.rad/26*k).setAlpha(.8);a[1].setPosition(z.x,z.y).setRotation(-G.t*13+1).setScale(z.mv.rad/44*k).setAlpha(.9);if(wt)for(let i=0;i<5;i++){const an=rnd(0,6.283),r=z.mv.rad*rnd(.3,1.1);emit("drop",z.x+Math.cos(an)*r,z.y+Math.sin(an)*r,-Math.sin(an)*240,Math.cos(an)*240-90,.4,pick(PALH.water.slice(0,3)))}
          for(let i=0;i<3;i++){const an=rnd(0,6.283),r=z.mv.rad*rnd(.5,1.2);emit("streak",z.x+Math.cos(an)*r,z.y+Math.sin(an)*r,-Math.sin(an)*260-Math.cos(an)*120,Math.cos(an)*260-Math.sin(an)*120,.3,pick(PALH.wind.slice(0,3)),an*57.3+90)}return}
        const al=Math.min(1,z.t*2.5);for(const o of a)o.setAlpha(al);gG.fillStyle(0xff6a1a,.2*al).fillCircle(z.x,z.y,z.mv.rad);gG.lineStyle(2,0xffb020,.55*al).strokeCircle(z.x,z.y,z.mv.rad);
        if(Math.random()<dt*30){const an=rnd(0,6.283),r=rnd(0,z.mv.rad);emit(Math.random()<.3?"smoke":"sq",z.x+Math.cos(an)*r,z.y+Math.sin(an)*r-10,rnd(-12,12),-rnd(50,110),rnd(.4,.8),Math.random()<.3?0x3a3038:pick(PALH.fire.slice(1,4)))}});
    for(const r of G.rings){if(r.w>0)continue;const type=mvT(r.mv,r.own),P=PALH[type],al=clamp(1.25-r.r/r.max,0,1),lw=r.big?10:6;gA.lineStyle(lw*2.2,P[4],.35*al).strokeCircle(r.x,r.y,r.r);gA.lineStyle(lw,P[3],al).strokeCircle(r.x,r.y,r.r);gA.lineStyle(lw*.4,P[1],al).strokeCircle(r.x,r.y,r.r+1);gA.lineStyle(1.5,0xffffff,al).strokeCircle(r.x,r.y,r.r+lw*.5);
      gA.lineStyle(2,P[2],.5*al).strokeCircle(r.x,r.y,r.r*.82);for(let i=0;i<(r.big?10:5);i++){const a=rnd(0,6.283);spray(type,r.x+Math.cos(a)*r.r,r.y+Math.sin(a)*r.r,1,90)}}
    for(const b of G.beams)if(b.w<=0&&!b.seen){b.seen=1;this.beam(b)}
    syncList(G.waves,st.waves,w=>{const c=s.add.container(0,0).setDepth(D.AIR-5).setRotation(Math.atan2(w.dy,w.dx));const a=s.add.tileSprite(0,0,32,1500,"wave").setOrigin(1,.5).setScale(2,1),b=s.add.tileSprite(-40,0,32,1500,"wave").setOrigin(1,.5).setScale(1.4,1).setAlpha(.6);c.add([b,a]);c.a=a;c.b=b;return c},
      (w,c)=>{c.setPosition(w.x+w.dx*w.d,w.y+w.dy*w.d);c.a.tilePositionY+=dt*140;c.b.tilePositionY-=dt*90;for(let k=0;k<8;k++){const o=rnd(-600,600);emit("drop",c.x-w.dy*o,c.y+w.dx*o,w.dx*rnd(60,200)+rnd(-40,40),w.dy*rnd(60,200)-rnd(60,200),rnd(.3,.6),pick(PALH.water.slice(0,3)))}});
    for(let i=this.fx.length-1;i>=0;i--){const f=this.fx[i];f.life=f.life||f.t;f.t-=dt;if(f.t<=0){f.kill();this.fx.splice(i,1)}else f.upd(dt,f.t/f.life)}
    /* arrow at the screen edge when the opponent is out of view */
    const op=G.op;if(op.hp>0&&seenBy(op,me)&&(op.x<cx-10||op.x>cx+VW+10||op.y<cy-10||op.y>cy+VH+30)){const ax=clamp(op.x,cx+22,cx+VW-22),ay=clamp(op.y-12,cy+22,cy+VH-22),a=Math.atan2(op.y-12-ay,op.x-ax);
      gO.fillStyle(0,.6).fillCircle(ax,ay,13);gO.fillStyle(0xef5a5a,1).fillTriangle(ax+Math.cos(a)*12,ay+Math.sin(a)*12,ax+Math.cos(a+2.4)*9,ay+Math.sin(a+2.4)*9,ax+Math.cos(a-2.4)*9,ay+Math.sin(a-2.4)*9)}
    this.dark.setAlpha(G.dark>0?Math.min(.42,G.dark*.5):0);
    if(G.cd>0&&!G.over&&!G.cut){const n=Math.ceil(G.cd-.2);this.cdT.setVisible(true).setPosition(cx+VW/2,cy+VH/2).setText(n>0?String(n):"สู้!").setScale(1+.25*((G.cd-.2+10)%1))}else this.cdT.setVisible(false);
    this.cut(cx,cy);
    const L=G.left?G.me:G.op,R=G.left?G.op:G.me,hc=p=>p>.5?"var(--ok)":p>.25?"var(--gold)":"var(--bad)";
    $("hpL").style.width=(L.hp/L.max*100)+"%";$("hpR").style.width=(R.hp/R.max*100)+"%";$("hpL").style.background=hc(L.hp/L.max);$("hpR").style.background=hc(R.hp/R.max);$("ulL").style.width=L.ult+"%";$("ulR").style.width=R.ult+"%";
    for(const b of ABS){const k=b.key,v=k==="b"?me.cdB/MOVES[me.mon.basic].cd:k==="d"?me.dodgeCd/2.2:k==="u"?1-me.ult/100:k==="i"?(me.item?me.cdI/.35:0):me.cds[k]/slotMove(me,k).cd;b.cd.style.height=(clamp(v,0,1)*100)+"%";if(k==="u")b.b.classList.toggle("on",me.ult>=100)}},
  /* ultimate call-out: dim, slanted band in the move's colour, big portrait, move name */
  cut(cx,cy){const s=SCN;if(!G.cut){if(this.cutO){this.cutO.destroy();this.cutO=null;softFlash(.45,260)}return}
    const C=G.cut,f=C.f,P=PALH[C.mv.t],left=f===(G.left?G.me:G.op),w=VW,h=VH;
    if(!this.cutO){const c=this.cutO=s.add.container(0,0).setDepth(D.UI+10);c.add(s.add.rectangle(w/2,h/2,w+80,h+80,0x06050e,.74));
      const band=c.band=s.add.container(w/2,h/2).setRotation(-.12);band.add(s.add.rectangle(0,0,w*2,150,P[3]));band.add(s.add.rectangle(0,0,w*2,134,0x14121f));
      c.lines=[];for(let i=0;i<18;i++){const r=s.add.rectangle(rnd(-w,w),-60+((i*29)%120),50+(i%4)*34,i%3?2:3,i%2?P[2]:P[1]).setBlendMode("ADD");band.add(r);c.lines.push(r)}c.add(band);
      c.aura=s.add.image(0,h/2+60,"swirl").setTint(P[2]).setBlendMode("ADD").setAlpha(.5);c.add(c.aura);
      c.por=s.add.image(0,h/2+104,"m_"+f.key+"_0").setOrigin(.5,29/32).setScale(6.4).setFlipX(!left);c.add(c.por);
      c.sub=s.add.text(0,h/2-34,f.mon.n+" · ท่าไม้ตาย",{fontFamily:'"Chakra Petch",sans-serif',fontSize:"15px",fontStyle:"bold",color:"#fff"}).setOrigin(left?1:0,.5).setResolution(2);
      c.nm=s.add.text(0,h/2+10,C.mv.n,{fontFamily:'"Chakra Petch",sans-serif',fontSize:(C.mv.n.length>14?34:40)+"px",fontStyle:"bold",color:PAL[C.mv.t][2],stroke:"#000",strokeThickness:7}).setOrigin(left?1:0,.5).setResolution(2);c.add([c.sub,c.nm])}
    const c=this.cutO,k=1-C.t/1.05,e=Math.min(1,k*5),e3=1-Math.pow(1-e,3);c.setPosition(Math.round(cx),Math.round(cy));c.band.setScale(1,e3);for(const r of c.lines){r.x+=(left?1:-1)*24;if(r.x>w)r.x-=w*2;if(r.x<-w)r.x+=w*2}
    const px=left?150-(1-e3)*320:w-150+(1-e3)*320;c.por.setX(px+Math.sin(k*40)*1.5);c.aura.setPosition(px,h/2+10).setRotation(k*5).setScale(3.4+Math.sin(k*20)*.2);
    const tx=left?w-26:26;c.sub.setX(tx).setAlpha(e);c.nm.setX(tx+(1-e3)*(left?90:-90)).setAlpha(e).setScale(1+.06*Math.sin(k*30))}
};
class Battle extends Phaser.Scene{
  constructor(){super("battle")}
  create(){SCN=this;makeTextures(this);makeUltTex(this);makeItemTex(this);makeShopTex(this);makeUnitTex(this);const cam=this.cameras.main;cam.setZoom(2);cam.centerOn(VW/2,VH/2);VIEW.bx=cam.scrollX;VIEW.by=cam.scrollY;
    VIEW.bgTex=this.textures.addCanvas("bg",bg);VIEW.bgImg=this.add.image(0,0,"bg").setOrigin(0).setScale(2).setDepth(0);
    VIEW.gG=this.add.graphics().setDepth(D.GFX);VIEW.gO=this.add.graphics().setDepth(D.AIR+60);VIEW.gA=this.add.graphics().setDepth(D.AIR+40).setBlendMode("ADD");
    VIEW.dark=this.add.rectangle(W/2,H/2,W+80,H+80,0x0a0818,1).setDepth(D.AIR-10).setAlpha(0);
    for(const o of this.children.list)VIEW.keep.add(o);VIEW.ready=true;if(G)VIEW.reset()}
  update(t,d){if(!G||$("game").hidden||!G.me.v)return;const dt=Math.min(.05,d/1000);try{update(dt);if(G)VIEW.sync(dt)}catch(e){console.error(e)}}
}
if(typeof Phaser!=="undefined"){try{PG=new Phaser.Game({type:Phaser.AUTO,parent:"stage",width:VW*2,height:VH*2,backgroundColor:"#000000",pixelArt:true,banner:false,audio:{noAudio:true},
    input:{keyboard:false,mouse:false,touch:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.NO_CENTER},scene:[Battle]})}catch(e){console.error(e)}}
initUI();
if(!PG)$("netHint").textContent="โหลดเอนจินเกมไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง";
