// ════ DESIGN MODELS DATA ════
const MODELS = [
  {id:'m1',name:'Nordic Serene',style:'Scandinavian Minimal',rooms:['Bedroom','Living Room'],pkg:['Silver','Gold','Platinum'],emoji:'🛏',tag:'Popular',feats:'Pale oak flooring · Linen drapes · Built-in wardrobes',mats:['Oak Wood','Linen','Plywood'],bg:'#1c1610'},
  {id:'m2',name:'Onyx & Brass',style:'Contemporary Luxe',rooms:['Living Room'],pkg:['Gold','Platinum'],emoji:'🛋',tag:'Luxury',feats:'Dark marble accent wall · Brass fixtures · Velvet seating',mats:['Marble','Brass','Velvet'],bg:'#100e0c'},
  {id:'m3',name:'Japandi Edit',style:'Japanese-Scandi Fusion',rooms:['Bedroom','Kitchen','Living Room'],pkg:['Silver','Gold','Platinum'],emoji:'🏮',tag:'Popular',feats:'Wabi-sabi textures · Clay tones · Bamboo accents',mats:['Bamboo','Clay Plaster','Rice Paper'],bg:'#12140e'},
  {id:'m4',name:'Parisian Hotel',style:'French Classic',rooms:['Bedroom'],pkg:['Gold','Platinum'],emoji:'🛏',tag:'Luxury',feats:'Boiserie panelling · Silk drapes · Bespoke headboard',mats:['Silk','Carved Wood','Marble'],bg:'#14100c'},
  {id:'m5',name:'Urban Loft',style:'Industrial Minimal',rooms:['Kitchen','Living Room'],pkg:['Silver','Gold'],emoji:'⚙️',tag:'Popular',feats:'Concrete finish · Steel frame shelving · Matte black accents',mats:['Concrete','Steel','MDF'],bg:'#101214'},
  {id:'m6',name:'Biophilic Haven',style:'Organic Warmth',rooms:['Bedroom','Living Room','Kitchen'],pkg:['Gold','Platinum'],emoji:'🌿',tag:'Popular',feats:'Plant walls · Natural stone · Rattan accents',mats:['Stone','Rattan','Live Plants'],bg:'#0e120c'},
  {id:'m7',name:'Art Deco Revival',style:'Geometric Glamour',rooms:['Living Room'],pkg:['Platinum'],emoji:'🏛',tag:'Luxury',feats:'Geometric inlays · Gold leafing · Statement chandelier',mats:['Marble','Gold Leaf','Onyx'],bg:'#10100e'},
  {id:'m8',name:'Coastal Minimal',style:'Coastal Contemporary',rooms:['Bedroom','Living Room','Kitchen'],pkg:['Silver','Gold'],emoji:'🌊',tag:'Popular',feats:'Bleached wood · White linen · Sandy textures',mats:['Bleached Oak','Linen','Jute'],bg:'#0e1214'},
  {id:'m9',name:'Earthy Retreat',style:'Organic Warmth',rooms:['Bedroom'],pkg:['Silver','Gold','Platinum'],emoji:'🌿',tag:'Popular',feats:'Terracotta tones · Handwoven textiles · Raw plaster',mats:['Plaster','Terracotta','Cotton'],bg:'#16100a'},
  {id:'m10',name:'Modern Modular',style:'Contemporary Minimal',rooms:['Kitchen'],pkg:['Silver','Gold'],emoji:'🍳',tag:'Popular',feats:'Handleless cabinets · Quartz countertops · Under-cabinet lighting',mats:['Quartz','Lacquered MDF','Steel'],bg:'#101012'}
];

// ════ PACKAGE PRICING ════
const PKG_PRICE = {
    Silver: '₹5 Lakhs',
    Gold: '₹10 Lakhs',
    Platinum: '₹15 Lakhs'
};

const PKG_AMT = {
    Silver: 500000,
    Gold: 1000000,
    Platinum: 1500000
};

// ════ OPTION NAME POOL ════
const NAMES = [
    'Serene Retreat', 'Minimal Haven', 'Nordic Suite', 'Coastal Dream', 'Urban Sanctuary', 
    'Organic Abode', 'Golden Rest', 'Elegant Corner', 'Bespoke Nook', 'Calm Residence'
];