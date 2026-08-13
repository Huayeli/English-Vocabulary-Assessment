<template>
  <div class="deco" aria-hidden="true">
    <span class="d1"></span>
    <span class="d2"></span>
    <span class="d3"></span>
    <span class="d4"></span>
    <span class="d5"></span>
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
  border-radius: 50%;
}
.d1 {
  width: 240px;
  height: 240px;
  top: -70px;
  right: -50px;
  background: radial-gradient(circle, rgba(95, 122, 99, 0.18) 0%, rgba(95, 122, 99, 0) 70%);
}
.d2 {
  width: 130px;
  height: 130px;
  bottom: 6%;
  left: -40px;
  background: rgba(95, 122, 99, 0.10);
}
.d3 {
  width: 10px;
  height: 10px;
  top: 24%;
  left: 13%;
  background: rgba(95, 122, 99, 0.32);
}
.d4 {
  width: 16px;
  height: 16px;
  bottom: 20%;
  right: 17%;
  background: rgba(95, 122, 99, 0.22);
}
.d5 {
  width: 6px;
  height: 6px;
  top: 58%;
  right: 9%;
  background: rgba(95, 122, 99, 0.3);
}
.r1 {
  width: 180px;
  height: 180px;
  top: -50px;
  left: 9%;
  border: 1.5px solid rgba(95, 122, 99, 0.20);
}
.r2 {
  width: 280px;
  height: 280px;
  bottom: -110px;
  right: 5%;
  border: 1px solid rgba(95, 122, 99, 0.14);
}
.r3 {
  width: 90px;
  height: 90px;
  top: 34%;
  right: 24%;
  border: 1px dashed rgba(95, 122, 99, 0.18);
}
.r4 {
  width: 150px;
  height: 150px;
  top: 12%;
  right: 36%;
  border: 1px solid rgba(95, 122, 99, 0.12);
}
</style>
