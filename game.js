"use strict";
/* ================= data ================= */
const TY={
  fire:{n:"ไฟ",c:"#ff7a3d",beats:["grass","wind","metal"]},
  water:{n:"น้ำ",c:"#3d9bff",beats:["fire","earth"]},
  grass:{n:"พืช",c:"#4cc26a",beats:["water","earth"]},
  elec:{n:"สายฟ้า",c:"#f7d23e",beats:["water","wind","metal"]},
  earth:{n:"ดิน",c:"#c08a4a",beats:["fire","elec"]},
  wind:{n:"ลม",c:"#8fe3d0",beats:["grass","earth"]},
  metal:{n:"โลหะ",c:"#b8c4d0",beats:["grass","shadow"]},
  shadow:{n:"เงา",c:"#9a6adf",beats:["elec","water"]},
  norm:{n:"ปกติ",c:"#c9c5d6",beats:[]}
};
const eff1=(a,d)=>a==="norm"?1:TY[a].beats.includes(d)?1.5:(a===d||TY[d].beats.includes(a))?.6:1;
const eff=(a,ds)=>ds.reduce((m,d)=>m*eff1(a,d),1);

/* aim: how a move is pointed. line = along a direction, cone = wedge, point = a spot on the ground within rng, self = around the user */
const MOVES={
  /* basic attacks, one per monster, no cooldown to manage */
  b_pyros:{n:"ขนเพลิง",t:"fire",kind:"shot",aim:"line",pw:4,cd:.34,sp:380,r:4,cnt:2,gap:.07,life:.85,basic:1,d:"ยิงขนไฟ 2 ลูกรัว"},
  b_crusta:{n:"ก้ามหนีบ",t:"water",kind:"melee",aim:"cone",pw:10,cd:.5,rng:56,arc:2.2,basic:1,d:"ฟาดก้ามระยะประชิด"},
  b_mekha:{n:"ประกายเขา",t:"elec",kind:"shot",aim:"line",pw:5,cd:.3,sp:470,r:4,cnt:1,life:.75,basic:1,d:"ยิงประกายไฟเร็ว"},
  b_prikky:{n:"พ่นเมล็ด",t:"grass",kind:"shot",aim:"cone",pw:3,cd:.42,sp:360,r:4,cnt:3,fan:.32,life:.8,basic:1,d:"พ่นเมล็ด 3 ลูกเป็นพัด"},
  b_sila:{n:"หมัดศิลา",t:"earth",kind:"melee",aim:"cone",pw:12,cd:.6,rng:58,arc:2,kb:120,heavy:1,basic:1,d:"ต่อยหนักระยะประชิด ผลักถอย"},
  b_eela:{n:"พ่นน้ำ",t:"water",kind:"shot",aim:"line",pw:5,cd:.34,sp:350,r:5,cnt:1,life:.9,basic:1,d:"พ่นลูกน้ำ"},
  b_fuwa:{n:"เป่าลม",t:"wind",kind:"shot",aim:"line",pw:4,cd:.36,sp:320,r:6,cnt:1,kb:70,life:.9,basic:1,d:"เป่าลูกลม ผลักเบา ๆ"},
  b_lavarok:{n:"เขาลาวา",t:"fire",kind:"melee",aim:"cone",pw:11,cd:.56,rng:54,arc:1.8,burn:1,heavy:1,basic:1,d:"ขวิดด้วยเขาร้อน ติดไฟ"},
  b_blazar:{n:"ลูกไฟรัว",t:"fire",kind:"shot",aim:"line",pw:3,cd:.44,sp:400,r:5,cnt:3,gap:.06,life:.85,basic:1,d:"พ่นลูกไฟ 3 ลูกรัวเป็นชุด"},
  b_reya:{n:"ลูกน้ำวน",t:"water",kind:"shot",aim:"line",pw:5,cd:.34,sp:340,r:6,cnt:1,life:.9,basic:1,d:"ยิงลูกน้ำหมุน"},
  b_terran:{n:"ทุบพสุธา",t:"earth",kind:"melee",aim:"cone",pw:13,cd:.66,rng:66,arc:2.3,kb:150,heavy:1,basic:1,d:"ทุบพื้นเป็นคลื่นกระแทกวงกว้าง ผลักถอย"},
  b_umbra:{n:"กรงเล็บเงา",t:"shadow",kind:"melee",aim:"cone",pw:7,cd:.32,rng:50,arc:1.7,basic:1,d:"ข่วนเร็วมากระยะประชิด"},
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
  quake:{n:"แผ่นดินไหว",t:"earth",kind:"slam",aim:"self",pw:21,cd:5,rad:86,delay:.5,crater:1,stun:.5,heavy:1,d:"กระแทกพื้นรอบตัว ทิ้งหลุมไว้"},
  dig:{n:"ขุดดิน",t:"earth",kind:"dig",aim:"self",pw:19,cd:6.5,d:"มุดดินหลบทุกท่า แล้วโผล่ขึ้นโจมตี"},
  wall:{n:"กำแพงหิน",t:"earth",kind:"wall",aim:"point",pw:0,cd:7,rng:110,dur:5,d:"ตั้งกำแพงหิน 3 ก้อนขวางที่จุดเล็ง บังกระสุนได้ 5 วินาที"},
  mortar:{n:"ระเบิดหินโค้ง",t:"earth",kind:"strike",aim:"point",pw:20,cd:4.5,rad:52,delay:.65,lob:1,crater:1,kb:180,heavy:1,rng:250,d:"โยนหินข้ามสิ่งกีดขวางไปตกที่จุดเล็ง"},
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
  /* common */
  tackle:{n:"พุ่งชน",t:"norm",kind:"dash",aim:"line",pw:12,cd:2.2,sp:440,dur:.3,stun:.45,heavy:1,d:"ชนแล้วคู่ต่อสู้มึน พังลังไม้ได้"},
  leap:{n:"กระโดดทุ่ม",t:"norm",kind:"leap",aim:"point",pw:20,cd:4.5,rad:64,rng:180,d:"กระโดดข้ามสิ่งกีดขวางไปจุดเล็ง แล้วกระแทกพื้น"},
  ring:{n:"วงแหวนพลัง",t:"self",kind:"ring",aim:"self",pw:14,cd:4,max:140,d:"วงแหวนธาตุหลักแผ่ออกรอบตัว กลิ้งหลบผ่านได้"},
  beam:{n:"ลำแสงทำลาย",t:"self",kind:"beam",aim:"line",pw:30,cd:4.5,heavy:1,d:"กดค้างเพื่อชาร์จและเล็ง ปล่อยเพื่อยิงลำแสงธาตุหลัก"},
  clone:{n:"แยกร่าง",t:"norm",kind:"clone",aim:"self",pw:5,cd:12,d:"เรียกร่างแยก 2 ตัว พลังชีวิตน้อย วิ่งเข้าไปช่วยโจมตี"},
  guard:{n:"ตั้งการ์ด",t:"norm",kind:"buff",aim:"self",pw:0,cd:7,buff:"guard",d:"ลดความเสียหาย 60% นาน 1.6 วินาที"},
  rest:{n:"พักฟื้น",t:"norm",kind:"buff",aim:"self",pw:0,cd:13,buff:"rest",d:"หยุดนิ่ง 1 วินาที แล้วฟื้นพลัง 26"},
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
  /* ult parts (hidden) */
  birdpass:{t:"fire",kind:"env",pw:11,burn:2,kb:220,heavy:9,hidden:1},
  birdland:{t:"fire",kind:"strike",pw:18,rad:100,burn:3,kb:280,heavy:9,crater:1,hidden:1},
  shard:{t:"water",kind:"shot",pw:3,sp:300,r:6,life:.7,hidden:1},
  shellend:{t:"water",kind:"strike",pw:10,rad:74,kb:300,slow:1.5,heavy:9,hidden:1},
  cbolt:{t:"elec",kind:"strike",pw:8,rad:36,stun:.25,hidden:1},
  cmega:{t:"elec",kind:"strike",pw:18,rad:96,stun:.6,heavy:9,crater:1,hidden:1},
  chili1:{t:"fire",kind:"strike",pw:16,rad:78,burn:3,kb:240,heavy:9,crater:1,hidden:1},
  chili2:{t:"fire",kind:"strike",pw:9,rad:48,burn:2,heavy:1,hidden:1},
  chili3:{t:"fire",kind:"strike",pw:7,rad:42,burn:2,heavy:1,hidden:1},
  colring:{t:"earth",kind:"ring",pw:10,max:150,stun:.5,kb:200,heavy:9,hidden:1},
  stomp:{t:"earth",kind:"strike",pw:6,rad:54,heavy:9,hidden:1},
  b_giant:{n:"หมัดยักษ์ศิลา",t:"earth",kind:"melee",aim:"cone",pw:17,cd:.62,rng:98,arc:2.3,kb:260,heavy:9,hidden:1},
  dbite:{t:"elec",kind:"env",pw:7,stun:.15,hidden:1},
  dragend:{t:"elec",kind:"strike",pw:12,rad:72,stun:.4,heavy:1,hidden:1},
  bubcatch:{t:"water",kind:"env",pw:4,hard:1.7,hidden:1},
  bubpop:{t:"water",kind:"env",pw:5,hidden:1},
  bubburst:{t:"wind",kind:"strike",pw:14,rad:60,kb:360,hidden:1},
  lavapool:{t:"fire",kind:"zone",pw:4,burn:2,rad:150,heavy:1,hidden:1},
  lavabomb:{t:"fire",kind:"strike",pw:8,rad:44,burn:2,heavy:1,crater:1,hidden:1},
  bfb1:{t:"fire",kind:"shot",pw:3,sp:500,r:9,life:.95,burn:1,heavy:1,hidden:1},
  bfb2:{t:"fire",kind:"shot",pw:3.5,sp:540,r:11,life:.95,burn:2,heavy:1,hidden:1},
  bfb3:{t:"fire",kind:"shot",pw:5,sp:580,r:14,life:1,burn:2,kb:120,heavy:9,hidden:1},
  spout:{t:"water",kind:"env",pw:4,hidden:1},
  spoutend:{t:"water",kind:"strike",pw:9,rad:62,kb:260,hidden:1},
  thorn:{t:"grass",kind:"strike",pw:7,rad:40,slow:1,hidden:1},
  boulder:{t:"earth",kind:"strike",pw:20,rad:94,stun:.6,kb:200,heavy:9,crater:1,hidden:1},
  phclone:{t:"elec",kind:"env",pw:13,stun:.15,hidden:1}
};
const KIND={shot:"ยิง",dash:"พุ่งชน",slam:"รอบตัว",strike:"ลงพื้น",zone:"พื้นที่",dig:"มุดดิน",buff:"เสริม",leap:"กระโดด",ring:"วงแหวน",beam:"ชาร์จ",clone:"เรียกร่าง",melee:"ประชิด",breath:"พ่น",orbit:"โคจร",rain:"ถล่ม",trap:"กับดัก",blink:"วาร์ป",wall:"กำแพง"};
const COMMON=["tackle","leap","ring","beam","clone","guard","rest"];
const ENVMV={barrel:{t:"fire",pw:22,rad:74,kb:260,burn:2,kind:"slam"},burn:{t:"fire",pw:5,rad:36,kind:"zone"},zap:{t:"elec",pw:13,stun:.5,kind:"env"},lava:{t:"fire",pw:6,burn:2,kind:"env"},
  bog:{t:"grass",pw:4,slow:.8,kind:"env"},cactus:{t:"grass",pw:6,kb:160,kind:"env"}};
const MONS={
  pyros:{n:"ไพรอส",t:["fire","wind"],hp:150,atk:1.12,def:.92,spd:140,basic:"b_pyros",ult:"u_bird",role:"จู่โจมเร็ว",ds:"วิหคเพลิงหางมรกต เร็วและแรง แต่เปราะ"},
  crusta:{n:"ครัสต้า",t:["water","earth"],hp:195,atk:1,def:1.25,spd:100,basic:"b_crusta",ult:"u_shell",role:"รถถัง",ds:"ปูเสฉวนเปลือกหินผลึก ถึกที่สุด ตีระยะประชิด"},
  mekha:{n:"เมฆา",t:["elec","wind"],hp:150,atk:1.1,def:.95,spd:138,basic:"b_mekha",ult:"u_cloud",role:"ยิงไกล",ds:"แกะขนเมฆฝน เขาสายฟ้า คุมระยะไกล"},
  prikky:{n:"พริกกี้",t:["grass","fire"],hp:160,atk:1.15,def:.95,spd:124,basic:"b_prikky",ult:"u_chili",role:"ยิงรัว",ds:"กิ้งก่าพริกขี้หนู ยิงรัวและเผาทุกอย่าง"},
  sila:{n:"ศิลา",t:["earth","grass"],hp:200,atk:1.05,def:1.2,spd:96,basic:"b_sila",ult:"u_colossus",role:"รถถัง",ds:"โกเลมหินมีมอส ตาผลึก หมัดหนักและอึด"},
  eela:{n:"อีลล่า",t:["water","elec"],hp:165,atk:1.1,def:1,spd:122,basic:"b_eela",ult:"u_dragon",role:"คุมพื้นที่",ds:"ปลาไหลโคมไฟ ว่ายน้ำเร็ว ช็อตทั้งแม่น้ำ"},
  fuwa:{n:"ฟูวา",t:["wind","water"],hp:155,atk:1,def:1,spd:134,basic:"b_fuwa",ult:"u_bubble",role:"ก่อกวน",ds:"แมงกะพรุนก้อนเมฆ ผลักและดูดคู่ต่อสู้"},
  blazar:{n:"เบลซาร์",t:["fire","metal"],hp:170,atk:1.1,def:1.12,spd:118,basic:"b_blazar",ult:"u_barrage",role:"ยิงรัว",ds:"มังกรจิ้งจกเกราะเหล็ก พ่นลูกไฟรัวเป็นชุด"},
  reya:{n:"เรย่า",t:["water","wind"],hp:150,atk:1.05,def:.95,spd:136,basic:"b_reya",ult:"u_flood",role:"คุมพื้นที่",ds:"กระเบนเมฆบิน สร้างพายุหมุนน้ำดูดคู่ต่อสู้"},
  terran:{n:"เทอร์รัน",t:["earth","grass"],hp:210,atk:1.08,def:1.25,spd:92,basic:"b_terran",ult:"u_cage",role:"รถถัง",ds:"ผู้พิทักษ์กระดองหิน ทุบพื้นเป็นแรงกระแทก"},
  umbra:{n:"อัมบร้า",t:["elec","shadow"],hp:140,atk:1.15,def:.88,spd:152,basic:"b_umbra",ult:"u_phantom",role:"นักล่า",ds:"จิ้งจอกเงาสายฟ้า เร็วที่สุด ทิ้งภาพติดตาไว้ข้างหลัง"},
  lavarok:{n:"ลาวาร็อก",t:["fire","earth"],hp:190,atk:1.12,def:1.15,spd:104,basic:"b_lavarok",ult:"u_volcano",role:"บุกประชิด",ds:"ด้วงแรดหลังภูเขาไฟ เดินบนลาวาได้สบาย"}
};
const typedMoves=t=>Object.keys(MOVES).filter(m=>{const v=MOVES[m];return!v.ult&&!v.hidden&&!v.basic&&v.t===t});
const poolOf=k=>[...typedMoves(MONS[k].t[0]),...typedMoves(MONS[k].t[1]),...COMMON];
const defMoves=k=>[typedMoves(MONS[k].t[0])[1],typedMoves(MONS[k].t[1])[2],"beam"];
const ARENAS=[
  {k:"stadium",n:"สนามประลอง",d:"ลังไม้พังได้ ถังระเบิดจะระเบิดเมื่อโดนโจมตี"},
  {k:"forest",n:"ป่าทึบ",d:"ซ่อนตัวในพุ่มไม้และใต้ต้นไม้ได้ ท่าไฟเผาให้ไหม้หายไป"},
  {k:"river",n:"แม่น้ำสายฟ้า",d:"ลงน้ำแล้วเดินช้า ท่าสายฟ้าที่โดนน้ำจะช็อตทั้งแม่น้ำ"},
  {k:"volcano",n:"ปากปล่องภูเขาไฟ",d:"บ่อลาวาเผาคนที่เหยียบ ท่าน้ำทำให้ลาวาแข็งชั่วคราว"},
  {k:"ice",n:"ทะเลสาบน้ำแข็ง",d:"พื้นน้ำแข็งลื่น หยุดไม่อยู่ ท่าไฟละลายน้ำแข็งเป็นแอ่งน้ำ"},
  {k:"desert",n:"ทะเลทรายเดือด",d:"หลุมทรายดูดทำให้ช้าและดูดเข้ากลาง กระบองเพชรตำคนที่ชน"},
  {k:"ruins",n:"ซากวิหาร",d:"กำแพงหินบังกระสุนและลำแสง มีแท่นวาร์ป 2 จุดเชื่อมถึงกัน"},
  {k:"swamp",n:"หนองพิษ",d:"บึงพิษกัดพลังและทำให้ช้า บ่อน้ำพุกลางสนามฟื้นพลังให้คนที่ยืน"}
];
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
  umbra(g0,b){const g=mirG(g0),N="#2a2456",V="#4a3a9a",C="#4ad8ff",CL="#bff4ff",Y="#ffe04a";
    g.E(26,15+b,3,5,V);g.E(27,11+b,2,4,C);g.L(27,7+b,29,3+b,C);g.P(28,8+b,CL);g.P(27,12+b,CL);g.P(25,18+b,C);g.L(24,19+b,22,20+b,N);
    g.R(8,24,3,6,N);g.R(12,25,3,5,N);g.R(18,25,3,5,N);g.R(22,24,3,6,N);g.R(8,29,3,1,C);g.R(12,29,3,1,C);g.R(18,29,3,1,C);g.R(22,29,3,1,C);
    g.E(16,20+b,8,5,N);g.E(16,22+b,5,2,V);g.P(12,18+b,C);g.P(13,19+b,C);g.P(19,21+b,C);g.P(20,20+b,C);g.P(16,18+b,C);g.L(21,17+b,23,18+b,C);
    g.E(11,15+b,4,5,V);g.L(13,11+b,15,7+b,C);g.L(12,12+b,13,8+b,CL);g.L(14,13+b,17,10+b,C);g.P(15,14+b,C);
    g.E(9,13+b,5,4,N);g.E(5,15+b,3,2,N);g.P(2,15+b,V);g.P(3,16+b,V);
    g.L(8,10+b,6,4+b,N);g.L(9,10+b,7,4+b,N);g.L(9,10+b,8,5+b,C);g.L(12,10+b,13,4+b,N);g.L(13,10+b,14,5+b,N);g.L(12,9+b,13,6+b,C);
    g.R(7,12+b,2,2,Y);g.P(7,13+b,OUT);g.L(6,11+b,9,11+b,OUT);g.P(4,17+b,"#fff");g.P(6,17+b,"#fff");g.L(4,16+b,7,16+b,V);
    g.P(21,31,Y);g.P(23,30,Y);g.P(5,31,Y);g.P(27,31,Y);g.P(15,31,C);}
});
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
const SEL={mon:"pyros",mv:{},nick:"ผู้เล่น",ar:"random",step:1};
(function load(){const s=store.get("com.sel3",null);if(s&&MONS[s.mon])SEL.mon=s.mon;if(s&&(s.ar==="random"||ARENAS.some(a=>a.k===s.ar)))SEL.ar=s.ar;
  for(const k in MONS){const pool=poolOf(k);let m=s&&s.mv&&Array.isArray(s.mv[k])?s.mv[k].filter(x=>pool.includes(x)):[];m=[...new Set(m)].slice(0,3);SEL.mv[k]=m.length===3?m:defMoves(k)}})();
const saveSel=()=>store.set("com.sel3",{mon:SEL.mon,mv:SEL.mv,ar:SEL.ar});
const ANIM=[];let animF=0;
function spriteCanvas(k,animate){const c=document.createElement("canvas");c.width=c.height=SS;c.getContext("2d").drawImage(SPR[k].f[0],0,0);if(animate){c.dataset.k=k;ANIM.push(c)}return c}
setInterval(()=>{animF^=1;for(let i=ANIM.length-1;i>=0;i--){const c=ANIM[i];if(!c.isConnected){ANIM.splice(i,1);continue}const g=c.getContext("2d");g.clearRect(0,0,SS,SS);g.drawImage(SPR[c.dataset.k].f[animF],0,0)}},420);
const mvTypeOf=(mv,monKey)=>mv.t==="self"?MONS[monKey].t[0]:mv.t;
function statRow(lab,v){const r=el("div","stat");r.append(el("span",null,lab));const i=el("i");const u=el("u");u.style.width=Math.round(clamp(v,0,1)*100)+"%";i.append(u);r.append(i);return r}
function renderMons(){const box=$("mons");box.textContent="";
  for(const k in MONS){const m=MONS[k];const b=el("button","mon");b.type="button";b.setAttribute("aria-pressed",String(SEL.mon===k));b.style.setProperty("--tc",TY[m.t[0]].c);
    b.append(spriteCanvas(k,SEL.mon===k),el("b",null,m.n));const tg=el("div","tg");m.t.forEach(t=>tg.append(chip(t)));b.append(tg,el("span","role",m.role));
    b.onclick=()=>{SEL.mon=k;saveSel();SFX.play("ui");renderMons()};box.append(b)}
  const m=MONS[SEL.mon],d=$("monDetail");d.textContent="";d.style.setProperty("--tc",TY[m.t[0]].c);
  const hero=el("div","hero");hero.append(spriteCanvas(SEL.mon,true));d.append(hero);
  const nm=el("h3",null,m.n);d.append(nm);const tg=el("div","tg");m.t.forEach(t=>tg.append(chip(t)));tg.append(el("span","role",m.role));d.append(tg,el("p","ds",m.ds));
  d.append(statRow("พลังชีวิต",m.hp/200),statRow("โจมตี",(m.atk-.8)/.4),statRow("ป้องกัน",(m.def-.8)/.5),statRow("ความเร็ว",(m.spd-80)/65));
  const b=MOVES[m.basic],u=MOVES[m.ult];const k1=el("div","kit");k1.append(el("small",null,"โจมตีพื้นฐาน"),el("b",null,b.n),el("span",null,b.d));
  const k2=el("div","kit ult");k2.append(el("small",null,"ท่าไม้ตาย"),el("b",null,u.n),el("span",null,u.d));d.append(k1,k2)}
function slotCard(lab,mv,key,cls){const s=el("div","slot "+(cls||""));if(mv){const t=mvTypeOf(mv,SEL.mon);s.style.setProperty("--tc",TY[t].c);s.append(el("small",null,lab),el("b",null,mv.n),el("em",null,TY[t].n+" · "+(KIND[mv.kind]||"พิเศษ")))}else{s.classList.add("empty");s.append(el("small",null,lab),el("em",null,"เลือกท่าจากด้านล่าง"))}
  if(key)s.dataset.k=key;return s}
function renderMoves(msg){const cur=SEL.mv[SEL.mon],m=MONS[SEL.mon],lo=$("loadout"),pool=$("pool");lo.textContent="";pool.textContent="";
  lo.append(slotCard("โจมตีพื้นฐาน",MOVES[m.basic],null,"fixed"));
  for(let i=0;i<3;i++){const c=slotCard("สกิล "+(i+1),cur[i]?MOVES[cur[i]]:null,cur[i]);if(cur[i]){c.classList.add("rm");c.title="กดเพื่อถอดท่านี้";c.onclick=()=>{cur.splice(i,1);saveSel();SFX.play("ui");renderMoves()}}lo.append(c)}
  lo.append(slotCard("ท่าไม้ตาย",MOVES[m.ult],null,"fixed ult"));
  const groups=[["ท่าธาตุ"+TY[m.t[0]].n,typedMoves(m.t[0])],["ท่าธาตุ"+TY[m.t[1]].n,typedMoves(m.t[1])],["ท่าทั่วไป",COMMON]];
  for(const [title,list] of groups){pool.append(el("h3","grp",title));const g=el("div","grid");
    for(const k of list){const mv=MOVES[k],t=mvTypeOf(mv,SEL.mon);const b=el("button","mv");b.type="button";b.style.setProperty("--tc",TY[t].c);const on=cur.includes(k);b.setAttribute("aria-pressed",String(on));
      const head=el("span","h");head.append(el("b",null,mv.n),chip(t));
      b.append(head,el("span","n",(mv.pw?"แรง "+mv.pw+(mv.cnt>1?"×"+mv.cnt:"")+" · ":"")+(KIND[mv.kind]||"")+" · "+mv.cd+"s"),el("span","d",mv.d));
      b.onclick=()=>{const i=cur.indexOf(k);if(i>=0){cur.splice(i,1);renderMoves()}else if(cur.length<3){cur.push(k);renderMoves()}else renderMoves("ครบ 3 สกิลแล้ว กดสกิลในแถบด้านบนเพื่อถอดออกก่อน");saveSel();SFX.play("ui")};
      g.append(b)}pool.append(g)}
  const h=$("mvHint");h.className="hint"+(msg||cur.length<3?" warn":"");h.textContent=msg||(cur.length<3?"เลือกอีก "+(3-cur.length)+" สกิลให้ครบก่อนไปต่อ":"ครบแล้ว กดสกิลในแถบด้านบนเพื่อถอด หรือกดถัดไป");renderNav()}
function arenaThumb(key){const c=document.createElement("canvas");c.width=192;c.height=120;const g=c.getContext("2d");g.imageSmoothingEnabled=false;
  if(key==="random"){g.fillStyle="#29253d";g.fillRect(0,0,192,120);g.fillStyle="#f5c542";g.font='700 64px "Silkscreen",monospace';g.textAlign="center";g.fillText("?",96,84);return c}
  const A=buildArena(key),t=document.createElement("canvas");t.width=W/2;t.height=H/2;paintArena(A,t.getContext("2d"));g.drawImage(t,0,0,192,120);const s=192/W;
  const ell=(l,col)=>{g.fillStyle=col;g.beginPath();g.ellipse(l.x*s,l.y*s,l.rx*s,l.ry*s,0,0,7);g.fill()};
  for(const w of A.water){if(w.e)ell(w,"#2f7fd0");else{g.fillStyle="#2f7fd0";g.fillRect(w.x*s,w.y*s,w.w*s,w.h*s)}}for(const b of A.bridges){g.fillStyle="#a8743c";g.fillRect(b.x*s,b.y*s,b.w*s,b.h*s)}
  for(const l of A.lava)ell(l,"#ff7a1a");for(const l of A.ice)ell(l,"#cfefff");for(const l of A.sand)ell(l,"#9a7436");for(const l of A.bog)ell(l,"#6a4a8a");
  for(const w of A.walls){g.fillStyle="#8a858c";g.fillRect(w.x*s,w.y*s-2,w.w*s,w.h*s+2)}for(const p of A.pads){g.fillStyle="#c58cff";g.fillRect(p.x*s-3,p.y*s-3,6,6)}if(A.spring){g.fillStyle="#7dffe0";g.beginPath();g.arc(A.spring.x*s,A.spring.y*s,6,0,7);g.fill()}
  const pc={crate:"#b8793a",barrel:"#c0392b",rock:"#6f6a70",tree:"#1f7a35",bush:"#49b356",cactus:"#3a9a4a",icep:"#bfeaff"};for(const p of A.props){g.fillStyle=pc[p.k];const r=p.k==="tree"||p.k==="bush"?5:3;g.fillRect(p.x*s-r,p.y*s-r,r*2,r*2)}
  return c}
function renderArenas(){const box=$("arenas");box.textContent="";
  for(const a of [{k:"random",n:"สุ่มสนาม",d:"สุ่มหนึ่งในแปดสนามทุกครั้งที่เริ่ม"},...ARENAS]){const b=el("button","ar");b.type="button";b.setAttribute("aria-pressed",String(SEL.ar===a.k));
    b.append(arenaThumb(a.k),el("b",null,a.n),el("span",null,a.d));b.onclick=()=>{SEL.ar=a.k;saveSel();SFX.play("ui");renderArenas()};box.append(b)}}
function renderChart(){const c=$("chart");c.textContent="";
  for(const k of ["fire","water","grass","elec","earth","wind","metal","shadow"]){const r=el("div");r.append(chip(k),el("span","w","ชนะ"));for(const b of TY[k].beats)r.append(chip(b));c.append(r)}}
function renderNav(){const ok=SEL.mv[SEL.mon].length===3;$("bBack").hidden=SEL.step===1;$("bNext").hidden=SEL.step===3;$("bNext").disabled=SEL.step===2&&!ok;
  $("bNext").textContent=SEL.step===1?"ถัดไป: จัดท่า":"ถัดไป: เลือกสนาม";$("navInfo").textContent=MONS[SEL.mon].n+(SEL.step>1?" · "+SEL.mv[SEL.mon].map(k=>MOVES[k].n).join(" / "):"");
  [...$("steps").children].forEach((li,i)=>{li.className=i+1===SEL.step?"on":i+1<SEL.step?"done":""})}
function gotoStep(n){SEL.step=n;for(const i of [1,2,3])$("st"+i).hidden=i!==n;if(n===1)renderMons();if(n===2)renderMoves();if(n===3){renderArenas();netButtons()}renderNav();window.scrollTo(0,0)}

/* ================= online ================= */
let ROOM=null,NR=null,CODE="",netState="off",unsubPeers=null,myReady=false;
function netButtons(){const ok=SEL.mv[SEL.mon].length===3&&!!ROOM;$("bHost").disabled=!ok;$("bJoin").disabled=!ok;$("bBot").disabled=SEL.mv[SEL.mon].length!==3||!PG}
function netHint(){$("netHint").textContent=netState==="wait"?"กำลังเชื่อมต่อระบบเล่นออนไลน์…":netState==="ok"?NETOK:NETOFF;netButtons()}
const NETOK="เล่นออนไลน์ได้เลย ไม่ต้องสมัครสมาชิก สร้างห้องแล้วส่งรหัสหรือลิงก์เชิญให้เพื่อน",NETOFF="เบราว์เซอร์นี้เชื่อมต่อผู้เล่นอื่นไม่ได้ ยังฝึกกับบอทได้ตามปกติ",INVITE=true;
/* Peer-to-peer room over WebRTC (PeerJS). Same small surface the game uses: presence / peers / onPeers / leave. */
function peerRoom(code,host){return new Promise((resolve,reject)=>{
  const ID="clashmon7-"+code;let mine={},theirs=null,conn=null,done=false,closed=false;const hs=new Set();
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


const PV=7,myCard=()=>({v:PV,nick:SEL.nick,mon:SEL.mon,mv:SEL.mv[SEL.mon].slice(),ar:SEL.ar});
const CLR={ready:false,rt:0,ko:null,g:null,a:null,h:null,mn:null,xb:null};
async function enterRoom(code,host){if(!ROOM)return;code=code.toLowerCase();
  if(!/^[a-z0-9]{4}$/.test(code)){$("netHint").textContent="รหัสห้องต้องเป็นตัวอักษรอังกฤษหรือตัวเลข 4 ตัว";return}
  $("netHint").textContent="กำลังเข้าห้อง…";
  try{NR=await ROOM.join(code,!!host)}catch(e){if(host&&e==="taken"){$("bHost").click();return}
    $("netHint").textContent=e==="nohost"?"ไม่พบห้องรหัสนี้ ตรวจรหัสอีกครั้ง หรือให้เพื่อนสร้างห้องใหม่":e==="timeout"?"เชื่อมต่อไม่ทันเวลา เครือข่ายอาจปิดกั้นการเชื่อมต่อแบบตรง ลองเปลี่ยนเครือข่าย":"เข้าห้องไม่สำเร็จ ลองใหม่อีกครั้ง";return}
  CODE=code;myReady=false;NR.presence({...myCard(),...CLR}).catch(()=>{});
  $("lobCode").textContent=code.toUpperCase();$("bCopy").hidden=!INVITE;show("lobby");renderLobby();
  if(unsubPeers)unsubPeers();unsubPeers=NR.onPeers(()=>{if(!$("lobby").hidden)renderLobby()},()=>{});netHint()}
function leaveRoom(){if(unsubPeers){unsubPeers();unsubPeers=null}if(NR){NR.leave().catch(()=>{});NR=null}CODE="";myReady=false}
function peerCard(p){const q=p.presence||{};const mon=MONS[q.mon]?q.mon:"pyros";const pool=poolOf(mon);
  let mv=Array.isArray(q.mv)?[...new Set(q.mv.filter(k=>typeof k==="string"&&pool.includes(k)))].slice(0,3):[];if(mv.length<3)mv=defMoves(mon);
  return{nick:cleanNick(q.nick),mon,mv,ready:!!q.ready,rt:Number(q.rt)||0,ar:typeof q.ar==="string"?q.ar:"random",v:q.v}}
function renderLobby(){if(!NR)return;const ps=NR.peers(),box=$("seats");box.textContent="";let old=false;
  for(const p of ps){const c=peerCard(p);if(!p.sameTab&&c.v!==PV&&c.v!=null)old=true;const s=el("div","seat"+(c.ready?" rdy":""));s.append(spriteCanvas(c.mon,true));
    const d=el("div");d.append(el("b",null,c.nick+(p.sameTab?" (คุณ)":"")),el("small",null,MONS[c.mon].n+" · "+MONS[c.mon].t.map(t=>TY[t].n).join("/")),el("small",null,c.ready?"พร้อมแล้ว":"ยังไม่พร้อม"));
    s.append(d);box.append(s)}
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
  const readHash=()=>{const h=(location.hash||"").slice(1).toLowerCase();if(/^[a-z0-9]{4}$/.test(h))$("code").value=h.toUpperCase()};readHash();addEventListener("hashchange",readHash);
  $("bNext").onclick=()=>{SFX.play("ui");gotoStep(Math.min(3,SEL.step+1))};$("bBack").onclick=()=>{SFX.play("ui");gotoStep(Math.max(1,SEL.step-1))};
  [...$("steps").children].forEach((li,i)=>li.onclick=()=>{if(i+1<SEL.step||(SEL.mv[SEL.mon].length===3))gotoStep(i+1)});
  $("bBot").onclick=startBot;$("bSnd").onclick=()=>{SFX.on=!SFX.on;$("bSnd").textContent=SFX.on?"เสียง: เปิด":"เสียง: ปิด"};
  renderChart();gotoStep(1);netHint()}
/* ================= arenas ================= */
const W=960,H=600,VW=640,VH=400,FR=14;
const bg=document.createElement("canvas");bg.width=W/2;bg.height=H/2;const bgx=bg.getContext("2d");
function buildArena(key){
  const A={key,props:[],water:[],bridges:[],lava:[],ice:[],sand:[],bog:[],walls:[],pads:[],spring:null};
  const DEF={crate:{r:14,hp:3},barrel:{r:11,hp:1},rock:{r:15,hp:3},tree:{r:8,R:32,hp:1},bush:{r:0,R:30,hp:1},cactus:{r:10,hp:2},icep:{r:13,hp:2}};
  const P=(k,pts,sym)=>{for(const[x,y]of pts){for(const q of sym===0?[[x,y]]:[[x,y],[W-x,H-y]]){if(A.props.some(p=>p.x===q[0]&&p.y===q[1]))continue;const d=DEF[k];A.props.push({i:A.props.length,k,x:q[0],y:q[1],r:d.r,R:d.R||d.r,hp:d.hp,dead:false})}}};
  const E=(arr,list)=>{for(const[x,y,rx,ry]of list)for(const q of (x===W/2&&y===H/2)?[[x,y]]:[[x,y],[W-x,H-y]])arr.push({x:q[0],y:q[1],rx,ry,cool:0,e:1})};
  switch(key){
    case"stadium":P("crate",[[300,180],[300,420],[480,150],[390,300]]);P("crate",[[480,300]],0);P("barrel",[[480,80],[190,110],[190,490],[620,250]]);break;
    case"forest":P("tree",[[300,170],[300,430],[480,110],[150,130],[620,300]]);P("tree",[[480,300]],0);P("bush",[[390,300],[480,205],[220,300],[110,470],[380,90],[380,510],[230,200],[700,520],[60,300]]);break;
    case"river":A.water.push({x:440,y:0,w:80,h:H});A.bridges.push({x:432,y:92,w:96,h:46},{x:432,y:277,w:96,h:46},{x:432,y:462,w:96,h:46});E(A.water,[[210,480,62,36]]);P("crate",[[300,300],[330,130]]);P("bush",[[250,90],[120,300],[380,400]]);P("barrel",[[480,300]],0);break;
    case"volcano":E(A.lava,[[480,300,56,36],[290,150,40,26],[300,440,34,22],[130,300,28,20],[480,80,36,20]]);P("rock",[[390,220],[210,360],[600,480],[370,520]]);break;
    case"ice":E(A.ice,[[480,300,180,110],[200,140,92,58],[220,470,74,46]]);P("icep",[[360,190],[340,400],[480,150],[120,300]]);P("rock",[[620,130]]);break;
    case"desert":E(A.sand,[[480,300,92,58],[250,150,62,40],[280,460,54,36]]);P("cactus",[[370,300],[180,300],[420,110],[330,220],[120,500],[560,430]]);P("rock",[[640,180]]);P("barrel",[[480,470]]);break;
    case"ruins":for(const[x,y,w,h]of[[430,120,100,24],[290,250,24,100],[160,96,24,84],[110,410,96,24],[380,440,24,70]]){A.walls.push({x,y,w,h});A.walls.push({x:W-x-w,y:H-y-h,w,h})}
      A.pads.push({x:90,y:70,cd:0},{x:W-90,y:H-70,cd:0});P("crate",[[480,300]],0);P("crate",[[240,200],[560,90]]);P("bush",[[400,300],[90,300]]);break;
    case"swamp":E(A.bog,[[300,190,92,50],[280,450,72,42],[620,90,64,34],[130,320,50,34]]);A.spring={x:480,y:300,r:36};P("bush",[[400,300],[200,320],[430,120],[110,150]]);P("tree",[[340,330],[560,520],[200,80]]);break}
  return A}
function paintArena(A,c){c=c||bgx;const w=W/2,h=H/2;let seed=A.key.length*977+A.key.charCodeAt(1)*31;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const T={stadium:{a:"#4b2f52",b:"#3a3157",n:["#3b2542","#5a3d63"],l:"#d9a441"},forest:{a:"#2f7d3a",b:"#2a7234",n:["#256a2f","#3a8c45"],l:"#3f9a4a"},
    river:{a:"#7aa04a",b:"#739a46",n:["#688c3e","#8ab257"],l:"#e8f2e0"},volcano:{a:"#3a2f33",b:"#33292d",n:["#2a2125","#4a3c40"],l:"#7a4a2a"},
    ice:{a:"#dfeef8",b:"#d2e6f4",n:["#c4dcee","#f4fbff"],l:"#8fb8d8"},desert:{a:"#d9b36a",b:"#d0a95f",n:["#c29a52","#e6c684"],l:"#a8824a"},
    ruins:{a:"#6a7468",b:"#626c62",n:["#566056","#7c8878"],l:"#3e463e"},swamp:{a:"#3a4a3a",b:"#34443a",n:["#2a3a30","#4a5a40"],l:"#5a6a3a"}}[A.key];
  for(let x=0;x<w;x+=20){c.fillStyle=((x/20)|0)%2?T.a:T.b;c.fillRect(x,0,20,h)}
  if(A.key==="stadium"||A.key==="ruins"){c.fillStyle=A.key==="ruins"?"#4a544a":"#241a2c";for(let x=0;x<w;x+=40)c.fillRect(x,0,1,h);for(let y=0;y<h;y+=40)c.fillRect(0,y,w,1)}
  for(let i=0;i<6200;i++){c.fillStyle=T.n[(R()*2)|0];c.fillRect((R()*w)|0,(R()*h)|0,1+((R()*2)|0),1)}
  const dots=(n,cols)=>{for(let i=0;i<n;i++){c.fillStyle=cols[(R()*cols.length)|0];c.fillRect((R()*w)|0,(R()*h)|0,1,1)}};
  if(A.key==="volcano")dots(90,["#ff7a3d"]);if(A.key==="forest")dots(130,["#ffe680","#ff9ab0"]);if(A.key==="swamp")dots(120,["#8a6aa8","#7dc86a"]);if(A.key==="ice")dots(160,["#ffffff"]);if(A.key==="ruins")dots(140,["#4cae52"]);
  if(A.key==="desert")for(let i=0;i<26;i++){const x=(R()*w)|0,y=(R()*h)|0;c.fillStyle="#b8904a";c.fillRect(x,y,10+((R()*14)|0),1);c.fillRect(x+3,y+2,8,1)}
  if(A.key==="ice")for(let i=0;i<30;i++){const x=(R()*w)|0,y=(R()*h)|0;c.fillStyle="#b4d2e8";c.fillRect(x,y,6,1);c.fillRect(x+5,y+1,4,1)}
  c.fillStyle=T.l;const dot=(x,y)=>{if(R()>.12)c.fillRect(x|0,y|0,1,1)};
  for(let x=6;x<w-6;x++){dot(x,6);dot(x,h-7)}for(let y=6;y<h-6;y++){dot(6,y);dot(w-7,y)}
  if(A.key==="stadium"){for(let y=6;y<h-6;y++)dot(w/2,y);for(let a=0;a<6.283;a+=.012)dot(w/2+Math.cos(a)*46,h/2+Math.sin(a)*46)}}
function crater(x,y,r,hole){BGD=true;const c=bgx;x=(x/2)|0;y=(y/2)|0;r=(r/2)|0;
  c.fillStyle="rgba(0,0,0,.28)";c.beginPath();c.ellipse(x,y,r,r*.7,0,0,7);c.fill();c.fillStyle=hole?"rgba(20,12,8,.8)":"rgba(0,0,0,.3)";c.beginPath();c.ellipse(x,y+1,r*.62,r*.42,0,0,7);c.fill();
  c.fillStyle="rgba(255,255,255,.16)";for(let i=0;i<10;i++){const a=rnd(0,6.28);c.fillRect((x+Math.cos(a)*r)|0,(y+Math.sin(a)*r*.7)|0,1,1)}}
function scorch(x,y,r){BGD=true;const c=bgx;c.fillStyle="rgba(15,10,10,.55)";c.beginPath();c.ellipse((x/2)|0,(y/2)|0,r/2,r*.35,0,0,7);c.fill()}
const inRect=(r,x,y,p)=>x>=r.x-(p||0)&&x<=r.x+r.w+(p||0)&&y>=r.y-(p||0)&&y<=r.y+r.h+(p||0);
const inEll=(l,x,y,p)=>{const a=(x-l.x)/(l.rx+(p||0)),b=(y-l.y)/(l.ry+(p||0));return a*a+b*b<1};
const inWater=(x,y)=>G.A.water.some(w=>w.e?inEll(w,x,y):inRect(w,x,y))&&!G.A.bridges.some(r=>inRect(r,x,y));
const waterNear=(x,y,r)=>G.A.water.some(w=>w.e?inEll(w,x,y,r):inRect(w,x,y,r));
const ellAt=(arr,x,y,p)=>arr.find(l=>inEll(l,x,y,p));
const wallAt=(x,y,r)=>G.A.walls.find(w=>inRect(w,x,y,r));
const inCover=f=>G.A.props.some(p=>!p.dead&&((p.k==="bush"&&Math.hypot(p.x-f.x,p.y-f.y)<p.R-4)||(p.k==="tree"&&Math.hypot(p.x-f.x,p.y-14-f.y)<p.R-2)));
const seenBy=(o,f)=>o.under<=0&&!(o.cloak>0&&o.reveal<=0&&Math.hypot(o.x-f.x,o.y-f.y)>70)&&!(inCover(o)&&o.reveal<=0&&o.burn<=0&&Math.hypot(o.x-f.x,o.y-f.y)>90);
function meltIce(x,y,r){const A=G.A;for(let i=A.ice.length-1;i>=0;i--){const l=A.ice[i];if(inEll(l,x,y,r)){A.ice.splice(i,1);A.water.push(l);FX.burst(l.x,l.y,"#e8f4ff",30,l.rx*2.4,.9);SFX.play("dash","water")}}}

/* ================= game state ================= */
let G=null;const ENV={mon:{atk:1,t:[]},owned:false,env:true,ult:0,x:0,y:0};
function mkFighter(card,x,face,owned,tag){const m=MONS[card.mon];
  return{tag,card,mon:m,key:card.mon,moves:card.mv,x,y:H/2,tx:x,ty:H/2,ax:face,ay:0,hp:m.hp,max:m.hp,owned,seq:0,ult:0,cdB:0,
    cds:[0,0,0],dodgeCd:0,stun:0,stunImm:0,slow:0,burn:0,burnTick:0,guard:0,haste:0,rest:0,under:0,roll:0,rdx:0,rdy:0,ifr:0,root:0,air:0,airT:1,jx:0,jy:0,land:null,shield:0,shieldT:0,cast:0,faceT:0,cloak:0,inv:0,busy:0,bub:0,U:null,
    dash:null,chg:null,chgF:0,kx:0,ky:0,ivx:0,ivy:0,hk:null,flash:0,walk:0,moving:false,reveal:0,envT:0,cacT:0,sprT:0,padCd:0,hitSet:new Set(),hits:[],atks:[],minions:[],ai:{t:1.2,s:1,st:1,lx:W/2,ly:H/2,hold:null}}}
function newGame(mode,meCard,opCard,left,arKey){
  const A=buildArena(arKey);paintArena(A);
  const me=mkFighter(meCard,left?150:W-150,left?1:-1,true,"m"+((Math.random()*1e5)|0)+"-"),op=mkFighter(opCard,left?W-150:150,left?-1:1,mode==="bot","o");
  G={mode,A,me,op,shots:[],blasts:[],zones:[],rings:[],beams:[],waves:[],slashes:[],cones:[],traps:[],orbits:[],twalls:[],ults:[],cd:3.2,over:null,shake:0,t:0,cut:null,stop:0,zapT:0,zapSeen:new Set(),dark:0,
    seenA:new Set(),seenH:new Set(),myDrain:new Map(),myKills:[],opPeer:null,gone:0,sendT:0,left};
  $("nmL").textContent="";$("nmR").textContent="";const L=left?me:op,Rr=left?op:me;
  L.mon.t.forEach(t=>$("nmL").append(chip(t)));$("nmL").append(el("span",null,L.card.nick+(L===me?" (คุณ)":"")));
  $("nmR").append(el("span",null,Rr.card.nick+(Rr===me?" (คุณ)":"")));Rr.mon.t.forEach(t=>$("nmR").append(chip(t)));
  $("arName").textContent=ARENAS.find(a=>a.k===arKey).n;
  resetInput();buildButtons();$("over").hidden=true;show("game");layout();VIEW.reset()}
const pickArena=(pref,r)=>ARENAS.some(a=>a.k===pref)?pref:ARENAS[Math.min(ARENAS.length-1,(r*ARENAS.length)|0)].k;
function startBot(){if(!PG)return;SFX.init();const keys=Object.keys(MONS).filter(k=>k!==SEL.mon);const k=keys[(Math.random()*keys.length)|0];
  const pool=poolOf(k).filter(x=>x!=="rest"&&x!=="guard").sort(()=>Math.random()-.5);
  newGame("bot",myCard(),{nick:"บอท "+MONS[k].n,mon:k,mv:pool.slice(0,3)},true,pickArena(SEL.ar,Math.random()))}
function startNet(meP,opP){if(G&&G.mode==="net"&&!G.over&&!$("game").hidden)return;SFX.init();
  const left=meP.peer<opP.peer,oc=peerCard(opP);const pref=left?SEL.ar:oc.ar;let s=0;for(const ch of CODE)s+=ch.charCodeAt(0);s+=((Number(meP.presence.rt)||0)%97)+((Number(opP.presence.rt)||0)%97);
  newGame("net",myCard(),oc,left,pickArena(pref,(s%8)/8));G.opPeer=opP.peer}
function endGame(res,why){if(!G||G.over)return;G.over=res;SFX.play("ko");
  $("ovT").textContent=res==="win"?"ชนะ!":res==="lose"?"แพ้":"เสมอ";$("ovT").style.color=res==="win"?"var(--gold)":res==="lose"?"var(--bad)":"var(--fg)";
  $("ovP").textContent=why||(res==="win"?"คู่ต่อสู้หมดพลัง":"มอนสเตอร์ของคุณหมดพลัง");$("over").hidden=false;
  if(G.mode==="net"&&NR){myReady=false;NR.presence({ready:false,rt:0,ko:G.me.hp<=0?true:null}).catch(()=>{})}}
function backFromGame(toMenu){const net=G&&G.mode==="net";G=null;
  if(net&&NR&&!toMenu){NR.presence({...CLR}).catch(()=>{});show("lobby");renderLobby()}else{if(net)leaveRoom();show("menu");gotoStep(3)}}
$("bAgain").onclick=()=>{if(G&&G.mode==="bot")startBot();else backFromGame(false)};
$("bMenu").onclick=()=>backFromGame(true);
$("quit").onclick=()=>{if(G&&G.mode==="net"&&NR&&!G.over)NR.presence({ready:false,rt:0,ko:true}).catch(()=>{});backFromGame(true)};

/* ================= input: move with one hand, aim with the other =================
   Every attack slot is hold-to-aim, release-to-fire. A quick tap fires with auto-aim (touch) or at the cursor (mouse). */
const SLOTS=["b",0,1,2,"u"];
const IN={k:{},joy:{x:0,y:0},mouse:{x:.5,y:.5,on:false},slot:{},rel:[],dodge:0};
function resetInput(){IN.k={};IN.joy.x=IN.joy.y=0;IN.rel=[];IN.dodge=0;for(const s of SLOTS)IN.slot[s]={down:false,ax:0,ay:0,mag:0,manual:false}}
resetInput();
const KM={KeyQ:0,KeyE:1,KeyR:2,Digit1:0,Digit2:1,Digit3:2,KeyJ:0,KeyK:1,KeyL:2};
addEventListener("keydown",e=>{if(!G||$("game").hidden||e.repeat)return;if(e.target&&e.target.tagName==="INPUT")return;
  if(e.code in KM){const s=IN.slot[KM[e.code]];s.down=true;s.manual=false;e.preventDefault()}else if(e.code==="Space"||e.code==="ShiftLeft"){IN.dodge=1;e.preventDefault()}
  else if(e.code==="KeyF"||e.code==="KeyU"){IN.slot.u.manual=false;IN.rel.push("u");e.preventDefault()}
  else if(/^(Key[WASD]|Arrow)/.test(e.code)){IN.k[e.code]=1;e.preventDefault()}});
addEventListener("keyup",e=>{if(e.code in KM){const s=IN.slot[KM[e.code]];if(s.down){s.down=false;IN.rel.push(KM[e.code])}}else if(e.code==="Space"||e.code==="ShiftLeft")IN.dodge=0;else IN.k[e.code]=0});
addEventListener("blur",()=>resetInput());
{const st=$("stage");const mm=e=>{const c=st.querySelector("canvas");if(!c)return;const r=c.getBoundingClientRect();if(!r.width)return;IN.mouse.x=(e.clientX-r.left)/r.width;IN.mouse.y=(e.clientY-r.top)/r.height;IN.mouse.on=e.pointerType!=="touch"};
  st.addEventListener("pointermove",mm);st.addEventListener("pointerdown",e=>{mm(e);if(e.pointerType!=="touch"&&e.button===0&&G&&!G.over){IN.slot.b.down=true;IN.slot.b.manual=false}});
  addEventListener("pointerup",e=>{if(e.pointerType!=="touch")IN.slot.b.down=false})}
{const base=$("joyBase"),knob=$("joyKnob");let pid=null;
  const mv=e=>{const r=base.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=r.width/2-8,l=Math.hypot(dx,dy);
    if(l>m){dx*=m/l;dy*=m/l}knob.style.transform=`translate(${dx}px,${dy}px)`;const nx=dx/m,ny=dy/m;const d=Math.hypot(nx,ny);IN.joy.x=d<.18?0:nx;IN.joy.y=d<.18?0:ny};
  const up=e=>{if(e.pointerId!==pid)return;pid=null;knob.style.transform="";IN.joy.x=IN.joy.y=0};
  $("joy").addEventListener("pointerdown",e=>{pid=e.pointerId;try{$("joy").setPointerCapture(pid)}catch(_){}mv(e);e.preventDefault()});
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
  aimBtn(mk("pu","u","ท่าไม้ตาย","F",MOVES[f.mon.ult].t),"u")}
$("game").addEventListener("contextmenu",e=>e.preventDefault());
/* where a slot would fire right now */
function slotAim(f,key,mv){const s=IN.slot[key],o=other(f),rng=mv.rng||200;
  if(s.manual)return{ax:s.ax,ay:s.ay,mag:s.mag,manual:true};
  if(!touch&&IN.mouse.on){const wx=VIEW.camX+IN.mouse.x*VW,wy=VIEW.camY+IN.mouse.y*VH,dx=wx-f.x,dy=wy-(f.y-(mv.aim==="point"?0:12)),l=Math.hypot(dx,dy)||1;return{ax:dx/l,ay:dy/l,mag:clamp(l/rng,0,1)}}
  if(seenBy(o,f)){const dx=o.x-f.x,dy=o.y-f.y,l=Math.hypot(dx,dy)||1;return{ax:dx/l,ay:dy/l,mag:clamp(l/rng,0,1),auto:true}}
  return{ax:f.ax,ay:f.ay,mag:.7,auto:true}}
const slotMove=(f,key)=>MOVES[key==="b"?f.mon.basic:key==="u"?f.mon.ult:f.moves[key]];
function myInput(){const f=G.me;let x=(IN.k.KeyD||IN.k.ArrowRight?1:0)-(IN.k.KeyA||IN.k.ArrowLeft?1:0)+IN.joy.x,y=(IN.k.KeyS||IN.k.ArrowDown?1:0)-(IN.k.KeyW||IN.k.ArrowUp?1:0)+IN.joy.y;
  const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}
  const face=!touch&&IN.mouse.on?slotAim(f,"b",MOVES[f.mon.basic]):null;
  const rel=IN.rel.map(k=>({i:k,aim:slotAim(f,k,slotMove(f,k))}));IN.rel=[];
  return{mx:x,my:y,face,basic:IN.slot.b.down?slotAim(f,"b",MOVES[f.mon.basic]):null,sk:[0,1,2].map(i=>({held:IN.slot[i].down,aim:IN.slot[i].down?slotAim(f,i,MOVES[f.moves[i]]):null})),rel,dodge:IN.dodge,ua:IN.slot.u.down&&IN.slot.u.manual?slotAim(f,"u",MOVES[f.mon.ult]):null}}

/* ================= layout ================= */
try{touch=matchMedia("(pointer:coarse)").matches}catch(e){}
addEventListener("touchstart",()=>{if(!touch){touch=true;layout()}},{passive:true,once:true});
function layout(){const g=$("game");if(g.hidden)return;const land=innerWidth>innerHeight*1.25;g.classList.toggle("t-sides",touch&&land);g.classList.toggle("t-stack",touch&&!land);
  if(PG&&PG.scale){try{PG.scale.getParentBounds();PG.scale.refresh()}catch(e){}}}
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
  if(!v.owned||v.hp<=0||v.hitSet.has(key))return false;v.hitSet.add(key);
  const t=mvT(mv,att),e=eff(t,v.mon.t),stab=att.mon.t.includes(t)?1.25:1,grd=v.guard>0;
  let d=Math.max(1,Math.round(mv.pw*(scale||1)*att.mon.atk/v.mon.def*stab*e*(grd?.4:1))),label="";
  if(v.shield>0){const ab=Math.min(v.shield,d);v.shield-=ab;d-=ab;label="ฟองน้ำกัน!";if(v.shield<=0)FX.burst(v.x,v.y-14,"#9ad4ff",18,160,.5)}
  v.hp=Math.max(0,v.hp-d);
  if(!grd&&d>0){if(mv.hard){v.stun=mv.hard;v.bub=mv.hard;v.stunImm=mv.hard+1.6;v.dash=null;v.chg=null;v.kx=v.ky=0;label="ติดฟอง!"}else if(mv.stun&&v.stunImm<=0){v.stun=mv.stun;v.stunImm=mv.stun+1.6;v.dash=null;v.chg=null;label="BONK!"}
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
  else{part(p.x,p.y-6,{crate:"#c79a5a",rock:"#8a858c",cactus:"#49b356",icep:"#cfefff"}[p.k],16,160,.5);if(p.k!=="icep")crater(p.x,p.y,18)}}
function hurtProp(p,att,mv,type){if(p.dead||!(att.owned||att.env))return;const heavy=mv.heavy||0;
  if(p.k==="tree"||p.k==="bush"){if(type==="fire")killProp(p,!att.env);return}
  if(p.k==="icep"&&type==="fire"){killProp(p,!att.env);return}
  if(p.k==="rock"){if(!(heavy&&(type==="earth"||heavy>=9||mv.kind==="beam")))return;p.hp-=heavy>=9?3:1}else p.hp-=heavy?3:1;
  part(p.x,p.y-6,"#d8c8a8",4,80,.3);if(p.hp<=0)killProp(p,!att.env)}
function hurtTwall(w,mv){w.hp-=mv.heavy?3:1;part(w.x,w.y-8,"#b08a5a",4,80,.3);if(w.hp<=0)w.t=0}
function touchEnv(x,y,r,att,mv,id){const type=mvT(mv,att);
  for(const p of G.A.props){if(p.dead)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<r+(p.k==="bush"||p.k==="tree"?p.R*.6:p.r))hurtProp(p,att,mv,type)}
  for(const w of G.twalls)if(Math.hypot(w.x-x,w.y-y)<r+w.r)hurtTwall(w,mv);
  if(type==="elec"&&waterNear(x,y,r))zap(id);if(type==="fire")meltIce(x,y,r*.7);
  if(type==="water")for(const l of G.A.lava){if(Math.hypot(l.x-x,l.y-y)<r+l.rx){if(l.cool<=0)part(l.x,l.y,"#e8f4ff",16,90,.8);l.cool=6}}}
function touchEnvLite(x,y,type,id){if(type==="elec"&&inWater(x,y))zap(id);if(type==="fire")meltIce(x,y,0);if(type==="water"){const l=ellAt(G.A.lava,x,y,4);if(l){if(l.cool<=0)part(l.x,l.y,"#e8f4ff",16,90,.8);l.cool=6}}}
function zap(id){if(G.zapSeen.has(id))return;G.zapSeen.add(id);G.zapT=1;G.shake=Math.min(10,G.shake+3);SFX.play("zap");
  for(const f of [G.me,G.op])if(f.owned&&vuln(f)&&f.roll<=0&&inWater(f.x,f.y))applyHit(f,ENV,ENVMV.zap,id+":riv",null)}
const solidAt=(x,y,r)=>G.A.props.find(p=>!p.dead&&p.r>0&&Math.hypot(p.x-x,p.y-4-y)<p.r+r)||G.twalls.find(w=>Math.hypot(w.x-x,w.y-4-y)<w.r+r);
function rayLen(x,y,dx,dy,max){for(let d=10;d<max;d+=8){const px=x+dx*d,py=y+dy*d;if(px<0||px>W||py<0||py>H)return d;if(wallAt(px,py,0))return d}return max}
/* --- attacks --- */
function addShots(f,a,mv,n,base,opt){opt=opt||{};for(let i=0;i<n;i++){const ang=mv.fan?base+(n>1?(i/(n-1)-.5)*mv.fan:0):base+(opt.spread!=null?opt.spread:((i%2?1:-1)*.035*Math.ceil(i/2)));
  G.shots.push({id:a.id+":"+(opt.k0||0)+"_"+i,base:a.id,own:f,mv,x:a.x,y:a.y-12,vx:Math.cos(ang)*mv.sp,vy:Math.sin(ang)*mv.sp,dx:Math.cos(ang),dy:Math.sin(ang),life:mv.life||1.7,rot:0,bt:0,bn:mv.bn||0,w:(opt.w||0)+(mv.gap?i*mv.gap:0)})}}
function spawnAttack(f,a){const mv=MOVES[a.m];if(!mv)return;
  if(mv.ult&&!a.cut&&!G.cut){G.cut={t:1.05,f,mv,a};SFX.play("ult");return}
  f.reveal=1.2;const ang=Math.atan2(a.dy,a.dx),R=seeded(a.id),type=mvT(mv,f),self=mv.aim!=="point",px=self?a.x:a.tx,py=self?a.y:a.ty;
  switch(mv.kind){
    case"shot":addShots(f,a,mv,mv.cnt||1,ang);SFX.play("shot",type);break;
    case"melee":{G.slashes.push({own:f,mv,x:a.x,y:a.y-12,ang,t:.22,full:.22});SFX.play("melee",type);
      for(const p of G.A.props)if(!p.dead&&inCone(p.x,p.y-8,a.x,a.y-12,ang,mv.rng,mv.arc))hurtProp(p,f,mv,type);for(const w of G.twalls)if(inCone(w.x,w.y-8,a.x,a.y-12,ang,mv.rng,mv.arc))hurtTwall(w,mv);
      touchEnvLite(a.x+a.dx*mv.rng*.6,a.y+a.dy*mv.rng*.6,type,a.id);hurtMinions(f,(x,y)=>inCone(x,y,a.x,a.y-12,ang,mv.rng,mv.arc),mv.pw,a.id);
      const v=other(f);if(v.owned&&vuln(v)&&v.ifr<=0&&inCone(v.x,v.y-12,a.x,a.y-12,ang,mv.rng,mv.arc))applyHit(v,f,mv,a.id,[a.dx,a.dy]);break}
    case"breath":G.cones.push({id:a.id,own:f,mv,t:mv.dur,tk:0,n:0});if(f.owned)f.cast=mv.dur;SFX.play("beam",type);break;
    case"dash":f.dash={t:mv.dur,dx:a.dx,dy:a.dy,mv,id:a.id};part(f.x,f.y,TY[type].c,6,90,.3);SFX.play("dash",type);break;
    case"slam":G.blasts.push({id:a.id,own:f,mv,x:a.x,y:a.y,t:mv.delay,full:mv.delay||.01});if(f.owned&&mv.delay)f.root=mv.delay;break;
    case"strike":G.blasts.push({id:a.id,own:f,mv,x:px,y:py,t:mv.delay,full:mv.delay,ox:a.x,oy:a.y-14});if(mv.lob)SFX.play("dash",type);break;
    case"zone":G.blasts.push({id:a.id,own:f,mv,x:px,y:py,t:mv.delay,full:mv.delay||.01});break;
    case"rain":for(let k=0;k<mv.num;k++){const an=R()*6.283,rr=Math.sqrt(R())*mv.rad;G.blasts.push({id:a.id+":"+k,own:f,mv:MOVES.meteor,x:clamp(px+Math.cos(an)*rr,FR,W-FR),y:clamp(py+Math.sin(an)*rr,FR,H-FR),t:.45+k*.2,full:.5,fall:1,zone:k%2===0})}break;
    case"trap":{const mine=G.traps.filter(t=>t.own===f);if(mine.length>=3)mine[0].t=0;G.traps.push({id:a.id,own:f,mv,x:px,y:py,arm:.6,t:18});part(px,py,"#6fd06a",8,80,.4);break}
    case"wall":for(const k of [-1,0,1])G.twalls.push({id:a.id+":"+k,own:f,x:clamp(px-a.dy*k*29,FR+10,W-FR-10),y:clamp(py+a.dx*k*29,FR+16,H-FR-6),r:15,hp:4,t:mv.dur,born:G.t});SFX.play("boom");G.shake=Math.min(10,G.shake+3);break;
    case"orbit":G.orbits.push({id:a.id,own:f,mv,t:mv.dur,a:0,hc:0,n:0,et:0});SFX.play("buff");break;
    case"blink":FX.boom(a.x,a.y-12,type,26);FX.boom(px,py-12,type,30);G.blasts.push({id:a.id,own:f,mv:MOVES.blinkout,x:a.x,y:a.y,t:.3,full:.3});if(f.owned){f.x=px;f.y=py;f.ifr=Math.max(f.ifr,.2);collide(f)}else{f.x=px;f.y=py}SFX.play("zap");break;
    case"dig":if(f.owned)f.under=.95;crater(a.x,a.y,26,1);part(a.x,a.y,"#8a5a2a",12,120,.5);break;
    case"buff":if(f.owned){if(mv.buff==="guard")f.guard=1.6;else if(mv.buff==="haste")f.haste=4;else if(mv.buff==="shield"){f.shield=32;f.shieldT=5}else if(mv.buff==="armor")f.guard=3;else if(mv.buff==="cloak"){f.cloak=3.5;f.haste=Math.max(f.haste,3.5)}else f.rest=1}if(mv.buff==="cloak")f.reveal=0;part(f.x,f.y-12,TY[type].c,10,80,.5);SFX.play("buff");break;
    case"leap":if(f.owned){f.air=f.airT=.5;f.jx=(a.tx-a.x)/.5;f.jy=(a.ty-a.y)/.5;f.land="leapland"}part(a.x,a.y,"#fff",8,90,.3);SFX.play("dash");break;
    case"ring":G.rings.push({id:a.id,own:f,mv,x:a.x,y:a.y,r:10,max:mv.max,sp:250,done:false});SFX.play("beam",type);break;
    case"beam":{const p=clamp(a.p||0,0,1);G.beams.push({id:a.id,own:f,mv,x:a.x,y:a.y-12,dx:a.dx,dy:a.dy,p,wd:8+14*p,sc:.4+.6*p,w:0,t:.26,done:false,len:rayLen(a.x,a.y,a.dx,a.dy,1200)});SFX.play("beam",type);break}
    case"clone":if(f.owned){for(const s of [-1,1])f.minions.push({id:a.id+":"+s,x:clamp(a.x-a.dy*s*30,FR,W-FR),y:clamp(a.y+a.dx*s*30,FR+10,H-FR),hp:22,t:10,hc:.6,wk:0})}part(a.x,a.y-12,"#fff",16,140,.5);SFX.play("buff");break;
    default:if(ULT[mv.kind])startUlt(f,a,mv);
  }}
function record(f,m,aim,p){const mv=MOVES[m];aim=aim||{ax:f.ax,ay:f.ay,mag:.7};const rng=mv.rng||160,mg=mv.aim==="point"?Math.max(.12,aim.mag==null?.7:aim.mag):1;
  const a={id:f.tag+(++f.seq),m,x:Math.round(f.x),y:Math.round(f.y),dx:+aim.ax.toFixed(3),dy:+aim.ay.toFixed(3),p:p||0,tx:Math.round(clamp(f.x+aim.ax*rng*mg,FR+8,W-FR-8)),ty:Math.round(clamp(f.y+aim.ay*rng*mg,FR+18,H-FR))};
  if(mv.aim!=="self"){f.ax=aim.ax;f.ay=aim.ay;f.faceT=.4}
  if(mv.drain)G.myDrain.set(a.id,mv);f.atks.push(a);if(f.atks.length>8)f.atks.shift();spawnAttack(f,a);return a}
function collide(f){f.x=clamp(f.x,FR+8,W-FR-8);f.y=clamp(f.y,FR+18,H-FR);if(f.air>0)return;
  for(const w of G.A.walls){const nx=clamp(f.x,w.x,w.x+w.w),ny=clamp(f.y,w.y,w.y+w.h);let dx=f.x-nx,dy=f.y-ny;const d=Math.hypot(dx,dy),r=11;
    if(d<r){if(d<.01){const cx=w.x+w.w/2,cy=w.y+w.h/2;if(Math.abs(f.x-cx)/w.w>Math.abs(f.y-cy)/w.h)f.x=f.x<cx?w.x-r:w.x+w.w+r;else f.y=f.y<cy?w.y-r:w.y+w.h+r}else{f.x+=dx/d*(r-d);f.y+=dy/d*(r-d)}}}
  if(f.under>0)return;
  const push=(px,py,pr)=>{let dx=f.x-px,dy=f.y-py;const d=Math.hypot(dx,dy),r=pr+9;if(d<r){if(d<.01){dx=1;dy=0}f.x+=dx/(d||1)*(r-d);f.y+=dy/(d||1)*(r-d)}};
  for(const p of G.A.props)if(!p.dead&&p.r)push(p.x,p.y,p.r);for(const w of G.twalls)push(w.x,w.y,w.r)}
function tick(f,dt){for(const k of ["stun","stunImm","slow","guard","haste","roll","ifr","root","dodgeCd","flash","reveal","cdB","cast","faceT","padCd","shieldT","cloak","inv","busy","bub"])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
  for(let i=0;i<3;i++)if(f.cds[i]>0)f.cds[i]=Math.max(0,f.cds[i]-dt);if(f.shieldT<=0)f.shield=0}
function envOwned(f,dt){const A=G.A,gr=f.air<=0&&f.under<=0;if(!gr)return{mul:1,ice:false};let mul=1,ice=false;
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
  if(f.hp<=0){f.dash=null;f.chg=null;f.minions.length=0;return}
  const act=G.cd<=0&&!G.over;if(act)f.ult=Math.min(100,f.ult+dt*1.6);
  const env=envOwned(f,dt);
  if(f.burn>0){f.burn-=dt;f.burnTick-=dt;if(f.burnTick<=0){f.burnTick=.5;f.hp=Math.max(0,f.hp-2);f.reveal=1;pop(f.x+rnd(-6,6),f.y-36,"-2","#ff9a4a");f.hits.push(["b"+f.seq+G.t.toFixed(1),2,1]);if(f.hits.length>8)f.hits.shift()}}
  if(f.rest>0){f.rest-=dt;if(f.rest<=0){f.hp=Math.min(f.max,f.hp+26);pop(f.x,f.y-40,"+26","#7dffa0")}}
  if(f.under>0){f.under-=dt;if(f.under<=0){f.under=0;record(f,"digout");f.ifr=Math.max(f.ifr,.1)}}
  let vx=0,vy=0,um=null;const sp=(giant(f)?.9:1)*f.mon.spd*(f.slow>0?.55:1)*(f.haste>0?1.5:1)*(f.under>0?1.3:1)*(f.chg?.45:1)*(f.cast>0?.5:1)*env.mul;
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
  const can=free&&f.busy<=0&&!f.dash&&f.roll<=0&&f.under<=0&&f.air<=0&&!f.hk;
  if(f.chg){const s=inp.sk[f.chg.i];f.chg.t+=dt;f.reveal=.3;if(s.aim){f.ax=s.aim.ax;f.ay=s.aim.ay;f.chg.aim=s.aim}
    const rel=inp.rel.find(r=>r.i===f.chg.i);
    if(f.stun>0)f.chg=null;else if(rel||!s.held||f.chg.t>1.7){const t=f.chg.t,i=f.chg.i,aim=(rel&&rel.aim)||f.chg.aim||{ax:f.ax,ay:f.ay,mag:1};f.chg=null;if(t>=.18){f.cds[i]=MOVES[f.moves[i]].cd;record(f,f.moves[i],aim,clamp((t-.18)/.9,0,1))}}return}
  if(!can)return;
  const ur=inp.rel.find(r=>r.i==="u");
  if(ur&&f.ult>=100){f.ult=0;f.ifr=Math.max(f.ifr,1.1);record(f,f.mon.ult,ur.aim);return}
  if(inp.dodge&&f.dodgeCd<=0){let dx=inp.mx,dy=inp.my;if(Math.hypot(dx,dy)<.2){dx=f.ax;dy=f.ay}const l=Math.hypot(dx,dy)||1;f.rdx=dx/l;f.rdy=dy/l;f.roll=.28;f.ifr=.34;f.dodgeCd=2.2;part(f.x,f.y,"#fff",5,60,.3);SFX.play("dash","wind");return}
  for(let i=0;i<3;i++){const mv=MOVES[f.moves[i]];if(f.cds[i]>0)continue;
    if(mv.kind==="beam"){if(inp.sk[i].held){f.chg={i,t:0,aim:inp.sk[i].aim};return}continue}
    const r=inp.rel.find(q=>q.i===i);if(r){f.cds[i]=mv.cd;record(f,f.moves[i],r.aim);return}}
  if(inp.basic&&f.cdB<=0){const bk=giant(f)?"b_giant":f.mon.basic,mv=MOVES[bk];f.cdB=mv.cd;record(f,bk,inp.basic)}}
function updMinions(f,dt){const o=other(f);for(let i=f.minions.length-1;i>=0;i--){const m=f.minions[i];m.t-=dt;m.wk+=dt*8;if(m.hp<=0||m.t<=0){if(m.k===1){FX.boom(m.x,m.y-12,"shadow",30);SFX.play("zap")}else part(m.x,m.y-8,"#fff",8,90,.3);f.minions.splice(i,1);continue}
    if(m.k===1){phantomAI(f,o,m,dt);continue}
    if(G.cd>0)continue;const hid=!seenBy(o,m);let dx=(hid?f.x:o.x)-m.x,dy=(hid?f.y:o.y)-m.y;const d=Math.hypot(dx,dy)||1;
    if(d>18){m.x+=dx/d*128*dt;m.y+=dy/d*128*dt}for(const p of G.A.props){if(p.dead||!p.r)continue;const ex=m.x-p.x,ey=m.y-p.y,e=Math.hypot(ex,ey)||1;if(e<p.r+7){m.x+=ex/e*(p.r+7-e);m.y+=ey/e*(p.r+7-e)}}
    const w=wallAt(m.x,m.y,6);if(w){const cx=w.x+w.w/2,cy=w.y+w.h/2;if(Math.abs(m.x-cx)/w.w>Math.abs(m.y-cy)/w.h)m.x=m.x<cx?w.x-7:w.x+w.w+7;else m.y=m.y<cy?w.y-7:w.y+w.h+7}}}
function minionContact(a,dt){const v=other(a);for(const m of a.minions){if(m.hc>0){m.hc-=dt;continue}
    if(m.k===1){if(m.ds===1&&v.owned&&vuln(v)&&v.ifr<=0&&Math.hypot(m.x-v.x,m.y-v.y)<28){m.hc=.5;m.n=(m.n||0)+1;applyHit(v,a,MOVES.phclone,m.id+":c"+m.n+"_"+((G.t*10)|0),[Math.cos(m.an),Math.sin(m.an)])}continue}
    if(v.owned&&vuln(v)&&v.ifr<=0&&Math.hypot(m.x-v.x,m.y-v.y)<24){m.hc=.8;m.n=(m.n||0)+1;applyHit(v,a,MOVES.clone,m.id+":c"+m.n+"_"+((G.t*10)|0),null)}}}
function hurtMinions(att,test,pw,key){if(att.env)return false;const o=other(att);let any=false;for(const m of o.minions){if(m.hp<=0||!test(m.x,m.y-8))continue;any=true;m.hs=m.hs||new Set();if(m.hs.has(key))continue;m.hs.add(key);part(m.x,m.y-8,"#fff",4,70,.25);if(o.owned)m.hp-=pw}return any}
const segDist=(px,py,x,y,dx,dy,len)=>{const t=(px-x)*dx+(py-y)*dy;return t<0||t>(len||1e9)?1e9:Math.abs((px-x)*dy-(py-y)*dx)};
/* --- bot: same inputs as a player --- */
function botInput(f,dt){const o=G.me,b=f.ai,A=G.A;const seen=seenBy(o,f);if(seen){b.lx=o.x;b.ly=o.y}
  let dx=b.lx-f.x,dy=b.ly-f.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const basic=MOVES[f.mon.basic],melee=basic.kind==="melee";
  b.st-=dt;if(b.st<=0){b.s=Math.random()<.5?-1:1;b.st=rnd(.8,2)}
  const want=o.under>0?250:!seen?30:melee?46:190;const fw=d>want+26?1:d<want-46?-1:0;let mx=dx*fw-dy*b.s*(melee?.35:.8),my=dy*fw+dx*b.s*(melee?.35:.8);
  const push=(x,y,r,k)=>{const ex=f.x-x,ey=f.y-y,e=Math.hypot(ex,ey)||1;if(e<r){mx+=ex/e*k*(1-e/r+.3);my+=ey/e*k*(1-e/r+.3)}};
  for(const z of G.zones)if(z.own!==f&&z.mv.pw>0)push(z.x,z.y,z.mv.rad+22,2);for(const bl of G.blasts)if(bl.own!==f)push(bl.x,bl.y,bl.mv.rad+24,2.4);for(const t of G.traps)if(t.own!==f)push(t.x,t.y,46,2);
  for(const l of A.lava)if(l.cool<=0&&!f.mon.t.includes("fire"))push(l.x,l.y,l.rx+26,2.6);for(const l of A.bog)if(!f.mon.t.includes("grass"))push(l.x,l.y,l.rx+18,1.6);for(const l of A.sand)push(l.x,l.y,l.rx+14,1.8);
  for(const p of A.props)if(!p.dead&&p.r)push(p.x,p.y,p.r+(p.k==="cactus"?30:22),p.k==="cactus"?2:1.2);for(const w of G.twalls)push(w.x,w.y,w.r+22,1.4);
  for(const w of A.walls){const nx=clamp(f.x,w.x,w.x+w.w),ny=clamp(f.y,w.y,w.y+w.h);if(Math.hypot(f.x-nx,f.y-ny)<26){push(nx,ny,26,2);mx+=-dy*b.s*.9;my+=dx*b.s*.9}}
  if(!f.mon.t.includes("water"))for(const w of A.water)if(!w.e&&f.x>w.x-26&&f.x<w.x+w.w+26){const br=A.bridges.reduce((m,r)=>Math.abs(r.y+r.h/2-f.y)<Math.abs(m.y+m.h/2-f.y)?r:m,A.bridges[0]);if(br&&Math.abs(br.y+br.h/2-f.y)>14)my+=Math.sign(br.y+br.h/2-f.y)*1.6}
  if(A.spring&&f.hp<f.max*.45)push(A.spring.x,A.spring.y,600,-1.2);
  if(f.U&&f.U.k==="u_shell"){mx=dx;my=dy}
  const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
  const er=rnd(-.14,.14),ca=Math.cos(er),sa=Math.sin(er),aim=(rng)=>({ax:dx*ca-dy*sa,ay:dx*sa+dy*ca,mag:clamp(d/(rng||200),0,1)});
  const sk=[0,1,2].map(()=>({held:false,aim:null})),rel=[];let bas=null;
  if(G.cd<=0&&o.under<=0){
    if(seen&&(melee?d<basic.rng+18:d<300)&&b.hold==null)bas=aim();
    if(b.hold){b.hold.t-=dt;const i=b.hold.i;sk[i].aim=aim();if(b.hold.t>0)sk[i].held=true;else{rel.push({i,aim:aim()});b.hold=null}}
    else{b.t-=dt;if(b.t<=0&&(seen||Math.random()<.2)){b.t=rnd(.55,1.25);
      if(f.ult>=100&&seen&&d<340)rel.push({i:"u",aim:aim(MOVES[f.mon.ult].rng)});
      else{const av=[];for(let i=0;i<3;i++){const m=MOVES[f.moves[i]];if(f.cds[i]>0)continue;
          if(m.buff==="rest"&&f.hp>f.max*.55)continue;if(m.heal&&f.hp>f.max*.7)continue;if(m.buff==="shield"&&f.shield>0)continue;if(m.kind==="slam"&&d>m.rad+10)continue;if(m.kind==="ring"&&d>m.max)continue;if(m.kind==="orbit"&&d>170)continue;
          if(m.kind==="dash"&&d>230)continue;if((m.kind==="breath")&&d>m.rng+10)continue;if(m.aim==="point"&&m.kind!=="wall"&&m.kind!=="blink"&&d>(m.rng||200)+30)continue;if(m.kind==="leap"&&d<90)continue;if(m.kind==="blink"&&d<160&&f.hp>f.max*.4)continue;av.push(i)}
        if(av.length){const i=av[(Math.random()*av.length)|0],m=MOVES[f.moves[i]];if(m.kind==="beam"){b.hold={i,t:rnd(.5,1)};sk[i].held=true;sk[i].aim=aim()}
          else if(m.kind==="blink"&&f.hp<=f.max*.4)rel.push({i,aim:{ax:-dx,ay:-dy,mag:1}});else if(m.kind==="wall")rel.push({i,aim:{ax:dx,ay:dy,mag:.5}});else rel.push({i,aim:aim(m.rng)})}}}}}
  let dodge=0;for(const s of G.shots)if(s.own!==f&&s.w<=0){const ex=f.x-s.x,ey=f.y-s.y,dd=Math.hypot(ex,ey);if(dd<80&&(ex*s.vx+ey*s.vy)>0&&Math.random()<dt*3)dodge=1}
  for(const r of G.rings)if(r.own!==f&&Math.abs(Math.hypot(f.x-r.x,f.y-r.y)-r.r)<26&&Math.random()<dt*14)dodge=1;
  return{mx,my,face:seen?aim():null,basic:bas,sk,rel,dodge}}
function updPuppet(f,dt){tick(f,dt);const k=Math.min(1,dt*16);const px=f.x,py=f.y;f.x+=(f.tx-f.x)*k;f.y+=(f.ty-f.y)*k;f.moving=Math.abs(f.x-px)+Math.abs(f.y-py)>.3;
  for(const t of ["burn","rest","under","air"])if(f[t]>0)f[t]-=dt;f.chgF=Math.max(0,f.chgF-dt);if(f.dash){f.dash.t-=dt;if(f.dash.t<=0)f.dash=null}
  for(const m of f.minions){m.x+=(m.tx-m.x)*k;m.y+=(m.ty-m.y)*k;m.wk+=dt*8}}
function updWorld(dt){const A=G.A;
  for(const pair of [[G.me,G.op],[G.op,G.me]]){const a=pair[0],v=pair[1];minionContact(a,dt);
    if(a.dash){const mv=a.dash.mv,hr=mv.hr||30;touchEnv(a.x,a.y,hr*.5,a,mv,a.dash.id);hurtMinions(a,(x,y)=>Math.hypot(a.x-x,a.y-12-y)<hr,mv.pw,a.dash.id);
      if(vuln(v)&&Math.hypot(a.x-v.x,a.y-v.y)<hr){if(v.owned){if(v.ifr<=0){if(applyHit(v,a,mv,a.dash.id,[a.dash.dx||a.ax,a.dash.dy||0])&&a.owned&&!mv.ult)a.dash.t=Math.min(a.dash.t,.05)}}else if(a.owned&&!mv.ult)a.dash.t=Math.min(a.dash.t,.08)}}}
  for(let i=G.shots.length-1;i>=0;i--){const s=G.shots[i];if(s.w>0){s.w-=dt;continue}const mv=s.mv,type=mvT(mv,s.own),v=other(s.own);s.bt+=dt;
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
    if(dead){if(s.fb)FX.boom(s.x,s.y,s.blue?"blue":"fire",10+s.sc*9);G.shots.splice(i,1)}}
  for(let i=G.blasts.length-1;i>=0;i--){const b=G.blasts[i];b.t-=dt;if(b.t>0)continue;G.blasts.splice(i,1);const mv=b.mv,type=mvT(mv,b.own);
    if(mv.kind==="zone"){G.zones.push({id:b.id,own:b.own,mv,x:b.x,y:b.y,t:mv.dur,tk:0,n:0,pull:mv.pull||0});FX.boom(b.x,b.y,type,mv.rad*.6);if(mv.pw>0)touchEnv(b.x,b.y,mv.rad,b.own,mv,b.id);continue}
    FX.boom(b.x,b.y,type,mv.rad);if(b.big)FX.mega(b.x,b.y,type,mv.rad);SFX.play("boom");G.shake=Math.min(10,G.shake+3);if(mv.crater)crater(b.x,b.y,mv.rad*.8,mv.crater===2);
    touchEnv(b.x,b.y,mv.rad,b.own,mv,b.id);hurtMinions(b.own,(x,y)=>Math.hypot(b.x-x,b.y-y)<mv.rad+8,mv.pw,b.id);
    if(b.zone)G.zones.push({id:b.id+"z",own:b.own,mv:MOVES.trailz,x:b.x,y:b.y,t:3,tk:.4,n:0,pull:0});
    for(const v of victimsOf(b.own))if(vuln(v)&&v.ifr<=0){const dx=v.x-b.x,dy=v.y-b.y,d=Math.hypot(dx,dy);if(d<mv.rad+10)applyHit(v,b.own,mv,b.id,d>1?[dx/d,dy/d]:[1,0])}}
  for(let i=G.zones.length-1;i>=0;i--){const z=G.zones[i];z.t-=dt;z.tk-=dt;if(z.t<=0){G.zones.splice(i,1);continue}const type=mvT(z.mv,z.own);
    if(z.vx||z.vy){z.x=clamp(z.x+z.vx*dt,40,W-40);z.y=clamp(z.y+z.vy*dt,40,H-40)}
    if(z.pull)for(const v of victimsOf(z.own))if(vuln(v)){const dx=z.x-v.x,dy=z.y-v.y,d=Math.hypot(dx,dy);if(d<z.mv.rad*1.7&&d>6){v.x+=dx/d*z.pull*dt;v.y+=dy/d*z.pull*dt}}
    if(z.tk<=0){z.tk=z.pull?.4:.5;z.n++;if(type==="fire")touchEnv(z.x,z.y,z.mv.rad*.8,z.own,z.mv,z.id);
      if(z.mv.heal){const o=z.own;if(o.owned&&o.hp>0&&o.hp<o.max&&Math.hypot(o.x-z.x,o.y-z.y)<z.mv.rad){o.hp=Math.min(o.max,o.hp+z.mv.heal);pop(o.x+rnd(-8,8),o.y-40,"+"+z.mv.heal,"#7dffa0")}continue}
      hurtMinions(z.own,(x,y)=>Math.hypot(z.x-x,z.y-y)<z.mv.rad,z.mv.pw,z.id+z.n);
      for(const v of victimsOf(z.own))if(vuln(v)&&v.ifr<=0&&Math.hypot(v.x-z.x,v.y-z.y)<z.mv.rad+6)applyHit(v,z.own,z.mv,z.id+":z"+z.n,null)}}
  for(let i=G.rings.length-1;i>=0;i--){const r=G.rings[i];if(r.w>0){r.w-=dt;continue}r.r+=r.sp*dt;if(r.r>r.max){G.rings.splice(i,1);continue}const type=mvT(r.mv,r.own);
    for(const p of A.props)if(!p.dead&&Math.abs(Math.hypot(p.x-r.x,p.y-r.y)-r.r)<12)hurtProp(p,r.own,r.mv,type);
    if(type!=="earth"&&type!=="wind"&&type!=="grass")for(let k=0;k<8;k++){const a=k*.785;touchEnvLite(r.x+Math.cos(a)*r.r,r.y+Math.sin(a)*r.r,type,r.id)}
    hurtMinions(r.own,(x,y)=>Math.abs(Math.hypot(x-r.x,y+8-r.y)-r.r)<14,r.mv.pw,r.id);
    const v=other(r.own);if(!r.done&&vuln(v)){const dx=v.x-r.x,dy=v.y-r.y,d=Math.hypot(dx,dy);if(Math.abs(d-r.r)<15){if(v.owned){r.done=true;if(v.ifr<=0)applyHit(v,r.own,r.mv,r.id,d>1?[dx/d,dy/d]:[1,0])}else if(v.roll<=0)r.done=true}}}
  for(let i=G.beams.length-1;i>=0;i--){const b=G.beams[i];if(b.w>0){b.w-=dt;continue}const type=mvT(b.mv,b.own);
    if(!b.done){b.done=true;G.shake=Math.min(10,G.shake+(b.big?5:3));
      for(let s=20;s<b.len;s+=18){const x=b.x+b.dx*s,y=b.y+12+b.dy*s;touchEnvLite(x,y,type,b.id);for(const p of A.props)if(!p.dead&&Math.hypot(p.x-x,p.y-y)<b.wd+(p.r||p.R*.5))hurtProp(p,b.own,b.mv,type);for(const w of G.twalls)if(Math.hypot(w.x-x,w.y-y)<b.wd+w.r)hurtTwall(w,b.mv)}
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
    if(t.arm<=0&&v.owned&&vuln(v)&&v.roll<=0&&Math.hypot(v.x-t.x,v.y-t.y)<24){applyHit(v,t.own,MOVES.trapgo,t.id,null);FX.boom(t.x,t.y,"grass",t.mv.rad);SFX.play("boom");G.traps.splice(i,1)}}
  for(let i=G.twalls.length-1;i>=0;i--){const w=G.twalls[i];w.t-=dt;if(w.t<=0){part(w.x,w.y-8,"#8a6a4a",12,120,.4);G.twalls.splice(i,1)}}
  for(const l of A.lava)if(l.cool>0)l.cool-=dt;if(G.zapT>0)G.zapT-=dt;if(G.dark>0)G.dark-=dt;
  if(G.shake>0)G.shake=Math.max(0,G.shake-dt*24)}

/* ---- net sync (presence only: absolute state + short lists of recent attacks, hits, minions, destroyed props) ---- */
function flagsOf(f){return(f.stun>0?1:0)|(f.slow>0?2:0)|(f.burn>0?4:0)|(f.guard>0?8:0)|(f.haste>0?16:0)|(f.rest>0?32:0)|(f.under>0?64:0)|(f.roll>0?128:0)|(f.dash?256:0)|(f.air>0?512:0)|(f.chg?1024:0)|(f.cloak>0?2048:0)|(f.inv>0?4096:0)|(f.bub>0?8192:0)}
function netSend(dt){G.sendT-=dt;if(G.sendT>0||!NR)return;G.sendT=.05;const f=G.me;
  NR.presence({g:[Math.round(f.x),Math.round(f.y),f.hp,flagsOf(f),f.dash?f.dash.id:0,f.dash?Object.keys(MOVES).find(k=>MOVES[k]===f.dash.mv)||0:0,+Math.atan2(f.ay,f.ax).toFixed(2),Math.round(f.ult),Math.round(f.shield)],
    a:f.atks.map(a=>[a.id,a.m,a.x,a.y,a.dx,a.dy,+(a.p||0).toFixed(2),a.tx,a.ty]),h:f.hits,mn:f.minions.map(m=>[m.id,Math.round(m.x),Math.round(m.y),Math.round(m.hp),m.k||0,m.ds||0,+(m.an||0).toFixed(2),m.mx||22]),xb:G.myKills}).catch(()=>{})}
function netRecv(dt){const f=G.op;const p=NR?NR.peers().find(x=>x.peer===G.opPeer):null;
  if(!p){G.gone+=dt;if(G.gone>4&&!G.over)endGame("win","คู่ต่อสู้ออกจากห้อง");return}G.gone=0;const q=p.presence||{};
  const g=q.g;if(Array.isArray(g)){f.tx=clamp(Number(g[0])||0,0,W);f.ty=clamp(Number(g[1])||0,0,H);const hp=clamp(Number(g[2])||0,0,f.max);if(G.cd<=0||hp<f.hp)f.hp=hp;const fl=Number(g[3])|0;
    const an=Number(g[6])||0;f.ax=Math.cos(an);f.ay=Math.sin(an);f.ult=clamp(Number(g[7])||0,0,100);f.shield=clamp(Number(g[8])||0,0,99);f.shieldT=f.shield>0?1:0;
    f.stun=fl&1?.15:0;f.slow=fl&2?.15:0;f.burn=fl&4?.15:0;f.guard=fl&8?.15:0;f.haste=fl&16?.15:0;f.rest=fl&32?.15:0;f.under=fl&64?.15:0;f.roll=fl&128?.15:0;
    if(fl&512){if(f.air<=0)f.airT=.6;f.air=.15}else f.air=0;f.chgF=fl&1024?.15:0;f.cloak=fl&2048?.15:0;f.inv=fl&4096?.15:0;f.bub=fl&8192?.15:0;if(fl&1024)f.reveal=.3;
    if(fl&256){const mv=MOVES[g[5]];if(mv&&(mv.kind==="dash"||mv.udash))f.dash={t:.15,dx:f.ax,dy:f.ay,mv,id:String(g[4])}}else if(f.dash)f.dash=null}
  if(Array.isArray(q.a))for(const r of q.a){if(!Array.isArray(r))continue;const id=String(r[0]);if(G.seenA.has(id))continue;G.seenA.add(id);
    const mv=MOVES[r[1]];if(!mv||G.cd>0)continue;const n=i=>Number(r[i])||0;let dx=clamp(n(4),-1,1),dy=clamp(n(5),-1,1);const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const a={id,m:r[1],x:clamp(n(2),0,W),y:clamp(n(3),0,H),dx,dy,p:clamp(n(6),0,1),tx:clamp(n(7),0,W),ty:clamp(n(8),0,H)};
    if(mv.kind==="dash"){f.reveal=1.2;part(f.x,f.y,TY[mvT(mv,f)].c,6,90,.3);SFX.play("dash");continue}spawnAttack(f,a)}
  if(Array.isArray(q.h))for(const r of q.h){if(!Array.isArray(r))continue;const key=String(r[0]);if(G.seenH.has(key))continue;G.seenH.add(key);if(G.cd>0)continue;
    const d=clamp(Number(r[1])||0,0,150),e=r[2]===2?1.5:r[2]===0?.6:1;hitFx(f,d,e,"");FX.hit(f.x,f.y-12,"norm");if(!/^(b|env)/.test(key)&&!/:riv$/.test(key)&&key.indexOf("~")<0)G.me.ult=Math.min(100,G.me.ult+d*1.1);
    const ti=G.traps.findIndex(t=>t.id===key);if(ti>=0){const t=G.traps[ti];FX.boom(t.x,t.y,"grass",t.mv.rad);G.traps.splice(ti,1)}
    const dm=G.myDrain.get(key.split(":")[0]);if(dm&&G.me.hp>0){const h=Math.round(d*dm.drain);G.me.hp=Math.min(G.me.max,G.me.hp+h);pop(G.me.x,G.me.y-40,"+"+h,"#7dffa0")}}
  if(Array.isArray(q.mn)){const old=new Map(f.minions.map(m=>[m.id,m]));f.minions=q.mn.slice(0,6).filter(Array.isArray).map(r=>{const id=String(r[0]),x=clamp(Number(r[1])||0,0,W),y=clamp(Number(r[2])||0,0,H);const m=old.get(id)||{id,x,y,hc:.6,wk:0,t:9};m.tx=x;m.ty=y;m.hp=Number(r[3])||0;m.k=Number(r[4])||0;m.ds=Number(r[5])||0;m.an=Number(r[6])||0;m.mx=Number(r[7])||22;return m})}
  if(Array.isArray(q.xb))for(const i of q.xb){const pr=G.A.props[i|0];if(pr&&!pr.dead)killProp(pr,false)}
  if(!G.over){const meKo=G.me.hp<=0,opKo=!!q.ko||(G.cd<=0&&f.hp<=0);if(meKo&&opKo)endGame("draw","หมดพลังพร้อมกัน");else if(meKo)endGame("lose");else if(opKo)endGame("win")}}
const IDLE={mx:0,my:0,face:null,basic:null,sk:[{held:false},{held:false},{held:false}],rel:[],dodge:0};
function update(dt){G.t+=dt;
  if(G.cut||G.stop>0){if(G.cut){G.cut.t-=dt;if(G.cut.t<=0){const c=G.cut;G.cut=null;c.a.cut=true;spawnAttack(c.f,c.a)}}else G.stop-=dt;
    if(G.mode==="net"){netRecv(dt);if(G)netSend(dt)}return}
  if(G.cd>0)G.cd-=dt;
  updOwned(G.me,myInput(),dt);
  if(G.mode==="bot")updOwned(G.op,G.cd>0?IDLE:botInput(G.op,dt),dt);else updPuppet(G.op,dt);
  updUlts(dt);updWorld(dt);for(const f of [G.me,G.op])if(f.moving)f.walk+=dt*7;
  if(G.mode==="net"){netRecv(dt);if(G)netSend(dt)}else if(!G.over){if(G.me.hp<=0)endGame("lose");else if(G.op.hp<=0)endGame("win")}}

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
$("bStart").onclick=()=>{SFX.init();SFX.play("ui");$("bStart").hidden=true;$("nameBox").hidden=false;try{$("nick").focus()}catch(e){}};
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
  norm:["#ffffff","#f4f0ff","#d8d2ea","#b0a8c8","#8880a0","#5a5470","#34304a"]};
const PALH={};for(const k in PAL)PALH[k]=PAL[k].map(hex);
const pick=a=>a[(Math.random()*a.length)|0];
let BGD=false,PG=null,SCN=null;const CUR={vx:0,vy:0,life:300,tint:0xffffff,rot:0},EM={};
const D={GFX:10,ENT:100,CAN:640,AIR:700,TXT:900,UI:1000};
const hsh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967296};
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
    case"blue":emit(i%3?"soft":"sq",x,y,vx,vy-40,rnd(.25,.5),pick(P.slice(0,4)));break;
    default:emit("sq",x,y,vx,vy,rnd(.2,.4),0xffffff)}}}
const ADDT={fire:1,elec:1,grass:1,wind:1,norm:1};
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
function makeUltTex(s){const F=PAL.fire,Bl=PAL.blue,Wt=["#ffffff","#ffffff","#fffbe0","#fff0a0","#ffd86a","#ffb040","#d06a20"];
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
/* extra sprites for the new arenas and moves */
Object.assign(PROP,{
  cactus:pix(16,24,g=>{const A="#3a9a4a",B="#5cc86a",D="#256e34";g.R(6,3,5,19,A);g.R(6,3,2,19,B);g.R(1,9,4,3,A);g.R(1,6,3,4,A);g.R(12,12,3,3,A);g.R(13,8,3,5,A);g.P(8,1,"#ff9ab0");g.P(9,2,"#ff9ab0");g.P(7,2,"#ff9ab0");for(const[x,y]of[[5,6],[11,9],[5,14],[11,17],[0,7],[15,9]])g.P(x,y,"#f4f0d8");g.R(9,5,1,16,D)}).c,
  icep:pix(18,26,g=>{const A="#bfeaff",B="#eaf8ff",D="#7fbfe8";g.L(9,1,3,10,A);g.L(9,1,15,10,A);for(let y=2;y<22;y++){const w=y<10?(y-1)*.7:6;g.R(Math.round(9-w),y,Math.round(w*2),1,A)}g.R(5,6,2,14,B);g.R(11,5,2,16,D);g.P(8,3,"#fff");g.P(7,8,"#fff");g.E(9,22,6,2,D)}).c,
  twall:pix(18,26,g=>{const A="#9a8468",B="#b8a280",D="#6a5844";g.R(2,4,14,20,A);g.R(2,4,14,3,B);g.R(2,4,2,20,B);g.R(13,6,3,18,D);g.L(2,11,15,11,D);g.L(2,18,15,18,D);g.L(8,4,8,11,D);g.L(11,11,11,18,D);g.L(6,18,6,24,D);g.P(5,2,A);g.P(9,1,A);g.P(12,2,A);g.R(4,2,3,2,A);g.R(10,2,4,2,A)}).c,
  trap:pix(18,14,g=>{const A="#3fa34d",B="#a8f06a",D="#226e30";g.E(9,8,7,4,D);g.E(9,7,5,3,A);g.E(9,6,2,1,B);for(const[x,y]of[[2,5],[5,2],[9,1],[13,2],[16,5]])g.P(x,y,"#ffe04a");g.P(3,9,"#ff9ab0");g.P(15,9,"#ff9ab0")}).c
});
const VIEW={ready:false,fx:[],keep:new Set(),t:0,camX:0,camY:0,
  reset(){if(!this.ready||!G)return;const s=SCN,A=G.A;s.tweens.killAll();for(const o of s.children.list.slice())if(!this.keep.has(o))o.destroy();
    this.fx=[];this.st={shots:new Map(),zones:new Map(),waves:new Map(),met:new Map(),lob:new Map(),traps:new Map(),orb:new Map(),tw:new Map(),ults:new Map()};this.cutO=null;this.bgTex.refresh();BGD=false;
    this.camX=clamp(G.me.x-VW/2,0,W-VW);this.camY=clamp(G.me.y-VH/2,0,H-VH);
    for(const p of A.props){const v=p.v={};
      if(p.k==="tree"){v.a=s.add.image(p.x,p.y+4,"p_trunk").setOrigin(.5,1).setScale(2).setDepth(D.ENT+p.y);v.c=s.add.image(p.x,p.y-44,"p_canopy").setScale(2).setDepth(D.CAN);v.s=s.add.image(p.x,p.y-2,"p_stump").setScale(2).setDepth(D.ENT+p.y-20).setVisible(false)}
      else if(p.k==="bush")v.a=s.add.image(p.x,p.y-4,"p_bush").setScale(2).setDepth(D.ENT+p.y+8);
      else{v.sh=s.add.image(p.x,p.y+3,"shadow").setScale((p.r+4)/16,.9).setDepth(D.ENT+p.y-1);v.a=s.add.image(p.x,p.y+8,"p_"+p.k).setOrigin(.5,1).setScale(2).setDepth(D.ENT+p.y)}}
    for(const w of A.walls){const g=s.add.graphics().setDepth(D.ENT+w.y+w.h);g.fillStyle(0,.28).fillRect(w.x+3,w.y+w.h-2,w.w,7);g.fillStyle(0x4a4648,1).fillRect(w.x,w.y-2,w.w,w.h+2);g.fillStyle(0x6f6a70,1).fillRect(w.x,w.y-16,w.w,w.h+2);g.fillStyle(0x8f8a92,1).fillRect(w.x,w.y-16,w.w,3).fillRect(w.x,w.y-16,3,w.h+2);
      g.fillStyle(0x56525a,1);for(let x=w.x+14;x<w.x+w.w-4;x+=16)g.fillRect(x,w.y-13,1,w.h-2);for(let y=w.y-4;y<w.y+w.h-18;y+=14)g.fillRect(w.x+3,y,w.w-6,1);g.fillStyle(0x4cae52,1);for(let i=0;i<w.w*w.h/260;i++)g.fillRect(w.x+2+((i*37)%(w.w-6)),w.y-15+((i*53)%Math.max(4,w.h-4)),3,2)}
    for(const f of [G.me,G.op]){const me=f===G.me;f.v={sh:s.add.image(f.x,f.y,"shadow"),spr:s.add.image(f.x,f.y,"m_"+f.key+"_0").setOrigin(.5,29/32).setScale(2),chev:me?s.add.image(0,0,"chev").setDepth(D.ENT+2):null,
      orb:s.add.image(0,0,"orb").setBlendMode("ADD").setDepth(D.AIR+2).setVisible(false),mound:s.add.image(0,0,"mound").setVisible(false),
      stars:[0,1,2].map(()=>s.add.image(0,0,"star").setTint(0xffd84a).setScale(1.4).setVisible(false)),zz:s.add.text(0,0,"z",{fontFamily:'"Silkscreen",monospace',fontSize:"12px",color:"#fff"}).setResolution(2).setVisible(false),mins:new Map(),gt:0,aura:null}}
    this.cdT=s.add.text(W/2,H/2,"",{fontFamily:'"Silkscreen","Chakra Petch",monospace',fontSize:"64px",fontStyle:"bold",color:"#f5c542",stroke:"#000",strokeThickness:8}).setOrigin(.5).setDepth(D.UI).setResolution(2)},
  ghost(f,tint,al){const o=SCN.add.image(f.v.spr.x,f.v.spr.y,f.v.spr.texture.key).setOrigin(.5,29/32).setScale(f.v.spr.scaleX,f.v.spr.scaleY).setFlipX(f.ax<0).setDepth(D.ENT+f.y-2).setBlendMode("ADD").setAlpha(al);o.setTint(tint);
    SCN.tweens.add({targets:o,alpha:0,duration:260,onComplete:()=>o.destroy()})},
  fighter(f,dt,gG,gO,gA){const v=f.v,me=f===G.me,x=Math.round(f.x),y=Math.round(f.y),P=PALH[f.mon.t[0]];
    syncList(f.minions,v.mins,m=>SCN.add.image(0,0,"m_"+f.key+"_0").setOrigin(.5,29/32).setScale(m.k===1?2:1.1).setAlpha(.8),(m,o)=>{const ph=m.k===1,mx=m.mx||22;o.setTexture("m_"+f.key+"_"+(Math.floor(m.wk)%2)).setPosition(Math.round(m.x),Math.round(m.y)).setFlipX(ph?Math.cos(m.an)<0:f.ax<0).setDepth(D.ENT+m.y);
      if(ph){o.setTint(0x8a5ae0).setAlpha(.6+.3*Math.sin(G.t*20+m.x));const S=PALH.shadow,E=PALH.elec;
        if(m.ds===2){const ca=Math.cos(m.an),sa=Math.sin(m.an);gG.lineStyle(2,0xfff06a,.75);for(let d=14;d<240;d+=16)gG.lineBetween(m.x+ca*d,m.y+sa*d,m.x+ca*(d+8),m.y+sa*(d+8));gG.lineStyle(2,S[1],.8).strokeCircle(m.x,m.y,14+Math.sin(G.t*30)*3);if(Math.random()<.5)emit("streak",m.x+rnd(-12,12),m.y-rnd(0,30),rnd(-80,80),-rnd(40,120),.15,pick(E.slice(0,3)),rnd(0,360))}
        if(m.ds===1){ghostImg(o,pick([0x4ad8ff,0x9a6adf,0xfff06a]));if(o.lx!=null)boltPts(gA,jag(gA,o.lx,o.ly-14,m.x,m.y-14,7,12),3,E);for(let i=0;i<3;i++){const a=rnd(0,6.283);emit("streak",m.x+rnd(-14,14),m.y-rnd(0,34),Math.cos(a)*240,Math.sin(a)*240,.14,pick([0xfff06a,0x4ad8ff,0xc8a0ff]),a*57.3)}}
        o.lx=m.x;o.ly=m.y;if(Math.random()<.3)emit("smoke",m.x+rnd(-10,10),m.y-rnd(0,30),0,-20,.5,S[4])}
      gG.fillStyle(0,.3).fillEllipse(m.x,m.y+1,ph?30:16,ph?10:6);const bw=ph?34:16,hy=ph?m.y-70:m.y-36;gO.fillStyle(0,1).fillRect(m.x-bw/2-1,hy,bw+2,4);gO.fillStyle(ph?0xb48cff:me?0x7dffa0:0xff8a8a,1).fillRect(m.x-bw/2,hy+1,Math.max(0,bw*m.hp/mx),2)});
    const hid=!me&&!seenBy(f,G.me)&&f.under<=0,und=f.under>0,vis=!hid&&!und;
    v.spr.setVisible(vis);v.sh.setVisible(vis);v.mound.setVisible(und&&!hid);v.orb.setVisible(false);v.zz.setVisible(false);for(const st of v.stars)st.setVisible(false);if(v.chev)v.chev.setVisible(vis);
    if(hid)return;
    if(und){v.mound.setPosition(x,y-2).setDepth(D.ENT+y);if(Math.random()<.4)emit("sqg",x+rnd(-10,10),y,rnd(-40,40),-rnd(60,140),.35,0x8a5a2a);return}
    const U=f.U,UVk=U&&UV[U.k],m=(UVk&&UVk.mod&&UVk.mod(U,f))||{};
    let z=(f.air>0?Math.sin(Math.PI*clamp(1-f.air/f.airT,0,1))*(f.airT>.6?120:60):0)+(m.z||0)+(f.bub>0?24+Math.sin(G.t*6)*3:0);const bird=f.dash&&f.dash.mv.kind==="u_bird",ph=f.dash&&f.dash.mv.kind==="u_phantom";
    if(m.hide){v.spr.setVisible(false);v.sh.setVisible(false);if(v.chev)v.chev.setVisible(false)}
    v.sh.setPosition(x,y+1).setScale(Math.max(.3,1-z*.004)*(m.sc||2)/2).setDepth(D.ENT+y-1);
    const fr=f.moving?(Math.floor(f.walk)%2):(Math.floor(G.t*2.2)%2),sc=m.sc||(bird?2.6:f.dash?2.15:2),hb=Math.max(0,(sc-2)*28),punch=f.cdB>0&&MOVES[f.mon.basic].kind==="melee"?Math.max(0,f.cdB-MOVES[f.mon.basic].cd+.12)*60:0;
    v.spr.setTexture("m_"+f.key+"_"+fr).setOrigin(.5,m.og||29/32).setPosition(x+f.ax*punch+(m.shake?rnd(-m.shake,m.shake):0),y-z+(f.roll>0?10:0)+f.ay*punch-(m.og?(29/32-m.og)*32*sc:0)).setFlipX(f.ax<0).setScale(sc).setDepth(D.ENT+y).setAlpha(f.hp<=0?.5:f.roll>0?.55:f.cloak>0&&f.reveal<=0?.38:me&&inCover(f)?.6:1).setRotation(m.rot!=null?m.rot:f.hp<=0?1.4:f.roll>0?(.28-f.roll)*22*(f.ax<0?-1:1):0);
    fillTint(v.spr,f.flash>0);
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
    if(f.shield>0)gO.fillStyle(0xd8f2ff,1).fillRect(x-bw/2,y-76-z-hb,Math.round(bw*f.shield/32),2);
    if(f.ult>=100)gO.fillStyle(0xf5c542,1).fillRect(x-bw/2,y-67-z-hb,bw,2)},
  /* preview of where the held attack will go */
  aimGuide(gG){const f=G.me;if(f.hp<=0||G.over||G.cd>0)return;let key=null;for(const k of [0,1,2,"u"])if(IN.slot[k].down){key=k;break}
    if(key==null&&IN.slot.b.down&&IN.slot.b.manual)key="b";if(key==null)return;const mv=slotMove(f,key);if(!mv||mv.kind==="beam")return;if(key!=="b"&&key!=="u"&&f.cds[key]>0)return;if(key==="u"&&f.ult<100)return;
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
    const sp={fire:900,water:1250,grass:700,elec:500,earth:820,wind:1400,norm:800,metal:1500,shadow:650}[type],at=d=>[b.x+ex*d,b.y+ey*d],deg=ang*57.2958,dens=clamp(end/700,.25,1.3);let nt=0;
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
      else{nt-=dt;if(nt<=0){nt=.045;gfx.clear();const p=jag(gfx,6,0,end,0,w*1.1,22);boltPts(gfx,p,w*.9,P);const p2=jag(gfx,6,0,end,0,w*1.6,34);strokePts(gfx,p2,Math.max(1.5,w*.18),P[1],.7);
          for(let j=0;j<4&&p.length>2;j++){const o=p[1+((Math.random()*(p.length-2))|0)],a=rnd(.5,1.2)*(Math.random()<.5?-1:1),l=rnd(30,70);strokePts(gfx,jag(gfx,o[0],o[1],o[0]+Math.cos(a)*l,o[1]+Math.sin(a)*l,6,12),2,P[1],.9)}}
        gfx.setAlpha(fade);for(let i=n(60);i--;){const q=edge(),a=rnd(0,6.283),v=rnd(200,520);emit("streak",q[0],q[1],Math.cos(a)*v,Math.sin(a)*v,rnd(.08,.18),pick(P.slice(0,3)),a*57.3)}}
    },kill(){c.destroy()}})},
  regions(gG,gA){const A=G.A,t=G.t;
    const waterFx=(x0,y0,w,h,test)=>{gG.fillStyle(0x4a9bea,1);for(let i=0;i<Math.ceil(w*h/3400);i++){const x=x0+6+((i*29)%Math.max(8,w-30)),y=y0+((i*61+t*26)%(h+30))-15;if(test(x+9,y))gG.fillRect(x,y,18,3)}
      gG.fillStyle(0x8fc8ff,1);for(let i=0;i<Math.ceil(w*h/1900);i++){const x=x0+8+((i*53)%Math.max(8,w-22)),y=y0+((i*37+t*40)%(h+20))-10;if(test(x+4,y))gG.fillRect(x,y,8,2)}
      if(G.zapT>0)for(let k=0;k<Math.ceil(h/90);k++){const xa=x0+rnd(6,w-6),ya=y0+rnd(0,h-40);if(test(xa,ya))boltPts(gA,jag(gA,xa,ya,x0+rnd(6,w-6),ya+rnd(40,90),10,14),3,PALH.elec)}};
    for(const w of A.water){if(w.e){gG.fillStyle(0x1f65b0,1).fillEllipse(w.x,w.y,w.rx*2+6,w.ry*2+6);gG.fillStyle(0x2f7fd0,1).fillEllipse(w.x,w.y,w.rx*2,w.ry*2);waterFx(w.x-w.rx,w.y-w.ry,w.rx*2,w.ry*2,(x,y)=>inEll(w,x,y,-8));if(G.zapT>0)gA.fillStyle(0xfff078,.22*G.zapT).fillEllipse(w.x,w.y,w.rx*2,w.ry*2)}
      else{gG.fillStyle(0x2f7fd0,1).fillRect(w.x,w.y,w.w,w.h);gG.fillStyle(0x1f65b0,1).fillRect(w.x,w.y,3,w.h).fillRect(w.x+w.w-3,w.y,3,w.h);waterFx(w.x,w.y,w.w,w.h,()=>true);if(G.zapT>0)gA.fillStyle(0xfff078,.22*G.zapT).fillRect(w.x,w.y,w.w,w.h)}}
    for(const b of A.bridges){gG.fillStyle(0x6b4424,1).fillRect(b.x,b.y,b.w,b.h);gG.fillStyle(0xa8743c,1);for(let x=b.x+2;x<b.x+b.w-2;x+=10)gG.fillRect(x,b.y+3,8,b.h-6);gG.fillStyle(0x3b2412,1).fillRect(b.x,b.y,b.w,3).fillRect(b.x,b.y+b.h-3,b.w,3)}
    for(const l of A.ice){gG.fillStyle(0x8fb8d8,1).fillEllipse(l.x,l.y,l.rx*2+6,l.ry*2+6);gG.fillStyle(0xbfe6fa,1).fillEllipse(l.x,l.y,l.rx*2,l.ry*2);gG.fillStyle(0xe6f7ff,1).fillEllipse(l.x-l.rx*.2,l.y-l.ry*.25,l.rx*1.1,l.ry*.9);
      gG.fillStyle(0xffffff,.9);for(let i=0;i<Math.ceil(l.rx/14);i++){const x=l.x-l.rx*.7+((i*47)%(l.rx*1.3)),y=l.y-l.ry*.6+((i*31)%(l.ry*1.1));gG.fillRect(x,y,12,2);gG.fillRect(x+8,y+3,6,1)}
      if((t*2+l.x)%1<.05)emit("sq",l.x+rnd(-l.rx,l.rx)*.7,l.y+rnd(-l.ry,l.ry)*.7,0,-20,.5,0xffffff)}
    for(const l of A.sand){gG.fillStyle(0xa8824a,1).fillEllipse(l.x,l.y,l.rx*2+4,l.ry*2+4);gG.fillStyle(0xc29a52,1).fillEllipse(l.x,l.y,l.rx*2,l.ry*2);
      for(let k=0;k<4;k++){const q=1-((t*.22+k*.25)%1);gG.lineStyle(2,0x8a6a36,.35+.5*(1-q));gG.beginPath();gG.arc(l.x,l.y,1,0,0);gG.strokePath();gG.strokeEllipse(l.x,l.y,l.rx*2*q,l.ry*2*q)}gG.fillStyle(0x5f4622,1).fillEllipse(l.x,l.y,10,6)}
    for(const l of A.bog){gG.fillStyle(0x2e2440,1).fillEllipse(l.x,l.y,l.rx*2+6,l.ry*2+6);gG.fillStyle(0x5a3f7a,1).fillEllipse(l.x,l.y,l.rx*2,l.ry*2);gG.fillStyle(0x6fae5a,.55).fillEllipse(l.x+Math.sin(t+l.y)*6,l.y,l.rx*1.3,l.ry*1.2);
      if(Math.random()<.14)emit("sq",l.x+rnd(-l.rx,l.rx)*.7,l.y+rnd(-l.ry,l.ry)*.6,0,-rnd(14,34),.7,pick([0x9a7ad0,0x8fe06a]))}
    for(const l of A.lava){if(l.cool>0){gG.fillStyle(0x2a2428,1).fillEllipse(l.x,l.y,l.rx*2+6,l.ry*2+6);gG.fillStyle(0x4a4448,1).fillEllipse(l.x,l.y,l.rx*2,l.ry*2);gG.fillStyle(0x5a5458,1).fillEllipse(l.x-l.rx*.2,l.y-l.ry*.2,l.rx,l.ry*.8);
        gG.lineStyle(1.5,l.cool<1.5?0xff7a3d:0x2a2428,1).beginPath();gG.moveTo(l.x-l.rx*.6,l.y);gG.lineTo(l.x-4,l.y+4);gG.lineTo(l.x+6,l.y-5);gG.lineTo(l.x+l.rx*.6,l.y+2);gG.strokePath();if(Math.random()<.25)emit("smoke",l.x+rnd(-l.rx,l.rx)*.7,l.y,rnd(-8,8),-rnd(20,45),.9,0xe8f4ff)}
      else{const k=.45+.12*Math.sin(t*3+l.x);gG.fillStyle(0x2a1a1a,1).fillEllipse(l.x,l.y,l.rx*2+6,l.ry*2+6);gG.fillStyle(0xc2360a,1).fillEllipse(l.x,l.y,l.rx*2,l.ry*2);gG.fillStyle(0xff7a1a,1).fillEllipse(l.x,l.y,l.rx*1.6,l.ry*1.5);gG.fillStyle(0xffd23e,1).fillEllipse(l.x+Math.sin(t+l.y)*5,l.y,l.rx*2*k,l.ry*2*k);
        gG.fillStyle(0xfff3a0,1).fillEllipse(l.x+Math.sin(t*1.7+l.x)*7,l.y+Math.cos(t*1.3)*3,l.rx*.5*k,l.ry*.5*k);if(Math.random()<.12)emit("soft",l.x+rnd(-l.rx,l.rx)*.6,l.y+rnd(-l.ry,l.ry)*.6,rnd(-10,10),-rnd(30,70),.6,pick(PALH.fire.slice(1,4)))}}
    if(A.spring){const p=A.spring,k=1+.06*Math.sin(t*3);gG.fillStyle(0x2a6a6a,1).fillCircle(p.x,p.y,p.r+4);gG.fillStyle(0x4fd8c8,1).fillCircle(p.x,p.y,p.r*k);gG.fillStyle(0xb8fff0,1).fillCircle(p.x,p.y,p.r*.55*k);gG.lineStyle(2,0xffffff,.7).strokeCircle(p.x,p.y,p.r*((t*.6)%1));
      if(Math.random()<.3)emit("sq",p.x+rnd(-p.r,p.r)*.7,p.y+rnd(-p.r,p.r)*.6,0,-rnd(30,60),.6,pick([0xb8fff0,0xffffff,0x7dffe0]))}
    for(const p of A.pads){gG.fillStyle(0x2a1a40,1).fillEllipse(p.x,p.y,48,26);gG.lineStyle(2,0xc58cff,1).strokeEllipse(p.x,p.y,42,22);gG.lineStyle(2,0xffffff,.8);const a=t*2.4;gG.beginPath();gG.arc(p.x,p.y,13,a,a+2.2);gG.strokePath();gG.beginPath();gG.arc(p.x,p.y,8,-a,-a+2.6);gG.strokePath();
      if(Math.random()<.15)emit("sq",p.x+rnd(-16,16),p.y+rnd(-6,6),0,-rnd(40,80),.5,pick([0xc58cff,0xffffff]))}},
  sync(dt){const s=SCN,A=G.A,gG=this.gG,gO=this.gO,gA=this.gA,me=G.me,st=this.st;this.t+=dt;
    if(BGD){this.bgTex.refresh();BGD=false}
    const tcx=clamp(me.x+me.ax*26-VW/2,0,W-VW),tcy=clamp(me.y+me.ay*18-VH/2,0,H-VH),ck=Math.min(1,dt*6);this.camX+=(tcx-this.camX)*ck;this.camY+=(tcy-this.camY)*ck;
    const sh=G.shake,cx=this.camX,cy=this.camY;s.cameras.main.setScroll(this.bx+Math.round(cx)+(sh?rnd(-sh,sh)*.5:0),this.by+Math.round(cy)+(sh?rnd(-sh,sh)*.5:0));
    gG.clear();gO.clear();gA.clear();this.regions(gG,gA);
    for(const z of G.zones){const type=mvT(z.mv,z.own);if(z.pull||type==="fire")continue;const al=Math.min(1,z.t*2),P=PALH[type];gG.fillStyle(P[3],.18*al).fillCircle(z.x,z.y,z.mv.rad);gG.lineStyle(2,P[2],.7*al).strokeCircle(z.x,z.y,z.mv.rad);gG.lineStyle(1.5,0xffffff,.5*al).strokeCircle(z.x,z.y,z.mv.rad*((G.t*.7)%1));
      if(Math.random()<dt*22){const an=rnd(0,6.283),r=rnd(0,z.mv.rad);emit(type==="shadow"?"smoke":"leaf",z.x+Math.cos(an)*r,z.y+Math.sin(an)*r,rnd(-10,10),-rnd(30,70),.7,pick(type==="shadow"?[0x43287a,0x6a3fb0,0x2a1850]:P.slice(1,4)))}}
    for(const b of G.blasts){if(b.t>b.full)continue;const k=1-b.t/b.full,col=PALH[mvT(b.mv,b.own)][3];gG.lineStyle(2,col,1);dashCircle(gG,b.x,b.y,b.mv.rad,this.t*2);gG.fillStyle(col,.28).fillCircle(b.x,b.y,b.mv.rad*k);gG.lineStyle(1.5,0xffffff,.5).strokeCircle(b.x,b.y,b.mv.rad*k)}
    this.aimGuide(gG);
    syncList(G.blasts.filter(b=>b.fall&&b.t<=b.full),st.met,()=>s.add.sprite(0,0,"shot_fire").setScale(2.6).setRotation(1.87).setBlendMode("ADD").setDepth(D.AIR).play("shot_fire"),(b,o)=>{const h=b.t*520;o.setPosition(b.x-h*.3,b.y-h-8);emit("soft",o.x,o.y,rnd(-20,20),-rnd(20,60),.3,pick(PALH.fire.slice(1,5)))});
    syncList(G.blasts.filter(b=>(b.mv.lob||b.lob)&&b.t<=b.full),st.lob,b=>{const k=b.lob||"shot_earth",o=s.add.sprite(0,0,k).setScale(b.ls||2.4).setDepth(D.AIR);if(s.anims.exists(k))o.play(k);if(k==="shot_fire")o.setBlendMode("ADD");return o},
      (b,o)=>{const k=clamp(1-b.t/b.full,0,1),lh=b.lh||90,dx=(b.x-b.ox),dy=(b.y-b.oy)-Math.cos(k*Math.PI)*Math.PI*lh;o.setPosition(b.ox+(b.x-b.ox)*k,b.oy+(b.y-b.oy)*k-Math.sin(k*Math.PI)*lh).setRotation(b.lob==="shot_fire"?Math.atan2(dy,dx):G.t*(b.lob==="chili"?9:8));
        if(b.lob)emit("soft",o.x+rnd(-4,4),o.y+rnd(-4,4),rnd(-20,20),-rnd(10,40),.35,pick(PALH.fire.slice(1,5)));else if(Math.random()<.5)emit("smoke",o.x,o.y,0,0,.3,0x8a6a4a)});
    for(const p of A.props){const v=p.v;if(!v)continue;if(p.k==="tree"){v.a.setVisible(!p.dead);v.c.setVisible(!p.dead);v.s.setVisible(p.dead);if(!p.dead)v.c.setAlpha(Math.hypot(p.x-me.x,p.y-14-me.y)<p.R+6?.5:.97)}
      else{v.a.setVisible(!p.dead);if(v.sh)v.sh.setVisible(!p.dead);if(p.k==="bush"&&!p.dead)v.a.setAlpha(Math.hypot(p.x-me.x,p.y-me.y)<p.R-4?.5:1)}}
    syncList(G.twalls,st.tw,w=>{const o=s.add.image(w.x,w.y+8,"p_twall").setOrigin(.5,1).setScale(2,0).setDepth(D.ENT+w.y);if(w.tall)o.setTint(0xd8d0b8);return o},(w,o)=>{const k=clamp((G.t-w.born)/.15,0,1);o.setScale(w.tall?2.3:2,(w.tall?3:2)*k).setAlpha(Math.min(1,w.t*2));if(w.tall&&k>0&&!o.fx){o.fx=1;FX.boom(w.x,w.y,"earth",16)}});
    syncList(G.traps,st.traps,t=>s.add.image(t.x,t.y,"p_trap").setScale(2).setDepth(D.GFX+5),(t,o)=>{const mine=t.own===me;o.setAlpha(t.arm>0?.5+.4*Math.sin(G.t*30):mine?.95:.42).setScale(2+(t.arm>0?0:.12*Math.sin(G.t*5)))});
    this.fighter(G.me,dt,gG,gO,gA);this.fighter(G.op,dt,gG,gO,gA);
    syncList(G.ults,st.ults,U=>{const q=UV[U.k];return q&&q.make?q.make(U):[]},(U,o)=>{const q=UV[U.k];if(q&&q.upd)q.upd(U,o,dt,gG,gO,gA)});
    for(const q of G.slashes){const P=PALH[mvT(q.mv,q.own)],k=1-q.t/q.full,a0=q.ang-q.mv.arc/2,a1=a0+q.mv.arc*Math.min(1,k*1.8),r=q.mv.rng*.86;gA.lineStyle(12*(1-k)+3,P[3],.9*(1-k*.6));gA.beginPath();gA.arc(q.x,q.y,r,a0,a1);gA.strokePath();gA.lineStyle(4*(1-k)+1,0xffffff,1-k*.5);gA.beginPath();gA.arc(q.x,q.y,r+3,a0,a1);gA.strokePath();
      gA.lineStyle(3,P[2],.6*(1-k));gA.beginPath();gA.arc(q.x,q.y,r*.7,a0,a1);gA.strokePath();if(!q.seen){q.seen=1;for(let i=0;i<8;i++){const a=a0+Math.random()*q.mv.arc;spray(mvT(q.mv,q.own),q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,1,120)}}}
    for(const c of G.cones){const o=c.own,mv=c.mv,ang=Math.atan2(o.ay,o.ax),P=PALH[mvT(mv,o)];gA.fillStyle(P[3],.12);gA.slice(o.x,o.y-12,mv.rng,ang-mv.arc/2,ang+mv.arc/2,false);gA.fillPath();
      for(let i=0;i<9;i++){const a=ang+rnd(-.5,.5)*mv.arc,v=rnd(240,420);emit(i%4===0?"sq":"soft",o.x+Math.cos(ang)*16,o.y-12+Math.sin(ang)*16,Math.cos(a)*v,Math.sin(a)*v-rnd(0,30),mv.rng/v*rnd(.8,1.1),pick(P.slice(1,5)))}if(Math.random()<.5){const a=ang+rnd(-.5,.5)*mv.arc;emit("smoke",o.x+Math.cos(a)*mv.rng*.8,o.y-12+Math.sin(a)*mv.rng*.8,0,-40,.6,0x3a3038)}}
    syncList(G.orbits,st.orb,()=>[0,1,2].map(()=>s.add.sprite(0,0,"shot_fire").setScale(1.7).setBlendMode("ADD").play("shot_fire")),(q,a)=>{const o=q.own;a.forEach((sp,k)=>{const an=q.a+k*2.094,x=o.x+Math.cos(an)*q.mv.rad,y=o.y-12+Math.sin(an)*q.mv.rad;sp.setPosition(x,y).setRotation(an+1.5708).setDepth(D.ENT+y+12).setAlpha(Math.min(1,q.t*2));if(Math.random()<.5)emit("soft",x,y,rnd(-20,20),-rnd(10,40),.25,pick(PALH.fire.slice(1,5)))})});
    syncList(G.shots,st.shots,o=>{if(o.fb)return s.add.sprite(0,0,o.fb).play(o.fb).setBlendMode("ADD").setDepth(D.AIR).setVisible(false);const type=mvT(o.mv,o.own);const v=o.mv.pierce&&type==="wind"&&!o.mv.boom?s.add.image(0,0,"swirl").setBlendMode("ADD"):s.add.sprite(0,0,"shot_"+type).play("shot_"+type);if(ADDT[type]&&type!=="grass")v.setBlendMode("ADD");
        if(o.mv.hook)v.setTint(0x7ad06a);if(o.mv.drain)v.setTint(0xd8ffb0);return v.setDepth(D.AIR).setVisible(false)},
      (o,v)=>{if(o.w>0)return;if(o.fb){v.setVisible(true).setPosition(o.x,o.y).setScale(1.3*o.sc).setRotation(Math.atan2(o.vy,o.vx));const P2=o.blue?PALH.blue:PALH.fire;for(let i=0;i<3;i++)emit(i?"soft":"sq",o.x-o.vx*.02+rnd(-6,6)*o.sc,o.y-o.vy*.02+rnd(-6,6)*o.sc,-o.vx*.15+rnd(-50,50),-o.vy*.15+rnd(-50,50),rnd(.2,.4),pick(P2.slice(0,4)));return}const mv=o.mv,type=mvT(mv,o.own),P=PALH[type],sw=mv.pierce&&type==="wind"&&!mv.boom;
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
    for(const b of ABS){const k=b.key,v=k==="b"?me.cdB/MOVES[me.mon.basic].cd:k==="d"?me.dodgeCd/2.2:k==="u"?1-me.ult/100:me.cds[k]/MOVES[me.moves[k]].cd;b.cd.style.height=(clamp(v,0,1)*100)+"%";if(k==="u")b.b.classList.toggle("on",me.ult>=100)}},
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
  create(){SCN=this;makeTextures(this);makeUltTex(this);const cam=this.cameras.main;cam.setZoom(2);cam.centerOn(VW/2,VH/2);VIEW.bx=cam.scrollX;VIEW.by=cam.scrollY;
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
