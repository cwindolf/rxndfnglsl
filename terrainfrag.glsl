precision highp float;

uniform highp sampler2D UVgg;
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;

void main() {
    float u = texture2D(UVgg, vUv).r;
    float v = texture2D(UVgg, vUv).g;

    float eu = exp(1.5 * (0.5 + u));
    float ev = exp(5.0 * (0.0 + v));

    float r = ev / (ev + 1.0);
    float g = 0.5 * ev * eu / (0.5 * ev * eu + 1.0);
    float b = eu / (eu + 1.0);

    gl_FragColor = vec4(r, g, b, 1.0);
}