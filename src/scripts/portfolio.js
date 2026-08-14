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

    // Gliding left-to-right paper plane animation with minor up/down flutter range
    (function() {
        var plane = document.getElementById('paperPlaneContainer');
        var nav = document.getElementById('mainNav');
        if (!plane || !nav) return;

        var px = -60;
        var py = 25;
        var time = 0;
        
        function animatePlane() {
            time += 0.045;
            
            var screenWidth = window.innerWidth;
            // Flight movement left to right across full viewport
            px += 2.0;
            if (px > screenWidth + 60) {
                px = -60;
            }

            // High frequency short-range up/down flutter (3-4 cm / ~10px)
            py = 22 + Math.sin(time) * 11 + Math.cos(time * 2.2) * 4;

            // Glide tilt (matches climbing/descending angle)
            var angle = Math.cos(time) * 12 + Math.sin(time * 2.2) * 4;

            plane.style.left = px + 'px';
            plane.style.top = py + 'px';
            plane.style.transform = 'rotate(' + angle + 'deg)';

            requestAnimationFrame(animatePlane);
        }

        animatePlane();
    })();

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
