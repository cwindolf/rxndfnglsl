varying vec2 vUv;

void main() {
    vec3 p = position;
    vUv = uv;
    vec4 modelViewPosition = modelViewMatrix * vec4(p.x, p.y, p.z, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}