export function tafqeet(amount: number): string {
  if (amount === 0) return "صفر لا غير";
  
  const units = ["", "ألف", "مليون", "مليار", "تريليون"];
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  
  const getHundreds = (num: number): string => {
    let text = "";
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (h > 0) text += hundreds[h];
    
    if (remainder > 0) {
      if (text !== "") text += " و ";
      
      if (remainder === 1) text += "واحد";
      else if (remainder === 2) text += "اثنان";
      else if (remainder === 11) text += "أحد عشر";
      else if (remainder === 12) text += "اثنا عشر";
      else if (remainder > 10 && remainder < 20) text += ones[remainder % 10] + " عشر";
      else {
        const o = remainder % 10;
        const t = Math.floor(remainder / 10);
        if (o > 0) text += ones[o];
        if (o > 0 && t > 0) text += " و ";
        if (t > 0) text += tens[t];
      }
    }
    return text;
  };

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let result = "";
  let tempInt = integerPart;
  let unitIndex = 0;
  
  const chunks = [];
  while (tempInt > 0) {
    chunks.push(tempInt % 1000);
    tempInt = Math.floor(tempInt / 1000);
  }
  
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;
    
    let chunkText = "";
    if (i === 1) { // Thousands
      if (chunk === 1) chunkText = "ألف";
      else if (chunk === 2) chunkText = "ألفان";
      else if (chunk >= 3 && chunk <= 10) chunkText = getHundreds(chunk) + " آلاف";
      else chunkText = getHundreds(chunk) + " ألف";
    } else if (i === 2) { // Millions
      if (chunk === 1) chunkText = "مليون";
      else if (chunk === 2) chunkText = "مليونان";
      else if (chunk >= 3 && chunk <= 10) chunkText = getHundreds(chunk) + " ملايين";
      else chunkText = getHundreds(chunk) + " مليون";
    } else {
      chunkText = getHundreds(chunk);
      if (i > 0) chunkText += " " + units[i];
    }
    
    if (result !== "") result += " و ";
    result += chunkText;
  }
  
  let finalString = result ? result + " جنيه" : "";
  
  if (decimalPart > 0) {
    const decText = getHundreds(decimalPart);
    if (finalString !== "") finalString += " و ";
    finalString += decText + " قرش";
  }
  
  return finalString + " فقط لا غير";
}
