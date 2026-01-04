import { toPng, toJpeg } from 'html-to-image';

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

export const exportCanvas = async (elementId: string, format: ExportFormat, fileName: string = 'design') => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Canvas element not found');

    try {
        const options = { quality: 0.95, backgroundColor: '#ffffff' };
        let dataUrl = '';

        if (format === 'png') {
            dataUrl = await toPng(element, options);
        } else if (format === 'jpeg') {
            dataUrl = await toJpeg(element, options);
        } else if (format === 'webp') {
            // html-to-image doesn't support toWebp directly, usage of toPng and canvas conversion is standard fallback if needed, 
            // but let's try toPng first as it's most robust and modern browsers might just handle it if we modify mime type? 
            // No, toPng returns data:image/png.
            // We will use toPng then draw to canvas to convert to webp.
            const pngUrl = await toPng(element, options);
            const img = new Image();
            img.src = pngUrl;
            await new Promise(r => img.onload = r);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                dataUrl = canvas.toDataURL('image/webp', 0.9);
            } else {
                dataUrl = pngUrl; // Fallback
            }
        } else if (format === 'pdf') {
            const { jsPDF } = await import('jspdf');
            const imgData = await toJpeg(element, options);

            // Calculate PDF dimensions (A4)
            const imgWidth = 210;
            // We need actual aspect ratio.
            const ratio = element.offsetHeight / element.offsetWidth;
            const imgHeight = imgWidth * ratio;

            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${fileName}.pdf`);
            return;
        }

        const link = document.createElement('a');
        link.download = `${fileName}.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        console.error('Export failed:', e);
        throw e;
    }
};
