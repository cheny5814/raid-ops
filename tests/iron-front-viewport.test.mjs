import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FRONT_PIXEL_BUDGET, frontViewport } from '../app/utils/front-viewport.ts'

test('普通窗口和 1080p 保持清晰，Retina / 4K 全屏限制在约 1080p 绘制量', () => {
  const small=frontViewport(960,480,2)
  assert.equal(small.pixelWidth,1920);assert.equal(small.pixelHeight,960)
  const hd=frontViewport(1920,1080,1)
  assert.equal(hd.pixelWidth,1920);assert.equal(hd.pixelHeight,1080)
  for(const [w,h,dpr] of [[1920,1080,2],[2560,1440,2],[3840,2160,1],[3024,1964,2],[7680,4320,3]]){
    const v=frontViewport(w,h,dpr)
    assert.ok(v.pixelWidth*v.pixelHeight<=FRONT_PIXEL_BUDGET)
    assert.ok(v.pixelWidth<=w*dpr&&v.pixelHeight<=h*dpr)
    assert.ok(Math.abs(v.logicalWidth*v.scaleX-v.pixelWidth)<.001)
    assert.ok(Math.abs(480*v.scaleY-v.pixelHeight)<.001)
    assert.ok(Math.abs(v.logicalWidth/480-w/h)<.001)
    assert.equal(v.logicalWidth,frontViewport(w,h,1).logicalWidth,'像素预算不改变相机视野或世界坐标')
  }
  assert.deepEqual(frontViewport(1920,1080,2),hd)
  assert.deepEqual(frontViewport(3840,2160,1),hd)
})

test('全屏往返恢复窗口分辨率，竖井及窄屏保留原有逻辑视野',()=>{
 const before=frontViewport(1000,620,2),full=frontViewport(2560,1440,2),after=frontViewport(1000,620,2)
 assert.deepEqual(before,after)
 assert.ok(Math.abs(full.pixelWidth/full.pixelHeight-2560/1440)<.002)
 assert.equal(frontViewport(390,744,2).logicalWidth,460)
 assert.equal(frontViewport(390,744,2).pixelWidth,780)
})
