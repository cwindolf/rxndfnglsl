precision highp float;

// uniform highp sampler2D UVgg;
// uniform vec2 resolution;
uniform float D_u;
uniform float D_v;
uniform float dt;
uniform float f;
uniform float k;

void main() {
    vec2 position = gl_FragCoord.xy / resolution.xy;
    vec2 pixel = 1.0 / resolution.xy;

    // Load data from previous iter
    vec2 c  = texture2D(UVgg, position                       ).rg;
    vec2 u  = texture2D(UVgg, position + pixel * vec2( 0,  1)).rg;
    vec2 ur = texture2D(UVgg, position + pixel * vec2( 1,  1)).rg;
    vec2  r = texture2D(UVgg, position + pixel * vec2( 1,  0)).rg;
    vec2 dr = texture2D(UVgg, position + pixel * vec2( 1, -1)).rg;
    vec2 d  = texture2D(UVgg, position + pixel * vec2( 0, -1)).rg;
    vec2 dl = texture2D(UVgg, position + pixel * vec2(-1, -1)).rg;
    vec2  l = texture2D(UVgg, position + pixel * vec2(-1,  0)).rg;
    vec2 ul = texture2D(UVgg, position + pixel * vec2(-1,  1)).rg;

    // Laplacian via convolutions
    vec2 lap = 0.2 * (u + r + d + l) + 0.05 * (ul + ur + dl + dr) - c;

    // Run the reaction
    float rate = c.r * c.g * c.g;
    float u_new = c.r + dt * (D_u * lap.r - rate + f * (1.0 - c.r));
    float v_new = c.g + dt * (D_v * lap.g + rate - (k + f) * c.g);

    gl_FragColor = vec4(u_new, v_new, 0.0, 1.0);
}