(function ($) {
    "use strict";

    // ---- Theme toggle (single class drives everything via CSS vars) ----
    var $toggle = $('#dark-mode');

    function applyTheme(isLight) {
        if (isLight) {
            $('body').addClass('light-mode');
        } else {
            $('body').removeClass('light-mode');
        }
    }

    // Restore saved preference (default: dark)
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    var startLight = saved === 'light';
    $toggle.prop('checked', startLight);
    applyTheme(startLight);

    $toggle.on('change', function () {
        var isLight = $(this).prop('checked');
        applyTheme(isLight);
        try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
    });

    // ---- Smooth scrolling ----
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({ scrollTop: target.offset().top }, 800, 'easeInOutExpo');
                return false;
            }
        }
    });

    // ---- Scroll-to-top button ----
    $(document).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.scroll-to-top').fadeIn();
        } else {
            $('.scroll-to-top').fadeOut();
        }
    });

    // ---- Close responsive menu on link click ----
    $('.js-scroll-trigger').click(function () {
        $('.navbar-collapse').collapse('hide');
    });

    // ---- Scrollspy ----
    $('body').scrollspy({ target: '#mainNav', offset: 10 });

    // ---- Navbar shrink logic removed (navbar is no longer fixed) ----

    // ============================================================
    // Interactive Space Freighter Flight & Jet Audio Synthesizer
    // ============================================================
    
    // 1. Web Audio API Jet Sound Synthesizer
    var JetSound = {
        audioCtx: null,
        noiseNode: null,
        osc1: null,
        osc2: null,
        filterNode: null,
        gainNode: null,
        isPlaying: false,
        isStarting: false,
        wantsToPlay: false,
        isUnlocked: false,
        lastTapSoundAt: 0,
        stopTimer: null,

        init: function () {
            return false;
        },

        resume: function () {
            var self = this;
            if (!this.audioCtx && !this.init()) {
                return Promise.reject(new Error('AudioContext unavailable'));
            }
            if (!this.audioCtx) return Promise.reject(new Error('AudioContext unavailable'));
            if (this.audioCtx.state === 'suspended') {
                return this.audioCtx.resume().then(function () {
                    self.isUnlocked = self.audioCtx && self.audioCtx.state === 'running';
                });
            }
            this.isUnlocked = this.audioCtx.state === 'running';
            return Promise.resolve();
        },

        start: function () {
            this.wantsToPlay = true;
            if (this.isPlaying) return;
            if (this.isStarting) {
                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    var pendingSelf = this;
                    this.resume().then(function () {
                        pendingSelf.isStarting = false;
                        pendingSelf.start();
                    }).catch(function (e) {
                        pendingSelf.isStarting = false;
                        console.warn("Web Audio resume failed:", e);
                    });
                }
                return;
            }
            this.isStarting = true;
            try {
                this.init();
                if (!this.audioCtx) {
                    this.isStarting = false;
                    return;
                }

                var self = this;
                var play = function () {
                    if (!self.wantsToPlay || self.isPlaying) {
                        self.isStarting = false;
                        return;
                    }
                    var ctx = self.audioCtx;
                    var now = ctx.currentTime;

                    // Create White Noise buffer for wind resistance / turbine roar
                    var bufferSize = ctx.sampleRate * 2;
                    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    var data = buffer.getChannelData(0);
                    for (var i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }

                    self.noiseNode = ctx.createBufferSource();
                    self.noiseNode.buffer = buffer;
                    self.noiseNode.loop = true;

                    // Low-pass filter with high resonance (Q) for wind sweep
                    self.filterNode = ctx.createBiquadFilter();
                    self.filterNode.type = 'lowpass';
                    self.filterNode.frequency.setValueAtTime(220, now);
                    self.filterNode.Q.setValueAtTime(4.5, now);

                    // Sawtooth & Triangle oscillators for engine whine and core rumble
                    self.osc1 = ctx.createOscillator();
                    self.osc1.type = 'sawtooth';
                    self.osc1.frequency.setValueAtTime(62, now); // low combustion rumble

                    self.osc2 = ctx.createOscillator();
                    self.osc2.type = 'triangle';
                    self.osc2.frequency.setValueAtTime(124, now); // high turbine whine

                    var oscGain = ctx.createGain();
                    oscGain.gain.setValueAtTime(0.045, now);

                    // Master gain
                    self.gainNode = ctx.createGain();
                    self.gainNode.gain.setValueAtTime(0, now);

                    // Connections
                    self.noiseNode.connect(self.filterNode);
                    self.osc1.connect(oscGain);
                    self.osc2.connect(oscGain);
                    oscGain.connect(self.filterNode);
                    self.filterNode.connect(self.gainNode);
                    self.gainNode.connect(ctx.destination);

                    // Start sources
                    self.noiseNode.start(0);
                    self.osc1.start(0);
                    self.osc2.start(0);

                    // Ramping parameters (Jet Engine takeoff simulation)
                    self.gainNode.gain.linearRampToValueAtTime(0.18, now + 0.3);
                    self.filterNode.frequency.exponentialRampToValueAtTime(1450, now + 0.7);
                    self.osc1.frequency.exponentialRampToValueAtTime(190, now + 0.7);
                    self.osc2.frequency.exponentialRampToValueAtTime(380, now + 0.7);

                    self.isPlaying = true;
                    self.isStarting = false;
                };

                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume().then(play).catch(function (e) {
                        self.isStarting = false;
                        console.warn("Web Audio resume failed:", e);
                    });
                } else {
                    play();
                }
            } catch (e) {
                this.isStarting = false;
                console.warn("Web Audio failed to play:", e);
            }
        },

        stop: function () {
            this.wantsToPlay = false;
            this.isStarting = false;
            if (!this.isPlaying) return;
            try {
                var ctx = this.audioCtx;
                if (!ctx || !this.gainNode) {
                    this.isPlaying = false;
                    return;
                }
                var now = ctx.currentTime;

                this.gainNode.gain.cancelScheduledValues(now);
                this.gainNode.gain.setValueAtTime(Math.max(this.gainNode.gain.value, 0.001), now);
                this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                if (this.filterNode) {
                    this.filterNode.frequency.cancelScheduledValues(now);
                    this.filterNode.frequency.exponentialRampToValueAtTime(80, now + 0.5);
                }

                var noise = this.noiseNode;
                var o1 = this.osc1;
                var o2 = this.osc2;
                var filt = this.filterNode;
                var gn = this.gainNode;

                this.stopTimer = setTimeout(function () {
                    try { noise.stop(); } catch (err) {}
                    try { o1.stop(); } catch (err) {}
                    try { o2.stop(); } catch (err) {}
                    
                    try { noise.disconnect(); } catch (err) {}
                    try { o1.disconnect(); } catch (err) {}
                    try { o2.disconnect(); } catch (err) {}
                    try { filt.disconnect(); } catch (err) {}
                    try { gn.disconnect(); } catch (err) {}
                }, 600);

                this.noiseNode = null;
                this.osc1 = null;
                this.osc2 = null;
                this.filterNode = null;
                this.gainNode = null;
                this.isPlaying = false;
            } catch (e) {
                this.isPlaying = false;
                console.warn("Web Audio failed to stop:", e);
            }
        },

        playTap: function () {
            var self = this;
            var nowMs = Date.now();
            if (nowMs - this.lastTapSoundAt < 90) return;
            this.lastTapSoundAt = nowMs;

            this.resume().then(function () {
                try {
                    var ctx = self.audioCtx;
                    if (!ctx || ctx.state !== 'running') return;
                    var now = ctx.currentTime;
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    var filter = ctx.createBiquadFilter();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(640, now);
                    osc.frequency.exponentialRampToValueAtTime(380, now + 0.09);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(1200, now);

                    gain.gain.setValueAtTime(0.0001, now);
                    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.13);

                    setTimeout(function () {
                        try { osc.disconnect(); } catch (e) {}
                        try { filter.disconnect(); } catch (e) {}
                        try { gain.disconnect(); } catch (e) {}
                    }, 180);
                } catch (e) {
                    console.warn('Tap sound failed:', e);
                }
            }).catch(function () {});
        }
    };

    // Auto-initialize and resume audio context upon actual user gestures anywhere on the page
    $(document).on('click pointerdown touchstart keydown', function () {
        JetSound.resume().catch(function (e) {
            console.warn('Global audio resume failed:', e);
        });
    });

    $('#copyrightYear').text(new Date().getFullYear());

    $(document).on('pointerdown', function (e) {
        if ($(e.target).closest('#developerTerminal, #planeSoundHint, #mainNav').length === 0) return;
        JetSound.playTap();
    });

    $(document).on('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if ($(e.target).closest('#developerTerminal').length) return;
    });

    var planeSoundHint = document.getElementById('planeSoundHint');

    function hidePlaneSoundHint() {
        if (!planeSoundHint) return;
        planeSoundHint.classList.add('is-hidden');
    }

    function unlockJetSoundAndContinue(callback) {
        JetSound.isStarting = false;
        JetSound.resume().then(function () {
            hidePlaneSoundHint();
            if (typeof callback === 'function') callback();
        }).catch(function (e) {
            console.warn('Audio unlock failed:', e);
            if (typeof callback === 'function') callback();
        });
    }

    // ========================================================================
    // CELESTIAL BACKGROUND CANVAS (Moon, Stars, Asteroids - Minimal Movement)
    // ========================================================================
    var celestialCanvas = document.getElementById('celestialCanvas');
    var celestialCtx = celestialCanvas.getContext('2d');
    
    var celestialWidth = celestialCanvas.clientWidth;
    var celestialHeight = celestialCanvas.clientHeight;
    
    // Resize and set up celestial canvas
    function resizeCelestialCanvas() {
        celestialWidth = celestialCanvas.clientWidth;
        celestialHeight = celestialCanvas.clientHeight;
        celestialCanvas.width = celestialWidth;
        celestialCanvas.height = celestialHeight;
    }
    resizeCelestialCanvas();
    $(window).on('resize', resizeCelestialCanvas);

    // Celestial background objects (static/minimal movement)
    var celestialBgObjects = [];
    var celestialBgStars = [];
    
    function initCelestialBackground() {
        celestialBgStars = [];
        for (var s = 0; s < 120; s++) {
            celestialBgStars.push({
                x: Math.random() * celestialWidth,
                y: Math.random() * celestialHeight,
                size: 0.6 + Math.random() * 1.6,
                speedMult: 0.05 + Math.random() * 0.15,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        celestialBgObjects = [
            {
                type: 'sun',
                x: celestialWidth * 0.58,
                y: 86,
                size: 15,
                color: '#f59e0b',
                speed: 0.02
            },
            {
                type: 'saturn',
                x: celestialWidth * 0.82,
                y: 70,
                size: 11,
                color: '#d8b4fe',
                speed: 0.015
            },
            {
                type: 'mars',
                x: celestialWidth * 0.7,
                y: 50,
                size: 8,
                color: '#fca5a5',
                speed: 0.02
            },
            {
                type: 'moon',
                x: celestialWidth - 120,
                y: 30,
                size: 13,
                color: '#e2e8f0',
                speed: 0.008
            },
            {
                type: 'asteroid',
                x: celestialWidth * 0.42,
                y: 72,
                size: 5,
                color: '#8a979e',
                rotation: 0,
                rotSpeed: 0.008,
                speed: 0.01
            },
            {
                type: 'asteroid',
                x: celestialWidth * 0.55,
                y: 20,
                size: 6.5,
                color: '#8a979e',
                rotation: 1.2,
                rotSpeed: -0.006,
                speed: 0.012
            },
            {
                type: 'asteroid',
                x: celestialWidth * 0.85,
                y: 48,
                size: 4.5,
                color: '#8a979e',
                rotation: 0.5,
                rotSpeed: 0.01,
                speed: 0.008
            },
            {
                type: 'fighter',
                x: celestialWidth * 0.38,
                y: 78,
                size: 12,
                color: '#bae6fd',
                rotation: -0.08,
                speed: 0.03
            },
            {
                type: 'twinFighter',
                x: celestialWidth * 0.62,
                y: 62,
                size: 10,
                color: '#cbd5e1',
                rotation: 0.08,
                speed: 0.026
            },
            {
                type: 'greenPod',
                x: celestialWidth * 0.92,
                y: 82,
                size: 9,
                color: '#86efac',
                rotation: -0.04,
                speed: 0.02
            }
        ];
    }
    initCelestialBackground();

    // Animate celestial background
    var celestialTime = 0;
    function animCelestialBackground() {
        celestialTime += 0.008; // much slower than tunnel
        
        celestialCtx.clearRect(0, 0, celestialWidth, celestialHeight);
        
        // Draw background stars
        for (var s = 0; s < celestialBgStars.length; s++) {
            var star = celestialBgStars[s];
            star.x -= 0.35 * star.speedMult;
            if (star.x < -5) {
                star.x = celestialWidth + 5;
                star.y = Math.random() * celestialHeight;
            }
            
            var starGlow = 0.3 + (Math.sin(celestialTime * 1.5 + star.twinkle) * 0.25);
            celestialCtx.globalAlpha = Math.min(0.85, starGlow);
            celestialCtx.fillStyle = star.size > 1.4 ? '#f8fafc' : accentColor;
            celestialCtx.shadowBlur = star.size > 1.4 ? 4 : 1.5;
            celestialCtx.shadowColor = celestialCtx.fillStyle;
            celestialCtx.beginPath();
            celestialCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            celestialCtx.fill();
        }
        celestialCtx.shadowBlur = 0;
        celestialCtx.globalAlpha = 1.0;
        
        // Draw background celestial objects
        for (var c = 0; c < celestialBgObjects.length; c++) {
            var obj = celestialBgObjects[c];
            obj.x -= 0.4 * obj.speed;
            
            if (obj.x < -80) {
                obj.x = celestialWidth + 80;
                obj.y = 20 + Math.random() * (celestialHeight - 40);
            }
            
            celestialCtx.save();
            celestialCtx.globalAlpha = 0.88;
            
            if (obj.type === 'sun') {
                var sunGlow = celestialCtx.createRadialGradient(obj.x, obj.y, 2, obj.x, obj.y, obj.size * 2);
                sunGlow.addColorStop(0, '#fef08a');
                sunGlow.addColorStop(0.3, '#f59e0b');
                sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
                celestialCtx.fillStyle = sunGlow;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size * 2, 0, Math.PI * 2);
                celestialCtx.fill();
                celestialCtx.globalAlpha = 0.8;
                celestialCtx.fillStyle = '#fde68a';
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size * 0.7, 0, Math.PI * 2);
                celestialCtx.fill();
            }
            else if (obj.type === 'saturn') {
                var saturnGlow = celestialCtx.createRadialGradient(obj.x, obj.y, 1, obj.x, obj.y, obj.size * 2.2);
                saturnGlow.addColorStop(0, obj.color);
                saturnGlow.addColorStop(0.8, 'rgba(168, 85, 247, 0.12)');
                saturnGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
                celestialCtx.fillStyle = saturnGlow;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size * 2.2, 0, Math.PI * 2);
                celestialCtx.fill();
                
                celestialCtx.fillStyle = obj.color;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                celestialCtx.fill();
                
                celestialCtx.strokeStyle = '#e9d5ff';
                celestialCtx.lineWidth = 2;
                celestialCtx.save();
                celestialCtx.translate(obj.x, obj.y);
                celestialCtx.rotate(-0.25);
                celestialCtx.scale(1.9, 0.35);
                celestialCtx.beginPath();
                celestialCtx.arc(0, 0, obj.size * 1.3, 0, Math.PI * 2);
                celestialCtx.stroke();
                celestialCtx.restore();
            }
            else if (obj.type === 'mars') {
                var marsGlow = celestialCtx.createRadialGradient(obj.x - 1, obj.y - 1, 0, obj.x, obj.y, obj.size);
                marsGlow.addColorStop(0, '#fca5a5');
                marsGlow.addColorStop(0.9, '#dc2626');
                marsGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
                celestialCtx.fillStyle = marsGlow;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                celestialCtx.fill();
                celestialCtx.strokeStyle = 'rgba(254, 202, 202, 0.5)';
                celestialCtx.lineWidth = 1;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x - 2, obj.y - 1, obj.size * 0.45, 0.2, 2.4);
                celestialCtx.stroke();
            }
            else if (obj.type === 'moon') {
                celestialCtx.fillStyle = obj.color;
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                celestialCtx.fill();
                
                celestialCtx.globalCompositeOperation = 'destination-out';
                celestialCtx.fillStyle = 'black';
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x - obj.size * 0.45, obj.y - obj.size * 0.15, obj.size * 1.05, 0, Math.PI * 2);
                celestialCtx.fill();
                celestialCtx.globalCompositeOperation = 'source-over';
                
                celestialCtx.globalAlpha = 0.08;
                celestialCtx.fillStyle = '#ffffff';
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x, obj.y, obj.size * 1.3, 0, Math.PI * 2);
                celestialCtx.fill();
                celestialCtx.globalAlpha = 0.22;
                celestialCtx.fillStyle = '#94a3b8';
                celestialCtx.beginPath();
                celestialCtx.arc(obj.x + obj.size * 0.25, obj.y - obj.size * 0.25, obj.size * 0.16, 0, Math.PI * 2);
                celestialCtx.arc(obj.x + obj.size * 0.1, obj.y + obj.size * 0.3, obj.size * 0.12, 0, Math.PI * 2);
                celestialCtx.fill();
            }
            else if (obj.type === 'asteroid') {
                obj.rotation += obj.rotSpeed;
                celestialCtx.fillStyle = obj.color;
                celestialCtx.save();
                celestialCtx.translate(obj.x, obj.y);
                celestialCtx.rotate(obj.rotation);
                
                celestialCtx.beginPath();
                var points = 6;
                var radStep = (Math.PI * 2) / points;
                for (var p = 0; p < points; p++) {
                    var r = obj.size * (0.75 + Math.sin(p * 2 + obj.size) * 0.2);
                    var pxVal = Math.cos(p * radStep) * r;
                    var pyVal = Math.sin(p * radStep) * r;
                    if (p === 0) celestialCtx.moveTo(pxVal, pyVal);
                    else celestialCtx.lineTo(pxVal, pyVal);
                }
                celestialCtx.closePath();
                celestialCtx.fill();
                celestialCtx.restore();
            }
            else if (obj.type === 'fighter') {
                celestialCtx.translate(obj.x, obj.y);
                celestialCtx.rotate(obj.rotation);
                celestialCtx.shadowBlur = 8;
                celestialCtx.shadowColor = '#38bdf8';
                celestialCtx.fillStyle = obj.color;
                celestialCtx.beginPath();
                celestialCtx.moveTo(obj.size * 1.4, 0);
                celestialCtx.lineTo(-obj.size * 0.75, -obj.size * 0.42);
                celestialCtx.lineTo(-obj.size * 0.35, 0);
                celestialCtx.lineTo(-obj.size * 0.75, obj.size * 0.42);
                celestialCtx.closePath();
                celestialCtx.fill();
                celestialCtx.fillStyle = '#38bdf8';
                celestialCtx.fillRect(-obj.size * 1.2, -1, obj.size * 0.55, 2);
            }
            else if (obj.type === 'twinFighter') {
                celestialCtx.translate(obj.x, obj.y);
                celestialCtx.rotate(obj.rotation);
                celestialCtx.strokeStyle = '#e2e8f0';
                celestialCtx.fillStyle = obj.color;
                celestialCtx.lineWidth = 1.4;
                celestialCtx.shadowBlur = 7;
                celestialCtx.shadowColor = '#f8fafc';
                celestialCtx.fillRect(-obj.size * 0.85, -obj.size * 0.6, obj.size * 0.28, obj.size * 1.2);
                celestialCtx.fillRect(obj.size * 0.55, -obj.size * 0.6, obj.size * 0.28, obj.size * 1.2);
                celestialCtx.beginPath();
                celestialCtx.moveTo(-obj.size * 0.55, 0);
                celestialCtx.lineTo(obj.size * 0.55, 0);
                celestialCtx.stroke();
                celestialCtx.beginPath();
                celestialCtx.arc(0, 0, obj.size * 0.28, 0, Math.PI * 2);
                celestialCtx.fill();
            }
            else if (obj.type === 'greenPod') {
                celestialCtx.translate(obj.x, obj.y);
                celestialCtx.rotate(obj.rotation);
                celestialCtx.shadowBlur = 8;
                celestialCtx.shadowColor = '#86efac';
                celestialCtx.fillStyle = obj.color;
                celestialCtx.beginPath();
                celestialCtx.ellipse(0, 0, obj.size * 1.25, obj.size * 0.58, 0, 0, Math.PI * 2);
                celestialCtx.fill();
                celestialCtx.fillStyle = '#dcfce7';
                celestialCtx.beginPath();
                celestialCtx.arc(obj.size * 0.22, -obj.size * 0.08, obj.size * 0.32, 0, Math.PI * 2);
                celestialCtx.fill();
            }
            
            celestialCtx.restore();
        }
        
        requestAnimationFrame(animCelestialBackground);
    }
    animCelestialBackground();

    // 2. Flight Simulator & Canvas Particles
    var canvas = document.getElementById('tunnelCanvas');
    var ctx = canvas.getContext('2d');
    var planeContainer = document.getElementById('paperPlaneContainer');

    var canvasWidth = canvas.clientWidth;
    var canvasHeight = canvas.clientHeight;

    // Scrolling starfield and space celestial data
    var stars = [];
    var celestialObjects = [];
    var tunnelElement = document.getElementById('planeTunnel');

    function initCelestial() {
        celestialObjects = [
            {
                type: 'sun',
                x: canvasWidth * 0.56,
                y: canvasHeight - 15,
                size: 15,
                color: '#f59e0b',
                speed: 0
            },
            {
                type: 'saturn',
                x: canvasWidth * 0.35,
                y: 22,
                size: 9,
                color: '#d8b4fe',
                speed: 0.12
            },
            {
                type: 'mars',
                x: canvasWidth * 0.68,
                y: 42,
                size: 7,
                color: '#fca5a5',
                speed: 0.18
            },
            {
                type: 'moon',
                x: canvasWidth - 100,
                y: 17,
                size: 11,
                color: '#e2e8f0',
                speed: 0.04
            },
            {
                type: 'asteroid',
                x: canvasWidth * 0.32,
                y: 48,
                size: 4,
                color: '#8a979e',
                rotation: 0,
                rotSpeed: 0.02,
                speed: 0.45
            },
            {
                type: 'asteroid',
                x: canvasWidth * 0.52,
                y: 12,
                size: 5.5,
                color: '#8a979e',
                rotation: 1.2,
                rotSpeed: -0.015,
                speed: 0.38
            },
            {
                type: 'asteroid',
                x: canvasWidth * 0.88,
                y: 31,
                size: 3.8,
                color: '#8a979e',
                rotation: 0.5,
                rotSpeed: 0.035,
                speed: 0.55
            },
            {
                type: 'ufo',
                x: canvasWidth * 1.3,
                y: 25,
                size: 7,
                color: '#cbd5e1',
                speed: 0.65,
                wiggle: 0
            },
            {
                type: 'darkLord',
                x: canvasWidth * 0.72,
                y: 17,
                size: 12,
                speed: 0.2
            },
            {
                type: 'wiseSage',
                x: canvasWidth * 0.95,
                y: canvasHeight - 16,
                size: 11,
                speed: 0.32
            },
            {
                type: 'bountyHelmet',
                x: canvasWidth * 1.12,
                y: 18,
                size: 11,
                speed: 0.42
            },
            {
                type: 'darkBlade',
                x: canvasWidth * 0.48,
                y: canvasHeight - 13,
                size: 12,
                speed: 0.26,
                rotation: -0.4
            },
            {
                type: 'trooper',
                x: canvasWidth * 0.62,
                y: 17,
                size: 6.5,
                speed: 0.36
            },
            {
                type: 'starFighter',
                x: canvasWidth * 1.42,
                y: canvasHeight - 14,
                size: 8,
                speed: 0.72
            },
            {
                type: 'wingFighter',
                x: canvasWidth * 0.25,
                y: canvasHeight - 15,
                size: 8,
                speed: 0.52
            },
            {
                type: 'falconFreighter',
                x: canvasWidth * 1.62,
                y: 19,
                size: 10,
                speed: 0.58,
                rotation: 0.03
            },
            {
                type: 'podRacer',
                x: canvasWidth * 1.86,
                y: canvasHeight - 16,
                size: 8,
                speed: 0.68
            },
            {
                type: 'needleFighter',
                x: canvasWidth * 0.42,
                y: 16,
                size: 8,
                speed: 0.48,
                rotation: -0.05
            },
            {
                type: 'alienCruiser',
                x: canvasWidth * 2.08,
                y: canvasHeight - 15,
                size: 9,
                speed: 0.38,
                rotation: 0.05
            }
        ];
    }

    function resizeCanvas() {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Generate stars if not already present
        if (stars.length === 0) {
            for (var s = 0; s < 70; s++) {
                stars.push({
                    x: Math.random() * canvasWidth,
                    y: 2 + Math.random() * (canvasHeight - 4),
                    size: 0.8 + Math.random() * 1.8,
                    speedMult: 0.35 + Math.random() * 0.85,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        }
        initCelestial();
    }
    resizeCanvas();
    $(window).on('resize', resizeCanvas);

    // Track dynamic theme colors for particles.
    var accentColor = '#38bdf8';
    var warmColor = '#22d3ee';

    function updateThemeColors() {
        setTimeout(function () {
            // Keep theme accents linked or override with cosmic hyperspace themes
            accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#38bdf8';
            warmColor = getComputedStyle(document.body).getPropertyValue('--accent-warm').trim() || '#22d3ee';
        }, 100);
    }
    updateThemeColors();
    $('#dark-mode').on('change', updateThemeColors);

    // Particles system (Hyperdrive Thruster trails)
    var particles = [];

    function Particle(x, y, isBoost) {
        this.x = x;
        this.y = y;
        // Emit backward relative to ship movement
        this.vx = -1.5 - Math.random() * 2.2;
        this.vy = (Math.random() - 0.5) * 1.5;
        
        if (isBoost) {
            this.size = 2.0 + Math.random() * 2.8;
            this.maxLife = 30 + Math.random() * 20;
            // Mix neon-cyan and electric-purple in boost mode
            this.color = Math.random() > 0.4 ? '#22d3ee' : '#a855f7';
        } else {
            this.size = 1.0 + Math.random() * 1.8;
            this.maxLife = 18 + Math.random() * 12;
            this.color = '#38bdf8'; // standard hyperdrive cyan
        }
        
        this.alpha = 1.0;
        this.life = 0;
        this.isBoost = isBoost;
    }

    Particle.prototype.update = function (speed) {
        this.x += this.vx - speed * 0.15;
        this.y += this.vy;
        this.life++;
        this.alpha = 1.0 - (this.life / this.maxLife);
        this.size += 0.04;
    };

    Particle.prototype.draw = function (context) {
        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Intense warp speed glowing blur
        context.shadowBlur = this.isBoost ? 6.0 : 2.5;
        context.shadowColor = this.color;
        
        context.fillStyle = this.color;
        context.fill();
        context.restore();
    };

    function drawTunnelObject(context, obj) {
        context.save();
        context.translate(obj.x, obj.y);
        context.rotate(obj.rotation || 0);
        context.scale(1.18, 1.18);
        context.globalAlpha = 1;
        context.shadowBlur = 2.5;
        context.lineJoin = 'round';
        context.lineCap = 'round';

        if (obj.type === 'ufo') {
            obj.wiggle += 0.08;
            context.translate(0, Math.sin(obj.wiggle) * 1.6);
            context.shadowColor = '#22d3ee';
            context.fillStyle = '#f8fafc';
            context.beginPath();
            context.ellipse(0, 0, obj.size * 1.7, obj.size * 0.52, 0, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 1;
            context.stroke();
            context.fillStyle = '#38bdf8';
            context.beginPath();
            context.arc(0, -obj.size * 0.25, obj.size * 0.58, Math.PI, 0);
            context.fill();
            context.fillStyle = '#22d3ee';
            context.fillRect(-obj.size, obj.size * 0.22, obj.size * 2, 1.4);
        } else if (obj.type === 'darkLord') {
            context.shadowColor = '#dc2626';
            context.fillStyle = '#020617';
            context.beginPath();
            context.moveTo(0, -obj.size * 1.05);
            context.lineTo(obj.size * 0.92, -obj.size * 0.28);
            context.lineTo(obj.size * 0.72, obj.size * 0.92);
            context.lineTo(obj.size * 0.22, obj.size * 0.72);
            context.lineTo(0, obj.size * 1.05);
            context.lineTo(-obj.size * 0.22, obj.size * 0.72);
            context.lineTo(-obj.size * 0.72, obj.size * 0.92);
            context.lineTo(-obj.size * 0.92, -obj.size * 0.28);
            context.closePath();
            context.fill();
            context.strokeStyle = '#94a3b8';
            context.lineWidth = 1.2;
            context.stroke();
            context.fillStyle = '#1e293b';
            context.beginPath();
            context.moveTo(0, -obj.size * 0.5);
            context.lineTo(obj.size * 0.42, obj.size * 0.36);
            context.lineTo(0, obj.size * 0.68);
            context.lineTo(-obj.size * 0.42, obj.size * 0.36);
            context.closePath();
            context.fill();
            context.strokeStyle = '#475569';
            context.beginPath();
            context.moveTo(0, -obj.size * 0.86);
            context.lineTo(0, obj.size * 0.86);
            context.stroke();
            context.fillStyle = '#f87171';
            context.fillRect(-obj.size * 0.62, -obj.size * 0.22, obj.size * 1.24, 2);
            context.fillStyle = '#ef4444';
            context.beginPath();
            context.arc(0, obj.size * 0.62, 1.4, 0, Math.PI * 2);
            context.fill();
        } else if (obj.type === 'wiseSage') {
            context.shadowColor = '#22c55e';
            context.fillStyle = '#a7f3d0';
            context.beginPath();
            context.ellipse(-obj.size * 1.1, -obj.size * 0.2, obj.size * 0.72, obj.size * 0.26, -0.35, 0, Math.PI * 2);
            context.ellipse(obj.size * 1.1, -obj.size * 0.2, obj.size * 0.72, obj.size * 0.26, 0.35, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#22c55e';
            context.lineWidth = 1;
            context.stroke();
            context.fillStyle = '#bbf7d0';
            context.beginPath();
            context.ellipse(0, 0, obj.size * 0.76, obj.size * 0.68, 0, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.moveTo(-obj.size * 0.36, obj.size * 0.22);
            context.quadraticCurveTo(0, obj.size * 0.36, obj.size * 0.36, obj.size * 0.22);
            context.strokeStyle = '#166534';
            context.stroke();
            context.fillStyle = '#052e16';
            context.beginPath();
            context.arc(-obj.size * 0.24, -obj.size * 0.12, 1.3, 0, Math.PI * 2);
            context.arc(obj.size * 0.24, -obj.size * 0.12, 1.3, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#16a34a';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(-obj.size * 0.44, -obj.size * 0.42);
            context.lineTo(obj.size * 0.44, -obj.size * 0.42);
            context.stroke();
        } else if (obj.type === 'bountyHelmet') {
            context.shadowColor = '#38bdf8';
            var helmetGrad = context.createLinearGradient(-obj.size, 0, obj.size, 0);
            helmetGrad.addColorStop(0, '#94a3b8');
            helmetGrad.addColorStop(0.5, '#f8fafc');
            helmetGrad.addColorStop(1, '#64748b');
            context.fillStyle = helmetGrad;
            context.beginPath();
            context.moveTo(-obj.size * 0.66, -obj.size);
            context.lineTo(obj.size * 0.66, -obj.size);
            context.quadraticCurveTo(obj.size * 0.92, -obj.size, obj.size * 0.9, -obj.size * 0.62);
            context.lineTo(obj.size * 0.74, obj.size * 0.86);
            context.lineTo(obj.size * 0.18, obj.size * 0.98);
            context.lineTo(0, obj.size * 0.76);
            context.lineTo(-obj.size * 0.18, obj.size * 0.98);
            context.lineTo(-obj.size * 0.74, obj.size * 0.86);
            context.lineTo(-obj.size * 0.9, -obj.size * 0.62);
            context.quadraticCurveTo(-obj.size * 0.92, -obj.size, -obj.size * 0.66, -obj.size);
            context.closePath();
            context.fill();
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 1.1;
            context.stroke();
            context.fillStyle = '#0f172a';
            context.fillRect(-obj.size * 0.66, -obj.size * 0.42, obj.size * 1.32, obj.size * 0.3);
            context.fillStyle = '#38bdf8';
            context.fillRect(obj.size * 0.36, -obj.size * 0.95, obj.size * 0.22, obj.size * 1.62);
            context.fillStyle = '#0ea5e9';
            context.beginPath();
            context.moveTo(-obj.size * 0.12, -obj.size);
            context.lineTo(obj.size * 0.12, -obj.size);
            context.lineTo(0, -obj.size * 1.2);
            context.closePath();
            context.fill();
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(0, -obj.size);
            context.lineTo(0, obj.size * 0.7);
            context.stroke();
        } else if (obj.type === 'darkBlade') {
            context.shadowColor = '#a855f7';
            context.strokeStyle = '#f5d0fe';
            context.lineWidth = 2.6;
            context.beginPath();
            context.moveTo(-obj.size, 0);
            context.lineTo(obj.size, 0);
            context.stroke();
            context.fillStyle = '#a855f7';
            context.fillRect(-obj.size * 0.15, -obj.size * 0.15, obj.size * 0.3, obj.size * 0.3);
        } else if (obj.type === 'trooper') {
            context.shadowColor = '#f8fafc';
            context.fillStyle = '#f8fafc';
            context.beginPath();
            context.arc(0, 0, obj.size * 0.82, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#cbd5e1';
            context.lineWidth = 0.9;
            context.stroke();
            context.fillStyle = '#111827';
            context.fillRect(-obj.size * 0.55, -obj.size * 0.15, obj.size * 1.1, obj.size * 0.22);
            context.fillRect(-obj.size * 0.25, obj.size * 0.25, obj.size * 0.5, obj.size * 0.18);
        } else if (obj.type === 'starFighter') {
            context.shadowColor = '#38bdf8';
            context.fillStyle = '#e0f2fe';
            context.beginPath();
            context.moveTo(obj.size * 1.45, 0);
            context.lineTo(-obj.size * 0.8, -obj.size * 0.55);
            context.lineTo(-obj.size * 0.38, 0);
            context.lineTo(-obj.size * 0.8, obj.size * 0.55);
            context.closePath();
            context.fill();
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 0.9;
            context.stroke();
            context.fillStyle = '#38bdf8';
            context.fillRect(-obj.size * 1.2, -1, obj.size * 0.55, 2);
        } else if (obj.type === 'wingFighter') {
            context.shadowColor = '#f8fafc';
            context.fillStyle = '#f8fafc';
            context.fillRect(-obj.size * 0.95, -obj.size * 0.65, obj.size * 0.26, obj.size * 1.3);
            context.fillRect(obj.size * 0.68, -obj.size * 0.65, obj.size * 0.26, obj.size * 1.3);
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 0.8;
            context.strokeRect(-obj.size * 0.95, -obj.size * 0.65, obj.size * 0.26, obj.size * 1.3);
            context.strokeRect(obj.size * 0.68, -obj.size * 0.65, obj.size * 0.26, obj.size * 1.3);
            context.fillStyle = '#e0f2fe';
            context.beginPath();
            context.arc(0, 0, obj.size * 0.32, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#e2e8f0';
            context.lineWidth = 1.4;
            context.beginPath();
            context.moveTo(-obj.size * 0.68, 0);
            context.lineTo(obj.size * 0.68, 0);
            context.stroke();
        } else if (obj.type === 'falconFreighter') {
            context.shadowColor = '#93c5fd';
            context.fillStyle = '#dbeafe';
            context.beginPath();
            context.arc(0, 0, obj.size * 0.78, 0, Math.PI * 2);
            context.fill();
            context.fillRect(obj.size * 0.2, -obj.size * 0.24, obj.size * 1.05, obj.size * 0.48);
            context.fillStyle = '#64748b';
            context.beginPath();
            context.arc(obj.size * 0.98, 0, obj.size * 0.22, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#38bdf8';
            context.lineWidth = 1;
            context.strokeRect(-obj.size * 0.22, -obj.size * 0.22, obj.size * 0.44, obj.size * 0.44);
        } else if (obj.type === 'podRacer') {
            context.shadowColor = '#f59e0b';
            context.fillStyle = '#fbbf24';
            context.beginPath();
            context.ellipse(-obj.size * 0.8, 0, obj.size * 0.42, obj.size * 0.24, 0, 0, Math.PI * 2);
            context.ellipse(obj.size * 0.8, 0, obj.size * 0.42, obj.size * 0.24, 0, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#fef3c7';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(-obj.size * 0.36, 0);
            context.lineTo(obj.size * 0.36, 0);
            context.stroke();
            context.fillStyle = '#ef4444';
            context.fillRect(-obj.size * 1.35, -1, obj.size * 0.32, 2);
        } else if (obj.type === 'needleFighter') {
            context.shadowColor = '#c4b5fd';
            context.fillStyle = '#ede9fe';
            context.beginPath();
            context.moveTo(obj.size * 1.65, 0);
            context.lineTo(-obj.size * 1.1, -obj.size * 0.18);
            context.lineTo(-obj.size * 0.72, 0);
            context.lineTo(-obj.size * 1.1, obj.size * 0.18);
            context.closePath();
            context.fill();
            context.strokeStyle = '#a78bfa';
            context.stroke();
        } else if (obj.type === 'alienCruiser') {
            context.shadowColor = '#22c55e';
            context.fillStyle = '#a7f3d0';
            context.beginPath();
            context.ellipse(0, 0, obj.size * 1.35, obj.size * 0.42, 0, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#10b981';
            context.beginPath();
            context.arc(-obj.size * 0.45, -obj.size * 0.1, obj.size * 0.22, 0, Math.PI * 2);
            context.arc(obj.size * 0.1, -obj.size * 0.16, obj.size * 0.22, 0, Math.PI * 2);
            context.arc(obj.size * 0.62, -obj.size * 0.06, obj.size * 0.22, 0, Math.PI * 2);
            context.fill();
        }

        context.restore();
    }

    // Flight variables
    var px = -50;
    var py = 31;
    var speed = 2.2;
    var targetSpeed = 2.2;
    var angle = 0;
    var time = 0;
    var barrelRoll = 0;
    var isBoosted = false;
    var mouseY = 31;
    var shipHalfSize = 18;
    var lightSpeedTimer = 0;
    var isLightSpeedJump = false;
    var jumpCooldown = 0;

    // Mouse tracking & hover locks
    function updateTunnelMouse(e) {
        var rect = this.getBoundingClientRect();
        var tunnelRect = tunnelElement ? tunnelElement.getBoundingClientRect() : rect;
        var pointerY = typeof e.clientY === 'number' ? e.clientY : null;
        if (pointerY === null && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length) {
            pointerY = e.originalEvent.touches[0].clientY;
        }
        mouseY = pointerY !== null ? pointerY - tunnelRect.top : canvasHeight / 2;
        if (mouseY < shipHalfSize) mouseY = shipHalfSize;
        if (mouseY > canvasHeight - shipHalfSize) mouseY = canvasHeight - shipHalfSize;
    }

    function startBoost() {
        if (!isBoosted) {
            isBoosted = true;
            barrelRoll = 360;
            lightSpeedTimer = 140 + Math.random() * 130;
            JetSound.start();
        } else if (!JetSound.isPlaying) {
            JetSound.start();
        }
    }

    function stopBoost() {
        if (isBoosted) {
            isBoosted = false;
            isLightSpeedJump = false;
            jumpCooldown = 0;
            JetSound.stop();
        }
    }

    function triggerLightSpeedJump() {
        isLightSpeedJump = true;
        jumpCooldown = 32;
        barrelRoll = 360;
        if (tunnelElement) {
            var flashX = Math.max(0, Math.min(100, (px / Math.max(1, canvasWidth)) * 100));
            tunnelElement.style.setProperty('--jump-x', flashX + '%');
            tunnelElement.classList.remove('light-speed-jump');
            void tunnelElement.offsetWidth;
            tunnelElement.classList.add('light-speed-jump');
        }
        if (JetSound.audioCtx) {
            try {
                var ctxAudio = JetSound.audioCtx;
                var now = ctxAudio.currentTime;
                var osc = ctxAudio.createOscillator();
                var gain = ctxAudio.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(1320, now + 0.34);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(gain);
                gain.connect(ctxAudio.destination);
                osc.start(now);
                osc.stop(now + 0.52);
            } catch (e) {}
        }
    }

    var flightHoverTarget = $('#mainNav');

    flightHoverTarget.on('mouseenter pointerenter', function (e) {
        updateTunnelMouse.call(this, e);
        startBoost();
    });

    flightHoverTarget.on('mousemove pointermove', function (e) {
        updateTunnelMouse.call(this, e);
    });

    flightHoverTarget.on('click pointerdown touchstart', function (e) {
        updateTunnelMouse.call(this, e);
        unlockJetSoundAndContinue(function () {
            startBoost();
        });
    });

    flightHoverTarget.on('mouseleave pointerleave', function () {
        stopBoost();
    });

    $(document).on('pointerdown touchstart', function (e) {
        if ($(e.target).closest('#mainNav, #planeSoundHint').length === 0) {
            stopBoost();
        }
    });

    $(planeContainer).on('mouseenter', function (e) {
        updateTunnelMouse.call(this, e);
        startBoost();
    });

    // Direct click/tap is a guaranteed user gesture to unlock audio
    $(planeContainer).on('click pointerdown touchstart', function () {
        unlockJetSoundAndContinue(function () {
            startBoost();
        });
    });

    $('#planeSoundHint').on('click pointerdown touchstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
        updateTunnelMouse.call(tunnelElement || this, e);
        unlockJetSoundAndContinue(function () {
            startBoost();
        });
    });

    // Animation Loop
    function animLoop() {
        time += 0.035;

        if (isBoosted) {
            targetSpeed = isLightSpeedJump ? 42 : 8;
            py += (mouseY - py) * 0.16; // follow pointer quickly while keeping the flight smooth
            if (!isLightSpeedJump && jumpCooldown <= 0) {
                lightSpeedTimer -= 1;
                if (lightSpeedTimer <= 0 && px > canvasWidth * 0.18 && px < canvasWidth * 0.82) {
                    triggerLightSpeedJump();
                }
            }
        } else {
            targetSpeed = 2.2;
            py = (canvasHeight / 2) + 3 + Math.sin(time) * 3.0;
        }
        if (jumpCooldown > 0) {
            jumpCooldown -= 1;
            if (jumpCooldown === 0) {
                isLightSpeedJump = false;
                lightSpeedTimer = 160 + Math.random() * 180;
            }
        }
        if (py < shipHalfSize) py = shipHalfSize;
        if (py > canvasHeight - shipHalfSize) py = canvasHeight - shipHalfSize;

        // Smooth speed adjustment
        speed += (targetSpeed - speed) * (isBoosted ? 0.22 : 0.08);
        px += speed;

        if (px > canvasWidth + 50) {
            px = -50; // wrap around
        }

        // Interpolate angle
        var targetAngle = 0;
        if (isBoosted) {
            targetAngle = (mouseY - py) * 0.05;
            if (barrelRoll > 0) {
                barrelRoll = Math.max(0, barrelRoll - 18);
            }
        } else {
            targetAngle = Math.cos(time) * 0.10;
        }
        angle += (targetAngle - angle) * 0.15;

        var totalRotation = angle * (180 / Math.PI) + (isBoosted && barrelRoll > 0 ? (360 - barrelRoll) : 0);

        // Apply styles to ship element.
        planeContainer.style.left = px + 'px';
        planeContainer.style.top = (py - shipHalfSize) + 'px';
        planeContainer.style.opacity = isLightSpeedJump && jumpCooldown < 20 ? '0' : '1';
        planeContainer.style.transform = 'rotate(' + totalRotation + 'deg) scale(' + (isLightSpeedJump ? 1.35 : (isBoosted ? 1.15 : 1.0)) + ')';

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 1. Draw scrolling stars in background
        for (var s = 0; s < stars.length; s++) {
            var star = stars[s];
            star.x -= speed * 0.22 * star.speedMult;
            if (star.x < -5) {
                star.x = canvasWidth + 5;
                star.y = 2 + Math.random() * (canvasHeight - 4);
            }
            var starGlow = 0.35 + (Math.sin(time * 2.5 + star.twinkle) * 0.25) + (star.speedMult * 0.22);
            ctx.globalAlpha = Math.min(0.95, starGlow);
            ctx.fillStyle = star.size > 1.8 ? '#f8fafc' : accentColor;
            ctx.shadowBlur = star.size > 1.8 ? 5 : 2;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // 2. Draw themed ships/characters drifting through the tunnel.
        for (var co = 0; co < celestialObjects.length; co++) {
            var spaceObj = celestialObjects[co];
            spaceObj.x -= (speed * 0.05) + spaceObj.speed;
            if (spaceObj.x < -70) {
                spaceObj.x = canvasWidth + 80 + Math.random() * 260;
                spaceObj.y = 12 + Math.random() * Math.max(8, canvasHeight - 24);
            }
            drawTunnelObject(ctx, spaceObj);
        }

        // 3. Draw animated sequential airport runway approach lights along bottom
        var lightsCount = Math.ceil(canvasWidth / 90);
        for (var l = 0; l < lightsCount; l++) {
            var lx = l * 90 + 45;
            var phase = (lx * 0.012) - (time * 4.0);
            var intensity = Math.max(0.08, Math.sin(phase) * 0.5 + 0.5);

            ctx.beginPath();
            ctx.arc(lx, canvasHeight - 2.5, 2, 0, Math.PI * 2);
            ctx.fillStyle = warmColor;
            ctx.shadowBlur = intensity * 6;
            ctx.shadowColor = warmColor;
            ctx.globalAlpha = intensity * 0.85;
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow
            ctx.globalAlpha = 1.0;
        }

        // 4. Particle stream drawing from the rear engine.
        var emitX = px + 6;
        var emitY = py;

        if (isBoosted) {
            particles.push(new Particle(emitX, emitY, true));
            if (Math.random() > 0.45) {
                particles.push(new Particle(emitX, emitY, true));
            }
            if (isLightSpeedJump) {
                for (var jp = 0; jp < 5; jp++) {
                    particles.push(new Particle(emitX - jp * 8, emitY + (Math.random() * 8 - 4), true));
                }
            }
        } else {
            if (Math.floor(time * 10) % 2 === 0) {
                particles.push(new Particle(emitX, emitY, false));
            }
        }

        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.update(speed);
            if (p.alpha <= 0 || p.life >= p.maxLife) {
                particles.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }

        requestAnimationFrame(animLoop);
    }

    // Launch loop
    requestAnimationFrame(animLoop);

    // ============================================================
    // Developer Terminal CLI Console Implementation
    // ============================================================
    var $terminal = $('#developerTerminal');
    var $hiddenInput = $('#terminalHiddenInput');
    var $promptInput = $('#terminalPromptInput');
    var $outputLog = $('#terminalOutputLog');
    var $terminalBody = $('#terminalBody');
    var isTerminalOpen = false;
    var isLocked = false;
    var cmdHistory = [];
    var cmdIndex = 0;
    var hasBootedTerminal = false;

    // Escape characters
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Terminal Commands Parser
    function executeCommand(cmdText) {
        cmdText = cmdText.trim();
        if (!cmdText) return;

        // Echo prompt command
        $outputLog.append('<p><span class="prompt-user">abhay@tiwari:~$</span> <span class="terminal-cmd-echo">' + escapeHTML(cmdText) + '</span></p>');

        var parts = cmdText.split(/\s+/);
        var mainCmd = parts[0].toLowerCase();

        switch (mainCmd) {
            case 'help':
                printHelp();
                break;
            case 'about':
                printAbout();
                break;
            case 'skills':
                printSkills();
                break;
            case 'experience':
                printExperience();
                break;
            case 'clear':
                $outputLog.empty();
                break;
            case 'matrix':
                toggleMatrix();
                break;
            case 'exit':
            case 'close':
                closeTerminal();
                break;
            case 'sudo':
                if (parts[1] === 'rm' && parts[2] === '-rf' && parts[3] === '/') {
                    triggerHackingSequence();
                } else {
                    $outputLog.append('<p class="terminal-error">Error: Access denied. Only "sudo rm -rf /" privilege override is supported.</p>');
                }
                break;
            default:
                $outputLog.append('<p class="terminal-error">bash: command not found: ' + escapeHTML(mainCmd) + '. Type <span class="cmd-highlight">help</span> for a list of commands.</p>');
        }

        // Auto scroll to bottom
        $terminalBody.scrollTop($terminalBody[0].scrollHeight);
    }

    function runTerminalCommand(cmdText) {
        if (!cmdText || isLocked) return;
        cmdHistory.push(cmdText);
        cmdIndex = cmdHistory.length;
        $hiddenInput.val('');
        $promptInput.text('');
        executeCommand(cmdText);
    }

    function printBootLine() {
        if (hasBootedTerminal) return;
        hasBootedTerminal = true;
        $outputLog.append('<p class="terminal-success">Ready. Pick a command chip or type directly.</p>');
        $terminalBody.scrollTop($terminalBody[0].scrollHeight);
    }

    function printHelp() {
        var html = '<p class="terminal-heading">Available Terminal Commands:</p>' +
                   '<p>  <span class="cmd-highlight">about</span>      - Brief professional background bio</p>' +
                   '<p>  <span class="cmd-highlight">skills</span>     - Classified engineering, framework, & platform competencies</p>' +
                   '<p>  <span class="cmd-highlight">experience</span> - Job timeline & platform architecture outcomes</p>' +
                   '<p>  <span class="cmd-highlight">matrix</span>     - Toggle the Matrix green digital rain canvas backdrop</p>' +
                   '<p>  <span class="cmd-highlight">clear</span>      - Clear output logs</p>' +
                   '<p>  <span class="cmd-highlight">exit</span>       - Close this console session</p>' +
                   '<p>  <span class="cmd-highlight">sudo rm -rf /</span> - [WARNING] Trigger root hardware override test</p>';
        $outputLog.append(html);
    }

    function printAbout() {
        var html = '<p class="terminal-heading">About Purvi Solanki:</p>' +
                   '<p>Software Engineer with 2+ years of experience building scalable full-stack applications, REST APIs, and cloud-based integrations.</p>' +
                   '<p>B.Tech graduate in CS & IT from <span class="cmd-highlight">Acropolis Institute of Technology and Research</span>.</p>' +
                   '<p>Currently working as a Software Developer at <span class="cmd-highlight">Capgemini</span>, previously at <span class="cmd-highlight">Fin Coopers India</span>. Experienced in leveraging AI-assisted workflows (Claude, Cursor AI, ChatGPT) to optimize code quality and development velocity.</p>';
        $outputLog.append(html);
    }

    function printSkills() {
        var html = '<p class="terminal-heading">Classified Technical Competencies:</p>' +
                   '<p><span class="cmd-highlight">[Languages]</span> JavaScript (ES6+), C++, Python, HTML/CSS, SQL, PL/SQL</p>' +
                   '<p><span class="cmd-highlight">[Frontend]</span> React.js, Next.js, Redux Toolkit, HTML5, CSS3, Bootstrap, Material-UI, Tailwind CSS</p>' +
                   '<p><span class="cmd-highlight">[Backend]</span> Node.js, Express.js, REST APIs, FastAPI, Microservices, Object-Oriented Programming (OOP)</p>' +
                   '<p><span class="cmd-highlight">[Databases]</span> MongoDB, MySQL, Oracle DB</p>' +
                   '<p><span class="cmd-highlight">[Cloud & Tools]</span> AWS, Oracle Cloud (OCI/OIC), Docker (Basics), Kubernetes (Basics), Git, Postman</p>' +
                   '<p><span class="cmd-highlight">[AI & Productivity]</span> Claude, Cursor AI, ChatGPT, GitHub Copilot, Agile, Scrum</p>';
        $outputLog.append(html);
    }

    function printExperience() {
        var html = '<p class="terminal-heading">Professional Career Timeline:</p>' +
                   '<p><span class="cmd-highlight">Capgemini (Dec 2024 - Present)</span></p>' +
                   '<p>  - Modernizing enterprise modules for BHI project using React, Node.js, Express, and Oracle Cloud (OCI/OIC).</p>' +
                   '<p>  - Optimized backend API integrations, reducing manual processing effort by 30%.</p>' +
                   '<p><span class="cmd-highlight">Fin Coopers India Pvt Ltd (Jul 2024 - Nov 2024)</span></p>' +
                   '<p>  - Maintained Finexe 2.0 loan platform and corporate sites using MERN stack.</p>' +
                   '<p>  - Boosted UI responsiveness and state management efficiency by 25%.</p>' +
                   '<p><span class="cmd-highlight">Persistent Systems (Jul 2023 - Aug 2023)</span></p>' +
                   '<p>  - Martian Intern: DSA, DBMS, and programming assessment modules.</p>';
        $outputLog.append(html);
    }

    // Playful Sudo Hacking Sequence
    function triggerHackingSequence() {
        isLocked = true;
        $hiddenInput.blur();
        var lines = [
            "WARNING: ROOT HARDWARE ACCESS OVERRIDE REQUESTED.",
            "Executing: rm -rf /",
            "Scope: ALL STORAGE STORAGE_BANKS",
            "DELETING /sys/kernel/security/integrity/...",
            "DELETING /var/lib/mongodb/oracle/oic_integrations...",
            "DELETING /etc/kubernetes/manifests/kube-apiserver.yaml...",
            "DELETING /usr/bin/capgemini/bhi/workflow_service...",
            "DELETING C:\\Windows\\System32\\hal.dll...",
            "CRITICAL FAULT: KERNEL DELETION SUCCESSFUL.",
            "CONNECTION TERMINATED. HARD REBOOT REQUIRED..."
        ];

        var idx = 0;
        function printNextDeletion() {
            if (idx < lines.length) {
                var colorClass = idx < 3 ? 'cmd-highlight' : 'terminal-error';
                $outputLog.append('<p class="' + colorClass + '">' + lines[idx] + '</p>');
                $terminalBody.scrollTop($terminalBody[0].scrollHeight);
                idx++;
                setTimeout(printNextDeletion, 250);
            } else {
                spawnGlitchOverlay();
            }
        }
        printNextDeletion();
    }

    function spawnGlitchOverlay() {
        var $glitch = $('<div class="terminal-override-screen">' +
            '<div class="override-glitch-text">SYSTEM OVERRIDE INITIATED</div>' +
            '<p>CRITICAL HARD DISK CORRUPTION SECTOR: 0x00A1F</p>' +
            '<p>BOOT LOADER INTEGRITY CHECK: FAILED</p>' +
            '<p class="override-recovered-msg">Just kidding, welcome to Purvi\'s portfolio! 😊</p>' +
            '<p style="color: #64748b; margin-top: 1.5rem;">System will recover automatically in 3 seconds...</p>' +
            '</div>');
        $('body').append($glitch);

        // Play warning beep
        try {
            if (JetSound.audioCtx) {
                var osc = JetSound.audioCtx.createOscillator();
                var gain = JetSound.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(145, JetSound.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.08, JetSound.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, JetSound.audioCtx.currentTime + 1.2);
                osc.connect(gain);
                gain.connect(JetSound.audioCtx.destination);
                osc.start();
                osc.stop(JetSound.audioCtx.currentTime + 1.2);
            }
        } catch (e) {}

        setTimeout(function () {
            $glitch.fadeOut(600, function () {
                $(this).remove();
                $outputLog.append('<p class="terminal-success">Hard reboot complete. Virtual file system reconstructed.</p>');
                $terminalBody.scrollTop($terminalBody[0].scrollHeight);
                $hiddenInput.focus();
                isLocked = false;
            });
        }, 4000);
    }

    // Canvas Matrix Digital Rain background
    var mCanvas = document.getElementById('terminalCanvas');
    var mCtx = mCanvas.getContext('2d');
    var matrixActive = false;
    var matrixInterval = null;

    var mCols = 0;
    var mDrops = [];
    var mCharSize = 14;
    var chars = "01011001ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%+*=";

    function initMatrix() {
        mCanvas.width = window.innerWidth;
        mCanvas.height = window.innerHeight;
        mCols = Math.floor(mCanvas.width / mCharSize);
        mDrops = [];
        for (var x = 0; x < mCols; x++) {
            mDrops[x] = Math.random() * -100;
        }
    }

    function drawMatrix() {
        mCtx.fillStyle = 'rgba(8, 12, 16, 0.06)'; // fade history
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

        mCtx.fillStyle = '#10b981'; // green characters
        mCtx.font = mCharSize + 'px Courier New';

        for (var i = 0; i < mDrops.length; i++) {
            var char = chars[Math.floor(Math.random() * chars.length)];
            var x = i * mCharSize;
            var y = mDrops[i] * mCharSize;

            mCtx.fillText(char, x, y);

            if (y > mCanvas.height && Math.random() > 0.98) {
                mDrops[i] = 0;
            }
            mDrops[i]++;
        }
    }

    function toggleMatrix() {
        matrixActive = !matrixActive;
        if (matrixActive) {
            $terminal.addClass('matrix-active');
            $outputLog.append('<p class="terminal-success">Matrix Digital Rain activated. Type "matrix" again to disable.</p>');
            initMatrix();
            clearInterval(matrixInterval);
            matrixInterval = setInterval(drawMatrix, 35);
        } else {
            $terminal.removeClass('matrix-active');
            $outputLog.append('<p class="terminal-success">Matrix Digital Rain deactivated.</p>');
            clearInterval(matrixInterval);
            mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        }
    }

    $(window).on('resize', function () {
        if (matrixActive) {
            initMatrix();
        }
    });

    // Opening and closing methods
    function openTerminal() {
        if (isTerminalOpen) return;
        $terminal.removeClass('hidden');
        isTerminalOpen = true;
        $hiddenInput.focus();
        printBootLine();

        // Welcome chime
        try {
            if (JetSound.audioCtx) {
                var osc = JetSound.audioCtx.createOscillator();
                var gain = JetSound.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, JetSound.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.045, JetSound.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, JetSound.audioCtx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(JetSound.audioCtx.destination);
                osc.start();
                osc.stop(JetSound.audioCtx.currentTime + 0.35);
            }
        } catch (e) {}
    }

    function closeTerminal() {
        if (!isTerminalOpen) return;
        $terminal.addClass('hidden');
        isTerminalOpen = false;
        if (matrixActive) {
            toggleMatrix();
        }
    }

    // Toggle button bindings
    $('#terminalToggleBtn').on('click', function (e) {
        e.stopPropagation();
        if (isTerminalOpen) closeTerminal();
        else openTerminal();
    });

    $('#terminalNavBtn').on('click', function (e) {
        e.stopPropagation();
        openTerminal();
    });

    $('#terminalCloseBtn').on('click', function () {
        closeTerminal();
    });

    $('.terminal-chip').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        runTerminalCommand($(this).data('terminal-command'));
        $hiddenInput.focus();
    });

    $terminal.on('click', function (e) {
        if ($(e.target).closest('.terminal-container').length === 0 && !isLocked) {
            closeTerminal();
        } else {
            $hiddenInput.focus();
        }
    });

    // Hidden input syncing
    $hiddenInput.on('input', function () {
        $promptInput.text($(this).val());
    });

    // Document shortcuts (~ key)
    $(document).on('keydown', function (e) {
        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            if (isTerminalOpen) closeTerminal();
            else openTerminal();
        }
    });

    $hiddenInput.on('keydown', function (e) {
        if (isLocked) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            var cmd = $(this).val();
            runTerminalCommand(cmd);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length > 0 && cmdIndex > 0) {
                cmdIndex--;
                $(this).val(cmdHistory[cmdIndex]);
                $promptInput.text(cmdHistory[cmdIndex]);
            }
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (cmdHistory.length > 0 && cmdIndex < cmdHistory.length - 1) {
                cmdIndex++;
                $(this).val(cmdHistory[cmdIndex]);
                $promptInput.text(cmdHistory[cmdIndex]);
            } else {
                cmdIndex = cmdHistory.length;
                $(this).val('');
                $promptInput.text('');
            }
        }
    });

})(window.jQuery);
