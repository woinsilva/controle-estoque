<template>
  <div class="signature-pad">
    <canvas
      ref="canvasEl"
      class="canvas"
      width="640"
      height="220"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="endDraw"
      @mouseleave="endDraw"
      @touchstart.prevent="startDraw"
      @touchmove.prevent="draw"
      @touchend.prevent="endDraw"
    />
    <div class="actions">
      <button type="button" class="ghost" @click="clearPad">{{ clearLabel }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, toNative } from 'vue-facing-decorator';

@Component({})
class SignaturePad extends Vue {
  @Prop({ default: '' }) readonly modelValue!: string;
  @Prop({ default: 'Limpar assinatura' }) readonly clearLabel!: string;

  private drawing = false;
  private ctx: CanvasRenderingContext2D | null = null;

  mounted() {
    const canvas = this.getCanvas();
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.lineWidth = 2.2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#0f766e';
    if (this.modelValue) {
      this.loadFromDataUrl(this.modelValue);
    }
  }

  getCanvas() {
    return this.$refs.canvasEl as HTMLCanvasElement | undefined;
  }

  getPoint(event: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event && event.touches.length > 0) {
      const touch = event.touches[0]!;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    const mouse = event as MouseEvent;
    return { x: mouse.clientX - rect.left, y: mouse.clientY - rect.top };
  }

  startDraw(event: MouseEvent | TouchEvent) {
    const canvas = this.getCanvas();
    if (!canvas || !this.ctx) return;
    this.drawing = true;
    const point = this.getPoint(event, canvas);
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.drawing || !this.ctx) return;
    const canvas = this.getCanvas();
    if (!canvas) return;
    const point = this.getPoint(event, canvas);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  endDraw() {
    if (!this.drawing) return;
    this.drawing = false;
    const canvas = this.getCanvas();
    if (!canvas) return;
    this.$emit('update:modelValue', canvas.toDataURL('image/png'));
  }

  clearPad() {
    const canvas = this.getCanvas();
    if (!canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.$emit('update:modelValue', '');
  }

  loadFromDataUrl(dataUrl: string) {
    const canvas = this.getCanvas();
    if (!canvas || !this.ctx) return;
    const image = new Image();
    image.onload = () => {
      this.ctx?.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = dataUrl;
  }
}
export default toNative(SignaturePad);
</script>

<style scoped>
.signature-pad {
  display: grid;
  gap: 0.6rem;
}

.canvas {
  width: 100%;
  border-radius: 12px;
  border: 1px dashed var(--border);
  background: #fff;
  touch-action: none;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.ghost {
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
</style>
