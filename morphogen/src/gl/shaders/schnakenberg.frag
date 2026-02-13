#version 300 es
precision highp float;

uniform sampler2D uState;
uniform sampler2D uWallMask;
uniform vec2 uResolution;
uniform float uA;
uniform float uB;
uniform float uDu;
uniform float uDv;
uniform float uDt;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / uResolution;

  float wall = texture(uWallMask, vUv).r;
  if (wall > 0.5) {
    fragColor = texture(uState, vUv);
    return;
  }

  vec2 state = texture(uState, vUv).rg;
  float u = state.r;
  float v = state.g;

  vec2 stateL = texture(uState, vUv + vec2(-texel.x, 0.0)).rg;
  vec2 stateR = texture(uState, vUv + vec2( texel.x, 0.0)).rg;
  vec2 stateT = texture(uState, vUv + vec2(0.0,  texel.y)).rg;
  vec2 stateB = texture(uState, vUv + vec2(0.0, -texel.y)).rg;

  float lapU = stateL.r + stateR.r + stateT.r + stateB.r - 4.0 * u;
  float lapV = stateL.g + stateR.g + stateT.g + stateB.g - 4.0 * v;

  // Schnakenberg: du/dt = a - u + u^2*v + Du*lap(u), dv/dt = b - u^2*v + Dv*lap(v)
  float u2v = u * u * v;
  float du = uA - u + u2v + uDu * lapU;
  float dv = uB - u2v + uDv * lapV;

  float newU = u + du * uDt;
  float newV = v + dv * uDt;

  fragColor = vec4(newU, newV, 0.0, 1.0);
}
