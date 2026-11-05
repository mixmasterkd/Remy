import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{const svg=await readFile(new URL('../icon.svg',import.meta.url),'utf8');for(const size of [192,512]){const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});await page.setContent(`<style>body{margin:0;background:#303992}svg{display:block;width:100vw;height:100vh}</style>${svg}`);await page.screenshot({path:fileURLToPath(new URL(`../icon-${size}.png`,import.meta.url))});await page.close();}}finally{await browser.close();}
