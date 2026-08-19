import * as PIXI from 'pixi.js';

export default class BlindsFilter extends PIXI.Filter {
  public constructor(progress = 0, numBlinds = 16) {
    super(undefined, `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float progress;
      uniform float numBlinds;
      void main() {
        float strip = fract(vTextureCoord.x * numBlinds);
        gl_FragColor = strip < progress ? texture2D(uSampler, vTextureCoord) : vec4(0.0);
      }
    `);
    this.uniforms.progress = progress;
    this.uniforms.numBlinds = numBlinds;
  }
  public set progress(value: number) { this.uniforms.progress = value; }
  public get progress(): number { return this.uniforms.progress; }
}
