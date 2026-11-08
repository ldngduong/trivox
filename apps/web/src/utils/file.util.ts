export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc tệp ảnh'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp ảnh'));
    reader.readAsDataURL(file);
  });
}
