// https://codepen.io/team/keyframers/pen/wvvoBQW

let width = window.innerWidth;
let height = window.innerHeight;

function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const treats: any[] = [];
const radius = 15;
const ag = 9.81; // m / s^2
const frameRate = 1 / 60;
const A = (Math.PI * radius * radius) / 10000; // m^2
const Cd = 0.47; // Dimensionless
const rho = 1.22; // kg / m^3

export function createTreat(
  element: HTMLElement,
  treatmojis = ["🍬", "🍫", "🍭", "🍡", "🍩", "🍪", "🍒"]
) {
  const vx = getRandomArbitrary(-10, 10); // x velocity
  const vy = getRandomArbitrary(-10, 1); // y velocity

  const el = document.createElement("div");
  el.className = "treat";

  const inner = document.createElement("span");
  inner.className = "inner";
  inner.innerText = treatmojis[getRandomInt(0, treatmojis.length - 1)];
  el.appendChild(inner);

  element.appendChild(el);

  const rect = el.getBoundingClientRect();

  const lifetime = getRandomArbitrary(2000, 3000);

  el.style.setProperty("--lifetime", lifetime.toString());

  const treat = {
    el,
    absolutePosition: { x: rect.left, y: rect.top },
    position: { x: rect.left, y: rect.top },
    velocity: { x: vx, y: vy },
    mass: 0.1, //kg
    radius, // 1px = 1cm
    restitution: -0.7,

    lifetime,
    direction: vx > 0 ? 1 : -1,

    animating: true,

    remove() {
      this.animating = false;
      this.el.parentNode?.removeChild(this.el);
    },

    animate() {
      const treat = this;
      let Fx =
        (-0.5 *
          Cd *
          A *
          rho *
          treat.velocity.x *
          treat.velocity.x *
          treat.velocity.x) /
        Math.abs(treat.velocity.x);
      let Fy =
        (-0.5 *
          Cd *
          A *
          rho *
          treat.velocity.y *
          treat.velocity.y *
          treat.velocity.y) /
        Math.abs(treat.velocity.y);

      Fx = isNaN(Fx) ? 0 : Fx;
      Fy = isNaN(Fy) ? 0 : Fy;

      // Calculate acceleration ( F = ma )
      var ax = Fx / treat.mass;
      var ay = ag + Fy / treat.mass;
      // Integrate to get velocity
      treat.velocity.x += ax * frameRate;
      treat.velocity.y += ay * frameRate;

      // Integrate to get position
      treat.position.x += treat.velocity.x * frameRate * 100;
      treat.position.y += treat.velocity.y * frameRate * 100;

      treat.checkBounds();
      treat.update();
    },

    checkBounds() {
      if (treat.position.y > height - treat.radius) {
        treat.velocity.y *= treat.restitution;
        treat.position.y = height - treat.radius;
      }
      if (treat.position.x > width - treat.radius) {
        treat.velocity.x *= treat.restitution;
        treat.position.x = width - treat.radius;
        treat.direction = -1;
      }
      if (treat.position.x < treat.radius) {
        treat.velocity.x *= treat.restitution;
        treat.position.x = treat.radius;
        treat.direction = 1;
      }
    },

    update() {
      const relX = this.position.x - this.absolutePosition.x;
      const relY = this.position.y - this.absolutePosition.y;

      this.el.style.setProperty("--x", relX.toString());
      this.el.style.setProperty("--y", relY.toString());
      this.el.style.setProperty("--direction", this.direction.toString());
    },
  };

  setTimeout(() => {
    treat.remove();
  }, lifetime);

  treats.push(treat);

  return treat;
}

function animationLoop() {
  var i = treats.length;

  while (i--) {
    treats[i].animate();

    if (!treats[i].animating) {
      treats.splice(i, 1);
    }
  }

  requestAnimationFrame(animationLoop);
}

animationLoop();

export function createTreats(
  element: HTMLElement,
  treatmojis = ["🍬", "🍫", "🍭", "🍡", "🍩", "🍪", "🍒"],
  num = 10,
  limit = 40
) {
  //cancelAnimationFrame(frame);
  if (treats.length >= limit) {
    return;
  }

  for (let i = 0; i < num; i++) {
    treats.push(createTreat(element, treatmojis));
  }
}

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
});
