import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Motion Libraries
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// WebGL
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. WEBGL HERO CANVAS (The "Jaw-Drop")
// ==========================================
const initWebGL = () => {
  const canvas = document.querySelector('#webgl-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create an abstract particle field
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 2000;
  const posArray = new Float32Array(particlesCount * 3);

  for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.015,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(particlesGeometry, material);
  scene.add(particlesMesh);

  camera.position.z = 3;

  // Mouse Interactivity
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  });

  // Animation Loop
  const clock = new THREE.Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate slowly
    particlesMesh.rotation.y = -0.05 * elapsedTime;
    particlesMesh.rotation.x = 0.05 * elapsedTime;

    // Fluid mouse follow
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    
    particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };
  tick();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

// ==========================================
// 2. SMOOTH SCROLL & ADVANCED GSAP
// ==========================================
const initScroll = () => {
  const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Hero Reveal Animation
  const tl = gsap.timeline();
  tl.fromTo('.reveal-text', 
    { y: '110%', rotate: 5 }, 
    { y: '0%', rotate: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.5 }
  ).fromTo('.hero-sub',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
    '-=0.8'
  );

  // Bento Grid Scale Up
  gsap.utils.toArray('.gs-scale-up').forEach((el) => {
    gsap.fromTo(el, 
      { scale: 0.9, opacity: 0, y: 50 },
      { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: {
          trigger: el, start: 'top 85%'
      }}
    );
  });

  // General Fade Ups
  gsap.utils.toArray('.gs-fade-up').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: {
          trigger: el, start: 'top 90%'
      }}
    );
  });
};

// ==========================================
// 3. ELITE CUSTOM CURSOR
// ==========================================
const initCursor = () => {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  
  let mx = 0, my = 0, rx = 0, ry = 0;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    gsap.set(dot, { x: mx, y: my });
  });

  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    gsap.set(ring, { x: rx, y: ry });
  });

  document.querySelectorAll('a, button, .magnetic, input').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover-active'));
  });

  // Magnetic Pull Math
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const h = rect.width / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - (rect.height / 2);
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.5, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
    });
  });
};

// ==========================================
// 4. FIREBASE AUTHENTICATION (Unchanged Logic)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBs7b_TVLq8UScPNyJmzjFLCQ7ZgGndTLA",
  authDomain: "j-me-graphix.firebaseapp.com",
  projectId: "j-me-graphix",
  storageBucket: "j-me-graphix.firebasestorage.app",
  messagingSenderId: "15287553893",
  appId: "1:15287553893:web:2e3813477a4f6a6a205b8c",
  measurementId: "G-REMS5FKXNJ"
};

let app, auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  getAnalytics(app);
} catch (error) {
  console.warn("Firebase config error", error);
}

let confirmationResult = null;

const unlockContactInfo = () => {
  document.getElementById('auth-flow').style.display = 'none';
  document.querySelector('.terminal-title').style.display = 'none';
  document.querySelector('.terminal-sub').style.display = 'none';
  
  const contactInfo = document.getElementById('contact-info');
  contactInfo.style.display = 'block';
  
  gsap.fromTo(contactInfo, 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
  );
};

const setupAuth = () => {
  if (!auth) return;

  const emailAuthWrapper = document.getElementById('email-auth-wrapper');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  
  const signinEmail = document.getElementById('signin-email');
  const signinPassword = document.getElementById('signin-password');
  const signinBtn = document.getElementById('signin-btn');
  
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupBtn = document.getElementById('signup-btn');
  
  const toggleToSignup = document.getElementById('toggle-to-signup');
  const toggleToSignin = document.getElementById('toggle-to-signin');
  
  const googleBtn = document.getElementById('google-auth-btn');
  const authMessage = document.getElementById('auth-message');

  const showMessage = (msg, isError = false) => {
    authMessage.textContent = msg;
    authMessage.style.color = isError ? '#ff4a4a' : 'var(--green)';
  };

  // --- GOOGLE AUTH ---
  googleBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    showMessage("Redirecting to Google Secure Node...");
    signInWithPopup(auth, provider)
      .then(() => unlockContactInfo())
      .catch((error) => showMessage("Authentication failed: " + error.message, true));
  });

  // --- TOGGLE FORMS ---
  toggleToSignup.addEventListener('click', () => {
    signinForm.style.display = 'none';
    signupForm.style.display = 'block';
    showMessage("");
  });

  toggleToSignin.addEventListener('click', () => {
    signupForm.style.display = 'none';
    signinForm.style.display = 'block';
    showMessage("");
  });

  // --- SIGN IN ---
  signinBtn.addEventListener('click', () => {
    const email = signinEmail.value.trim();
    const password = signinPassword.value.trim();
    
    if (!email || !password) return showMessage("Email and Password required", true);
    
    showMessage("Authenticating...");
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        showMessage("Access Granted.");
        unlockContactInfo();
      })
      .catch((error) => {
        showMessage("Invalid credentials.", true);
        console.error(error);
      });
  });

  // --- SIGN UP ---
  signupBtn.addEventListener('click', () => {
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    
    if (!email || !password) return showMessage("Email and Password required", true);
    if (password.length < 6) return showMessage("Password must be at least 6 characters", true);
    
    showMessage("Creating secure account...");
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        showMessage("Account created and verified.");
        unlockContactInfo();
      })
      .catch((error) => {
        showMessage(error.message, true);
        console.error(error);
      });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initWebGL();
  initCursor();
  initScroll();
  setupAuth();
});
