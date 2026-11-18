'use strict';
// Verifica in sola lettura i tre file migrati sul NAS, senza stampare contenuti.
const fs=require('node:fs/promises');
const path=require('node:path');
const inventory=require('./inventario-archivio');
const {safePath}=require('./api-originale-archivio');
async function main(){
 const root=process.env.NAS_ORIGINALE_ARCHIVIO_ROOT;
 if(!root||!path.isAbsolute(root))throw Error('Impostare NAS_ORIGINALE_ARCHIVIO_ROOT assoluta');
 let count=0,total=0;
 for(const item of inventory){
  const file=path.join(root,...safePath(item.path));
  try{
   const stat=await fs.lstat(file);
   if(!stat.isFile()||stat.size!==item.bytes){console.log('NO '+item.path+' dimensione non corrispondente');continue}
   console.log('OK '+item.path+' ('+stat.size+' byte)');
   count++;total+=stat.size;
  }catch(e){console.log('NO '+item.path+' ('+e.code+')')}
 }
 console.log(count+'/'+inventory.length+' file verificati, '+total+' byte');
 if(count!==inventory.length)process.exitCode=1;
}
main().catch(e=>{console.error('Verifica archivio:',e.message);process.exitCode=1});
