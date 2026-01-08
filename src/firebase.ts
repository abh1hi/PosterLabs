import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "poster-lab-demo.firebaseapp.com",
    projectId: "poster-lab-demo",
    storageBucket: "poster-lab-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    databaseURL: "http://127.0.0.1:9000/?ns=poster-lab-demo"
};

const app = initializeApp(firebaseConfig);

// Detect environment
const isTunnel = location.hostname.includes("devtunnels.ms");
const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const isDev = import.meta.env.DEV;

const auth = getAuth(app);

if (isTunnel) {
    console.log("Connecting to Firebase Emulators (Tunnel via HTTPS)...");
    // Auth supports HTTPS via URL string
    connectAuthEmulator(auth, "https://3czzqk3l-9099.use2.devtunnels.ms");
} else if (isLocalhost || isDev) {
    console.log(`Connecting to Firebase Emulators (${location.hostname})...`);
    // Use the current hostname to connect to the emulator (supporting network access)
    // If hostname is localhost, it works. If it's an IP, it works (assuming emulator binds to 0.0.0.0 or that IP)
    connectAuthEmulator(auth, `http://${location.hostname}:9099`);
}

const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
