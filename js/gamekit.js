// Small shared helper used by every game for consistent chrome (back button,
// HUD, toasts, start/end overlays) and a couple of Three.js conveniences.
window.GK = (function () {
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Top bar with back link + title
  function topbar(title) {
    const bar = el("div", "gk-topbar");
    const back = el("a", "gk-back", "← PlayCore");
    back.href = "../index.html";
    const t = el("div", "gk-title", title);
    bar.appendChild(back);
    bar.appendChild(t);
    document.body.appendChild(bar);
  }

  // HUD made of labelled stat rows. Returns a setter(key, value).
  function hud(stats) {
    const wrap = el("div", "gk-hud");
    const refs = {};
    stats.forEach((s) => {
      const row = el("div", "gk-stat");
      row.innerHTML = `<span class="label">${s.label}</span><span class="val">${s.value}</span>`;
      refs[s.key] = row.querySelector(".val");
      wrap.appendChild(row);
    });
    document.body.appendChild(wrap);
    return (key, value) => {
      if (refs[key]) refs[key].textContent = value;
    };
  }

  // Transient center toast
  let toastEl, toastTimer;
  function toast(msg, ms = 1100) {
    if (!toastEl) {
      toastEl = el("div", "gk-toast");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  // Start overlay. opts: {icon, title, desc, controls:[..], button, mobileNote}
  // onStart called when button clicked. Returns {hide, show, setContent}.
  function overlay(opts, onStart) {
    const ov = el("div", "gk-overlay");
    const panel = el("div", "gk-panel");
    function build(o) {
      const controls = (o.controls || [])
        .map((c) => `<span class="gk-key">${c}</span>`)
        .join("");
      panel.innerHTML = `
        ${o.scoreBig != null ? `<div class="gk-score-big">${o.scoreBig}</div>` : ""}
        <div class="ico">${o.icon || "🎮"}</div>
        <h1>${o.title || ""}</h1>
        <p>${o.desc || ""}</p>
        ${controls ? `<div class="controls">${controls}</div>` : ""}
        <button class="gk-btn">${o.button || "Play"}</button>
        ${o.mobileNote ? `<div class="gk-mobile-note">${o.mobileNote}</div>` : ""}
      `;
      panel.querySelector(".gk-btn").addEventListener("click", () => {
        if (onStart) onStart();
      });
    }
    build(opts);
    ov.appendChild(panel);
    document.body.appendChild(ov);
    return {
      hide: () => ov.classList.add("hidden"),
      show: () => ov.classList.remove("hidden"),
      setContent: (o, cb) => {
        build(o);
        if (cb) panel.querySelector(".gk-btn").addEventListener("click", cb);
      },
    };
  }

  // Keep renderer + camera in sync with the window size.
  function handleResize(renderer, camera) {
    function onResize() {
      const w = window.innerWidth,
        h = window.innerHeight;
      renderer.setSize(w, h);
      if (camera.isPerspectiveCamera) {
        camera.aspect = w / h;
      }
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);
    onResize();
  }

  // Simple keyboard state tracker. Returns object you can query by code/key.
  function keys() {
    const down = {};
    window.addEventListener("keydown", (e) => {
      down[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code))
        e.preventDefault();
    });
    window.addEventListener("keyup", (e) => (down[e.code] = false));
    return down;
  }

  // ---- Roblox-style avatar -------------------------------------------------
  // Procedural "Hawaiian shirt" texture for the torso/sleeves.
  function drawFlower(x, cx, cy, r, fg) {
    x.fillStyle = fg;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      x.beginPath();
      x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.75, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = "#ffd24d";
    x.beginPath();
    x.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    x.fill();
  }

  function floralTexture(bgHex, fgHex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#" + new THREE.Color(bgHex).getHexString();
    x.fillRect(0, 0, 128, 128);
    // soft leaves
    x.fillStyle = "rgba(255,255,255,0.12)";
    for (let i = 0; i < 10; i++) {
      x.beginPath();
      x.ellipse(Math.random() * 128, Math.random() * 128, 9, 4, Math.random() * 3, 0, Math.PI * 2);
      x.fill();
    }
    const fg = "#" + new THREE.Color(fgHex).getHexString();
    for (let i = 0; i < 16; i++) {
      drawFlower(x, Math.random() * 128, Math.random() * 128, 4 + Math.random() * 4, fg);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // Builds a Roblox-ish R6 character. Origin is at the feet (y = 0), front = +Z.
  // Returns a THREE.Group with userData.update(dt, moving) to animate walking.
  function character(opts = {}) {
    const o = Object.assign(
      {
        scale: 1,
        skin: 0xf1c27d,
        shirt: 0x66c5e8,
        shirtAlt: 0xffffff,
        pants: 0xc2a36b,
        hair: 0x4a2f1b,
        shoe: 0x33271a,
      },
      opts
    );
    const g = new THREE.Group();
    const m = (c) => new THREE.MeshLambertMaterial({ color: c });
    const skin = m(o.skin);
    const shirtMat = new THREE.MeshLambertMaterial({ map: floralTexture(o.shirt, o.shirtAlt) });

    const legH = 1.7,
      legW = 0.74,
      legD = 0.86;
    const torsoH = 1.7,
      torsoW = 1.85,
      torsoD = 0.95;
    const armH = 1.7,
      armW = 0.64,
      armD = 0.82;
    const headW = 1.25,
      headH = 1.18,
      headD = 1.18;
    const hipY = legH;
    const shoulderY = hipY + torsoH;

    function box(w, h, d, mat, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(0, y, z || 0);
      return mesh;
    }

    // ----- Legs (pivot group at the hip) -----
    function makeLeg(side) {
      const grp = new THREE.Group();
      grp.position.set(side * (legW / 2 + 0.02), hipY, 0);
      const pants = box(legW, legH - 0.95, legD, m(o.pants), (0.95 - legH) / 2);
      const shank = box(legW * 0.96, 0.59, legD * 0.96, skin, 0.655 - legH);
      const shoe = box(legW, 0.36, legD * 1.18, m(o.shoe), 0.18 - legH, 0.08);
      grp.add(pants, shank, shoe);
      g.add(grp);
      return grp;
    }
    const legL = makeLeg(-1);
    const legR = makeLeg(1);

    // ----- Torso -----
    g.add(box(torsoW, torsoH, torsoD, shirtMat, hipY + torsoH / 2));

    // ----- Arms (pivot group at the shoulder) -----
    function makeArm(side) {
      const grp = new THREE.Group();
      grp.position.set(side * (torsoW / 2 + armW / 2 + 0.02), shoulderY, 0);
      const sleeve = box(armW, 0.55, armD, shirtMat, -0.275);
      const fore = box(armW * 0.95, armH - 0.55, armD * 0.95, skin, -(0.55 + armH) / 2);
      const hand = box(armW, 0.3, armD, skin, -armH + 0.15);
      grp.add(sleeve, fore, hand);
      g.add(grp);
      return grp;
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);

    // ----- Head + neck -----
    g.add(box(0.55, 0.2, 0.55, skin, shoulderY + 0.08));
    const headY = shoulderY + 0.18 + headH / 2;
    const head = box(headW, headH, headD, skin, headY);
    g.add(head);

    // face on +Z
    const eyeMat = m(0x2a2a2a);
    const fz = headD / 2 + 0.01;
    const eyeL = box(0.18, 0.22, 0.05, eyeMat, headY + 0.1, fz);
    eyeL.position.x = -0.27;
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.27;
    const mouth = box(0.5, 0.09, 0.05, m(0x7a4a3a), headY - 0.28, fz);
    g.add(eyeL, eyeR, mouth);

    // hair (covers top, fringe and back)
    const hairMat = m(o.hair);
    const top = box(headW + 0.08, 0.4, headD + 0.08, hairMat, headY + headH / 2 + 0.05);
    const fringe = box(headW + 0.08, 0.32, 0.22, hairMat, headY + headH / 2 - 0.18, headD / 2 - 0.02);
    const back = box(headW + 0.08, 0.7, 0.2, hairMat, headY + 0.15, -headD / 2 - 0.02);
    g.add(top, fringe, back);

    g.traverse((n) => {
      if (n.isMesh) n.castShadow = true;
    });
    g.scale.setScalar(o.scale);

    // walk animation
    let phase = 0,
      inten = 0;
    g.userData.update = (dt, moving) => {
      if (moving) phase += dt * 9;
      inten += ((moving ? 1 : 0) - inten) * Math.min(1, dt * 12);
      const s = Math.sin(phase) * 0.6 * inten;
      legL.rotation.x = s;
      legR.rotation.x = -s;
      armL.rotation.x = -s;
      armR.rotation.x = s;
    };
    return g;
  }

  // Roblox-style orbit camera. Drag the mouse to rotate around a target,
  // scroll to zoom. Exposes forward()/right() (XZ plane) so movement can be
  // made camera-relative, and update(target, dt) to follow each frame.
  function orbitCamera(camera, opts = {}) {
    const s = Object.assign(
      {
        distance: 14,
        minDist: 6,
        maxDist: 30,
        yaw: 0,
        pitch: 0.4,
        minPitch: -0.15,
        maxPitch: 1.25,
        height: 3,
        sensitivity: 0.0045,
      },
      opts
    );
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    let dragging = false;

    window.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mousedown", () => (dragging = true));
    window.addEventListener("mouseup", () => (dragging = false));
    window.addEventListener("mouseleave", () => (dragging = false));
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      s.yaw -= e.movementX * s.sensitivity;
      s.pitch = clamp(s.pitch - e.movementY * s.sensitivity, s.minPitch, s.maxPitch);
    });
    window.addEventListener(
      "wheel",
      (e) => {
        s.distance = clamp(s.distance + Math.sign(e.deltaY) * 1.5, s.minDist, s.maxDist);
      },
      { passive: true }
    );
    // Touch: one-finger drag to orbit
    let lastTouch = null;
    window.addEventListener("touchstart", (e) => (lastTouch = e.touches[0]), { passive: true });
    window.addEventListener(
      "touchmove",
      (e) => {
        if (!lastTouch) return;
        const t = e.touches[0];
        s.yaw -= (t.clientX - lastTouch.clientX) * s.sensitivity * 2;
        s.pitch = clamp(s.pitch - (t.clientY - lastTouch.clientY) * s.sensitivity * 2, s.minPitch, s.maxPitch);
        lastTouch = t;
      },
      { passive: true }
    );
    window.addEventListener("touchend", () => (lastTouch = null));

    return {
      get yaw() {
        return s.yaw;
      },
      forward() {
        return new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
      },
      right() {
        return new THREE.Vector3(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
      },
      update(target, dt) {
        const cp = new THREE.Vector3(
          target.x + Math.sin(s.yaw) * Math.cos(s.pitch) * s.distance,
          target.y + s.height + Math.sin(s.pitch) * s.distance,
          target.z + Math.cos(s.yaw) * Math.cos(s.pitch) * s.distance
        );
        if (dt) camera.position.lerp(cp, 1 - Math.pow(0.0015, dt));
        else camera.position.copy(cp);
        camera.lookAt(target.x, target.y + s.height * 0.55, target.z);
      },
    };
  }

  return { topbar, hud, toast, overlay, handleResize, keys, el, character, orbitCamera };
})();
