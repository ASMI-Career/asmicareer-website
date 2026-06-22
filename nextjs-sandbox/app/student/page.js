'use client';

import { useState, useEffect } from 'react';
import './dashboard.css';

// ── Helper functions ──────────────────────────────────────────────────────────
const getBranchFromToken = (token) => {
  if (!token) return 'ASMI Career Network';
  const tok = String(token).toUpperCase();
  if (tok.includes('MUM')) return 'Mumbai Branch Office';
  if (tok.includes('PUN') || tok.includes('PNE')) return 'Pune Branch Office';
  if (tok.includes('NGP') || tok.includes('NAG')) return 'Nagpur Branch Office';
  if (tok.includes('KOL')) return 'Kolhapur Branch Office';
  if (tok.includes('SAN')) return 'Sangli Branch Office';
  if (tok.includes('CSN') || tok.includes('SAM')) return 'Chh. Sambhajinagar Branch Office';
  if (tok.includes('THN') || tok.includes('THA')) return 'Thane Branch Office';
  if (tok.includes('NSK') || tok.includes('NAS')) return 'Nashik Branch Office';
  return 'ASMI Regional Branch';
};

const getWhatsAppLink = (number) => {
  if (!number) return 'https://wa.me/917410019074';
  const cleanNum = String(number).replace(/\D/g, '');
  return 'https://wa.me/' + (cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum);
};

const cleanFee = (feesStr) => {
  if (!feesStr) return 0;
  return parseInt(String(feesStr).replace(/[^0-9]/g, ''), 10) || 0;
};

const formatFees = (feesStr) => {
  const rawFee = cleanFee(feesStr);
  if (rawFee === 0) return '₹ — / yr';
  if (rawFee < 100000) return `₹${rawFee.toLocaleString('en-IN')} / yr`;
  const lakhs = (rawFee / 100000).toFixed(2);
  return `₹${lakhs} L / yr`;
};

// ── Document Schema ───────────────────────────────────────────────────────────
const DOCS = {
  sections: [
    {
      title: 'Academic Documents',
      docs: [
        { id: 'neet-admit',   label: 'NEET Admit Card',                          copies: 'Original + 2 self-attested photocopies' },
        { id: 'neet-score',   label: 'NEET Scorecard / Rank Letter',             copies: 'Original + 2 self-attested photocopies' },
        { id: 'cls10-mark',   label: 'Class 10 Marksheet',                       copies: 'Original + 3 attested photocopies', note: 'Required as date of birth proof' },
        { id: 'cls10-cert',   label: 'Class 10 Passing Certificate',             copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-mark',   label: 'Class 12 Marksheet',                       copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-cert',   label: 'Class 12 Passing Certificate / School Leaving', copies: 'Original + 3 attested photocopies' },
      ]
    },
    {
      title: 'Identity & Address Proof',
      docs: [
        { id: 'aadhar-self',   label: 'Aadhaar Card — Student', copies: 'Original + 3 self-attested photocopies' },
        { id: 'aadhar-father', label: 'Aadhaar Card — Father',  copies: 'Original + 2 self-attested photocopies' },
        { id: 'aadhar-mother', label: 'Aadhaar Card — Mother',  copies: 'Original + 2 self-attested photocopies' },
        { id: 'photos',        label: 'Passport-size Photographs', copies: '10–15 recent, white background', note: 'Same set as used in NEET application form' },
      ]
    },
    {
      title: 'School / College Certificates',
      docs: [
        { id: 'tc',        label: 'Transfer Certificate (TC)',  copies: 'Original + 2 attested photocopies' },
        { id: 'migration', label: 'Migration Certificate',      copies: 'Original + 1 photocopy', note: 'Required if schooling was outside Maharashtra' },
        { id: 'character', label: 'Character Certificate',      copies: 'Original (from last institution)' },
      ]
    },
    {
      title: 'Medical Certificate',
      docs: [
        { id: 'medical-fit', label: 'Medical Fitness Certificate', copies: "Original on doctor's letterhead", note: 'From a registered MBBS doctor' },
      ]
    },
  ],
  category: {
    OBC: {
      title: 'OBC Category Documents',
      docs: [
        { id: 'obc-cert', label: 'OBC Certificate',                    copies: 'Original + 2 attested photocopies', note: 'Central format for AIQ; state format for State Quota' },
        { id: 'ncl-cert', label: 'Non-Creamy Layer (NCL) Certificate', copies: 'Original + 2 attested photocopies', note: 'Must be issued within the last 1 year; annual family income below ₹8 lakh' },
      ]
    },
    SC: {
      title: 'SC Category Documents',
      docs: [
        { id: 'caste-sc',    label: 'Caste Certificate (SC)',    copies: 'Original + 2 attested photocopies' },
        { id: 'validity-sc', label: 'Caste Validity Certificate', copies: 'Original + 1 photocopy', note: 'Maharashtra: issued by District Caste Scrutiny Committee' },
      ]
    },
    ST: {
      title: 'ST Category Documents',
      docs: [
        { id: 'tribe-st',    label: 'Tribe Certificate (ST)',    copies: 'Original + 2 attested photocopies' },
        { id: 'validity-st', label: 'Tribe Validity Certificate', copies: 'Original + 1 photocopy', note: 'Maharashtra: issued by District Caste Scrutiny Committee' },
      ]
    },
    EWS: {
      title: 'EWS Category Documents',
      docs: [
        { id: 'ews-cert',    label: 'EWS Certificate',   copies: 'Original + 2 attested photocopies', note: 'Current financial year; issued by Tehsildar or SDO' },
        { id: 'income-cert', label: 'Income Certificate', copies: 'Original + 1 photocopy', note: 'Annual family income below ₹8 lakh' },
      ]
    },
  },
  quota: {
    AIQ: {
      title: 'All India Quota (AIQ) Documents',
      docs: [
        { id: 'mcc-reg',       label: 'MCC Registration Printout',  copies: '2 photocopies', note: 'Print from the MCC NEET UG counselling portal' },
        { id: 'mcc-allotment', label: 'AIQ Seat Allotment Letter',  copies: 'Original + 2 photocopies', note: 'Download from MCC portal after seat allotment round' },
      ]
    },
    State: {
      title: 'State Quota (Maharashtra) Documents',
      docs: [
        { id: 'domicile', label: 'Maharashtra Domicile / Nativity Certificate', copies: 'Original + 2 attested photocopies', note: 'Issued by Tehsildar or SDO; family requires 15+ years Maharashtra residence' },
      ]
    },
    Management: {
      title: 'Management / NRI Quota Documents',
      docs: [
        { id: 'mgmt-allotment', label: 'Management / NRI Seat Allotment Letter', copies: 'Original + 2 photocopies', note: 'From college trust or state management quota authority' },
        { id: 'fee-receipt',    label: 'Fee Payment Receipt',                    copies: '2 photocopies', note: 'If partial fee was collected at time of allotment' },
      ]
    },
  }
};

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: 'lucide:layout-dashboard' },
  { id: 'predictor',  label: 'Predictor',       icon: 'lucide:bar-chart-3'      },
  { id: 'cutoff',     label: 'Cutoff Explorer', icon: 'lucide:search'           },
  { id: 'institutes', label: 'Institutes',      icon: 'lucide:building-2'       },
  { id: 'checklist',  label: 'Documents',       icon: 'lucide:file-text'        },
];

const RANK_DATA = {"686":{"min_rank":1,"max_rank":1,"count":1},"670":{"min_rank":18,"max_rank":18,"count":1},"669":{"min_rank":19,"max_rank":19,"count":1},"660":{"min_rank":37,"max_rank":37,"count":1},"656":{"min_rank":46,"max_rank":48,"count":2},"655":{"min_rank":56,"max_rank":56,"count":1},"654":{"min_rank":59,"max_rank":59,"count":1},"652":{"min_rank":64,"max_rank":70,"count":2},"646":{"min_rank":92,"max_rank":95,"count":2},"644":{"min_rank":108,"max_rank":108,"count":1},"643":{"min_rank":109,"max_rank":109,"count":1},"642":{"min_rank":116,"max_rank":116,"count":1},"640":{"min_rank":129,"max_rank":133,"count":2},"638":{"min_rank":144,"max_rank":147,"count":2},"634":{"min_rank":181,"max_rank":186,"count":2},"633":{"min_rank":192,"max_rank":200,"count":3},"632":{"min_rank":207,"max_rank":217,"count":5},"631":{"min_rank":222,"max_rank":231,"count":4},"630":{"min_rank":238,"max_rank":253,"count":4},"629":{"min_rank":262,"max_rank":265,"count":2},"628":{"min_rank":274,"max_rank":274,"count":1},"627":{"min_rank":290,"max_rank":297,"count":3},"626":{"min_rank":307,"max_rank":325,"count":5},"625":{"min_rank":336,"max_rank":352,"count":5},"624":{"min_rank":367,"max_rank":368,"count":2},"623":{"min_rank":377,"max_rank":384,"count":3},"622":{"min_rank":391,"max_rank":401,"count":2},"621":{"min_rank":426,"max_rank":433,"count":3},"620":{"min_rank":462,"max_rank":469,"count":3},"619":{"min_rank":479,"max_rank":502,"count":4},"618":{"min_rank":515,"max_rank":532,"count":5},"617":{"min_rank":536,"max_rank":563,"count":7},"616":{"min_rank":564,"max_rank":587,"count":5},"615":{"min_rank":605,"max_rank":633,"count":4},"614":{"min_rank":638,"max_rank":660,"count":5},"613":{"min_rank":672,"max_rank":698,"count":6},"612":{"min_rank":706,"max_rank":738,"count":7},"611":{"min_rank":758,"max_rank":767,"count":3},"610":{"min_rank":776,"max_rank":821,"count":13},"609":{"min_rank":830,"max_rank":882,"count":17},"608":{"min_rank":884,"max_rank":933,"count":8},"607":{"min_rank":934,"max_rank":977,"count":10},"606":{"min_rank":989,"max_rank":1027,"count":7},"605":{"min_rank":1032,"max_rank":1073,"count":10},"604":{"min_rank":1093,"max_rank":1139,"count":7},"603":{"min_rank":1161,"max_rank":1192,"count":14},"602":{"min_rank":1197,"max_rank":1243,"count":10},"601":{"min_rank":1254,"max_rank":1326,"count":15},"600":{"min_rank":1334,"max_rank":1406,"count":19},"599":{"min_rank":1416,"max_rank":1475,"count":7},"598":{"min_rank":1496,"max_rank":1544,"count":12},"597":{"min_rank":1552,"max_rank":1596,"count":13},"596":{"min_rank":1609,"max_rank":1680,"count":18},"595":{"min_rank":1688,"max_rank":1769,"count":24},"594":{"min_rank":1784,"max_rank":1852,"count":13},"593":{"min_rank":1884,"max_rank":1954,"count":22},"592":{"min_rank":1960,"max_rank":2043,"count":22},"591":{"min_rank":2067,"max_rank":2149,"count":19},"590":{"min_rank":2163,"max_rank":2287,"count":20},"589":{"min_rank":2289,"max_rank":2386,"count":21},"588":{"min_rank":2388,"max_rank":2505,"count":24},"587":{"min_rank":2510,"max_rank":2613,"count":27},"586":{"min_rank":2620,"max_rank":2731,"count":22},"585":{"min_rank":2738,"max_rank":2876,"count":36},"584":{"min_rank":2885,"max_rank":2996,"count":29},"583":{"min_rank":3013,"max_rank":3138,"count":29},"582":{"min_rank":3155,"max_rank":3296,"count":36},"581":{"min_rank":3322,"max_rank":3429,"count":40},"580":{"min_rank":3437,"max_rank":3591,"count":38},"579":{"min_rank":3605,"max_rank":3764,"count":40},"578":{"min_rank":3770,"max_rank":3910,"count":29},"577":{"min_rank":3921,"max_rank":4104,"count":45},"576":{"min_rank":4110,"max_rank":4276,"count":41},"575":{"min_rank":4278,"max_rank":4503,"count":58},"574":{"min_rank":4510,"max_rank":4703,"count":47},"573":{"min_rank":4705,"max_rank":4890,"count":36},"572":{"min_rank":4896,"max_rank":5079,"count":52},"571":{"min_rank":5091,"max_rank":5314,"count":64},"570":{"min_rank":5319,"max_rank":5557,"count":58},"569":{"min_rank":5564,"max_rank":5786,"count":50},"568":{"min_rank":5805,"max_rank":6007,"count":49},"567":{"min_rank":6017,"max_rank":6288,"count":68},"566":{"min_rank":6294,"max_rank":6574,"count":60},"565":{"min_rank":6578,"max_rank":6912,"count":56},"564":{"min_rank":6915,"max_rank":7219,"count":76},"563":{"min_rank":7246,"max_rank":7517,"count":76},"562":{"min_rank":7527,"max_rank":7834,"count":74},"561":{"min_rank":7839,"max_rank":8160,"count":76},"560":{"min_rank":8168,"max_rank":8517,"count":88},"559":{"min_rank":8524,"max_rank":8849,"count":84},"558":{"min_rank":8863,"max_rank":9211,"count":93},"557":{"min_rank":9216,"max_rank":9559,"count":90},"556":{"min_rank":9567,"max_rank":9946,"count":99},"555":{"min_rank":9964,"max_rank":10386,"count":93},"554":{"min_rank":10391,"max_rank":10775,"count":101},"553":{"min_rank":10781,"max_rank":11159,"count":82},"552":{"min_rank":11175,"max_rank":11571,"count":98},"551":{"min_rank":11585,"max_rank":11987,"count":97},"550":{"min_rank":11994,"max_rank":12462,"count":126},"549":{"min_rank":12468,"max_rank":12911,"count":97},"548":{"min_rank":12919,"max_rank":13380,"count":109},"547":{"min_rank":13384,"max_rank":13876,"count":128},"546":{"min_rank":13884,"max_rank":14370,"count":132},"545":{"min_rank":14383,"max_rank":14873,"count":121},"544":{"min_rank":14879,"max_rank":15361,"count":122},"543":{"min_rank":15366,"max_rank":15872,"count":124},"542":{"min_rank":15879,"max_rank":16423,"count":153},"541":{"min_rank":16428,"max_rank":16993,"count":144},"540":{"min_rank":16995,"max_rank":17628,"count":167},"539":{"min_rank":17656,"max_rank":18200,"count":150},"538":{"min_rank":18214,"max_rank":18859,"count":187},"537":{"min_rank":18865,"max_rank":19454,"count":150},"536":{"min_rank":19463,"max_rank":20073,"count":190},"535":{"min_rank":20093,"max_rank":20784,"count":185},"534":{"min_rank":20786,"max_rank":21467,"count":161},"533":{"min_rank":21473,"max_rank":22182,"count":193},"532":{"min_rank":22197,"max_rank":22872,"count":186},"531":{"min_rank":22880,"max_rank":23563,"count":170},"530":{"min_rank":23567,"max_rank":24338,"count":190},"529":{"min_rank":24351,"max_rank":25012,"count":163},"528":{"min_rank":25015,"max_rank":25711,"count":165},"527":{"min_rank":25719,"max_rank":26462,"count":200},"526":{"min_rank":26471,"max_rank":27266,"count":222},"525":{"min_rank":27274,"max_rank":28130,"count":246},"524":{"min_rank":28140,"max_rank":28954,"count":233},"523":{"min_rank":28974,"max_rank":29796,"count":221},"522":{"min_rank":29804,"max_rank":30609,"count":193},"521":{"min_rank":30618,"max_rank":31440,"count":212},"520":{"min_rank":31461,"max_rank":32356,"count":221},"519":{"min_rank":32363,"max_rank":33242,"count":227},"518":{"min_rank":33265,"max_rank":34109,"count":238},"517":{"min_rank":34116,"max_rank":34983,"count":214},"516":{"min_rank":34990,"max_rank":35919,"count":220},"515":{"min_rank":35940,"max_rank":36924,"count":209},"514":{"min_rank":36933,"max_rank":37848,"count":200},"513":{"min_rank":37860,"max_rank":38761,"count":186},"512":{"min_rank":38779,"max_rank":39697,"count":194},"511":{"min_rank":39718,"max_rank":40748,"count":242},"510":{"min_rank":40753,"max_rank":41830,"count":227},"509":{"min_rank":41837,"max_rank":42823,"count":182},"508":{"min_rank":42830,"max_rank":43868,"count":229},"507":{"min_rank":43883,"max_rank":44909,"count":221},"506":{"min_rank":44929,"max_rank":45957,"count":215},"505":{"min_rank":45973,"max_rank":47121,"count":221},"504":{"min_rank":47128,"max_rank":48224,"count":226},"503":{"min_rank":48226,"max_rank":49285,"count":230},"502":{"min_rank":49288,"max_rank":50367,"count":221},"501":{"min_rank":50369,"max_rank":51507,"count":227},"500":{"min_rank":51515,"max_rank":52687,"count":223},"499":{"min_rank":52696,"max_rank":53756,"count":196},"498":{"min_rank":53765,"max_rank":54899,"count":248},"497":{"min_rank":54902,"max_rank":56041,"count":221},"496":{"min_rank":56063,"max_rank":57276,"count":225},"495":{"min_rank":57290,"max_rank":58530,"count":257},"494":{"min_rank":58550,"max_rank":59702,"count":232},"493":{"min_rank":59706,"max_rank":60962,"count":246},"492":{"min_rank":60990,"max_rank":62209,"count":255},"491":{"min_rank":62220,"max_rank":63462,"count":257},"490":{"min_rank":63468,"max_rank":64767,"count":220},"489":{"min_rank":64773,"max_rank":66003,"count":226},"488":{"min_rank":66012,"max_rank":67252,"count":256},"487":{"min_rank":67255,"max_rank":68514,"count":244},"486":{"min_rank":68517,"max_rank":69809,"count":224},"485":{"min_rank":69840,"max_rank":71268,"count":241},"484":{"min_rank":71273,"max_rank":72570,"count":245},"483":{"min_rank":72584,"max_rank":73855,"count":228},"482":{"min_rank":73878,"max_rank":75233,"count":260},"481":{"min_rank":75239,"max_rank":76611,"count":306},"480":{"min_rank":76618,"max_rank":78072,"count":287},"479":{"min_rank":78077,"max_rank":79393,"count":246},"478":{"min_rank":79398,"max_rank":80812,"count":268},"477":{"min_rank":80817,"max_rank":82134,"count":243},"476":{"min_rank":82139,"max_rank":83459,"count":260},"475":{"min_rank":83485,"max_rank":85027,"count":290},"474":{"min_rank":85033,"max_rank":86413,"count":284},"473":{"min_rank":86423,"max_rank":87782,"count":270},"472":{"min_rank":87820,"max_rank":89233,"count":247},"471":{"min_rank":89250,"max_rank":90696,"count":252},"470":{"min_rank":90702,"max_rank":92218,"count":288},"469":{"min_rank":92221,"max_rank":93606,"count":253},"468":{"min_rank":93624,"max_rank":95047,"count":282},"467":{"min_rank":95053,"max_rank":96456,"count":255},"466":{"min_rank":96482,"max_rank":97938,"count":270},"465":{"min_rank":97947,"max_rank":99549,"count":294},"464":{"min_rank":99561,"max_rank":100994,"count":279},"463":{"min_rank":101002,"max_rank":102476,"count":276},"462":{"min_rank":102514,"max_rank":103975,"count":286},"461":{"min_rank":103988,"max_rank":105457,"count":275},"460":{"min_rank":105465,"max_rank":107004,"count":294},"459":{"min_rank":107006,"max_rank":108482,"count":264},"458":{"min_rank":108506,"max_rank":110033,"count":288},"457":{"min_rank":110037,"max_rank":111562,"count":267},"456":{"min_rank":111570,"max_rank":113125,"count":303},"455":{"min_rank":113133,"max_rank":114835,"count":316},"454":{"min_rank":114836,"max_rank":116375,"count":291},"453":{"min_rank":116384,"max_rank":117910,"count":309},"452":{"min_rank":117913,"max_rank":119448,"count":272},"451":{"min_rank":119452,"max_rank":120982,"count":296},"450":{"min_rank":121019,"max_rank":122742,"count":328},"449":{"min_rank":122751,"max_rank":124341,"count":296},"448":{"min_rank":124353,"max_rank":125922,"count":318},"447":{"min_rank":125945,"max_rank":127556,"count":278},"446":{"min_rank":127564,"max_rank":129161,"count":330},"445":{"min_rank":129192,"max_rank":130839,"count":294},"444":{"min_rank":130852,"max_rank":132427,"count":329},"443":{"min_rank":132447,"max_rank":133963,"count":274},"442":{"min_rank":133969,"max_rank":135541,"count":346},"441":{"min_rank":135560,"max_rank":137248,"count":322},"440":{"min_rank":137259,"max_rank":139052,"count":328},"439":{"min_rank":139063,"max_rank":140682,"count":316},"438":{"min_rank":140688,"max_rank":142315,"count":293},"437":{"min_rank":142322,"max_rank":143916,"count":303},"436":{"min_rank":143930,"max_rank":145637,"count":266},"435":{"min_rank":145643,"max_rank":147501,"count":354},"434":{"min_rank":147506,"max_rank":149182,"count":341},"433":{"min_rank":149191,"max_rank":150858,"count":346},"432":{"min_rank":150866,"max_rank":152510,"count":343},"431":{"min_rank":152521,"max_rank":154205,"count":318},"430":{"min_rank":154218,"max_rank":156123,"count":404},"429":{"min_rank":156135,"max_rank":157820,"count":337},"428":{"min_rank":157823,"max_rank":159542,"count":333},"427":{"min_rank":159554,"max_rank":161245,"count":336},"426":{"min_rank":161270,"max_rank":162965,"count":330},"425":{"min_rank":162973,"max_rank":164883,"count":368},"424":{"min_rank":164892,"max_rank":166548,"count":342},"423":{"min_rank":166580,"max_rank":168334,"count":367},"422":{"min_rank":168345,"max_rank":170154,"count":373},"421":{"min_rank":170161,"max_rank":171897,"count":318},"420":{"min_rank":171911,"max_rank":173822,"count":340},"419":{"min_rank":173833,"max_rank":175674,"count":370},"418":{"min_rank":175685,"max_rank":177442,"count":359},"417":{"min_rank":177447,"max_rank":179293,"count":332},"416":{"min_rank":179296,"max_rank":181147,"count":362},"415":{"min_rank":181167,"max_rank":183048,"count":349},"414":{"min_rank":183058,"max_rank":184835,"count":347},"413":{"min_rank":184841,"max_rank":186587,"count":319},"412":{"min_rank":186598,"max_rank":188392,"count":329},"411":{"min_rank":188398,"max_rank":190194,"count":345},"410":{"min_rank":190198,"max_rank":192143,"count":388},"409":{"min_rank":192188,"max_rank":194011,"count":363},"408":{"min_rank":194048,"max_rank":195907,"count":356},"407":{"min_rank":195913,"max_rank":197809,"count":372},"406":{"min_rank":197817,"max_rank":199628,"count":347},"405":{"min_rank":199658,"max_rank":201668,"count":391},"404":{"min_rank":201686,"max_rank":203547,"count":395},"403":{"min_rank":203553,"max_rank":205474,"count":338},"402":{"min_rank":205476,"max_rank":207303,"count":379},"401":{"min_rank":207308,"max_rank":209251,"count":373},"400":{"min_rank":209262,"max_rank":211355,"count":406},"399":{"min_rank":211364,"max_rank":213329,"count":383},"398":{"min_rank":213342,"max_rank":215225,"count":355},"397":{"min_rank":215238,"max_rank":217112,"count":350},"396":{"min_rank":217117,"max_rank":219056,"count":341},"395":{"min_rank":219057,"max_rank":221165,"count":377},"394":{"min_rank":221173,"max_rank":223043,"count":348},"393":{"min_rank":223067,"max_rank":225009,"count":373},"392":{"min_rank":225019,"max_rank":226905,"count":355},"391":{"min_rank":226930,"max_rank":228920,"count":361},"390":{"min_rank":228935,"max_rank":230974,"count":348},"389":{"min_rank":230986,"max_rank":232948,"count":332},"388":{"min_rank":232965,"max_rank":234920,"count":370},"387":{"min_rank":234929,"max_rank":236938,"count":392},"386":{"min_rank":236948,"max_rank":238955,"count":352},"385":{"min_rank":238957,"max_rank":241201,"count":379},"384":{"min_rank":241218,"max_rank":243218,"count":359},"383":{"min_rank":243236,"max_rank":245291,"count":386},"382":{"min_rank":245300,"max_rank":247268,"count":384},"381":{"min_rank":247286,"max_rank":249343,"count":372},"380":{"min_rank":249357,"max_rank":251657,"count":431},"379":{"min_rank":251691,"max_rank":253668,"count":338},"378":{"min_rank":253676,"max_rank":255689,"count":377},"377":{"min_rank":255702,"max_rank":257778,"count":349},"376":{"min_rank":257795,"max_rank":259961,"count":396},"375":{"min_rank":259975,"max_rank":262182,"count":407},"374":{"min_rank":262227,"max_rank":264249,"count":360},"373":{"min_rank":264258,"max_rank":266347,"count":379},"372":{"min_rank":266362,"max_rank":268464,"count":377},"371":{"min_rank":268465,"max_rank":270616,"count":428},"370":{"min_rank":270623,"max_rank":272932,"count":415},"369":{"min_rank":272987,"max_rank":274977,"count":378},"368":{"min_rank":275003,"max_rank":277105,"count":414},"367":{"min_rank":277128,"max_rank":279259,"count":379},"366":{"min_rank":279285,"max_rank":281407,"count":351},"365":{"min_rank":281411,"max_rank":283633,"count":389},"364":{"min_rank":283638,"max_rank":285768,"count":368},"363":{"min_rank":285809,"max_rank":287968,"count":386},"362":{"min_rank":287975,"max_rank":290089,"count":390},"361":{"min_rank":290106,"max_rank":292345,"count":389},"360":{"min_rank":292361,"max_rank":294823,"count":381},"359":{"min_rank":294827,"max_rank":296942,"count":381},"358":{"min_rank":296947,"max_rank":299043,"count":333},"357":{"min_rank":299051,"max_rank":301137,"count":381},"356":{"min_rank":301164,"max_rank":303493,"count":398},"355":{"min_rank":303506,"max_rank":305849,"count":404},"354":{"min_rank":305881,"max_rank":308042,"count":380},"353":{"min_rank":308063,"max_rank":310244,"count":334},"352":{"min_rank":310258,"max_rank":312494,"count":397},"351":{"min_rank":312518,"max_rank":314833,"count":396},"350":{"min_rank":314851,"max_rank":317242,"count":392},"349":{"min_rank":317250,"max_rank":319508,"count":364},"348":{"min_rank":319530,"max_rank":321808,"count":388},"347":{"min_rank":321845,"max_rank":323989,"count":370},"346":{"min_rank":324010,"max_rank":326305,"count":367},"345":{"min_rank":326337,"max_rank":328860,"count":448},"344":{"min_rank":328891,"max_rank":331252,"count":396},"343":{"min_rank":331274,"max_rank":333530,"count":362},"342":{"min_rank":333551,"max_rank":335895,"count":410},"341":{"min_rank":335921,"max_rank":338315,"count":418},"340":{"min_rank":338322,"max_rank":340995,"count":403},"339":{"min_rank":341002,"max_rank":343305,"count":347},"338":{"min_rank":343317,"max_rank":345596,"count":376},"337":{"min_rank":345621,"max_rank":347975,"count":367},"336":{"min_rank":347981,"max_rank":350404,"count":412},"335":{"min_rank":350415,"max_rank":352995,"count":400},"334":{"min_rank":353022,"max_rank":355402,"count":372},"333":{"min_rank":355414,"max_rank":357775,"count":362},"332":{"min_rank":357779,"max_rank":360123,"count":367},"331":{"min_rank":360170,"max_rank":362562,"count":369},"330":{"min_rank":362573,"max_rank":365196,"count":413},"329":{"min_rank":365231,"max_rank":367631,"count":338},"328":{"min_rank":367642,"max_rank":370154,"count":387},"327":{"min_rank":370168,"max_rank":372538,"count":380},"326":{"min_rank":372555,"max_rank":375016,"count":399},"325":{"min_rank":375035,"max_rank":377808,"count":406},"324":{"min_rank":377822,"max_rank":380353,"count":406},"323":{"min_rank":380366,"max_rank":382896,"count":407},"322":{"min_rank":382910,"max_rank":385464,"count":398},"321":{"min_rank":385465,"max_rank":388023,"count":378},"320":{"min_rank":388057,"max_rank":390792,"count":384},"319":{"min_rank":390819,"max_rank":393301,"count":392},"318":{"min_rank":393320,"max_rank":395792,"count":366},"317":{"min_rank":395804,"max_rank":398340,"count":396},"316":{"min_rank":398357,"max_rank":400942,"count":411},"315":{"min_rank":400958,"max_rank":403838,"count":456},"314":{"min_rank":403862,"max_rank":406374,"count":396},"313":{"min_rank":406408,"max_rank":408880,"count":371},"312":{"min_rank":408890,"max_rank":411470,"count":390},"311":{"min_rank":411476,"max_rank":414134,"count":410},"310":{"min_rank":414177,"max_rank":417070,"count":431},"309":{"min_rank":417082,"max_rank":419760,"count":383},"308":{"min_rank":419774,"max_rank":422379,"count":423},"307":{"min_rank":422388,"max_rank":424991,"count":412},"306":{"min_rank":425013,"max_rank":427684,"count":389},"305":{"min_rank":427717,"max_rank":430786,"count":444},"304":{"min_rank":430806,"max_rank":433468,"count":370},"303":{"min_rank":433520,"max_rank":436097,"count":386},"302":{"min_rank":436101,"max_rank":438936,"count":403},"301":{"min_rank":438979,"max_rank":441766,"count":411},"300":{"min_rank":441779,"max_rank":444913,"count":463},"299":{"min_rank":444917,"max_rank":447606,"count":390},"298":{"min_rank":447617,"max_rank":450237,"count":381},"297":{"min_rank":450262,"max_rank":453079,"count":391},"296":{"min_rank":453117,"max_rank":455961,"count":378},"295":{"min_rank":455967,"max_rank":459152,"count":422},"294":{"min_rank":459174,"max_rank":462009,"count":375},"293":{"min_rank":462031,"max_rank":464823,"count":388},"292":{"min_rank":464851,"max_rank":467677,"count":393},"291":{"min_rank":467697,"max_rank":470578,"count":403},"290":{"min_rank":470599,"max_rank":473872,"count":455},"289":{"min_rank":473900,"max_rank":476758,"count":399},"288":{"min_rank":476760,"max_rank":479570,"count":420},"287":{"min_rank":479632,"max_rank":482603,"count":367},"286":{"min_rank":482614,"max_rank":485574,"count":394},"285":{"min_rank":485592,"max_rank":489005,"count":418},"284":{"min_rank":489040,"max_rank":491847,"count":364},"283":{"min_rank":491853,"max_rank":494705,"count":374},"282":{"min_rank":494723,"max_rank":497628,"count":413},"281":{"min_rank":497660,"max_rank":500707,"count":402},"280":{"min_rank":500732,"max_rank":504210,"count":436},"279":{"min_rank":504233,"max_rank":507139,"count":368},"278":{"min_rank":507151,"max_rank":510145,"count":384},"277":{"min_rank":510171,"max_rank":513231,"count":430},"276":{"min_rank":513286,"max_rank":516361,"count":381},"275":{"min_rank":516378,"max_rank":519804,"count":445},"274":{"min_rank":519825,"max_rank":522893,"count":402},"273":{"min_rank":522913,"max_rank":526010,"count":398},"272":{"min_rank":526034,"max_rank":529080,"count":388},"271":{"min_rank":529095,"max_rank":532296,"count":400},"270":{"min_rank":532311,"max_rank":536039,"count":448},"269":{"min_rank":536091,"max_rank":539232,"count":392},"268":{"min_rank":539248,"max_rank":542314,"count":393},"267":{"min_rank":542328,"max_rank":545390,"count":385},"266":{"min_rank":545457,"max_rank":548677,"count":403},"265":{"min_rank":548683,"max_rank":552330,"count":451},"264":{"min_rank":552390,"max_rank":555524,"count":401},"263":{"min_rank":555560,"max_rank":558780,"count":391},"262":{"min_rank":558786,"max_rank":561881,"count":377},"261":{"min_rank":561898,"max_rank":565248,"count":422},"260":{"min_rank":565293,"max_rank":569053,"count":447},"259":{"min_rank":569086,"max_rank":572451,"count":411},"258":{"min_rank":572483,"max_rank":575716,"count":385},"257":{"min_rank":575723,"max_rank":578890,"count":352},"256":{"min_rank":578915,"max_rank":582256,"count":408},"255":{"min_rank":582269,"max_rank":586082,"count":425},"254":{"min_rank":586146,"max_rank":589381,"count":400},"253":{"min_rank":589422,"max_rank":592790,"count":429},"252":{"min_rank":592810,"max_rank":596232,"count":383},"251":{"min_rank":596238,"max_rank":599716,"count":409},"250":{"min_rank":599758,"max_rank":603758,"count":422},"249":{"min_rank":603782,"max_rank":607211,"count":407},"248":{"min_rank":607241,"max_rank":610694,"count":404},"247":{"min_rank":610730,"max_rank":614128,"count":391},"246":{"min_rank":614139,"max_rank":617644,"count":387},"245":{"min_rank":617660,"max_rank":621619,"count":425},"244":{"min_rank":621647,"max_rank":624968,"count":362},"243":{"min_rank":624996,"max_rank":628398,"count":403},"242":{"min_rank":628409,"max_rank":631895,"count":395},"241":{"min_rank":631901,"max_rank":635452,"count":426},"240":{"min_rank":635493,"max_rank":639706,"count":479},"239":{"min_rank":639737,"max_rank":643259,"count":407},"238":{"min_rank":643268,"max_rank":646876,"count":412},"237":{"min_rank":646931,"max_rank":650493,"count":402},"236":{"min_rank":650510,"max_rank":654168,"count":383},"235":{"min_rank":654179,"max_rank":658457,"count":442},"234":{"min_rank":658474,"max_rank":662166,"count":394},"233":{"min_rank":662179,"max_rank":665783,"count":369},"232":{"min_rank":665804,"max_rank":669380,"count":385},"231":{"min_rank":669412,"max_rank":673215,"count":430},"230":{"min_rank":673232,"max_rank":677598,"count":425},"229":{"min_rank":677608,"max_rank":681444,"count":398},"228":{"min_rank":681467,"max_rank":685304,"count":412},"227":{"min_rank":685313,"max_rank":689105,"count":387},"226":{"min_rank":689119,"max_rank":693133,"count":420},"225":{"min_rank":693148,"max_rank":697700,"count":476},"224":{"min_rank":697723,"max_rank":701373,"count":404},"223":{"min_rank":701413,"max_rank":705274,"count":423},"222":{"min_rank":705287,"max_rank":709229,"count":422},"221":{"min_rank":709263,"max_rank":713146,"count":425},"220":{"min_rank":713159,"max_rank":717742,"count":440},"219":{"min_rank":717759,"max_rank":721689,"count":398},"218":{"min_rank":721709,"max_rank":725539,"count":400},"217":{"min_rank":725570,"max_rank":729505,"count":387},"216":{"min_rank":729522,"max_rank":733518,"count":436},"215":{"min_rank":733557,"max_rank":738252,"count":444},"214":{"min_rank":738255,"max_rank":742252,"count":400},"213":{"min_rank":742259,"max_rank":746104,"count":392},"212":{"min_rank":746148,"max_rank":750154,"count":438},"211":{"min_rank":750201,"max_rank":754475,"count":437},"210":{"min_rank":754513,"max_rank":759375,"count":432},"209":{"min_rank":759385,"max_rank":763575,"count":412},"208":{"min_rank":763578,"max_rank":767603,"count":395},"207":{"min_rank":767609,"max_rank":771688,"count":359},"206":{"min_rank":771737,"max_rank":776001,"count":394},"205":{"min_rank":776005,"max_rank":781162,"count":467},"204":{"min_rank":781182,"max_rank":785304,"count":357},"203":{"min_rank":785340,"max_rank":789410,"count":413},"202":{"min_rank":789472,"max_rank":793646,"count":397},"201":{"min_rank":793658,"max_rank":798089,"count":431},"200":{"min_rank":798090,"max_rank":803308,"count":426},"199":{"min_rank":803331,"max_rank":807505,"count":426},"198":{"min_rank":807517,"max_rank":811857,"count":380},"197":{"min_rank":811863,"max_rank":816227,"count":387},"196":{"min_rank":816288,"max_rank":820616,"count":350},"195":{"min_rank":820640,"max_rank":825926,"count":444},"194":{"min_rank":825931,"max_rank":830221,"count":364},"193":{"min_rank":830336,"max_rank":834723,"count":410},"192":{"min_rank":834731,"max_rank":839249,"count":405},"191":{"min_rank":839276,"max_rank":843850,"count":374},"190":{"min_rank":843888,"max_rank":849477,"count":461},"189":{"min_rank":849536,"max_rank":854038,"count":404},"188":{"min_rank":854061,"max_rank":858633,"count":367},"187":{"min_rank":858647,"max_rank":863249,"count":361},"186":{"min_rank":863319,"max_rank":867979,"count":374},"185":{"min_rank":868002,"max_rank":873807,"count":469},"184":{"min_rank":873866,"max_rank":878485,"count":398},"183":{"min_rank":878505,"max_rank":883174,"count":416},"182":{"min_rank":883192,"max_rank":887831,"count":398},"181":{"min_rank":887882,"max_rank":892841,"count":394},"180":{"min_rank":892866,"max_rank":898897,"count":450},"179":{"min_rank":898918,"max_rank":903668,"count":370},"178":{"min_rank":903685,"max_rank":908351,"count":370},"177":{"min_rank":908392,"max_rank":913106,"count":376},"176":{"min_rank":913176,"max_rank":918110,"count":407},"175":{"min_rank":918119,"max_rank":924440,"count":501},"174":{"min_rank":924456,"max_rank":929191,"count":398},"173":{"min_rank":929206,"max_rank":934015,"count":371},"172":{"min_rank":934053,"max_rank":939097,"count":390},"171":{"min_rank":939133,"max_rank":944184,"count":391},"170":{"min_rank":944210,"max_rank":950620,"count":511},"169":{"min_rank":950629,"max_rank":955589,"count":399},"168":{"min_rank":955593,"max_rank":960558,"count":423},"167":{"min_rank":960572,"max_rank":965644,"count":429},"166":{"min_rank":965675,"max_rank":970923,"count":386},"165":{"min_rank":970986,"max_rank":977717,"count":483},"164":{"min_rank":977744,"max_rank":982932,"count":412},"163":{"min_rank":982950,"max_rank":988032,"count":435},"162":{"min_rank":988060,"max_rank":993369,"count":387},"161":{"min_rank":993392,"max_rank":998948,"count":444},"160":{"min_rank":998977,"max_rank":1005892,"count":500},"159":{"min_rank":1005904,"max_rank":1011173,"count":409},"158":{"min_rank":1011224,"max_rank":1016523,"count":400},"157":{"min_rank":1016545,"max_rank":1021924,"count":419},"156":{"min_rank":1021933,"max_rank":1027539,"count":411},"155":{"min_rank":1027554,"max_rank":1034816,"count":507},"154":{"min_rank":1034833,"max_rank":1040149,"count":422},"153":{"min_rank":1040171,"max_rank":1045700,"count":391},"152":{"min_rank":1045721,"max_rank":1051290,"count":412},"151":{"min_rank":1051351,"max_rank":1057104,"count":407},"150":{"min_rank":1057118,"max_rank":1064610,"count":552},"149":{"min_rank":1064666,"max_rank":1070222,"count":435},"148":{"min_rank":1070261,"max_rank":1075776,"count":390},"147":{"min_rank":1075832,"max_rank":1081454,"count":392},"146":{"min_rank":1081504,"max_rank":1087424,"count":455},"145":{"min_rank":1087483,"max_rank":1095474,"count":528},"144":{"min_rank":1095517,"max_rank":1101127,"count":388},"143":{"min_rank":1101156,"max_rank":1106915,"count":344},"142":{"min_rank":1106950,"max_rank":1112724,"count":322},"141":{"min_rank":1112767,"max_rank":1118906,"count":344},"140":{"min_rank":1118941,"max_rank":1127287,"count":452},"139":{"min_rank":1127312,"max_rank":1133178,"count":339},"138":{"min_rank":1133250,"max_rank":1139097,"count":349},"137":{"min_rank":1139121,"max_rank":1145192,"count":343},"136":{"min_rank":1145248,"max_rank":1151575,"count":351},"135":{"min_rank":1151598,"max_rank":1160385,"count":493},"134":{"min_rank":1160439,"max_rank":1166537,"count":336},"133":{"min_rank":1166553,"max_rank":1172685,"count":367},"132":{"min_rank":1172723,"max_rank":1178970,"count":343},"131":{"min_rank":1179012,"max_rank":1185717,"count":369},"130":{"min_rank":1185733,"max_rank":1194851,"count":460},"129":{"min_rank":1194970,"max_rank":1201169,"count":340},"128":{"min_rank":1201227,"max_rank":1207467,"count":332},"127":{"min_rank":1207521,"max_rank":1213918,"count":358},"126":{"min_rank":1213946,"max_rank":1220665,"count":364},"125":{"min_rank":1220690,"max_rank":1230453,"count":515},"124":{"min_rank":1230462,"max_rank":1236976,"count":384},"123":{"min_rank":1237032,"max_rank":1243400,"count":354},"122":{"min_rank":1243460,"max_rank":1250317,"count":395},"121":{"min_rank":1250381,"max_rank":1257303,"count":374},"120":{"min_rank":1257337,"max_rank":1267439,"count":516},"119":{"min_rank":1267463,"max_rank":1273969,"count":344},"118":{"min_rank":1274071,"max_rank":1280819,"count":354},"117":{"min_rank":1280861,"max_rank":1287605,"count":360},"116":{"min_rank":1287619,"max_rank":1294911,"count":395},"115":{"min_rank":1294939,"max_rank":1305549,"count":523},"114":{"min_rank":1305579,"max_rank":1312435,"count":390},"113":{"min_rank":1312496,"max_rank":1319420,"count":388},"112":{"min_rank":1319521,"max_rank":1325368,"count":21},"111":{"min_rank":1327214,"max_rank":1333567,"count":17},"110":{"min_rank":1335142,"max_rank":1345273,"count":43},"109":{"min_rank":1346320,"max_rank":1352445,"count":33},"108":{"min_rank":1354167,"max_rank":1359685,"count":30},"107":{"min_rank":1360668,"max_rank":1366624,"count":33},"106":{"min_rank":1367257,"max_rank":1374556,"count":42},"105":{"min_rank":1375662,"max_rank":1386529,"count":40},"104":{"min_rank":1386888,"max_rank":1393661,"count":45},"103":{"min_rank":1394488,"max_rank":1400555,"count":26},"102":{"min_rank":1401605,"max_rank":1408554,"count":33},"101":{"min_rank":1409105,"max_rank":1416300,"count":21},"100":{"min_rank":1417131,"max_rank":1428665,"count":35}};
const RANK_SCORES = Object.keys(RANK_DATA).map(Number).sort((a,b) => b - a);

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const [studentRank, setStudentRank] = useState(null);
  const [studentScore, setStudentScore] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [collegesList, setCollegesList] = useState([]);
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [docCategory, setDocCategory] = useState('General');
  const [docQuota, setDocQuota] = useState('State');
  const [studentCategory, setStudentCategory] = useState(null); // null = not yet set from token
  const [currentToken, setCurrentToken] = useState('');

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyL1UC5_EGNPKZcitbkQ38HOnKzgj5ObTZGroPcH0kpyHtjY-SpYYtyl3_jH0-rUR-x/exec';

  // Counsellor
  const [counsellorName, setCounsellorName] = useState('ASMI Counsellor');
  const [counsellorWhatsapp, setCounsellorWhatsapp] = useState('917410019074');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [counsellorBranch, setCounsellorBranch] = useState('ASMI Career Network');
  const [progressSteps, setProgressSteps] = useState([
    { id: 1, label: 'Profile',     status: 'completed' },
    { id: 2, label: 'Counselling', status: 'active' },
    { id: 3, label: 'Shortlist',   status: 'pending' },
    { id: 4, label: 'Admission',   status: 'pending' }
  ]);

  // Rank Predictor
  const [predictorScore, setPredictorScore] = useState('');
  const [predictedRank, setPredictedRank] = useState(null);

  // College Predictor — shared
  const [cpInputMode, setCpInputMode] = useState('rank');

  // College Predictor — rank tab (full Cutoff Explorer logic)
  const [cpRankInput, setCpRankInput] = useState('');
  const [cpSelectedStates, setCpSelectedStates] = useState([]);  // multi-select
  const [cpStateSearch, setCpStateSearch] = useState('');
  const [cpSelectedTypes, setCpSelectedTypes] = useState([]);    // multi-select
  const [cpQuota, setCpQuota] = useState('All');
  const [cpMaxBudget, setCpMaxBudget] = useState(3000000);
  const [cpSortBy, setCpSortBy] = useState('chance');            // chance | fees_asc | fees_desc | name
  const [cpSearchFilter, setCpSearchFilter] = useState('');

  // College Predictor — score tab
  const [cpScoreInput, setCpScoreInput] = useState('');
  const [cpState, setCpState] = useState('All');
  const [cpScoreState, setCpScoreState] = useState('All');
  const [cpScoreSort, setCpScoreSort] = useState('chance');
  const [cpCategory, setCpCategory] = useState('Open');
  const [cpScoreCourse, setCpScoreCourse] = useState('MBBS');

  // Cutoff Explorer
  const [ceViewMode, setCeViewMode] = useState('database');
  const [ceCollegeSearch, setCeCollegeSearch] = useState('');
  const [ceState, setCeState] = useState('All');
  const [ceSingleCollege, setCeSingleCollege] = useState('');

  // Institutes
  const [instSearch, setInstSearch] = useState('');
  const [instStateSearch, setInstStateSearch] = useState('');
  const [instSelectedStates, setInstSelectedStates] = useState([]);
  const [instType, setInstType] = useState('All');
  const [instCourse, setInstCourse] = useState('All');
  const [instSortBy, setInstSortBy] = useState('Recommended');
  const [instMaxFees, setInstMaxFees] = useState(3000000);
  const [instTabType, setInstTabType] = useState('All');

  // Score DB
  const [asmiDb, setAsmiDb] = useState(null);
  const [feeMap, setFeeMap] = useState({});
  const [cpPoolFilter, setCpPoolFilter] = useState('All');
  const [cpTypeFilter, setCpTypeFilter] = useState('All');
  const [cutoffDbData, setCutoffDbData] = useState([]);

  function getRankFromScore(score) {
    if (RANK_DATA[score]) return RANK_DATA[score];
    const above = RANK_SCORES.find(x => x <= score);
    const below = [...RANK_SCORES].reverse().find(x => x >= score);
    if (!above && !below) return null;
    if (!above) return RANK_DATA[below];
    if (!below) return RANK_DATA[above];
    const ratio = (score - below) / (above - below);
    return {
      min_rank: Math.round(RANK_DATA[above].min_rank + (RANK_DATA[below].min_rank - RANK_DATA[above].min_rank) * (1 - ratio)),
      max_rank: Math.round(RANK_DATA[above].max_rank + (RANK_DATA[below].max_rank - RANK_DATA[above].max_rank) * (1 - ratio))
    };
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);

      if (localStorage.getItem('sidebar_collapsed')) setSidebarCollapsed(true);
      setStudentName(localStorage.getItem('name') || 'Student');
      const savedRank = localStorage.getItem('rank');
      if (savedRank) setStudentRank(parseInt(savedRank, 10));
      const savedScore = localStorage.getItem('score');
      if (savedScore) setStudentScore(parseInt(savedScore, 10));

      try {
        const sList = JSON.parse(localStorage.getItem('shortlist')) || [];
        setShortlist(sList.map(c => typeof c === 'object' ? c.name : c));
      } catch(e) {}

      try {
        const saved = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
        setCheckedDocs(new Set(saved.checked || []));
        setDocCategory(saved.category || 'General');
        setDocQuota(saved.quota || 'State');
      } catch(e) {}

      // params already defined at top of useEffect
      const token = params.get('token');
      if (token && token.trim() !== '') {
        setCurrentToken(token);
        fetch(`${APPS_SCRIPT_URL}?action=getStudent&token=${encodeURIComponent(token)}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              const s = res.data;
              console.log('[ASMI] student data:', s);
              if (s.name) { setStudentName(s.name); localStorage.setItem('name', s.name); }
              const rawRank = s.rank || s.neet_rank || s.air;
              const rawScore = s.score || s.neet_score;
              const parsedRank = (rawRank && rawRank !== 0) ? parseInt(rawRank, 10) : null;
              const parsedScore = (rawScore && rawScore !== 0) ? parseInt(rawScore, 10) : null;
              if (parsedRank)  { setStudentRank(parsedRank);   localStorage.setItem('rank', parsedRank); }
              if (parsedScore) { setStudentScore(parsedScore); localStorage.setItem('score', parsedScore); setCpScoreInput(String(parsedScore)); }
              if (s.colleges || s.shortlist) {
                const sl = (s.colleges || s.shortlist || []).map(c => typeof c === 'object' ? c.name : c);
                setShortlist(sl); localStorage.setItem('shortlist', JSON.stringify(sl));
              }
              if (s.category) {
                const cat = String(s.category).toUpperCase();
                const resolvedCat = cat.includes('OBC') ? 'OBC'
                  : cat.includes('SC') ? 'SC'
                  : cat.includes('ST') ? 'ST'
                  : cat.includes('EWS') ? 'EWS'
                  : 'General';
                setDocCategory(resolvedCat);
                setStudentCategory(resolvedCat);
                try {
                  const saved = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
                  localStorage.setItem('asmi-checklist', JSON.stringify({ ...saved, category: resolvedCat }));
                } catch(e) {}
              }
              if (s.quota) {
                const q = String(s.quota).toUpperCase();
                setDocQuota(
                  q.includes('AIQ') ? 'AIQ'
                  : (q.includes('MQ') || q.includes('MANAGEMENT') || q.includes('NRI')) ? 'Management'
                  : 'State'
                );
              }
              if (s.stage) {
                const stages = ["Enrolled", "Documents Verified", "Counselled", "Preferences Filed", "Round 1", "Allotted"];
                const idx = stages.findIndex(st => st.toLowerCase() === String(s.stage).toLowerCase().trim());
                if (idx !== -1) {
                  setProgressSteps(stages.map((st, i) => ({
                    id: i + 1, label: st,
                    status: i < idx ? 'completed' : (i === idx ? 'active' : 'pending')
                  })));
                }
              }
              const cName = s.counsellor_name || s.counsellorName || s.counselor_name || s.counselorName;
              if (cName) setCounsellorName(cName);
              const cWa = s.counsellor_whatsapp || s.counsellorWhatsapp || s.counselor_whatsapp || s.counselorWhatsapp;
              if (cWa) setCounsellorWhatsapp(String(cWa));
              const wGroup = s.whatsapp_group_link || s.whatsappGroupLink || s.whatsapp_group;
              if (wGroup) setWhatsappGroupLink(wGroup);
              setCounsellorBranch(getBranchFromToken(token));

              // Restore document checklist from sheet (source of truth for cross-device sync)
              const rawDocStatus = s.document_status || s.documentStatus || s.doc_status;
              if (rawDocStatus) {
                try {
                  const parsed = typeof rawDocStatus === 'string' ? JSON.parse(rawDocStatus) : rawDocStatus;
                  if (parsed.checked) {
                    const restored = new Set(parsed.checked);
                    setCheckedDocs(restored);
                    localStorage.setItem('asmi-checklist', JSON.stringify({
                      checked: Array.from(restored),
                      category: parsed.category || docCategory,
                      quota: parsed.quota || docQuota,
                    }));
                  }
                } catch(e) { console.warn('Doc status parse failed:', e); }
              }
            }
          }).catch(err => console.warn('Profile fetch failed:', err));
      }
    }

    fetch('/data/events.json')
      .then(r => r.json())
      .then(data => {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const isExpired = (ev) => {
          // Result entries stay visible regardless of date
          if (ev.title && ev.title.toLowerCase().includes('result')) return false;
          const targetDate = new Date(ev.expiry_date || ev.date);
          return targetDate < todayMidnight;
        };
        setDeadlines(
          data
            .filter(ev => !isExpired(ev))
            .map(ev => ({ title: ev.title, date: ev.date, tag: ev.tag || 'NOTICE' }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      }).catch(() => {});

    fetch('/data/rank_db.json').then(r => r.json()).then(setCollegeData).catch(() => {});
    fetch('/data/colleges.json').then(r => r.json()).then(setCollegesList).catch(() => {});
    fetch('/data/asmi_db.json').then(r => r.json()).then(setAsmiDb).catch(() => {});
    fetch('/fee_map.json').then(r => r.json()).then(setFeeMap).catch(() => {});
  }, []);

  useEffect(() => {
    const mccCatKey = (!studentCategory || studentCategory === 'General') ? 'OPEN' : studentCategory.toUpperCase();
    const mhCatDir  = mccCatKey;

    const computeClosingRank = (rounds) => Math.max(
      rounds?.['Round 1']?.AIR ?? 0,
      rounds?.['Round 2']?.AIR ?? 0,
      rounds?.['Round 3']?.AIR ?? 0
    );

    const tryFetch = async (url, fallbackUrl) => {
      try {
        let res = await fetch(url);
        if (!res.ok && fallbackUrl) res = await fetch(fallbackUrl);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    };

    const loadCutoffData = async () => {
      const entries = [];

      const mccTypes = [
        { key: 'GOVT_MBBS',    type: 'Government' },
        { key: 'AIIMS_MBBS',   type: 'AIIMS'      },
        { key: 'JIPMER_MBBS',  type: 'Government' },
        { key: 'CENTRAL_MBBS', type: 'Government' },
        { key: 'DEEMED_MBBS',  type: 'Deemed'     },
      ];
      await Promise.all(mccTypes.map(async (t) => {
        const data = await tryFetch(
          `/data/cutoffs/MCC/2025/${t.key}/${mccCatKey}.json`,
          `/data/cutoffs/MCC/2025/${t.key}/OPEN.json`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: c.state || '', closingRank, fees: c.fees || '', type: t.type, pool: 'MCC AIQ', quota: 'AIQ' });
        }
      }));

      const mhTypes = [
        { key: 'GOVT_MBBS',    type: 'Government' },
        { key: 'PRIVATE_MBBS', type: 'Private'    },
      ];
      await Promise.all(mhTypes.map(async (t) => {
        const data = await tryFetch(
          `/data/cutoffs/MH/2025/${t.key}/${mhCatDir}/GENERAL.json`,
          `/data/cutoffs/MH/2025/${t.key}/OPEN/GENERAL.json`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: 'Maharashtra', closingRank, fees: c.fees || '', type: t.type, pool: 'MH State', quota: 'State' });
        }
      }));

      const OPEN_STATES_DIRS = {
        Karnataka: 'Karnataka', Telangana: 'Telangana', Tamil_Nadu: 'Tamil Nadu',
        Uttar_Pradesh: 'Uttar Pradesh', Kerala: 'Kerala', Andhra_Pradesh: 'Andhra Pradesh',
        Haryana: 'Haryana', West_Bengal: 'West Bengal', Bihar: 'Bihar',
        Uttarakhand: 'Uttarakhand', Chhattisgarh: 'Chhattisgarh', Jharkhand: 'Jharkhand',
        Himachal_Pradesh: 'Himachal Pradesh', Pondicherry: 'Pondicherry',
        Manipur: 'Manipur', Meghalaya: 'Meghalaya', Sikkim: 'Sikkim'
      };
      await Promise.all(Object.entries(OPEN_STATES_DIRS).map(async ([stateDir, stateName]) => {
        const data = await tryFetch(`/data/cutoffs/OPEN/2025/${stateDir}/MQ.json`);
        if (!data?.colleges) return;
        const seen = new Map();
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0 && (!seen.has(c.name) || closingRank > seen.get(c.name).closingRank))
            seen.set(c.name, { name: c.name, state: stateName, closingRank, fees: c.fees || '', type: 'Private', pool: 'Open State', quota: 'Open State' });
        }
        entries.push(...seen.values());
      }));

      setCutoffDbData(entries);
    };

    loadCutoffData();
  }, [studentCategory]);

  // Checklist helpers
  const saveChecklist = (set, cat, quota) => {
    setCheckedDocs(set);
    const payload = { checked: Array.from(set), category: cat, quota };
    localStorage.setItem('asmi-checklist', JSON.stringify(payload));
    // Write to sheet for cross-device persistence (requires Apps Script action=saveDocStatus)
    if (currentToken) {
      fetch(`${APPS_SCRIPT_URL}?action=saveDocStatus&token=${encodeURIComponent(currentToken)}&data=${encodeURIComponent(JSON.stringify(payload))}`)
        .catch(() => {}); // silent fail — localStorage remains fallback
    }
  };

  const toggleDoc = (id) => {
    const next = new Set(checkedDocs);
    next.has(id) ? next.delete(id) : next.add(id);
    saveChecklist(next, docCategory, docQuota);
  };

  // Predictors
  const handlePredictRank = () => {
    const score = parseInt(predictorScore, 10);
    if (isNaN(score) || score < 200 || score > 720) { alert('Enter a valid NEET score between 200 and 720.'); return; }
    setPredictedRank(getRankFromScore(Math.max(100, score - 20)));
  };

  // ── Chance label (mirrors the live Cutoff Explorer tool) ──────────────────
  // High  = closing rank ≥ your rank * 1.10  (comfortable buffer)
  // Med   = closing rank ≥ your rank          (within range)
  // Low   = closing rank ≥ your rank * 0.92  (slight stretch, within 8%)
  // (records outside Low range are excluded from results)
  const getChance = (cutoff, rank) => {
    if (cutoff >= rank * 1.10) return { label: 'High',   cls: 'badge-safe',       sort: 0 };
    if (cutoff >= rank)        return { label: 'Med',    cls: 'badge-likely',     sort: 1 };
    if (cutoff >= rank * 0.92) return { label: 'Low',    cls: 'badge-borderline', sort: 2 };
    return null; // excluded
  };

  const getRankPredictedColleges = () => {
    const rank = parseInt(cpRankInput, 10);
    if (isNaN(rank) || rank < 1) return [];

    const parseAirFee = (f) => parseInt(String(f || '').replace(/[,\s]/g, ''), 10) || 0;
    let results = [];
    for (const c of cutoffDbData) {
      const cutoff = c.closingRank;
      if (!cutoff || cutoff === 0) continue;

      // Budget filter
      const feeRaw = parseAirFee(c.fees);
      if (feeRaw > 0 && feeRaw > cpMaxBudget) continue;

      // Quota filter
      if (cpQuota !== 'All' && c.quota !== cpQuota) continue;

      // Multi-state filter
      if (cpSelectedStates.length > 0 && !cpSelectedStates.includes(c.state)) continue;

      // Multi-type filter
      if (cpSelectedTypes.length > 0 && !cpSelectedTypes.includes(c.type)) continue;

      // Name search filter
      if (cpSearchFilter && !c.name.toLowerCase().includes(cpSearchFilter.toLowerCase())) continue;

      // Chance calc (excludes records beyond Low)
      const chance = getChance(cutoff, rank);
      if (!chance) continue;

      results.push({ ...c, closingRank: cutoff, chance: chance.label, chanceClass: chance.cls, chanceSort: chance.sort });
    }

    // Sort
    if (cpSortBy === 'chance')     results.sort((a, b) => a.chanceSort - b.chanceSort || a.closingRank - b.closingRank);
    else if (cpSortBy === 'rank')  results.sort((a, b) => a.closingRank - b.closingRank);
    else if (cpSortBy === 'fees_asc')  results.sort((a, b) => parseAirFee(a.fees) - parseAirFee(b.fees));
    else if (cpSortBy === 'fees_desc') results.sort((a, b) => parseAirFee(b.fees) - parseAirFee(a.fees));
    else if (cpSortBy === 'name')  results.sort((a, b) => a.name.localeCompare(b.name));

    return results;
  };

  const prob = (score, cutoff) => {
    const gap = score - (cutoff + 20);
    if (gap >= 15)  return { key: 'safe',       label: 'Safe',        cls: 'badge-safe' };
    if (gap >= 0)   return { key: 'likely',     label: 'Likely',      cls: 'badge-likely' };
    if (gap >= -10) return { key: 'borderline', label: 'Borderline',  cls: 'badge-borderline' };
    return                 { key: 'reach',      label: 'Out of Reach', cls: 'badge-reach' };
  };

  const getCategoryKeys = (category) => {
    const cat = category.toUpperCase();
    const m = {
      'OPEN': ['OPEN'],
      'GENERAL': ['OPEN'],
      'OBC': ['OBC', 'OPEN'],
      'SC': ['SC', 'OPEN'],
      'ST': ['ST', 'OPEN'],
      'EWS': ['EWS', 'OPEN'],
      'SEBC': ['SEBC', 'OPEN'],
      'VJ': ['VJ', 'OPEN'],
      'NT1': ['NT1', 'OPEN'],
      'NT2': ['NT2', 'OPEN'],
      'NT3': ['NT3', 'OPEN'],
      'IQ': ['IQ', 'OPEN']
    };
    return m[cat] || ['OPEN'];
  };

  const getMHCollegesList = (course, listType, userCat, score) => {
    if (!asmiDb || !asmiDb.MH || !asmiDb.MH[course]) return [];
    
    const openList = asmiDb.MH[course]?.OPEN?.[listType] || [];
    const catList = (userCat !== 'Open' && userCat !== 'General' && userCat !== 'IQ')
      ? (asmiDb.MH[course]?.[userCat.toUpperCase()]?.[listType] || [])
      : (userCat === 'IQ' && listType === 'mh_iq')
        ? (asmiDb.MH[course]?.IQ?.mh_iq || [])
        : [];
        
    const openMap = new Map(openList.map(c => [c.n, c.c]));
    const catMap = new Map(catList.map(c => [c.n, c.c]));
    const allNames = new Set([...openMap.keys(), ...catMap.keys()]);
    const cols = [];
    allNames.forEach(name => {
      const openC = openMap.has(name) ? openMap.get(name) : null;
      const catC = catMap.has(name) ? catMap.get(name) : null;
      const bestC = Math.min(openC ?? Infinity, catC ?? Infinity);
      if (bestC === Infinity) return;
      
      const p = prob(score, bestC);
      cols.push({
        name,
        openCutoff: openC,
        catCutoff: catC,
        cutoff: bestC,
        projected: bestC + 20,
        chance: p.label,
        chanceKey: p.key,
        chanceClass: p.cls,
        state: 'Maharashtra',
        pool: 'MH State',
        type: listType === 'mh_govt' ? 'Government' : 'Private'
      });
    });
    return cols;
  };

  const getMCCCollegesList = (course, userCat, score) => {
    const catKeyForList = (userCat !== 'Open' && userCat !== 'General')
      ? userCat.toUpperCase() : null;
    const results = [];

    const addColleges = (stateKey, courseKey, listType, type) => {
      if (!asmiDb || !asmiDb[stateKey] || !asmiDb[stateKey][courseKey]) return;
      const openList = asmiDb[stateKey][courseKey]['OPEN']?.[listType] || [];
      const catList = catKeyForList
        ? (asmiDb[stateKey][courseKey][catKeyForList]?.[listType] || [])
        : [];
      const openMap = new Map(openList.map(c => [c.n, c.c]));
      const catMap = new Map(catList.map(c => [c.n, c.c]));
      const stateMap = new Map([...openList, ...catList].map(c => [c.n, c.s || 'India']));
      const allNames = new Set([...openMap.keys(), ...catMap.keys()]);
      allNames.forEach(name => {
        const openC = openMap.has(name) ? openMap.get(name) : null;
        const catC = catMap.has(name) ? catMap.get(name) : null;
        const bestC = Math.min(openC ?? Infinity, catC ?? Infinity);
        if (bestC === Infinity) return;
        const p = prob(score, bestC);
        results.push({
          name,
          openCutoff: openC,
          catCutoff: catC,
          cutoff: bestC,
          projected: bestC + 20,
          state: stateMap.get(name) || 'India',
          chance: p.label,
          chanceKey: p.key,
          chanceClass: p.cls,
          pool: 'MCC AIQ',
          type
        });
      });
    };

    addColleges('AIQ', course, 'aiq', 'Government');
    if (course === 'MBBS') {
      addColleges('AIIMS', 'MBBS', 'aiims', 'Government');
      addColleges('JIPMER', 'MBBS', 'jipmer', 'Government');
    }
    addColleges('CENTRAL', course, 'central', 'Government');
    addColleges('DEEMED', course, 'deemed', 'Deemed');

    return results;
  };

  const getOpenStateCollegesList = (course, score) => {
    if (course !== 'MBBS') return [];
    const results = [];
    const OPEN_STATES = ['KA', 'TS', 'TN', 'UP', 'KL', 'AP', 'HR', 'WB', 'BR', 'UK', 'CG', 'JH', 'HP', 'PY', 'TR', 'MN', 'ML', 'SK'];
    const STATE_LABELS = {
      KA:'Karnataka', TS:'Telangana', TN:'Tamil Nadu', UP:'Uttar Pradesh',
      UK:'Uttarakhand', PY:'Pondicherry', WB:'West Bengal', MN:'Manipur', ML:'Meghalaya',
      AP:'Andhra Pradesh', BR:'Bihar', HR:'Haryana', JH:'Jharkhand', CG:'Chhattisgarh',
      KL:'Kerala', HP:'Himachal Pradesh', TR:'Tripura', SK:'Sikkim'
    };

    OPEN_STATES.forEach(stKey => {
      if (!asmiDb || !asmiDb[stKey] || !asmiDb[stKey]['MBBS']) return;
      const seen = new Map();
      
      ['open_pvt', 'mgmt_quota'].forEach(listType => {
        const d = asmiDb[stKey]['MBBS']['OPEN'];
        if (!d || !d[listType]) return;
        d[listType].forEach(col => {
          const p = prob(score, col.c);
          const entry = {
            name: col.n,
            openCutoff: col.c,
            catCutoff: null,
            state: STATE_LABELS[stKey] || stKey,
            cutoff: col.c,
            projected: col.c + 15,
            chance: p.label,
            chanceKey: p.key,
            chanceClass: p.cls,
            pool: 'Open State',
            type: 'Private'
          };
          if (!seen.has(col.n)) {
            seen.set(col.n, entry);
          } else if (col.c < seen.get(col.n).cutoff) {
            seen.set(col.n, entry);
          }
        });
      });
      results.push(...seen.values());
    });
    return results;
  };

  const getScorePredictedColleges = () => {
    const score = parseInt(cpScoreInput, 10);
    if (isNaN(score) || score < 200 || score > 720 || !asmiDb) return [];
    
    const course = cpScoreCourse;
    const userCat = cpCategory;
    
    const results = [];
    
    // 1. MH State Pool
    if (asmiDb.MH && asmiDb.MH[course]) {
      const mhGovt = getMHCollegesList(course, 'mh_govt', userCat, score);
      const mhPvt = getMHCollegesList(course, 'mh_pvt', userCat, score);
      const mhIq = (userCat === 'IQ') ? getMHCollegesList(course, 'mh_iq', userCat, score) : [];
      results.push(...mhGovt, ...mhPvt, ...mhIq);
    }
    
    // 2. MCC AIQ Pool
    const mccColleges = getMCCCollegesList(course, userCat, score);
    results.push(...mccColleges);
    
    // 3. Open State Pool
    if (course === 'MBBS') {
      const openStateColleges = getOpenStateCollegesList(course, score);
      results.push(...openStateColleges);
    }
    
    // Filter
    let filtered = [...results];
    
    if (cpPoolFilter !== 'All') {
      filtered = filtered.filter(c => c.pool === cpPoolFilter);
    }
    
    if (cpTypeFilter !== 'All') {
      filtered = filtered.filter(c => c.type === cpTypeFilter);
    }

    if (cpScoreState !== 'All') {
      filtered = filtered.filter(c => c.state === cpScoreState);
    }

    const PO_SORT = { safe: 0, likely: 1, borderline: 2, reach: 3 };
    if (cpScoreSort === 'chance') filtered.sort((a, b) => PO_SORT[a.chanceKey] - PO_SORT[b.chanceKey] || b.cutoff - a.cutoff);
    else if (cpScoreSort === 'cutoff_asc') filtered.sort((a, b) => a.cutoff - b.cutoff);
    else if (cpScoreSort === 'cutoff_desc') filtered.sort((a, b) => b.cutoff - a.cutoff);
    else if (cpScoreSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (cpScoreSort === 'fees_asc') filtered.sort((a, b) => parseAirFee(a.fees) - parseAirFee(b.fees));

    return filtered;
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar_collapsed', next ? '1' : '');
  };

  const handleToggleShortlist = (name) => {
    const next = shortlist.includes(name) ? shortlist.filter(n => n !== name) : [...shortlist, name];
    setShortlist(next);
    localStorage.setItem('shortlist', JSON.stringify(next));
  };

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Closed', cls: 'tag-red' };
    if (days === 0) return { text: 'Today!', cls: 'tag-red' };
    if (days <= 3) return { text: `${days}d left`, cls: 'tag-red' };
    if (days <= 14) return { text: `${days}d left`, cls: 'tag-gold' };
    return { text: `${days}d left`, cls: 'tag-green' };
  };

  const getMonthAbbr = (d) => new Date(d).toLocaleString('en-US', { month: 'short' });
  const getDayNum   = (d) => new Date(d).getDate();
  const formatDeadlineDate = (d) => { const dt = new Date(d); return `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })}`; };

  const ceStates   = Array.from(new Set(collegeData.map(c => c.state))).sort();
  const ceColleges = Array.from(new Set(collegeData.map(c => c.name))).sort();
  const uniqueStates = Array.from(new Set(collegesList.map(c => c.state).filter(Boolean))).sort();
  const filteredStatesList = uniqueStates.filter(s => s.toLowerCase().includes(instStateSearch.toLowerCase()));

  const getFilteredCollegesList = () => {
    let r = [...collegesList];
    if (instTabType !== 'All') r = r.filter(c => c.type?.toLowerCase() === instTabType.toLowerCase());
    if (instType !== 'All')    r = r.filter(c => c.type?.toLowerCase() === instType.toLowerCase());
    if (instCourse !== 'All')  r = r.filter(c => c.course?.toLowerCase() === instCourse.toLowerCase());
    if (instSelectedStates.length > 0) r = r.filter(c => instSelectedStates.includes(c.state));
    if (instSearch) r = r.filter(c => c.name.toLowerCase().includes(instSearch.toLowerCase()));
    r = r.filter(c => c.annual_fees == null || c.annual_fees <= instMaxFees);
    if (instSortBy === 'Recommended') r.sort((a, b) => (b.asmi_recommended ? 1 : 0) - (a.asmi_recommended ? 1 : 0));
    else if (instSortBy === 'Name')  r.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (instSortBy === 'Seats') r.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    return r;
  };

  const sectionsToRender = [
    ...DOCS.sections,
    ...(docCategory !== 'General' && DOCS.category[docCategory] ? [DOCS.category[docCategory]] : []),
    ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
  ];
  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;

  const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const counsellorInitials = counsellorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Progress line width
  const completedCount = progressSteps.filter(s => s.status === 'completed').length;
  const activeIdx = progressSteps.findIndex(s => s.status === 'active');
  const progressPct = progressSteps.length > 1
    ? ((completedCount + (activeIdx !== -1 ? 0.5 : 0)) / (progressSteps.length - 1)) * 100
    : 0;

  // ── Tag helper for deadline type
  const getDeadlineTag = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t.includes('EXAM')) return 'tag-blue';
    if (t.includes('URGENT') || t.includes('NEET')) return 'tag-red';
    if (t.includes('REG')) return 'tag-purple';
    return 'tag-gold';
  };

  // ── Shortlist icon colors cycling
  const iconColors = ['tag-purple', 'tag-blue', 'tag-gold', 'tag-green', 'tag-red'];

  // ── Fee formatters ──────────────────────────────────────────────────────────
  const feeStr = (name) => {
    const f = parseFloat(feeMap[name]);
    if (isNaN(f) || f === 0) return '—';
    if (f < 1)   return `₹${Math.round(f * 100)}K/yr`;
    if (f < 100) return `₹${parseFloat(f.toFixed(1))}L/yr`;
    return `₹${(f / 100).toFixed(2)}Cr/yr`;
  };
  const feeStrAIR = (rawFees) => {
    if (!rawFees) return '—';
    const r = parseFloat(String(rawFees).replace(/[,₹\s]/g, ''));
    if (isNaN(r) || r === 0) return '—';
    const lakhs = r / 100000;
    if (lakhs < 0.1) return `₹${Math.round(r).toLocaleString('en-IN')}/yr`;
    if (lakhs < 1)   return `₹${Math.round(lakhs * 100)}K/yr`;
    return `₹${parseFloat(lakhs.toFixed(1))}L/yr`;
  };
  const budgetStr = (name, course) => {
    const f = parseFloat(feeMap[name]);
    if (isNaN(f) || f === 0) return '—';
    const mult = course === 'BDS' ? 4 : course === 'BPTH' ? 4 : 4.5;
    const total = f * mult;
    if (total < 1)   return `₹${Math.round(total * 100)}K`;
    if (total < 100) return `₹${parseFloat(total.toFixed(1))}L`;
    return `₹${(total / 100).toFixed(2)}Cr`;
  };

  return (
    <div className="student-body">
      <div className="dashboard-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-logo">
            <img src="/asmi-logo.png" alt="ASMI Logo" className="logo-img" />
          </div>

          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link${activeTab === 'dashboard' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:layout-dashboard" className="nav-icon"></iconify-icon>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('predictor')}
              className={`nav-link${activeTab === 'predictor' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:bar-chart-3" className="nav-icon"></iconify-icon>
              <span>Predictor</span>
            </button>

            <button
              onClick={() => { window.location.href = '/cutoff_explorer.html' + window.location.search; }}
              className={`nav-link${activeTab === 'cutoff' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:search" className="nav-icon"></iconify-icon>
              <span>Cutoff Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('institutes')}
              className={`nav-link${activeTab === 'institutes' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:building-2" className="nav-icon"></iconify-icon>
              <span>Institutes</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`nav-link${activeTab === 'checklist' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:file-text" className="nav-icon"></iconify-icon>
              <span>Documents</span>
            </button>

            <div className="nav-section-label" style={{marginTop: '24px'}}>Account</div>

            <button className="nav-link">
              <iconify-icon icon="lucide:settings" className="nav-icon"></iconify-icon>
              <span>Settings</span>
            </button>

            <button className="nav-link">
              <iconify-icon icon="lucide:help-circle" className="nav-icon"></iconify-icon>
              <span>Help &amp; Support</span>
            </button>

            <button onClick={toggleSidebar} className="nav-link sidebar-toggle-btn" style={{ marginTop: 16 }}>
              <iconify-icon icon={sidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'} className="nav-icon"></iconify-icon>
              <span>Collapse</span>
            </button>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>

          {/* Top Header */}
          <header className="dashboard-header">
            <div className="header-search">
              <span className="header-search-icon">⊕</span>
              <input type="text" placeholder="Search for colleges, cutoffs or help..." />
            </div>
            <div className="header-right">
              <div className="header-user">
                <div className="header-user-info">
                  <div className="header-user-name">{studentName}</div>
                  <div className="header-user-role">NEET Aspirant 2026</div>
                </div>
                <div className="user-avatar">{initials}</div>
              </div>
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <div className="page-content">

            {/* ══════════════════════════════════════════
                VIEW: DASHBOARD
            ══════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="dash-grid">

                {/* ── LEFT COLUMN ── */}
                <div className="dash-col-left">

                  {/* Hero Welcome Card */}
                  <section className="hero-card">
                    <div>
                      <h1 className="hero-greeting">Welcome back, {studentName.split(' ')[0]} 👋</h1>
                      <p className="hero-subtitle">Your journey to MBBS 2026 is in progress. Keep going!</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                        <div className="rank-badge">
                          <span className="rank-badge-label">NEET SCORE</span>
                          <span className="rank-badge-value">{studentScore || '—'}</span>
                        </div>
                        <div className="rank-badge">
                          <span className="rank-badge-label">NEET AIR RANK</span>
                          <span className="rank-badge-value">—</span>
                        </div>
                        <div className="rank-badge">
                          <span className="rank-badge-label">CATEGORY</span>
                          <span className="rank-badge-value">{studentCategory ? (studentCategory === 'General' ? 'General / UR' : studentCategory) : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'white', fontWeight: 500 }}>
                        <span>
                          {shortlist.length === 0
                            ? 'No colleges shortlisted yet'
                            : `${shortlist.length} college${shortlist.length !== 1 ? 's' : ''} shortlisted`}
                        </span>
                        {deadlines.length > 0 && (
                          <>
                            <span style={{ opacity: 0.5 }}>|</span>
                            <span>Next: {deadlines[0].title} on {formatDeadlineDate(deadlines[0].date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="progress-tracker">
                      <div className="progress-label">Admission Progress</div>
                      <div className="progress-steps">
                        <div className="progress-line-track" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        <div className="progress-line-fill" style={{ width: `calc(${progressPct}% * ((100% - 64px) / 100%) + 0px)`, background: '#A855F7' }} />
                        {progressSteps.map((step) => (
                          <div key={step.id} className="step-item">
                            <div className={`step-circle ${step.status}`} style={
                              step.status === 'completed' ? { background: '#1A0040', borderColor: '#1A0040', color: 'white' }
                              : step.status === 'active'    ? { background: 'white', borderColor: '#6A0DAD', color: '#6A0DAD' }
                              : { background: '#e5e7eb', borderColor: '#e5e7eb', color: '#9ca3af' }
                            }>
                              {step.status === 'completed' ? '✓' : step.id}
                            </div>
                            <span className={`step-label ${step.status}`} style={
                              step.status === 'active'  ? { color: '#ffffff' }
                              : step.status === 'pending' ? { color: 'rgba(255,255,255,0.45)' }
                              : { color: 'rgba(255,255,255,0.75)' }
                            }>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Deadlines + Shortlist grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

                    {/* Deadlines */}
                    <div className="card-sm" style={{ padding: 24 }}>
                      <div className="card-header">
                        <div className="card-title">
                          <span>📅</span> Upcoming Deadlines
                        </div>
                        <a href="https://asmicareer.in/medical/news" target="_blank" rel="noreferrer" className="card-action" style={{ textDecoration: 'none' }}>View All</a>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {deadlines.length === 0 ? (
                          <div className="empty-state">No upcoming deadlines.</div>
                        ) : deadlines.slice(0, 4).map((dl, i) => {
                          const cd = getCountdown(dl.date);
                          return (
                            <div key={i} className="deadline-item">
                              <div className="deadline-date-box">
                                <span className="deadline-month">{getMonthAbbr(dl.date)}</span>
                                <span className="deadline-day">{getDayNum(dl.date)}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="deadline-title">{dl.title}</div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 5 }}>
                                  <span className={`tag ${getDeadlineTag(dl.tag)}`}>{dl.tag}</span>
                                  <span style={{ fontSize: 10, color: 'var(--text-400)', fontWeight: 600 }}>{cd.text}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shortlist */}
                    <div className="card-sm" style={{ padding: 24 }}>
                      <div className="card-header">
                        <div className="card-title">
                          <span style={{ color: '#d97706' }}>★</span> My Shortlist
                        </div>
                        <button className="card-action" onClick={() => setActiveTab('predictor')}>Edit List</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {shortlist.length === 0 ? (
                          <div className="empty-state">No colleges shortlisted yet.</div>
                        ) : shortlist.slice(0, 5).map((name, i) => (
                          <div key={i} className="shortlist-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={`shortlist-icon tag ${iconColors[i % iconColors.length]}`}
                                style={{ background: undefined, border: undefined }}>🏥</div>
                              <span className="shortlist-name">{name}</span>
                            </div>
                            <button onClick={() => handleToggleShortlist(name)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-300)', fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
                          </div>
                        ))}
                        {shortlist.length > 5 && (
                          <div style={{ fontSize: 12, color: 'var(--text-400)', textAlign: 'center', padding: '8px 0' }}>
                            +{shortlist.length - 5} more colleges
                          </div>
                        )}
                        <button onClick={() => setActiveTab('predictor')}
                          style={{ width: '100%', marginTop: 4, padding: '10px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-400)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          + Add More Colleges
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="dash-col-right">

                  {/* Advisor Card */}
                  <section className="advisor-card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 20 }}>My Personal Advisor</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="advisor-avatar">{counsellorInitials}</div>
                      <div>
                        <div className="advisor-name">{counsellorName}</div>
                        <div className="advisor-branch">📍 {counsellorBranch}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                      <a href={`tel:${counsellorWhatsapp && counsellorWhatsapp.trim() ? counsellorWhatsapp.replace(/\D/g, '') : '7410019077'}`} className="btn-whatsapp">
                        📞 Call the Advisor
                      </a>
                      {whatsappGroupLink && whatsappGroupLink.trim() !== '' && (
                        <a href={whatsappGroupLink} target="_blank" rel="noreferrer" className="btn-outline-navy">
                          💬 Ask in Group
                        </a>
                      )}
                    </div>
                  </section>

                  {/* Document Status */}
                  <div className="card-sm" style={{ padding: 24 }}>
                    <div className="card-header">
                      <div className="card-title">Document Status</div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: 'var(--navy)',
                        background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
                        padding: '3px 8px', borderRadius: 4, letterSpacing: 0.4
                      }}>
                        {doneCount}/{allIds.length} DONE
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sectionsToRender[0]?.docs.slice(0, 4).map(doc => {
                        const done = checkedDocs.has(doc.id);
                        return (
                          <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                            <div style={{
                              marginTop: 2, width: 20, height: 20, borderRadius: '50%',
                              background: done ? '#22c55e' : 'transparent',
                              border: done ? 'none' : '2px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 10, fontWeight: 900, flexShrink: 0
                            }}>
                              {done ? '✓' : ''}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--text-900)' : 'var(--text-400)' }}>
                                {doc.label}
                              </div>
                              {!done && doc.id === 'neet-admit' && (
                                <div style={{ fontSize: 10, color: 'var(--reach-color)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                                  Action Required
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setActiveTab('checklist')}
                      style={{ width: '100%', marginTop: 20, padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-500)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseOver={e => e.target.style.background = 'var(--bg-subtle)'}
                      onMouseOut={e => e.target.style.background = 'transparent'}
                    >
                      View Full Checklist →
                    </button>
                  </div>


                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: PREDICTOR
            ══════════════════════════════════════════ */}
            {activeTab === 'predictor' && (
              <div>
                {/* Rank Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">📊 NEET Rank Predictor</h2>
                  <p className="section-sub">Convert your tentative NEET Score into an estimated All India Rank.</p>
                  <div style={{ display: 'flex', gap: 10, maxWidth: 440 }}>
                    <input type="number" placeholder="Enter Score (200–720)" className="form-input"
                      value={predictorScore} onChange={e => setPredictorScore(e.target.value)} />
                    <button onClick={handlePredictRank} className="btn-gold">Predict</button>
                  </div>
                  {predictedRank && (
                    <div style={{ marginTop: 24, display: 'inline-block', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '16px 24px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-500)', marginBottom: 4 }}>Estimated All India Rank</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--navy)' }}>#{predictedRank.min_rank.toLocaleString()} &ndash; #{predictedRank.max_rank.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {/* College Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">🔮 College Predictor</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <button className={`chip ${cpInputMode === 'rank' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('rank'); setCpQuota('All'); }}>Use NEET AIR</button>
                    <button className={`chip ${cpInputMode === 'score' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('score'); setCpQuota('All'); }}>Use NEET Score</button>
                  </div>

                  {/* ── RANK TAB: full Cutoff Explorer layout ── */}
                  {cpInputMode === 'rank' && (() => {
                    const allStates = Array.from(new Set(cutoffDbData.map(c => c.state))).sort();
                    const allTypes  = Array.from(new Set(cutoffDbData.map(c => c.type).filter(Boolean))).sort();
                    const filteredCpStates = allStates.filter(s => s.toLowerCase().includes(cpStateSearch.toLowerCase()));
                    const results = getRankPredictedColleges();
                    const highCount  = results.filter(r => r.chance === 'High').length;
                    const medCount   = results.filter(r => r.chance === 'Med').length;
                    const lowCount   = results.filter(r => r.chance === 'Low').length;
                    return (
                      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* Filters panel */}
                        <div className="filters-panel" style={{ flex: '0 0 240px', minWidth: 200 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                            <button className="card-action" onClick={() => {
                              setCpSelectedStates([]); setCpSelectedTypes([]); setCpQuota('All');
                              setCpMaxBudget(3000000); setCpSortBy('chance'); setCpSearchFilter(''); setCpRankInput('');
                            }}>Reset All</button>
                          </div>

                          {/* Rank input */}
                          <div className="filter-section">
                            <div className="form-label">Your All India Rank (AIR)</div>
                            <input type="number" placeholder="e.g. 15000" className="form-input"
                              value={cpRankInput} onChange={e => setCpRankInput(e.target.value)}
                              style={{ padding: '9px 12px', fontSize: 14, fontWeight: 700 }} />
                          </div>

                          {/* College name search */}
                          <div className="filter-section">
                            <div className="form-label">Search College</div>
                            <input type="text" placeholder="Search college name..." className="form-input"
                              value={cpSearchFilter} onChange={e => setCpSearchFilter(e.target.value)}
                              style={{ padding: '7px 10px', fontSize: 12 }} />
                          </div>

                          {/* Quota */}
                          <div className="filter-section">
                            <div className="form-label">Quota</div>
                            <select className="form-select" value={cpQuota} onChange={e => setCpQuota(e.target.value)} style={{ fontSize: 12 }}>
                              <option value="All">All Quotas</option>
                              <option value="AIQ">All India Quota (AIQ)</option>
                              <option value="State">State Quota</option>
                              <option value="Open State">Open State Quota</option>
                              <option value="IP">Institutional / Private</option>
                            </select>
                          </div>

                          {/* State multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div className="form-label" style={{ margin: 0 }}>State / Region</div>
                              {cpSelectedStates.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedStates([])}>
                                  Clear ({cpSelectedStates.length})
                                </button>
                              )}
                            </div>
                            <input type="text" placeholder="Search state..." className="form-input"
                              value={cpStateSearch} onChange={e => setCpStateSearch(e.target.value)}
                              style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                            <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {filteredCpStates.map(state => (
                                <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedStates.includes(state)}
                                    onChange={() => setCpSelectedStates(prev =>
                                      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {state}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Institution type multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div className="form-label" style={{ margin: 0 }}>Institution Type</div>
                              {cpSelectedTypes.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedTypes([])}>
                                  Clear
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {allTypes.map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedTypes.includes(type)}
                                    onChange={() => setCpSelectedTypes(prev =>
                                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {type}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Max Budget slider */}
                          <div className="filter-section">
                            <div className="form-label">Max Annual Fees</div>
                            <input type="range" min="0" max="3000000" step="50000"
                              value={cpMaxBudget} onChange={e => setCpMaxBudget(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                              {cpMaxBudget >= 3000000 ? 'No Limit' : `Up to ₹${(cpMaxBudget/100000).toFixed(1)}L/yr`}
                            </div>
                          </div>

                          {/* Sort */}
                          <div>
                            <div className="form-label">Sort By</div>
                            <select className="form-select" value={cpSortBy} onChange={e => setCpSortBy(e.target.value)} style={{ fontSize: 12 }}>
                              <option value="chance">Chance (High first)</option>
                              <option value="rank">Closing Rank</option>
                              <option value="fees_asc">Fees: Low → High</option>
                              <option value="fees_desc">Fees: High → Low</option>
                              <option value="name">Name A–Z</option>
                            </select>
                          </div>
                        </div>

                        {/* Results area */}
                        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-500)' }}>
                              {!cpRankInput ? (
                                'Enter your AIR in the filter panel to see colleges'
                              ) : (
                                <><strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched</>
                              )}
                            </div>
                            {results.length > 0 && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                {highCount > 0 && <span className="badge-safe">{highCount} High</span>}
                                {medCount  > 0 && <span className="badge-likely">{medCount} Med</span>}
                                {lowCount  > 0 && <span className="badge-borderline">{lowCount} Low</span>}
                              </div>
                            )}
                          </div>

                          {!cpRankInput ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>Enter Your AIR to Start</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                                Type your All India Rank in the filter panel. Colleges are shown with High / Med / Low admission chance.
                              </div>
                            </div>
                          ) : results.length === 0 ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                                No colleges match your current filters. Try expanding your state selection, increasing budget, or clearing institution type filters.
                              </div>
                            </div>
                          ) : (
                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header"><tr>
                                  <th>College Name</th>
                                  <th>State</th>
                                  <th>Type</th>
                                  <th>Quota</th>
                                  <th>Closing Rank</th>
                                  <th>Annual Fees</th>
                                  <th>Chance</th>
                                  <th>Shortlist</th>
                                </tr></thead>
                                <tbody>
                                  {results.map((c, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                      <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                      <td><span className={`tb ${c.type === 'Government' ? 'tb-govt' : c.type === 'Private' ? 'tb-private' : c.type === 'Deemed' ? 'tb-deemed' : ''}`}>{c.type}</span></td>
                                      <td style={{ fontSize: 11 }}>{c.quota}</td>
                                      <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.closingRank?.toLocaleString() || '—'}</td>
                                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                        {feeStrAIR(c.fees)}
                                      </td>
                                      <td><span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>{c.chance}</span></td>
                                      <td>
                                        <button onClick={() => handleToggleShortlist(c.name)} className="chip" style={{ fontSize: 11 }}>
                                          {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── SCORE TAB ── */}
                  {cpInputMode === 'score' && (() => {
                    const results = getScorePredictedColleges();
                    return (
                      <>
                        {/* Score tab filters */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                          <div className="form-group">
                            <label className="form-label">NEET Score</label>
                            <input type="number" placeholder="e.g. 620" className="form-input" value={cpScoreInput} onChange={e => setCpScoreInput(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Course</label>
                            <select className="form-select" value={cpScoreCourse} onChange={e => setCpScoreCourse(e.target.value)}>
                              <option value="MBBS">MBBS</option>
                              <option value="BDS">BDS</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={cpCategory} onChange={e => setCpCategory(e.target.value)}>
                              <option value="Open">Open / General</option>
                              <option value="OBC">OBC</option>
                              <option value="SC">SC</option>
                              <option value="ST">ST</option>
                              <option value="EWS">EWS</option>
                              <option value="VJ">VJ (DT-A)</option>
                              <option value="NT1">NT-B (NT-1)</option>
                              <option value="NT2">NT-C (NT-2)</option>
                              <option value="NT3">NT-D (NT-3)</option>
                              <option value="SEBC">SEBC</option>
                              <option value="IQ">Inst. / NRI</option>
                            </select>
                          </div>
                        </div>

                        {/* State + Sort row */}
                        {(() => {
                          const scoreResults = (cpScoreInput && !isNaN(parseInt(cpScoreInput,10)) && asmiDb) ? (() => {
                            const score=parseInt(cpScoreInput,10); if(score<200||score>720) return [];
                            const tmp=[]; const course=cpScoreCourse; const userCat=cpCategory;
                            if(asmiDb.MH&&asmiDb.MH[course]) {
                              tmp.push(...getMHCollegesList(course,'mh_govt',userCat,score),...getMHCollegesList(course,'mh_pvt',userCat,score));
                              if(userCat==='IQ') tmp.push(...getMHCollegesList(course,'mh_iq',userCat,score));
                            }
                            tmp.push(...getMCCCollegesList(course,userCat,score));
                            if(course==='MBBS') tmp.push(...getOpenStateCollegesList(course,score));
                            return tmp;
                          })() : [];
                          const stateOptions = ['All', ...Array.from(new Set(scoreResults.map(c=>c.state).filter(Boolean))).sort()];
                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                              <div className="form-group">
                                <label className="form-label">State</label>
                                <select className="form-select" value={cpScoreState} onChange={e => setCpScoreState(e.target.value)}>
                                  {stateOptions.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Sort By</label>
                                <select className="form-select" value={cpScoreSort} onChange={e => setCpScoreSort(e.target.value)}>
                                  <option value="chance">Admission Chance</option>
                                  <option value="cutoff_desc">Cutoff (High → Low)</option>
                                  <option value="cutoff_asc">Cutoff (Low → High)</option>
                                  <option value="fees_asc">Fees (Low → High)</option>
                                  <option value="name">College Name</option>
                                </select>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Filter chips (Pool and Type) */}
                        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Pool</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[
                                { key: 'All', label: 'All Pools' },
                                { key: 'MH State', label: 'MH State' },
                                { key: 'MCC AIQ', label: 'MCC AIQ' },
                                { key: 'Open State', label: 'Open State' }
                              ].map(p => (
                                <button key={p.key} className={`chip ${cpPoolFilter === p.key ? 'active' : ''}`} onClick={() => setCpPoolFilter(p.key)}>
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Institution Type</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[
                                { key: 'All', label: 'All Types' },
                                { key: 'Government', label: 'Government' },
                                { key: 'Private', label: 'Private' },
                                { key: 'Deemed', label: 'Deemed' }
                              ].map(t => (
                                <button key={t.key} className={`chip ${cpTypeFilter === t.key ? 'active' : ''}`} onClick={() => setCpTypeFilter(t.key)}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Results list */}
                        {(!cpScoreInput || isNaN(parseInt(cpScoreInput, 10))) ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>Enter Your NEET Score to Start</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                              Type your NEET score (200-720) above to see matching colleges and admission chances.
                            </div>
                          </div>
                        ) : results.length === 0 ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                              No colleges match your current score and category. Try changing the filters.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 14 }}>
                              <strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched
                            </div>

                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header">
                                  <tr>
                                    <th>College Name</th>
                                    <th>Pool</th>
                                    <th>State</th>
                                    <th>Open Cutoff</th>
                                    {cpCategory !== 'Open' && <th>Category Cutoff</th>}
                                    <th>Fee/yr</th>
                                    <th>Total Budget</th>
                                    <th>Chance</th>
                                    <th style={{ textAlign: 'center', width: '60px' }}>★</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results.map((c, i) => {
                                    const feeVal = feeStr(c.name);
                                    const budgetVal = budgetStr(c.name, cpScoreCourse);
                                    const goldPill = (val) => val != null ? (
                                      <span style={{ background: 'linear-gradient(135deg, var(--navy), var(--purple))', color: '#FFD700', padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', display: 'inline-block', marginTop: 2 }}>
                                        {val}
                                      </span>
                                    ) : null;
                                    return (
                                      <tr key={i}>
                                        <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                        <td>
                                          <span style={{ backgroundColor: 'rgba(106, 13, 173, 0.08)', color: '#6a0dad', border: '1px solid rgba(106, 13, 173, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            {c.pool}
                                          </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                        <td style={{ textAlign: 'center' }}>
                                          {c.openCutoff != null ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                              <span style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.openCutoff}</span>
                                              {goldPill(c.openCutoff + 15)}
                                            </div>
                                          ) : <span style={{ color: 'rgba(26,0,64,0.3)' }}>—</span>}
                                        </td>
                                        {cpCategory !== 'Open' && (
                                          <td style={{ textAlign: 'center' }}>
                                            {c.catCutoff != null ? (
                                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <span style={{ fontWeight: 800, color: 'var(--purple)' }}>{c.catCutoff}</span>
                                                {goldPill(c.catCutoff + 15)}
                                              </div>
                                            ) : <span style={{ color: 'rgba(26,0,64,0.3)' }}>—</span>}
                                          </td>
                                        )}
                                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{feeVal}</td>
                                        <td style={{ fontSize: 11, whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--navy)' }}>{budgetVal}</td>
                                        <td>
                                          <span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>{c.chance}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <button onClick={() => handleToggleShortlist(c.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: shortlist.includes(c.name) ? '#FFD700' : 'rgba(26, 0, 64, 0.2)', padding: '4px', lineHeight: 1, transition: 'color 0.15s' }}>
                                            {shortlist.includes(c.name) ? '★' : '☆'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: CUTOFF EXPLORER
            ══════════════════════════════════════════ */}
            {activeTab === 'cutoff' && (
              <div className="tool-card">
                <h2 className="section-title">📈 Cutoff Explorer</h2>
                <p className="section-sub">Browse historical closing ranks for medical colleges across states and quotas.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  <button className={`chip ${ceViewMode === 'database' ? 'active' : ''}`} onClick={() => setCeViewMode('database')}>Browse Database</button>
                  <button className={`chip ${ceViewMode === 'single-college' ? 'active' : ''}`} onClick={() => setCeViewMode('single-college')}>Single College Lookup</button>
                </div>

                {ceViewMode === 'database' ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Search College</label>
                        <input type="text" placeholder="Search..." className="form-input" value={ceCollegeSearch} onChange={e => setCeCollegeSearch(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-select" value={ceState} onChange={e => setCeState(e.target.value)}>
                          <option value="All">All States</option>
                          {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="dense-table">
                        <thead className="predictor-header"><tr>
                          <th>Institute</th><th>State</th><th>Quota</th><th>Closing Rank (AIR)</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                          {collegeData.filter(c => {
                            if (ceState !== 'All' && c.state !== ceState) return false;
                            if (ceCollegeSearch && !c.name.toLowerCase().includes(ceCollegeSearch.toLowerCase())) return false;
                            return true;
                          }).slice(0, 60).map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 700 }}>{c.name}</td>
                              <td>{c.state}</td>
                              <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                              <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.cutoff?.toLocaleString() || '—'}</td>
                              <td>
                                <button onClick={() => handleToggleShortlist(c.name)} className="chip" style={{ fontSize: 11 }}>
                                  {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-group" style={{ maxWidth: 500 }}>
                      <label className="form-label">Select College</label>
                      <select className="form-select" value={ceSingleCollege} onChange={e => setCeSingleCollege(e.target.value)}>
                        <option value="">— Select College —</option>
                        {ceColleges.map((col, i) => <option key={i} value={col}>{col}</option>)}
                      </select>
                    </div>
                    {ceSingleCollege && (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>{ceSingleCollege}</h3>
                        <div className="table-container">
                          <table className="dense-table">
                            <thead className="predictor-header"><tr><th>Quota</th><th>State</th><th>Fees</th><th>Closing Rank (AIR)</th></tr></thead>
                            <tbody>
                              {collegeData.filter(c => c.name === ceSingleCollege).map((c, i) => (
                                <tr key={i}>
                                  <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                                  <td>{c.state}</td>
                                  <td>{c.fees ? `₹${parseInt(c.fees, 10).toLocaleString('en-IN')}` : '—'}</td>
                                  <td style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{c.cutoff?.toLocaleString() || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: INSTITUTES
            ══════════════════════════════════════════ */}
            {activeTab === 'institutes' && (
              <div>
                <h2 className="section-title">🏫 Institutes Directory</h2>
                <p className="section-sub">Browse and filter medical colleges across India.</p>

                {/* Tab pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {['All', 'Private', 'Government', 'Deemed', 'AIIMS', 'JIPMER', 'Central'].map(tab => (
                    <button key={tab} onClick={() => setInstTabType(tab)}
                      className={`chip ${instTabType === tab ? 'active' : ''}`}>
                      {tab === 'All' ? 'All Colleges' : tab}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Filters */}
                  <div className="filters-panel" style={{ flex: '0 0 260px', minWidth: 220 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                      <button onClick={() => {
                        setInstSelectedStates([]); setInstType('All'); setInstCourse('All');
                        setInstTabType('All'); setInstMaxFees(3000000); setInstSortBy('Recommended');
                        setInstSearch(''); setInstStateSearch('');
                      }} className="card-action">Reset all</button>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Search College</div>
                      <input type="text" placeholder="Search..." className="form-input"
                        value={instSearch} onChange={e => setInstSearch(e.target.value)} style={{ padding: '8px 12px', fontSize: 12 }} />
                    </div>

                    <div className="filter-section">
                      <div className="form-label">State</div>
                      <input type="text" placeholder="Search state..." className="form-input"
                        value={instStateSearch} onChange={e => setInstStateSearch(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                      <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {filteredStatesList.map(state => (
                          <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                            <input type="checkbox" checked={instSelectedStates.includes(state)}
                              onChange={() => setInstSelectedStates(prev =>
                                prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                              style={{ accentColor: 'var(--primary)' }} />
                            {state}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">College Type</div>
                      <select className="form-select" value={instType} onChange={e => setInstType(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="All">All Colleges</option>
                        <option value="AIIMS">AIIMS</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                        <option value="Deemed">Deemed</option>
                        <option value="JIPMER">JIPMER</option>
                        <option value="Central">Central</option>
                        <option value="AFMC">AFMC</option>
                        <option value="Govt. Society">Govt. Society</option>
                      </select>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Course</div>
                      <select className="form-select" value={instCourse} onChange={e => setInstCourse(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="All">All Courses</option>
                        <option value="MBBS">MBBS</option>
                        <option value="BDS">BDS</option>
                        <option value="BPTH">BPTH</option>
                        <option value="BAMS">BAMS</option>
                        <option value="BHMS">BHMS</option>
                      </select>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Sort By</div>
                      <select className="form-select" value={instSortBy} onChange={e => setInstSortBy(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="Recommended">ASMI Recommended</option>
                        <option value="Name">Name A–Z</option>
                        <option value="Seats">Seats (High to Low)</option>
                      </select>
                    </div>

                    <div>
                      <div className="form-label">Annual Fees</div>
                      <input type="range" min="0" max="3000000" step="50000" value={instMaxFees}
                        onChange={e => setInstMaxFees(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        Up to {instMaxFees === 3000000 ? 'No Limit' : `₹${instMaxFees.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  <div style={{ flex: '1 1 400px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 16 }}>
                      Showing <strong style={{ color: 'var(--text-900)' }}>{getFilteredCollegesList().length}</strong> college{getFilteredCollegesList().length !== 1 ? 's' : ''} matching your criteria.
                    </div>
                    {getFilteredCollegesList().length === 0 ? (
                      <div className="card-sm empty-state">No colleges found. Try adjusting your filters.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {getFilteredCollegesList().slice(0, 48).map(college => {
                          const isShortlisted = shortlist.includes(college.name);
                          return (
                            <a href={`/medical/colleges/${college.slug}`} target="_blank" rel="noreferrer"
                              key={college.slug} className="college-card">
                              <div className="college-img-placeholder" style={{ position: 'relative' }}>
                                  {(() => { const imgSrc = college.image || college.cover_image || college.img || college.thumbnail; return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={college.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null; })()}
                                {!(college.image || college.cover_image || college.img || college.thumbnail) && (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{college.name}</span>
                                  </div>
                                )}
                                {college.asmi_recommended && (
                                  <span className="college-badge-recommend">★ ASMI RECOMMENDS</span>
                                )}
                                {college.asmi_pulse_score && (
                                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>
                                    ★ {college.asmi_pulse_score}/5
                                  </span>
                                )}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleToggleShortlist(college.name); }}
                                  style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: isShortlisted ? '#dc2626' : 'var(--navy)' }}>
                                  {isShortlisted ? '♥' : '♡'}
                                </button>
                              </div>
                              <div className="college-card-body">
                                <div className="college-meta">
                                  {college.city && <span>📍 {college.city}</span>}
                                  <span>🎓 {college.type}</span>
                                </div>
                                <div className="college-name">{college.name}</div>
                                <div className="college-stats">
                                  {college.seats ? `${college.seats} ${college.course || 'MBBS'} seats` : ''}
                                  {college.annual_fees ? ` · ${formatFees(college.annual_fees)}` : ''}
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: DOCUMENTS CHECKLIST
            ══════════════════════════════════════════ */}
            {activeTab === 'checklist' && (
              <div className="tool-card">
                <h2 className="section-title">📋 Documents Checklist</h2>
                <p className="section-sub">Track every document you need for MBBS counselling and admission.</p>

                {/* Quota selector only — category is fixed from token */}
                <div style={{ marginBottom: 24 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>Quota Type</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['State', 'AIQ', 'Management'].map(q => (
                      <button key={q} className={`chip ${docQuota === q ? 'active' : ''}`}
                        onClick={() => { setDocQuota(q); saveChecklist(checkedDocs, docCategory, q); }}>
                        {q === 'State' ? 'State Quota (Maharashtra)' : q === 'AIQ' ? 'All India Quota (AIQ)' : 'Management / NRI'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div className="progress-bar-track" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-500)', whiteSpace: 'nowrap' }}>
                    {doneCount} / {allIds.length} ready ({pct}%)
                  </span>
                </div>

                {/* Tip */}
                <div className="tip-callout" style={{ marginBottom: 24 }}>
                  <strong>💡 Attestation tip:</strong> &quot;Self-attested&quot; means you sign and write &quot;True Copy&quot; on the photocopy yourself. &quot;Attested copy&quot; means a gazetted officer, notary, or school principal signs it. Always carry a few extra copies.
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sectionsToRender.map((section, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-subtle)', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div className="doc-section-title">{section.title}</div>
                      </div>
                      <div>
                        {section.docs.map(doc => {
                          const isChecked = checkedDocs.has(doc.id);
                          return (
                            <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                              className={`doc-item ${isChecked ? 'checked' : ''}`}
                              style={{ borderBottom: '1px solid var(--border)' }}>
                              <div className="doc-checkbox">{isChecked ? '✓' : ''}</div>
                              <div style={{ flex: 1 }}>
                                <div className="doc-label">{doc.label}</div>
                                <div className="doc-copies">{doc.copies}</div>
                                {doc.note && <div className="doc-note">{doc.note}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                  <button onClick={() => window.print()} className="chip">🖨️ Print Checklist</button>
                  <button onClick={() => {
                    if (confirm('Clear all checkmarks and start fresh?')) {
                      const empty = new Set();
                      setCheckedDocs(empty);
                      saveChecklist(empty, docCategory, docQuota);
                    }
                  }} className="chip" style={{ color: 'var(--reach-color)', borderColor: 'var(--reach-border)' }}>
                    🔄 Reset Checklist
                  </button>
                </div>
              </div>
            )}

          </div>{/* /page-content */}
        </div>{/* /main-content */}

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => {
              if (item.id === 'cutoff') {
                window.location.href = '/cutoff_explorer.html' + window.location.search;
              } else {
                setActiveTab(item.id);
              }
            }}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}>
              <iconify-icon icon={item.icon} className="nav-icon"></iconify-icon>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>{/* /dashboard-shell */}
    </div>
  );
}
