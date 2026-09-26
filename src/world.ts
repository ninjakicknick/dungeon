export type Action = 'water' | 'bell' | 'listen' | 'tea';
export type Spot = { id: string; label: string; x: number; y: number; w?: number; h?: number; to?: string; action?: Action; edge?: boolean; requires?: 'mouth'; };
export type View = { room: string; art: string; title: string; facing: string; alt: string; turn?: string; parent?: string; zoom?: [number,number,number]; spots: Spot[] };
const go=(id:string,label:string,x:number,y:number,to:string,w=16,h=34):Spot=>({id,label,x,y,to,w,h});
const back=(to:string,label='Step back'):Spot=>({...go('back',label,50,90,to,24,12),edge:true});
const look=(id:string,label:string,x:number,y:number,to:string,w=18,h=23):Spot=>go(id,label,x,y,to,w,h);
export const startView='fountain';
export const rooms:Record<string,{name:string;x:number;y:number;color:string}>={
 fountain:{name:'The frog fountain',x:95,y:270,color:'#71c6a0'},
 armor:{name:'The red watch',x:95,y:135,color:'#d18766'},
 bridge:{name:'The long drop',x:245,y:65,color:'#aaa0dd'},
 bell:{name:'The sleeping face',x:395,y:135,color:'#e0b16a'},
 mushroom:{name:'The lantern garden',x:315,y:270,color:'#6cc8b8'},
 tea:{name:'A room for one',x:395,y:30,color:'#df949b'}
};
export const connections=[['fountain','armor'],['armor','bridge'],['bridge','bell'],['bell','mushroom'],['mushroom','fountain'],['bell','tea']];
export const views:Record<string,View>={
 fountain:{room:'fountain',art:'fountain',title:'The frog fountain',facing:'Under a crooked crown',alt:'A crowned jade frog spills water into a turquoise pool. Bronze armor through the left door; luminous mushrooms through the right.',spots:[go('armor','Enter the red corridor',16,44,'armor',18,42),go('mushroom','Follow the mushroom light',86,47,'mushroom',18,40),look('pool','Sit beside the fountain',50,66,'pool',34,32)]},
 pool:{room:'fountain',art:'fountain',title:'At the frog’s feet',facing:'Beside the water',alt:'Coins glint below the frog fountain’s turquoise water.',parent:'fountain',zoom:[1.75,50,62],spots:[{id:'water',label:'Trail your fingers in the water',x:50,y:71,w:48,h:28,action:'water'},back('fountain','Stand up')]},
 armor:{room:'armor',art:'armor',title:'The red watch',facing:'Between the empty helmets',alt:'Oversized bronze armor stands along a crimson hall. A bridge crosses violet darkness through the far doorway.',turn:'armor-back',spots:[go('bridge','Walk toward the bridge',50,45,'bridge',19,39),look('visor','Approach the nearest helmet',12,18,'visor',20,30)]},
 'armor-back':{room:'armor',art:'armor-back',title:'The red watch',facing:'The fountain behind you',alt:'The green frog is framed by the far doorway beyond the suits of armor.',turn:'armor',spots:[go('fountain','Return to the frog fountain',50,44,'fountain',22,43)]},
 visor:{room:'armor',art:'armor',title:'Nobody home',facing:'Eye to eye with bronze',alt:'A narrow visor in an oversized bronze helmet.',parent:'armor',zoom:[2.8,13,19],spots:[{id:'listen',label:'Listen inside the helmet',x:49,y:45,w:38,h:38,action:'listen'},back('armor')]},
 bridge:{room:'bridge',art:'bridge',title:'The long drop',facing:'Before the crossing',alt:'An ivory bridge crosses a vast violet shaft. A copper bell glows beyond the opposite doorway; tiny windows punctuate the dark.',spots:[go('cross','Cross the bridge',50,43,'landing',24,48),look('shaft','Lean over the parapet',16,70,'shaft',24,22),back('armor','Return to the armor hall')]},
 landing:{room:'bridge',art:'bridge',title:'The far landing',facing:'With the bell just ahead',alt:'Across the narrow bridge, the warm doorway of the bell chamber fills your view.',zoom:[1.9,50,39],turn:'bridge-back',spots:[go('bell','Step into the bell chamber',50,44,'bell',30,62)]},
 'bridge-back':{room:'bridge',art:'bridge-back',title:'The long drop',facing:'Back toward the red watch',alt:'The ivory bridge leads back to the red corridor, where bronze armor stands in warm light.',turn:'landing',spots:[go('recross','Cross back to the armor hall',50,44,'armor-back',24,48),back('bell','Step back into the bell chamber')]},
 shaft:{room:'bridge',art:'shaft',title:'Below the bridge',facing:'Looking down',alt:'Doorways and impossible stair fragments recede down a deep purple shaft. Something warm shines far below.',parent:'bridge',spots:[back('bridge','Step away from the edge')]},
 mushroom:{room:'mushroom',art:'mushroom',title:'The lantern garden',facing:'Beneath the caps',alt:'Peach and turquoise mushrooms illuminate a mossy chamber. The fountain is through the left arch; a bell hangs beyond the right passage.',spots:[go('fountain','Return to the frog fountain',18,38,'fountain',19,39),go('bell','Climb toward the copper bell',85,32,'bell',18,40),look('root','Sit beneath the mushrooms',16,70,'root',27,22)]},
 root:{room:'mushroom',art:'mushroom',title:'Under the lanterns',facing:'On the curled root',alt:'Luminous mushroom gills hang above a mossy seat. Spores drift between the caps.',parent:'mushroom',zoom:[1.55,43,52],spots:[back('mushroom','Stand up')]},
 bell:{room:'bell',art:'bell',title:'The sleeping face',facing:'Under the copper bell',alt:'An enormous sleeping stone face fills the wall. A bell hangs in front. The bridge lies left; the mushroom garden glows to the right.',spots:[go('bridge','Return to the bridge',15,49,'bridge-back',19,40),go('mushroom','Descend into the lantern garden',86,53,'mushroom',18,36),{id:'bell',label:'Pull the bell rope',x:50,y:42,w:14,h:24,action:'bell'}, {...go('mouth','Step between the stone lips',50,67,'tea',31,23),requires:'mouth'}]},
 tea:{room:'tea',art:'tea',title:'A room for one',facing:'Someone has put the kettle on',alt:'A red velvet chair, a steaming cup, and an uncut lemon. A little round window overlooks the purple chasm.',spots:[look('chair','Sit in the velvet chair',40,61,'chair',28,34),go('bell','Step back through the stone lips',10,48,'bell',18,50)]},
 chair:{room:'tea',art:'tea',title:'A room for one',facing:'No hurry',alt:'Steam curls over a teacup beside an uncut lemon; tiny windows shine across the shaft.',parent:'tea',zoom:[1.6,63,49],spots:[{id:'tea',label:'Warm your hands around the cup',x:49,y:57,w:28,h:25,action:'tea'},back('tea','Leave the chair')]}
};
export const artUrls=Object.fromEntries(Object.entries(import.meta.glob('../assets/wonder/*.webp',{eager:true,query:'?url',import:'default'})).map(([path,url])=>[path.split('/').pop()!.replace('.webp',''),url as string]));
