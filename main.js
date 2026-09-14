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
let webglCamera, webglParticles;

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
  
  webglCamera = camera;
  webglParticles = particlesMesh;

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
  const timer = new THREE.Timer();

  const tick = (timestamp) => {
    timer.update(timestamp);
    const elapsedTime = timer.getElapsed();

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
  window.requestAnimationFrame(tick);

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
let smoothScroll;

const initScroll = () => {
  const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  smoothScroll = lenis;

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

  // Magnetic Pull Math - Refactored to a reusable function
  initMagneticButtons(document.querySelectorAll('.magnetic'));
};

const initMagneticButtons = (elements) => {
  elements.forEach(btn => {
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

const unlockContactInfo = () => {
  smoothScroll?.stop();
  document.body.classList.add('contact-open');

  const contactPage = document.getElementById('contact-page');
  if (contactPage) contactPage.scrollTop = 0;
  contactPage?.setAttribute('aria-hidden', 'false');

  // Master Timeline for "Closing Space" and "Zoom In" Transition
  const tl = gsap.timeline({
    onComplete: () => {
      // Re-initialize magnetic pull on new elements
      initMagneticButtons(document.querySelectorAll('#contact-page .magnetic'));
    }
  });

  // 1. Closing Space Animation (Collapse current UI)
  tl.to('#smooth-wrapper', {
    scale: 0.9,
    opacity: 0,
    filter: 'blur(10px)',
    duration: 1.2,
    ease: 'power3.inOut'
  }, 0);

  tl.to('.elite-nav', {
    y: '-100%',
    opacity: 0,
    duration: 0.8,
    ease: 'power3.in'
  }, 0);

  // 2. Zoom In Space Animation (WebGL Camera flies forward)
  if (webglCamera && webglParticles) {
    tl.to(webglCamera.position, {
      z: -5, // Fly through the particles
      duration: 2.5,
      ease: 'power4.inOut'
    }, 0);
    
    tl.to(webglParticles.material, {
      opacity: 0.2, // dim the particles a bit
      duration: 2,
    }, 0.5);
  }

  // 3. Reveal Contact Page (Award Winning Animations)
  tl.set(contactPage, { pointerEvents: 'auto' }, 1.5)
    .to(contactPage, {
      opacity: 1,
      duration: 1,
      ease: 'power2.out'
    }, 1.5);

  // Reveal Text
  tl.fromTo('.contact-reveal .reveal-inner', 
    { y: '110%', rotate: 5 }, 
    { y: '0%', rotate: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out' },
    1.8
  );

  // Fade up other elements
  tl.fromTo('.contact-fade',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' },
    2.2
  );

  // Setup Return Button
  document.getElementById('return-btn').addEventListener('click', () => {
    returnToSurface();
  });
};

const returnToSurface = () => {
  const tl = gsap.timeline();
  const contactPage = document.getElementById('contact-page');
  contactPage?.setAttribute('aria-hidden', 'true');
  
  tl.set(contactPage, { pointerEvents: 'none' })
    .to(contactPage, { opacity: 0, duration: 0.8, ease: 'power2.in' }, 0);

  if (webglCamera && webglParticles) {
    tl.to(webglCamera.position, { z: 3, duration: 2, ease: 'power4.inOut' }, 0);
    tl.to(webglParticles.material, { opacity: 0.6, duration: 1.5 }, 0.5);
  }

  tl.to('#smooth-wrapper', { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' }, 0.5);
  tl.to('.elite-nav', { y: '0%', opacity: 1, duration: 1, ease: 'power3.out' }, 0.8);
  tl.call(() => {
    document.body.classList.remove('contact-open');
    smoothScroll?.start();
  }, [], 0.8);
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

// ==========================================
// 5. MOBILE MENU
// ==========================================
const initMobileMenu = () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');
  const eliteNav = document.querySelector('.elite-nav');
  const navItems = document.querySelectorAll('.nav-item');

  if (!menuBtn || !navMenu) return;

  const toggleMenu = () => {
    const isOpen = !navMenu.classList.contains('active');
    menuBtn.classList.toggle('active', isOpen);
    navMenu.classList.toggle('active', isOpen);
    eliteNav.classList.toggle('menu-open', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  };

  menuBtn.addEventListener('click', toggleMenu);

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        toggleMenu();
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initWebGL();
  initCursor();
  initScroll();
  setupAuth();
  initMobileMenu();
});
