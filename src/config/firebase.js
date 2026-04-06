import { initializeApp } from 'firebase/app';
import { getDatabase, ref } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC-YOBctE7AYs799KjMyP8iFzPLuqqABm0",
  authDomain: "dog-calendar-96cd5.firebaseapp.com",
  databaseURL: "https://dog-calendar-96cd5-default-rtdb.firebaseio.com",
  projectId: "dog-calendar-96cd5",
  storageBucket: "dog-calendar-96cd5.firebasestorage.app",
  messagingSenderId: "1012069040252",
  appId: "1:1012069040252:web:7ede21f6d18001b5f049f9"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export function prodeRef(path) {
  return ref(db, `/prode/${path}`);
}
