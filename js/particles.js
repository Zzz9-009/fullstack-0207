/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
  功能：首页 canvas 粒子背景动画（自适应尺寸、连线、鼠标/触摸轻微吸引）
*/

// 功能：初始化粒子系统，按画布尺寸生成粒子并循环绘制
function wzx_initParticles() {
  const wzx_canvas = document.getElementById("wzx_canvas");
  if (!wzx_canvas || !wzx_canvas.getContext) {
    return;
  }

  const wzx_ctx = wzx_canvas.getContext("2d");
  const wzx_points = [];
  const wzx_pointer = { x: -999, y: -999 };
  let wzx_width = 0;
  let wzx_height = 0;

  // 功能：按当前容器尺寸设置画布像素，适配高 DPI 屏幕
  function wzx_resize() {
    const wzx_ratio = Math.min(window.devicePixelRatio || 1, 2);
    const wzx_rect = wzx_canvas.getBoundingClientRect();
    wzx_width = wzx_rect.width;
    wzx_height = wzx_rect.height;
    wzx_canvas.width = Math.round(wzx_width * wzx_ratio);
    wzx_canvas.height = Math.round(wzx_height * wzx_ratio);
    wzx_ctx.setTransform(wzx_ratio, 0, 0, wzx_ratio, 0, 0);
  }

  // 功能：按画布面积补充粒子，保证不同屏幕密度一致
  function wzx_seed() {
    wzx_points.length = 0;
    const wzx_count = Math.round((wzx_width * wzx_height) / 14000);
    for (let wzx_i = 0; wzx_i < wzx_count; wzx_i++) {
      wzx_points.push({
        x: Math.random() * wzx_width,
        y: Math.random() * wzx_height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.7
      });
    }
  }

  // 功能：绘制一帧：更新位置、画粒子、画近距离连线
  function wzx_frame() {
    wzx_ctx.clearRect(0, 0, wzx_width, wzx_height);

    for (let wzx_i = 0; wzx_i < wzx_points.length; wzx_i++) {
      const wzx_p = wzx_points[wzx_i];
      wzx_p.x += wzx_p.vx;
      wzx_p.y += wzx_p.vy;

      if (wzx_p.x < 0 || wzx_p.x > wzx_width) { wzx_p.vx *= -1; }
      if (wzx_p.y < 0 || wzx_p.y > wzx_height) { wzx_p.vy *= -1; }

      wzx_ctx.beginPath();
      wzx_ctx.arc(wzx_p.x, wzx_p.y, wzx_p.r, 0, Math.PI * 2);
      wzx_ctx.fillStyle = "rgba(126, 174, 255, 0.75)";
      wzx_ctx.fill();
    }

    for (let wzx_i = 0; wzx_i < wzx_points.length; wzx_i++) {
      for (let wzx_j = wzx_i + 1; wzx_j < wzx_points.length; wzx_j++) {
        const wzx_a = wzx_points[wzx_i];
        const wzx_b = wzx_points[wzx_j];
        const wzx_dist = Math.hypot(wzx_a.x - wzx_b.x, wzx_a.y - wzx_b.y);
        if (wzx_dist < 130) {
          wzx_ctx.beginPath();
          wzx_ctx.moveTo(wzx_a.x, wzx_a.y);
          wzx_ctx.lineTo(wzx_b.x, wzx_b.y);
          wzx_ctx.strokeStyle = "rgba(94, 160, 255," + (0.22 * (1 - wzx_dist / 130)).toFixed(3) + ")";
          wzx_ctx.lineWidth = 0.7;
          wzx_ctx.stroke();
        }
      }

      // 指针附近的粒子轻微被吸引，形成互动感
      const wzx_p = wzx_points[wzx_i];
      const wzx_ptr = Math.hypot(wzx_p.x - wzx_pointer.x, wzx_p.y - wzx_pointer.y);
      if (wzx_ptr < 120) {
        wzx_ctx.beginPath();
        wzx_ctx.moveTo(wzx_p.x, wzx_p.y);
        wzx_ctx.lineTo(wzx_pointer.x, wzx_pointer.y);
        wzx_ctx.strokeStyle = "rgba(102, 224, 194," + (0.25 * (1 - wzx_ptr / 120)).toFixed(3) + ")";
        wzx_ctx.lineWidth = 0.6;
        wzx_ctx.stroke();
      }
    }

    requestAnimationFrame(wzx_frame);
  }

  // 功能：指针移动时更新坐标，离开时移出屏幕
  function wzx_trackPointer(wzx_event) {
    const wzx_rect = wzx_canvas.getBoundingClientRect();
    const wzx_touch = wzx_event.touches && wzx_event.touches[0];
    const wzx_x = wzx_touch ? wzx_touch.clientX : wzx_event.clientX;
    const wzx_y = wzx_touch ? wzx_touch.clientY : wzx_event.clientY;
    wzx_pointer.x = wzx_x - wzx_rect.left;
    wzx_pointer.y = wzx_y - wzx_rect.top;
  }

  window.addEventListener("resize", function () {
    wzx_resize();
    wzx_seed();
  });
  window.addEventListener("pointermove", wzx_trackPointer);
  window.addEventListener("pointerleave", function () {
    wzx_pointer.x = -999;
    wzx_pointer.y = -999;
  });

  wzx_resize();
  wzx_seed();
  requestAnimationFrame(wzx_frame);
}

wzx_initParticles();
