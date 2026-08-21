<template>
  <div class="deco" aria-hidden="true">
    <span class="d1"></span>
    <span class="d2"></span>
    <span class="d3"></span>
    <span class="d4"></span>
    <span class="d5"></span>
    <span class="d6"></span>
    <span class="r1"></span>
    <span class="r2"></span>
    <span class="r3"></span>
    <span class="r4"></span>
  </div>
</template>

<style scoped>
.deco {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.deco span {
  position: absolute;
  display: block;
  border-radius: 0;
}
.d1 {
  width: 240px;
  height: 240px;
  top: -90px;
  right: -70px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.14) 2px, transparent 2.5px);
  background-size: 20px 20px;
  border: 3px solid #000;
}
.d2 {
  width: 150px;
  height: 150px;
  bottom: 4%;
  left: -60px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.1) 1.5px, transparent 2px);
  background-size: 16px 16px;
  border: 3px solid #000;
}
.d3 {
  width: 14px;
  height: 14px;
  top: 22%;
  left: 12%;
  background: #000;
  transform: rotate(14deg);
  animation: floaty 6s ease-in-out infinite;
}
.d4 {
  width: 22px;
  height: 22px;
  bottom: 22%;
  right: 15%;
  background: #FF6B6B;
  border: 2px solid #000;
  transform: rotate(-8deg);
  animation: floaty 7s ease-in-out infinite 0.8s;
}
.d5 {
  width: 14px;
  height: 14px;
  top: 56%;
  right: 8%;
  background: #FFD93D;
  border: 2px solid #000;
  border-radius: 50%;
  animation: floaty 5s ease-in-out infinite 0.4s;
}
.d6 {
  width: 16px;
  height: 16px;
  top: 12%;
  right: 22%;
  background: #C4B5FD;
  border: 2px solid #000;
  transform: rotate(10deg);
  animation: floaty 6.5s ease-in-out infinite 1.2s;
}
.r1 {
  width: 190px;
  height: 190px;
  top: -60px;
  left: 8%;
  border: 3px solid rgba(0, 0, 0, 0.25);
}
.r2 {
  width: 280px;
  height: 280px;
  bottom: -130px;
  right: 4%;
  border: 3px solid rgba(0, 0, 0, 0.18);
  border-radius: 50%;
}
.r3 {
  width: 110px;
  height: 110px;
  top: 32%;
  right: 22%;
  border: 3px dashed rgba(0, 0, 0, 0.3);
  animation: spin 40s linear infinite;
}
.r4 {
  width: 150px;
  height: 150px;
  top: 10%;
  right: 34%;
  border: 3px solid rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
