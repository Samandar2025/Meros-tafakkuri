import { jsPDF } from 'jspdf';
import { ScheduleItem } from '../types';

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

export function generateScheduleCanvas(schedule: ScheduleItem[], studentName?: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1800;
  const height = 1150;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context could not be created");

  // Background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Card
  drawRoundedRect(ctx, 30, 30, width - 60, height - 60, 24, "#ffffff", "#e2e8f0", 2);

  // Header Banner (Gradient)
  const headerGrad = ctx.createLinearGradient(50, 50, width - 50, 160);
  headerGrad.addColorStop(0, "#3730a3"); // indigo-800
  headerGrad.addColorStop(0.5, "#4f46e5"); // indigo-600
  headerGrad.addColorStop(1, "#6366f1"); // indigo-500
  drawRoundedRect(ctx, 50, 50, width - 100, 110, 18, "", undefined);
  ctx.save();
  ctx.fillStyle = headerGrad;
  ctx.fill();
  ctx.restore();

  // Header Title & Logo Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Meros Tafakkur • HAFTALIK DARS JADVALI", 80, 105);

  ctx.fillStyle = "#c7d2fe"; // indigo-200
  ctx.font = "500 16px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Qadriyatlarga asoslangan intellektual ta'lim ekotizimi", 80, 135);

  // Student and Date Metadata (Right Side)
  const todayStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.textAlign = "right";

  if (studentName) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillText(`O'quvchi: ${studentName}`, width - 80, 98);

    ctx.fillStyle = "#e0e7ff";
    ctx.font = "500 14px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillText(`Sana: ${todayStr} • Jami darslar: ${schedule.length} ta`, width - 80, 128);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillText(`Sana: ${todayStr}`, width - 80, 105);

    ctx.fillStyle = "#e0e7ff";
    ctx.font = "500 14px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillText(`Jami darslar: ${schedule.length} ta`, width - 80, 132);
  }

  ctx.textAlign = "left"; // reset alignment

  // Schedule Columns (6 days)
  const startX = 50;
  const startY = 190;
  const colGap = 16;
  const totalCols = DAYS.length;
  const colWidth = (width - 100 - (colGap * (totalCols - 1))) / totalCols;
  const colHeight = height - startY - 90;

  DAYS.forEach((day, index) => {
    const colX = startX + index * (colWidth + colGap);
    const dayLessons = schedule
      .filter(s => s.day.toLowerCase() === day.toLowerCase())
      .sort((a, b) => a.time.localeCompare(b.time));

    // Column background container
    drawRoundedRect(ctx, colX, startY, colWidth, colHeight, 16, "#f8fafc", "#e2e8f0", 1.5);

    // Day Header
    const dayHeaderGrad = ctx.createLinearGradient(colX, startY, colX + colWidth, startY + 54);
    dayHeaderGrad.addColorStop(0, "#f1f5f9");
    dayHeaderGrad.addColorStop(1, "#e2e8f0");
    drawRoundedRect(ctx, colX, startY, colWidth, 54, 16, "", undefined);
    ctx.save();
    ctx.fillStyle = dayHeaderGrad;
    ctx.fill();
    ctx.restore();

    // Day label
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 17px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(day, colX + colWidth / 2, startY + 33);

    // Day count badge
    ctx.font = "600 11px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${dayLessons.length} ta dars`, colX + colWidth / 2, startY + 48);

    ctx.textAlign = "left";

    // Lesson cards inside day column
    let itemY = startY + 68;
    const itemHeight = 74;
    const maxItems = Math.floor((colHeight - 80) / (itemHeight + 10));

    if (dayLessons.length === 0) {
      // Empty state
      drawRoundedRect(ctx, colX + 12, itemY + 20, colWidth - 24, 90, 12, "#ffffff", "#cbd5e1", 1);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 13px Inter, system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Darslar yo'q", colX + colWidth / 2, itemY + 70);
      ctx.textAlign = "left";
    } else {
      dayLessons.slice(0, maxItems).forEach((lesson) => {
        // Lesson Card Container
        drawRoundedRect(ctx, colX + 10, itemY, colWidth - 20, itemHeight, 12, "#ffffff", "#cbd5e1", 1);

        // Time Pill Badge
        drawRoundedRect(ctx, colX + 18, itemY + 12, 66, 22, 6, "#eef2ff", "#c7d2fe", 1);
        ctx.fillStyle = "#4338ca";
        ctx.font = "bold 12px Inter, system-ui, -apple-system, sans-serif";
        ctx.fillText(lesson.time, colX + 24, itemY + 27);

        // Subject Name
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 14px Inter, system-ui, -apple-system, sans-serif";
        const trimmedSubject = lesson.subject.length > 20 
          ? lesson.subject.substring(0, 18) + '...' 
          : lesson.subject;
        ctx.fillText(trimmedSubject, colX + 18, itemY + 54);

        itemY += itemHeight + 10;
      });

      if (dayLessons.length > maxItems) {
        ctx.fillStyle = "#64748b";
        ctx.font = "600 12px Inter, system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`+ yana ${dayLessons.length - maxItems} ta dars`, colX + colWidth / 2, itemY + 16);
        ctx.textAlign = "left";
      }
    }
  });

  // Footer Banner
  ctx.fillStyle = "#64748b";
  ctx.font = "500 13px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Meros Tafakkur • O'quvchi va maktab ta'lim jarayonlarini raqamlashtirish intellektual ekotizimi", 60, height - 42);

  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 12px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Rasmiy dars jadvali hujjati", width - 60, height - 42);
  ctx.textAlign = "left";

  return canvas;
}

export async function downloadScheduleAsImage(schedule: ScheduleItem[], studentName?: string) {
  const canvas = generateScheduleCanvas(schedule, studentName);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  
  const link = document.createElement('a');
  const filename = studentName 
    ? `Dars_Jadvali_${studentName.replace(/\s+/g, '_')}.png`
    : 'Meros_Tafakkur_Haftalik_Dars_Jadvali.png';
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadScheduleAsPDF(schedule: ScheduleItem[], studentName?: string) {
  const canvas = generateScheduleCanvas(schedule, studentName);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // A4 landscape dimensions: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;
  const targetWidth = pageWidth - (margin * 2);
  const targetHeight = (canvas.height / canvas.width) * targetWidth;
  const offsetY = (pageHeight - targetHeight) / 2;

  pdf.addImage(imgData, 'PNG', margin, offsetY > margin ? offsetY : margin, targetWidth, targetHeight, undefined, 'FAST');

  const filename = studentName 
    ? `Dars_Jadvali_${studentName.replace(/\s+/g, '_')}.pdf`
    : 'Meros_Tafakkur_Haftalik_Dars_Jadvali.pdf';
  pdf.save(filename);
}
