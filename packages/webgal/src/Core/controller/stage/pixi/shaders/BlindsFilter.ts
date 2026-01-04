import * as PIXI from 'pixi.js';

export default class BlindsFilter extends PIXI.Filter {
  public constructor(progress = 0, numBlinds = 10) {
    const fragmentShader = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float progress;
uniform float numBlinds;

void main() {
    float strip = fract(vTextureCoord.x * numBlinds);
    if (strip < progress) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
    `;
    super(null as any, fragmentShader);
    this.uniforms.progress = progress;
    this.uniforms.numBlinds = numBlinds;
  }

  public set progress(value: number) {
    this.uniforms.progress = value;
  }

  public get progress(): number {
    return this.uniforms.progress;
  }

  public set numBlinds(value: number) {
    this.uniforms.numBlinds = value;
  }

  public get numBlinds(): number {
    return this.uniforms.numBlinds;
  }
}
