// ตั้งค่า Google Apps Script Web App URL หลัง Deploy แล้ว
const GOOGLE_SHEETS_WEB_APP_URL = ""; // ตัวอย่าง: https://script.google.com/macros/s/...../exec

const products = [
  {id:"SKU-001",name:"บะหมี่กึ่งสำเร็จรูปรสต้มยำ",description:"รสต้มยำเข้มข้น เปรี้ยวเผ็ดกำลังดี",price:15,emoji:"🍜",tone:"orange"},
  {id:"SKU-002",name:"บะหมี่กึ่งสำเร็จรูปรสหมูสับ",description:"น้ำซุปกลมกล่อม หอมอร่อย",price:12,emoji:"🍝",tone:"yellow"}
];
let cart = JSON.parse(localStorage.getItem("noodleCart") || "{}");
const $ = id => document.getElementById(id);
const money = n => "฿" + Number(n).toLocaleString("th-TH");
function saveCart(){localStorage.setItem("noodleCart",JSON.stringify(cart));renderCart()}
function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0)}
function total(){return products.reduce((s,p)=>s+p.price*(cart[p.id]||0),0)}
function renderProducts(){
  $("product-grid").innerHTML=products.map(p=>`<article class="product-card"><div class="product-image ${p.tone}"><span class="sku">${p.id}</span>${p.emoji}</div><div class="product-info"><h3>${p.name}</h3><p>${p.description}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${p.id}">+ เพิ่มลงตะกร้า</button></div></div></article>`).join("");
}
function renderCart(){
  $("cart-count").textContent=cartCount();$("cart-total").textContent=money(total());$("checkout-total").textContent=money(total());
  const lines=products.filter(p=>cart[p.id]).map(p=>`<div class="cart-line"><div><b>${p.name}</b><small>${money(p.price)} / ชิ้น</small></div><div class="qty"><button data-minus="${p.id}">−</button><b>${cart[p.id]}</b><button data-plus="${p.id}">+</button></div></div>`).join("");
  $("cart-items").innerHTML=lines||'<p style="color:#777">ยังไม่มีสินค้าในตะกร้า</p>';
  $("checkout-open").disabled=cartCount()===0;$("checkout-open").style.opacity=cartCount()?1:.5;
}
function showToast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function openCart(){$("cart-drawer").classList.add("open");$("overlay").classList.add("show")}
function closeCart(){$("cart-drawer").classList.remove("open");$("overlay").classList.remove("show")}
document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");if(add){cart[add.dataset.add]=(cart[add.dataset.add]||0)+1;saveCart();showToast("เพิ่มสินค้าลงตะกร้าแล้ว")}
  const plus=e.target.closest("[data-plus]");if(plus){cart[plus.dataset.plus]=(cart[plus.dataset.plus]||0)+1;saveCart()}
  const minus=e.target.closest("[data-minus]");if(minus){cart[minus.dataset.minus]--;if(cart[minus.dataset.minus]<=0)delete cart[minus.dataset.minus];saveCart()}
});
$("cart-toggle").onclick=openCart;$("close-cart").onclick=closeCart;$("overlay").onclick=closeCart;
$("checkout-open").onclick=()=>{if(cartCount()){closeCart();$("checkout-modal").classList.add("show")}};
$("close-checkout").onclick=()=>$("checkout-modal").classList.remove("show");
$("order-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!cartCount())return;
  const form=Object.fromEntries(new FormData(e.target).entries());
  const orderId="SS"+Date.now().toString().slice(-9);
  const items=products.filter(p=>cart[p.id]).map(p=>({sku:p.id,product:p.name,quantity:cart[p.id],unitPrice:p.price,subtotal:p.price*cart[p.id]}));
  const order={orderId,createdAt:new Date().toISOString(),...form,items,total:total(),status:"รอหยิบสินค้า"};
  const button=e.target.querySelector('button[type="submit"]');button.disabled=true;button.textContent="กำลังบันทึก...";
  try{
    localStorage.setItem("lastOrder",JSON.stringify(order));
    if(GOOGLE_SHEETS_WEB_APP_URL){
      await fetch(GOOGLE_SHEETS_WEB_APP_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(order)});
      showToast("ส่งคำสั่งซื้อไปยัง Google Sheets แล้ว");
    }else{
      showToast("บันทึกตัวอย่างในเครื่องแล้ว — ตั้งค่า Google Sheets ก่อนใช้งานจริง");
      console.log("ORDER DEMO",order);
    }
    const label=buildLabel(order);const w=window.open("","_blank");if(w){w.document.write(label);w.document.close()}
    cart={};saveCart();e.target.reset();$("checkout-modal").classList.remove("show");
  }catch(err){showToast("เกิดข้อผิดพลาด กรุณาลองใหม่");console.error(err)}
  finally{button.disabled=false;button.textContent="ยืนยันคำสั่งซื้อ"}
});
function buildLabel(o){
 const safe=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 return `<!doctype html><html lang="th"><meta charset="utf-8"><title>ใบจ่าหน้าพัสดุ ${safe(o.orderId)}</title><style>body{font-family:Arial,sans-serif;padding:25px;color:#111}.label{border:2px solid #111;padding:22px;max-width:650px;margin:auto}.top{display:flex;justify-content:space-between;border-bottom:1px solid;padding-bottom:12px}.to{font-size:20px;font-weight:bold;margin-top:20px}.address{font-size:17px;line-height:1.7;min-height:80px}.items{border-top:1px solid;margin-top:15px;padding-top:12px}.print{padding:10px 20px;margin:20px auto;display:block}@media print{.print{display:none}}</style><div class="label"><div class="top"><b>เส้นสุข NOODLE HOUSE</b><b>เลขที่คำสั่งซื้อ: ${safe(o.orderId)}</b></div><p>ผู้รับพัสดุ</p><div class="to">${safe(o.customerName)}</div><div class="address">${safe(o.address)}<br>โทร. ${safe(o.phone)}</div><div class="items"><b>รายการสินค้า</b><ul>${o.items.map(i=>`<li>${safe(i.product)} (${safe(i.sku)}) × ${i.quantity}</li>`).join("")}</ul><b>ยอดรวมสินค้า: ฿${o.total}</b></div><p>หมายเหตุ: ${safe(o.note||"-")}</p></div><button class="print" onclick="window.print()">พิมพ์ใบจ่าหน้า / บันทึก PDF</button></html>`;
}
renderProducts();renderCart();
