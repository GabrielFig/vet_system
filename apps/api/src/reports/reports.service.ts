import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

async function buildPdfBuffer(docDefinition: object): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: PdfPrinter } = require('pdfmake/js/Printer') as {
    default: new (fonts: object, vfs: unknown, urlResolver: object, localPolicy: unknown) => {
      createPdfKitDocument: (dd: object) => Promise<NodeJS.EventEmitter & { end: () => void }>;
    };
  };
  // pdfmake v0.3 requires a urlResolver with resolve() + resolved() — no-op is fine for built-in fonts
  const urlResolver = { resolve: () => {}, resolved: async () => {} };
  const printer = new PdfPrinter(FONTS, undefined, urlResolver, undefined);
  const pdfDoc = await printer.createPdfKitDocument(docDefinition);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateCartillaPdf(petId: string): Promise<Buffer> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        record: {
          include: {
            consultations: {
              orderBy: { createdAt: 'desc' },
              include: { note: true, prescriptions: true, vaccinations: true },
            },
          },
        },
      },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');

    const age = pet.birthDate
      ? `${Math.floor((Date.now() - pet.birthDate.getTime()) / 31536000000)} años`
      : 'Desconocida';

    const consultationBlocks: object[] = pet.record?.consultations.flatMap((c) => {
      const blocks: object[] = [
        { text: `Consulta: ${c.reason}`, style: 'consultHeader', margin: [0, 12, 0, 4] },
        { text: new Date(c.createdAt).toLocaleDateString('es-MX'), style: 'subtext' },
      ];
      if (c.note) {
        blocks.push({ text: 'Nota médica', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        blocks.push({ text: c.note.title, bold: true, fontSize: 10 });
        blocks.push({ text: c.note.content, fontSize: 10, color: '#555' });
      }
      if (c.prescriptions.length > 0) {
        blocks.push({ text: 'Recetas', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        c.prescriptions.forEach((rx) => {
          blocks.push({ text: rx.diagnosis, bold: true, fontSize: 10 });
          blocks.push({ text: `Medicamentos: ${rx.medications}`, fontSize: 10, color: '#555' });
          blocks.push({ text: `Instrucciones: ${rx.instructions}`, fontSize: 10, color: '#555' });
        });
      }
      if (c.vaccinations.length > 0) {
        blocks.push({ text: 'Vacunas', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        c.vaccinations.forEach((v) => {
          blocks.push({
            text: `${v.vaccineName}${v.batch ? ` (Lote: ${v.batch})` : ''} — ${new Date(v.appliedAt).toLocaleDateString('es-MX')}`,
            fontSize: 10, color: '#555',
          });
        });
      }
      return blocks;
    }) ?? [];

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 11 },
      styles: {
        header: { fontSize: 20, bold: true, color: '#1e293b' },
        subtext: { fontSize: 10, color: '#64748b' },
        consultHeader: { fontSize: 13, bold: true, color: '#3730a3' },
        sectionTitle: { fontSize: 11, bold: true, color: '#334155' },
      },
      content: [
        { text: 'Cartilla Médica', style: 'header' },
        { text: `Generado el ${new Date().toLocaleDateString('es-MX')}`, style: 'subtext', margin: [0, 2, 0, 16] },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [{ text: 'Mascota', bold: true }, pet.name],
              [{ text: 'Especie', bold: true }, pet.species],
              [{ text: 'Raza', bold: true }, pet.breed ?? '—'],
              [{ text: 'Sexo', bold: true }, pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'],
              [{ text: 'Edad', bold: true }, age],
              [{ text: 'Dueño', bold: true }, `${pet.owner.firstName} ${pet.owner.lastName}`],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 16],
        },
        { text: 'Historial de Consultas', fontSize: 15, bold: true, margin: [0, 0, 0, 8] },
        ...consultationBlocks,
        { text: `\n— Generado por VetSystem —`, style: 'subtext', alignment: 'center', margin: [0, 24, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  }

  async generateMonthlyReport(clinicId: string, month: number, year: number): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const consultations = await this.prisma.consultation.findMany({
      where: { clinicId, createdAt: { gte: startDate, lt: endDate } },
      include: { doctor: { select: { firstName: true, lastName: true } } },
    });

    const byDoctor = new Map<string, { name: string; count: number }>();
    for (const c of consultations) {
      const name = `${c.doctor.firstName} ${c.doctor.lastName}`;
      const prev = byDoctor.get(c.doctorId) ?? { name, count: 0 };
      byDoctor.set(c.doctorId, { name, count: prev.count + 1 });
    }

    const products = await this.prisma.product.findMany({ where: { clinicId, isActive: true } });
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);

    const movements = await this.prisma.stockMovement.findMany({
      where: { clinicId, createdAt: { gte: startDate, lt: endDate } },
      include: { product: { select: { category: true } } },
    });

    const inByCategory = new Map<string, number>();
    const outByCategory = new Map<string, number>();
    for (const m of movements) {
      const cat = m.product.category;
      if (m.type === 'IN') inByCategory.set(cat, (inByCategory.get(cat) ?? 0) + m.quantity);
      if (m.type === 'OUT') outByCategory.set(cat, (outByCategory.get(cat) ?? 0) + m.quantity);
    }

    const allCategories = [...new Set([...inByCategory.keys(), ...outByCategory.keys()])];
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 11 },
      styles: {
        header: { fontSize: 20, bold: true, color: '#1e293b' },
        subtext: { fontSize: 10, color: '#64748b' },
        sectionHeader: { fontSize: 14, bold: true, color: '#1e293b', margin: [0, 16, 0, 6] },
      },
      content: [
        { text: 'Reporte Mensual', style: 'header' },
        { text: `${monthName} · Generado el ${new Date().toLocaleDateString('es-MX')}`, style: 'subtext', margin: [0, 2, 0, 16] },

        { text: 'Resumen de Consultas', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Métrica', bold: true }, { text: 'Valor', bold: true }],
              ['Total consultas en el mes', String(consultations.length)],
              ['Pacientes únicos atendidos', String(new Set(consultations.map((c) => c.recordId)).size)],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Consultas por Doctor', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Doctor', bold: true }, { text: 'Consultas', bold: true }],
              ...(byDoctor.size === 0
                ? [['Sin consultas', '0']]
                : [...byDoctor.values()].map((d) => [d.name, String(d.count)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Productos con Stock Bajo', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: 'Producto', bold: true }, { text: 'Stock actual', bold: true }, { text: 'Stock mínimo', bold: true }],
              ...(lowStockProducts.length === 0
                ? [['Sin alertas', '', '']]
                : lowStockProducts.map((p) => [p.name, String(p.currentStock), String(p.minStock)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Movimientos de Inventario por Categoría', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: 'Categoría', bold: true }, { text: 'Entradas', bold: true }, { text: 'Salidas', bold: true }],
              ...(allCategories.length === 0
                ? [['Sin movimientos', '0', '0']]
                : allCategories.map((cat) => [cat, String(inByCategory.get(cat) ?? 0), String(outByCategory.get(cat) ?? 0)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: `\n— Generado por VetSystem —`, style: 'subtext', alignment: 'center', margin: [0, 24, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  }
}
