function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Orders") || ss.insertSheet("Orders");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "วันเวลาสั่งซื้อ",
      "เลขที่คำสั่งซื้อ",
      "ชื่อลูกค้า",
      "เบอร์โทร",
      "ที่อยู่",
      "สินค้า",
      "จำนวน",
      "ราคา",
      "ยอดรวม",
      "สถานะ"
    ]);
  }

  const order = JSON.parse(e.postData.contents);

  order.items.forEach(item => {
    sheet.appendRow([
      new Date(order.createdAt),
      order.orderId,
      order.customerName,
      order.phone,
      order.address,
      item.product,
      item.quantity,
      item.unitPrice,
      item.subtotal,
      order.status
    ]);
  });

  return ContentService.createTextOutput("Success");
}
