const size = 480;
const center = size / 2;
const rounds = ["LOOK", "STITCH", "COMPARE"];
const colors = [...document.querySelectorAll(".swatch")];
const action = document.querySelector("#action");
const undo = document.querySelector("#undo");
const tools = document.querySelector("#tools");
const timer = document.querySelector("#timer");
const progress = document.querySelector("#progress");
const seconds = document.querySelector("#seconds");
const phaseLabel = document.querySelector("#phase");
const instruction = document.querySelector("#instruction");
const hint = document.querySelector("#hint");
const original = document.querySelector("#original");
const pattern = document.querySelector("#pattern");
const peek = document.querySelector("#peek");
const caption = document.querySelector("#caption");

let phase = "ready";
let strokes = [];
let thread = colors[0].dataset.color;
let activePointer = null;
let deadline = 0;
let clock = 0;
let working;
let reference;

function makeCloth(p) {
  const cloth = p.createGraphics(size, size);
  cloth.randomSeed(782);
  cloth.background("#e6d8bc");
  cloth.noStroke();

  for (let i = 0; i < 7500; i++) {
    cloth.fill(74, 48, 20, cloth.random(4, 25));
    cloth.rect(cloth.random(size), cloth.random(size), cloth.random(1, 5), 1);
  }

  cloth.drawingContext.shadowColor = "#35282172";
  cloth.drawingContext.shadowBlur = 20;
  cloth.drawingContext.shadowOffsetY = 9;
  cloth.fill("#202621");
  cloth.rect(29, 29, 422, 422, 46);
  cloth.drawingContext.shadowBlur = 0;
  cloth.drawingContext.shadowOffsetY = 0;
  cloth.fill("#272f27");
  cloth.rect(43, 43, 394, 394, 38);

  for (let i = 0; i < 10500; i++) {
    const x = cloth.random(48, 432);
    const y = cloth.random(48, 432);
    const dx = Math.max(0, Math.abs(x - center) - 155);
    const dy = Math.max(0, Math.abs(y - center) - 155);
    if (Math.hypot(dx, dy) > 35) continue;
    cloth.fill(197, 194, 147, cloth.random(4, 28));
    cloth.rect(x, y, cloth.random(1, 4), 0.7);
  }

  cloth.noFill();
  cloth.stroke("#807159");
  cloth.strokeWeight(1.5);
  cloth.rect(38, 38, 404, 404, 39);
  cloth.stroke("#505746");
  cloth.rect(68, 68, 344, 344, 20);
  cloth.line(95, center, 385, center);
  cloth.line(center, 95, center, 385);

  fourTurns(cloth, () => {
    cloth.stroke("#ae9972");
    cloth.strokeWeight(1.8);
    for (let x = -139; x <= 139; x += 4) {
      cloth.line(x, -192, x + 3, -185);
    }
    cloth.stroke("#ccba90");
    for (let x = -117; x <= 117; x += 78) {
      cloth.arc(x, -177, 28, 16, Math.PI, Math.PI * 2);
      cloth.arc(x, -175, 20, 10, Math.PI, Math.PI * 2);
    }
  });

  return cloth;
}

function fourTurns(p, drawTurn) {
  p.push();
  p.translate(center, center);

  for (let turn = 0; turn < 4; turn++) {
    p.push();
    p.rotate(turn * p.HALF_PI);
    drawTurn();
    p.pop();
  }

  p.pop();
}

function pepper(p) {
  p.noFill();
  p.stroke("#f6e6bf");
  p.strokeWeight(4);
  p.bezier(-130, -68, -44, -44, -23, -145, -85, -144);
  p.bezier(-85, -144, -124, -148, -125, -108, -96, -104);
  p.bezier(-96, -104, -75, -100, -70, -120, -85, -123);
  p.strokeWeight(1.8);
  p.bezier(-126, -70, -63, -61, -44, -124, -76, -136);

  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = p.bezierPoint(-130, -44, -23, -85, t);
    const y = p.bezierPoint(-68, -44, -145, -144, t);
    const angle = p.atan2(
      p.bezierTangent(-68, -44, -145, -144, t),
      p.bezierTangent(-130, -44, -23, -85, t),
    );
    p.line(x, y, x + p.cos(angle + 1.4) * 8, y + p.sin(angle + 1.4) * 8);
  }

  p.stroke("#c4af84");
  p.beginShape();
  p.vertex(-128, -121);
  p.vertex(-137, -112);
  p.vertex(-128, -103);
  p.vertex(-119, -112);
  p.endShape(p.CLOSE);
  p.point(-47, -82);
  p.point(-54, -74);
}

function drawPattern(p) {
  if (pattern.value === "pepper") {
    pepper(p);
    return;
  }

  p.push();
  p.translate(-95, -105);
  p.noFill();
  p.stroke("#f6e6bf");
  p.strokeWeight(3);

  if (pattern.value === "flower") {
    for (let i = 0; i < 8; i++) {
      p.push();
      p.rotate((i * p.TWO_PI) / 8);
      p.ellipse(0, -22, 18, 42);
      p.pop();
    }
    p.circle(0, 0, 13);
    p.stroke("#c4af84");
    p.line(0, 43, 0, 58);
  } else {
    p.beginShape();
    for (let i = 0; i < 16; i++) {
      const radius = i % 2 === 0 ? 48 : 22;
      const angle = (i * p.PI) / 8 - p.HALF_PI;
      p.vertex(p.cos(angle) * radius, p.sin(angle) * radius);
    }
    p.endShape(p.CLOSE);
    p.circle(0, 0, 21);
    p.stroke("#c4af84");
    p.square(-4, -4, 8);
  }
  p.pop();
}

function paintStitch(p, stroke) {
  p.stroke(stroke.color);
  p.strokeWeight(2.5);
  p.noFill();

  if (stroke.points.length === 1) {
    p.point(stroke.points[0].x, stroke.points[0].y);
    return;
  }

  p.beginShape();
  for (const point of stroke.points) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
}

function position(event, canvas) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) * size) / box.width - center,
    y: ((event.clientY - box.top) * size) / box.height - center,
  };
}

function inside(point) {
  return Math.abs(point.x) <= 166 && Math.abs(point.y) <= 166;
}

function connectDrawing(canvas, p) {
  canvas.addEventListener("pointerdown", (event) => {
    if (phase !== "stitch" || activePointer !== null || event.button !== 0)
      return;

    const point = position(event, canvas);
    if (!inside(point)) return;

    activePointer = event.pointerId;
    canvas.setPointerCapture(activePointer);
    strokes.push({ color: thread, points: [point] });
    undo.disabled = false;
    action.disabled = false;
    p.redraw();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (activePointer !== event.pointerId) return;

    const point = position(event, canvas);
    if (!inside(point)) {
      activePointer = null;
      return;
    }

    const points = strokes.at(-1).points;
    const last = points.at(-1);
    if (Math.hypot(point.x - last.x, point.y - last.y) < 2) return;

    points.push(point);
    p.redraw();
  });

  function finish(event) {
    if (activePointer === event.pointerId) activePointer = null;
  }

  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  canvas.addEventListener("lostpointercapture", finish);
}

function sketch(isReference) {
  return (p) => {
    let cloth;
    let canvas;

    p.setup = () => {
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      canvas = p.createCanvas(size, size);
      p.noLoop();
      cloth = makeCloth(p);

      if (!isReference) {
        connectDrawing(canvas.elt, p);
        action.disabled = false;
      }
    };

    p.draw = () => {
      p.clear();
      p.image(cloth, 0, 0);
      canvas.elt.classList.toggle(
        "stitching",
        !isReference && phase === "stitch",
      );

      if (isReference || phase === "look") {
        const opacity = isReference
          ? 1
          : p.constrain((deadline - performance.now()) / 400, 0, 1);
        p.push();
        p.drawingContext.globalAlpha = opacity;
        fourTurns(p, () => drawPattern(p));
        p.pop();
      }

      if (!isReference && (phase === "stitch" || phase === "compare")) {
        fourTurns(p, () => {
          for (const stroke of strokes) paintStitch(p, stroke);
        });
      }
    };
  };
}

function setPhase(next) {
  phase = next;
  if (phase === "look") deadline = performance.now() + 5000;
  working.redraw();
  original.hidden = phase !== "compare";
  peek.textContent = "See doppi";
  peek.setAttribute("aria-pressed", "false");
  timer.hidden = phase !== "look";
  tools.hidden = phase !== "stitch";

  if (phase === "look") {
    phaseLabel.textContent = rounds[0];
    instruction.textContent = "Look closely.";
    hint.textContent = "Follow one motif and notice how it repeats.";
    caption.textContent = "Reference pattern";
    action.disabled = true;
    tick();
  } else if (phase === "stitch") {
    phaseLabel.textContent = rounds[1];
    instruction.textContent = "Stitch what you remember.";
    hint.textContent =
      "Drag on the cloth. Each stroke turns into four stitches around the center.";
    caption.textContent = "Your doppi";
    action.textContent = "See both";
    action.disabled = true;
    undo.disabled = true;
  } else if (phase === "compare") {
    phaseLabel.textContent = rounds[2];
    instruction.textContent = "What did you remember that wasn’t there?";
    hint.textContent = "Look for one detail you kept and one you invented.";
    action.textContent = "Try again";
    reference.redraw();
  }
}

function tick() {
  const remaining = Math.max(0, deadline - performance.now()) / 1000;
  seconds.textContent = Math.ceil(remaining);
  progress.value = remaining;

  if (remaining > 0) {
    if (remaining <= 0.4) working.redraw();
    clock = requestAnimationFrame(tick);
  } else {
    setPhase("stitch");
  }
}

pattern.addEventListener("change", () => {
  reference.redraw();
  working.redraw();
});

peek.addEventListener("click", () => {
  const visible = original.hidden;
  original.hidden = !visible;
  peek.textContent = visible ? "Hide doppi" : "See doppi";
  peek.setAttribute("aria-pressed", String(visible));
  if (visible) reference.redraw();
});

for (const swatch of colors) {
  swatch.addEventListener("click", () => {
    thread = swatch.dataset.color;
    for (const color of colors) {
      color.setAttribute("aria-pressed", String(color === swatch));
    }
  });
}

undo.addEventListener("click", () => {
  activePointer = null;
  strokes.pop();
  undo.disabled = strokes.length === 0;
  action.disabled = undo.disabled;
  working.redraw();
});

action.addEventListener("click", () => {
  if (phase === "stitch") {
    activePointer = null;
    setPhase("compare");
  } else if (phase === "ready" || phase === "compare") {
    cancelAnimationFrame(clock);
    strokes = [];
    action.textContent = "Show the doppi";
    setPhase("look");
  }
});

if (typeof p5 === "undefined") {
  hint.textContent =
    "The drawing library did not load. Connect to the internet and reload.";
} else {
  working = new p5(sketch(false), "working-canvas");
  reference = new p5(sketch(true), "reference-canvas");
}
