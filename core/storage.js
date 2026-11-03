let database;
function open() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('tools-data', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records');
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = null; }; resolve(request.result); };
    request.onerror = () => { database = null; reject(request.error); };
    request.onblocked = () => { database = null; reject(new Error('Almacenamiento bloqueado por otra pestaña')); };
  });
  return database;
}
export async function getData(key) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly');
    const request = tx.objectStore('records').get(key);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Lectura cancelada'));
  });
}
export async function setData(key, value) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    tx.objectStore('records').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Guardado cancelado'));
  });
}
