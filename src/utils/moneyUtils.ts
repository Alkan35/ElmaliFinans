function displayMoney(value: number | string | undefined | null): string {
     if (value === undefined || value === null || value === '') return '0,00 TL';
     let numValue: number;
     if (typeof value === 'string') {
          const cleanedValue = value.replace(/\./g, '').replace(',', '.').replace('TL', '').trim();
          numValue = Number(cleanedValue);
          if (isNaN(numValue)) return `Geçersiz Tutar`;
     } else {
          numValue = value;
     }

     return new Intl.NumberFormat('tr-TR', {
         style: 'currency',
         currency: 'TRY',
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
     }).format(numValue);
}

export { displayMoney }; // Fonksiyonu dışa aktar 