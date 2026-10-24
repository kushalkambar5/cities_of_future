"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChallanPdf = generateChallanPdf;
exports.createAndUploadChallanPdf = createAndUploadChallanPdf;
const pdf_lib_1 = require("pdf-lib");
const r2_service_js_1 = require("./r2.service.js");
async function generateChallanPdf(data) {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 portrait in points
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    // Colors
    const darkNavy = (0, pdf_lib_1.rgb)(0.08, 0.12, 0.22);
    const primaryBlue = (0, pdf_lib_1.rgb)(0.12, 0.42, 0.72);
    const accentRed = (0, pdf_lib_1.rgb)(0.85, 0.15, 0.15);
    const grayText = (0, pdf_lib_1.rgb)(0.35, 0.38, 0.42);
    const borderLight = (0, pdf_lib_1.rgb)(0.85, 0.88, 0.92);
    const bgCard = (0, pdf_lib_1.rgb)(0.97, 0.98, 0.99);
    // Outer border
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderWidth: 1.5,
        borderColor: darkNavy,
    });
    // Top header banner
    page.drawRectangle({
        x: 20,
        y: height - 110,
        width: width - 40,
        height: 90,
        color: darkNavy,
    });
    page.drawText('GOVERNMENT OF NAVANAGAR', {
        x: 35,
        y: height - 55,
        size: 16,
        font: fontBold,
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
    });
    page.drawText('DIRECTORATE OF SMART TRAFFIC MANAGEMENT & ENFORCEMENT', {
        x: 35,
        y: height - 73,
        size: 10,
        font: fontRegular,
        color: (0, pdf_lib_1.rgb)(0.75, 0.85, 0.95),
    });
    page.drawText('OFFICIAL E-CHALLAN / TRAFFIC VIOLATION NOTICE', {
        x: 35,
        y: height - 95,
        size: 11,
        font: fontBold,
        color: (0, pdf_lib_1.rgb)(0.95, 0.85, 0.4),
    });
    // Challan Summary Strip
    let curY = height - 145;
    page.drawRectangle({
        x: 35,
        y: curY - 30,
        width: width - 70,
        height: 48,
        color: bgCard,
        borderColor: borderLight,
        borderWidth: 1,
    });
    page.drawText('CHALLAN NO:', { x: 50, y: curY, size: 9, font: fontBold, color: grayText });
    page.drawText(data.challanNumber, { x: 50, y: curY - 18, size: 12, font: fontBold, color: darkNavy });
    page.drawText('ISSUE DATE & TIME:', { x: 230, y: curY, size: 9, font: fontBold, color: grayText });
    page.drawText(data.timestamp, { x: 230, y: curY - 18, size: 11, font: fontRegular, color: darkNavy });
    page.drawText('FINE AMOUNT:', { x: 430, y: curY, size: 9, font: fontBold, color: grayText });
    page.drawText(`INR ${data.fineAmount.toFixed(2)}`, { x: 430, y: curY - 18, size: 14, font: fontBold, color: accentRed });
    // Section 1: Vehicle & Owner Information
    curY -= 65;
    page.drawText('1. REGISTERED VEHICLE & OWNER PARTICULARS', {
        x: 35,
        y: curY,
        size: 11,
        font: fontBold,
        color: primaryBlue,
    });
    curY -= 10;
    page.drawLine({
        start: { x: 35, y: curY },
        end: { x: width - 35, y: curY },
        thickness: 1,
        color: primaryBlue,
    });
    curY -= 24;
    page.drawText('Registration Plate:', { x: 40, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.plateNumber, { x: 170, y: curY, size: 11, font: fontBold, color: darkNavy });
    page.drawText('Vehicle Type:', { x: 320, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.vehicleType || 'Motor Vehicle', { x: 420, y: curY, size: 10, font: fontRegular, color: darkNavy });
    curY -= 22;
    page.drawText('Registered Owner:', { x: 40, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.ownerName || 'Unregistered / Unknown', { x: 170, y: curY, size: 10, font: fontRegular, color: darkNavy });
    page.drawText('Mobile Contact:', { x: 320, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.ownerPhone || 'N/A', { x: 420, y: curY, size: 10, font: fontRegular, color: darkNavy });
    // Section 2: Violation & Evidence
    curY -= 35;
    page.drawText('2. VIOLATION & INCIDENT PARTICULARS', {
        x: 35,
        y: curY,
        size: 11,
        font: fontBold,
        color: primaryBlue,
    });
    curY -= 10;
    page.drawLine({
        start: { x: 35, y: curY },
        end: { x: width - 35, y: curY },
        thickness: 1,
        color: primaryBlue,
    });
    curY -= 24;
    page.drawText('Offense Committed:', { x: 40, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.violationType.toUpperCase(), { x: 170, y: curY, size: 11, font: fontBold, color: accentRed });
    page.drawText('Camera Sensor ID:', { x: 320, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.cameraId || 'CCTV-01', { x: 430, y: curY, size: 10, font: fontRegular, color: darkNavy });
    curY -= 22;
    page.drawText('Description:', { x: 40, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText(data.violationDescription || 'Traffic rule violation detected by Automated AI CCTV Surveillance', {
        x: 170,
        y: curY,
        size: 10,
        font: fontRegular,
        color: darkNavy,
    });
    // Section 3: Fine Assessment & Payment
    curY -= 35;
    page.drawText('3. STATUTORY PENALTY & PAYMENT DETAILS', {
        x: 35,
        y: curY,
        size: 11,
        font: fontBold,
        color: primaryBlue,
    });
    curY -= 10;
    page.drawLine({
        start: { x: 35, y: curY },
        end: { x: width - 35, y: curY },
        thickness: 1,
        color: primaryBlue,
    });
    curY -= 30;
    // Penalty Breakdown box
    page.drawRectangle({
        x: 35,
        y: curY - 50,
        width: width - 70,
        height: 70,
        color: bgCard,
        borderColor: borderLight,
        borderWidth: 1,
    });
    page.drawText('Violation Description', { x: 50, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText('Status', { x: 330, y: curY, size: 10, font: fontBold, color: darkNavy });
    page.drawText('Amount (INR)', { x: 450, y: curY, size: 10, font: fontBold, color: darkNavy });
    curY -= 22;
    page.drawText(data.violationType.replace(/_/g, ' '), { x: 50, y: curY, size: 10, font: fontRegular, color: darkNavy });
    page.drawText('UNPAID', { x: 330, y: curY, size: 10, font: fontBold, color: accentRed });
    page.drawText(`INR ${data.fineAmount.toFixed(2)}`, { x: 450, y: curY, size: 10, font: fontBold, color: darkNavy });
    // Notice & Legal advisory
    curY -= 65;
    page.drawText('IMPORTANT LEGAL INSTRUCTIONS:', { x: 35, y: curY, size: 10, font: fontBold, color: darkNavy });
    curY -= 16;
    const legalNotes = [
        '1. This is a computer-generated e-Challan based on high-precision AI computer vision enforcement.',
        '2. You are requested to clear the outstanding penalty within 15 calendar days of receipt.',
        '3. To pay the challan online or submit a dispute contestation, visit the Navanagar Citizen Portal.',
        '4. Failure to clear fines may result in registration blocking or referral to the Virtual Traffic Court.',
    ];
    for (const note of legalNotes) {
        page.drawText(note, { x: 35, y: curY, size: 8.5, font: fontRegular, color: grayText });
        curY -= 14;
    }
    // Footer seal / signature block
    page.drawLine({
        start: { x: 35, y: 70 },
        end: { x: width - 35, y: 70 },
        thickness: 0.8,
        color: borderLight,
    });
    page.drawText('Navanagar Smart Mobility Enforcement Wing | Digitally Authenticated Document', {
        x: 35,
        y: 50,
        size: 8,
        font: fontRegular,
        color: grayText,
    });
    page.drawText('Official Seal: VERIFIED BY NAVANAGAR AI ENGINE', {
        x: 330,
        y: 50,
        size: 8,
        font: fontBold,
        color: primaryBlue,
    });
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
async function createAndUploadChallanPdf(data) {
    const pdfBuffer = await generateChallanPdf(data);
    const key = `challans/challan_${data.challanNumber}_${data.plateNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const uploadResult = await (0, r2_service_js_1.uploadToR2)(pdfBuffer, key, 'application/pdf');
    return {
        key: uploadResult.key,
        publicUrl: uploadResult.publicUrl,
        buffer: pdfBuffer,
    };
}
